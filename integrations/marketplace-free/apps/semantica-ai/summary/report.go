package summary

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"
)

const projectID = "1867448b-0052-47d3-9859-a7bd974dc56e"
const scanID = "4e433437-a94b-4308-8067-b2647c5725cc"

type Input struct{}
type Provider struct {
	Name      string `json:"name"`
	Requested int    `json:"requested"`
	Received  int    `json:"received"`
	Failed    int    `json:"failed"`
	Mentions  int    `json:"mentions"`
}
type Result struct {
	Ready     bool       `json:"ready"`
	Brand     string     `json:"brand,omitempty"`
	Domain    string     `json:"domain,omitempty"`
	Queries   []string   `json:"queries,omitempty"`
	Requested int        `json:"requested"`
	Received  int        `json:"received"`
	Failed    int        `json:"failed"`
	Mentions  int        `json:"mentions"`
	Providers []Provider `json:"providers,omitempty"`
	ScannedAt string     `json:"scanned_at,omitempty"`
	FetchedAt string     `json:"fetched_at,omitempty"`
	Source    string     `json:"source"`
	Message   string     `json:"message"`
}
type Project struct {
	ID      string   `json:"id"`
	Domain  string   `json:"domain"`
	Brand   string   `json:"brandName"`
	Queries []string `json:"queries"`
}
type Scan struct {
	ID          string `json:"id"`
	Domain      string `json:"domain"`
	Brand       string `json:"brandName"`
	Status      string `json:"status"`
	CompletedAt string `json:"completedAt"`
	Summary     struct {
		TotalResponses *int `json:"totalResponses"`
		TotalMentions  *int `json:"totalMentions"`
		ByProvider     map[string]struct {
			Queries  int `json:"queries"`
			Failed   int `json:"failed"`
			Mentions int `json:"mentions"`
		} `json:"byProvider"`
	} `json:"summary"`
	Results []struct {
		Query      string `json:"query"`
		Provider   string `json:"provider"`
		HasMention *bool  `json:"hasMention"`
	} `json:"results"`
}

// Report checks actual provider accounting; an unanswered provider is never a negative mention.
func Report(p Project, s Scan) (Result, error) {
	bad := errors.New("invalid Semantica report")
	if p.ID != projectID || p.Domain != "airlockrun.ru" || p.Brand != "Airlock" || len(p.Queries) == 0 || len(p.Queries) > 20 || s.ID != scanID || s.Domain != p.Domain || s.Brand != p.Brand || s.Status != "completed" || s.Summary.TotalResponses == nil || s.Summary.TotalMentions == nil || len(s.Summary.ByProvider) == 0 || len(s.Summary.ByProvider) > 11 {
		return Result{}, bad
	}
	if _, e := time.Parse(time.RFC3339Nano, s.CompletedAt); e != nil {
		return Result{}, bad
	}
	r := Result{Ready: true, Brand: p.Brand, Domain: p.Domain, Queries: p.Queries, ScannedAt: s.CompletedAt, Source: "Semantica AI MCP"}
	labels := map[string]string{"chatgpt": "ChatGPT", "perplexity": "Perplexity", "google_aio": "Google AI Overview", "claude": "Claude", "gemini": "Gemini", "deepseek": "DeepSeek", "yandexgpt": "Алиса AI LLM", "yandexaio": "Yandex AEO", "gigachat": "GigaChat", "grok": "Grok", "google_ai_mode": "Google AI Mode"}
	seen := map[string]int{}
	mentions := map[string]int{}
	for _, v := range s.Results {
		if len(v.Query) > 2000 || strings.TrimSpace(v.Query) == "" || v.HasMention == nil {
			return Result{}, bad
		}
		if _, ok := s.Summary.ByProvider[v.Provider]; !ok {
			return Result{}, bad
		}
		seen[v.Provider]++
		if *v.HasMention {
			mentions[v.Provider]++
		}
	}
	for name, v := range s.Summary.ByProvider {
		label, ok := labels[name]
		if !ok || v.Queries < 0 || v.Queries > 100 || v.Failed < 0 || v.Failed > v.Queries || v.Mentions < 0 || v.Mentions > v.Queries-v.Failed || seen[name] != v.Queries-v.Failed || mentions[name] != v.Mentions {
			return Result{}, bad
		}
		r.Providers = append(r.Providers, Provider{Name: label, Requested: v.Queries, Received: seen[name], Failed: v.Failed, Mentions: v.Mentions})
		r.Requested += v.Queries
		r.Received += seen[name]
		r.Failed += v.Failed
		r.Mentions += v.Mentions
	}
	for _, q := range p.Queries {
		if strings.TrimSpace(q) == "" || len(q) > 2000 {
			return Result{}, bad
		}
	}
	if r.Requested != *s.Summary.TotalResponses || r.Mentions != *s.Summary.TotalMentions || r.Received == 0 {
		return Result{}, bad
	}
	sort.Slice(r.Providers, func(i, j int) bool { return r.Providers[i].Name < r.Providers[j].Name })
	r.Message = fmt.Sprintf("Получено %d из %d ответов. Упоминаний Airlock: %d. Не получено ответов: %d. Это один запрос и один скан, а не общая оценка рынка.", r.Received, r.Requested, r.Mentions, r.Failed)
	return r, nil
}
