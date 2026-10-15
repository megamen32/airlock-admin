package handlers

import (
	"agent/summary"
	"agent/views"
	"net/http"
	"time"
)

type Handler struct{ s *summary.Service }

func New(s *summary.Service) *Handler                                   { return &Handler{s: s} }
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error    { return h.render(w, r) }
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) error { return h.render(w, r) }
func (h *Handler) render(w http.ResponseWriter, r *http.Request) error {
	result, e := h.s.Get(r.Context())
	v := views.HomeView{Ready: result.Ready, Message: result.Message}
	if e != nil {
		v.Message = "Сейчас Beorg не отвечает. Попробуйте проверить результат немного позже."
	}
	for _, f := range result.Fields {
		v.Fields = append(v.Fields, views.FieldView{Name: f.Name, Value: f.Value})
		if f.Value == "" {
			v.Missing++
		} else {
			v.Recognized++
		}
	}
	for _, i := range result.Items {
		v.Items = append(v.Items, views.ItemView{Name: i.Name, Quantity: i.Quantity, UnitPrice: i.UnitPrice, Amount: i.Amount})
	}
	if ts, e := time.Parse(time.RFC3339, result.FetchedAt); e == nil {
		v.ReadAt = ts.UTC().Format("15:04 UTC")
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(v).Render(r.Context(), w)
}
