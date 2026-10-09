package bridgeauth

import (
	"testing"
	"time"
)

// fast unit; purpose: bind delegated identity to app/request, not owner cookie.
// Defect: forged, expired, replayed-to-other-request identity. Expected <1s/max5s.
func TestIdentityBindsUserAppMethodAndPath(t *testing.T) {
	now := time.Unix(1700000000, 0)
	c := Claims{AppID: "app", UserID: "oleg", Email: "oleg@example.com", Role: "admin", Host: "app.airlock.example", Method: "POST", URI: "/admin/settings", Expires: now.Add(30 * time.Second).Unix()}
	assertion, err := Sign(c, "fixture-secret")
	if err != nil {
		t.Fatal(err)
	}
	got, err := Verify(assertion, "fixture-secret", now, "app", "POST", "/admin/settings")
	if err != nil || got.UserID != "oleg" {
		t.Fatal("valid identity was lost")
	}
	for _, test := range []struct {
		key, app, method, uri string
		when                  time.Time
	}{
		{"wrong", "app", "POST", "/admin/settings", now},
		{"fixture-secret", "other", "POST", "/admin/settings", now},
		{"fixture-secret", "app", "GET", "/admin/settings", now},
		{"fixture-secret", "app", "POST", "/admin/other", now},
		{"fixture-secret", "app", "POST", "/admin/settings", now.Add(time.Minute)},
	} {
		if _, err := Verify(assertion, test.key, test.when, test.app, test.method, test.uri); err == nil {
			t.Fatal("invalid delegation accepted")
		}
	}
}
