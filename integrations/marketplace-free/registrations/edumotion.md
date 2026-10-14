# Edumotion — API-key-and-real-read (trial 14 дней)

- статус: created+emailverified; API-ключ выпущен и подтверждён реальным read-запросом
- основание: https://edumotion.ru/ (лендинг «14 дней бесплатно», «Без карты и автосписаний»); Swagger: https://api.edumotion.ru/docs/public-api
- signup/login: https://org.edumotion.ru/demo/start (демо-старт → «Создать организацию»), email: airlock@bezrabotnyi.com, auth: password
- регистрация: 2026-10-15, wizard email-код (два письма-кода, первый протух за 10 минут) → профиль (Компания Airlock, имя Никита)
- организация: отдельный тенант https://airlock.edumotion.ru (login на demo-поддомене даёт 401 AUTH_WRONG_ORG_SUBDOMAIN — email привязан к slug airlock)
- trial/квота: 14 дней тарифа «Профессиональный», без карты; API: до 5 ключей, до 10 webhook-подписок
- account/workspace IDs: org slug airlock; API key name airlock-integration (prefix fc19, id в JSON)
- креды ref: ~/.config/airlock-marketplace-accounts/edumotion.json (backup: yadisk:Backups/marketplace-accounts/, status OK; внутри api_key, base_url)
- API-проверка: GET https://api.edumotion.ru/public/api/v1/courses с X-Api-Key → HTTP 200, валидный JSON, items=0 (организация новая, опубликованных курсов нет); альтернативные read-эндпоинты: /public/api/v1/users, /assignments, /learning-paths (Swagger UI)
- webhooks: раздел «API и вебхуки» позволяет подписаться на события завершения курсов на наш URL — не настроено (не требовалось заданием)
- блокеры: нет. Для содержательных данных нужно создать курс в кабинете (ИИ-генерация за минуты)
