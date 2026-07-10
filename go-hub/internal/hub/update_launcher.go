package hub

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"syscall"
)

// UpdateLauncher describes how to launch the update script externally.
type UpdateLauncher struct {
	// ServiceUnit is the systemd service name (Linux only).
	ServiceUnit string
	// Label is the launchd label (macOS only). Must match the Label key in
	// the plist at UNIT_PATH_AUTO_UPDATE on the Mac side — the Python CLI
	// uses SVC_AUTO_UPDATE_LABEL = "com.gptadmin.auto-update".
	Label string
	// WrapperPath is the run_auto_update.sh path (macOS fallback / kept for
	// backwards-compat reads; the kickstart path no longer executes it
	// directly — it relies on launchd scheduling the oneshot plist).
	WrapperPath string
	// LogPath for stdout/stderr.
	LogPath string
	// IsUserInstall is true for systemd --user scope / gui/ launchd domain.
	IsUserInstall bool
}

// DefaultUpdateLauncher returns a launcher configured from environment.
//
// The launchd label MUST match the SVC_AUTO_UPDATE_LABEL constant in
// cli.py on the Mac side. Both default to "com.gptadmin.auto-update"
// (SERVICE_PREFIX + ".auto-update" where SERVICE_PREFIX is "com.gptadmin"
// in production; the Python side also honors GPTADMIN_SERVICE_SUFFIX for
// parallel e2e installs — keep them aligned if you set that env var).
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
		Label:         "com.gptadmin.auto-update",
		WrapperPath:   installDir + "/bin/run_auto_update.sh",
		LogPath:       installDir + "/auto-update.log",
		IsUserInstall: isUser,
	}
}

// LaunchUpdate starts the update as an external process that survives hub restart.
//
// On Linux it asks systemd to start the oneshot service. On macOS it asks
// launchd to kickstart the loaded oneshot LaunchAgent; the plist (with no
// KeepAlive) is loaded by the Python CLI at install/timer_enable time and
// stays loaded until the user uninstalls.
func (l *UpdateLauncher) LaunchUpdate() error {
	switch runtime.GOOS {
	case "linux":
		return l.launchSystemd()
	case "darwin":
		return l.launchKickstart()
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

// domain returns the launchd domain for this launcher. Extracted so the
// domain-string logic can be unit-tested on platforms without launchctl.
func (l *UpdateLauncher) domain() string {
	if l.IsUserInstall {
		return "gui/" + strconv.Itoa(os.Getuid())
	}
	return "system"
}

func (l *UpdateLauncher) launchKickstart() error {
	// `launchctl kickstart -k <domain>/<label>` is the macOS equivalent of
	// `systemctl start ... --no-block`. The -k flag kills any existing
	// instance of the job before starting a fresh one, which is exactly
	// what we want for a kicker that may be called repeatedly.
	//
	// This replaces the previous nohup/setsid/pgrep path: that path bypassed
	// launchd entirely, so it fought against the loaded plist's KeepAlive
	// semantics and could leak processes when the hub restarted mid-update.
	args := []string{"kickstart", "-k", l.domain() + "/" + l.Label}
	cmd := exec.Command("launchctl", args...)
	// Don't tie the hub's lifetime to launchctl — we only care about
	// returning once launchctl has handed the request to launchd.
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("launchctl kickstart %s/%s: %w (output: %s)",
			l.domain(), l.Label, err, string(out))
	}
	return nil
}

// CheckUpdateRunning returns true if an update is already in progress.
func (l *UpdateLauncher) CheckUpdateRunning() bool {
	switch runtime.GOOS {
	case "linux":
		return l.checkSystemdActive()
	case "darwin":
		return l.checkKickstartRunning()
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

// checkKickstartRunning parses the output of `launchctl print <domain>/<label>`
// and returns true if the job's reported state is `running` or `activating`.
//
// We accept both states because launchd briefly reports `activating` while
// it spawns the wrapped script — treating that as "not running" caused a
// race where two updates could fire back-to-back on a slow Mac.
func (l *UpdateLauncher) checkKickstartRunning() bool {
	target := l.domain() + "/" + l.Label
	cmd := exec.Command("launchctl", "print", target)
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	// `launchctl print` output is key-value-ish. We only need the `state`
	// line. Be lenient about whitespace and key quoting because the exact
	// format has shifted across macOS releases.
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "state") {
			continue
		}
		// Accept forms like:
		//   state = running
		//   "state" = running
		//   state = activating
		rest := strings.TrimPrefix(line, "state")
		rest = strings.TrimLeft(rest, " \t=")
		rest = strings.Trim(rest, ";\"")
		rest = strings.TrimSpace(rest)
		switch rest {
		case "running", "activating":
			return true
		}
	}
	return false
}