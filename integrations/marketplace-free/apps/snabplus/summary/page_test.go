package summary

import (
	"os"
	"testing"
)

// Fast unit, expected5s/max50s including setup. Failed/unauthorized pages must not masquerade as an empty procurement list.
func TestActualSeededPurchase(t *testing.T) {
	raw, e := os.ReadFile("testdata/purchases.json")
	if e != nil {
		t.Fatal(e)
	}
	r, e := Page(raw)
	if e != nil {
		t.Fatal(e)
	}
	if !r.Ready || r.Total == nil || *r.Total != 1 || len(r.Purchases) != 1 || r.Purchases[0].Number != "AIRLOCK-DEMO-001" || r.Purchases[0].Status != "draft" {
		t.Fatalf("wrong actual purchase: %+v", r)
	}
}
func TestEmptyPageAndProviderFailures(t *testing.T) {
	r, e := Page([]byte(`{"resource":"purchase-requisitions","page":1,"limit":5,"total":0,"items":[]}`))
	if e != nil || r.Total == nil || *r.Total != 0 {
		t.Fatalf("valid empty page rejected: %+v %v", r, e)
	}
	for _, raw := range []string{`{"statusCode":403,"message":"License expired"}`, `{"resource":"purchase-requisitions","page":1,"limit":5,"total":0}`, `{"resource":"purchase-requisitions","page":1,"limit":5,"items":[]}`, `{"resource":"counterparties","page":1,"limit":5,"total":0,"items":[]}`, `{"resource":"purchase-requisitions","page":1,"limit":5,"total":0,"items":[{"number":"a","status":"draft"}]}`} {
		if _, e := Page([]byte(raw)); e == nil {
			t.Fatal("accepted incomplete/error response")
		}
	}
}
