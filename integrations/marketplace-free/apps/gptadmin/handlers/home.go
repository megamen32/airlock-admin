package handlers

import (
	"agent/summary"
	"agent/views"
	"net/http"
)

type Handler struct{ s *summary.Service }

func New(s *summary.Service) *Handler { return &Handler{s: s} }
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(views.HomeView{}).Render(r.Context(), w)
}
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) error {
	result, e := h.s.Get(r.Context())
	if e != nil {
		result.Message = e.Error()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(views.HomeView{Result: result}).Render(r.Context(), w)
}
