package summary

import (
	"encoding/json"
	"errors"
	"net/url"
	"strings"
)

type CatalogItem struct {
	Name             string   `json:"name"`
	SKU              string   `json:"sku"`
	Currency         string   `json:"currency"`
	Store            string   `json:"store"`
	URL              string   `json:"url"`
	MonitoringStatus string   `json:"monitoring_status"`
	Price            *float64 `json:"price"`
}

func Catalog(products, sources json.RawMessage) (CatalogItem, error) {
	bad := errors.New("unconfirmed Priceva demo catalogue")
	var p struct {
		Count   *int `json:"objects_cnt"`
		Objects []struct {
			ID       string `json:"id"`
			Code     string `json:"client_code"`
			Name     string `json:"name"`
			SKU      string `json:"articul"`
			Currency string `json:"default_currency"`
		} `json:"objects"`
	}
	var s struct {
		Count   *int `json:"objects_cnt"`
		Objects []struct {
			ID               string `json:"id"`
			ProductID        string `json:"product_id"`
			URL              string `json:"url"`
			Store            string `json:"company_name"`
			MonitoringStatus string `json:"monitoring_status"`
		} `json:"objects"`
	}
	if json.Unmarshal(products, &p) != nil || json.Unmarshal(sources, &s) != nil || p.Count == nil || s.Count == nil || *p.Count != 1 || *s.Count != 1 || len(p.Objects) != 1 || len(s.Objects) != 1 {
		return CatalogItem{}, bad
	}
	a, b := p.Objects[0], s.Objects[0]
	if a.ID != "p" || a.Code != "airlock-demo-k120" || b.ID != "f" || b.ProductID != a.ID || strings.TrimSpace(a.Name) == "" || len(a.Name) > 500 || a.SKU != "920-002522" || a.Currency != "RUB" || b.Store != "regard.ru" {
		return CatalogItem{}, bad
	}
	u, e := url.Parse(b.URL)
	if e != nil || u.Scheme != "https" || u.Host != "www.regard.ru" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || u.Path != "/product/13649/klaviatura-logitech-k120-for-business-black-920-002522" {
		return CatalogItem{}, bad
	}
	if b.MonitoringStatus != "done" && b.MonitoringStatus != "queue" && b.MonitoringStatus != "run" {
		return CatalogItem{}, bad
	}
	return CatalogItem{Name: a.Name, SKU: a.SKU, Currency: a.Currency, Store: b.Store, URL: u.String(), MonitoringStatus: b.MonitoringStatus}, nil
}
