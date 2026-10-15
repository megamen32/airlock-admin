package summary

import (
	"encoding/json"
	"errors"
	"math"
	"time"
)

const companyID = "tc--35b02d680cc4998163b5fb9e883d744e::yyl"
const regionID = "j"

type Quote struct {
	Minimum     float64 `json:"minimum"`
	Average     float64 `json:"average"`
	Maximum     float64 `json:"maximum"`
	Currency    string  `json:"currency"`
	Store       string  `json:"store"`
	Region      string  `json:"region"`
	CollectedAt string  `json:"collected_at"`
}

func ReportQuote(raw json.RawMessage) (*Quote, error) {
	bad := errors.New("unconfirmed Priceva regional price report")
	var v struct {
		Count   *int `json:"objects_cnt"`
		Objects []struct {
			ProductID   string          `json:"product_id"`
			Company     json.RawMessage `json:"company_id"`
			Region      string          `json:"region_id"`
			RegionName  string          `json:"region_name"`
			Date        *int64          `json:"date"`
			Competitors *int            `json:"competitor_cnt"`
			Minimum     *float64        `json:"price_min"`
			Average     *float64        `json:"price_avg"`
			Maximum     *float64        `json:"price_max"`
			Currency    string          `json:"currency"`
		} `json:"objects"`
	}
	if len(raw) > 1<<20 || json.Unmarshal(raw, &v) != nil || v.Count == nil || *v.Count < 0 || *v.Count > 1 {
		return nil, bad
	}
	if *v.Count == 0 {
		if len(v.Objects) != 0 {
			return nil, bad
		}
		return nil, nil
	}
	if len(v.Objects) != 1 {
		return nil, bad
	}
	x := v.Objects[0]
	var company string
	if json.Unmarshal(x.Company, &company) != nil || company != companyID || x.Region != regionID || x.RegionName != "Россия, Москва" || x.ProductID != "p" || x.Competitors == nil || *x.Competitors != 1 || x.Date == nil || *x.Date < 946684800 || *x.Date > time.Now().Unix()+300 || x.Currency != "RUB" || x.Minimum == nil || x.Average == nil || x.Maximum == nil {
		return nil, bad
	}
	for _, n := range []float64{*x.Minimum, *x.Average, *x.Maximum} {
		if math.IsNaN(n) || math.IsInf(n, 0) || n <= 0 || n > 1e9 {
			return nil, bad
		}
	}
	if *x.Minimum > *x.Average || *x.Average > *x.Maximum {
		return nil, bad
	}
	return &Quote{Minimum: *x.Minimum, Average: *x.Average, Maximum: *x.Maximum, Currency: x.Currency, Store: "regard.ru", Region: x.RegionName, CollectedAt: time.Unix(*x.Date, 0).UTC().Format(time.RFC3339)}, nil
}
