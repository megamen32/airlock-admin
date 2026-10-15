package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"io"
	"time"
)

type Service struct {
	h    *agentsdk.ConnectionHandle
	db   *agentsdk.AgentDB
	busy chan struct{}
}

func New(h *agentsdk.ConnectionHandle, db *agentsdk.AgentDB) *Service {
	return &Service{h: h, db: db, busy: make(chan struct{}, 1)}
}
func (s *Service) Tool(ctx context.Context, _ Input) (ToolResult, error) {
	r, e := s.Get(ctx)
	result := ToolResult{Ready: r.Ready, Fields: r.Fields, Items: r.Items, Message: r.Message, OriginalURL: "https://d88-beorg-invoice.demo.airlockrun.ru/static/invoice-demo.png", WebURL: "https://d88-beorg-invoice.demo.airlockrun.ru/"}
	if e != nil {
		result.Message = e.Error()
	}
	return result, nil
}

func (s *Service) Get(ctx context.Context) (Result, error) {
	fail := errors.New("Не удалось прочитать результат распознавания Beorg. Проверьте подключение или готовность документа. Отсутствующие поля не выдумываются.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Результат уже загружается. Повторите через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '15 minutes'").Scan(&cached)
	if e == nil {
		var r Result
		if json.Unmarshal(cached, &r) != nil || !r.Ready {
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
		return Result{}, errors.New("Демо-лимит Beorg исчерпан. Повторите в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	resp, e := s.h.RequestStream(ctx, agentsdk.RequestOpts{Method: "GET", Path: "/api/document/result/s-1664407"})
	if e != nil {
		return Result{}, fail
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return Result{}, fail
	}
	raw, e := io.ReadAll(io.LimitReader(resp.Body, (512<<10)+1))
	if e != nil || len(raw) > 512<<10 {
		return Result{}, fail
	}
	r, e := Report(raw)
	if e != nil {
		return Result{}, fail
	}
	r.FetchedAt = time.Now().UTC().Format(time.RFC3339)
	raw, e = json.Marshal(r)
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", string(raw))
	if e != nil {
		return Result{}, fail
	}
	_, _ = s.db.ExecContext(ctx, "DELETE FROM summary_quota WHERE hour<NOW()-INTERVAL '1 day'")
	return r, nil
}
