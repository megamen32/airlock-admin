package hub

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"syscall"
)

// UpdateLauncher describes how to launch the update script externally.
type UpdateLauncher struct {
	// ServiceUnit is the systemd service name (Linux only).
	ServiceUnit string
	// WrapperPath is the run_auto_update.sh path (macOS fallback).
	WrapperPath string
	// LogPath for stdout/stderr.
	LogPath string
	// IsUserInstall is true for systemd --user scope.
	IsUserInstall bool
}

// DefaultUpdateLauncher returns a launcher configured from environment.
func DefaultUpdateLauncher() *UpdateLauncher {
	isUser := os.Getenv("GPTADMIN_INSTALL_MODE") == "user" ||
		os.Getenv("GPTADMIN_INSTALL_SCOPE") == "user"
	installDir := os.Getenv("GPTADMIN_HOME")
	if installDir == "" {
		home, _ := os.UserHomeDir()
		installDir = home + "/.local/share/gptadmin"
	}
	return &UpdateLauncher{
		ServiceUnit:   "gptadmin-auto-update.service",
		WrapperPath:   installDir + "/bin/run_auto_update.sh",
		LogPath:       installDir + "/auto-update.log",
		IsUserInstall: isUser,
	}
}

// LaunchUpdate starts the update as an external process that survives hub restart.
func (l *UpdateLauncher) LaunchUpdate() error {
	switch runtime.GOOS {
	case "linux":
		return l.launchSystemd()
	case "darwin":
		return l.launchNohup()
	default:
		return fmt.Errorf("unsupported OS for update launcher: %s", runtime.GOOS)
	}
}

func (l *UpdateLauncher) launchSystemd() error {
	args := []string{"start", l.ServiceUnit}
	if l.IsUserInstall {
		args = []string{"--user", "start", l.ServiceUnit}
	}
	cmd := exec.Command("systemctl", args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("systemctl start %s: %w (output: %s)", l.ServiceUnit, err, string(out))
	}
	return nil
}

func (l *UpdateLauncher) launchNohup() error {
	cmd := exec.Command("nohup", l.WrapperPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
		Setsid:  true,
	}
	cmd.Stdout = nil // nohup redirects
	cmd.Stderr = nil
	cmd.Stdin = nil
	// Set nohup log.
	logFile, err := os.OpenFile(l.LogPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err == nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
		defer logFile.Close()
	}
	// Detach: nohup + & via Start (don't Wait).
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("nohup start: %w", err)
	}
	// Release the process — it will run independently.
	go func() {
		cmd.Wait()
	}()
	return nil
}

// CheckUpdateRunning returns true if an update is already in progress.
func (l *UpdateLauncher) CheckUpdateRunning() bool {
	switch runtime.GOOS {
	case "linux":
		return l.checkSystemdActive()
	case "darwin":
		// On macOS, check if wrapper process is running.
		return l.checkNohupRunning()
	default:
		return false
	}
}

func (l *UpdateLauncher) checkSystemdActive() bool {
	args := []string{"is-active", l.ServiceUnit}
	if l.IsUserInstall {
		args = []string{"--user", "is-active", l.ServiceUnit}
	}
	cmd := exec.Command("systemctl", args...)
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return string(out) == "active\n" || string(out) == "activating\n"
}

func (l *UpdateLauncher) checkNohupRunning() bool {
	// pgrep the wrapper script.
	cmd := exec.Command("pgrep", "-f", l.WrapperPath)
	err := cmd.Run()
	return err == nil
}
