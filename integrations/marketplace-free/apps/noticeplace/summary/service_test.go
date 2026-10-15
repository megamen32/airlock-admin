package summary

import (
	"os"
	"strings"
	"testing"
)

func TestRealAcceptedReceiptAndRejections(t *testing.T) {
	b, e := os.ReadFile("testdata/accepted.json")
	if e != nil {
		t.Fatal(e)
	}
	if _, e = ParseReceipt(202, b); e != nil {
		t.Fatal(e)
	}
	for _, tc := range []struct {
		status int
		body   []byte
	}{{200, b}, {500, b}, {202, nil}, {202, []byte(`{}`)}, {202, []byte(strings.Replace(string(b), `"open"`, `"resolved"`, 1))}, {202, []byte(strings.Replace(string(b), `"notifications_muted": false`, `"notifications_muted": true`, 1))}, {202, []byte(strings.Replace(string(b), `"agent_job_delivery_id": null`, `"agent_job_delivery_id": "unexpected"`, 1))}, {202, []byte(strings.Replace(string(b), `evt_`, `other_`, 1))}, {202, []byte(strings.Repeat(" ", 16385))}} {
		if _, e := ParseReceipt(tc.status, tc.body); e == nil {
			t.Errorf("invalid receipt accepted: status%d", tc.status)
		}
	}
}
