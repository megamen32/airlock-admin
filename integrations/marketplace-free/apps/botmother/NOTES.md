# Botmother demo adapter — prepared, not deployed

Status15Oct2026: vendor account/event and @airlockleadsbot connected; users/testers0.
Owner /start is pending. No native app, credential binding, callback or guest
acceptance yet. Do not add a marketplace CTA until actual roundtrip passes.

Native SDK v0.7.0 only. MVC, Russian web form and same domain chat tool.
Only owner setup can bind one24hex bm_id; it is immutable after first binding.
External Connection is admin-only, but used by fixed Go domain call; guest
run_js must not receive connection capabilities. Credential is secret path of
existing external-event URL (strip leading slash); path_prefix plus / adds a
trailing slash: verify vendor accepts this exact URL before public admission.
Never put tokens/secret URLs into source. Callback uses native bearer verification.

Vendor screen MUST contain only Request, no Message/Buttons/Telegram send.
POST native registered callback with Authorization Bearer managed secret and:
{"run_id":"{{last_request.demo_run_id}}","scenario":"airlock-demo","order":"DEMO-001","result":"completed"}.
No everyone/empty recipients. Verify using the owned tester before binding it.

Persistent transaction admission:6/h,100total; own pending/unknown run is reused
forever, complete/rejected reuse10min. Intent committed before external request;
never auto-retry timeout or ambiguous response. HTTP200 is not completion.
Verified callback may precede dispatch response; response update cannot regress
complete. Duplicate callback preserves original completed_at. Reads scoped to
native caller.ID; callback must reference an existing admitted UUIDv4.

Tests: fast unit callback/parser/error/state logic, expected30s/max300s;
source job1GiB/CPU2/tasks128/swap0, disk/temp2GiB, one job; measure capacity first.
Future real integration uses established demo88 app1GiB/aggregate8/12GiB,
BuildKit4GiB/CPU2/cpuset0,1/onebuild. These tests do not prove vendor/runtime/UI.
Before publication: real DB admission/replay/late-callback/owner-isolation,
ordinary guest credentials/config403, native callback bad-bearer401/replay,
actual vendor request-only screen roundtrip, guest form/chat/light/dark/375px,
source match and protected access backup with Yandex.Disk readback.

## Local verification15Oct

Original SDK air update, templ generation and Tailwind compilation passed.
Final go test -count=1 ./... PASS1.576s, five fast unit tests. Native cgroup
peak139083776bytes, OOM0; earlier generation/compile peak578351104bytes, OOM0.
Two earlier checks rejected template formatting and an overly broad assertion
against the SDK public static CSS route; fixed using the actual native
/static/{name} declaration. No access restriction was weakened.
Coverage: callback strict parsing, receipt time required for success, provider
error wrappers, safe result fields, admin connection/recipient and native bearer
manifest. No fake services/mocked transports used; these are local logic proofs
only. No actual DB/vendor callback/native build/guest UI acceptance yet.
Evidence: .tmp/botmother-root-20261015/check-d/source-check-result.json.
