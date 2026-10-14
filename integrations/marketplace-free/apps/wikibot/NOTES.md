# Wikibot demo connector

Official API: https://wikibot.pro/docs/api and its OpenAPI, checked15Oct2026.
Fixed POST /api/bot/ask; raw Authorization key is injected by an encrypted native
AccessAdmin Connection. Only typed airlock_faq and HTML form are AccessUser.
One fixed public FAQ question, official airlockrun.ru knowledge base, unique random
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
