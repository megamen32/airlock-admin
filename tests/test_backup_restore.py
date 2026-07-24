"""Black-box tests for the versioned configuration backup contract."""

from __future__ import annotations

import json
import tarfile
from pathlib import Path

import pytest

import cli


def test_backup_round_trip_has_manifest_digests_and_restrictive_modes(tmp_path: Path) -> None:
    source = tmp_path / "config"
    source.mkdir()
    env_file = source / "gptadmin.env"
    env_file.write_text("ADMIN_PASSWORD=preserve-me\n", encoding="utf-8")
    env_file.chmod(0o600)
    state_file = source / "state.json"
    state_file.write_text(json.dumps({"version": 1}), encoding="utf-8")
    state_file.chmod(0o640)
    archive = tmp_path / "gptadmin-backup.tgz"

    created = cli.create_backup_archive(source, archive)
    assert created["format"] == "gptadmin.backup/v1"
    assert {item["path"] for item in created["files"]} == {"gptadmin.env", "state.json"}
    verified = cli.verify_backup_archive(archive)
    assert verified == created

    target = tmp_path / "restored"
    restored = cli.restore_backup_archive(archive, target)
    assert restored == created
    assert (target / "gptadmin.env").read_text(encoding="utf-8") == env_file.read_text(encoding="utf-8")
    assert (target / "state.json").read_text(encoding="utf-8") == state_file.read_text(encoding="utf-8")
    assert (target / "gptadmin.env").stat().st_mode & 0o777 == 0o600
    assert (target / "state.json").stat().st_mode & 0o777 == 0o640


def test_backup_verifier_rejects_path_traversal_and_restore_does_not_escape(tmp_path: Path) -> None:
    archive = tmp_path / "malicious.tgz"
    manifest = {"format": "gptadmin.backup/v1", "files": [{"path": "../escape", "size": 0, "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "mode": 0o600}]}
    with tarfile.open(archive, "w:gz") as handle:
        payload = json.dumps(manifest).encode("utf-8")
        info = tarfile.TarInfo("manifest.json")
        info.size = len(payload)
        handle.addfile(info, __import__("io").BytesIO(payload))
    with pytest.raises(ValueError, match="unsafe archive member"):
        cli.verify_backup_archive(archive)
    with pytest.raises(ValueError, match="unsafe archive member"):
        cli.restore_backup_archive(archive, tmp_path / "restored")
    assert not (tmp_path / "escape").exists()
