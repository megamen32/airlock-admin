# Independent critic: Health business completion gate

Status: work

## Immutable objective

The system must observe host CPU/RAM/disk, failed services, and log
error/keyword signals; deduplicate degradation; invoke GPTAdmin → Agent Herder
→ OpenCode/OmniRoute for diagnosis and exactly three plans; obtain explicit
user selection; run Hermes/OpenAI/Codex/gpt-5.6-luna/high remediation with
useful-progress supervision; independently verify the original source; and
emit a resolved NoticePlace receipt with elapsed time and trace IDs.

## Current delta to critique

NoticePlace now has a local implementation slice that maps a completed
health-remediation receipt into progress, independent verification, and
resolved state, plus a queued resolved Telegram delivery. GPTAdmin polling
forwards useful progress and stops stale health remediation. Fleet's source
prompt requires source_fingerprint and verifier_id. Focused local tests and a
real-local no-send canary pass, but live deployment and Telegram topic/send
remain gated.

## Critic scope and rules

Read-only, independent, no edits, no deploy/restart, no Telegram send, no
Hermes egress. Inspect current source and evidence, and return a verdict of
CONTINUE, STOP, or ASK_USER with concrete reasons. Do not treat tests, fake
transports, or terminal receipts alone as proof of the business result.

## Estimate

Initial: 20 / 30 / 60 active minutes.
