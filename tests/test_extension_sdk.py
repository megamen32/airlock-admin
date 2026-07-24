"""Conformance tests for the versioned third-party MCP extension manifest."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import cli


ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "tests" / "fixtures" / "mcp-extension-example.json"


def test_reference_extension_manifest_passes_sdk_conformance() -> None:
    """A third-party-shaped manifest validates without Hub source changes."""

    manifest = cli._validate_mcp_extension_manifest(FIXTURE)
    assert manifest["schema"] == "gptadmin.mcp-extension/v1"
    assert manifest["id"] == "example.echo"
    assert manifest["capabilities"][0]["name"] == "echo"


def test_extension_manifest_rejects_missing_provenance_and_risk(tmp_path: Path) -> None:
    """Extensions must declare ownership, provenance and risk before use."""

    manifest = json.loads(FIXTURE.read_text(encoding="utf-8"))
    manifest.pop("provenance")
    manifest.pop("risk_level")
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="provenance"):
        cli._validate_mcp_extension_manifest(path)
