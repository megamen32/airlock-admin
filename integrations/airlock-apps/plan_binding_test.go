package main

import (
	"encoding/json"
	"os"
	"testing"
)

// Exercise the real publisher registry, rather than a hand-written binding fixture.
func TestPlanRegistrySelectsOnlyPlanBinding(t *testing.T) {
	data, err := os.ReadFile("apps.json")
	if err != nil {
		t.Fatal(err)
	}
	var apps []appConfig
	if err := json.Unmarshal(data, &apps); err != nil {
		t.Fatal(err)
	}
	found := false
	for _, app := range apps {
		if app.Slug == "airlockplan" {
			found = true
			for _, caller := range []string{"5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864", "", "other-admin"} {
				b, err := app.bindingFor(caller)
				if err != nil || b.Slug != "airlockplan" || b.URL != "https://airlockplan.bezrabotnyi.com/airlock-mcp" {
					t.Fatalf("Plan caller %q routed to %q (%v)", caller, b.Slug, err)
				}
			}
			if len(app.Bindings) != 1 {
				t.Fatal("Plan must declare only its own shared binding")
			}
		}
		if app.Slug == "universal-userio" {
			for caller, want := range map[string]string{"5e438326-6339-4ac8-a328-59dae1d6241f": "userio_owner", "98daa037-a87d-49b1-ba07-cd9e6f451864": "userio_oleg"} {
				b, err := app.bindingFor(caller)
				if err != nil || b.Slug != want {
					t.Fatalf("UserIO caller %q changed: %q (%v)", caller, b.Slug, err)
				}
			}
		}
	}
	if !found {
		t.Fatal("Plan missing from publisher registry")
	}
}
