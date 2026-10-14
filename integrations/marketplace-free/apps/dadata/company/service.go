package company

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strings"

	"time"

	"github.com/airlockrun/agentsdk"
)

var identifierPattern = regexp.MustCompile(`^(?:\d{10}|\d{12}|\d{13}|\d{15})$`)

type Company struct {
	Found     bool   `json:"found"`
	FetchedAt string `json:"fetched_at"`
	Name      string `json:"name"`
	INN       string `json:"inn"`
	OGRN      string `json:"ogrn"`
	Status    string `json:"status"`
	Address   string `json:"address"`
	OKVED     string `json:"okved"`
}

type Suggestion struct {
	Value string `json:"value"`
	Data  struct {
		Name struct {
			Full string `json:"full_with_opf"`
		} `json:"name"`
		INN   string `json:"inn"`
		OGRN  string `json:"ogrn"`
		State struct {
			Status string `json:"status"`
		} `json:"state"`
		Address struct {
			Value string `json:"value"`
		} `json:"address"`
		OKVED string `json:"okved"`
	} `json:"data"`
}

type response struct {
	Suggestions []Suggestion `json:"suggestions"`
}
type Service struct {
	connection *agentsdk.ConnectionHandle
	db         *agentsdk.AgentDB
	active     chan struct{}
}

func NewService(connection *agentsdk.ConnectionHandle, db *agentsdk.AgentDB) *Service {
	if connection == nil || db == nil {
		panic("company: runtime handles required")
	}
	return &Service{connection: connection, db: db, active: make(chan struct{}, 5)}
}

var (
	errInvalid    = errors.New("Укажите ИНН из 10 или 12 цифр либо ОГРН из 13 или 15 цифр.")
	errDailyLimit = errors.New("Достигнут дневной лимит демонстрационных запросов. Попробуйте завтра.")
	errProvider   = errors.New("Не удалось выполнить поиск в DaData. Попробуйте позже.")
)

func ValidateIdentifier(value string) bool { return identifierPattern.MatchString(value) }

func (s *Service) Find(ctx context.Context, raw string) (Company, error) {
	query := strings.TrimSpace(raw)
	if !ValidateIdentifier(query) {
		return Company{}, errInvalid
	}

	select {
	case s.active <- struct{}{}:
		defer func() { <-s.active }()
	default:
		return Company{}, errors.New("Поиск занят. Попробуйте через несколько секунд.")
	}
	var cached []byte
	err := s.db.QueryRowContext(ctx, "SELECT result FROM lookup_cache WHERE query=$1 AND fetched_at > NOW()-INTERVAL '10 minutes'", query).Scan(&cached)
	if err == nil {
		var value Company
		if json.Unmarshal(cached, &value) == nil {
			return value, nil
		}
		return Company{}, errProvider
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Company{}, errProvider
	}
	var used int
	err = s.db.QueryRowContext(ctx, `INSERT INTO lookup_quota(day,used) VALUES($1,1)
 ON CONFLICT(day) DO UPDATE SET used=lookup_quota.used+1 WHERE lookup_quota.used<1000 RETURNING used`, time.Now().UTC().Format("2006-01-02")).Scan(&used)
	if errors.Is(err, sql.ErrNoRows) {
		return Company{}, errDailyLimit
	}
	if err != nil {
		return Company{}, errProvider
	}
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	body := struct {
		Query      string `json:"query"`
		Count      int    `json:"count"`
		BranchType string `json:"branch_type"`
	}{Query: query, Count: 1, BranchType: "MAIN"}
	resp, err := s.connection.RequestStream(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/suggestions/api/4_1/rs/findById/party", Body: body})
	if err != nil {
		return Company{}, providerError(err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, (1<<20)+1))
	if err != nil || len(data) > 1<<20 {
		return Company{}, errProvider
	}
	var parsed response
	if err := json.Unmarshal(data, &parsed); err != nil {
		return Company{}, errProvider
	}
	out := Company{FetchedAt: time.Now().UTC().Format(time.RFC3339), Name: "Нет данных", INN: "Нет данных", OGRN: "Нет данных", Status: "Нет данных", Address: "Нет данных", OKVED: "Нет данных"}
	if len(parsed.Suggestions) > 0 {
		out.Found = true
		d := parsed.Suggestions[0].Data
		out.Name = nonempty(d.Name.Full)
		out.INN = nonempty(d.INN)
		out.OGRN = nonempty(d.OGRN)
		out.Status = nonempty(d.State.Status)
		out.Address = nonempty(d.Address.Value)
		out.OKVED = nonempty(d.OKVED)
	}
	cached, err = json.Marshal(out)
	if err != nil {
		return Company{}, errProvider
	}
	if _, err = s.db.ExecContext(ctx, "INSERT INTO lookup_cache(query,result,fetched_at) VALUES($1,$2,NOW()) ON CONFLICT(query) DO UPDATE SET result=excluded.result,fetched_at=excluded.fetched_at", query, string(cached)); err != nil {
		return Company{}, errProvider
	}
	_, _ = s.db.ExecContext(ctx, "DELETE FROM lookup_cache WHERE fetched_at < NOW()-INTERVAL '1 day'")
	_, _ = s.db.ExecContext(ctx, "DELETE FROM lookup_quota WHERE day < CURRENT_DATE-7")
	return out, nil
}

func nonempty(value string) string {
	if strings.TrimSpace(value) == "" {
		return "Нет данных"
	}
	return value
}
func providerError(err error) error {
	// Never expose proxy/upstream errors: they may include provider response details.
	var auth *agentsdk.AuthRequiredError
	if errors.As(err, &auth) {
		return errors.New("Поиск DaData ещё не настроен. Администратору нужно подключить API-ключ.")
	}
	text := strings.ToLower(err.Error())
	if strings.Contains(text, "401") || strings.Contains(text, "403") {
		return errors.New("Поиск DaData ещё не настроен. Администратору нужно подключить API-ключ.")
	}
	if strings.Contains(text, "429") {
		return errors.New("Лимит DaData исчерпан. Попробуйте позже.")
	}
	return fmt.Errorf("%w", errProvider)
}
