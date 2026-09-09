package hub

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const nodePeerHopHeader = "X-Gptadmin-Node-Hop"

func newNodePeerClient(timeout time.Duration) *http.Client {
	if timeout < 20*time.Second {
		timeout = 20 * time.Second
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	return &http.Client{Transport: transport, Timeout: timeout,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
}

// Routes are operator configuration, never caller-selected URLs. They confer
// no authority: the destination must independently accept the original bearer.
func parseNodePeers(raw string) (map[string]string, error) {
	peers := map[string]string{}
	if strings.TrimSpace(raw) == "" {
		return peers, nil
	}
	if err := json.Unmarshal([]byte(raw), &peers); err != nil || peers == nil {
		return nil, fmt.Errorf("GPTADMIN_NODE_PEERS must be a JSON object of shell targets and origins")
	}
	for target, origin := range peers {
		name := strings.TrimPrefix(target, "shell:")
		if !strings.HasPrefix(target, "shell:") || name == "" || name != canonicalShellQueueName(name) || strings.ContainsAny(name, "/\\") {
			return nil, fmt.Errorf("invalid node peer target %q", target)
		}
		u, err := url.Parse(origin)
		if err != nil || u.Hostname() == "" || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" || (u.Path != "" && u.Path != "/") || u.Opaque != "" {
			return nil, fmt.Errorf("node peer %q requires an http(s) origin without credentials, path, query or fragment", target)
		}
		peers[target] = strings.TrimSuffix(origin, "/")
	}
	return peers, nil
}

// forwardNodePeerCall runs before any local enqueue/idempotency reservation.
// Receipts remain at the destination. A failed delivery is not retried here:
// the caller can inspect/retry the SAME key directly at the explicit owner.
func (s *Server) forwardNodePeerCall(w http.ResponseWriter, r *http.Request, target string, body []byte) bool {
	return s.forwardNodePeerRequest(w, r, target, body, "/mcp-relay/call")
}

// Both consumer protocols use this transport; each destination keeps its own
// admission, approval and queue path. MCP is never converted to a CTL call.
func (s *Server) forwardNodePeerRequest(w http.ResponseWriter, r *http.Request, target string, body []byte, endpoint string) bool {
	target = strings.TrimSpace(target)
	origin, routed := s.nodePeers[target]
	fail := func(status int, detail string, unknown bool) {
		payload := map[string]any{"detail": detail, "owner_target": target, "owner_endpoint": origin}
		if unknown {
			payload["outcome"] = "unknown"
			payload["retry_policy"] = "inspect owner or retry the same idempotency_key at owner; never replay elsewhere"
		}
		if endpoint == "/mcp" {
			var envelope map[string]json.RawMessage
			_ = json.Unmarshal(body, &envelope)
			writeJSON(w, status, map[string]any{"jsonrpc": "2.0", "id": envelope["id"],
				"error": map[string]any{"code": -32000, "message": detail, "data": payload}})
		} else {
			writeJSON(w, status, payload)
		}
	}
	if s.nodePeersErr != nil {
		fail(http.StatusServiceUnavailable, "invalid node peer configuration", false)
		return true
	}
	s.mu.Lock()
	local := s.localExecutors[target] != nil
	s.mu.Unlock()
	// A static route can never replace the process's pinned local executor.
	if local {
		return false
	}
	if r.Header.Get(nodePeerHopHeader) != "" {
		fail(http.StatusLoopDetected, "peer destination does not own the requested local executor", false)
		return true
	}
	if !routed {
		return false
	}
	if r.Header.Get("Authorization") == "" {
		fail(http.StatusUnauthorized, "node peer calls require the original bearer credential", false)
		return true
	}
	failure := func(detail string) {
		fail(http.StatusBadGateway, detail, true)
	}
	upstream, err := http.NewRequestWithContext(r.Context(), http.MethodPost, origin+endpoint, bytes.NewReader(body))
	if err != nil {
		failure("cannot construct node peer request")
		return true
	}
	upstream.Header.Set("Authorization", r.Header.Get("Authorization"))
	upstream.Header.Set("Content-Type", "application/json")
	upstream.Header.Set(nodePeerHopHeader, "1")
	if endpoint == "/mcp" {
		for _, name := range []string{"Accept", "MCP-Protocol-Version", "Mcp-Method", "Mcp-Name"} {
			if value := r.Header.Get(name); value != "" {
				upstream.Header.Set(name, value)
			}
		}
	}
	// Keep pooled connections, but never make this nonempty POST replayable.
	// Go's HTTP/1 shouldRetryRequest/isReplayable and HTTP/2 shouldRetryRequest
	// refuse replay after body delivery when GetBody is nil. Do not copy HTTP
	// Idempotency-Key headers; application deduplication lives only at the owner.
	upstream.GetBody = nil
	// The owner reauthorizes; the ingress must not hold auth sync during delivery.
	releaseAuthAdmission(r)
	response, err := s.nodePeerClient.Do(upstream)
	if err != nil {
		failure("node peer delivery failed; execution outcome may be unknown")
		return true
	}
	defer response.Body.Close()
	if response.StatusCode >= 300 && response.StatusCode < 400 {
		failure("node peer redirects are forbidden")
		return true
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, (64<<20)+1))
	if err != nil || len(data) > 64<<20 {
		failure("node peer receipt could not be read; execution outcome may be unknown")
		return true
	}
	var receipt map[string]json.RawMessage
	if err := json.Unmarshal(data, &receipt); err != nil || receipt == nil {
		failure("node peer returned an invalid receipt; execution outcome may be unknown")
		return true
	}
	receipt["owner_target"], _ = json.Marshal(target)
	receipt["owner_endpoint"], _ = json.Marshal(origin)
	if endpoint == "/mcp" && receipt["result"] != nil {
		var result map[string]json.RawMessage
		if json.Unmarshal(receipt["result"], &result) == nil && result != nil {
			meta := map[string]json.RawMessage{}
			_ = json.Unmarshal(result["_meta"], &meta)
			if meta == nil {
				meta = map[string]json.RawMessage{}
			}
			meta["owner_target"] = receipt["owner_target"]
			meta["owner_endpoint"] = receipt["owner_endpoint"]
			result["_meta"], _ = json.Marshal(meta)
			receipt["result"], _ = json.Marshal(result)
		}
	}
	for _, name := range []string{"WWW-Authenticate", "MCP-Protocol-Version"} {
		if value := response.Header.Get(name); value != "" {
			w.Header().Set(name, value)
		}
	}
	writeJSON(w, response.StatusCode, receipt)
	return true
}
