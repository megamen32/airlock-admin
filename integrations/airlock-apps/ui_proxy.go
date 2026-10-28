package main

import (
	"agent/bridgeauth"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/airlockrun/agentsdk"
)

func (a *application) productUI(w http.ResponseWriter, r *http.Request) error {
	if _, err := requireAdmin(r.Context()); err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	user, _ := agentsdk.CallerFromContext(r.Context()).User()
	host := r.Header.Get("X-Forwarded-Host")
	if host == "" {
		host = r.Host
	}
	if host != a.config.Slug+".airlock.bezrabotnyi.com" {
		http.Error(w, "Некорректный адрес приложения", 403)
		return nil
	}
	if origin := r.Header.Get("Origin"); origin != "" {
		u, err := url.Parse(origin)
		if err != nil || u.Scheme != "https" || !strings.EqualFold(u.Host, host) {
			http.Error(w, "Запрос с другого сайта отклонён", 403)
			return nil
		}
	}
	key, err := a.uiKey.Get(r.Context())
	if err != nil || key == "" {
		http.Error(w, "Подключение интерфейса пока не настроено", 503)
		return nil
	}
	target, err := url.Parse(a.config.UIURL)
	if err != nil || target.Host == "" {
		http.Error(w, "Не настроен адрес интерфейса", 503)
		return nil
	}
	assertion, err := bridgeauth.Sign(bridgeauth.Claims{AppID: a.config.AgentID, UserID: user.ID, Email: user.Email, Role: "admin", Host: host, Method: r.Method, URI: r.URL.RequestURI(), Expires: time.Now().Add(30 * time.Second).Unix()}, key)
	if err != nil {
		return err
	}
	proxy := &httputil.ReverseProxy{
		Rewrite: func(p *httputil.ProxyRequest) {
			p.SetURL(target)
			p.Out.Host = target.Host
			p.SetXForwarded()
			for h := range p.Out.Header {
				if strings.HasPrefix(strings.ToLower(h), "x-airlock-") {
					p.Out.Header.Del(h)
				}
			}
			p.Out.Header.Del("Authorization")
			p.Out.Header.Set(bridgeauth.Header, assertion)
		},
		FlushInterval: -1,
		ErrorHandler: func(w http.ResponseWriter, _ *http.Request, _ error) {
			http.Error(w, "Интерфейс сервиса временно недоступен", 502)
		},
	}
	proxy.ServeHTTP(w, r)
	return nil
}
