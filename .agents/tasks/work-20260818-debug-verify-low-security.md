# DEBUG_VERIFY_WORK_LOW_SECURITY_MODE

Status: in progress (temporary public developer canary explicitly authorized)

## Цель

Добавить явно opt-in debug-режим для восстановления OAuth/ShellMCP
потока: сохранять проверку ключа/подписи и `ADMIN_PASSWORD`, но не требовать
claims, срок токена или PKCE; после корректного signed enrollment ShellMCP не
требовать ручного `approve_pending_server`.

## Границы

- Режим включается только `DEBUG_VERIFY_WORK_LOW_SECURITY_MODE=1`. В этом
  цикле пользователь явно разрешил кратковременное включение на текущем
  публичном Hub; по завершении canary флаг возвращается в `0`.
- Реальные bearer, пароли, OAuth client secrets и relay credentials никогда не
  возвращаются браузерному UI, логам или документации.
- Подпись JWT/managed bearer и signed enrollment ShellMCP не обходятся.

## Canary

Focused Go tests доказывают: флаг снимает PKCE/claim gates, неизвестный ключ
остаётся отвергнутым, а signed ShellMCP enrollment получает credential без
ручного approval; явно включённый флаг действует и на публичном Hub.

## Evidence

- Pending public-mode regression test, full Hub test, deployment and browser canary.

## Оценка

Старт текущего контролируемого цикла: 2026-08-18T00:52:14+03:00
Минимум / максимум active: 15 / 30 минут.
