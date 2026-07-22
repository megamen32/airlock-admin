package hub

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

type proxyTestClock struct {
	mu  sync.Mutex
	now time.Time
}

func (c *proxyTestClock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

func (c *proxyTestClock) Advance(d time.Duration) {
	c.mu.Lock()
	c.now = c.now.Add(d)
	c.mu.Unlock()
}

func testNetworkProxyPolicy() NetworkProxyPolicy {
	policy, err := networkProxyPolicyFromArgs(map[string]any{
		"scope":        "lan",
		"agent_id":     "shell:proxy-1",
		"mode":         "pull",
		"target_cidrs": []string{"10.20.0.0/24"},
		"target_ports": []int{443},
		"max_streams":  2,
		"max_bytes":    1 << 20,
		"lease":        time.Minute,
	})
	if err != nil {
		panic(err)
	}
	return policy
}

func newNetworkProxyTestServer(t *testing.T, clock *proxyTestClock) *Server {
	t.Helper()
	dir := t.TempDir()
	s := New(Config{
		ConfigDir:             dir,
		CtlToken:              "control-token",
		OAuthClientSecret:     "network-proxy-test-secret",
		PublicOrigin:          "https://hub.example",
		MCPResource:           "https://hub.example",
		Now:                   clock.Now,
		NetworkProxyStateFile: filepath.Join(dir, "network_proxy_state.json"),
	})
	s.mu.Lock()
	for _, profileID := range []string{"proxy-profile", "other-profile"} {
		s.accessProfiles[profileID] = AccessProfile{
			ID:             profileID,
			Name:           profileID,
			AccessMode:     accessModeFull,
			AllowedTargets: []string{"hub", "shell:proxy-1"},
			AllowedTools:   []string{"network_proxy_request", "network_proxy_approve", "network_proxy_issue", "network_proxy_status", "network_proxy_revoke"},
			Version:        1,
			UpdatedAt:      clock.Now(),
		}
	}
	s.agents["shell:proxy-1"] = &Agent{
		AgentID: "shell:proxy-1",
		Name:    "proxy-1",
		Status:  "stale",
		Meta:    map[string]any{"approved": true},
	}
	s.mu.Unlock()
	return s
}

func networkProxyMCPToken(t *testing.T, s *Server, profileID string) string {
	t.Helper()
	token, err := s.signJWT(map[string]any{
		"sub":        "network-proxy-test",
		"aud":        "https://hub.example",
		"resource":   "https://hub.example",
		"scope":      "gptadmin.exec",
		"profile_id": profileID,
		"exp":        time.Now().Add(time.Hour).Unix(),
	})
	if err != nil {
		t.Fatalf("sign JWT: %v", err)
	}
	return token
}

func networkProxyMCPCall(t *testing.T, s *Server, profileID, toolName string, arguments map[string]any) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(map[string]any{"target": "hub", "tool_name": toolName, "arguments": arguments})
	if err != nil {
		t.Fatalf("marshal MCP call: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/mcp-relay/call", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+networkProxyMCPToken(t, s, profileID))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	return rec
}

func proxyControlRequest(t *testing.T, s *Server, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var encoded []byte
	if body != nil {
		var err error
		encoded, err = json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal request: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(encoded))
	req.Header.Set("Authorization", "Bearer control-token")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	return rec
}

func requestProxyCapabilityHTTP(t *testing.T, s *Server, policy NetworkProxyPolicy) NetworkProxyCapability {
	t.Helper()
	rec := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/request", map[string]any{
		"profile_id": "proxy-profile",
		"policy":     policy,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("request status=%d body=%s", rec.Code, rec.Body.String())
	}
	var response struct {
		Capability NetworkProxyCapability `json:"capability"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode request response: %v", err)
	}
	return response.Capability
}

func approveProxyCapabilityHTTP(t *testing.T, s *Server, capabilityID string) NetworkProxyCapability {
	t.Helper()
	rec := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/approve", map[string]any{"capability_id": capabilityID})
	if rec.Code != http.StatusOK {
		t.Fatalf("approve status=%d body=%s", rec.Code, rec.Body.String())
	}
	var response struct {
		Capability NetworkProxyCapability `json:"capability"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode approve response: %v", err)
	}
	return response.Capability
}

