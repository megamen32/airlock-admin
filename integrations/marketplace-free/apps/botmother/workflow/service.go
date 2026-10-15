package workflow

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/airlockrun/agentsdk"
	"github.com/google/uuid"
	"io"
	"regexp"
	"time"
)

const Scenario = "airlock-demo"
const Order = "DEMO-001"

var testerPattern = regexp.MustCompile(`^[a-f0-9]{24}$`)
var errSetup = errors.New("Демо Botmother ещё настраивается: нужен собственный тестировщик и проверенный обратный вызов.")

type Input struct {
	Action string `json:"action" jsonschema:"enum=status,enum=run"`
}
type Result struct {
	Ready       bool   `json:"ready"`
	State       string `json:"state"`
	Order       string `json:"order,omitempty"`
	StartedAt   string `json:"started_at,omitempty"`
	CompletedAt string `json:"completed_at,omitempty"`
	Message     string `json:"message"`
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
func result(state string, created time.Time, finished sql.NullTime) Result {
	r := Result{State: state, Order: Order, StartedAt: created.UTC().Format(time.RFC3339)}
	switch state {
	case "complete":
		if !finished.Valid {
			return Result{State: "unknown", Message: "Отсутствует время подтверждения. Успех не подтверждён."}
		}
		r.Ready = true
		r.CompletedAt = finished.Time.UTC().Format(time.RFC3339)
		r.Message = "Botmother выполнил учебный сценарий и вернул подтверждение в Airlock. Сообщения в мессенджер не отправлялись."
	case "rejected":
		r.Message = "Сервис отклонил запуск. Автоматической повторной отправки не было."
	default:
		r.Message = "Запуск зарегистрирован, но подтверждение Botmother ещё не получено. Повторная отправка не выполняется."
	}
	return r
}
func (s *Service) Tool(ctx context.Context, in Input) (Result, error) {
	var r Result
	var e error
	switch in.Action {
	case "", "status":
		r, e = s.Status(ctx)
	case "run":
		r, e = s.Run(ctx)
	default:
		e = errors.New("Выберите status или run.")
	}
	if e != nil {
		return Result{State: "unavailable", Message: e.Error()}, nil
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
	var state string
	var created time.Time
	var finished sql.NullTime
	e := s.db.QueryRowContext(ctx, `SELECT state,created_at,completed_at FROM demo_runs WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 1`, u).Scan(&state, &created, &finished)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{State: "idle", Message: "Нажмите «Запустить сценарий», чтобы отправить учебную заявку DEMO-001 в Botmother и проверить ответ."}, nil
	}
	if e != nil {
		return Result{}, errors.New("Не удалось прочитать результат сценария.")
	}
	return result(state, created, finished), nil
}
func (s *Service) Configure(ctx context.Context, tester string) error {
	if !testerPattern.MatchString(tester) {
		return errors.New("Нужен существующий bm_id собственного тестировщика.")
	}
	r, e := s.db.ExecContext(ctx, `UPDATE demo_settings SET tester_id=$1 WHERE id=1 AND (tester_id='' OR tester_id=$1)`, tester)
	if e != nil {
		return errors.New("Не удалось сохранить тестировщика.")
	}
	n, _ := r.RowsAffected()
	if n != 1 {
		return errors.New("Тестировщик уже привязан; автоматическая замена запрещена.")
	}
	return nil
}
func (s *Service) Run(ctx context.Context) (Result, error) {
	u, e := owner(ctx)
	if e != nil {
		return Result{}, e
	}
	ctx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()
	var tester, runID string
	dispatch := false
	e = s.db.Transaction(ctx, nil, func(tx agentsdk.DBTX) error {
		// One persistent admission lock covers all instances; no network inside transaction.
		var hour time.Time
		var used, total int
		if e := tx.QueryRowContext(ctx, `SELECT hour,used,total FROM demo_quota WHERE id=1 FOR UPDATE`).Scan(&hour, &used, &total); e != nil {
			return e
		}
		if e := tx.QueryRowContext(ctx, `SELECT tester_id FROM demo_settings WHERE id=1`).Scan(&tester); e != nil {
			return e
		}
		if !testerPattern.MatchString(tester) {
			return errSetup
		}
		e := tx.QueryRowContext(ctx, `SELECT id::text FROM demo_runs WHERE owner_id=$1 AND (state IN ('dispatching','accepted','unknown') OR created_at>NOW()-INTERVAL '10 minutes') ORDER BY created_at DESC LIMIT 1`, u).Scan(&runID)
		if e == nil {
			return nil
		}
		if !errors.Is(e, sql.ErrNoRows) {
			return e
		}
		// All demo callers share one vendor tester and its last_request object.
		// Keep a single in-flight vendor event until its callback is reconciled.
		var busy bool
		if e := tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM demo_runs WHERE state IN ('dispatching','accepted','unknown'))`).Scan(&busy); e != nil {
			return e
		}
		if busy {
			return errors.New("Демо ещё обрабатывает предыдущую заявку. Проверьте результат позже.")
		}
		var quota int
		e = tx.QueryRowContext(ctx, `UPDATE demo_quota SET hour=date_trunc('hour',NOW()),used=CASE WHEN hour=date_trunc('hour',NOW()) THEN used+1 ELSE 1 END,total=total+1 WHERE id=1 AND total<100 AND (hour<>date_trunc('hour',NOW()) OR used<6) RETURNING used`).Scan(&quota)
		if errors.Is(e, sql.ErrNoRows) {
			return errors.New("Демо-лимит Botmother исчерпан: 6 запусков в час и 100 всего.")
		}
		if e != nil {
			return e
		}
		runID = uuid.NewString()
		_, e = tx.ExecContext(ctx, `INSERT INTO demo_runs(id,owner_id,state) VALUES($1,$2,'dispatching')`, runID, u)
		dispatch = e == nil
		return e
	})
	if e != nil {
		if errors.Is(e, errSetup) {
			return Result{}, e
		}
		return Result{}, errors.New("Запуск не отправлен: " + publicAdmissionError(e))
	}
	if dispatch {
		body := map[string]any{"users_bm": []string{tester}, "data": map[string]string{"demo_run_id": runID, "scenario": Scenario, "order": Order}}
		// Admin-only Connection is available to this Go handler, never guest run_js.
		raw, requestErr := s.c.Request(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/", Body: body})
		state := "unknown"
		if requestErr == nil && !providerRejected(raw) {
			state = "accepted"
		}
		// An HTTP error/timeout can follow an admitted event. Keep UNKNOWN, never replay.
		// A provider500 may follow a partial side effect: retain UNKNOWN, never auto-replay.
		_, e = s.db.ExecContext(ctx, `UPDATE demo_runs SET state=$2 WHERE id=$1 AND state='dispatching'`, runID, state)
		if e != nil {
			return Result{}, errors.New("Исход отправки неизвестен. Повторной отправки не будет; проверьте результат позже.")
		}
	}
	timer := time.NewTimer(15 * time.Second)
	defer timer.Stop()
	tick := time.NewTicker(500 * time.Millisecond)
	defer tick.Stop()
	for {
		r, e := s.status(ctx, u)
		if e != nil {
			return Result{}, e
		}
		if r.State == "complete" || r.State == "rejected" {
			return r, nil
		}
		select {
		case <-timer.C:
			return r, nil
		case <-ctx.Done():
			return r, nil
		case <-tick.C:
		}
	}
}
func publicAdmissionError(e error) string {
	if e.Error() == "Демо ещё обрабатывает предыдущую заявку. Проверьте результат позже." {
		return e.Error()
	}
	if e.Error() == "Демо-лимит Botmother исчерпан: 6 запусков в час и 100 всего." {
		return e.Error()
	}
	return "не удалось зарегистрировать запрос. Попробуйте позже."
}
func providerRejected(raw []byte) bool {
	var v map[string]json.RawMessage
	if json.Unmarshal(raw, &v) != nil {
		return false
	}
	if x, ok := v["error"]; ok && string(x) != "null" && string(x) != "false" && string(x) != `""` {
		return true
	}
	var code int
	if json.Unmarshal(v["code"], &code) == nil && code >= 400 {
		return true
	}
	return false
}

type Receipt struct {
	RunID    string `json:"run_id"`
	Scenario string `json:"scenario"`
	Order    string `json:"order"`
	Result   string `json:"result"`
}

func DecodeReceipt(raw []byte) (Receipt, error) {
	var r Receipt
	if len(raw) == 0 || len(raw) > 4096 {
		return r, errors.New("Invalid callback size")
	}
	d := json.NewDecoder(bytes.NewReader(raw))
	d.DisallowUnknownFields()
	if e := d.Decode(&r); e != nil {
		return r, errors.New("Invalid callback JSON")
	}
	var trailing any
	if d.Decode(&trailing) != io.EOF {
		return r, errors.New("Trailing callback data")
	}
	id, e := uuid.Parse(r.RunID)
	if e != nil || id.Version() != 4 || id.String() != r.RunID || r.Scenario != Scenario || r.Order != Order || r.Result != "completed" {
		return r, errors.New("Invalid demo receipt")
	}
	return r, nil
}
func (s *Service) Callback(ctx context.Context, raw []byte, _ *agentsdk.EventWriter) error {
	r, e := DecodeReceipt(raw)
	if e != nil {
		return e
	}
	x, e := s.db.ExecContext(ctx, `UPDATE demo_runs SET state='complete',completed_at=COALESCE(completed_at,NOW()) WHERE id=$1 AND state IN ('dispatching','accepted','unknown','complete')`, r.RunID)
	if e != nil {
		return errors.New("Callback persistence failed")
	}
	n, e := x.RowsAffected()
	if e != nil || n != 1 {
		return fmt.Errorf("Unknown or rejected demo run")
	}
	return nil
}
