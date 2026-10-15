package summary

import (
	"encoding/json"
	"os"
	"testing"
)

func actual(t *testing.T) (Project, Scan) {
	t.Helper()
	raw, e := os.ReadFile("testdata/report.json")
	if e != nil {
		t.Fatal(e)
	}
	var v struct {
		Project Project `json:"project"`
		Scan    Scan    `json:"scan"`
	}
	if e = json.Unmarshal(raw, &v); e != nil {
		t.Fatal(e)
	}
	return v.Project, v.Scan
}

// Fast unit, expected2s/max20s: guard against turning Google AIO failure into a third answer or a negative mention.
func TestActualProviderAccounting(t *testing.T) {
	p, s := actual(t)
	r, e := Report(p, s)
	if e != nil {
		t.Fatal(e)
	}
	if !r.Ready || r.Received != 2 || r.Requested != 3 || r.Failed != 1 || r.Mentions != 0 {
		t.Fatalf("wrong accounting: %+v", r)
	}
	for _, v := range r.Providers {
		if v.Name == "Google AI Overview" && (v.Received != 0 || v.Failed != 1) {
			t.Fatalf("failed provider counted as answer: %+v", v)
		}
	}
}
func TestRejectInconsistentOrForeignReport(t *testing.T) {
	for _, name := range []string{"wrong domain", "missing total", "missing row", "inflated mentions", "unfinished"} {
		t.Run(name, func(t *testing.T) {
			p, s := actual(t)
			switch name {
			case "wrong domain":
				p.Domain = "private.example"
			case "missing total":
				s.Summary.TotalResponses = nil
			case "missing row":
				s.Results = s.Results[:1]
			case "inflated mentions":
				v := 1
				s.Summary.TotalMentions = &v
			case "unfinished":
				s.Status = "processing"
			}
			if _, e := Report(p, s); e == nil {
				t.Fatal("accepted unverified report")
			}
		})
	}
}
