package workflow

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"github.com/google/uuid"
	"strings"
	"time"
	"unicode/utf8"
)

const WebURL = "https://d88-suvvy-assistant.demo.airlockrun.ru/"

var TrialEnd = time.Date(2026, 10, 21, 21, 0, 0, 0, time.UTC)

type Input struct {
	Action   string `json:"action" jsonschema:"enum=status,enum=ask"`
	Question string `json:"question,omitempty"`
}
type Result struct {
	Ready       bool   `json:"ready"`
	State       string `json:"state"`
	Question    string `json:"question,omitempty"`
	Answer      string `json:"answer,omitempty"`
	Message     string `json:"message"`
	WebURL      string `json:"web_url"`
	StartedAt   string `json:"started_at,omitempty"`
	CompletedAt string `json:"completed_at,omitempty"`
}
type Service struct {
	c  *agentsdk.ConnectionHandle
	db *agentsdk.AgentDB
}

func New(c *agentsdk.ConnectionHandle, db *agentsdk.AgentDB) *Service { return &Service{c: c, db: db} }
func owner(ctx context.Context) (string, error) {
	u, ok := agentsdk.CallerFromContext(ctx).User()
	if !ok || u.ID == "" {
		return "", errors.New("Нужна гостевая сессия Airlock.")
	}
	return u.ID, nil
}
func Question(q string) (string, error) {
	q = strings.TrimSpace(q)
	if q == "" || utf8.RuneCountInString(q) > 600 {
		return "", errors.New("Введите вопрос от 1 до 600 символов.")
	}
	return q, nil
}
func (s *Service) Tool(ctx context.Context, in Input) (Result, error) {
	var r Result
	var e error
	switch in.Action {
	case "", "status":
		r, e = s.Status(ctx)
	case "ask":
		r, e = s.Ask(ctx, in.Question)
	default:
		e = errors.New("Выберите вопрос или проверку ответа.")
	}
	if e != nil {
		return Result{State: "unavailable", Message: e.Error(), WebURL: WebURL}, nil
	}
	return r, nil
}
func (s *Service) Status(ctx context.Context) (Result, error) {
	u, e := owner(ctx)
	if e != nil {
		return Result{}, e
	}
	return s.status(ctx, u)
}
func (s *Service) status(ctx context.Context, u string) (Result, error) {
	r := Result{State: "idle", WebURL: WebURL, Message: "Задайте один учебный вопрос консультанту Савви об Airlock."}
	var created time.Time
	var done sql.NullTime
	e := s.db.QueryRowContext(ctx, `SELECT state,question,answer,created_at,completed_at FROM demo_runs WHERE owner_id=$1`, u).Scan(&r.State, &r.Question, &r.Answer, &created, &done)
	if errors.Is(e, sql.ErrNoRows) {
		return r, nil
	}
	if e != nil {
		return Result{}, errors.New("Не удалось прочитать ответ. Повторная отправка не выполняется.")
	}
	r.StartedAt = created.UTC().Format(time.RFC3339)
	if r.State == "complete" && r.Answer != "" && done.Valid {
		r.Ready = true
		r.CompletedAt = done.Time.UTC().Format(time.RFC3339)
		r.Message = "Ответ получен от агента Савви."
	} else {
		r.Message = "Вопрос отправлен. Ответ Савви ещё не получен. Нажмите «Проверить ответ»; повторной отправки не будет."
	}
	return r, nil
}
func (s *Service) Ask(ctx context.Context, q string) (Result, error) {
	u, e := owner(ctx)
	if e != nil {
		return Result{}, e
	}
	q, e = Question(q)
	if e != nil {
		return Result{}, e
	}
	ctx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()
	var id string
	dispatch := false
	e = s.db.Transaction(ctx, nil, func(tx agentsdk.DBTX) error {
		var hour time.Time
		var used, total int
		if e := tx.QueryRowContext(ctx, `SELECT hour,used,total FROM demo_quota WHERE id=1 FOR UPDATE`).Scan(&hour, &used, &total); e != nil {
			return e
		}
		e := tx.QueryRowContext(ctx, `SELECT id::text FROM demo_runs WHERE owner_id=$1`, u).Scan(&id)
		if e == nil {
			return nil
		}
		if !errors.Is(e, sql.ErrNoRows) {
			return e
		}
		if !time.Now().Before(TrialEnd) {
			return errors.New("Пробный период Савви завершён. Сохранённые ответы остаются доступны.")
		}
		if total >= 20 || (hour.Equal(time.Now().UTC().Truncate(time.Hour)) && used >= 4) {
			return errors.New("Демо-лимит Савви: 4 новых вопроса в час и 20 за весь показ. Попробуйте позже.")
		}
		if _, e := tx.ExecContext(ctx, `UPDATE demo_quota SET hour=date_trunc('hour',NOW()),used=CASE WHEN hour=date_trunc('hour',NOW()) THEN used+1 ELSE 1 END,total=total+1 WHERE id=1`); e != nil {
			return e
		}
		id = uuid.NewString()
		_, e = tx.ExecContext(ctx, `INSERT INTO demo_runs(id,owner_id,state,question) VALUES($1,$2,'dispatching',$3)`, id, u, q)
		dispatch = e == nil
		return e
	})
	if e != nil {
		switch e.Error() {
		case "Пробный период Савви завершён. Сохранённые ответы остаются доступны.", "Демо-лимит Савви: 4 новых вопроса в час и 20 за весь показ. Попробуйте позже.":
			return Result{}, e
		default:
			return Result{}, errors.New("Вопрос не отправлен: не удалось зарегистрировать запрос.")
		}
	}
	if dispatch {
		raw, err := s.c.Request(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/api/webhook/custom/message", Body: map[string]any{"api_version": 1, "message_id": id, "chat_id": id, "text": q, "source": "Учебный посетитель Airlock", "message_sender": "customer"}})
		state := "unknown"
		var reply struct {
			Message string `json:"message"`
		}
		if err == nil && json.Unmarshal(raw, &reply) == nil && reply.Message == "Successful" {
			state = "accepted"
		}
		if _, e := s.db.ExecContext(ctx, `UPDATE demo_runs SET state=$2 WHERE id=$1 AND state='dispatching'`, id, state); e != nil {
			return Result{}, errors.New("Исход отправки неизвестен. Новый вопрос не отправляется; проверьте ответ позже.")
		}
	}
	tick := time.NewTicker(500 * time.Millisecond)
	defer tick.Stop()
	timer := time.NewTimer(18 * time.Second)
	defer timer.Stop()
	for {
		r, e := s.status(ctx, u)
		if e != nil || r.Ready {
			return r, e
		}
		select {
		case <-ctx.Done():
			return r, nil
		case <-timer.C:
			return r, nil
		case <-tick.C:
		}
	}
}

type Receipt struct {
	EventType   string `json:"event_type"`
	ChatID      string `json:"chat_id"`
	NewMessages []struct {
		Type          string `json:"type"`
		MessageSender string `json:"message_sender"`
		Text          string `json:"text"`
	} `json:"new_messages"`
}

func DecodeReceipt(raw []byte) (Receipt, string, error) {
	var r Receipt
	if len(raw) == 0 || len(raw) > 65536 || json.Unmarshal(raw, &r) != nil {
		return r, "", errors.New("Invalid callback JSON")
	}
	if r.EventType == "test_request" {
		return r, "", nil
	}
	id, e := uuid.Parse(r.ChatID)
	if r.EventType != "new_messages" || e != nil || id.Version() != 4 || id.String() != r.ChatID {
		return r, "", errors.New("Invalid callback identity")
	}
	var texts []string
	for _, m := range r.NewMessages {
		if m.Type == "text" && m.MessageSender == "ai" && strings.TrimSpace(m.Text) != "" {
			texts = append(texts, strings.TrimSpace(m.Text))
		}
	}
	answer := strings.Join(texts, "\n\n")
	if answer == "" || len(answer) > 16384 {
		return r, "", errors.New("Missing or oversized AI answer")
	}
	return r, answer, nil
}
func (s *Service) Callback(ctx context.Context, raw []byte, _ *agentsdk.EventWriter) error {
	r, answer, e := DecodeReceipt(raw)
	if e != nil {
		return e
	}
	if r.EventType == "test_request" {
		return nil
	}
	res, e := s.db.ExecContext(ctx, `UPDATE demo_runs SET state='complete',answer=$2,completed_at=NOW() WHERE id=$1 AND state IN ('dispatching','accepted','unknown')`, r.ChatID, answer)
	if e != nil {
		return errors.New("Callback persistence failed")
	}
	n, e := res.RowsAffected()
	if e != nil {
		return e
	}
	if n == 1 {
		return nil
	}
	var old string
	e = s.db.QueryRowContext(ctx, `SELECT answer FROM demo_runs WHERE id=$1 AND state='complete'`, r.ChatID).Scan(&old)
	if e == nil && old == answer {
		return nil
	}
	return errors.New("Unknown or conflicting callback")
}
