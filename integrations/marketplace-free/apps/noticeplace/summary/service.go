package summary

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"github.com/google/uuid"
	"io"
	"regexp"
	"time"
)

const Project = "airlock-marketplace-demo"
const Title = "Airlock: учебное уведомление"
const Body = "Учебная заявка DEMO-001 передана через NoticePlace в отдельную демонстрационную комнату Matrix. Это проверка интеграции Airlock; никаких действий от человека не требуется."

type Input struct {
	Action string `json:"action" jsonschema:"enum=status,enum=send"`
}
type Result struct {
	Ready      bool   `json:"ready"`
	State      string `json:"state"`
	Title      string `json:"title,omitempty"`
	AcceptedAt string `json:"accepted_at,omitempty"`
	Message    string `json:"message"`
}
type Receipt struct {
	EventID    string  `json:"event_id"`
	IncidentID string  `json:"incident_id"`
	State      string  `json:"state"`
	DeliveryID string  `json:"initial_delivery_id"`
	AgentJobID *string `json:"agent_job_delivery_id"`
	Muted      *bool   `json:"notifications_muted"`
}

var eventID = regexp.MustCompile(`^evt_[a-f0-9]{32}$`)
var incidentID = regexp.MustCompile(`^inc_[a-f0-9]{32}$`)
var deliveryID = regexp.MustCompile(`^dlv_[a-f0-9]{32}$`)

func ParseReceipt(status int, raw []byte) (Receipt, error) {
	var x Receipt
	if status != 202 || len(raw) == 0 || len(raw) > 16384 || json.Unmarshal(raw, &x) != nil || !eventID.MatchString(x.EventID) || !incidentID.MatchString(x.IncidentID) || !deliveryID.MatchString(x.DeliveryID) || x.State != "open" || x.AgentJobID != nil || x.Muted == nil || *x.Muted {
		return x, errors.New("Сервис не подтвердил приём учебного уведомления.")
	}
	return x, nil
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
func (s *Service) Tool(ctx context.Context, in Input) (Result, error) {
	var r Result
	var e error
	switch in.Action {
	case "", "status":
		r, e = s.Status(ctx)
	case "send":
		r, e = s.Send(ctx)
	default:
		e = errors.New("Выберите status или send.")
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
	var accepted sql.NullTime
	e := s.db.QueryRowContext(ctx, `SELECT state,accepted_at FROM demo_requests WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 1`, u).Scan(&state, &accepted)
	if errors.Is(e, sql.ErrNoRows) {
		return Result{State: "idle", Message: "Отправьте учебное уведомление DEMO-001 через NoticePlace в отдельную демонстрационную комнату."}, nil
	}
	if e != nil {
		return Result{}, errors.New("Не удалось прочитать результат.")
	}
	if state == "accepted" && accepted.Valid {
		return Result{Ready: true, State: state, Title: Title, AcceptedAt: accepted.Time.UTC().Format(time.RFC3339), Message: "NoticePlace принял учебное уведомление и поставил его в очередь доставки. Доставка в Matrix выполняется асинхронно; подтверждение приёма не означает, что сообщение прочитано."}, nil
	}
	return Result{State: "unknown", Title: Title, Message: "Подтверждение приёма не получено. Исход запроса неизвестен; повторно он не отправляется. Проверьте результат позже."}, nil
}
func (s *Service) Send(ctx context.Context) (Result, error) {
	u, e := owner(ctx)
	if e != nil {
		return Result{}, e
	}
	ctx, cancel := context.WithTimeout(ctx, 35*time.Second)
	defer cancel()
	var id string
	send := false
	e = s.db.Transaction(ctx, nil, func(tx agentsdk.DBTX) error {
		var used int
		if e := tx.QueryRowContext(ctx, `SELECT used FROM demo_quota WHERE id=1 FOR UPDATE`).Scan(&used); e != nil {
			return e
		}
		e := tx.QueryRowContext(ctx, `SELECT id::text FROM demo_requests WHERE owner_id=$1 AND (state IN ('dispatching','unknown') OR created_at>NOW()-INTERVAL '10 minutes') ORDER BY created_at DESC LIMIT 1`, u).Scan(&id)
		if e == nil {
			return nil
		}
		if !errors.Is(e, sql.ErrNoRows) {
			return e
		}
		e = tx.QueryRowContext(ctx, `UPDATE demo_quota SET hour=date_trunc('hour',NOW()),used=CASE WHEN hour=date_trunc('hour',NOW()) THEN used+1 ELSE 1 END,total=total+1 WHERE id=1 AND total<100 AND (hour<>date_trunc('hour',NOW()) OR used<6) RETURNING used`).Scan(&used)
		if errors.Is(e, sql.ErrNoRows) {
			return errors.New("Демо-лимит NoticePlace: 6 уведомлений в час и 100 всего.")
		}
		if e != nil {
			return e
		}
		id = uuid.NewString()
		_, e = tx.ExecContext(ctx, `INSERT INTO demo_requests(id,owner_id,state) VALUES($1,$2,'dispatching')`, id, u)
		send = e == nil
		return e
	})
	if e != nil {
		if e.Error() == "Демо-лимит NoticePlace: 6 уведомлений в час и 100 всего." {
			return Result{}, e
		}
		return Result{}, errors.New("Запрос не отправлен: не удалось зарегистрировать учебное уведомление.")
	}
	if send {
		payload := map[string]any{"schema": "notify.event.v1", "kind": "notification", "severity": "info", "project": Project, "recipient": "demo-room", "title": Title, "body": Body, "dedup_key": "airlock-demo:" + id, "event_type": "airlock.demo.notification", "correlation_id": id}
		// Persistent intent exists; no retries, even when response is ambiguous.
		response, requestError := s.c.RequestStream(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/events", Body: payload, Headers: map[string]string{"Idempotency-Key": "airlock-demo:" + id}})
		var receipt Receipt
		accepted := false
		if requestError == nil {
			raw, readError := io.ReadAll(io.LimitReader(response.Body, 16385))
			response.Body.Close()
			if readError == nil {
				receipt, e = ParseReceipt(response.StatusCode, raw)
				accepted = e == nil
			}
		}
		state := "unknown"
		var when any
		if accepted {
			state = "accepted"
			when = time.Now().UTC()
		}
		_, e = s.db.ExecContext(ctx, `UPDATE demo_requests SET state=$2,accepted_at=$3,event_id=$4,incident_id=$5 WHERE id=$1 AND state='dispatching'`, id, state, when, receipt.EventID, receipt.IncidentID)
		if e != nil {
			return Result{}, errors.New("Исход отправки неизвестен. Повторного запроса не будет; проверьте результат позже.")
		}
	}
	return s.status(ctx, u)
}
