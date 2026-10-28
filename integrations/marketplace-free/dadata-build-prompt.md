# Проверка компаний — DaData

Build a small Russian native Airlock app "Проверка компаний — DaData".
Read the current /libs/agentsdk/REFERENCE.md and scaffold AGENTS.md first.
Use official native SDK, no platform/core changes, no sidecars or raw secrets.

Real external integration: https://dadata.ru/api/find-party/ (read it live).
POST https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party
headers Content-Type and Accept application/json, Authorization: Token API_KEY.
Body {"query":"7707083893","count":1,"branch_type":"MAIN"}.
RegisterConnection slug dadata, base URL https://suggestions.dadata.ru,
and native API-key auth injection with the documented Token scheme (NOT Bearer).
Credentials will be bound through native Airlock after build; never read an
environment token or hardcode an API key. Inspect SDK auth injection types.
Only this free endpoint is allowed. No clean API, paid enrichment, arbitrary URLs,
MCP passthrough, or obtaining a secret key.

Expose typed tool find_company at AccessUser and a Russian web form: accept
digits-only INN (10 or12 digits) or OGRN(13 or15), query the native connection,
parse real suggestions, return at most one company with name, INN, OGRN,
status, address and main OKVED. Missing fields mean "Нет данных"; never invent
facts or show sample company data as a result. Do not make credit/legal risk
claims. Show source DaData and time of actual lookup.

Keep a persisted daily request counter capped at1000 for this public demo and
at most5 outstanding provider calls; cache a successful lookup for10minutes.
Use supported native SDK PostgreSQL Agent.DB() and goose migrations, not a new external service. Provider
request timeout20s, max response1MiB; reject before consuming quota for invalid
input. Missing resource credentials and401/403/429 must become short Russian
setup/limit messages; do not leak auth/response headers or secrets to guest output.

The app chat must actually call find_company for requests like "Найди компанию
по ИНН 7707083893" and use its result. Never answer company facts from model
memory when an actual lookup is requested. Make UI mobile-friendly and Russian.
No automatic background requests and no writes to external services.

NOTES.md: record exact official endpoint/auth/free quota10000/day, local demo
cap1000/day, source link, native credential binding and evidence boundary:
until the operator binds a key, external lookup is not configured.
Build with go tool air build, then exit success only after compilation.

Raw Connection.Access must be AccessAdmin; only typed tool and form are for users.
