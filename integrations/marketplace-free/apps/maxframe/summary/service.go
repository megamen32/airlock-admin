package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"io"
	"net/url"
	"strings"
	"time"
)

type Input struct {
	Link string `json:"link" jsonschema:"Public https://max.ru/channel link; empty means first five catalog entries, not search results"`
}
type Channel struct {
	ID          int64    `json:"max_channel_id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Link        string   `json:"link"`
	Category    string   `json:"category,omitempty"`
	Followers   *int64   `json:"followers_cnt_today,omitempty"`
	Views24     *int64   `json:"views_24h,omitempty"`
	Views48     *int64   `json:"views_48h,omitempty"`
	ER24        *float64 `json:"er_24h,omitempty"`
	ER48        *float64 `json:"er_48h,omitempty"`
	UpdatedAt   string   `json:"updated_at,omitempty"`
}
type Result struct {
	Ready     bool      `json:"ready"`
	Channels  []Channel `json:"channels,omitempty"`
	Catalog   bool      `json:"catalog"`
	Source    string    `json:"source"`
	FetchedAt string    `json:"fetched_at,omitempty"`
	Message   string    `json:"message"`
}
type Service struct {
	h    *agentsdk.ConnectionHandle
	db   *agentsdk.AgentDB
	busy chan struct{}
}

func New(h *agentsdk.ConnectionHandle, db *agentsdk.AgentDB) *Service {
	return &Service{h: h, db: db, busy: make(chan struct{}, 1)}
}

// NormalizeLink accepts only public channel URLs; it is not a general URL fetcher.
func NormalizeLink(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", nil
	}
	fail := errors.New("Укажите публичную ссылку вида https://max.ru/имя_канала.")
	if len(raw) > 300 {
		return "", fail
	}
	u, e := url.Parse(raw)
	if e != nil || u.Scheme != "https" || (u.Host != "max.ru" && u.Host != "web.max.ru") || u.User != nil || u.RawQuery != "" || u.Fragment != "" || u.RawPath != "" {
		return "", fail
	}
	path := strings.TrimSuffix(strings.TrimPrefix(u.Path, "/"), "/")
	if path == "" || len(path) > 200 {
		return "", fail
	}
	for _, c := range path {
		if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '_' || c == '-') {
			return "", fail
		}
	}
	return "https://max.ru/" + path, nil
}
func (s *Service) Tool(ctx context.Context, in Input) (Result, error) {
	r, e := s.Get(ctx, in.Link)
	if e != nil {
		return Result{Source: "MaxFrame", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context, raw string) (Result, error) {
	link, e := NormalizeLink(raw)
	if e != nil {
		return Result{}, e
	}
	key := link
	if key == "" {
		key = "catalog"
	}
	fail := errors.New("MaxFrame пока не вернул данные. Доступ к API должен проверить администратор; результат не сохранён.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Данные уже загружаются. Повторите через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	var cached []byte
	e = s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE cache_key=$1 AND fetched_at>NOW()-INTERVAL '10 minutes'", key).Scan(&cached)
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
		return Result{}, errors.New("Лимит обновлений демо исчерпан. Данные снова можно запросить в следующем часу.")
	}
	if e != nil {
		return Result{}, fail
	}
	path := "/api/maxframe/channels/?page=1"
	if link != "" {
		path = "/api/maxframe/channel/by-link/?link=" + url.QueryEscape(link)
	}
	resp, e := s.h.RequestStream(ctx, agentsdk.RequestOpts{Method: "GET", Path: path})
	if e != nil {
		return Result{}, fail
	}
	defer resp.Body.Close()
	rawBody, e := io.ReadAll(io.LimitReader(resp.Body, (1<<20)+1))
	if e != nil || len(rawBody) > 1<<20 {
		return Result{}, fail
	}
	var envelope struct {
		Success bool            `json:"success"`
		Data    json.RawMessage `json:"data"`
	}
	if json.Unmarshal(rawBody, &envelope) != nil || !envelope.Success {
		return Result{}, fail
	}
	var channels []Channel
	if link == "" {
		if json.Unmarshal(envelope.Data, &channels) != nil || channels == nil {
			return Result{}, fail
		}
		if len(channels) > 5 {
			channels = channels[:5]
		}
	} else {
		var c Channel
		if json.Unmarshal(envelope.Data, &c) != nil {
			return Result{}, fail
		}
		channels = []Channel{c}
	}
	for i := range channels {
		c := &channels[i]
		safe, e := NormalizeLink(c.Link)
		if e != nil || safe == "" || c.ID <= 0 || strings.TrimSpace(c.Title) == "" || len(c.Title) > 1000 || len(c.Description) > 20000 {
			return Result{}, fail
		}
		c.Link = safe
		if c.Followers != nil && *c.Followers < 0 || c.Views24 != nil && *c.Views24 < 0 || c.Views48 != nil && *c.Views48 < 0 {
			return Result{}, fail
		}
	}
	message := "Статистика канала"
	if link == "" {
		message = "Первые пять каналов каталога MaxFrame. Это не тематический поиск и не рейтинг."
	}
	r := Result{Ready: true, Channels: channels, Catalog: link == "", Source: "MaxFrame API", FetchedAt: time.Now().UTC().Format(time.RFC3339), Message: message}
	b, e := json.Marshal(r)
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(cache_key,payload,fetched_at) VALUES($1,$2,NOW()) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", key, string(b))
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "DELETE FROM summary_cache WHERE cache_key IN (SELECT cache_key FROM summary_cache ORDER BY fetched_at DESC,cache_key OFFSET 20)")
	if e != nil {
		return Result{}, fail
	}
	_, _ = s.db.ExecContext(ctx, "DELETE FROM summary_quota WHERE hour<NOW()-INTERVAL '1 day'")
	return r, nil
}
