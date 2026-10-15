package analysis

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
)

// The original provider result is deliberately public: the input is fictional.
// No credentials or original account documents are embedded in the app.
//
//go:embed resources/report.json
var RawReport []byte

//go:embed resources/contract.txt
var Contract string

type Risk struct {
	Type            string `json:"type"`
	Title           string `json:"title"`
	Quote           string `json:"quote"`
	ParagraphNumber string `json:"paragraphNumber"`
	Description     string `json:"description"`
	Recommendation  string `json:"recommendation"`
}
type Gap struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Suggestion  string `json:"suggestion"`
}
type Clause struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Example     string `json:"example"`
}
type LawCheck struct {
	Article        string `json:"article"`
	Requirement    string `json:"requirement"`
	Status         string `json:"status"`
	EvidenceQuote  string `json:"evidenceQuote"`
	Note           string `json:"note"`
	Recommendation string `json:"recommendation"`
}
type Report struct {
	Parties           []string   `json:"parties"`
	SecurityScore     *int       `json:"securityScore"`
	Summary           string     `json:"summary"`
	ContractTypeLabel string     `json:"contractTypeLabel"`
	Risks             []Risk     `json:"risks"`
	Gaps              []Gap      `json:"gaps"`
	ProtectiveClauses []Clause   `json:"protectiveClauses"`
	LawChecks         []LawCheck `json:"lawChecks"`
}
type Input struct {
	Section string `json:"section,omitempty" jsonschema:"Read overview, risks, gaps, protectiveClauses or lawChecks"`
	Offset  int    `json:"offset,omitempty" jsonschema:"Zero-based index within the selected section"`
	Limit   int    `json:"limit,omitempty" jsonschema:"Number of items, default 5, maximum 8"`
}
type Counts struct {
	Risks             int `json:"risks"`
	Gaps              int `json:"gaps"`
	ProtectiveClauses int `json:"protectiveClauses"`
	LawChecks         int `json:"lawChecks"`
}
type ToolResult struct {
	Ready              bool       `json:"ready"`
	Message            string     `json:"message,omitempty"`
	Provider           string     `json:"provider"`
	CapturedDate       string     `json:"captured_date"`
	NewAnalysisStarted bool       `json:"new_analysis_started"`
	DocumentURL        string     `json:"document_url"`
	WebURL             string     `json:"web_url"`
	Section            string     `json:"section"`
	Offset             int        `json:"offset"`
	Total              int        `json:"total"`
	HasMore            bool       `json:"has_more"`
	Counts             Counts     `json:"counts"`
	Parties            []string   `json:"parties,omitempty"`
	SecurityScore      *int       `json:"securityScore,omitempty"`
	Summary            string     `json:"summary,omitempty"`
	Risks              []Risk     `json:"risks,omitempty"`
	Gaps               []Gap      `json:"gaps,omitempty"`
	ProtectiveClauses  []Clause   `json:"protectiveClauses,omitempty"`
	LawChecks          []LawCheck `json:"lawChecks,omitempty"`
}
type Service struct{}

func New() *Service { return &Service{} }
func (s *Service) Get() (Report, error) {
	var v struct {
		Result Report `json:"result"`
	}
	if json.Unmarshal(RawReport, &v) != nil || v.Result.Summary == "" || len(v.Result.Risks) == 0 {
		return Report{}, errors.New("Сохранённый разбор Legiscan недоступен. Новая обработка не запускалась.")
	}
	return v.Result, nil
}
func page[T any](v []T, offset, limit int) ([]T, bool) {
	if offset >= len(v) {
		return nil, false
	}
	end := offset + limit
	if end > len(v) {
		end = len(v)
	}
	return v[offset:end], end < len(v)
}
func (s *Service) Tool(_ context.Context, in Input) (ToolResult, error) {
	out := ToolResult{Provider: "Legiscan", CapturedDate: "15 октября 2026", DocumentURL: "https://d88-legiscan-contract.demo.airlockrun.ru/document", WebURL: "https://d88-legiscan-contract.demo.airlockrun.ru/", Section: in.Section, Offset: in.Offset}
	r, e := s.Get()
	if e != nil {
		out.Message = e.Error()
		return out, nil
	}
	if in.Offset < 0 {
		out.Message = "Смещение должно быть неотрицательным."
		return out, nil
	}
	if in.Limit <= 0 {
		in.Limit = 5
	}
	if in.Limit > 8 {
		in.Limit = 8
	}
	out.Counts = Counts{len(r.Risks), len(r.Gaps), len(r.ProtectiveClauses), len(r.LawChecks)}
	switch in.Section {
	case "", "overview":
		out.Section = "overview"
		out.Parties = r.Parties
		out.SecurityScore = r.SecurityScore
		out.Summary = r.Summary
		out.Risks, out.HasMore = page(r.Risks, 0, 3)
		out.Total = len(r.Risks)
		out.Offset = 0
	case "risks":
		out.Risks, out.HasMore = page(r.Risks, in.Offset, in.Limit)
		out.Total = len(r.Risks)
	case "gaps":
		out.Gaps, out.HasMore = page(r.Gaps, in.Offset, in.Limit)
		out.Total = len(r.Gaps)
	case "protectiveClauses":
		out.ProtectiveClauses, out.HasMore = page(r.ProtectiveClauses, in.Offset, in.Limit)
		out.Total = len(r.ProtectiveClauses)
	case "lawChecks":
		out.LawChecks, out.HasMore = page(r.LawChecks, in.Offset, in.Limit)
		out.Total = len(r.LawChecks)
	default:
		out.Message = "Выберите overview, risks, gaps, protectiveClauses или lawChecks."
		return out, nil
	}
	out.Ready = true
	return out, nil
}
