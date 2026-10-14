package company

import (
	"context"
)

type FindCompanyIn struct {
	Identifier string `json:"identifier" jsonschema:"description=ИНН (10 или 12 цифр) либо ОГРН (13 или 15 цифр)"`
}

type FindCompanyOut struct {
	Found      bool    `json:"found"`
	Company    Company `json:"company"`
	Source     string  `json:"source"`
	LookedUpAt string  `json:"looked_up_at"`
	Message    string  `json:"message,omitempty"`
}

type Tools struct{ service *Service }

func NewTools(service *Service) *Tools {
	if service == nil {
		panic("company: service is required")
	}
	return &Tools{service: service}
}
func (t *Tools) FindCompany(ctx context.Context, in FindCompanyIn) (FindCompanyOut, error) {
	company, err := t.service.Find(ctx, in.Identifier)
	if err != nil {
		return FindCompanyOut{Found: false, Source: "DaData", Message: err.Error()}, nil
	}
	return FindCompanyOut{Found: company.Found, Company: company, Source: "DaData", LookedUpAt: company.FetchedAt}, nil
}
