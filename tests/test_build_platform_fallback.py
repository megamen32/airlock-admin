from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_prebuilt_hub_fallback_cannot_overwrite_cross_built_macos_binary() -> None:
    build = (ROOT / "tools" / "build.sh").read_text(encoding="utf-8")
    helper = build[build.index("copy_hub_platform_binary() {") : build.index("package_hub_platform_binaries() {")]

    assert 'if [[ -x "$dst" ]]; then' in helper
    assert helper.index('if [[ -x "$dst" ]]; then') < helper.index('cp -f "$src" "$dst"')
    assert "prebuilt/gptadmin_hub/darwin_arm64/gptadmin_hub" in build
