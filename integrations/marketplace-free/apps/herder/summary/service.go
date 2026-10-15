package summary

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/airlockrun/agentsdk"
	"strings"
	"time"
)

type Input struct {
	Action   string `json:"action"`
	Template string `json:"template,omitempty"`
}
type Result struct {
	Ready   bool   `json:"ready"`
	Pending bool   `json:"pending"`
	Exists  bool   `json:"exists"`
	Message string `json:"message"`
	HTML    string `json:"html,omitempty"`
	Preview string `json:"-"`
	Source  string `json:"source"`
	WebURL  string `json:"web_url"`
}
type Service struct {
	m  *agentsdk.MCPHandle
	db *agentsdk.AgentDB
}

func New(m *agentsdk.MCPHandle, db *agentsdk.AgentDB) *Service { return &Service{m, db} }

const vm = "shell:airlock-demo-vm"
const herder = "mcp:shell:airlock-demo-vm:AgentHerder"

var unavailable = errors.New("Не удалось подтвердить результат. Повторный запуск не выполняется; проверьте состояние позже.")

func identity(ctx context.Context) (string, error) {
	u, ok := agentsdk.CallerFromContext(ctx).User()
	if !ok || u.ID == "" {
		return "", errors.New("Откройте приложение в гостевой сессии Airlock.")
	}
	return u.ID, nil
}
func nameFor(u string) string {
	h := sha256.Sum256([]byte(u))
	return "airlock-" + hex.EncodeToString(h[:12])
}
func workspace(n string) string { return "/home/demo/workspace/" + n }
func task(t string) (string, error) {
	switch t {
	case "", "card":
		return "визитку вымышленного стартапа Орбита: понятный заголовок, три преимущества, кнопка без внешней ссылки", nil
	case "pricing":
		return "страницу тарифов вымышленного стартапа Орбита: три карточки Бесплатный, Команда, Компания, вымышленные цены в рублях", nil
	case "checklist":
		return "чек-лист запуска вымышленного стартапа Орбита: пять пунктов с HTML-checkbox", nil
	}
	return "", errors.New("Выберите визитку, тарифы или чек-лист.")
}

