from pathlib import Path


CLI = Path(__file__).resolve().parents[1] / "cli.py"


def test_systemd_frpc_is_bound_to_the_primary_hub() -> None:
    """A dead Hub must not leave its public FRP proxy owning the hostname."""

    source = CLI.read_text(encoding="utf-8")
    unit_start = source.index('FRPC_UNIT_TPL = """')
    unit_end = source.index('"""', unit_start + len('FRPC_UNIT_TPL = """'))
    unit = source[unit_start:unit_end]

    assert "BindsTo=gptadmin-hub.service" in unit
    assert "After=network-online.target gptadmin-hub.service" in unit
