"""Regression coverage for the legacy CLI bearer migration boundary."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

import cli


def test_tokens_never_prints_legacy_ctl_secret_and_shows_deadline(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.setattr(cli, "env_read", lambda: {"CTL_TOKEN": "legacy-secret", "HUB_URL": "https://hub.example"})

    cli.cmd_tokens(SimpleNamespace(show_shellmcp=False))

    captured = capsys.readouterr()
    output = captured.out + captured.err
    assert "legacy-secret" not in output
    assert cli.LEGACY_CTL_TOKEN_DEADLINE in output


def test_rotate_hub_is_removed_from_cli(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.setattr(cli, "need_root", lambda: None)

    with pytest.raises(SystemExit):
        cli.cmd_rotate(SimpleNamespace(which="hub"))

    output = capsys.readouterr()
    assert "legacy" in (output.out + output.err).lower()
    assert "legacy-secret" not in (output.out + output.err)


def test_setup_does_not_generate_ctl_token(monkeypatch: pytest.MonkeyPatch) -> None:
    source = open(cli.__file__, encoding="utf-8").read()
    assert "env.setdefault('CTL_TOKEN', gen_hex())" not in source
