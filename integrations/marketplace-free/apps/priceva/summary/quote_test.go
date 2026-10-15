package summary

import (
	"encoding/json"
	"os"
	"testing"
)

func TestObservedRegionalQuote(t *testing.T) {
	raw, _ := os.ReadFile("testdata/report.json")
	q, e := ReportQuote(raw)
	if e != nil || q == nil || q.Minimum != 1280 || q.Average != 1280 || q.Maximum != 1280 || q.Currency != "RUB" || q.CollectedAt != "2026-10-15T04:18:37Z" {
		t.Fatalf("real quote rejected or own price0 substituted: %+v %v", q, e)
	}
	for _, tc := range []struct {
		name, key string
		value     any
	}{{"foreign product", "product_id", "private"}, {"aggregate stores", "company_id", false}, {"foreign store", "company_id", "private"}, {"aggregate regions", "region_id", "a"}, {"foreign region label", "region_name", "Private place"}, {"missing time", "date", nil}, {"invalid time", "date", 0}, {"future time", "date", 9999999999}, {"zero own price leak", "price_min", 0}, {"missing price", "price_avg", nil}, {"string price", "price_max", "1280"}, {"wrong range", "price_min", 2000}, {"wrong currency", "currency", "USD"}, {"no competitors", "competitor_cnt", 0}} {
		t.Run(tc.name, func(t *testing.T) {
			var j map[string]any
			json.Unmarshal(raw, &j)
			j["objects"].([]any)[0].(map[string]any)[tc.key] = tc.value
			b, _ := json.Marshal(j)
			if _, e := ReportQuote(b); e == nil {
				t.Fatal("accepted unconfirmed quote")
			}
		})
	}
}
func TestMissingQuoteIsNotZero(t *testing.T) {
	q, e := ReportQuote(json.RawMessage(`{"objects_cnt":0}`))
	if e != nil || q != nil {
		t.Fatal("explicit empty quote misread")
	}
	for _, s := range []string{`null`, `{}`, `{"objects_cnt":1}`, `{"objects_cnt":-1}`, `{"objects_cnt":2,"objects":[]}`} {
		if _, e := ReportQuote(json.RawMessage(s)); e == nil {
			t.Fatal("missing/unscoped quote accepted")
		}
	}
}
