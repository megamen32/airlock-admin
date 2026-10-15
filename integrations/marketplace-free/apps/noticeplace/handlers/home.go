package handlers

import (
	"agent/summary"
	"agent/views"
	"net/http"
)

type Handler struct{ s *summary.Service }

func New(s *summary.Service) *Handler { return &Handler{s: s} }
func (h *Handler) render(w http.ResponseWriter, r *http.Request, x summary.Result) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	return views.Index(views.HomeView{Result: x}).Render(r.Context(), w)
}
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	x, e := h.s.Status(r.Context())
	if e != nil {
		x.Message = e.Error()
	}
	return h.render(w, r, x)
}
func (h *Handler) Send(w http.ResponseWriter, r *http.Request) error {
	x, e := h.s.Send(r.Context())
	if e != nil {
		x.Message = e.Error()
	}
	return h.render(w, r, x)
}
