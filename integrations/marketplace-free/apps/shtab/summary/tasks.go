package summary

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

const datasourceID = 138087
const scope = "airlock-demo-project-138087"

type Input struct{}
type Task struct {
	Name   string `json:"name"`
	Status string `json:"status"`
}
type Result struct {
	Ready     bool   `json:"ready"`
	Total     int    `json:"total"`
	Tasks     []Task `json:"tasks,omitempty"`
	Scope     string `json:"scope"`
	Source    string `json:"source"`
	FetchedAt string `json:"fetched_at"`
	Message   string `json:"message,omitempty"`
}

func Report(raw []byte) (Result, error) {
	bad := errors.New("invalid Shtab demo task page")
	var p struct {
		Type  string `json:"type"`
		Total *int   `json:"total_count"`
		Page  *int   `json:"page"`
		More  *bool  `json:"has_more"`
		Tasks []struct {
			ID         int    `json:"id"`
			Name       string `json:"name"`
			Datasource int    `json:"datasource_id"`
			Completed  *bool  `json:"completed"`
			Archived   *bool  `json:"archived"`
			Status     struct {
				ID    int    `json:"id"`
				Title string `json:"title"`
			} `json:"status"`
		} `json:"tasks"`
	}
	if len(raw) > 65536 || json.Unmarshal(raw, &p) != nil || p.Type != "task_list" || p.Total == nil || *p.Total < 0 || *p.Total > 100000 || p.Page == nil || *p.Page != 1 || p.More == nil || p.Tasks == nil || len(p.Tasks) > 10 || *p.Total < len(p.Tasks) || *p.More != (*p.Total > len(p.Tasks)) {
		return Result{}, bad
	}
	r := Result{Ready: true, Total: *p.Total, Tasks: []Task{}, Scope: scope, Source: "Shtab MCP — демо-доска Airlock"}
	seen := map[int]bool{}
	for _, t := range p.Tasks {
		if t.ID <= 0 || seen[t.ID] || t.Datasource != datasourceID || strings.TrimSpace(t.Name) == "" || len([]rune(t.Name)) > 399 || t.Completed == nil || *t.Completed || t.Archived == nil || *t.Archived || t.Status.ID <= 0 || strings.TrimSpace(t.Status.Title) == "" || len([]rune(t.Status.Title)) > 150 {
			return Result{}, bad
		}
		seen[t.ID] = true
		r.Tasks = append(r.Tasks, Task{Name: strings.TrimSpace(t.Name), Status: strings.TrimSpace(t.Status.Title)})
	}
	r.Message = fmt.Sprintf("Незавершённых задач: %d. Показано: %d.", r.Total, len(r.Tasks))
	if r.Total == 0 {
		r.Message = "На отдельной демо-доске пока нет незавершённых задач."
	}
	return r, nil
}
