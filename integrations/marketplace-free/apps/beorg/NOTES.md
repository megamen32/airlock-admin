# Beorg demo adapter

Native SDK0.7.0. No Airlock core changes. Russian web form and invoice_ocr tool share one service. Only fixed GET /api/document/result/s-1664407. Native encrypted admin-only Connection injects token as query parameter; no secrets in source/errors. No user input, uploads, payments, or mutations. Operator submitted one explicitly fictional invoice using the welcome credit; never replay upload after unknown outcome. Read cache15min, quota12/h, timeout20s, body512KiB, one active request; app1GiB, standard single BuildKit4GiB/CPU2. Original invoice static PNG is deliberately public and contains no real personal/bank data. Fields selected from actual OCR response, absent fields not replaced by expected values. Light/dark follows system, no forced theme. Test: fast unit over real sanitized response and malformed cases; focused integration real guest form/chat and headed44. Provider welcome balance is finite, not a perpetual free API.

STATUS: prepared adapter only, not deployed or accepted. Provider accepted one
INV sample and deducted42welcome rubles, marked processed after296s, but public
result endpoint500 and cabinet detail TypeError/NoneType prevent real field proof.
No actual response fixture or passing consumer claim exists yet. Before deployment,
recover same s-1664407 result (do not upload again), validate parser against actual
fields, then native build, guest form/chat and light/dark browser acceptance.
