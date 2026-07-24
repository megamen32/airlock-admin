"""Contract tests for the release supply-chain policy and gates."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_supply_chain_policy_documents_verification_response_and_bypass_boundary() -> None:
    """Keep operator verification, response deadlines and bypass limits explicit."""

    policy = (ROOT / "docs" / "SUPPLY_CHAIN.md").read_text(encoding="utf-8").lower()
    for required in (
        "sha-256",
        "sbom",
        "attest-build-provenance",
        "govulncheck",
        "npm audit",
        "critical",
        "24 hours",
        "seven calendar days",
        "gptadmin_update_skip_manifest=1",
        "diagnostic-only",
    ):
        assert required in policy, f"policy is missing {required!r}"
