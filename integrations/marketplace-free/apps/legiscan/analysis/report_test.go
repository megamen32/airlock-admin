package analysis

import (
	"context"
	"testing"
)

// Fast unit, expected1s/emergency10s: actual captured provider payload, no
// network or paid-credit test. Catches lost findings and misleading paging.
func TestActualProviderReportAndPaging(t *testing.T) {
	s := New()
	r, e := s.Get()
	if e != nil {
		t.Fatal(e)
	}
	if r.SecurityScore == nil || *r.SecurityScore != 8 || len(r.Risks) != 34 || len(r.Gaps) != 10 || len(r.ProtectiveClauses) != 8 || len(r.LawChecks) != 10 {
		t.Fatal("Captured provider facts changed; reconcile the real result")
	}
	a, e := s.Tool(context.Background(), Input{Section: "risks", Offset: 32, Limit: 8})
	if e != nil || !a.Ready || len(a.Risks) != 2 || a.HasMore || a.Total != 34 || a.NewAnalysisStarted {
		t.Fatal("Last page must retain both remaining findings and start no analysis")
	}
	if a.Risks[0].Title != r.Risks[32].Title || a.Risks[1].Quote != r.Risks[33].Quote {
		t.Fatal("Provider text or order lost")
	}
	b, _ := s.Tool(context.Background(), Input{Section: "risks", Limit: 100})
	if len(b.Risks) != 8 || !b.HasMore {
		t.Fatal("Unbounded tool output")
	}
	for _, in := range []Input{{Section: "risks", Offset: -1}, {Section: "upload"}} {
		a, _ := s.Tool(context.Background(), in)
		if a.Ready || a.Message == "" {
			t.Fatal("Invalid input must be explicit, not a successful empty report")
		}
	}
}
