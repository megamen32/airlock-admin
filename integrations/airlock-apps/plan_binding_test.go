package main

import (
	"encoding/json"
	"net/url"
	"os"
	"testing"
)

// Exercise the real publisher registry, rather than a hand-written binding fixture.
func loadRegistry(t *testing.T) []appConfig {
	t.Helper()
	data, err := os.ReadFile("apps.json")
	if err != nil {
		t.Fatal(err)
	}
	var apps []appConfig
	if err := json.Unmarshal(data, &apps); err != nil {
		t.Fatal(err)
	}
	return apps
}

// The publisher contract in the platform's own terms:
//
//   - an application declares its own service and only its own service: every
//     binding points at the application's own product host. A foreign
//     application's resource keeps its credential with its owner; it is
//     reached through that application's operations, not by declaring a
//     binding on it.
//   - the slots of one service are selected by principal, so two slots of the
//     same principal are ambiguous and the first match would win.
func TestRegistryDeclaresOnlyItsOwnService(t *testing.T) {
	for _, app := range loadRegistry(t) {
		if app.ProductURL == "" {
			t.Fatalf("%s: no product url", app.Slug)
		}
		product, err := url.Parse(app.ProductURL)
		if err != nil {
			t.Fatalf("%s: product url %q: %v", app.Slug, app.ProductURL, err)
		}
		if len(app.Bindings) == 0 {
			t.Fatalf("%s: no bindings", app.Slug)
		}
		for _, binding := range app.Bindings {
			bound, err := url.Parse(binding.URL)
			if err != nil {
				t.Fatalf("%s: binding %q url %q: %v", app.Slug, binding.Slug, binding.URL, err)
			}
			if bound.Host != product.Host {
				t.Fatalf("%s: binding %q points at %q, not at the app's own service %q",
					app.Slug, binding.Slug, bound.Host, product.Host)
			}
		}
	}
}

func TestRegistrySlotsAreUnambiguous(t *testing.T) {
	for _, app := range loadRegistry(t) {
		seen := map[string]string{}
		for _, binding := range app.Bindings {
			previous, ok := seen[binding.Principal]
			if ok {
				t.Fatalf("%s: principal %q has two slots (%q and %q)",
					app.Slug, binding.Principal, previous, binding.Slug)
			}
			seen[binding.Principal] = binding.Slug
		}
	}
}

// The Plan is one shared service: every caller of the application reaches the
// Plan's own MCP, and the application declares no other resource.
func TestPlanRegistrySelectsOnlyPlanBinding(t *testing.T) {
	found := false
	for _, app := range loadRegistry(t) {
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
