# Configurable GPTAdmin/ShellMCP security modes

Status: in_progress

## Исходный запрос

Сделать обычный режим работы беспроблемным, а максимальную и кастомную защиту явно настраиваемыми через админку и конфигурацию; сохранить philosophy-подход проекта.

## Objective

Устранить скрытое противоречие между privilege execution и systemd hardening. Ввести понятные режимы: обычный, максимальная защита, кастомный набор проверок для bearer/process/ShellMCP installation.

## Business canary

В обычном режиме штатный ShellMCP privilege flow работает; максимальный режим проверяет bearer ownership/signature и process restrictions; кастомный режим отражается в админке, CLI/config и live unit; все режимы покрыты тестами.

## Explicit exclusions

Не удалять `philosophy`; не менять production security mode до отдельного подтверждённого canary; не скрывать режимы в hardcoded systemd шаблоне.

## Initial active-minute estimate

90 active minutes.

## План

1. Инвентаризировать `philosophy`, текущие режимы, bearer/auth и systemd generation.
2. Сформировать компактный контракт режимов и конфигурации.
3. Реализовать CLI/config/admin UI и генерацию units.
4. Добавить red/green unit, auth, process and UI tests.
5. Провести isolated canary, затем согласовать production mode/apply.
