package main

import "encoding/json"

// crmEnvelopeVersion identifies this adapter proposal. It is not an advertised
// AFC capability until the owning backend accepts the same wire contract.
const crmEnvelopeVersion = "autogram.crm.v1"

type CRMExternalIdentity struct {
	OwnerID          string `json:"owner_id"`
	ConnectionID     string `json:"connection_id"`
	SourceInstance   string `json:"source_instance"`
	ObjectType       string `json:"object_type"`
	ExternalObjectID string `json:"external_object_id"`
}

type CRMSourceVersion struct {
	Revision           string `json:"revision"`
	ObservedAt         string `json:"observed_at"`
	PayloadFingerprint string `json:"payload_fingerprint"`
}

// Operation identity is independent of source revision. The receiver must
// persist an immutable receipt; this adapter does not simulate that storage.
type CRMOperationIdentity struct {
	OwnerID        string `json:"owner_id"`
	ConnectionID   string `json:"connection_id"`
	Kind           string `json:"kind"`
	IdempotencyKey string `json:"idempotency_key"`
}

type CRMHistoryObservation struct {
	Status             string          `json:"status"`
	AccountRef         string          `json:"account_ref"`
	ConversationID     string          `json:"conversation_id,omitempty"`
	ObservedAt         string          `json:"observed_at"`
	Partial            bool            `json:"partial"`
	Fresh              bool            `json:"fresh"`
	Exhausted          bool            `json:"exhausted"`
	TeamHistoryChecked bool            `json:"team_history_checked"`
	EvidenceRefs       []string        `json:"evidence_refs"`
	Coverage           json.RawMessage `json:"coverage"`
}

type CRMExperimentProposal struct {
	ExperimentID   string `json:"experiment_id"`
	UnitID         string `json:"unit_id"`
	ArmID          string `json:"arm_id"`
	Seed           string `json:"seed"`
	ConfigRevision string `json:"config_revision"`
	ActualAssigned bool   `json:"actual_assigned"`
	Exposure       int    `json:"exposure"`
}

type CRMDraftReference struct {
	DraftID        string `json:"draft_id"`
	NativeRevision *int   `json:"native_revision,omitempty"`
	State          string `json:"state"`
}

type CRMContactEnvelope struct {
	SchemaVersion               string                  `json:"schema_version"`
	Identity                    CRMExternalIdentity     `json:"identity"`
	SourceVersion               CRMSourceVersion        `json:"source_version"`
	Operation                   *CRMOperationIdentity   `json:"operation,omitempty"`
	OperationPayloadFingerprint string                  `json:"operation_payload_fingerprint,omitempty"`
	SourceRefs                  []string                `json:"source_refs"`
	Contact                     json.RawMessage         `json:"contact"`
	SourcePayload               json.RawMessage         `json:"source_payload"`
	History                     []CRMHistoryObservation `json:"history"`
	Experiment                  *CRMExperimentProposal  `json:"experiment,omitempty"`
	Draft                       *CRMDraftReference      `json:"draft,omitempty"`
	SendAllowed                 bool                    `json:"send_allowed"`
}

// The backend owns durable operation receipts. No adapter code synthesizes an
// applied outcome, native ID, revision, or receipt ID from a source snapshot.
type CRMOutcome string

const (
	CRMOutcomeAccepted       CRMOutcome = "accepted"
	CRMOutcomeAlreadyApplied CRMOutcome = "already-applied"
	CRMOutcomeConflict       CRMOutcome = "conflict"
	CRMOutcomeUnlinked       CRMOutcome = "unlinked"
	CRMOutcomeRejected       CRMOutcome = "rejected"
	CRMOutcomeUnknown        CRMOutcome = "unknown"
)

type CRMNativeReference struct {
	ObjectType string `json:"object_type"`
	ObjectID   string `json:"object_id"`
	Revision   *int   `json:"revision,omitempty"`
}

type CRMOperationReceipt struct {
	Operation             CRMOperationIdentity `json:"operation"`
	PayloadFingerprint    string               `json:"payload_fingerprint"`
	Outcome               CRMOutcome           `json:"outcome"`
	ReceiptID             string               `json:"receipt_id"`
	NativeReference       *CRMNativeReference  `json:"native_reference,omitempty"`
	OriginalSourceVersion CRMSourceVersion     `json:"original_source_version"`
}
