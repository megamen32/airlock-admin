package main

import (
	"bytes"
	"encoding/json"
)

const crmEnvelopeVersion = "autogram.crm.v1"

// Exact owner-authenticated AFC v1 wire. Owner is never supplied in JSON.
type CRMExternalIdentity struct {
	System           string `json:"system" pattern:"^[a-z0-9_-]+$" minLength:"1" maxLength:"64"`
	ConnectionID     string `json:"connection_id" minLength:"1" maxLength:"128"`
	SourceInstance   string `json:"source_instance" minLength:"1" maxLength:"256"`
	ObjectType       string `json:"object_type" minLength:"1" maxLength:"64"`
	ExternalObjectID string `json:"external_object_id" minLength:"1" maxLength:"256"`
}
type CRMSourceVersion struct {
	Revision           string `json:"revision" minLength:"1" maxLength:"128"`
	ObservedAt         string `json:"observed_at" format:"date-time"`
	PayloadFingerprint string `json:"payload_fingerprint,omitempty"`
}
type CRMOperationIdentity struct {
	Kind           string `json:"kind" enum:"import_link"`
	IdempotencyKey string `json:"idempotency_key" format:"uuid"`
}
type CRMContact struct {
	FullName string `json:"full_name" maxLength:"160"`
	Company  string `json:"company" maxLength:"160"`
	Role     string `json:"role" maxLength:"160"`
	Notes    string `json:"notes" maxLength:"4000"`
}
type CRMHistoryObservation struct {
	Status             string         `json:"status" enum:"CONTACTED,UNKNOWN,NO_CONTACT_IN_SCOPE"`
	AccountRef         string         `json:"account_ref" minLength:"1" maxLength:"256"`
	ConversationID     string         `json:"conversation_id,omitempty" maxLength:"256"`
	ObservedAt         string         `json:"observed_at" format:"date-time"`
	Partial            bool           `json:"partial"`
	Fresh              bool           `json:"fresh"`
	Exhausted          bool           `json:"exhausted"`
	TeamHistoryChecked bool           `json:"team_history_checked"`
	EvidenceRefs       []string       `json:"evidence_refs" maxItems:"20"`
	Coverage           map[string]any `json:"coverage"`
}
type CRMExperimentProposal struct {
	ExperimentID   string `json:"experiment_id" minLength:"1" maxLength:"128"`
	UnitID         string `json:"unit_id" minLength:"1" maxLength:"256"`
	ArmID          string `json:"arm_id" minLength:"1" maxLength:"128"`
	Seed           string `json:"seed" minLength:"1" maxLength:"128"`
	ConfigRevision string `json:"config_revision" minLength:"1" maxLength:"128"`
	ActualAssigned bool   `json:"actual_assigned"`
	Exposure       int    `json:"exposure"`
}

// Draft references are local adapter evidence, not a v1 import field.
type CRMDraftReference struct {
	DraftID        string `json:"draft_id"`
	NativeRevision *int   `json:"native_revision,omitempty"`
	State          string `json:"state"`
}
type CRMNativeReference struct {
	ObjectType string `json:"object_type" enum:"lead"`
	ObjectID   int    `json:"object_id" minimum:"1" maximum:"2147483647"`
}
type CRMContactEnvelope struct {
	SchemaVersion        string                  `json:"schema_version" enum:"autogram.crm.v1"`
	Identity             CRMExternalIdentity     `json:"identity"`
	SourceVersion        CRMSourceVersion        `json:"source_version"`
	Operation            CRMOperationIdentity    `json:"operation"`
	ExpectedLinkRevision int                     `json:"expected_link_revision" minimum:"0" maximum:"2147483647"`
	Contact              CRMContact              `json:"contact"`
	SourceRefs           []string                `json:"source_refs" maxItems:"20"`
	SourcePayload        map[string]any          `json:"source_payload"`
	History              []CRMHistoryObservation `json:"history" maxItems:"20"`
	Experiment           *CRMExperimentProposal  `json:"experiment"`
	NativeReference      *CRMNativeReference     `json:"native_reference"`
	SendAllowed          bool                    `json:"send_allowed"`
}
type CRMReceiptReadRequest struct {
	System         string               `json:"system" pattern:"^[a-z0-9_-]+$" minLength:"1" maxLength:"64"`
	ConnectionID   string               `json:"connection_id" minLength:"1" maxLength:"128"`
	SourceInstance string               `json:"source_instance" minLength:"1" maxLength:"256"`
	Operation      CRMOperationIdentity `json:"operation"`
}
type CRMOutcome string

const (
	CRMOutcomeAccepted       CRMOutcome = "accepted"
	CRMOutcomeAlreadyApplied CRMOutcome = "already-applied"
	CRMOutcomeConflict       CRMOutcome = "conflict"
	CRMOutcomeUnlinked       CRMOutcome = "unlinked"
	CRMOutcomeRejected       CRMOutcome = "rejected"
	CRMOutcomeUnknown        CRMOutcome = "unknown"
)

// Original immutable receipt and current link remain separate read operations.
type CRMOperationReceipt struct {
	SchemaVersion         string               `json:"schema_version"`
	ReceiptID             string               `json:"receipt_id"`
	Identity              CRMExternalIdentity  `json:"identity"`
	Operation             CRMOperationIdentity `json:"operation"`
	Outcome               CRMOutcome           `json:"outcome"`
	Reason                *string              `json:"reason"`
	OriginalSourceVersion CRMSourceVersion     `json:"original_source_version"`
	Snapshot              json.RawMessage      `json:"snapshot"`
	NativeContactCreated  bool                 `json:"native_contact_created"`
	Generated             bool                 `json:"generated"`
	SendAllowed           bool                 `json:"send_allowed"`
	Replayed              bool                 `json:"replayed,omitempty"`
}

// Preserve the backend default even when a caller omits partial in a read-typed
// input; explicit false remains false. No status/negative evidence is inferred.
func (h *CRMHistoryObservation) UnmarshalJSON(raw []byte) error {
	type observation CRMHistoryObservation
	value := observation{Partial: true}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	if err := decoder.Decode(&value); err != nil {
		return err
	}
	*h = CRMHistoryObservation(value)
	return nil
}

// tool.Typed calls json.Unmarshal before forwarding. Preserve numbers in every
// untyped JSON subtree here as well as in the optional Plan adapter.
func (envelope *CRMContactEnvelope) UnmarshalJSON(raw []byte) error {
	type plainEnvelope CRMContactEnvelope
	var value plainEnvelope
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	if err := decoder.Decode(&value); err != nil {
		return err
	}
	*envelope = CRMContactEnvelope(value)
	return nil
}
