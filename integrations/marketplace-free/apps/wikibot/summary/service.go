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
	"unicode"
	"unicode/utf8"
)

const knowledgeSource = "Wikibot API; основной источник: https://github.com/airlockrun/airlock (снимок e605529334a2); дополнительный: https://airlockrun.ru/; вопросы по исходникам"
const demoQuestion = "Ответь кратко, до 70 слов, только по ФАЙЛУ docker-compose.yml из документа Airlock-public-code-guide-e605529334a2. Какие Docker image указаны у postgres и x-caddy-common (CADDY_IMAGE)? Назови базу данных и reverse proxy по этим строкам. Дай ссылку на docker-compose.yml в GitHub. Не обсуждай авторизацию и другие файлы; не угадывай, если строк не видишь."

type Input struct {
	Question string `json:"question,omitempty"`
}

const DefaultQuestion = "Какие Docker image указаны у postgres и x-caddy-common в docker-compose.yml публичного Airlock?"

func NormalizeQuestion(question string) (string, error) {
	if !utf8.ValidString(question) || strings.ContainsFunc(question, func(r rune) bool { return unicode.IsControl(r) && !unicode.IsSpace(r) }) {
		return "", errors.New("Вопрос содержит недопустимые символы.")
	}
	question = strings.Join(strings.Fields(question), " ")
	if question == "" {
		return DefaultQuestion, nil
	}
	if utf8.RuneCountInString(question) > 600 {
		return "", errors.New("Сократите вопрос до 600 символов.")
	}
	return question, nil
}

func vendorQuery(question string) string {
	if question == DefaultQuestion {
		return demoQuestion
	}
	return "Ответь по-русски, кратко, до 160 слов. Основной источник — публичные исходники airlockrun/airlock, снимок e605529334a250d3158d546b5702c7651eb052c6; сайт Airlock — дополнительный контекст. Приведи пути файлов и ссылки на GitHub, подтверждающие ответ. Не путай публичный Airlock с Airlock Internal. Если сведений в базе нет, прямо сообщи об этом и не угадывай. Вопрос пользователя: " + question
}

type Result struct {
	Ready     bool   `json:"ready"`
	Message   string `json:"message"`
	Source    string `json:"source"`
	Question  string `json:"question"`
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
func (s *Service) Tool(ctx context.Context, input Input) (Result, error) {
	r, e := s.Get(ctx, input.Question)
	if e != nil {
		return Result{Source: "Wikibot", Message: e.Error()}, nil
	}
	return r, nil
}
func (s *Service) Get(ctx context.Context, question string) (Result, error) {
	question, err := NormalizeQuestion(question)
	if err != nil {
		return Result{}, err
	}
	fail := errors.New("Не удалось получить ответ Wikibot. Сервис мог не успеть ответить; попробуйте позже. Автоматическое пополнение и обращение к оператору не выполняются.")
	select {
	case s.busy <- struct{}{}:
		defer func() { <-s.busy }()
	default:
		return Result{}, errors.New("Ответ уже загружается. Повторите через несколько секунд.")
	}
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	var cached []byte
	e := s.db.QueryRowContext(ctx, "SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '10 minutes' AND payload->>'source'=$1 AND payload->>'question'=$2", knowledgeSource, question).Scan(&cached)
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
	body, _ := json.Marshal(map[string]string{"chatId": "airlock-demo-" + hex.EncodeToString(nonce[:]), "query": vendorQuery(question), "format": "raw"})
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
	if json.Unmarshal(raw, &actual) != nil || actual.Type != "SUCCESS" || actual.BotID != "4c1594b6-85fe-4526-a48e-96fc40c69910" || actual.ChatID != "airlock-demo-"+hex.EncodeToString(nonce[:]) || strings.TrimSpace(actual.Answer) == "" || len(actual.Answer) > 30000 || (question == DefaultQuestion && !verifiedComposeAnswer(actual.Answer)) {
		return Result{}, fail
	}
	r := Result{Ready: true, Message: strings.TrimSpace(actual.Answer), Source: knowledgeSource, Question: question, FetchedAt: time.Now().UTC().Format(time.RFC3339)}
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
