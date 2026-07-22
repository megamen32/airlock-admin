package hub

import (
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestNetworkProxyIssuesRelayCompatibleRoleTicketsWhenKeyConfigured(t *testing.T) {
	clock := &proxyTestClock{now: time.Date(2026, 7, 22, 12, 0, 0, 0, time.UTC)}
	controller, err := NewNetworkProxyController("", clock.Now, nil)
	if err != nil {
		t.Fatal(err)
	}
	controller.SetRelayKey([]byte("0123456789abcdef0123456789abcdef"))
	capability, err := controller.Request("proxy-profile", testNetworkProxyPolicy())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := controller.Approve(capability.CapabilityID); err != nil {
		t.Fatal(err)
	}
	client, agent, err := controller.IssueStreamGrants(capability.CapabilityID, "10.20.0.8:443")
	if err != nil {
		t.Fatal(err)
	}
	for _, grant := range []ProxyStreamGrant{client, agent} {
		parts := strings.Split(grant.Token, ".")
		if len(parts) != 3 || parts[0] != "gpr1" {
			t.Fatalf("token = %q, want gpr1 ticket", grant.Token)
		}
		payload, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			t.Fatal(err)
		}
		var claims map[string]any
		if err := json.Unmarshal(payload, &claims); err != nil {
			t.Fatal(err)
		}
		if claims["role"] != grant.Role || claims["target"] != grant.Target || claims["stream_id"] != grant.StreamID {
			t.Fatalf("claims = %#v, grant = %#v", claims, grant)
		}
	}
}
