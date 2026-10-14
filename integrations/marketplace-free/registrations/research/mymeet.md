# mymeet.ai

- signup: https://app.mymeet.ai/en/sign-up (кнопка «Get started»; вход https://app.mymeet.ai/en/sign-in).
- поля формы: страница регистрации — SPA, состав полей без JS не виден → нужен браузер. Карта точно не нужна: «Free forever. No credit card needed.», «No credit card required». Телефон/капча — неизвестно.
- капча: неизвестно (нужен браузер).
- бесплатный режим: постоянный Free-тариф: «180 minutes free every month», «180 free min per month, 10 AI Chat prompts», без карты, календарные/видео-интеграции, файлы до 1 ГБ. Основание: https://mymeet.ai/ + https://mymeet.ai/pricing.
- API/MCP: только на платных тарифах — «API is available on paid plans», «A paid plan is required» (https://mymeet.ai/api). На Free API-ключ выдаёт 403 (зафиксировано в CATALOG.md). Тарифы: Free $0, Lite $8–10, Pro $28–32 за пользователя/мес, Business — по запросу. Ключ создаётся в Settings → API Key: https://app.mymeet.ai/en/settings/api-key. Базовый URL: https://backend.mymeet.ai; auth-заголовок `X-API-KEY: <ключ>`; доки https://backend.mymeet.ai/docs/. MCP есть и использует тот же ключ (`--bearer-token-env-var MYMEET_API_KEY`).
- безопасный тестовый запрос: на Free недоступен (403). На платном: `GET https://backend.mymeet.ai/api/meeting/status?meeting_id=<id>` с `X-API-KEY` — read-only статус встречи. Для бесплатной группы — «нет».
- особенности/риски: UI бесплатен постоянно, но API/MCP закрыты платным тарифом; для Airlock-сценария с API нужен Lite+ ($8+/пользователь/мес). Проверено 14.10.2026.
