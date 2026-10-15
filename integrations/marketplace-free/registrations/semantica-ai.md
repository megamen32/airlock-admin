# Semantica AI — onboarding complete, real MCP read + seeded scan

- Проверено15.10.2026: вход существующим аккаунтом, без повторной регистрации.
- Проект Airlock / airlockrun.ru создан, регионРоссия, языкru, одна тема и один ручной вопрос о self-hosted ИИ-платформах/MCP. Онбординг завершён.
- API-ключ Airlock-demo-readonly-20261015 создан один раз; сохранён в private semantica-ai.json, вторая копия100 и Яндекс.Диск с успешнымreadback. Секретов здесь нет.
- Официальный MCP https://mcp.ai-semantica.com/mcp, Bearer API key (также поддерживается X-API-Key). Кабинет: https://app.ai-semantica.com/settings/api ; справка: https://app.ai-semantica.com/docs/api .
- Кабинет текущего usage-based тарифа явно разрешает API/MCP чтение проектов/сканов; запуск сканов и запись черезAPI требуютfixedплан. Послеонбординга не объявляем7дневныйполныйtrialилиAPIбессрочнобесплатным. Имеютсяwelcomeкредиты, платежи/карта/автосписание не подключались.
- Реальные MCP get_project и get_projects_summary: Airlock/airlockrun.ru/ru, promptsCount1. get_scan для завершённого15Octскана: 3requested,2received,0mentions,1failedGoogleAIO. ChatGPT/PerplexityответилибезупоминанияAirlock; ошибкаGoogleнеявляетсяответомбезупоминания.
- Один seed-скан запущен обычной кнопкой кабинета с подтверждением7подарочныхтокенов; повторных/автоматическихсканов нет. Этоодинпоисковыйвопрос, неоценкаобщейизвестностибренда.
- Private credentialref ~/.config/airlock-marketplace-accounts/semantica-ai.json ; backup yadisk:Backups/marketplace-accounts/semantica-ai.json + localcopy100; readbackOK.
- Native adapter apps/semantica-ai: fixedget_project+get_scan, hiddenrawMCP, typeduserbrand_visibility/webform. Persistentquota4refresh/h20total/cache30min; runtime20s,512KiBparsedresponse,1active; existingapp1GiB. Deployed: ordinaryguestwebform+nativechat success16.779s, actualMCPtoolreadytrue; credentialmutation403;20businesssourcefilesmatch. Public https://demo.airlockrun.ru/agents/d88-semantica-visibility/chat?demo=1 ; webUI https://d88-semantica-visibility.demo.airlockrun.ru/ . Detailed evidence in VERIFICATION.md.
