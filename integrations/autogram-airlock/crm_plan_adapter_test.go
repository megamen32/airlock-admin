package main

import (
	"encoding/json"
	"reflect"
	"testing"
)

func planFixture() PlanAdapterInput {
	return PlanAdapterInput{OwnerID: "208", ConnectionID: "plan-connection-a", SourceInstance: "plan-instance-a", ProjectID: "I003", SourceContactKey: "airlockplan:I003:C258-I003-ILYA-SHCHENNIKOV", Revision: "revision-1", ObservedAt: "2026-10-24T11:00:00Z", RawProject: json.RawMessage(`{"id":"I003","name":"Source company","sources":[{"url":"https://example.invalid/source"}],"unknown_field":{"keep":true}}`), RawContact: json.RawMessage(`{"contactId":"C258-I003-ILYA-SHCHENNIKOV","person":"Source person","role":"Source role","channels":{"telegram":"source_alias","email":"source@example.invalid"},"extra":{"untouched":true}}`), SourceRefs: []string{"source:/project/contacts/0"}, History: []CRMHistoryObservation{{Status: "UNKNOWN", AccountRef: "account-1", ObservedAt: "2026-10-24T10:00:00Z", Partial: true, Coverage: json.RawMessage(`{"retained_only":true,"team":false}`)}}}
}

func TestPlanAdapterPreservesSourceAndScopedUnknown(t *testing.T) {
	in := planFixture()
	out, err := adaptPlanContact(in)
	if err != nil {
		t.Fatal(err)
	}
	var before, after any
	_ = json.Unmarshal(in.RawContact, &before)
	_ = json.Unmarshal(out.Contact, &after)
	if !json.Valid(out.SourcePayload) {
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
	_ = json.Unmarshal(out.Contact, &raw)
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
