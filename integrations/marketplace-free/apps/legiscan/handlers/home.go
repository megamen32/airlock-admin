package handlers

import (
	"agent/analysis"
	"agent/views"
	"fmt"
	"net/http"
)

type Handler struct{ s *analysis.Service }

func New(s *analysis.Service) *Handler { return &Handler{s: s} }
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	result, e := h.s.Get()
	v := views.HomeView{Ready: e == nil, Section: r.URL.Query().Get("section")}
	if e != nil {
		v.Error = e.Error()
	} else {
		v.Summary = result.Summary
		v.Parties = result.Parties
		v.ContractType = result.ContractTypeLabel
		if result.SecurityScore != nil {
			v.Score = fmt.Sprint(*result.SecurityScore)
		}
		counts := []int{len(result.Risks), len(result.Gaps), len(result.ProtectiveClauses), len(result.LawChecks)}
		names := []string{"Риски", "Пробелы", "Защитные пункты", "Проверка норм"}
		sections := []string{"risks", "gaps", "protectiveClauses", "lawChecks"}
		if v.Section != "gaps" && v.Section != "protectiveClauses" && v.Section != "lawChecks" {
			v.Section = "risks"
		}
		for i, s := range sections {
			v.Tabs = append(v.Tabs, views.Tab{Name: names[i], Section: s, URL: "/?section=" + s, Count: counts[i], Active: v.Section == s})
		}
		v.Total = len(result.Risks)
		for _, x := range result.Risks {
			switch x.Type {
			case "high":
				v.High++
			case "medium":
				v.Medium++
			case "low":
				v.Low++
			}
		}
		switch v.Section {
		case "risks":
			for i, x := range result.Risks {
				level, class := "Уровень не указан", "badge-ghost"
				switch x.Type {
				case "high":
					level = "Высокий"
					class = "badge-error"
				case "medium":
					level = "Средний"
					class = "badge-warning"
				case "low":
					level = "Низкий"
					class = "badge-info"
				}
				v.Findings = append(v.Findings, views.Finding{Number: fmt.Sprintf("%02d", i+1), Title: x.Title, Description: x.Description, Recommendation: x.Recommendation, Quote: x.Quote, Reference: x.ParagraphNumber, Level: level, Class: class})
			}
		case "gaps":
			for i, x := range result.Gaps {
				v.Findings = append(v.Findings, views.Finding{Number: fmt.Sprintf("%02d", i+1), Title: x.Title, Description: x.Description, Recommendation: x.Suggestion})
			}
		case "protectiveClauses":
			for i, x := range result.ProtectiveClauses {
				v.Findings = append(v.Findings, views.Finding{Number: fmt.Sprintf("%02d", i+1), Title: x.Title, Description: x.Description, Example: x.Example})
			}
		case "lawChecks":
			for i, x := range result.LawChecks {
				level, class := "Статус не указан", "badge-ghost"
				switch x.Status {
				case "noncompliant":
					level = "Есть замечание"
					class = "badge-error"
				case "compliant":
					level = "Соответствует"
					class = "badge-success"
				case "unclear":
					level = "Нужна проверка"
					class = "badge-warning"
				}
				v.Findings = append(v.Findings, views.Finding{Number: fmt.Sprintf("%02d", i+1), Title: x.Requirement, Description: x.Note, Recommendation: x.Recommendation, Quote: x.EvidenceQuote, Reference: x.Article, Level: level, Class: class})
			}
		}
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(v).Render(r.Context(), w)
}
func (h *Handler) Document(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Document(analysis.Contract).Render(r.Context(), w)
}
func (h *Handler) Download(w http.ResponseWriter, _ *http.Request) error {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="airlock-demo-contract.txt"`)
	_, e := w.Write([]byte(analysis.Contract))
	return e
}
func (h *Handler) Report(w http.ResponseWriter, _ *http.Request) error {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="legiscan-analysis.json"`)
	_, e := w.Write(analysis.RawReport)
	return e
}
