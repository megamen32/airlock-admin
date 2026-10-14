# Logsheet.ai

- signup: https://logsheet.ai/register (кнопка «Get started free»).
- поля формы: страница /register — SPA (WebFetch видит только заголовок «SignUp | Auth — Log Sheet») → состав полей не подтверждён, нужен браузер. Карта на Free не нужна: «No credit card required, forever».
- капча: неизвестно (нужен браузер).
- бесплатный режим: постоянный Free-тариф: «1 Company», «Up to 3 logs», «3 users», голосовой ассистент с лимитом «10 records / month ($0.15/record after)». Плюс «Free trial – 14 days» на тарифах Regular и Enterprise. Основание: https://logsheet.ai/company/pricing.
- API/MCP: только Enterprise — «Integrations & API access» в списке функций Enterprise («On request», «Contact us for a price quote»). На Free/Regular API нет. Swagger: https://api.logsheet.ai/api#/ (Developer manuals); auth в открытой части не подтверждён. MCP не заявлен.
- безопасный тестовый запрос: нет (API закрыт Enterprise-тарифом).
- особенности/риски: API только по коммерческому запросу; Enterprise trial 14 дней — это trial платного, не постоянный API-доступ; регистрация — SPA, нужен браузер. Проверено 14.10.2026.
