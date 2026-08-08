package hub

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestProcessSecurityProfileIsExplicitAndPersistent(t *testing.T) {
	s := New(Config{ConfigDir: t.TempDir(), CtlToken: "ctl"})
	request := func(method, body string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, "/admin/api/security/profile", strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer ctl")
		if body != "" {
			req.Header.Set("Content-Type", "application/json")
		}
		w := httptest.NewRecorder()
		s.Handler().ServeHTTP(w, req)
		return w
	}

	initial := request(http.MethodGet, "")
	if initial.Code != http.StatusOK || !strings.Contains(initial.Body.String(), `"mode":"normal"`) {
		t.Fatalf("unexpected default profile: %d %s", initial.Code, initial.Body.String())
	}

	maximum := request(http.MethodPut, `{"mode":"maximum","no_new_privileges":true,"private_tmp":true,"protect_system":true,"protect_home":true,"allow_privileged_execution":false}`)
	if maximum.Code != http.StatusOK || !strings.Contains(maximum.Body.String(), `"mode":"maximum"`) {
		t.Fatalf("maximum profile rejected: %d %s", maximum.Code, maximum.Body.String())
	}

	invalid := request(http.MethodPut, `{"mode":"normal","no_new_privileges":true}`)
	if invalid.Code != http.StatusBadRequest {
		t.Fatalf("invalid normal profile accepted: %d %s", invalid.Code, invalid.Body.String())
	}

	restarted := New(Config{ConfigDir: s.cfg.ConfigDir, CtlToken: "ctl"})
	if restarted.securitySnapshot().Process.Mode != processSecurityMaximum {
		t.Fatalf("profile did not persist: %#v", restarted.securitySnapshot().Process)
	}
}
