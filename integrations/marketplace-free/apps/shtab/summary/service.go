package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/airlockrun/agentsdk"
	"regexp"
	"strconv"
	"time"
)

type Input struct{}
type Result struct {
	Ready     bool   `json:"ready"`
	Total     int    `json:"total"`
	Source    string `json:"source"`
	FetchedAt string `json:"fetched_at"`
	Message   string `json:"message,omitempty"`
}
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
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '15 minutes'").Scan(&cached)
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
	e = s.db.QueryRowContext(ctx, `INSERT INTO summary_quota(hour,used) VALUES(date_trunc('hour',NOW()),1) ON CONFLICT(hour) DO UPDATE SET used=summary_quota.used+1 WHERE summary_quota.used<4 RETURNING used`).Scan(&used)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{}, errors.New("Демо-лимит Shtab исчерпан. Сводка снова доступна в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	r, e := s.m.CallTool(ctx, "count_tasks", map[string]any{"completed": false, "archived": false, "group_by": "status"})
	if e != nil {
		return Result{}, fail
	}
	if r.IsError {
		return Result{}, errors.New("Shtab отклонил запрос. Возможно, исчерпан лимит бесплатного тарифа или нужно подключить токен.")
	}
	if len(r.StructuredContent) > 65536 {
		return Result{}, fail
	}
	var actual struct {
		Type  string `json:"type"`
		Total *int   `json:"total"`
	}
	if len(r.StructuredContent) > 0 {
		if json.Unmarshal(r.StructuredContent, &actual) != nil {
			return Result{}, fail
		}
	}
	if actual.Total == nil {
		pattern := regexp.MustCompile(`^(\d+) task\(s\) match the specified criteria\.$`)
		for _, c := range r.Content {
			if c.Type == "text" && len(c.Text) < 65536 {
				if m := pattern.FindStringSubmatch(c.Text); len(m) == 2 {
					v, err := strconv.Atoi(m[1])
					if err == nil {
						actual.Total = &v
						break
					}
				}
			}
		}
	}
	if actual.Total == nil || *actual.Total < 0 {
		return Result{}, fail
	}
	out := Result{Ready: true, Total: *actual.Total, Source: "Shtab", FetchedAt: time.Now().UTC().Format(time.RFC3339)}
	out.Message = fmt.Sprintf("Незавершённых задач: %d", out.Total)
	if out.Total == 0 {
		out.Message = "В демо-команде пока нет незавершённых задач."
	}
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
