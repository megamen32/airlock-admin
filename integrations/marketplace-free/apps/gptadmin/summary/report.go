package summary

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"
)

const publicPath = "/home/roomhacker/airlock-admin/integrations/marketplace-free/demo-data/apps.json"

type Input struct{}
type App struct {
	Name    string `json:"name"`
	Slug    string `json:"slug"`
	ChatURL string `json:"chat_url"`
}
type Result struct {
	Ready     bool   `json:"ready"`
	Total     int    `json:"total"`
	Apps      []App  `json:"apps,omitempty"`
	CheckedAt string `json:"checked_at,omitempty"`
	FetchedAt string `json:"fetched_at,omitempty"`
	Source    string `json:"source"`
	Message   string `json:"message"`
}
type Inspection struct {
	Action    string `json:"action"`
	Path      string `json:"path"`
	Content   string `json:"content"`
	BytesRead int    `json:"bytes_read"`
	Size      int    `json:"size"`
}
type Envelope struct {
	Status   string `json:"status"`
	ServerID string `json:"server_id"`
	Response struct {
		IsError           bool `json:"isError"`
		StructuredContent struct {
			Result struct {
				IsError           bool   `json:"isError"`
				ResultType        string `json:"resultType"`
				StructuredContent struct {
					Inspection Inspection `json:"inspection"`
				} `json:"structuredContent"`
			} `json:"result"`
		} `json:"structuredContent"`
	} `json:"response"`
}

func Report(e Envelope) (Result, error) {
	bad := errors.New("invalid GPTAdmin public inspection")
	op := e.Response.StructuredContent.Result
	i := op.StructuredContent.Inspection
	if e.Status != "completed" || e.ServerID != "file:roomhacker-server-100" || e.Response.IsError || op.IsError || op.ResultType != "complete" || i.Action != "read_file" || i.Path != publicPath || i.Size != i.BytesRead || i.BytesRead != len([]byte(i.Content)) || i.BytesRead == 0 || i.BytesRead > 32768 {
		return Result{}, bad
	}
	var p struct {
		Source    string `json:"source"`
		CheckedAt string `json:"checked_at"`
		Apps      []App  `json:"apps"`
	}
	if json.Unmarshal([]byte(i.Content), &p) != nil || p.Source != "Настоящая демо-инстанция Airlock" || len(p.Apps) == 0 || len(p.Apps) > 32 {
		return Result{}, bad
	}
	if _, err := time.Parse("2006-01-02", p.CheckedAt); err != nil {
		return Result{}, bad
	}
	seen := map[string]bool{}
	slug := regexp.MustCompile(`^d88-[a-z0-9-]{1,63}$`)
	for _, a := range p.Apps {
		u, err := url.Parse(a.ChatURL)
		if err != nil || strings.TrimSpace(a.Name) == "" || len(a.Name) > 300 || !slug.MatchString(a.Slug) || seen[a.Slug] || u.Scheme != "https" || u.Host != "demo.airlockrun.ru" || u.User != nil || u.Path != "/agents/"+a.Slug+"/chat" || u.RawQuery != "demo=1" || u.Fragment != "" {
			return Result{}, bad
		}
		seen[a.Slug] = true
	}
	return Result{Ready: true, Total: len(p.Apps), Apps: p.Apps, CheckedAt: p.CheckedAt, Source: "GPTAdmin MCP → демонстрационный apps.json", Message: fmt.Sprintf("Через GPTAdmin прочитан файл с %d приложениями. Это снимок каталога, а не проверка здоровья серверов.", len(p.Apps))}, nil
}
