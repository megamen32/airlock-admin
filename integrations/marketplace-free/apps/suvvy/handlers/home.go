package handlers

import (
	"agent/views"
	"agent/workflow"
	"net/http"
)

type Handler struct{ s *workflow.Service }

func New(s *workflow.Service) *Handler { return &Handler{s: s} }
func (h *Handler) render(w http.ResponseWriter, r *http.Request, x workflow.Result) error {
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
func (h *Handler) Ask(w http.ResponseWriter, r *http.Request) error {
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	if e := r.ParseForm(); e != nil {
		w.WriteHeader(400)
		return nil
	}
	x, e := h.s.Ask(r.Context(), r.FormValue("question"))
	if e != nil {
		x.State = "unavailable"
		x.Message = e.Error()
	}
	return h.render(w, r, x)
}
