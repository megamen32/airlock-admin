package handlers

import (
	"agent/summary"
	"agent/views"
	"net/http"
	"strconv"
)

type Handler struct{ s *summary.Service }

func New(s *summary.Service) *Handler { return &Handler{s: s} }
func (h *Handler) Home(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(views.HomeView{Title: "MAX-каналы — MaxFrame", Link: "https://max.ru/ria"}).Render(r.Context(), w)
}
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) error {
	r.Body = http.MaxBytesReader(w, r.Body, 2048)
	if e := r.ParseForm(); e != nil {
		http.Error(w, "Не удалось прочитать форму", http.StatusBadRequest)
		return nil
	}
	link := r.FormValue("link")
	if r.FormValue("mode") == "catalog" {
		link = ""
	}
	result, e := h.s.Get(r.Context(), link)
	v := views.HomeView{Title: "MAX-каналы — MaxFrame", Link: link, Ready: result.Ready, Message: result.Message, FetchedAt: result.FetchedAt}
	for _, c := range result.Channels {
		m := views.ChannelView{Title: c.Title, Description: c.Description, Link: c.Link, Category: c.Category, UpdatedAt: c.UpdatedAt}
		if c.Followers != nil {
			m.Followers = strconv.FormatInt(*c.Followers, 10)
		}
		if c.Views24 != nil {
			m.Views24 = strconv.FormatInt(*c.Views24, 10)
		}
		if c.Views48 != nil {
			m.Views48 = strconv.FormatInt(*c.Views48, 10)
		}
		if c.ER24 != nil {
			m.ER24 = strconv.FormatFloat(*c.ER24, 'f', 2, 64)
		}
		if c.ER48 != nil {
			m.ER48 = strconv.FormatFloat(*c.ER48, 'f', 2, 64)
		}
		v.Channels = append(v.Channels, m)
	}
	if e != nil {
		v.Message = e.Error()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	return views.Index(v).Render(r.Context(), w)
}
