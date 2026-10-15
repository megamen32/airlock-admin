package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"time"
)

type Service struct {
	m    *agentsdk.MCPHandle
	db   *agentsdk.AgentDB
	busy chan struct{}
}

func New(m *agentsdk.MCPHandle, db *agentsdk.AgentDB) *Service {
	return &Service{m: m, db: db, busy: make(chan struct{}, 1)}
}
func (s *Service) Tool(ctx context.Context, _ Input) (Result, error) {
	r, e := s.Get(ctx)
	if e != nil {
		return Result{Source: "GPTAdmin MCP", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) read(ctx context.Context, name string, args any, dst any) error {
	r, e := s.m.CallTool(ctx, name, args)
	if e != nil {
		return e
	}
	if r.IsError {
		return errors.New("MCP rejected read")
	}
	raw := r.StructuredContent
	if len(raw) == 0 {
		for _, c := range r.Content {
			if c.Type == "text" && json.Valid([]byte(c.Text)) {
				raw = []byte(c.Text)
				break
			}
		}
	}
	if len(raw) == 0 || len(raw) > 512<<10 {
		return errors.New("MCP data absent or too large")
	}
	return json.Unmarshal(raw, dst)
}
func (s *Service) Get(ctx context.Context) (Result, error) {
	fail := errors.New("Не удалось прочитать демонстрационный файл через GPTAdmin. Проверьте подключение; отсутствие ответа не заменяется пустым каталогом.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Каталог уже загружается. Повторите через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '2 minutes'").Scan(&cached)
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
	e = s.db.QueryRowContext(ctx, `UPDATE demo_quota SET hour=date_trunc('hour',NOW()),used=CASE WHEN hour=date_trunc('hour',NOW()) THEN used+1 ELSE 1 END WHERE id=1 AND (hour<>date_trunc('hour',NOW()) OR used<12) RETURNING used`).Scan(&used)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{}, errors.New("Демо-лимит GPTAdmin исчерпан: 12 чтений в час. Повторите в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	var envelope Envelope
	if s.read(ctx, "execute", map[string]any{"target": "file:roomhacker-server-100", "tool": "system_inspect", "args": map[string]any{"action": "read_file", "path": publicPath, "max_bytes": 32768}, "detail": "full"}, &envelope) != nil {
		return Result{}, fail
	}
	r, e := Report(envelope)
	if e != nil {
		return Result{}, fail
	}
	r.FetchedAt = time.Now().UTC().Format(time.RFC3339)
	raw, e := json.Marshal(r)
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", string(raw))
	if e != nil {
		return Result{}, fail
	}
	return r, nil
}
