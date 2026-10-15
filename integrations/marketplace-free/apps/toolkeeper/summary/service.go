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
type Item struct {
	ID          int    `json:"id"`
	Workspace   int    `json:"workspace_id"`
	Title       string `json:"title"`
	Status      string `json:"status_name"`
	Responsible string `json:"responsible_user_name"`
}
type Result struct {
	Ready     bool   `json:"ready"`
	Total     *int   `json:"total,omitempty"`
	Items     []Item `json:"items,omitempty"`
	Source    string `json:"source"`
	FetchedAt string `json:"fetched_at,omitempty"`
	Message   string `json:"message"`
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
		return Result{Source: "ToolKeeper", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context) (Result, error) {
	if !time.Now().Before(time.Date(2026, 10, 21, 21, 0, 0, 0, time.UTC)) {
		return Result{}, errors.New("Пробный доступ ToolKeeper завершён. Продление согласуется с разработчиком; платный тариф автоматически не включается.")
	}
	fail := errors.New("ToolKeeper пока не вернул список оборудования. Проверьте подключение и срок пробного доступа.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Оборудование уже загружается. Повторите через несколько секунд.")
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
		return Result{}, errors.New("Лимит обновлений демо исчерпан. Список снова доступен в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	resp, e := s.h.RequestStream(ctx, agentsdk.RequestOpts{Method: "GET", Path: "/openapi/v1/items?per_page=10&page=1"})
	if e != nil {
		return Result{}, fail
	}
	defer resp.Body.Close()
	raw, e := io.ReadAll(io.LimitReader(resp.Body, (512<<10)+1))
	if e != nil || len(raw) > 512<<10 {
		return Result{}, fail
	}
	var actual struct {
		Data  []Item `json:"data"`
		Total *int   `json:"total"`
	}
	if json.Unmarshal(raw, &actual) != nil || actual.Data == nil || actual.Total == nil || *actual.Total < 0 || len(actual.Data) > 10 || *actual.Total < len(actual.Data) {
		return Result{}, fail
	}
	for _, v := range actual.Data {
		if v.ID <= 0 || v.Workspace != 6439 || strings.TrimSpace(v.Title) == "" || len(v.Title) > 1000 || len(v.Status) > 1000 || len(v.Responsible) > 1000 {
			return Result{}, fail
		}
	}
	r := Result{Ready: true, Total: actual.Total, Items: actual.Data, Source: "ToolKeeper API — учебное пространство", FetchedAt: time.Now().UTC().Format(time.RFC3339), Message: fmt.Sprintf("Учебных инструментов: %d", *actual.Total)}
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
