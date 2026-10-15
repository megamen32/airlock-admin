package summary

import (
	"encoding/json"
	"errors"
	"strings"
)

type Input struct{}
type Purchase struct {
	Number  string `json:"number"`
	Name    string `json:"name"`
	Status  string `json:"status"`
	Comment string `json:"comment,omitempty"`
}
type Result struct {
	Ready     bool       `json:"ready"`
	Total     *int       `json:"total,omitempty"`
	Purchases []Purchase `json:"purchases,omitempty"`
	Source    string     `json:"source"`
	FetchedAt string     `json:"fetched_at,omitempty"`
	Message   string     `json:"message"`
}

func Page(raw []byte) (Result, error) {
	var v struct {
		Resource string     `json:"resource"`
		Items    []Purchase `json:"items"`
		Page     *int       `json:"page"`
		Limit    *int       `json:"limit"`
		Total    *int       `json:"total"`
	}
	bad := errors.New("invalid SNABZHENETS+ page")
	if len(raw) > 512<<10 || json.Unmarshal(raw, &v) != nil || v.Resource != "purchase-requisitions" || v.Items == nil || v.Page == nil || *v.Page != 1 || v.Limit == nil || *v.Limit != 5 || v.Total == nil || *v.Total < 0 || len(v.Items) > 5 || *v.Total < len(v.Items) {
		return Result{}, bad
	}
	for _, p := range v.Items {
		if strings.TrimSpace(p.Number) == "" || len(p.Number) > 100 || len(p.Name) > 500 || len(p.Comment) > 2000 || strings.TrimSpace(p.Status) == "" || len(p.Status) > 60 {
			return Result{}, bad
		}
	}
	return Result{Ready: true, Total: v.Total, Purchases: v.Items, Source: "SNABZHENETS+ Integration API", Message: "Настоящие данные отдельного демонстрационного портала. Заявки не отправляются поставщикам."}, nil
}