func TestNetworkProxyScopesAreExplicitAndIsolateDestinations(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	controller, err := NewNetworkProxyController("", clock.Now, nil)
	if err != nil {
		t.Fatalf("NewNetworkProxyController: %v", err)
	}

	missingScope := testNetworkProxyPolicy()
	missingScopeJSON, err := json.Marshal(missingScope)
	if err != nil {
		t.Fatalf("marshal policy: %v", err)
	}
	var missingScopeArgs map[string]any
	if err := json.Unmarshal(missingScopeJSON, &missingScopeArgs); err != nil {
		t.Fatalf("decode policy: %v", err)
	}
	delete(missingScopeArgs, "scope")
	missingScope, err = networkProxyPolicyFromArgs(missingScopeArgs)
	if err != nil {
		t.Fatalf("decode missing-scope policy: %v", err)
	}
	if _, err := controller.Request("proxy-profile", missingScope); err != ErrNetworkProxyInvalid {
		t.Fatalf("missing scope error=%v, want %v", err, ErrNetworkProxyInvalid)
	}

	lanPublic, err := networkProxyPolicyFromArgs(map[string]any{
		"scope": "lan", "agent_id": "shell:proxy-1", "mode": "pull",
		"target_cidrs": []string{"8.8.8.0/24"}, "target_ports": []int{443},
		"max_streams": 2, "max_bytes": 1 << 20, "lease": time.Minute,
	})
	if err != nil {
		t.Fatalf("decode LAN policy: %v", err)
	}
	if _, err := controller.Request("proxy-profile", lanPublic); err != ErrNetworkProxyInvalid {
		t.Fatalf("public LAN CIDR error=%v, want %v", err, ErrNetworkProxyInvalid)
	}

	lan, err := controller.Request("proxy-profile", testNetworkProxyPolicy())
	if err != nil {
		t.Fatalf("request LAN capability: %v", err)
	}
	if _, err := controller.Approve(lan.CapabilityID); err != nil {
		t.Fatalf("approve LAN capability: %v", err)
	}
	if _, _, err := controller.IssueStreamGrants(lan.CapabilityID, "10.20.0.255:443"); err != ErrNetworkProxyTargetDenied {
		t.Fatalf("LAN broadcast error=%v, want %v", err, ErrNetworkProxyTargetDenied)
	}

	internetPolicy, err := networkProxyPolicyFromArgs(map[string]any{
		"scope": "internet_egress", "agent_id": "shell:proxy-1", "mode": "pull",
		"target_cidrs": []string{"0.0.0.0/0"}, "target_ports": []int{443},
		"max_streams": 2, "max_bytes": 1 << 20, "lease": time.Minute,
	})
	if err != nil {
		t.Fatalf("decode internet policy: %v", err)
	}
	internet, err := controller.Request("proxy-profile", internetPolicy)
	if err != nil {
		t.Fatalf("request internet capability: %v", err)
	}
	if _, err := controller.Approve(internet.CapabilityID); err != nil {
		t.Fatalf("approve internet capability: %v", err)
	}
	for _, target := range []string{
		"10.0.0.1:443",
		"127.0.0.1:443",
		"169.254.169.254:443",
		"100.100.100.200:443",
		"224.0.0.1:443",
		"255.255.255.255:443",
	} {
		if _, _, err := controller.IssueStreamGrants(internet.CapabilityID, target); err != ErrNetworkProxyTargetDenied {
			t.Errorf("internet target %s error=%v, want %v", target, err, ErrNetworkProxyTargetDenied)
		}
	}
	if _, _, err := controller.IssueStreamGrants(internet.CapabilityID, "8.8.8.8:443"); err != nil {
		t.Fatalf("public internet target denied: %v", err)
	}
}

