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
	return views.Index(views.HomeView{Title: "Об Airlock — Wikibot", Question: summary.DefaultQuestion}).Render(r.Context(), w)
}
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) error {
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Не удалось прочитать вопрос.", http.StatusBadRequest)
		return nil
	}
	question := r.PostForm.Get("question")
	result, e := h.s.Get(r.Context(), question)
	v := views.HomeView{Title: "Об Airlock — Wikibot", Ready: result.Ready, Message: result.Message, FetchedAt: result.FetchedAt, Question: question}
	if e != nil {
		v.Message = e.Error()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(v).Render(r.Context(), w)
}
