package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// focused integration; expected<1/max5s. Lazy recreation must inherit finite
// limits; a foreign container must never be updated.
func TestRuntimeBudgetFollowsExactOwnedGeneration(t *testing.T) {
	generation := "one"
	updates := 0
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			if !strings.Contains(r.URL.Query().Get("filters"), "run.airlock.agent=owned") {
				t.Error("missing exact label filter")
			}
			json.NewEncoder(w).Encode([]map[string]any{{"Id": generation, "Labels": map[string]string{"run.airlock.agent": "owned"}}})
			return
		}
		updates++
		var limits map[string]int64
		json.NewDecoder(r.Body).Decode(&limits)
		if limits["Memory"] != 256<<20 || limits["MemorySwap"] != 256<<20 || limits["PidsLimit"] != 128 || limits["NanoCpus"] != 1e9 {
			t.Error("wrong finite budget")
		}
		json.NewEncoder(w).Encode(map[string]any{"Warnings": []string{}})
	}))
	defer s.Close()
	b := &runtimeBudget{client: s.Client(), base: s.URL, applied: map[string]string{}}
	for _, id := range []string{"one", "one", "two"} {
		generation = id
		if err := b.ensure(context.Background(), "owned"); err != nil {
			t.Fatal(err)
		}
	}
	if updates != 2 {
		t.Fatal("recreation or cache failed")
	}
}
