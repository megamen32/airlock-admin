# MaxFrame — native demonstration adapter

Official API: https://maxframe.ru/api-docs/ . Dedicated read-only test key issued
16Oct2026; partner allowed public demonstration15Oct. Credentials remain outside
Git in the protected account store, second local copy and Yandex Disk (readback
verified). No paid activation.

One native Admin-only Connection injects X-Api-Key at https://maxframe.ru.
maxframe_snapshot and the form share summary.Service: fixed GET channels?page=1
(project at most five entries) or channel/by-link for a strictly validated public
https://max.ru URL. Catalog browsing and per-channel statistics, not topic search
or ranking. SDK0.7.0 scaffold; no core/Internal/Russian frontend changes.

Cache10min,20entries,12refreshes/hour including failures, one in-flight request,
20s timeout,1MiB response cap. Explicit channel projection; absent metrics remain
absent. No messaging, ads, arbitrary URL fetches or full export. Native app1GiB/
no swap/1024tasks; existing buildkit4GiB/2CPU/parallelism1 and UID budgets retained.

UI: native DaisyUI light/dark semantic tokens, system font, one column, result
before form, wrapping buttons, no custom colour palette or font CDN.

Readiness gate: successful actual API, ordinary guest form/chat, both themes and
mobile before public grants or CTA. Initial documented header and query auth on
16Oct returned401. Support followup1988012 sent once; after vendor response
1988013 the same header request returned200/100 real channels and channel ria
returned real subscriber/view/ER values. No synthetic channel data.

Focused source checks: URL validation unit and actual templ generation, bounded
on100 at2GiB/no swap/2CPU/256tasks, expected60s/max600s including compilation.
Native integration expected300s/max3000s; headed44 one owned browser2GiB/no swap/
2CPU/512tasks/wall3600s/profile512MiB. Budgets measured before admission.
