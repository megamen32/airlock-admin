package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/airlockrun/agentsdk"
	"io"
	"time"
)

type Input struct{}
type Result struct {
	Ready     bool   `json:"ready"`
	Products  *int   `json:"products,omitempty"`
	Sources   *int   `json:"sources,omitempty"`
	Reports   *int   `json:"reports,omitempty"`
	Source    string `json:"source"`
	FetchedAt string `json:"fetched_at"`
	Message   string `json:"message,omitempty"`
}

type Service struct {
	c    *agentsdk.ConnectionHandle
	db   *agentsdk.AgentDB
	busy chan struct{}
}

func New(c *agentsdk.ConnectionHandle, db *agentsdk.AgentDB) *Service {
	return &Service{c: c, db: db, busy: make(chan struct{}, 1)}
}
func (s *Service) Tool(ctx context.Context, _ Input) (Result, error) {
	r, e := s.Get(ctx)
	if e != nil {
		return Result{Source: "Priceva", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context) (Result, error) {
	fail := errors.New("Не удалось получить данные Priceva. Проверьте подключение и повторите позже.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Данные уже запрашиваются. Подождите несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '2 minutes'").Scan(&cached)
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
		return Result{}, errors.New("Демо-лимит Priceva исчерпан. Повторите в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	out := Result{Source: "Priceva", FetchedAt: time.Now().UTC().Format(time.RFC3339)}
	counts := []int{}
	for _, endpoint := range []string{"product/list", "source/list", "report/list"} {
		callctx, stop := context.WithTimeout(ctx, 20*time.Second)
		resp, err := s.c.RequestStream(callctx, agentsdk.RequestOpts{Method: "POST", Path: "/api/v1/" + endpoint, Body: map[string]any{"params": map[string]any{"filters": map[string]any{"page": 1, "limit": 20}}}})
		if err != nil {
			stop()
			return Result{}, fail
		}
		data, err := io.ReadAll(io.LimitReader(resp.Body, (1<<20)+1))
		resp.Body.Close()
		stop()
		if err != nil || len(data) > 1<<20 {
			return Result{}, fail
		}
		var frame struct {
			Errors []struct {
				Code int `json:"code"`
			} `json:"errors"`
			Result json.RawMessage `json:"result"`
		}
		if json.Unmarshal(data, &frame) != nil {
			return Result{}, fail
		}
		if len(frame.Errors) > 0 {
			out.Message = "Данные Priceva пока недоступны. Цены из сервиса ещё не получены; подключение проверяет владелец демо."
			if frame.Errors[0].Code != 401 && frame.Errors[0].Code != 403 {
				out.Message = "Priceva отклонила запрос. Повторите позже; данные не получены."
			}
			return s.save(ctx, out)
		}
		var result map[string]json.RawMessage
		if len(frame.Result) == 0 || json.Unmarshal(frame.Result, &result) != nil {
			return Result{}, fail
		}
		raw, ok := result["objects"]
		if !ok || string(raw) == "null" {
			return Result{}, errors.New("Priceva вернула неподтверждённый формат данных. Отчёт пока не готов.")
		}
		var items []json.RawMessage
		if json.Unmarshal(raw, &items) == nil {
			counts = append(counts, len(items))
			continue
		}
		var objectMap map[string]json.RawMessage
		if json.Unmarshal(raw, &objectMap) != nil {
			return Result{}, fail
		}
		counts = append(counts, len(objectMap))
	}
	out.Ready = true
	out.Products = &counts[0]
	out.Sources = &counts[1]
	out.Reports = &counts[2]
	out.Message = fmt.Sprintf("На первой странице Priceva: товаров %d, источников %d, отчётов %d. Подробные цены ещё проверяются.", counts[0], counts[1], counts[2])
	return s.save(ctx, out)
}
func (s *Service) save(ctx context.Context, out Result) (Result, error) {
	payload, e := json.Marshal(out)
	if e != nil {
		return Result{}, e
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", string(payload))
	if e != nil {
		return Result{}, errors.New("Не удалось сохранить статус подключения.")
	}
	_, _ = s.db.ExecContext(ctx, "DELETE FROM summary_quota WHERE hour<NOW()-INTERVAL '1 day'")
	return out, nil
}
