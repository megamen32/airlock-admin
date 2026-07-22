"""Regression checks for the Windows installer-to-Go ShellMCP contract."""

from pathlib import Path


INSTALLER = Path(__file__).resolve().parents[1] / "deploy" / "install_win.ps1"
PUBLIC_INSTALLER = Path(__file__).resolve().parents[1] / "public" / "install_win.ps1"


def test_windows_installer_writes_canonical_go_shellmcp_environment() -> None:
    """Polling installs must configure the variables read by Go ShellMCP."""
    script = INSTALLER.read_text(encoding="utf-8")

    assert '"SHELLMCP_QUEUE=$queueEnabled"' in script
    assert "SHELLMCP_HOST=$ShellmcpBind" in script
    assert "$env:SHELLMCP_QUEUE = '$queueEnabled'" in script
    assert "$env:SHELLMCP_HOST = '$ShellmcpBind'" in script
    assert "QUEUE_URL=1" not in script
    assert "$env:QUEUE_URL = '1'" not in script


def test_public_windows_installer_matches_the_canonical_go_installer() -> None:
    """The checked-in public installer must not retain a PyInstaller-era contract."""
    assert PUBLIC_INSTALLER.read_bytes() == INSTALLER.read_bytes()


def test_user_install_falls_back_to_startup_when_task_scheduler_is_denied() -> None:
    """Standard Windows users still get a persistent launcher without task ACLs."""
    script = INSTALLER.read_text(encoding="utf-8")

    assert "Microsoft\\Windows\\Start Menu\\Programs\\Startup" in script
    assert "Register-ScheduledTask" in script
    assert "Install-UserStartup" in script
    assert "if (-not $UserMode) { throw }" in script
