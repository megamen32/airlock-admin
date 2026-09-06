"""Regression coverage for fail-closed CLI installation semantics."""

from __future__ import annotations

import inspect

import pytest

import cli


def test_setup_health_gate_fails_closed_when_hub_never_becomes_healthy(monkeypatch: pytest.MonkeyPatch) -> None:
    """A setup must abort instead of reporting success for an unhealthy Hub."""

    monkeypatch.setattr(cli, "wait_local_hub_health", lambda *_args, **_kwargs: False)

    with pytest.raises(RuntimeError, match="local Hub health check failed during setup"):
        cli._require_local_hub_health({"HUB_URL": "http://127.0.0.1:9001"})


def test_setup_uses_the_fatal_health_gate_after_starting_hub() -> None:
    """Keep the setup integration wired to the shared fail-closed helper."""

    source = inspect.getsource(cli.setup_interactive)
    assert "_require_local_hub_health(env)" in source


def test_setup_requires_real_local_execution_before_reporting_success() -> None:
    """Fresh bundled installs must prove actual Hub -> ShellMCP execution."""

    source = inspect.getsource(cli.setup_interactive)
    approved = source.index("maybe_autoapprove_local_shellmcp(env, install_hub, install_shellmcp)")
    executed = source.index("_require_real_local_shell_exec(env_read(), timeout_s=90)")
    configured = source.index("auto_configure_ai_mcp_clients(env_read(), install_hub)")
    assert approved < executed < configured


def test_grepmesh_is_default_on_with_explicit_opt_out() -> None:
    from types import SimpleNamespace

    default_args = SimpleNamespace(grepmesh=False, no_grepmesh=False)
    disabled_args = SimpleNamespace(grepmesh=False, no_grepmesh=True)
    assert cli._grepmesh_enabled_from_args(default_args, {}, True) is True
    assert cli._grepmesh_enabled_from_args(disabled_args, {}, True) is False
    assert cli._grepmesh_enabled_from_args(default_args, {}, False) is False


def test_setup_wires_grepmesh_before_shellmcp_start() -> None:
    source = inspect.getsource(cli.setup_interactive)
    configured = source.index("_configure_builtin_grepmesh")
    grep_started = source.index("svc_enable_start(svc_grepmesh_name(), UNIT_PATH_GREPMESH)")
    shell_started = source.index("svc_enable_start(svc_shellmcp_name(), UNIT_PATH_SHELLMCP)")
    assert configured < grep_started < shell_started
