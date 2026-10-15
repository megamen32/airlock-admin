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
		return Result{Source: "Shtab", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context) (Result, error) {
	fail := errors.New("Не удалось получить сводку Shtab. Проверьте подключение и повторите позже.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Сводка уже загружается. Попробуйте через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '15 minutes' AND payload->>'scope'='airlock-demo-project-138087'").Scan(&cached)
	if e == nil {
		var r Result
		if json.Unmarshal(cached, &r) != nil || !r.Ready || r.Scope != scope {
			return Result{}, fail
		}
		return r, nil
	}
	if !errors.Is(e, sql.ErrNoRows) {
		return Result{}, fail
	}
	var used int
	e = s.db.QueryRowContext(ctx, `INSERT INTO summary_quota(hour,used) VALUES(date_trunc('hour',NOW()),1) ON CONFLICT(hour) DO UPDATE SET used=summary_quota.used+1 WHERE summary_quota.used<4 RETURNING used`).Scan(&used)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{}, errors.New("Демо-лимит Shtab исчерпан. Сводка снова доступна в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	r, e := s.m.CallTool(ctx, "fetch_tasks", map[string]any{"datasource_id": datasourceID, "completed": false, "archived": false, "limit": 10})
	if e != nil {
		return Result{}, fail
	}
	if r.IsError {
		return Result{}, errors.New("Shtab отклонил запрос. Возможно, исчерпан бесплатный лимит. Задачи не заменяются пустым списком.")
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
	if len(raw) == 0 || len(raw) > 65536 {
		return Result{}, fail
	}
	out, e := Report(raw)
	if e != nil {
		return Result{}, fail
	}
	out.FetchedAt = time.Now().UTC().Format(time.RFC3339)
	payload, e := json.Marshal(out)
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", string(payload))
	if e != nil {
		return Result{}, fail
	}
	_, _ = s.db.ExecContext(ctx, "DELETE FROM summary_quota WHERE hour<NOW()-INTERVAL '1 day'")
	return out, nil
}
