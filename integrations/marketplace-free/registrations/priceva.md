# Priceva — бесплатная демо-кампания, реальный каталог

- Аккаунт владельца и правильная кампания CompetitorPriceMonitoring3jb созданы ранее; старую Assortment кампанию сохранили.
- Ключ: ~/.config/airlock-marketplace-accounts/priceva-setup-key-3jb.json; plaintext не публикуется. Доступ и backup100/Яндекс.Диск сохранены ранее.
- Реальные API чтения15Oct: товар Logitech K120, артикул920-002522, клиентский код airlock-demo-k120; источник regard.ru, публичная карточка товара. Рыночной цены нет; default_price0 — настройка, не предложение магазина.
- 15Oct04:17UTC: general_stat sent0/processing0, расписание32m active, last_start0. Один официальный monitoring/run_product с фильтрами только product p/source f принят successtrue/urls_count1. Не повторять эту отправку. Затем sent1/processing0, source monitoring_statusdone, report/list по-прежнему0 без котировки.
- Гостевой адаптер только читает фиксированный товар/источник и количество отчётов. Публичная кнопка не запускает мониторинг, не меняет цены и ничего не покупает. Название, артикул, ссылка и статус берутся из реального API; отсутствие цены показано явно.
- Демо: https://d88-priceva-monitor.demo.airlockrun.ru/ . Чат price_monitor.
- Условия: Starter без карты/платежей; API включён. Кэш2мин,4обновления/час, один активный запрос; timeout60с/20с на метод,1MiB.
- Официальный API/схемы: https://priceva.docs.apiary.io/ и https://github.com/priceva/priceva-api-sdk-php . MonitoringRunProductRequest/SourceListRequest подтверждают filters и add_monitoring.
- Вход по старому browser export больше не действует; пароль не сбрасывали и личный M1 не использовали. Для проверки цен продолжить чтение существующей проверки/источника; новые запуски не делать без причины.

15Oct04:24UTC: отчёт появился асинхронно. Настоящий report/list с фильтрами
client_code airlock-demo-k120/company_id выбранного regard.ru/region_idj
вернул price_min=price_avg=price_max1280RUB, competitor_cnt1, date1792037917
(15Oct07:18:37МСК). Собственные price/recommended_price по-прежнему0,
они НЕ используются как рыночные. Парсер quote проверен на реальном ответе
и malformed/foreign-scope случаях; далее native build и guest price acceptance.

Приёмка завершена: final native buildbcc6f56f, обычный guest form1280₽ и
chat20,163с с реальной котировкой; credentials403. Headed44 actualCTA375/1280,
правильный чат/черновик/0автоотправок, webform1280₽/Москва/время/light-dark.
Полный native export совпал с owned source, core не менялся. Первые абзацы
про отсутствие цены выше — история до появления первого отчёта.
