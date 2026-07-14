#!/usr/bin/env bash
set -euo pipefail

root=/tmp/gptadmin-failover-e2e
route_file="$root/route"
runtime_file="$root/runtime.json"
reclaim_file="$root/reclaim.json"
config_file="$root/config.json"
state_file="$root/state.json"
pids=()

cleanup() {
  for pid in "${pids[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT

start() {
  "$@" >/tmp/failover-e2e-"${#pids[@]}".log 2>&1 &
  pids+=("$!")
  printf '%s\n' "$!"
}

wait_http() {
  local url="$1"
  for _ in $(seq 1 40); do
    curl -fsS --max-time 1 "$url" >/dev/null && return 0
    sleep 0.1
  done
  echo "endpoint did not become ready: $url" >&2
  return 1
}

wait_for_absent() {
  local path="$1"
  for _ in $(seq 1 40); do
    test ! -e "$path" && return 0
    sleep 0.1
  done
  echo "path did not disappear: $path" >&2
  return 1
}

start_ingress() {
  start python3 /e2e/ingress.py --route-file "$route_file" >/dev/null
  wait_http http://127.0.0.1:18080/healthz
}

watchdog() {
  E2E_ROUTE_FILE="$route_file" python3 /usr/local/bin/gptadmin_failover_watchdog.py \
    --check-once --config "$config_file" --state "$state_file" --runtime-state "$runtime_file" \
    --node-id shell:fallback --hub-service none --frpc-service none --frpc-bin /e2e/fake-frpc \
    --frpc-config "$root/frpc.toml" --frpc-pid-file "$root/frpc.pid" \
    --reclaim-command-file "$reclaim_file"
}

fresh_topology() {
  cleanup
  pids=()
  rm -rf "$root"
  mkdir -p "$root/primary" "$root/fallback"
  cat >"$config_file" <<'JSON'
{
  "enabled": true,
  "primary_health_url": "http://127.0.0.1:9001/healthz",
  "primary_public_url": "http://127.0.0.1:18080",
  "primary_reclaim_accept_url": "http://127.0.0.1:18080/admin/api/failover/reclaim/accept",
  "fail_count_base": 2,
  "promotion_cooldown_sec": 1,
  "reclaim_max_age_sec": 120,
  "nodes": [{"server_id":"shell:fallback","rank":1,"enabled":true,"local_hub_port":9002}]
}
JSON
  cat >"$state_file" <<'JSON'
{
  "hub_public_url": "http://127.0.0.1:18080",
  "tunnel": {"frp": {"token":"test-token","subdomain":"hub","endpoints":["test=127.0.0.1:7000"],"local_port":9002}},
  "secrets": {"bridge_key":"test-ctl"}
}
JSON
  start_primary
  start env HUB_PORT=9002 HUB_HOST=127.0.0.1 CTL_TOKEN=test-ctl GPTADMIN_CONFIG_DIR="$root/fallback" GPTADMIN_FAILOVER_NODE_ID=shell:fallback GPTADMIN_FAILOVER_RECLAIM_COMMAND_FILE="$reclaim_file" /usr/local/bin/gptadmin_hub >/dev/null
  start python3 /usr/local/bin/gptadmin_failover_proxy.py --listen 127.0.0.1:9101 --upstream http://127.0.0.1:9002 --command-file "$reclaim_file" --node-id shell:fallback >/dev/null
  wait_http http://127.0.0.1:9001/healthz
  wait_http http://127.0.0.1:9002/healthz
  start_ingress
}

start_primary() {
  start env HUB_PORT=9001 HUB_HOST=127.0.0.1 CTL_TOKEN=test-ctl GPTADMIN_CONFIG_DIR="$root/primary" /usr/local/bin/gptadmin_hub >/dev/null
  wait_http http://127.0.0.1:9001/healthz
}

kill_primary() {
  kill "${pids[0]}"
  wait "${pids[0]}" 2>/dev/null || true
}

kill_ingress() {
  local pid="${pids[-1]}"
  kill "$pid"
  wait "$pid" 2>/dev/null || true
}

assert_public_down() {
  ! curl -fsS --max-time 1 http://127.0.0.1:18080/healthz >/dev/null
}

scenario_tunnel_only() {
  fresh_topology
  kill_ingress
  wait_http http://127.0.0.1:9001/healthz
  watchdog | grep -q '"decision": "primary_ok"'
  test ! -e "$route_file"
  start_ingress
  wait_http http://127.0.0.1:18080/healthz
  echo 'ok: tunnel failure leaves primary hub active and does not promote fallback'
}

scenario_hub_only() {
  fresh_topology
  kill_primary
  assert_public_down
  watchdog | grep -q '"decision": "waiting_rank_threshold"'
  test ! -e "$route_file"
  watchdog | grep -q '"decision": "promote"'
  test "$(cat "$route_file")" = fallback
  wait_http http://127.0.0.1:18080/healthz
  echo 'ok: hub failure promotes fallback through a live tunnel'
}

scenario_hub_and_tunnel() {
  fresh_topology
  kill_primary
  kill_ingress
  watchdog >/dev/null
  watchdog | grep -q '"decision": "promote"'
  test "$(cat "$route_file")" = fallback
  assert_public_down
  start_ingress
  wait_http http://127.0.0.1:18080/healthz
  echo 'ok: combined hub and tunnel failure recovers after tunnel restart'
}

scenario_primary_reclaim() {
  fresh_topology
  kill_primary
  watchdog >/dev/null
  watchdog >/dev/null
  test "$(cat "$route_file")" = fallback
  start_primary
  CTL_TOKEN=test-ctl python3 /usr/local/bin/gptadmin_failover_reclaim_push.py --config "$config_file" --env /dev/null --attempts 1 --delay 0 | grep -q '"accepted": true'
  watchdog | grep -q '"decision": "reclaimed_primary"'
  wait_for_absent "$route_file"
  wait_http http://127.0.0.1:18080/healthz
  echo 'ok: signed reclaim demotes fallback after primary recovery'
}

scenario_tunnel_only
scenario_hub_only
scenario_hub_and_tunnel
scenario_primary_reclaim
echo 'ALL FAILOVER BLACK-BOX SCENARIOS PASSED'
