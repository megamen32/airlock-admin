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
type Result struct {
	Ready      bool    `json:"ready"`
	DocumentID string  `json:"document_id,omitempty"`
	Fields     []Field `json:"fields,omitempty"`
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
	doc := v.Documents[0]
	if doc.Key != "INV1" || doc.Type != "INV" || doc.Broken == nil || *doc.Broken || doc.Data == nil {
		return Result{}, bad
	}
	r := Result{Ready: true, DocumentID: v.ID, Source: "Beorg KYC API", Message: "Настоящий результат Beorg для вымышленного учебного счёта. Распознавание выполнено один раз 15 октября 2026 года; поля требуют проверки человеком."}
	for _, f := range [][2]string{{"DocNumber", "Номер счёта"}, {"DocDate", "Дата счёта"}, {"SellerName", "Поставщик"}, {"CustomerName", "Покупатель"}, {"InvoiceBase", "Основание"}, {"ProductName", "Наименование"}, {"ProductUnitsNumber", "Количество"}, {"ProductPrice", "Цена"}, {"DocTotalAmountWithNDS", "Итоговая сумма"}, {"Currency", "Валюта"}} {
		b, ok := doc.Data[f[0]]
		if !ok || string(b) == "null" {
			continue
		}
		var s string
		if json.Unmarshal(b, &s) != nil {
			return Result{}, bad
		}
		s = strings.TrimSpace(s)
		if len(s) > 2000 {
			return Result{}, bad
		}
		if s != "" {
			r.Fields = append(r.Fields, Field{Name: f[1], Value: s})
		}
	}
	if len(r.Fields) == 0 {
		return Result{}, bad
	}
	return r, nil
}
