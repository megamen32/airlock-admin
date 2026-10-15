package handlers

import (
	"agent/views"
	"agent/workflow"
	"encoding/json"
	"io"
	"net/http"
)

type Handler struct{ s *workflow.Service }

func New(s *workflow.Service) *Handler { return &Handler{s: s} }
func (h *Handler) render(w http.ResponseWriter, r *http.Request, result workflow.Result) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	return views.Index(views.HomeView{Result: result}).Render(r.Context(), w)
}
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	x, e := h.s.Status(r.Context())
	if e != nil {
		x.Message = e.Error()
	}
	return h.render(w, r, x)
}
func (h *Handler) Run(w http.ResponseWriter, r *http.Request) error {
	x, e := h.s.Run(r.Context())
	if e != nil {
		x.State = "unavailable"
		x.Message = e.Error()
	}
	return h.render(w, r, x)
}
func (h *Handler) Configure(w http.ResponseWriter, r *http.Request) error {
	var in struct {
		TesterID string `json:"tester_id"`
	}
	d := json.NewDecoder(io.LimitReader(r.Body, 1025))
	d.DisallowUnknownFields()
	if d.Decode(&in) != nil {
		w.WriteHeader(400)
		return nil
	}
	var extra any
	if d.Decode(&extra) != io.EOF {
		w.WriteHeader(400)
		return nil
	}
	if e := h.s.Configure(r.Context(), in.TesterID); e != nil {
		w.WriteHeader(409)
		return nil
	}
	w.WriteHeader(204)
	return nil
}
