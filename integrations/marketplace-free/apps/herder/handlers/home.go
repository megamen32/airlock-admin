package handlers

import (
	"agent/summary"
	"agent/views"
	"net/http"
)

type Handler struct{ s *summary.Service }

func New(s *summary.Service) *Handler { return &Handler{s} }
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	v, e := h.s.Status(r.Context())
	if e != nil {
		v.Message = e.Error()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(views.HomeView{Result: v}).Render(r.Context(), w)
}
func (h *Handler) Start(w http.ResponseWriter, r *http.Request) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1024)
	if r.ParseForm() != nil {
		http.Error(w, "Некорректный запрос", 400)
		return nil
	}
	v, e := h.s.Start(r.Context(), r.FormValue("template"))
	if e != nil {
		v.Message = e.Error()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(views.HomeView{Result: v}).Render(r.Context(), w)
}
