package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/airlockrun/agentsdk"
	"io"
	"strings"
	"time"
)

type Input struct{}
type Course struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}
type Result struct {
	Ready     bool     `json:"ready"`
	Total     *int     `json:"total,omitempty"`
	Courses   []Course `json:"courses,omitempty"`
	Source    string   `json:"source"`
	FetchedAt string   `json:"fetched_at,omitempty"`
	Message   string   `json:"message"`
}
type Service struct {
	h    *agentsdk.ConnectionHandle
	db   *agentsdk.AgentDB
	busy chan struct{}
}

func New(h *agentsdk.ConnectionHandle, db *agentsdk.AgentDB) *Service {
	return &Service{h: h, db: db, busy: make(chan struct{}, 1)}
}
func (s *Service) Tool(ctx context.Context, _ Input) (Result, error) {
	r, e := s.Get(ctx)
	if e != nil {
		return Result{Source: "Edumotion", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context) (Result, error) {
	fail := errors.New("Edumotion пока не отдал каталог. Возможно, истёк пробный доступ или нужно проверить подключение.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Каталог уже загружается. Повторите через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '5 minutes'").Scan(&cached)
	if e == nil {
		var r Result
		if json.Unmarshal(cached, &r) != nil {
			return Result{}, fail
		}
		return r, nil
	}
	if !errors.Is(e, sql.ErrNoRows) {
		return Result{}, fail
	}
	var used int
	e = s.db.QueryRowContext(ctx, `INSERT INTO summary_quota(hour,used) VALUES(date_trunc('hour',NOW()),1) ON CONFLICT(hour) DO UPDATE SET used=summary_quota.used+1 WHERE summary_quota.used<12 RETURNING used`).Scan(&used)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{}, errors.New("Демо-лимит Edumotion исчерпан. Каталог снова доступен в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	resp, e := s.h.RequestStream(ctx, agentsdk.RequestOpts{Method: "GET", Path: "/public/api/v1/courses?page=1&pageSize=20"})
	if e != nil {
		return Result{}, fail
	}
	defer resp.Body.Close()
	raw, e := io.ReadAll(io.LimitReader(resp.Body, (512<<10)+1))
	if e != nil || len(raw) > 512<<10 {
		return Result{}, fail
	}
	var actual struct {
		Data []Course `json:"data"`
		Meta struct {
			Total *int `json:"total"`
		} `json:"meta"`
	}
	if json.Unmarshal(raw, &actual) != nil || actual.Data == nil || actual.Meta.Total == nil || *actual.Meta.Total < 0 || len(actual.Data) > 20 || *actual.Meta.Total < len(actual.Data) {
		return Result{}, fail
	}
	for i, c := range actual.Data {
		if c.ID == "" || strings.TrimSpace(c.Title) == "" || len(c.Title) > 1000 {
			return Result{}, fail
		}
		actual.Data[i].Title = strings.TrimSpace(c.Title)
	}
	r := Result{Ready: true, Total: actual.Meta.Total, Courses: actual.Data, Source: "Edumotion API", FetchedAt: time.Now().UTC().Format(time.RFC3339), Message: fmt.Sprintf("Опубликованных курсов: %d", *actual.Meta.Total)}
	if *r.Total == 0 {
		r.Message = "В новой демо-организации пока нет опубликованных курсов."
	}
	b, e := json.Marshal(r)
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", string(b))
	if e != nil {
		return Result{}, fail
	}
	_, _ = s.db.ExecContext(ctx, "DELETE FROM summary_quota WHERE hour<NOW()-INTERVAL '1 day'")
	return r, nil
}
