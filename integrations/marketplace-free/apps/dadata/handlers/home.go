// Package handlers holds the HTTP handlers for the agent's templ pages.
// In the MVC split: domain packages own data and business logic (model);
// templ files + view-model types under views/ own presentation (view);
// this package wires them together by converting domain types to view-
// model types and rendering (controller). Handlers may import any domain
// package and views; nothing here imports back out, so no cycle forms.
//
// Add a handler per page or partial: HomeHandler, BoardHandler, etc.
// Register bound methods from main.go via agent.RegisterRoute.
package handlers

import (
	"net/http"

	"agent/company"
	"agent/views"
)

// Handler owns the HTTP handlers. Add a package-local Deps struct and accept it
// in New when handlers need services from a domain package.
type Handler struct{ service *company.Service }

// New constructs the HTTP handler set.
func New(service *company.Service) *Handler {
	return &Handler{service: service}
}

// Home renders the default placeholder homepage. The view-model is
// constructed inline because there's no domain yet; replace this with
// a converter from your own data once you add a real model.
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	view := views.HomeView{Title: "Проверка компаний — DaData", Subtitle: "Найдите одну компанию по ИНН или ОГРН. Источник данных — DaData.", Examples: nil}
	return views.Index(view).Render(r.Context(), w)
}

func (h *Handler) Lookup(w http.ResponseWriter, r *http.Request) error {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Некорректный запрос.", http.StatusBadRequest)
		return nil
	}
	identifier := r.FormValue("identifier")
	out, err := h.service.Find(r.Context(), identifier)
	result := views.LookupView{Identifier: identifier, Source: "DaData", LookedUpAt: out.FetchedAt}
	if err != nil {
		result.Message = err.Error()
	} else {
		result.Found = out.Found
		if !out.Found {
			result.Message = "Компания не найдена в ответе DaData."
		}
		result.Name, result.INN, result.OGRN, result.Status, result.Address, result.OKVED = out.Name, out.INN, out.OGRN, out.Status, out.Address, out.OKVED
	}
	return views.LookupResult(result).Render(r.Context(), w)
}
