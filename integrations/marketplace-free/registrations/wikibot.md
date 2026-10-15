# Wikibot — API-key-and-real-read

- статус: api-key-and-real-read
- основание: https://wikibot.pro/docs/api ; https://wikibot.pro/docs/quick-start/tariffs
- signup/login: https://app.wikibot.pro (sign-in), email: airlock@bezrabotnyi.com, auth: passwordless (NextAuth magic-link на почту, пароля нет)
- trial/квота: бесплатный тариф с welcome-кредитами (количество не опубликовано); каждый вопрос тратит кредиты; демо-вопрос потратил 1 кредит; при исчерпании — перевод на живого оператора (не оставлять бота в проде без присмотра)
- account/workspace IDs: бот «Airlock Demo» (Оператор–Поддержка) `4c1594b6-85fe-4526-a48e-96fc40c69910`; источник БЗ: https://airlockrun.ru/ (парсер «Веб-сайт/Сайт», индексация запущена)
- креды ref: ~/.config/airlock-marketplace-accounts/wikibot.json (backup: yadisk:Backups/marketplace-accounts/, статус OK, readback rc=0 2026-10-15)
- API-проверка: POST https://api.wikibot.pro/api/bot/ask `{"chatId":"mktr-demo-1","query":"Что такое Airlock и как получить гостевой доступ?","format":"raw"}` с заголовком `Authorization: <ключ>` (БЕЗ Bearer) → HTTP 200, содержательный ответ: «Airlock — это платформа корпоративных приложений и одновременно шлюз…; каталог доступен без регистрации; гостевые доступы согласуются с командой Airlock» — бот ответил по базе знаний
- блокеры: нет. Замечания для адаптера: ключ передаётся голым значением в Authorization (native AuthInjectAPIKey); при регистрации на /sign-in нужно отметить все 3 согласия (оферта, политика, персональные данные)

## Вопросы пользователя по публичному коду — 15 октября, root

Обнаружено и исправлено ограничение: раньше native tool и форма всегда
спрашивали один compose пример, игнорируя вопрос посетителя. Теперь оба
пути принимают question (до600Unicodeсимволов), передают настоящий вопрос
в Wikibot и используют кэш именно этого вопроса. Пустой ввод сохраняет
прежний проверенный compose пример. Общие квоты4/час/20всего не сбрасывались;
ключ/бот/БЗ не пересоздавались, приватный Internal не загружался.

Провайдер в настоящей авторизованной read-only проверке показывает65/65
indexedPages,3203embeddings:7страниц сайта +58DOCX документов/выдержек.
Это подтверждает принятую индексацию частей, а не успешный поиск по каждому
из478файлов. Исходный снимок e605529334a250d3158d546b5702c7651eb052c6.

Два реальных guest POST дали разные ответы с точными source links:
Authorize → apperr.ErrUnauthorized/apperr.ErrForbidden по authz/authorize.go;
секреты → AES-256-GCM,airlock-secret:v1,airlock-crypto:v2 по docs/secret-storage.md.
Ответ про секреты также использовал реально загруженные части18/32,
не только краткую architecture-выдержку. Результаты вручную сверены
с неизменяемыми публичными файлами. Это настоящий ответ поставщика;
универсальную достоверность всех ответов не обещаем.

Локальная генерация/3fastunit PASS6.138с, peak402993152B/OOM0. Первая
source-проверка не нашла локальный Tailwind; штатный SDK air update
восстановил toolchain, core не патчили. Runtime pin v0.7.0 сохранён.
Nativebuild42874909-65ea-4f3c-87fb-709b0791f3fc complete,SDK0.7.0,
sourceRef99b7cd1e9618e94951b9d0ccaf0166739370f728; все26exportfiles
совпали с published source7f27ca60. Headed44: собственный вопрос в форме,
настоящий ответ,375/1280/lightdark/nooverflow,13.236с; mobile dark screenshot
просмотрен. Новый onboarding объясняет свои вопросы и600символов,0autosend.
Private receipts .tmp/wikibot-questions-20261015/.

Обычный nativeguest chat success19.255с: реальный tool получил точный вопрос
о docs/secret-storage.md, вернул ready=true и source-linked AES/оба конверта;
модель ответила по этому результату. До нового prompt существовал durable
admission intent, повторов не было. Гостевой JWT перед canary штатно обновлён
через свою refresh cookie; без нового signup/регистрации.
