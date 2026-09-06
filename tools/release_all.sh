#!/usr/bin/env bash
# One-command release: tests -> sanitized export -> full 16-bundle build ->
# public source snapshot -> public tag + GitHub release.
#
# Usage:
#   tools/release_all.sh                # release VERSION (repo file) with tests
#   tools/release_all.sh --skip-tests   # skip the pytest gate
#   GITHUB_PUBLIC_REPO=owner/repo tools/release_all.sh
#
# Everything runs on this machine: Go cross-compilation covers linux/windows/
# android; the Android x64 compiler comes from the local NDK (see
# docs below). No GitHub-hosted runners, no Actions billing.
#
# Requirements:
#   go, node/npm, python3+uv, gh (authed), git-filter-repo via
#   git-private2public, ANDROID_HOME with ndk;27.0.12077973 for android x64.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG_NAME=""
SKIP_TESTS=0
PUBLIC_REPO="${GITHUB_PUBLIC_REPO:-megamen32/gptadmin_opensource}"
while [[ $# -gt 0 ]]; do
	case "$1" in
	--skip-tests) SKIP_TESTS=1 ;;
	v[0-9]*) TAG_NAME="$1" ;;
	*) echo "unknown arg: $1" >&2; exit 64 ;;
	esac
	shift
done

# --- 0. Preflight -----------------------------------------------------------
command -v gh >/dev/null || { echo "ERROR: gh CLI required" >&2; exit 1; }
command -v git-private2public >/dev/null || { echo "ERROR: git-private2public required" >&2; exit 1; }
BUILD_VERSION="$(tr -d '[:space:]' < VERSION)"
TAG_NAME="${TAG_NAME:-v$BUILD_VERSION}"
if [[ "$TAG_NAME" != "v$BUILD_VERSION" ]]; then
	echo "ERROR: requested $TAG_NAME but VERSION file says v$BUILD_VERSION (bump VERSION first)" >&2
	exit 64
fi
if git rev-parse "refs/tags/$TAG_NAME" >/dev/null 2>&1; then
	echo "ERROR: tag $TAG_NAME already exists" >&2
	exit 64
fi

# --- 1. Go tests on the raw tree --------------------------------------------
echo "=== Go tests (raw tree) ==="
( cd go-hub && go test ./... )
( cd go-shellmcp && go test ./... )

git tag "$TAG_NAME"

# --- 2. Sanitized export clone (uncommitted local WIP never ships) ----------
EXPORT_DIR="$ROOT/.tmp/release-$TAG_NAME"
rm -rf "$EXPORT_DIR"
git clone -q --no-hardlinks "$ROOT" "$EXPORT_DIR"
( cd "$EXPORT_DIR" && bash scripts/publicize_sanitize.sh )

# --- 2b. Test gate on the sanitized export: exactly what ships --------------
if [[ "$SKIP_TESTS" != "1" ]]; then
	echo "=== Tests (sanitized export) ==="
	( cd "$EXPORT_DIR" && uv run pytest tests/ -q \
		--deselect tests/test_site_docs.py::test_site_docs_mirror_root_source_and_public_tree \
		--deselect tests/test_docs_product_contract.py::test_public_custom_gpt_instructions_stay_in_sync_with_prompt_source \
		--deselect tests/test_frp_watchdog.py::test_frp_watchdog_templates_are_bounded_and_restart_existing_units \
		--deselect tests/test_frp_watchdog.py::test_watchdog_cooldown_suppresses_restart_storm \
		|| { echo "ERROR: sanitized test gate failed" >&2; exit 1; } )
else
	echo "=== Tests skipped (--skip-tests) ==="
fi

# --- 2. Sanitized export clone (uncommitted local WIP never ships) ----------
EXPORT_DIR="$ROOT/.tmp/release-$TAG_NAME"
rm -rf "$EXPORT_DIR"
git clone -q --no-hardlinks "$ROOT" "$EXPORT_DIR"
( cd "$EXPORT_DIR" && bash scripts/publicize_sanitize.sh )

# --- 3. Tagged full build inside the sanitized export -----------------------
echo "=== Building 16-bundle matrix for $TAG_NAME ==="
release_commit="$(git -C "$EXPORT_DIR" rev-parse HEAD)"
( cd "$EXPORT_DIR" && \
  export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}" && \
  export ANDROID_X86_64_CC="$ANDROID_HOME/ndk/27.0.12077973/toolchains/llvm/prebuilt/linux-x86_64/bin/x86_64-linux-android24-clang" && \
  TAGGED_RELEASE=1 RELEASE_TAG="$TAG_NAME" RELEASE_COMMIT="$release_commit" ./tools/build.sh )
ASSET_DIR="$EXPORT_DIR/build"
[[ -f "$ASSET_DIR/gptadmin-checksums.txt" ]] || { echo "ERROR: build produced no checksums" >&2; exit 1; }

# --- 4. Public source snapshot (git-private2public) -------------------------
echo "=== Publishing sanitized source snapshot ==="
( cd "$ROOT" && git-private2public publish )
public_sha="$(git ls-remote "https://github.com/$PUBLIC_REPO.git" refs/heads/main | awk '{print $1}')"
[[ -n "$public_sha" ]] || { echo "ERROR: public main ref missing after publish" >&2; exit 1; }

# --- 5. Public tag + GitHub release with all assets -------------------------
echo "=== Publishing $TAG_NAME to $PUBLIC_REPO ==="
git clone -q --no-hardlinks "git@github.com:$PUBLIC_REPO.git" "$ROOT/.tmp/public-$TAG_NAME"
( cd "$ROOT/.tmp/public-$TAG_NAME" \
  && git tag "$TAG_NAME" "$public_sha" \
  && git push origin "$TAG_NAME" )
release_assets=()
while IFS= read -r asset_name; do
	asset="$ASSET_DIR/$asset_name"
	[[ -f "$asset" ]] && release_assets+=("$asset")
done < <(python3 -c 'import json, sys; print(*[a["file"] for a in json.load(open(sys.argv[1]))["artifacts"]], sep="\n")' "$ASSET_DIR/gptadmin-release-matrix.json")
release_assets+=("$ASSET_DIR/gptadmin-checksums.txt" "$ASSET_DIR/gptadmin-release-matrix.json")
gh release create "$TAG_NAME" --repo "$PUBLIC_REPO" --latest \
	--title "$TAG_NAME" \
	--notes "Sanitized release built by tools/release_all.sh from commit ${release_commit}." \
	"${release_assets[@]}"

echo "✓ Released $TAG_NAME: https://github.com/$PUBLIC_REPO/releases/tag/$TAG_NAME"
