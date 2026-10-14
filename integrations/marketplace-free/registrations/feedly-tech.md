# Feedly.tech («Голос клиента», НЕ feedly.com) — externalblocked
- статус: externalblocked (форма регистрации не сабмитится автоматизацией; аккаунт НЕ создан)
- основание: https://app.feedly.tech/auth/register , лендинг https://feedly.tech/en/ , MCP https://mcp.feedly.tech
- signup/login: https://app.feedly.tech/auth/register (вход /auth/login), email: airlock@bezrabotnyi.com, auth: password (пароль сгенерирован и сохранён в кред-файле для ручной регистрации)
- блокер (точный): поля Имя/Почта/Пароль/Повтор пароля заполняются успешно (проверено снапшотом), но отправка не срабатывает: клик по кнопке «Создать аккаунт» по a11y-ref, клик по CSS (button[type=submit], form button), Enter в поле, Tab+Enter — без реакции: нет ошибки, нет навигации, нет письма в UserIO; видимая капча в a11y-дереве отсутствует; вероятна скрытая антибот-проверка (invisible captcha) — требование контракта: стоп при капче/неразрешимом сабмите
- trial/квота: не достигнуты (квоты free не опубликованы вендором)
- API-проверка: не выполнялась (ключа нет; MCP-токен выдаётся из кабинета после входа)
- креды ref: ~/.config/airlock-marketplace-accounts/feedly-tech.json (backup: yadisk:Backups/marketplace-accounts/, status OK, remote readback пройден)
- следующий шаг: ручная регистрация в браузере человека с сохранённым паролем, затем кабинет → MCP-токен
