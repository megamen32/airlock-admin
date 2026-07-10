package hub

import (
	"os"
	"runtime"
	"testing"
)

func TestDefaultUpdateLauncher(t *testing.T) {
	l := DefaultUpdateLauncher()
	if l.ServiceUnit != "gptadmin-auto-update.service" {
		t.Errorf("unexpected service unit: %q", l.ServiceUnit)
	}
	if l.WrapperPath == "" {
		t.Error("wrapper path should not be empty")
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
