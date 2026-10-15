# Feedly.tech («Голос клиента», НЕ feedly.com) — externalblocked (existing-account; аккаунт существует, войти нельзя)

- статус: externalblocked (existing-account: 409 при регистрации, вход 401, восстановление сломано)
- основание: https://app.feedly.tech/auth/register , лендинг https://feedly.tech/en/ , MCP https://mcp.feedly.tech
- signup/login: https://app.feedly.tech/auth/register (вход /auth/login), email: airlock@bezrabotnyi.com, auth: password (зарезервированный пароль в кред-файле; сервером НЕ принят)
- прогресс ретрая 15.10 (headed + резидентный прокси 192.168.2.1:3128 + AutomationControlled off): проблема сабмита СНЯТА — POST /api2/auth/register доходит до сервера; ответ 409 {"message":"Пользователь с таким email уже существует. Используйте другой email или войдите в систему"} — аккаунт существует (создан в одном из прежних запусков); попытка входа зарезервированным паролем → POST /api2/auth/login → 401 и redirect /auth/login?error=auth_required; писем от feedly.tech нет ни в INBOX, ни в Junk за всё время наблюдения (0 шт.) — подтвердить существующий аккаунт нечем
- блокер (точный): страница /auth/reset-password детерминированно падает «Application error: a client-side exception has occurred» (воспроизведено в двух сессиях, с параметром token и без) — восстановление пароля сломано на стороне сайта; дубль регистрации не создавали (409)
- trial/квота: не достигнуты (квоты free не опубликованы вендором)
- API-проверка: не выполнялась (ключа нет; MCP-токен выдаётся из кабинета после входа)
- креды ref: ~/.config/airlock-marketplace-accounts/feedly-tech.json (backup: 100+Диск OK, rc=0)
- следующий шаг: ручной вход человеком (обычный браузер, зарезервированный пароль или восстановление) либо обращение в поддержку feedly.tech — не делали; после входа: кабинет → MCP-токен для mcp.feedly.tech
