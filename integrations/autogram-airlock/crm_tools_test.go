package main

import (
	"context"
	"encoding/json"
	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
	"reflect"
	"strings"
	"testing"
)

func TestCRMReadManifest(t *testing.T) {
	raw, _ := json.Marshal(newAgent().Manifest())
	for _, name := range []string{"get_crm_import_receipt", "get_crm_link"} {
		if !strings.Contains(string(raw), `"name":"`+name+`"`) {
			t.Fatalf("missing read %s", name)
		}
	}
	if !strings.Contains(string(raw), `"name":"import_crm_entity"`) {
		t.Fatal("explicitly authorized typed import missing")
	}
}

func TestCRMReadForwardingAndCallerGate(t *testing.T) {
	for _, tc := range []struct {
		name, input string
		build       func(func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool
	}{
		{"get_crm_link", `{"system":"airlock_plan","connection_id":"plan-a","source_instance":"instance-a","object_type":"source_contact","external_object_id":"airlockplan:I003:contact"}`, crmLinkTool},
		{"get_crm_import_receipt", `{"system":"airlock_plan","connection_id":"plan-a","source_instance":"instance-a","operation":{"kind":"import_link","idempotency_key":"00000000-0000-4000-8000-000000000001"}}`, crmReceiptTool},
	} {
		t.Run(tc.name, func(t *testing.T) {
			calls := 0
			read := tc.build(func(_ context.Context, name string, args any) (*agentsdk.MCPToolCallResponse, error) {
				calls++
				raw, _ := json.Marshal(args)
				var got, want any
				_ = json.Unmarshal(raw, &got)
				_ = json.Unmarshal([]byte(tc.input), &want)
				if name != tc.name || !reflect.DeepEqual(got, want) {
					t.Fatal("selector changed")
				}
				return &agentsdk.MCPToolCallResponse{StructuredContent: json.RawMessage(`{"outcome":"unlinked","native_contact_created":false,"send_allowed":false}`)}, nil
			})
			if _, err := read.Execute(caller("third"), json.RawMessage(tc.input), tool.CallOptions{}); err == nil || calls != 0 {
				t.Fatal("unauthorized backend call")
			}
			result, err := read.Execute(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9"), json.RawMessage(tc.input), tool.CallOptions{})
			if err != nil {
				t.Fatal(err)
			}
			if calls != 1 || !strings.Contains(result.Output, `unlinked`) {
				t.Fatal("original receipt/result lost")
			}
		})
	}
}

func TestCRMImportPreservesOperationAndGuardsEffects(t *testing.T) {
	in, err := adaptPlanContact(planFixture())
	if err != nil {
		t.Fatal(err)
	}
	calls := 0
	write := crmImportTool(func(_ context.Context, name string, args any) (*agentsdk.MCPToolCallResponse, error) {
		calls++
		got := args.(CRMContactEnvelope)
		if name != "import_crm_entity" || got.Operation != in.Operation || got.Identity != in.Identity {
			t.Fatal("immutable selector/UUID changed")
		}
		return &agentsdk.MCPToolCallResponse{}, nil
	})
	raw, _ := json.Marshal(in)
	if _, err := write.Execute(caller("third"), raw, tool.CallOptions{}); err == nil || calls != 0 {
		t.Fatal("unauthorized import")
	}
	if _, err := write.Execute(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9"), raw, tool.CallOptions{}); err != nil {
		t.Fatal(err)
	}
	in.SendAllowed = true
	raw, _ = json.Marshal(in)
	if _, err := write.Execute(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9"), raw, tool.CallOptions{}); err == nil || calls != 1 {
		t.Fatal("send-enabled import admitted")
	}
	var schema map[string]any
	_ = json.Unmarshal(write.InputSchema, &schema)
	p := schema["properties"].(map[string]any)
	if p["source_payload"].(map[string]any)["type"] != "object" || p["send_allowed"].(map[string]any)["const"] != false {
		t.Fatal("input object/effect schema mismatch")
	}
}

func TestCRMImportBackendDefaultsAndOwnerBoundary(t *testing.T) {
	calls := 0
	write := crmImportTool(func(_ context.Context, _ string, args any) (*agentsdk.MCPToolCallResponse, error) {
		calls++
		in := args.(CRMContactEnvelope)
		if in.SchemaVersion != crmEnvelopeVersion || in.Operation.Kind != "import_link" || in.SourcePayload == nil || in.SourceRefs == nil || in.History == nil || !in.History[0].Partial {
			t.Fatal("backend defaults lost")
		}
		return &agentsdk.MCPToolCallResponse{}, nil
	})
	input := json.RawMessage(`{"identity":{"system":"custom","connection_id":"a","source_instance":"a","object_type":"contact","external_object_id":"42"},"source_version":{"revision":"v1","observed_at":"2026-10-24T12:00:00Z"},"operation":{"idempotency_key":"00000000-0000-4000-8000-000000000001"},"expected_link_revision":0,"contact":{},"history":[{"status":"UNKNOWN","account_ref":"account","observed_at":"2026-10-24T12:00:00Z","coverage":{}}]}`)
	if _, err := write.Execute(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9"), input, tool.CallOptions{}); err != nil || calls != 1 {
		t.Fatal(err)
	}
	var schema map[string]any
	_ = json.Unmarshal(write.InputSchema, &schema)
	if schema["additionalProperties"] != false {
		t.Fatal("unexpected top-level fields allowed")
	}
	p := schema["properties"].(map[string]any)
	if p["owner_id"] != nil || p["draft"] != nil || p["operation_payload_fingerprint"] != nil {
		t.Fatal("unsupported wire/owner field exposed")
	}
}

func TestCRMImportTypedForwardPreservesLargeSourceInteger(t *testing.T) {
	// Exact factory registered by newAgent: raw input -> tool.Typed -> upstream JSON.
	forwarded := []string{}
	write := crmImportTool(func(_ context.Context, name string, args any) (*agentsdk.MCPToolCallResponse, error) {
		if name != "import_crm_entity" {
			t.Fatal("wrong upstream operation")
		}
		serialized, err := json.Marshal(args)
		if err != nil {
			t.Fatal(err)
		}
		forwarded = append(forwarded, string(serialized))
		return &agentsdk.MCPToolCallResponse{}, nil
	})
	for _, number := range []string{"9007199254740993", "9007199254740992"} {
		input := json.RawMessage(`{"schema_version":"autogram.crm.v1","identity":{"system":"airlock_plan","connection_id":"plan-a","source_instance":"instance-a","object_type":"source_contact","external_object_id":"airlockplan:I003:contact"},"source_version":{"revision":"v1","observed_at":"2026-10-24T12:00:00Z"},"operation":{"kind":"import_link","idempotency_key":"00000000-0000-4000-8000-000000000001"},"expected_link_revision":0,"contact":{},"source_payload":{"id":"I003","research_numeric_id":` + number + `},"history":[],"send_allowed":false}`)
		if _, err := write.Execute(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9"), input, tool.CallOptions{}); err != nil {
			t.Fatal(err)
		}
		if !strings.Contains(forwarded[len(forwarded)-1], `"research_numeric_id":`+number) {
			t.Fatalf("typed forwarding rounded source integer %s", number)
		}
	}
	if len(forwarded) != 2 || forwarded[0] == forwarded[1] {
		t.Fatal("distinct immutable payloads collapsed")
	}
}