func TestNetworkProxyMCPDeniesCrossProfileCapabilityOperations(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	policy := testNetworkProxyPolicy()

	t.Run("request", func(t *testing.T) {
		rec := networkProxyMCPCall(t, s, "proxy-profile", "network_proxy_request", map[string]any{
			"profile_id": "other-profile",
			"policy":     policy,
		})
		if rec.Code != http.StatusForbidden {
			t.Fatalf("cross-profile request status=%d body=%s", rec.Code, rec.Body.String())
		}
	})

	for _, toolName := range []string{"network_proxy_approve", "network_proxy_status", "network_proxy_revoke"} {
		t.Run(toolName, func(t *testing.T) {
			capability, err := s.requestNetworkProxyCapability("proxy-profile", policy)
			if err != nil {
				t.Fatalf("request capability: %v", err)
			}
			rec := networkProxyMCPCall(t, s, "other-profile", toolName, map[string]any{"capability_id": capability.CapabilityID})
			if rec.Code != http.StatusForbidden {
				t.Fatalf("cross-profile %s status=%d body=%s", toolName, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestNetworkProxyApprovalRevalidatesProfileAndAgent(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}

	t.Run("profile permissions", func(t *testing.T) {
		s := newNetworkProxyTestServer(t, clock)
		capability, err := s.requestNetworkProxyCapability("proxy-profile", testNetworkProxyPolicy())
		if err != nil {
			t.Fatalf("request capability: %v", err)
		}
		s.mu.Lock()
		profile := s.accessProfiles["proxy-profile"]
		profile.AllowedTargets = []string{"hub"}
		s.accessProfiles["proxy-profile"] = profile
		s.mu.Unlock()
		if _, err := s.approveNetworkProxyCapability(capability.CapabilityID); err != ErrNetworkProxyUnauthorized {
			t.Fatalf("approve after profile restriction error=%v, want %v", err, ErrNetworkProxyUnauthorized)
		}
	})

	t.Run("approved agent", func(t *testing.T) {
		s := newNetworkProxyTestServer(t, clock)
		capability, err := s.requestNetworkProxyCapability("proxy-profile", testNetworkProxyPolicy())
		if err != nil {
			t.Fatalf("request capability: %v", err)
		}
		s.mu.Lock()
		s.agents["shell:proxy-1"].Meta["approved"] = false
		s.mu.Unlock()
		if _, err := s.approveNetworkProxyCapability(capability.CapabilityID); err != ErrNetworkProxyUnauthorized {
			t.Fatalf("approve after agent removal error=%v, want %v", err, ErrNetworkProxyUnauthorized)
		}
	})
}

func TestNetworkProxyIssueOffersAuthenticatedRoleBoundOneTimeGrants(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	capability := requestProxyCapabilityHTTP(t, s, testNetworkProxyPolicy())
	approveProxyCapabilityHTTP(t, s, capability.CapabilityID)

	rec := networkProxyMCPCall(t, s, "proxy-profile", "network_proxy_issue", map[string]any{
		"capability_id": capability.CapabilityID,
		"target":        "10.20.0.8:443",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("issue status=%d body=%s", rec.Code, rec.Body.String())
	}
	var response struct {
		Response struct {
			ClientGrant ProxyStreamGrant `json:"client_grant"`
			AgentGrant  ProxyStreamGrant `json:"agent_grant"`
		} `json:"response"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode issue response: %v", err)
	}
	clientGrant := response.Response.ClientGrant
	agentGrant := response.Response.AgentGrant
	if clientGrant.Token == "" || agentGrant.Token == "" || clientGrant.Role != "client" || agentGrant.Role != "agent" {
		t.Fatalf("invalid role-bound grants: client=%+v agent=%+v", clientGrant, agentGrant)
	}
	if clientGrant.StreamID == "" || clientGrant.StreamID != agentGrant.StreamID || clientGrant.Target != "10.20.0.8:443" || agentGrant.Target != clientGrant.Target {
		t.Fatalf("grants lost stream/target binding: client=%+v agent=%+v", clientGrant, agentGrant)
	}

	for _, grant := range []ProxyStreamGrant{clientGrant, agentGrant} {
		if _, err := s.networkProxy.Open(grant.Token, grant.Role); err != nil {
			t.Fatalf("first %s open: %v", grant.Role, err)
		}
		if _, err := s.networkProxy.Open(grant.Token, grant.Role); err != ErrNetworkProxyGrantUsed {
			t.Fatalf("replayed %s grant error=%v, want %v", grant.Role, err, ErrNetworkProxyGrantUsed)
		}
	}

	other := networkProxyMCPCall(t, s, "other-profile", "network_proxy_issue", map[string]any{
		"capability_id": capability.CapabilityID,
		"target":        "10.20.0.9:443",
	})
	if other.Code != http.StatusForbidden {
		t.Fatalf("cross-profile issue status=%d body=%s", other.Code, other.Body.String())
	}

	s.mu.Lock()
	auditJSON, err := json.Marshal(s.audit)
	s.mu.Unlock()
	if err != nil {
		t.Fatalf("marshal audit: %v", err)
	}
	auditText := string(auditJSON)
	for _, secret := range []string{clientGrant.Token, agentGrant.Token, clientGrant.Target} {
		if strings.Contains(auditText, secret) {
			t.Fatalf("audit leaked issued grant material %q: %s", secret, auditText)
		}
	}
}

func TestNetworkProxyOpenAPIDocumentsControlContract(t *testing.T) {
	b, err := os.ReadFile(filepath.Join("..", "..", "..", "public", "openapi.yaml"))
	if err != nil {
		t.Fatalf("read public/openapi.yaml: %v", err)
	}
	doc := string(b)
	for _, required := range []string{
		"/proxy-control/v1/request:",
		"/proxy-control/v1/approve:",
		"/proxy-control/v1/issue:",
		"/proxy-control/v1/open:",
		"/proxy-control/v1/status:",
		"/proxy-control/v1/revoke:",
		"NetworkProxyPolicy:",
		"ProxyStreamGrant:",
	} {
		if !strings.Contains(doc, required) {
			t.Errorf("public/openapi.yaml missing %q", required)
		}
	}
}

func TestNetworkProxyRequestDeniesUnauthorizedProfileHTTP(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	s.mu.Lock()
	profile := s.accessProfiles["proxy-profile"]
	profile.AllowedTools = []string{"status"}
	s.accessProfiles[profile.ID] = profile
	s.mu.Unlock()

	rec := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/request", map[string]any{
		"profile_id": "proxy-profile",
		"policy":     testNetworkProxyPolicy(),
	})
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
}

func TestNetworkProxyRequestDeniesUnapprovedAgentHTTP(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	s.mu.Lock()
	s.agents["shell:proxy-1"].Meta["approved"] = false
	s.mu.Unlock()

	rec := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/request", map[string]any{
		"profile_id": "proxy-profile",
		"policy":     testNetworkProxyPolicy(),
	})
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
}

func TestNetworkProxyExpiredCapabilityCannotIssueGrants(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	capability := requestProxyCapabilityHTTP(t, s, testNetworkProxyPolicy())
	approveProxyCapabilityHTTP(t, s, capability.CapabilityID)
	clock.Advance(2 * time.Minute)

	_, _, err := s.networkProxy.IssueStreamGrants(capability.CapabilityID, "10.20.0.8:443")
	if err != ErrNetworkProxyExpired {
		t.Fatalf("IssueStreamGrants error=%v, want %v", err, ErrNetworkProxyExpired)
	}

	rec := proxyControlRequest(t, s, http.MethodGet, "/proxy-control/v1/status?capability_id="+capability.CapabilityID, nil)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), `"state":"expired"`) {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
}

func TestNetworkProxyRejectsTargetOutsideCIDRAndPort(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	controller, err := NewNetworkProxyController("", clock.Now, nil)
	if err != nil {
		t.Fatalf("NewNetworkProxyController: %v", err)
	}
	capability, err := controller.Request("proxy-profile", testNetworkProxyPolicy())
	if err != nil {
		t.Fatalf("Request: %v", err)
	}
	if _, err := controller.Approve(capability.CapabilityID); err != nil {
		t.Fatalf("Approve: %v", err)
	}

	if _, _, err := controller.IssueStreamGrants(capability.CapabilityID, "10.21.0.8:443"); err != ErrNetworkProxyTargetDenied {
		t.Fatalf("outside CIDR error=%v, want %v", err, ErrNetworkProxyTargetDenied)
	}
	if _, _, err := controller.IssueStreamGrants(capability.CapabilityID, "10.20.0.8:80"); err != ErrNetworkProxyTargetDenied {
		t.Fatalf("outside port error=%v, want %v", err, ErrNetworkProxyTargetDenied)
	}
}

func TestNetworkProxyOpenRejectsWrongRoleAndReusedJTIHTTP(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	capability := requestProxyCapabilityHTTP(t, s, testNetworkProxyPolicy())
	approveProxyCapabilityHTTP(t, s, capability.CapabilityID)
	clientGrant, _, err := s.networkProxy.IssueStreamGrants(capability.CapabilityID, "10.20.0.8:443")
	if err != nil {
		t.Fatalf("IssueStreamGrants: %v", err)
	}

	wrongRole := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/open", map[string]any{
		"token": clientGrant.Token,
		"role":  "agent",
	})
	if wrongRole.Code != http.StatusForbidden {
		t.Fatalf("wrong role status=%d body=%s", wrongRole.Code, wrongRole.Body.String())
	}

	opened := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/open", map[string]any{
		"token": clientGrant.Token,
		"role":  "client",
	})
	if opened.Code != http.StatusOK {
		t.Fatalf("open status=%d body=%s", opened.Code, opened.Body.String())
	}
	if strings.Contains(opened.Body.String(), clientGrant.Token) || strings.Contains(opened.Body.String(), "10.20.0.8:443") {
		t.Fatalf("open response leaked grant material: %s", opened.Body.String())
	}

	reused := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/open", map[string]any{
		"token": clientGrant.Token,
		"role":  "client",
	})
	if reused.Code != http.StatusConflict {
		t.Fatalf("reused status=%d body=%s", reused.Code, reused.Body.String())
	}
}

func TestNetworkProxyRevokeIsIdempotentAndSignalsOnce(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	var mu sync.Mutex
	var signals []string
	controller, err := NewNetworkProxyController("", clock.Now, func(capabilityID string) {
		mu.Lock()
		signals = append(signals, capabilityID)
		mu.Unlock()
	})
	if err != nil {
		t.Fatalf("NewNetworkProxyController: %v", err)
	}
	capability, err := controller.Request("proxy-profile", testNetworkProxyPolicy())
	if err != nil {
		t.Fatalf("Request: %v", err)
	}
	if _, err := controller.Approve(capability.CapabilityID); err != nil {
		t.Fatalf("Approve: %v", err)
	}

	first, err := controller.Revoke(capability.CapabilityID)
	if err != nil {
		t.Fatalf("first Revoke: %v", err)
	}
	second, err := controller.Revoke(capability.CapabilityID)
	if err != nil {
		t.Fatalf("second Revoke: %v", err)
	}
	if first.State != "draining" || second.State != "draining" {
		t.Fatalf("states=%q,%q, want draining", first.State, second.State)
	}
	mu.Lock()
	defer mu.Unlock()
	if len(signals) != 1 || signals[0] != capability.CapabilityID {
		t.Fatalf("signals=%v, want one capability signal", signals)
	}
}

func TestNetworkProxyRestartDoesNotResurrectActiveCapability(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	statePath := filepath.Join(t.TempDir(), "network_proxy_state.json")
	controller, err := NewNetworkProxyController(statePath, clock.Now, nil)
	if err != nil {
		t.Fatalf("NewNetworkProxyController: %v", err)
	}
	capability, err := controller.Request("proxy-profile", testNetworkProxyPolicy())
	if err != nil {
		t.Fatalf("Request: %v", err)
	}
	if _, err := controller.Approve(capability.CapabilityID); err != nil {
		t.Fatalf("Approve: %v", err)
	}

	restarted, err := NewNetworkProxyController(statePath, clock.Now, nil)
	if err != nil {
		t.Fatalf("restart NewNetworkProxyController: %v", err)
	}
	status, err := restarted.Status(capability.CapabilityID)
	if err != nil {
		t.Fatalf("Status: %v", err)
	}
	if status.State != "expired" {
		t.Fatalf("restart state=%q, want expired", status.State)
	}
	if _, _, err := restarted.IssueStreamGrants(capability.CapabilityID, "10.20.0.8:443"); err != ErrNetworkProxyExpired {
		t.Fatalf("restart IssueStreamGrants error=%v, want %v", err, ErrNetworkProxyExpired)
	}
}

func TestNetworkProxyAuditOmitsTokensAndTargets(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	capability := requestProxyCapabilityHTTP(t, s, testNetworkProxyPolicy())
	approveProxyCapabilityHTTP(t, s, capability.CapabilityID)
	clientGrant, _, err := s.networkProxy.IssueStreamGrants(capability.CapabilityID, "10.20.0.8:443")
	if err != nil {
		t.Fatalf("IssueStreamGrants: %v", err)
	}
	rec := proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/open", map[string]any{
		"token": clientGrant.Token,
		"role":  clientGrant.Role,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("open status=%d body=%s", rec.Code, rec.Body.String())
	}

	s.mu.Lock()
	auditJSON, err := json.Marshal(s.audit)
	s.mu.Unlock()
	if err != nil {
		t.Fatalf("marshal audit: %v", err)
	}
	auditText := string(auditJSON)
	if strings.Contains(auditText, clientGrant.Token) || strings.Contains(auditText, "10.20.0.8:443") {
		t.Fatalf("audit leaked token or target: %s", auditText)
	}
}

func TestNetworkProxyControlDoesNotTouchCommandQueuesOrHeartbeat(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	s := newNetworkProxyTestServer(t, clock)
	capability := requestProxyCapabilityHTTP(t, s, testNetworkProxyPolicy())
	approveProxyCapabilityHTTP(t, s, capability.CapabilityID)
	proxyControlRequest(t, s, http.MethodPost, "/proxy-control/v1/revoke", map[string]any{"capability_id": capability.CapabilityID})

	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.relayJobs) != 0 || len(s.relayQueues) != 0 || len(s.shellJobs) != 0 || len(s.shellQueues) != 0 {
		t.Fatalf("proxy control touched command state: relay_jobs=%d relay_queues=%d shell_jobs=%d shell_queues=%d", len(s.relayJobs), len(s.relayQueues), len(s.shellJobs), len(s.shellQueues))
	}
	if got := s.agents["shell:proxy-1"].LastSeen; got != 0 {
		t.Fatalf("proxy control reused heartbeat liveness: last_seen=%v", got)
	}
}

func TestNetworkProxyHubToolSchemasAreRegistered(t *testing.T) {
	want := map[string]bool{
		"network_proxy_request": false,
		"network_proxy_approve": false,
		"network_proxy_open":    false,
		"network_proxy_status":  false,
		"network_proxy_revoke":  false,
	}
	for _, tool := range hubTools() {
		name, _ := tool["name"].(string)
		if _, ok := want[name]; ok {
			want[name] = true
		}
	}
	for name, found := range want {
		if !found {
			t.Errorf("Hub tool %q is not registered", name)
		}
	}
}
