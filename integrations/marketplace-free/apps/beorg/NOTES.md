# Beorg demo adapter

Native SDK0.7.0. No Airlock core changes. Russian web form and invoice_ocr tool share one service. Only fixed GET /api/document/result/s-1664407. Native encrypted admin-only Connection injects token as query parameter; no secrets in source/errors. No user input, uploads, payments, or mutations. Operator submitted one explicitly fictional invoice using the welcome credit; never replay upload after unknown outcome. Read cache15min, quota12/h, timeout20s, body512KiB, one active request; app1GiB, standard single BuildKit4GiB/CPU2. Original invoice static PNG is deliberately public and contains no real personal/bank data. Fields selected from actual OCR response, absent fields not replaced by expected values. Light/dark follows system, no forced theme. Test: fast unit over real sanitized response and malformed cases; focused integration real guest form/chat and headed44. Provider welcome balance is finite, not a perpetual free API.

15Oct provider returned200 for the same s-1664407; no second upload/spend.
Parser now matches actual absent broken flag, nested Products, preserves raw
AIRLICK typo and absent currency/with-VAT total. Fixture is the real sanitized
response. UI contract in UI-SPEC.md: original document beside raw extracted
fields, human review markers, compact light/dark/mobile, no technical landing.
Current status15Oct: deployed and real ordinary-guest consumer journey verified.
Native d48c127c-6f4e-4b4f-99a5-a65f142cd57d (d88-beorg-invoice), code99653e82,
build296b1f65. Actual public left CTA -> business draft (zero auto-send) ->
explicit browser question -> real invoice_ocr facts/missing fields/working
/document and app links18.654s. Headed44 320/375/1280 light/dark, document and
fields, source/credential/edit403. Cold browser direct /document follows normal
passwordless auth relay; actual PNG200/hashmatch after app auth, no overflow.
Do not use raw /static PNG as a first chat link: it correctly requires an app
session. /document is the user navigation, embedding the same unchanged file.
Source input asset lives views/resources, not generated/ignored views/static.
Parser/callback/source checks are not provider/UI proof. No new OCR/upload,
registration, account key or payment. Old500 is historical and now resolved.
Operational docs may be newer than the pinned native-code build. Human design
approval is not claimed; the original coding studio stays withdrawn.
