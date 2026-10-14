package summary

import "testing"

func TestObservedComposeResponses(t *testing.T) {
	if verifiedComposeAnswer("PostgreSQL; reverse proxy обычно nginx/traefik; authz/authorize.go") {
		t.Fatal("accepted observed unsupported proxy guess")
	}
	if !verifiedComposeAnswer("Здравствуйте!\n\nВ docker-compose.yml указаны образы:\n- postgres: `pgvector/pgvector:pg17`\n- x-caddy-common (CADDY_IMAGE): `${CADDY_IMAGE:-caddy:2-alpine}`.\n\nПо этим строкам:\n- база данных: Postgres (образ `pgvector/pgvector:pg17`, `POSTGRES_DB` по умолчанию `airlock`),\n- reverse proxy: Caddy (образ `caddy:2-alpine` или переопределённый `CADDY_IMAGE`).\n\nФайл docker-compose.yml в GitHub: https://github.com/airlockrun/airlock/blob/e605529334a250d3158d546b5702c7651eb052c6/docker-compose.yml\n\nЭтот ответ составлен на основе страниц\n+ https://cdn.wikibot.pro/4c1594b6-85fe-4526-a48e-96fc40c69910/7e7f28/Airlock-public-code-guide-e605529334a2.docx\nВ них вы найдете более подробную информацию.") {
		t.Fatal("rejected real source-linked compose answer")
	}
}
