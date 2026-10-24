package main

import (
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"
)

func planFixture() PlanAdapterInput {
	return PlanAdapterInput{OperationID: "00000000-0000-4000-8000-000000000001", OwnerID: "208", ConnectionID: "plan-connection-a", SourceInstance: "plan-instance-a", ProjectID: "I003", SourceContactKey: "airlockplan:I003:C258-I003-ILYA-SHCHENNIKOV", Revision: "revision-1", ObservedAt: "2026-10-24T11:00:00Z", RawProject: json.RawMessage(`{"id":"I003","name":"Source company","sources":[{"url":"https://example.invalid/source"}],"unknown_field":{"keep":true}}`), RawContact: json.RawMessage(`{"contactId":"C258-I003-ILYA-SHCHENNIKOV","person":"Source person","role":"Source role","channels":{"telegram":"source_alias","email":"source@example.invalid"},"extra":{"untouched":true}}`), SourceRefs: []string{"source:/project/contacts/0"}, History: []CRMHistoryObservation{{Status: "UNKNOWN", AccountRef: "account-1", ObservedAt: "2026-10-24T10:00:00Z", Partial: true, Coverage: map[string]any{"retained_only": true, "team": false}}}}
}

func TestPlanAdapterPreservesSourceAndScopedUnknown(t *testing.T) {
	in := planFixture()
	out, err := adaptPlanContact(in)
	if err != nil {
		t.Fatal(err)
	}
	var before, after any
	_ = json.Unmarshal(in.RawContact, &before)
	var payload map[string]json.RawMessage
	payloadBytes, _ := json.Marshal(out.SourcePayload)
	_ = json.Unmarshal(payloadBytes, &payload)
	var provenance struct {
		Contact json.RawMessage `json:"contact"`
	}
	_ = json.Unmarshal(payload["_airlock_plan_adapter"], &provenance)
	_ = json.Unmarshal(provenance.Contact, &after)
	if out.SourcePayload == nil {
		t.Fatal("raw project snapshot lost")
	}
	if !reflect.DeepEqual(before, after) || out.Identity.ExternalObjectID != in.SourceContactKey || out.SourceVersion.Revision != in.Revision {
		t.Fatal("source data/identity/version changed")
	}
	if out.SendAllowed || out.History[0].Status != "UNKNOWN" || !out.History[0].Partial || out.History[0].TeamHistoryChecked {
		t.Fatal("history/sending claims widened")
	}
	in.History[0].Status = "CONTACTED"
	in.SourceRefs[0] = "changed"
	if out.History[0].Status != "UNKNOWN" || out.SourceRefs[0] == "changed" {
		t.Fatal("observation aliases mutable input")
	}
}

func TestExternalIdentityDoesNotContainSourceVersion(t *testing.T) {
	in := planFixture()
	a, _ := adaptPlanContact(in)
	in.Revision = "revision-2"
	b, _ := adaptPlanContact(in)
	if a.Identity != b.Identity || a.SourceVersion == b.SourceVersion {
		t.Fatal("revision changed link identity")
	}
	// CRM-A:42 and CRM-B:42 must remain distinct without any Plan grammar.
	aID := CRMExternalIdentity{"208", "connection-a", "crm-a", "contact", "42"}
	bID := CRMExternalIdentity{"208", "connection-b", "crm-b", "contact", "42"}
	if aID == bID {
		t.Fatal("different CRM namespaces collide")
	}
}

func TestPlanAdapterLegacyResearchIDIsNotAllocatedIdentity(t *testing.T) {
	in := planFixture()
	in.ProjectID = "I427"
	in.RawProject = json.RawMessage(`{"id":"I427","name":"Source company"}`)
	in.SourceContactKey = "airlockplan:I427:/project/contact"
	in.RawContact = json.RawMessage(`{"contactId":"preexisting-research-id","nativeCatalogContactId":null,"person":"Source name","phone":["source-only"],"sourceRefs":["original"]}`)
	out, err := adaptPlanContact(in)
	if err != nil {
		t.Fatal(err)
	}
	if out.Identity.ExternalObjectID != "airlockplan:I427:/project/contact" {
		t.Fatal("research ID replaced semantic key")
	}
	var raw map[string]any
	var payload map[string]json.RawMessage
	payloadBytes, _ := json.Marshal(out.SourcePayload)
	_ = json.Unmarshal(payloadBytes, &payload)
	var provenance struct {
		Contact json.RawMessage `json:"contact"`
	}
	_ = json.Unmarshal(payload["_airlock_plan_adapter"], &provenance)
	_ = json.Unmarshal(provenance.Contact, &raw)
	if raw["contactId"] != "preexisting-research-id" || raw["nativeCatalogContactId"] != nil {
		t.Fatal("raw research/native distinction lost")
	}
}