// Unwrap actual GPTAdmin -> ShellMCP -> child MCP envelopes; errors never become success.
func unwrap(raw json.RawMessage) (json.RawMessage, error) {
	for i := 0; i < 10; i++ {
		var v map[string]json.RawMessage
		if json.Unmarshal(raw, &v) != nil {
			return nil, unavailable
		}
		if string(v["isError"]) == "true" {
			return nil, unavailable
		}
		if s := v["status"]; len(s) > 0 && string(s) != "\"completed\"" {
			return raw, nil
		}
		for _, k := range []string{"response", "structuredContent", "result"} {
			if x := v[k]; len(x) > 0 && x[0] == '{' {
				raw = x
				goto next
			}
		}
		if x := v["content"]; len(x) > 0 {
			var c []struct {
				Type string
				Text string
			}
			if json.Unmarshal(x, &c) != nil {
				return nil, unavailable
			}
			for _, b := range c {
				if b.Type == "text" && json.Valid([]byte(b.Text)) {
					raw = []byte(b.Text)
					goto next
				}
			}
		}
		return raw, nil
	next:
	}
	return nil, unavailable
}
func (s *Service) call(ctx context.Context, name string, args any) (json.RawMessage, error) {
	r, e := s.m.CallTool(ctx, name, args)
	if e != nil || r.IsError {
		return nil, unavailable
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
	if len(raw) == 0 || len(raw) > 256<<10 {
		return nil, unavailable
	}
	return raw, nil
}
func (s *Service) execute(ctx context.Context, target, tool string, args any, key string) (json.RawMessage, error) {
	a := map[string]any{"target": target, "tool": tool, "args": args, "detail": "full"}
	if key != "" {
		a["idempotency_key"] = key
	}
	raw, e := s.call(ctx, "execute", a)
	if e != nil {
		return nil, e
	}
	for i := 0; i < 20; i++ {
		var envelope struct {
			Status string `json:"status"`
			Job    string `json:"job_id"`
		}
		if json.Unmarshal(raw, &envelope) != nil {
			return nil, unavailable
		}
		if envelope.Status == "completed" {
			return unwrap(raw)
		}
		if envelope.Status != "running" && envelope.Status != "queued" {
			return nil, unavailable
		}
		if envelope.Job == "" {
			return nil, unavailable
		}
		select {
		case <-ctx.Done():
			return nil, unavailable
		case <-time.After(200 * time.Millisecond):
		}
		raw, e = s.call(ctx, "job", map[string]any{"job_id": envelope.Job, "owner_target": vm, "detail": "full"})
		if e != nil {
			return nil, e
		}
	}
	return nil, unavailable
}
func (s *Service) Tool(ctx context.Context, in Input) (Result, error) {
	var r Result
	var e error
	switch in.Action {
	case "start":
		r, e = s.Start(ctx, in.Template)
	case "", "status":
		r, e = s.Status(ctx)
	default:
		e = errors.New("Доступны создание примера и проверка результата.")
	}
	if e != nil {
		return Result{Message: e.Error(), Source: "GPTAdmin → Agent Herder → Fast Agent", WebURL: "https://d88-herder-coding.demo.airlockrun.ru/"}, nil
	}
	return r, nil
}
func (s *Service) Start(ctx context.Context, t string) (Result, error) {
	u, e := identity(ctx)
	if e != nil {
		return Result{}, e
	}
	description, e := task(t)
	if e != nil {
		return Result{}, e
	}
	if t == "" {
		t = "card"
	}
	n := nameFor(u)
	ctx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()
	reserved := false
	e = s.db.Transaction(ctx, nil, func(tx agentsdk.DBTX) error {
		if _, e := tx.ExecContext(ctx, "SELECT pg_advisory_xact_lock(991305)"); e != nil {
			return e
		}
		var exists int
		e := tx.QueryRowContext(ctx, "SELECT 1 FROM demo_jobs WHERE user_id=$1", u).Scan(&exists)
		if e == nil {
			return nil
		}
		if !errors.Is(e, sql.ErrNoRows) {
			return e
		}
		var total, hour, active int
		e = tx.QueryRowContext(ctx, "SELECT count(*),count(*) FILTER(WHERE created_at>NOW()-INTERVAL '1 hour'),count(*) FILTER(WHERE state IN('dispatching','running')) FROM demo_jobs").Scan(&total, &hour, &active)
		if e != nil {
			return e
		}
		if total >= 24 || hour >= 3 || active > 0 {
			return errors.New("Агент занят или демо-лимит достигнут. Попробуйте позже: до трёх новых страниц в час, одна задача одновременно.")
		}
		_, e = tx.ExecContext(ctx, "INSERT INTO demo_jobs(user_id,name,template,state) VALUES($1,$2,$3,'dispatching')", u, n, t)
		reserved = e == nil
		return e
	})
	if e != nil {
		return Result{}, e
	}
	if !reserved {
		return s.Status(ctx)
	}
	// Durable intent precedes both external actions. Unknown outcomes are never resubmitted.
	raw, e := s.execute(ctx, vm, "shell_exec", map[string]any{"cmd": "mkdir -m 700 -p " + workspace(n), "timeout": 10}, n+":mkdir")
	if e != nil {
		return Result{}, unavailable
	}
	var execution struct {
		ReturnCode int `json:"returncode"`
		ExitCode   int `json:"exit_code"`
	}
	if json.Unmarshal(raw, &execution) != nil || execution.ReturnCode != 0 || execution.ExitCode != 0 {
		return Result{}, unavailable
	}
	prompt := fmt.Sprintf("В текущем каталоге создай один файл index.html: %s. Интерфейс на русском, адаптивный для телефона, красивый и читаемый в светлой и тёмной теме через prefers-color-scheme. Весь CSS встроен, внешних ресурсов, скриптов, форм и сетевых запросов нет. Полный HTML с doctype, html, head, body. Не читай и не меняй ничего за пределами текущего каталога. Реально запиши файл через shell, затем проверь его существование и непустой размер. В ответе коротко сообщи результат по-русски.", description)
	raw, e = s.execute(ctx, herder, "new_or_resume", map[string]any{"harness": "fast-agent", "name": n, "cwd": workspace(n), "model": "generic.combo/airlock-demo-subscriptions", "message": prompt, "mode": "queue", "inputId": n + ":start", "humanRequested": true}, n+":start")
	if e != nil {
		return Result{}, unavailable
	}
	var admission struct {
		OK      bool   `json:"ok"`
		Session string `json:"sessionId"`
	}
	if json.Unmarshal(raw, &admission) != nil || !admission.OK || admission.Session == "" {
		return Result{}, unavailable
	}
	if _, e = s.db.ExecContext(ctx, "UPDATE demo_jobs SET state='running',session_id=$2 WHERE user_id=$1", u, admission.Session); e != nil {
		return Result{}, unavailable
	}
	return s.Status(ctx)
}
func (s *Service) Status(ctx context.Context) (Result, error) {
	u, e := identity(ctx)
	if e != nil {
		return Result{}, e
	}
	r := Result{Source: "GPTAdmin → Agent Herder → Fast Agent", WebURL: "https://d88-herder-coding.demo.airlockrun.ru/"}
	var n, state, sid string
	e = s.db.QueryRowContext(ctx, "SELECT name,state,session_id FROM demo_jobs WHERE user_id=$1", u).Scan(&n, &state, &sid)
	if errors.Is(e, sql.ErrNoRows) {
		r.Message = "Выберите страницу и поручите её создание агенту."
		return r, nil
	}
	if e != nil || n != nameFor(u) {
		return Result{}, unavailable
	}
	r.Exists = true
	if state == "rejected" {
		r.Message = "Подключение отклонило запрос до запуска агента. Этот учебный пример не запускался."
		return r, nil
	}
	if state == "failed" {
		r.Message = "Агент завершился с ошибкой. Повторный запуск не выполняется."
		return r, nil
	}
	if sid == "" {
		r.Pending = true
		r.Message = "Исход запуска пока не подтверждён. Повторного задания не будет; состояние сохранено для проверки."
		return r, nil
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	raw, e := s.execute(ctx, herder, "agent_info", map[string]any{"harness": "fast-agent", "sessionId": sid}, "")
	if e != nil {
		return Result{}, e
	}
	var info struct {
		Session *struct {
			CWD  string `json:"cwd"`
			Meta struct {
				Execution string `json:"executionStatus"`
			} `json:"meta"`
			Status string `json:"status"`
		} `json:"session"`
	}
	if json.Unmarshal(raw, &info) != nil || info.Session == nil || info.Session.CWD != workspace(n) {
		return Result{}, unavailable
	}
	if info.Session.Meta.Execution != "completed" {
		if info.Session.Status == "error" {
			s.db.ExecContext(ctx, "UPDATE demo_jobs SET state='failed' WHERE user_id=$1", u)
			r.Message = "Агент завершился с ошибкой. Повторного запуска нет."
			return r, nil
		}
		r.Pending = true
		r.Message = "Агент создаёт вашу страницу. Обычно это занимает около минуты. Нажмите «Проверить результат»."
		return r, nil
	}
	raw, e = s.execute(ctx, "file:airlock-demo-vm", "system_inspect", map[string]any{"action": "read_file", "path": workspace(n) + "/index.html", "max_bytes": 32768}, "")
	if e != nil {
		return Result{}, e
	}
	var file struct {
		Inspection struct {
			Path      string `json:"path"`
			Content   string `json:"content"`
			Size      int    `json:"size"`
			BytesRead int    `json:"bytes_read"`
		} `json:"inspection"`
	}
	if json.Unmarshal(raw, &file) != nil {
		return Result{}, unavailable
	}
	i := file.Inspection
	if i.Path != workspace(n)+"/index.html" || i.Size != i.BytesRead || i.BytesRead != len([]byte(i.Content)) || i.Size == 0 || i.Size > 32768 || !strings.Contains(strings.ToLower(i.Content), "</html>") {
		return Result{}, unavailable
	}
	_, e = s.db.ExecContext(ctx, "UPDATE demo_jobs SET state='done' WHERE user_id=$1", u)
	if e != nil {
		return Result{}, unavailable
	}
	r.Ready = true
	r.HTML = i.Content
	r.Preview = "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:\">" + i.Content
	r.Message = "Готово: Fast Agent создал настоящий HTML-файл в вашей учебной папке. Ниже — страница и её исходник."
	return r, nil
}
