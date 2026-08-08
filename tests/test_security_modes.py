import cli


def test_normal_system_mode_does_not_add_privilege_blocking_hardening():
    assert cli.linux_systemd_hardening("normal") == ""


def test_maximum_system_mode_enables_all_process_hardening():
    unit = cli.linux_systemd_hardening("maximum")
    assert "NoNewPrivileges=true" in unit
    assert "ProtectSystem=full" in unit
    assert "ProtectHome=true" in unit


def test_custom_system_mode_uses_explicit_process_flags():
    unit = cli.linux_systemd_hardening(
        "custom",
        {
            "no_new_privileges": False,
            "protect_system": True,
            "protect_home": False,
        },
    )
    assert "NoNewPrivileges" not in unit
    assert "ProtectSystem=full" in unit
    assert "ProtectHome" not in unit
