package summary

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"io"
	"strings"
	"time"
)

type Input struct{}
type Result struct {
	Ready     bool   `json:"ready"`
	Message   string `json:"message"`
	Source    string `json:"source"`
	FetchedAt string `json:"fetched_at,omitempty"`
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
		return Result{Source: "Wikibot", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context) (Result, error) {
	fail := errors.New("Wikibot пока не ответил. Возможно, закончились бесплатные кредиты. Платное пополнение и обращение к оператору из демо не выполняются.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Ответ уже загружается. Повторите через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '10 minutes'").Scan(&cached)
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
	// One atomic admission across hourly and lifetime limits, including failed calls.
	var used int
	e = s.db.QueryRowContext(ctx, `UPDATE demo_quota SET total=total+1, hour=date_trunc('hour',NOW()), used=CASE WHEN hour=date_trunc('hour',NOW()) THEN used+1 ELSE 1 END WHERE id=1 AND total<20 AND (hour<>date_trunc('hour',NOW()) OR used<4) RETURNING total`).Scan(&used)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{}, errors.New("Лимит бесплатного демо Wikibot исчерпан: до4новых ответов в час и20за всё время. Пополнение не выполняется.")
	}
	if e != nil {
		return Result{}, fail
	}
	var nonce [16]byte
	if _, e = rand.Read(nonce[:]); e != nil {
		return Result{}, fail
	}
	body, _ := json.Marshal(map[string]string{"chatId": "airlock-demo-" + hex.EncodeToString(nonce[:]), "query": "Что такое Airlock и как начать работу с этой платформой?", "format": "raw"})
	resp, e := s.h.RequestStream(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/api/bot/ask", Body: body, Headers: map[string]string{"Content-Type": "application/json"}})
	if e != nil {
		return Result{}, fail
	}
	defer resp.Body.Close()
	raw, e := io.ReadAll(io.LimitReader(resp.Body, (128<<10)+1))
	if e != nil || len(raw) > 128<<10 {
		return Result{}, fail
	}
	var actual struct {
		Answer string `json:"answer"`
		Type   string `json:"type"`
		BotID  string `json:"botId"`
		ChatID string `json:"chatId"`
	}
	if json.Unmarshal(raw, &actual) != nil || actual.Type != "SUCCESS" || actual.BotID != "4c1594b6-85fe-4526-a48e-96fc40c69910" || actual.ChatID != "airlock-demo-"+hex.EncodeToString(nonce[:]) || strings.TrimSpace(actual.Answer) == "" || len(actual.Answer) > 30000 {
		return Result{}, fail
	}
	r := Result{Ready: true, Message: strings.TrimSpace(actual.Answer), Source: "Wikibot API; база знаний: https://airlockrun.ru/", FetchedAt: time.Now().UTC().Format(time.RFC3339)}
	b, e := json.Marshal(r)
	if e != nil {
		return Result{}, fail
	}
	_, e = s.db.ExecContext(ctx, "INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at", string(b))
	if e != nil {
		return Result{}, fail
	}
	return r, nil
}
