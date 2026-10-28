// UI gateway uses existing product auth seams after native Airlock admission.
package main

import (
	"agent/bridgeauth"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"
)

type targetConfig struct {
	AppID      string            `json:"app_id"`
	URL        string            `json:"url"`
	KeyFile    string            `json:"key_file"`
	Mode       string            `json:"mode"`
	Principals map[string]string `json:"principals"`
	UserTokens map[string]string `json:"user_token_files,omitempty"`
}
type gateway struct {
	budget     *runtimeBudget
	targets    map[string]targetConfig
	keys       map[string]string
	userTokens map[string]map[string]string
}

func (g *gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	part := strings.SplitN(strings.TrimPrefix(r.URL.Path, "/"), "/", 2)
	slug := part[0]
	cfg, ok := g.targets[slug]
	if !ok {
		http.NotFound(w, r)
		return
	}
	path := strings.TrimPrefix(r.URL.EscapedPath(), "/"+slug)
	if path == "" {
		path = "/"
	}
	uri := path
	if r.URL.RawQuery != "" {
		uri += "?" + r.URL.RawQuery
	}
	values := r.Header.Values(bridgeauth.Header)
	if len(values) != 1 {
		http.Error(w, "Authentication required", 401)
		return
	}
	claims, err := bridgeauth.Verify(values[0], g.keys[slug], time.Now(), cfg.AppID, r.Method, uri)
	if err != nil || claims.Host != slug+".airlock.bezrabotnyi.com" {
		http.Error(w, "Authentication required", 401)
		return
	}
	if expected, ok := cfg.Principals[claims.UserID]; !ok || !strings.EqualFold(expected, claims.Email) {
		http.Error(w, "Principal is not provisioned", 403)
		return
	}
	if cfg.Mode == "userio" && g.userTokens[slug][claims.UserID] == "" {
		http.Error(w, "Personal principal is not provisioned", 403)
		return
	}
	if g.budget != nil {
		if err := g.budget.ensure(r.Context(), cfg.AppID); err != nil {
			http.Error(w, "Runtime budget unavailable", 503)
			return
		}
	}
	if path == "/__airlock_budget" && r.Method == "POST" {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	target, err := url.Parse(cfg.URL)
	if err != nil {
		http.Error(w, "Service unavailable", 502)
		return
	}
	originalPath := r.URL.Path
	r.URL.Path = strings.TrimPrefix(originalPath, "/"+slug)
	if r.URL.Path == "" {
		r.URL.Path = "/"
	}
	if raw := r.URL.RawPath; raw != "" {
		r.URL.RawPath = strings.TrimPrefix(raw, "/"+slug)
	}
	proxy := &httputil.ReverseProxy{
		Rewrite: func(p *httputil.ProxyRequest) {
			p.SetURL(target)
			p.Out.Host = claims.Host
			p.SetXForwarded()
			p.Out.Header.Set("X-Forwarded-Host", claims.Host)
			p.Out.Header.Set("X-Forwarded-Proto", "https")
			for h := range p.Out.Header {
				lower := strings.ToLower(h)
				if strings.HasPrefix(lower, "x-airlock-") || strings.HasPrefix(lower, "x-notify-") || strings.HasPrefix(lower, "x-userio-") {
					p.Out.Header.Del(h)
				}
			}
			p.Out.Header.Del("Authorization")
			// Authentication comes exclusively from the signed principal; keep
			// CSRF/preferences/provider state cookies, never old login cookies.
			kept := []string{}
			for _, cookie := range p.Out.Cookies() {
				if cookie.Name == "gptadmin_auth" || cookie.Name == "gptadmin_admin_session" || cookie.Name == "userio_web_session" || cookie.Name == "userio_oauth_session" {
					continue
				}
				kept = append(kept, cookie.Name+"="+cookie.Value)
			}
			p.Out.Header.Del("Cookie")
			if len(kept) > 0 {
				p.Out.Header.Set("Cookie", strings.Join(kept, "; "))
			}
			p.Out.Header.Set("X-Authenticated-User-ID", claims.UserID)
			p.Out.Header.Set("X-Authenticated-User-Email", claims.Email)
			p.Out.Header.Set("X-Authenticated-Role", claims.Role)
			if cfg.Mode == "noticeplace" {
				p.Out.Header.Set("X-Notify-Admin", "1")
			}
			if cfg.Mode == "gptadmin" {
				p.Out.Header.Set("X-GPTAdmin-Airlock-Identity", values[0])
			}
			if cfg.Mode == "userio" {
				p.Out.Header.Set("Authorization", "Bearer "+g.userTokens[slug][claims.UserID])
			}
		},
		ModifyResponse: func(resp *http.Response) error {
			if loc := resp.Header.Get("Location"); loc != "" {
				if u, err := url.Parse(loc); err == nil && u.IsAbs() && u.Host == target.Host {
					u.Scheme = "https"
					u.Host = claims.Host
					resp.Header.Set("Location", u.String())
				}
			}
			return nil
		},
		FlushInterval: -1,
		ErrorHandler:  func(w http.ResponseWriter, _ *http.Request, _ error) { http.Error(w, "Service unavailable", 502) },
	}
	proxy.ServeHTTP(w, r)
}

func main() {
	file := os.Getenv("AIRLOCK_UI_GATEWAY_CONFIG")
	data, err := os.ReadFile(file)
	if err != nil {
		log.Fatal("UI gateway configuration unavailable")
	}
	g := &gateway{budget: newRuntimeBudget(), keys: map[string]string{}, userTokens: map[string]map[string]string{}}
	if json.Unmarshal(data, &g.targets) != nil {
		log.Fatal("Invalid UI gateway configuration")
	}
	for slug, c := range g.targets {
		key, err := os.ReadFile(c.KeyFile)
		if err != nil || len(strings.TrimSpace(string(key))) < 32 {
			log.Fatal("UI gateway credentials unavailable")
		}
		g.keys[slug] = strings.TrimSpace(string(key))
		if c.Mode == "userio" {
			g.userTokens[slug] = map[string]string{}
			for user, file := range c.UserTokens {
				token, err := os.ReadFile(file)
				if err != nil || len(strings.TrimSpace(string(token))) < 16 {
					log.Fatal("Personal UI credentials unavailable")
				}
				g.userTokens[slug][user] = strings.TrimSpace(string(token))
			}
		}
	}
	addr := os.Getenv("AIRLOCK_UI_GATEWAY_ADDR")
	if addr == "" {
		addr = "172.17.0.1:19419"
	}
	server := &http.Server{Addr: addr, Handler: g, ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 64 << 10}
	log.Fatal(server.ListenAndServe())
}
