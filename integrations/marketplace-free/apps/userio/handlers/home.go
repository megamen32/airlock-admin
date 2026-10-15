package handlers
import("agent/summary";"agent/views";"net/http")
type Handler struct{s *summary.Service}
func New(s *summary.Service)*Handler{return &Handler{s}}
func(h *Handler)Home(w http.ResponseWriter,r *http.Request)error{w.Header().Set("Content-Type","text/html; charset=utf-8");w.Header().Set("Cache-Control","no-store");return views.Index(views.HomeView{Title:"Учебная почта — UserIO"}).Render(r.Context(),w)}
func(h *Handler)Refresh(w http.ResponseWriter,r *http.Request)error{result,e:=h.s.Get(r.Context());v:=views.HomeView{Title:"Учебная почта — UserIO",Result:result};if e!=nil{v.Result.Message=e.Error()};w.Header().Set("Content-Type","text/html; charset=utf-8");w.Header().Set("Cache-Control","no-store");return views.Index(v).Render(r.Context(),w)}
