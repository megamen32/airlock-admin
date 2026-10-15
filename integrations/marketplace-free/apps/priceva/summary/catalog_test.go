package summary

import (
	"encoding/json"
	"os"
	"testing"
)

func TestObservedCatalog(t *testing.T) {
	p, _ := os.ReadFile("testdata/product.json")
	s, _ := os.ReadFile("testdata/source.json")
	r, e := Catalog(p, s)
	if e != nil || r.Name != "Logitech K120 (920-002522) — демо Airlock" || r.MonitoringStatus != "done" {
		t.Fatalf("actual provider catalog rejected : %+v %v", r, e)
	}
	for _, tc := range []struct {
		name    string
		product bool
		field   string
		value   any
	}{{"foreign product", true, "id", "private"}, {"foreign client code", true, "client_code", "real-client"}, {"empty name", true, "name", ""}, {"wrong sku", true, "articul", "different"}, {"wrong currency", true, "default_currency", "USD"}, {"foreign source", false, "id", "private"}, {"wrong relation", false, "product_id", "other"}, {"unsafe URL", false, "url", "javascript:alert(1)"}, {"other host", false, "url", "https://evil.test/product"}, {"URL secret", false, "url", "https://www.regard.ru/product?token=secret"}, {"unknown status", false, "monitoring_status", "invented"}, {"other store", false, "company_name", "private.test"}} {
		t.Run(tc.name, func(t *testing.T) {
			a, b := append([]byte{}, p...), append([]byte{}, s...)
			target := &b
			if tc.product {
				target = &a
			}
			var j map[string]any
			json.Unmarshal(*target, &j)
			j["objects"].([]any)[0].(map[string]any)[tc.field] = tc.value
			*target, _ = json.Marshal(j)
			if _, e := Catalog(a, b); e == nil {
				t.Fatal("accepted foreign/invalid data")
			}
		})
	}
	for _, raw := range []string{`null`, `{}`, `{"objects_cnt":0}`, `{"objects_cnt":1,"objects":[]}`, `{"objects_cnt":2,"objects":[]}`} {
		if _, e := Catalog(json.RawMessage(raw), s); e == nil {
			t.Fatal("accepted missing product data")
		}
	}
}
