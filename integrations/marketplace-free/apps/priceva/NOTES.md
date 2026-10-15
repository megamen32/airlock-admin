# Priceva: real demo product and regional quote

Separate native SDK0.7.0 app; no Airlock core/RU frontend changes.
Encrypted Connection priceva, Apikey header, raw access Admin only. Public
price_monitor and Russian web form share the same bounded read service.

Fixed reads, page1/limit20:
- product/list: client_code airlock-demo-k120; validate productp/SKU920-002522.
- source/list: product_idp/idf, add_monitoringtrue; validate exact public
  regard.ru URL and relationship. Select no personal data or raw IDs.
- report/list: same client code, exact regard.ru company_id and Moscow regionj.
  Validate product/store/region/currency/date/competitor count and positive,
  finite ordered price_min/avg/max. Global aggregate companyfalse/regiona and
  unknown/missing scope are rejected. Own price/recommended_price and product
  default_price0 are configuration inputs, NEVER market quotes.

An explicit empty report returns no quote, not price0. A confirmed regional
quote supplies store, Moscow region, RUB, min/avg/max and actual collected_at.
Show its time in Moscow and state that the price may have changed. Source
monitoring_statusdone alone does not prove a price. Native cache is versioned
privately to reject old counter-only data without resetting persistent quota.

Operator15Oct: schedule32m active but last_start0/tasks0; general_statsent0.
One documented monitoring/run_product for existing p/f accepted urls_count1
at04:17:51UTC. DO NOT replay this admission. General_stat processing0 happened
before reports became readable; never use that count as proof of a final quote.
The real selected-store/Moscow report appeared later:1280RUB, one competitor,
date1792037917=15Oct04:18:37UTC. Those values are live fixture evidence, not
hardcoded prices. API and public app only read; no guest imports, new scans,
repricing, purchases, payments, or credential configuration.

Persistent cache2min,4refresh/h, one active request,60s total/20s per method,
1MiB cap. Existing app1GiB and single BuildKit4GiB/CPU2. No new daemon.
Fast unit over actual sanitized product/source/regional report plus malformed
and foreign-scope cases; focused integration real native build, guest form,
actual native tool-chat, credential403, headed44 first-leftCTA375/1280 and
real form light/dark. No test double is acceptance evidence.

Old browser export expired. No password reset or personal M1 browser used.
Existing primary account/API credentials and three backup copies preserved.
