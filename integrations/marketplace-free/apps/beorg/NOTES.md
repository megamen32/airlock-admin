# Beorg demo adapter

Native SDK0.7.0. No Airlock core changes. Russian web form and invoice_ocr tool share one service. Only fixed GET /api/document/result/s-1664407. Native encrypted admin-only Connection injects token as query parameter; no secrets in source/errors. No user input, uploads, payments, or mutations. Operator submitted one explicitly fictional invoice using the welcome credit; never replay upload after unknown outcome. Read cache15min, quota12/h, timeout20s, body512KiB, one active request; app1GiB, standard single BuildKit4GiB/CPU2. Original invoice static PNG is deliberately public and contains no real personal/bank data. Fields selected from actual OCR response, absent fields not replaced by expected values. Light/dark follows system, no forced theme. Test: fast unit over real sanitized response and malformed cases; focused integration real guest form/chat and headed44. Provider welcome balance is finite, not a perpetual free API.

15Oct provider returned200 for the same s-1664407; no second upload/spend.
Parser now matches actual absent broken flag, nested Products, preserves raw
AIRLICK typo and absent currency/with-VAT total. Fixture is the real sanitized
response. UI contract in UI-SPEC.md: original document beside raw extracted
fields, human review markers, compact light/dark/mobile, no technical landing.
Current status: source built/unit-tested, native user journey pending. Do not
publish ready CTA until actual native form/chat and screenshot review pass.
