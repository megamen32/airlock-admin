# PolzaAI — paid-only (подтверждено вживую), аккаунт не создавался

- статус: paid-only; регистрация НЕ выполнялась (по заданию — без создания аккаунта)
- основание: https://polza.ai/docs/glavnoe/faq.md («Оплата и баланс»), https://polza.ai/docs/glavnoe/quickstart.md, live 15.10.2026
- signup/login: https://polza.ai/register существует (почта + пароль ≥8 символов со спецзнаком + подтверждение; Yandex SmartCaptcha-слайдер обязательный), не использовался
- trial/квота: бесплатного trial/стартовых токенов нет — только prepaid
- account/workspace IDs: нет
- креды ref: нет (аккаунт не создавался)
- API-проверка: невозможна — вживую зафиксировано: quickstart шаг 2 «Пополните баланс в личном кабинете»; FAQ «Оплата и баланс»: «Баланс пополняется в рублях. Возможно ручное пополнение или автоматическое при падении баланса ниже установленного порога». Минимальное пополнение 100 ₽ (research по https://polza.ai/software-registry/functional-characteristics). OpenAI-compatible база https://polza.ai/api/v1 (по research)
- блокеры: единственный путь к API — пополнение баланса (карта/СБП/счёт); пополнение запрещено контрактом → paid-only. Дополнительно: обязательная SmartCaptcha при регистрации

Скриншот: /tmp/mktr-polza-faq.png (вне Git).
