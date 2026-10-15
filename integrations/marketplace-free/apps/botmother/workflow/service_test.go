package workflow

import (
	"database/sql"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestReceiptRequiresExactAdmittedFormat(t *testing.T) {
	valid := `{"run_id":"7c1214ee-0ac1-4d31-b550-35db6ee39df1","scenario":"airlock-demo","order":"DEMO-001","result":"completed"}`
	if _, e := DecodeReceipt([]byte(valid)); e != nil {
		t.Fatal(e)
	}
	cases := []string{"", valid + `{}`, strings.Replace(valid, "completed", "accepted", 1), strings.Replace(valid, "DEMO-001", "OTHER", 1), strings.Replace(valid, "airlock-demo", "foreign", 1), strings.Replace(valid, "7c1214ee-0ac1-4d31-b550-35db6ee39df1", "00000000-0000-0000-0000-000000000000", 1), strings.Replace(valid, "7c1214ee", "7C1214EE", 1), strings.Replace(valid, "{", `{"extra":"x",`, 1), strings.Repeat(" ", 4097)}
	for i, v := range cases {
		if _, e := DecodeReceipt([]byte(v)); e == nil {
			t.Errorf("case%d accepted invalid callback", i)
		}
	}
}
func TestSuccessRequiresCompletionTime(t *testing.T) {
	now := time.Now()
	for _, state := range []string{"dispatching", "accepted", "unknown", "rejected", "complete"} {
		if result(state, now, sql.NullTime{}).Ready {
			t.Errorf("%s reported success without a receipt time", state)
		}
	}
	if !result("complete", now, sql.NullTime{Time: now, Valid: true}).Ready {
		t.Fatal("valid completed state rejected")
	}
}
func TestVendorHTTP200DoesNotHideBodyError(t *testing.T) {
	for _, raw := range []string{`{"error":"Internal server error","code":500}`, `{"code":403}`, `{"error":true}`} {
		if !providerRejected([]byte(raw)) {
			t.Fatalf("not recognized: %s", raw)
		}
	}
	for _, raw := range []string{`{"error":null}`, `{"error":false}`, `{"error":""}`, `{"success":true}`, `[]`, ``} {
		if providerRejected([]byte(raw)) {
			t.Fatalf("invented explicit rejection: %s", raw)
		}
	}
}
func TestResultNeverExposesRecipientOrCallbackSecret(t *testing.T) {
	b, e := json.Marshal(result("unknown", time.Now(), sql.NullTime{}))
	if e != nil {
		t.Fatal(e)
	}
	for _, s := range []string{"tester_id", "users_bm", "webhook", "bot_token"} {
		if strings.Contains(string(b), s) {
			t.Fatal("private setup exposed")
		}
	}
}
