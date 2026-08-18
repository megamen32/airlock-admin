package cloudos

import (
	"sync"
	"testing"
)

func TestRegisterAndGet(t *testing.T) {
	r := NewRegistry()

	c := &Computer{
		ID:       "comp-1",
		Name:     "My Laptop",
		OS:       "darwin",
		Status:   "online",
		LastSeen: "2025-01-01T00:00:00Z",
	}

	r.Register(c)

	got, ok := r.Get("comp-1")
	if !ok {
		t.Fatal("expected to find comp-1")
	}
	if got.ID != "comp-1" {
		t.Errorf("ID = %q, want %q", got.ID, "comp-1")
	}
	if got.Name != "My Laptop" {
		t.Errorf("Name = %q, want %q", got.Name, "My Laptop")
	}
	if got.OS != "darwin" {
		t.Errorf("OS = %q, want %q", got.OS, "darwin")
	}

	// Non-existent key
	_, ok = r.Get("nonexistent")
	if ok {
		t.Error("expected false for nonexistent key")
	}
}

func TestList(t *testing.T) {
	r := NewRegistry()

	if got := r.List(); len(got) != 0 {
		t.Errorf("empty registry returned %d computers", len(got))
	}

	for i := 0; i < 3; i++ {
		r.Register(&Computer{
			ID:     "comp-" + string(rune('a'+i)),
			Name:   "Computer " + string(rune('a'+i)),
			Status: "online",
		})
	}

	got := r.List()
	if len(got) != 3 {
		t.Fatalf("List returned %d computers, want 3", len(got))
	}

	// Build a set of IDs for quick lookup.
	ids := make(map[string]bool, len(got))
	for _, c := range got {
		ids[c.ID] = true
	}
	for _, want := range []string{"comp-a", "comp-b", "comp-c"} {
		if !ids[want] {
			t.Errorf("List missing %q", want)
		}
	}
}

func TestDeregister(t *testing.T) {
	r := NewRegistry()

	r.Register(&Computer{ID: "comp-x", Name: "X", Status: "online"})

	if _, ok := r.Get("comp-x"); !ok {
		t.Fatal("comp-x should exist after Register")
	}

	r.Deregister("comp-x")

	if _, ok := r.Get("comp-x"); ok {
		t.Error("comp-x should not exist after Deregister")
	}

	// Deregistering a non-existent key is a safe no-op.
	r.Deregister("nope")
}

func TestConcurrentAccess(t *testing.T) {
	r := NewRegistry()
	var wg sync.WaitGroup

	const writers = 50
	const readers = 50

	// Concurrent writes
	for i := 0; i < writers; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			id := "comp-" + string(rune('A'+idx%26))
			r.Register(&Computer{ID: id, Name: id, Status: "online"})
			if idx%3 == 0 {
				r.Deregister(id)
			}
			if idx%5 == 0 {
				r.UpdateLastSeen(id)
			}
		}(i)
	}

	// Concurrent reads
	for i := 0; i < readers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = r.List()
			for j := 0; j < 26; j++ {
				r.Get("comp-" + string(rune('A'+j)))
			}
		}()
	}

	wg.Wait()

	// After all goroutines finish the registry should still be usable.
	list := r.List()
	_ = list // just ensure no panic
}
