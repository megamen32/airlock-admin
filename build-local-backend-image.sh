#!/usr/bin/env bash
# Historical artifact helper, not the current upgrade route.
# It force-removes its fixed temporary worktree and applies an old pinned patch.
# Do not execute for routine upgrades; follow AIRLOCK_RUNBOOK.md.
# Local build of the Airlock Go backend image.
#
# Produces exactly the artifact the CI workflow
# (.github/workflows/airlock-mcp-webui-artifact.yml) produces, without waiting
# for the CI run:
#
#   1. base commit 14f4f3ee (pinned, immutable)
#   2. the reviewed MCP WebUI patch, sha256-verified
#   3. the job-local Dockerfile ordering, sha256-verified
#   4. the same four build labels
#
# Swapping the image in afterwards is a compose override + `up -d` (seconds).
set -euo pipefail

REPO=${REPO:-/home/roomhacker/airlock-internal}
WORKTREE=${WORKTREE:-/tmp/airlock-backend-build}
BASE_COMMIT=${BASE_COMMIT:-14f4f3ee3ac4d19ed1373efa61ca65ea471ea731}
PATCH_REF=${PATCH_REF:-origin/new-frontend}
PATCH_FILE=.github/patches/airlock-mcp-webui-14f-with-plugin-skills.patch
PATCH_SHA256=88e66b2e5c85ba7c64d55b1a4e8300437ab4a594e3eaab2d44ae518947c1704e
DOCKERFILE_SHA256=ca796713681e5dfdcbf6c66fca5b97d3905965930987ad4cf4565f66f2ea5967
IMAGE_TAG=${IMAGE_TAG:-airlock-private-mcp-webui:local-14f4f3ee-plugin-88e66b2e}
PUBLISHED_REFERENCE=${PUBLISHED_REFERENCE:-$(git -C "$REPO" rev-parse origin/new-frontend)}

step() { printf '\n=== %s\n' "$1"; }

step "prepare worktree at $BASE_COMMIT"
git -C "$REPO" fetch origin "+refs/heads/new-frontend:refs/remotes/origin/new-frontend" >/dev/null 2>&1 || true
if [ -d "$WORKTREE" ]; then
  git -C "$REPO" worktree remove --force "$WORKTREE" 2>/dev/null || true
fi
git -C "$REPO" worktree add --detach "$WORKTREE" "$BASE_COMMIT" >/dev/null
cd "$WORKTREE"

step "materialize the reviewed patch"
git -C "$REPO" show "$PATCH_REF:$PATCH_FILE" > /tmp/airlock-mcp-webui.patch
printf '%s  %s\n' "$PATCH_SHA256" /tmp/airlock-mcp-webui.patch | sha256sum --check --status
git apply --check /tmp/airlock-mcp-webui.patch
git apply /tmp/airlock-mcp-webui.patch
test "$(git diff --name-only | sort | tr '\n' ' ')" = "agent-plugin/skills/connections-secrets/SKILL.md agent-plugin/skills/use-apps/SKILL.md api/global_mcp.go api/global_mcp_picker.go api/global_mcp_picker_test.go api/global_mcp_widget.go "

step "apply the job-local Dockerfile ordering"
python3 - <<'PY'
from pathlib import Path

path = Path("Dockerfile.airlock")
text = path.read_text()
original_copies = (
    "# Official Docker CLI and Buildx binaries are static and run on this Alpine base.\n"
    "COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker\n"
    "COPY --from=docker-cli /usr/local/libexec/docker/cli-plugins/docker-buildx /usr/local/libexec/docker/cli-plugins/docker-buildx\n\n"
    "COPY --from=builder /airlock /airlock\n"
)
copies = original_copies.replace(
    "# Official Docker CLI and Buildx binaries are static and run on this Alpine base.\n",
    "",
).replace("\n\n", "\n")
if text.count(original_copies) != 1:
    raise SystemExit("expected one exact runtime cross-stage COPY block")
text = text.replace(original_copies, "", 1)
text = text.replace(
    '&& test -x "$(git --exec-path)/git-http-backend"\n\nCOPY agent-plugin ',
    '&& test -x "$(git --exec-path)/git-http-backend"\nCOPY agent-plugin ',
    1,
)
marker = "FROM alpine:3.21\n"
if text.count(marker) != 1:
    raise SystemExit("expected one Alpine runtime stage")
note = (
    "FROM alpine:3.21\n\n"
    "# Resolve the heavier cross-stage copies before installing runtime packages. This\n"
    "# serializes the runtime package install after the toolchain and Go build stages\n"
    "# on the shared worker storage, avoiding concurrent high-I/O extraction.\n"
    + copies
)
path.write_text(text.replace(marker, note, 1))
PY
test "$(sha256sum Dockerfile.airlock | cut -d' ' -f1)" = "$DOCKERFILE_SHA256"

step "build $IMAGE_TAG"
docker build \
  --platform linux/amd64 \
  --label "org.opencontainers.image.revision=$BASE_COMMIT" \
  --label "airlock.source.patch-sha256=$PATCH_SHA256" \
  --label "airlock.build.dockerfile-sha256=$DOCKERFILE_SHA256" \
  --label "airlock.source.published-reference=$PUBLISHED_REFERENCE" \
  -t "$IMAGE_TAG" \
  -f Dockerfile.airlock \
  .

step "verify labels"
docker image inspect "$IMAGE_TAG" --format '{{.Os}}/{{.Architecture}} rev={{index .Config.Labels "org.opencontainers.image.revision"}} patch={{index .Config.Labels "airlock.source.patch-sha256"}} dockerfile={{index .Config.Labels "airlock.build.dockerfile-sha256"}} ref={{index .Config.Labels "airlock.source.published-reference"}}'

step "done"
printf 'image: %s\n' "$IMAGE_TAG"
