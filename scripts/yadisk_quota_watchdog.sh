#!/usr/bin/env bash
# Watchdog: airlock storage on Yandex Disk (folder airlock-storage) vs 10 GiB budget.
# Always logs to the user journal; writes state to .tmp/yadisk_quota_state.
# If NP_TOKEN + NP_EVENTS_URL + NP_PROJECT are set, also fires a NoticePlace
# event via the local notification center (POST /v1/events, kind=notification,
# severity notice|critical). Token must be scoped to NP_PROJECT.
set -euo pipefail

LIMIT_BYTES=$((10 * 1024 * 1024 * 1024))
WARN_BYTES=$((8 * 1024 * 1024 * 1024))
STATE_FILE="${STATE_FILE:-/home/roomhacker/airlock-admin/.tmp/yadisk_quota_state}"

BYTES=$(rclone size yadisk:airlock-storage --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("bytes", 0))')
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
HUMAN=$(numfmt --to=iec "$BYTES" 2>/dev/null || echo "${BYTES}B")
printf '%s bytes=%s\n' "$NOW" "$BYTES" > "$STATE_FILE"

fire_notice() { # severity notice|critical dedup_key title
  local severity="$1" key="$2" title="$3"
  logger -t airlock-yadisk-quota -- "${severity}: ${title} (now ${HUMAN}, budget 10G)"
  if [ -n "${NP_TOKEN:-}" ] && [ -n "${NP_EVENTS_URL:-}" ] && [ -n "${NP_PROJECT:-}" ]; then
    curl -sS -m 8 -X POST \
      -H "Authorization: Bearer ${NP_TOKEN}" \
      -H 'Content-Type: application/json' \
      -H "Idempotency-Key: yadisk-wd-$(date -u +%Y%m%dT%H%M%SZ)-$RANDOM" \
      "${NP_EVENTS_URL}" \
      -d "{\"schema\":\"notify.event.v1\",\"action\":\"fire\",\"project\":\"${NP_PROJECT}\",\"recipient\":\"me\",\"kind\":\"notification\",\"severity\":\"${severity}\",\"title\":\"${title}\",\"dedup_key\":\"${key}\",\"body\":\"yadisk:airlock-storage now ${HUMAN} (budget 10G). Checked ${NOW}.\"}" \
      >/dev/null || logger -t airlock-yadisk-quota -- "notice post failed"
  fi
}

if [ "$BYTES" -ge "$LIMIT_BYTES" ]; then
  fire_notice critical yadisk-airlock-quota-exceeded "[airlock] Yandex Disk storage >= 10G limit"
elif [ "$BYTES" -ge "$WARN_BYTES" ]; then
  fire_notice notice yadisk-airlock-quota-warning "[airlock] Yandex Disk storage >= 8G (approaching 10G)"
else
  logger -t airlock-yadisk-quota -- "ok: ${HUMAN} / 10G"
fi