func TestPlanAdapterKeepsSeparateContactUnits(t *testing.T) {
	in := planFixture()
	a, _ := adaptPlanContact(in)
	in.SourceContactKey = "airlockplan:I003:second-source-contact"
	b, _ := adaptPlanContact(in)
	if a.Identity == b.Identity {
		t.Fatal("contacts merged by company/person")
	}
}

func TestPlanAdapterRejectsWrongProjectAndSyntheticExposure(t *testing.T) {
	in := planFixture()
	in.SourceContactKey = "airlockplan:I004:contact"
	if _, err := adaptPlanContact(in); err == nil {
		t.Fatal("wrong project admitted")
	}
	in = planFixture()
	in.Experiment = &CRMExperimentProposal{ExperimentID: "experiment-1", UnitID: "company-1", ArmID: "crm_addon", Seed: "fixed", ConfigRevision: "v1", ActualAssigned: true}
	if _, err := adaptPlanContact(in); err == nil {
		t.Fatal("import claimed assignment")
	}
	in.Experiment.ActualAssigned = false
	in.Experiment.Exposure = 1
	if _, err := adaptPlanContact(in); err == nil {
		t.Fatal("import claimed exposure")
	}
}

func TestPlanProjectFactsAffectVersionNotLink(t *testing.T) {
	in := planFixture()
	a, _ := adaptPlanContact(in)
	in.RawProject = json.RawMessage(`{"id":"I003","name":"Changed source company fact"}`)
	b, err := adaptPlanContact(in)
	if err != nil {
		t.Fatal(err)
	}
	if a.Identity != b.Identity || a.SourceVersion.PayloadFingerprint == b.SourceVersion.PayloadFingerprint {
		t.Fatal("project fact change lost or minted new identity")
	}
}

func TestPlanSourceTupleMatchesAgreedBackendShape(t *testing.T) {
	in := planFixture()
	envelope, err := adaptPlanContact(in)
	if err != nil {
		t.Fatal(err)
	}
	source, err := planCRMSource(envelope)
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := json.Marshal(source)
	var fields map[string]any
	_ = json.Unmarshal(raw, &fields)
	if len(fields) != 5 || fields["system"] != "airlock_plan" || fields["source_instance"] != in.SourceInstance || fields["object_type"] != "source_contact" || fields["external_object_id"] != in.SourceContactKey {
		t.Fatalf("unexpected source tuple: %s", raw)
	}
	if fields["owner_id"] != nil || fields["external_version"] != nil {
		t.Fatal("admission/version mixed into source identity")
	}
	in.Revision = "opaque-version-2"
	changed, _ := adaptPlanContact(in)
	again, _ := planCRMSource(changed)
	if source != again {
		t.Fatal("external version changed stable source tuple")
	}
}

// Optional protected real-source fixture: no network, credentials or app writes.
func TestPlanProtectedContractFixture(t *testing.T) {
	inputPath, outputPath := os.Getenv("AIRLOCK_PLAN_ADAPTER_INPUT"), os.Getenv("AIRLOCK_PLAN_ADAPTER_OUTPUT")
	if inputPath == "" || outputPath == "" {
		t.Skip("protected real-source fixture not selected")
	}
	raw, err := os.ReadFile(inputPath)
	if err != nil {
		t.Fatal(err)
	}
	var input PlanAdapterInput
	if err := json.Unmarshal(raw, &input); err != nil {
		t.Fatal(err)
	}
	envelope, err := adaptPlanContact(input)
	if err != nil {
		t.Fatal(err)
	}
	out, err := json.MarshalIndent(envelope, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(outputPath, append(out, '\n'), 0600); err != nil {
		t.Fatal(err)
	}
}

func TestPlanRawNumericSourceIdentityIsLossless(t *testing.T) {
	in := planFixture()
	in.RawProject = json.RawMessage(`{"id":"I003","research_numeric_id":9007199254740993}`)
	envelope, err := adaptPlanContact(in)
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := json.Marshal(envelope.SourcePayload)
	if !strings.Contains(string(raw), "9007199254740993") {
		t.Fatal("raw source integer rounded")
	}
}
