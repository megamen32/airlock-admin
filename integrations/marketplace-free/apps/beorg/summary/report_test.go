package summary

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
)

func fixture(t *testing.T) []byte {
	t.Helper()
	b, e := os.ReadFile("testdata/actual-invoice.json")
	if e != nil {
		t.Fatal(e)
	}
	return b
}
func TestActualBeorgNestedProductsAndMissingFields(t *testing.T) {
	r, e := Report(fixture(t))
	if e != nil || !r.Ready {
		t.Fatalf("actual response: %v", e)
	}
	if len(r.Items) != 1 || r.Items[0].Quantity != "2" || r.Items[0].UnitPrice != "4900,00" || !strings.Contains(r.Items[0].Name, "AIRLICK") {
		t.Fatalf("raw nested OCR product changed: %+v", r.Items)
	}
	got := map[string]string{}
	for _, f := range r.Fields {
		got[f.Name] = f.Value
	}
	if got["Номер счёта"] != "DEMO-001" || got["Сумма без НДС"] != "9800,00" || got["Итог с НДС"] != "" || got["Валюта"] != "" {
		t.Fatalf("OCR amount/currency invented: %+v", got)
	}
}
func TestRejectForeignOrBrokenDocument(t *testing.T) {
	for _, change := range []string{"foreign", "broken"} {
		var v map[string]any
		json.Unmarshal(fixture(t), &v)
		if change == "foreign" {
			v["document_id"] = "s-foreign"
		} else {
			v["documents"].([]any)[0].(map[string]any)["broken"] = true
		}
		b, _ := json.Marshal(v)
		if _, e := Report(b); e == nil {
			t.Fatal("accepted", change)
		}
	}
}
func TestRejectUnexpectedProductType(t *testing.T) {
	var v map[string]any
	json.Unmarshal(fixture(t), &v)
	v["documents"].([]any)[0].(map[string]any)["data"].(map[string]any)["Products"] = "not-an-array"
	b, _ := json.Marshal(v)
	if _, e := Report(b); e == nil {
		t.Fatal("unexpected product payload accepted")
	}
}
