"""Public ShellMCP service templates must use installed, portable paths."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_systemd_shellmcp_uses_installed_go_binary() -> None:
    unit = (ROOT / "deploy/systemd/shellmcp.service").read_text(encoding="utf-8")
    assert "ExecStart=/opt/gptadmin/bin/shellmcp" in unit
    assert "rootd-go-canary" not in unit
    assert "/home/roomhacker" not in unit
