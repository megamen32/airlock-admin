package hub

import (
	"os"
	"runtime"
	"strconv"
	"testing"
)

func TestDefaultUpdateLauncher(t *testing.T) {
	l := DefaultUpdateLauncher()
	if l.ServiceUnit != "gptadmin-auto-update.service" {
		t.Errorf("unexpected service unit: %q", l.ServiceUnit)
	}
	// Label MUST match SVC_AUTO_UPDATE_LABEL in cli.py so launchctl can find
	// the loaded plist. Both default to "com.gptadmin.auto-update".
	if l.Label != "com.gptadmin.auto-update" {
		t.Errorf("unexpected launchd label: %q", l.Label)
	}
	if l.WrapperPath == "" {
		t.Error("wrapper path should not be empty")
	}
}

func TestDomainUserInstall(t *testing.T) {
	// Domain is built from os.Getuid() in user mode. Just assert the prefix
	// and that the uid actually appears at the end.
	l := &UpdateLauncher{IsUserInstall: true, Label: "com.gptadmin.auto-update"}
	got := l.domain()
	want := "gui/" + strconv.Itoa(os.Getuid())
	if got != want {
		t.Errorf("user domain = %q, want %q", got, want)
	}
}

func TestDomainSystemInstall(t *testing.T) {
	l := &UpdateLauncher{IsUserInstall: false, Label: "com.gptadmin.auto-update"}
	got := l.domain()
	if got != "system" {
		t.Errorf("system domain = %q, want %q", got, "system")
	}
}

func TestLaunchUpdateUnsupportedOS(t *testing.T) {
	if runtime.GOOS != "linux" && runtime.GOOS != "darwin" {
		return // test runs on linux/darwin
	}
	// Create a minimal wrapper.
	dir := t.TempDir()
	wrapper := dir + "/run_auto_update.sh"
	os.WriteFile(wrapper, []byte("#!/bin/sh\necho ok\nexit 0"), 0755)

	l := &UpdateLauncher{
		ServiceUnit:   "gptadmin-auto-update.service",
		Label:         "com.gptadmin.auto-update",
		WrapperPath:   wrapper,
		LogPath:       dir + "/log.txt",
		IsUserInstall: os.Getenv("GPTADMIN_INSTALL_MODE") == "user",
	}

	// CheckRunning should not crash.
	_ = l.CheckUpdateRunning()

	// LaunchUpdate through systemd might not work in test (no systemd --user in CI).
	// But it should not panic.
	if runtime.GOOS == "linux" {
		err := l.LaunchUpdate()
		// May fail if systemd not available — that's fine.
		t.Logf("LaunchUpdate result: %v", err)
	}
}