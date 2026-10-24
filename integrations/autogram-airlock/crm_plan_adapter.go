package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"
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
		if h.AccountRef == "" || h.ObservedAt == "" || !json.Valid(h.Coverage) {
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
	// Deep-copy the envelope so subsequent edits to caller-owned arrays/JSON cannot
	// alter this source observation. No native IDs or operation receipts are minted.
	out := CRMContactEnvelope{SchemaVersion: crmEnvelopeVersion, Identity: CRMExternalIdentity{in.OwnerID, in.ConnectionID, in.SourceInstance, "source_contact", in.SourceContactKey}, SourceVersion: CRMSourceVersion{in.Revision, in.ObservedAt, hex.EncodeToString(digest[:])}, SourceRefs: in.SourceRefs, Contact: in.RawContact, SourcePayload: in.RawProject, History: in.History, Experiment: in.Experiment, Draft: in.Draft, SendAllowed: false}
	raw, err := json.Marshal(out)
	if err != nil {
		return empty, err
	}
	var snapshot CRMContactEnvelope
	err = json.Unmarshal(raw, &snapshot)
	return snapshot, err
}
