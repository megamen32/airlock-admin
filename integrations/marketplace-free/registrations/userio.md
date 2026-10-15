# UserIO — подключена отдельная учебная почта

[Вебформа](https://d88-userio-mail.demo.airlockrun.ru/) · [Чат](https://demo.airlockrun.ru/agents/d88-userio-mail/chat?demo=1).

Self-hosted API, отдельной платы за подключение нет. Native SDK v0.7.0,
приложение `a3d4f646-e68b-4725-87f3-bdf396041937`, slug `d88-userio-mail`.
Русские MVC форма и `demo_mail` используют один backend. В демо показывается
одно выбранное реальное учебное письмо AIRLOCK-MAIL-002, не клиентская заявка.

## Источник и доступ

- Новый обычный UserIO-пользователь, отдельный доменный ящик и штатный user-owned IMAP `/v1/imap/accounts`. Личная и регистрационная почта не используется.
- До подключения выключены account AI, все automatic kinds и send/subscribe/download; GET analysis-policy подтвердил account_ai_disabled=true, allowed=false.
- Для приложения выпущен отдельный personal token read_only. Public HTTPS чтение200, изменение настроек403. Новый пользователь видит ровно свой один аккаунт.
- Native raw Connection доступен только администратору. Гости вызывают один фиксированный GET; account/conversation/provider-message IDs, sender и хэш полного содержимого проверяются. Остальные письма не отображаются. Отправки, ответов, произвольных путей или выбора аккаунта нет.
- Кэш5мин,12API-чтений/час, один inflight. Кэш связан с выбранным содержимым: после обновления источника старый ответ не возвращается.
- Пароли и оба токена сохранены primary0600 + copy100 + Яндекс.Диск с обратным чтением, без дополнительного ключа шифрования. Защищённые файлы `mail-airlock-demo.json`/`userio-demo.json` находятся вне Git.

## Настоящая доставка и дата

Оператор отправил одно начальное учебное письмо, затем отдельный диагностический
контроль с однозначной датой GMT. У каждого уникальный Message-ID и сохранённое
намерение до SMTP DATA; исходные отправки не повторялись. Для контроля есть
SMTP250/queue receipt, независимый IMAP BODY.PEEK/UIDVALIDITY/UID и реальная
копия в UserIO. Его header Date и received_at API совпали; app показывает
2026-10-15T06:56:43Z. В отдельном ящике два учебных сообщения, app выбирает только
контрольное; личных данных нет, guest-действия новых писем не создают.

Первая проверка выявила общий upstream дефект UserIO для Date -0000 на MSK-хосте:
наивный datetime сдвигается на3часа. [Доказательство и следующий шаг](userio-imap-date-issue.md)
сохранены также в canonical UserIO `.agents/tasks/20261015-imap-naive-date-from-airlock.md`.
Общий parser ещё требует исправления у владельца UserIO. Демо не исправляет
время придуманной поправкой: оно читает действительно полученное письмо с
корректно распознанной датой. Source/runtime UserIO не менялись; PID1359622,
NRestarts0, сервис active. Доступ добавлен штатным API, без перезапуска.

## Проверенная приёмка

- Генерация SDK/templ/Tailwind + parser tests PASS5.130s, peak227328000B. После исправления обязательного Description добавлен regression test создания native manifest и прав доступа. Финальные5fast unit PASS2.105s, peak199598080B/OOM0; expected60/max600s. Только локальная логика, не замена интеграции.
- Native final build `848b3f95-2fad-4b56-83ea-1860b42764c7` complete за 33.099s, SDK0.7.0, sourceRef `fcb4dae2fcc82d2c0b3d53d5299c38d75c8cbb6d`. Все26файлов native export совпали с published source main5e315363.
- Обычный native guest: настоящие тема/отправитель/текст/дата; obsolete cached AIRLOCK-MAIL-001 отсутствует. Source/credential/PATCH403. Final native chat success16.156s, реальный tool result и точный учебный ответ AIRLOCK-MAIL-002/06:56GMT, без отправки.
- Headed44: UserIO CTA слева/видима375/1280, правильный редактируемый draft/0автоотправок, реальная форма и светлая/тёмная темы, nooverflow — PASS13.522s. Dark mobile screenshot просмотрен.
- Main v28 сохраняет чужие portal/legal assets и показывает все4готовых component CTA «Штатно»: NoticePlace, eXmanager, UserIO, GPTAdmin. Все4в левой группе и видимы375/1280; GPTAdmin chat draft/0autosend и web UI доступны, без нового provider-чтения. PASS10.560s. В карточке каталога также4кнопки, без горизонтального overflow; мобильный screenshot просмотрен, остальные пункты доступны прокруткой.
- Теперь11nativeapps; это не означает готовность полного «Штатно» или всех37исходных/33текущих карточек.

Private receipts: `.tmp/userio-demo-20261015/`. Sealed demo88 high8/max12GiB,
app1GiB, BuildKit4GiBCPU2/onebuild; source1GiBCPU2tasks128swap0temp2GiB,
expected60/max600s. Browser44/88 only, finite unit. Airlock core и private RU
frontend не менялись. Точные source pins, сценарии обновления и ограничения
сохранены отдельно от оригинального Airlock.
