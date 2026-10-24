package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"strings"
	"time"
	"unicode/utf8"
)

// PlanAdapterInput is specific to the optional Plan adapter. Generic identities
// and envelopes have no mandatory Plan project IDs or source-unit grammar.
type PlanAdapterInput struct {
	OwnerID, ConnectionID, SourceInstance             string
	ProjectID, SourceContactKey, Revision, ObservedAt string
	RawContact                                        json.RawMessage
	RawProject                                        json.RawMessage
	SourceRefs                                        []string
	History                                           []CRMHistoryObservation
	Experiment                                        *CRMExperimentProposal
	Draft                                             *CRMDraftReference
	OperationID                                       string
	ExpectedLinkRevision                              int
	NativeReference                                   *CRMNativeReference
}

func adaptPlanContact(in PlanAdapterInput) (CRMContactEnvelope, error) {
	empty := CRMContactEnvelope{}
	if in.OwnerID == "" || in.ConnectionID == "" || in.SourceInstance == "" || in.ProjectID == "" || in.Revision == "" {
		return empty, errors.New("missing explicit source identity/version")
	}
	if _, err := time.Parse(time.RFC3339Nano, in.ObservedAt); err != nil {
		return empty, errors.New("invalid source observation time")
	}
	var project struct {
		ID string `json:"id"`
	}
	if json.Unmarshal(in.RawProject, &project) != nil || project.ID != in.ProjectID {
		return empty, errors.New("raw source project identity mismatch")
	}
	if !json.Valid(in.RawContact) || string(in.RawContact) == "null" {
		return empty, errors.New("missing raw source contact")
	}
	var contact map[string]json.RawMessage
	if json.Unmarshal(in.RawContact, &contact) != nil || contact == nil {
		return empty, errors.New("source contact must be an object")
	}
	prefix := "airlockplan:" + in.ProjectID + ":"
	if !strings.HasPrefix(in.SourceContactKey, prefix) || len(in.SourceContactKey) == len(prefix) {
		return empty, errors.New("contact key belongs to a different Plan project")
	}
	for _, h := range in.History {
		if h.Status != "CONTACTED" && h.Status != "UNKNOWN" && h.Status != "NO_CONTACT_IN_SCOPE" {
			return empty, errors.New("unsupported history observation status")
		}
		if h.AccountRef == "" || h.ObservedAt == "" || h.Coverage == nil {
			return empty, errors.New("history observation requires explicit account/time/coverage")
		}
	}
	if in.Experiment != nil && (in.Experiment.ActualAssigned || in.Experiment.Exposure != 0) {
		return empty, errors.New("Plan adapter only prepares unexposed experiment proposals")
	}
	if in.Draft != nil && in.Draft.DraftID == "" {
		return empty, errors.New("draft reference requires actual native draft ID")
	}
	sourceBytes, err := json.Marshal(struct {
		Project json.RawMessage `json:"project"`
		Contact json.RawMessage `json:"contact"`
	}{in.RawProject, in.RawContact})
	if err != nil {
		return empty, err
	}
	digest := sha256.Sum256(sourceBytes)
	opID, err := uuid.Parse(in.OperationID)
	if err != nil || opID.String() != in.OperationID {
		return empty, errors.New("explicit canonical operation UUID required")
	}
	if in.ExpectedLinkRevision < 0 || int64(in.ExpectedLinkRevision) > 2147483647 {
		return empty, errors.New("invalid expected link revision")
	}
	if in.NativeReference != nil && (in.NativeReference.ObjectType != "lead" || in.NativeReference.ObjectID < 1 || int64(in.NativeReference.ObjectID) > 2147483647) {
		return empty, errors.New("native reference must be explicit existing owner lead int4")
	}
	var rawProject map[string]json.RawMessage
	_ = json.Unmarshal(in.RawProject, &rawProject)
	if _, exists := rawProject["_airlock_plan_adapter"]; exists {
		return empty, errors.New("reserved adapter provenance collision")
	}
	provenance, _ := json.Marshal(struct {
		Contact json.RawMessage    `json:"contact"`
		Draft   *CRMDraftReference `json:"stored_draft_reference,omitempty"`
	}{in.RawContact, in.Draft})
	rawProject["_airlock_plan_adapter"] = provenance
	sourcePayloadBytes, _ := json.Marshal(rawProject)
	var sourcePayload map[string]any
	decoder := json.NewDecoder(bytes.NewReader(sourcePayloadBytes))
	decoder.UseNumber()
	if err := decoder.Decode(&sourcePayload); err != nil {
		return empty, err
	}
	textField := func(values map[string]json.RawMessage, name string) string {
		var value string
		_ = json.Unmarshal(values[name], &value)
		return value
	}
	typedContact := CRMContact{FullName: textField(contact, "person"), Company: textField(rawProject, "name"), Role: textField(contact, "role")}
	for _, v := range []string{typedContact.FullName, typedContact.Company, typedContact.Role} {
		if utf8.RuneCountInString(v) > 160 {
			return empty, errors.New("source contact exceeds typed CRM field bound")
		}
	}
	refs := in.SourceRefs
	if refs == nil {
		refs = []string{}
	}
	history := append([]CRMHistoryObservation{}, in.History...)
	for i := range history {
		if history[i].EvidenceRefs == nil {
			history[i].EvidenceRefs = []string{}
		}
	}

	// Deep-copy the envelope so subsequent edits to caller-owned arrays/JSON cannot
	// alter this source observation. No native IDs or operation receipts are minted.
	out := CRMContactEnvelope{SchemaVersion: crmEnvelopeVersion, Identity: CRMExternalIdentity{"airlock_plan", in.ConnectionID, in.SourceInstance, "source_contact", in.SourceContactKey}, SourceVersion: CRMSourceVersion{in.Revision, in.ObservedAt, hex.EncodeToString(digest[:])}, Operation: CRMOperationIdentity{"import_link", in.OperationID}, ExpectedLinkRevision: in.ExpectedLinkRevision, Contact: typedContact, SourceRefs: refs, SourcePayload: sourcePayload, History: history, Experiment: in.Experiment, NativeReference: in.NativeReference, SendAllowed: false}

	raw, err := json.Marshal(out)
	if err != nil {
		return empty, err
	}
	if len(raw) > 32768 || len(refs) > 20 || len(history) > 20 {
		return empty, errors.New("CRM observation exceeds bounded contract")
	}
	var tree any
	_ = json.Unmarshal(raw, &tree)
	var depthOK func(any, int) bool
	depthOK = func(v any, depth int) bool {
		if depth > 8 {
			return false
		}
		switch value := v.(type) {
		case map[string]any:
			for _, child := range value {
				if !depthOK(child, depth+1) {
					return false
				}
			}
		case []any:
			for _, child := range value {
				if !depthOK(child, depth+1) {
					return false
				}
			}
		}
		return true
	}
	if !depthOK(tree, 0) {
		return empty, errors.New("CRM observation exceeds depth8")
	}
	var snapshot CRMContactEnvelope
	snapshotDecoder := json.NewDecoder(bytes.NewReader(raw))
	snapshotDecoder.UseNumber()
	err = snapshotDecoder.Decode(&snapshot)
	return snapshot, err
}

// planCRMSource is also the exact current-link read selector.
func planCRMSource(envelope CRMContactEnvelope) (CRMExternalIdentity, error) {
	if envelope.SchemaVersion != crmEnvelopeVersion || envelope.Identity.System != "airlock_plan" || envelope.Identity.SourceInstance == "" || envelope.Identity.ObjectType != "source_contact" || !strings.HasPrefix(envelope.Identity.ExternalObjectID, "airlockplan:") {
		return CRMExternalIdentity{}, errors.New("not a qualified Plan source observation")
	}
	return envelope.Identity, nil
}
