# Priceva demo catalogue and monitoring status

Native SDK0.7.0, no core changes. Encrypted Connection priceva AccessAdmin,
Apikey header. Public price_monitor and Russian form share fixed reads:
product/list(client_code airlock-demo-k120), source/list(product_id p/id f,
add_monitoring true), report/list(client_code airlock-demo-k120), page1/limit20.
Parser validates exact demo product/source/relationship/public HTTPS URL;
selected fields only. default_price=0 is a configured input, NEVER a market
quote; item.price remains null. monitoring_status done is not price success.
No user input, writes, repricing, purchases or public on-demand monitoring.

Operator found schedule32m never started (last_start0, sent0/processing0).
One documented monitoring/run_product for existing p/f accepted urls_count1
on15Oct04:17UTC; provider stats sent1/processing0 but report/list still0 and
source monitoring_status done with no quote. Do not repeat this admission.
Old browser auth export expired; no password reset or M1 browser used.

Persistent cache2min,4refresh/h, one active,60s total/20s per method,1MiB
response cap; no quota reset during source update. Cached old counter-only
payload is refreshed once because it has no item. Fixed demo-only data,
not a complete price comparison yet. Tests: fast unit actual sanitized
provider product/source frames plus invalid/private scope cases; focused
integration real native build + ordinary guest form/chat + headed44 light/dark.
Existing app1GiB, single BuildKit4GiB/CPU2. Preserve same native scaffold.
