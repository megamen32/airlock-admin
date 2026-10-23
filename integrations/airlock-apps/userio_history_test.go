package main

import (
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"
)

func historyAppConfig(t *testing.T) appConfig {
	t.Helper()
	path := os.Getenv("USERIO_HISTORY_MANIFEST")
	if path == "" {
		path = "apps.json"
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var configs []appConfig
	if strings.HasPrefix(strings.TrimSpace(string(data)), "[") {
		if err := json.Unmarshal(data, &configs); err != nil {
			t.Fatal(err)
		}
	} else {
		var config appConfig
		if err := json.Unmarshal(data, &config); err != nil {
			t.Fatal(err)
		}
		configs = []appConfig{config}
	}
	for _, config := range configs {
		if config.Slug == "universal-userio" {
			return config
		}
	}
	t.Fatal("missing UserIO manifest")
	return appConfig{}
}

func TestUserIOHistoryOperationContract(t *testing.T) {
	c := historyAppConfig(t)
	count := 0
	for _, op := range c.Operations {
		if op.Tool != "userio.messenger.history" {
			continue
		}
		count++
		if op.Mutation || op.Title != "История контакта" {
			t.Fatal("history must be an explicit read operation")
		}
		want := map[string]any{"account_ref": "", "conversation_id": "", "limit": float64(100), "refresh": false}
		if !reflect.DeepEqual(op.Args, want) {
			t.Fatalf("unsafe or incompatible history defaults: %#v", op.Args)
		}
	}
	if count != 1 {
		t.Fatalf("expected one history allowlist entry, got %d", count)
	}
}

func TestUserIOHistoryRetainsPersonalAuthorization(t *testing.T) {
	c := historyAppConfig(t)
	for principal, want := range map[string]string{"5e438326-6339-4ac8-a328-59dae1d6241f": "userio_owner", "98daa037-a87d-49b1-ba07-cd9e6f451864": "userio_oleg"} {
		b, err := c.bindingFor(principal)
		if err != nil || b.Slug != want {
			t.Fatalf("wrong personal binding %q (%v)", b.Slug, err)
		}
	}
	app := makeApplication(c)
	in := callInput{Tool: "userio.messenger.history", Args: map[string]any{"account_ref": "", "conversation_id": "", "limit": 100, "refresh": false}}
	if _, err := app.call(memberContext("5e438326-6339-4ac8-a328-59dae1d6241f"), in); err == nil || !strings.Contains(err.Error(), "Требуется вход") {
		t.Fatalf("app member bypassed existing admin gate: %v", err)
	}
	if _, err := app.call(adminContext("third-admin"), in); err == nil || !strings.Contains(err.Error(), "Личное подключение") {
		t.Fatalf("unbound caller borrowed another identity: %v", err)
	}
	// Offline admin admission must pass the actual allowlist and stop only at
	// the existing unavailable runtime boundary, before any upstream operation.
	if _, err := app.call(adminContext("5e438326-6339-4ac8-a328-59dae1d6241f"), in); err == nil || strings.Contains(err.Error(), "Операция отсутствует") || strings.Contains(err.Error(), "Подтвердите") {
		t.Fatalf("read operation not admitted by its allowlist: %v", err)
	}
}
