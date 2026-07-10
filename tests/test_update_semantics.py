from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "cli.py"


def test_update_prefers_explicit_component_flags_over_stale_files():
    text = CLI.read_text()
    assert "if 'INSTALL_HUB' in env else" in text
    assert "if 'INSTALL_SHELLMCP' in env else" in text


def test_update_does_not_run_setup_only_autoapprove_or_client_config():
    text = CLI.read_text()
    start = text.index("def cmd_update(args):")
    end = text.index("\n\n# ===== AI client MCP auto-configuration =====", start)
    block = text[start:end]
    assert "maybe_autoapprove_local_shellmcp(" not in block
    assert "auto_configure_ai_mcp_clients(" not in block


def test_macos_launchd_bootout_is_not_duplicated_before_bootstrap():
    text = CLI.read_text()
    start = text.index("    def svc_enable_start(label: str, unit_path: Path):")
    end = text.index("\n    def svc_restart", start)
    block = text[start:end]
    assert "bootout', domain, str(unit_path)" not in block
    assert "bootstrap = _launchctl_capture" in block
