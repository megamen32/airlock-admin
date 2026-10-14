# Agent Notes

Keep this file short and current. Record decisions that are specific to this
agent; shared SDK and scaffold conventions belong in `AGENTS.md`.

## Product

- Russian-language company lookup by INN/OGRN; exposes only the free DaData `findById/party` endpoint. No risk assessments or paid enrichment.
- Public demo quota is capped at 1,000 uncached provider requests per UTC calendar day; successful results are cached in native PostgreSQL for 10 minutes. At most five requests are concurrently in flight.

## Architecture

- `company` validates numeric identifiers before quota use, bounds provider calls to 20 seconds and streams with a 1 MiB cap. UI and chat share this service.
- Quota and cache persist in native Agent.DB() PostgreSQL through a goose migration; daily quota reservation is atomic. Raw conn_dadata is Admin-only; users reach the fixed endpoint through find_company and the lookup form. Provider statuses/errors are sanitized before guest output.

## Integrations

- Official reference: https://dadata.ru/api/find-party/ . POST `https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party`, JSON `{query,count:1,branch_type:"MAIN"}`. DaData documents the free plan quota as 10,000 requests/day; this app additionally limits its demo to 1,000/day.
- Native Airlock connection slug `dadata`, token credential injected into `Authorization`; operator stores the full `Token <API-key>` header value in the native encrypted resource. Operator must bind a DaData API key through native credential management. Until a key is bound, external lookup is not configured. Build success does not evidence a live lookup.

## UI

- Theme, typography, layout conventions, and accessibility decisions.
