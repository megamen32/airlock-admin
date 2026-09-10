#!/usr/bin/env bash
# Watchdog: airlock storage on Yandex Disk (folder airlock-storage) vs 10 GiB budget.
# Alerts via NoticePlace at 8 GiB (warning) and 10 GiB (critical, recurring).
set -euo pipefail

LIMIT_BYTES=$((10 * 1024 * 1024 * 1024))
WARN_BYTES=$((8 * 1024 * 1024 * 1024))

BYTES=$(rclone size yadisk:airlock-storage --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("bytes", 0))')
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
HUMAN=$(numfmt --to=iec "$BYTES" 2>/dev/null || echo "${BYTES}B")

alert() { # severity title-key title
  local severity="$1" key="$2" title="$3"
  sudo -n /opt/noticeplace/bin/notify-producer \
    --project airlock-admin \
    --dedup-key "$key" \
    --severity "$severity" \
    --title "$title" \
    --body "yadisk:airlock-storage now ${HUMAN} (budget 10G). Checked ${NOW}." || true
}

if [ "$BYTES" -ge "$LIMIT_BYTES" ]; then
  alert critical yadisk-airlock-quota-exceeded "[airlock] Yandex Disk storage >= 10G limit"
elif [ "$BYTES" -ge "$WARN_BYTES" ]; then
  alert warning yadisk-airlock-quota-warning "[airlock] Yandex Disk storage >= 8G (approaching 10G)"
else
  # below thresholds: resolve any open incidents from previous checks
  sudo -n /opt/noticeplace/bin/notify-producer \
    --project airlock-admin \
    --dedup-key yadisk-airlock-quota-warning \
    --title "[airlock] Yandex Disk storage back under 8G" \
    --resolve || true
  sudo -n /opt/noticeplace/bin/notify-producer \
    --project airlock-admin \
    --dedup-key yadisk-airlock-quota-exceeded \
    --title "[airlock] Yandex Disk storage back under 10G" \
    --resolve || true
fi
