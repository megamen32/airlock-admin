#!/usr/bin/env bash
set -euo pipefail
[[ $(id -un) == airlock-demo ]] || exit 1
export DOCKER_HOST="unix:///run/user/$(id -u)/docker.sock"
cd /var/lib/airlock-demo
mkdir -p runtime
if [[ ! -f runtime/docker-compose.yml ]]; then
  curl -fsSL --max-time 90 --max-filesize 33554432 https://github.com/airlockrun/airlock/archive/refs/tags/v0.7.0.tar.gz -o airlock-v0.7.0.tar.gz
  python3 - <<'PY'
import tarfile,pathlib
p=pathlib.Path('/var/lib/airlock-demo/runtime')
with tarfile.open('/var/lib/airlock-demo/airlock-v0.7.0.tar.gz') as t:
 for m in t.getmembers():
  if not m.isfile():continue
  parts=pathlib.PurePosixPath(m.name).parts
  if len(parts)<2 or '..' in parts or pathlib.PurePosixPath(m.name).is_absolute():raise SystemExit('Unsafe archive path')
  dst=p.joinpath(*parts[1:]);dst.parent.mkdir(parents=True,exist_ok=True)
  with t.extractfile(m) as f:dst.write_bytes(f.read())
  dst.chmod(m.mode & 0o777)
PY
fi
cd runtime
if [[ ! -f .env ]]; then
  umask 077
  python3 - <<'PY'
import pathlib,secrets,json
settings={
 'DOMAIN':'demo.airlockrun.ru','PUBLIC_URL':'https://demo.airlockrun.ru',
 'TLS_MODE':'proxy','CADDY_IMAGE':'caddy:2-alpine',
 'COMPOSE_PROFILES':'bundled-db,bundled-s3,caddy-private,buildkit',
 'CADDY_TRUSTED_PROXIES':'172.29.88.0/24',
 'AIRLOCK_INSTANCE_ID':'demo88','DOCKER_NETWORK':'airlock-demo88','AGENT_NETWORK':'airlock-demo88-agents',
 'AGENT_CODEGEN_VOLUME':'airlock-demo88-data','DOCKER_SOCKET_PATH':f'/run/user/{__import__("os").getuid()}/docker.sock',
 'AGENT_MEMORY_LIMIT':'1g','AIRLOCK_BUILD_PARALLELISM':'1','BUILDKIT_HOST':'tcp://buildkitd:1234',
 'BUILDKIT_CACHE_LIMIT':'6144','S3_URL_PUBLIC':'https://s3.demo.airlockrun.ru',
}
for k in ['ENCRYPTION_KEY','JWT_SECRET','REVERSE_PROXY_AUTH_SECRET','S3_SECRET_KEY','POSTGRES_PASSWORD','AIRLOCK_DB_PASSWORD','DEMO_BOOTSTRAP_SECRET']:
 settings[k]=secrets.token_hex(32)
pathlib.Path('.env').write_text(''.join(f'{k}={v}\n' for k,v in settings.items()))
owner={'email':'owner@demo.airlockrun.ru','password':secrets.token_urlsafe(36)}
pathlib.Path('owner.json').write_text(json.dumps(owner));pathlib.Path('owner.json').chmod(0o600)
PY
fi
chmod 0600 .env
cat > compose.demo.yml <<'YAML'
services:
  postgres: {mem_limit: 1g, memswap_limit: 1g, cpus: 1, pids_limit: 256}
  postgres-bootstrap: {mem_limit: 256m, memswap_limit: 256m, cpus: 1, pids_limit: 64}
  rustfs: {mem_limit: 1g, memswap_limit: 1g, cpus: 1, pids_limit: 256}
  frontend:
    image: ghcr.io/airlockrun/airlock-enterprise-frontend:v0.7.0
    mem_limit: 128m
    memswap_limit: 128m
    cpus: 0.5
    pids_limit: 64
  caddy-private:
    mem_limit: 256m
    memswap_limit: 256m
    cpus: 0.5
    pids_limit: 128
    volumes:
      - ./caddy-demo:/etc/caddy:ro
  airlock:
    mem_limit: 2g
    memswap_limit: 2g
    cpus: 2
    pids_limit: 512
    environment:
      AGENT_DOMAIN: demo.airlockrun.ru
      AIRLOCK_BUILD_PARALLELISM: '1'
      GOMAXPROCS: '2'
  agent-builder-image: {mem_limit: 128m, memswap_limit: 128m, cpus: 0.5, pids_limit: 64}
  agent-base-image: {mem_limit: 128m, memswap_limit: 128m, cpus: 0.5, pids_limit: 64}
  # UID 0 is mapped inside the dedicated rootless Docker, never host root.
  # Nested rootlesskit would require subuids outside the outer namespace.
  buildkitd:
    image: moby/buildkit:latest
    privileged: true
    cpuset: '0,1'
    mem_limit: 4g
    memswap_limit: 4g
    cpus: 2
    pids_limit: 1024
    command: [--addr, 'tcp://0.0.0.0:1234', --oci-worker-gc, '--oci-worker-gc-keepstorage=6144']
  demo-gateway:
    image: node:22-alpine
    command: [node, /app/gateway.mjs]
    restart: unless-stopped
    mem_limit: 256m
    memswap_limit: 256m
    cpus: 1
    pids_limit: 64
    volumes:
      - ./gateway.mjs:/app/gateway.mjs:ro
      - ./guest-lifecycle.mjs:/app/guest-lifecycle.mjs:ro
      - ./gateway-state:/var/lib/demo-gateway
      - ./owner.json:/run/demo-owner.json:ro
    environment:
      DEMO_DOMAIN: demo.airlockrun.ru
      DEMO_UPSTREAM: http://caddy-private:80
      DEMO_API: http://airlock:8080
      DEMO_OWNER_FILE: /run/demo-owner.json
      DEMO_GUEST_TTL_SECONDS: '86400'
      DEMO_GUEST_STATE_FILE: /var/lib/demo-gateway/guests.json
      DEMO_BOOTSTRAP_SECRET: ${DEMO_BOOTSTRAP_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      REVERSE_PROXY_AUTH_SECRET: ${REVERSE_PROXY_AUTH_SECRET}
    ports: ['192.168.2.75:43280:8088']
networks:
  default:
    ipam:
      config: [{subnet: 172.29.88.0/24}]
YAML
mkdir -p caddy-demo gateway-state
chmod 700 gateway-state
cp caddy/routes.caddy caddy-demo/routes.caddy
cp caddy/Caddyfile.proxy caddy-demo/Caddyfile.proxy
# Existing source archive/images only; never build the platform locally.
for image in pgvector/pgvector:pg17 rustfs/rustfs:latest caddy:2-alpine node:22-alpine ghcr.io/airlockrun/airlock:v0.7.0 ghcr.io/airlockrun/airlock-enterprise-frontend:v0.7.0 ghcr.io/airlockrun/airlock-agent-builder:v0.7.0 ghcr.io/airlockrun/airlock-agent-base:v0.7.0 ghcr.io/airlockrun/airlock-js-executor:v0.7.0 moby/buildkit:latest; do
  if ! docker image inspect "$image" >/dev/null 2>&1; then
    if [[ "$image" == *airlock-enterprise-frontend* ]]; then
      echo 'Transfer the official private enterprise frontend from an authenticated host first; no community fallback.' >&2
      exit 1
    fi
    docker pull "$image"
  fi
done
docker compose -p airlock-demo88 -f docker-compose.yml -f compose.demo.yml config --quiet
echo 'Demo runtime prepared; official images pulled.'
