package summary

import (
	"encoding/json"
	"os"
	"testing"
)

func fixture(t *testing.T) []byte {
	t.Helper()
	b, e := os.ReadFile("testdata/tasks.json")
	if e != nil {
		t.Fatal(e)
	}
	return b
}
func TestActualDemoPage(t *testing.T) {
	r, e := Report(fixture(t))
	if e != nil || !r.Ready || r.Total != 3 || len(r.Tasks) != 3 || r.Tasks[1].Status != "В процессе" {
		t.Fatalf("unexpected page: %#v %v", r, e)
	}
}
func TestRejectWrongOrIncompletePage(t *testing.T) {
	for _, name := range []string{"other-project", "missing-total", "missing-page", "missing-flag", "completed", "archived", "duplicate", "bad-name", "wrong-type", "wrong-more", "missing-tasks"} {
		t.Run(name, func(t *testing.T) {
			var p map[string]any
			json.Unmarshal(fixture(t), &p)
			a := p["tasks"].([]any)
			first := a[0].(map[string]any)
			switch name {
			case "other-project":
				first["datasource_id"] = 138081
			case "missing-total":
				delete(p, "total_count")
			case "missing-page":
				delete(p, "page")
			case "missing-flag":
				delete(first, "completed")
			case "completed":
				first["completed"] = true
			case "archived":
				first["archived"] = true
			case "duplicate":
				a[1] = a[0]
			case "bad-name":
				first["name"] = " "
			case "wrong-type":
				p["type"] = "error"
			case "wrong-more":
				p["has_more"] = true
			case "missing-tasks":
				delete(p, "tasks")
			}
			b, _ := json.Marshal(p)
			if _, e := Report(b); e == nil {
				t.Fatal("invalid page accepted")
			}
		})
	}
}
func TestValidEmptyAndPartialPages(t *testing.T) {
	for _, total := range []int{0, 20} {
		var p map[string]any
		json.Unmarshal(fixture(t), &p)
		p["total_count"] = total
		p["has_more"] = total > 3
		if total == 0 {
			p["tasks"] = []any{}
		}
		b, _ := json.Marshal(p)
		r, e := Report(b)
		if e != nil || r.Total != total {
			t.Fatal(r, e)
		}
	}
}
