# Wikibot demo connector

Official API: https://wikibot.pro/docs/api and its OpenAPI, checked15Oct2026.
Fixed POST /api/bot/ask; raw Authorization key is injected by an encrypted native
AccessAdmin Connection. Only typed airlock_faq and HTML form are AccessUser.
One fixed technical architecture question; public airlockrun/airlock code is primary,
airlockrun.ru website secondary. See knowledge-source.json for immutable snapshot.
Unique random
128-bit chatId per provider call; no shared private histories or guest-controlled
URLs, bot IDs, administrator operations, attachments or messaging integrations.
Only SUCCESS answers from the expected bot/chat are displayed; OPERATOR/NO_ANSWER/
ERROR fail closed without invoking a human handoff API. No external channel attached.

Free tier with finite welcome credits, exact remaining credit count unavailable to
this ask-only key (billing/config GET403). No card/topup/paid fallback. Persistent
atomic limits:4new provider calls/hour,20total including errors; cache10min for this
fixed public question,1active request,60sdeadline,128KiBresponse cap. Separate chats
and fixed questions avoid guest-dialogue mixing. Replenishing credits is not automatic.
App1GiB; build uses existing demo88 BuildKit4GiB/2CPU, one build at a time.

## Public code knowledge,15Oct2026

User requested code-first answers with the website retained. Two source types in
Wikibot: unchanged Website6802 and DOCX6803 containing an immutable PUBLIC code
snapshot from https://github.com/airlockrun/airlock at commit
 e605529334a250d3158d546b5702c7651eb052c6. No Internal checkout or credentials
were uploaded. Public core/SQL/API/auth/container/docs:478files,3,627,185source
bytes. Frontend,generated DB Go bindings,tests/vendor omitted to fit the official
5MB account-wide free KB allowance. No paid expansion or topup.

Three large single documents were accepted for upload but parser rejected them
TOO_LARGE; none were counted as a successful index. Final segmentation: one
8-file architecture guide plus56small documents, each under~80KBsource text,
Heading1 file names and immutable GitHub links/line ranges. Actual owner dataset
read confirmed57DOCX documents/3,759,731stored bytes plus7website pages/70,276bytes.
Native search retrieved docker-compose code from the guide. Embedding/index job
completion is recorded separately; upload HTTP200 alone is not acceptance.
See knowledge-source.json for exact filenames, upload IDs and exclusions.

Reproduce small source documents without credentials:
python3 integrations/marketplace-free/wikibot-public-source.py --output <private-dir>
--revision <public-sha>. It downloads public GitHub with32MiBarchive/4MBtext caps,
process768MiB/60CPU-seconds and emits small DOCX files+manifest. Refresh is manual,
not automatic GitHub synchronization. Upload through official /kb/upload-file
using operator credentials outside source; preserve each admission before retries.
When updating revision/question, update knowledgeSource marker and provenance so
old landing-only cached responses are not reused. Native quota is not reset.

Native Connection proxy has a30s upstream timeout in unchanged Internal. A real
long technical Wikibot response took52.7s; form/chat failed honestly, not accepted.
Demo question now explicitly caps answer100words/no code listings to fit the
existing proxy deadline. Provider has free credits (owner read FREE, balance0,
credits93.7 before canaries); generic failure no longer invents credit exhaustion.

Final fixed demo is one-file compose analysis (database/proxy image names),
not a broad multi-topic overview. Real direct vendor answer6.329s matched public
pgvector/pgvector:pg17 and caddy:2-alpine plus the immutable compose URL. Generic
short multi-topic answer had guessed nginx/traefik; rejected and cache marker
changed. A narrow answer verifier requires these actual pinned source values
and the source URL before caching/display. This is fixed-demo validation, not
a general guarantee against model errors. A849character architecture excerpt
from actual public compose/authz source was also uploaded as DOCX file7687.
58DOCX files total; full provider embedding queue remains separately observable.

## Вопросы посетителей — 15 октября
Форма и native tool принимают question (до600Unicodeсимволов), общий Service
передаёт его настоящему Wikibot API. Пустой ввод сохраняет прежний compose
пример; проверка его точных image остаётся. Для остальных вопросов выводится
настоящий ответ поставщика, без выдуманного универсального факт-чекера.
Инструкция просит публичный код в приоритете, ссылки на файлы и честный отказ
при отсутствии сведений. Кэш связан с конкретным нормализованным вопросом;
квоты4/час/20всего, ключ, бот и БЗ не пересоздаются/не сбрасываются.
