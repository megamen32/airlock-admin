package summary

import (
	"encoding/json"
	"errors"
	"strings"
)

const DocumentID = "s-1664407"

type Input struct{}
type Field struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}
type Item struct {
	Name      string `json:"name"`
	Quantity  string `json:"quantity"`
	UnitPrice string `json:"unit_price"`
	Amount    string `json:"amount_without_vat"`
}
type Result struct {
	Ready      bool    `json:"ready"`
	DocumentID string  `json:"document_id,omitempty"`
	Fields     []Field `json:"fields,omitempty"`
	Items      []Item  `json:"items,omitempty"`
	Source     string  `json:"source"`
	FetchedAt  string  `json:"fetched_at,omitempty"`
	Message    string  `json:"message"`
}

func Report(raw []byte) (Result, error) {
	bad := errors.New("invalid Beorg invoice result")
	var v struct {
		ID        string `json:"document_id"`
		Documents []struct {
			Key    string                     `json:"key"`
			Type   string                     `json:"type"`
			Data   map[string]json.RawMessage `json:"data"`
			Broken *bool                      `json:"broken"`
		} `json:"documents"`
	}
	if len(raw) > 512<<10 || json.Unmarshal(raw, &v) != nil || v.ID != DocumentID || len(v.Documents) != 1 {
		return Result{}, bad
	}
	d := v.Documents[0]
	if d.Key != "INV1" || d.Type != "INV" || (d.Broken != nil && *d.Broken) || d.Data == nil {
		return Result{}, bad
	}
	read := func(data map[string]json.RawMessage, key string) (string, error) {
		b := data[key]
		if len(b) == 0 || string(b) == "null" {
			return "", nil
		}
		var s string
		if json.Unmarshal(b, &s) != nil || len(s) > 2000 {
			return "", bad
		}
		return strings.TrimSpace(s), nil
	}
	r := Result{Ready: true, DocumentID: v.ID, Source: "Beorg KYC API", Message: "Результат ранее обработанного учебного счёта. OCR-поля требуют сверки с изображением: пропуски и опечатки сохранены, не исправлены по догадке. Новая обработка не запускалась."}
	populated := 0
	for _, f := range [][2]string{{"DocNumber", "Номер счёта"}, {"DocDate", "Дата"}, {"SellerName", "Поставщик"}, {"CustomerName", "Покупатель"}, {"InvoiceBase", "Основание"}, {"DocAmountWithoutNDS", "Сумма без НДС"}, {"DocTotalAmountWithNDS", "Итог с НДС"}, {"Currency", "Валюта"}} {
		s, e := read(d.Data, f[0])
		if e != nil {
			return Result{}, bad
		}
		r.Fields = append(r.Fields, Field{Name: f[1], Value: s})
		if s != "" {
			populated++
		}
	}
	var products []map[string]json.RawMessage
	if b := d.Data["Products"]; len(b) > 0 && string(b) != "null" {
		if json.Unmarshal(b, &products) != nil || len(products) > 100 {
			return Result{}, bad
		}
	}
	for _, p := range products {
		values := make([]string, 4)
		for i, key := range []string{"ProductName", "ProductUnitsNumber", "ProductPrice", "ProductAmountWithoutNDS"} {
			s, e := read(p, key)
			if e != nil {
				return Result{}, bad
			}
			values[i] = s
		}
		r.Items = append(r.Items, Item{Name: values[0], Quantity: values[1], UnitPrice: values[2], Amount: values[3]})
	}
	if populated == 0 {
		return Result{}, bad
	}
	return r, nil
}
