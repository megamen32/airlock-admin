package main

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
	"github.com/google/uuid"
)

func crmReceiptTool(call func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool {
	definition := tool.Typed[CRMReceiptReadRequest, *agentsdk.MCPToolCallResponse]("get_crm_import_receipt").Description("Прочитать исходную неизменяемую квитанцию CRM операции; требуется backend crm_import_read").Execute(func(ctx context.Context, in CRMReceiptReadRequest) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		if in.Operation.Kind == "" {
			in.Operation.Kind = "import_link"
		}
		return call(ctx, "get_crm_import_receipt", in)
	}).Build()
	definition.InputSchema = crmReceiptReadSchema
	return definition
}
func crmLinkTool(call func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool {
	definition := tool.Typed[CRMExternalIdentity, *agentsdk.MCPToolCallResponse]("get_crm_link").Description("Прочитать текущую внешнюю CRM связь и доступность native reference; требуется backend crm_import_read").Execute(func(ctx context.Context, in CRMExternalIdentity) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		return call(ctx, "get_crm_link", in)
	}).Build()
	definition.InputSchema = crmLinkReadSchema
	return definition
}

func crmImportTool(call func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool {
	definition := tool.Typed[CRMContactEnvelope, *agentsdk.MCPToolCallResponse]("import_crm_entity").Description("Сохранить versioned CRM observation и явную existing Lead связь; не создаёт контакт, не генерирует и не отправляет. Требуется crm_import_write.").Execute(func(ctx context.Context, in CRMContactEnvelope) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		if in.SchemaVersion == "" {
			in.SchemaVersion = crmEnvelopeVersion
		}
		if in.Operation.Kind == "" {
			in.Operation.Kind = "import_link"
		}
		if in.SourceRefs == nil {
			in.SourceRefs = []string{}
		}
		if in.SourcePayload == nil {
			in.SourcePayload = map[string]any{}
		}
		if in.History == nil {
			in.History = []CRMHistoryObservation{}
		}
		for i := range in.History {
			if in.History[i].EvidenceRefs == nil {
				in.History[i].EvidenceRefs = []string{}
			}
		}
		if in.NativeReference != nil && in.NativeReference.ObjectType == "" {
			in.NativeReference.ObjectType = "lead"
		}
		if in.SchemaVersion != crmEnvelopeVersion || in.SendAllowed || in.Operation.Kind != "import_link" || in.ExpectedLinkRevision < 0 || int64(in.ExpectedLinkRevision) > 2147483647 {
			return nil, errors.New("invalid CRM import contract")
		}
		if _, err := uuid.Parse(in.Operation.IdempotencyKey); err != nil {
			return nil, errors.New("operation UUID required")
		}
		if in.Experiment != nil && (in.Experiment.ActualAssigned || in.Experiment.Exposure != 0) {
			return nil, errors.New("CRM import cannot assign/expose experiment")
		}
		raw, err := json.Marshal(in)
		if err != nil || len(raw) > 32768 {
			return nil, errors.New("CRM import exceeds32KiB")
		}
		return call(ctx, "import_crm_entity", in)
	}).Build()
	definition.InputSchema = crmImportSchema
	return definition
}
