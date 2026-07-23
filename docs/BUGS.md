# Bug tracker

This is the project’s append-only working register for bugs found during
development, diagnostics, deployment, or live verification.

Rules:

- Record a bug as soon as it is observed, before implementing a fix.
- Use an immutable evidence path, commit, test name, or runtime artifact ID;
  never paste secrets, private URLs, customer data, or raw logs.
- Keep actionable bugs open until a focused verification proves the fix.
- At the end of the current goal, resolve every actionable open entry before
  final handoff, unless a concrete external blocker is recorded.

## 2026-07-23 - ANDROID-LAN-PROXY-FW-20260723 - LAN proxy blocked by host firewall - fixed

- Component: `android-4g-lan-proxy.service` on roomhacker-server-100.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime probe `mac-curl-3126-20260723` stalled connecting to the LAN listener. The service was listening on `192.168.2.100:3126`, and a server-local proxy request completed successfully, while the UFW user rules had no TCP/3126 allow entry and the INPUT policy was deny.
- Root cause: The deployment created the LAN listener but did not install a matching UFW allow rule.
- Fix / verification: Added UFW TCP rules limited to the private LAN ranges and
  made the deployment script install the matching rule idempotently for the
  selected port. An external Windows LAN client returned the same mobile IPv6
  through both SOCKS5 and HTTP CONNECT, while direct egress returned a different
  address; the service remained active after restart.
- Next action: Have the Mac retry the exact command; no code-side blocker remains.

## Entry format

```text
## BUG-ID - short title - <open|in_progress|fixed|wont_fix>
- Component:
- First observed:
- Symptom / evidence:
- Root cause:
- Fix / verification:
- Next action:
```

## 2026-07-23 - WIN-ROOTD-AUTH-20260723 - Windows polling authentication - fixed

- Component: Windows ShellMCP polling agent on BeyondInfinity.
- First observed: 2026-07-23.
- Symptom / evidence: The exact runtime artifact `C:\ProgramData\gptadmin\rootd-25900.log` records queue and heartbeat requests returning HTTP 401. The same artifact records polling mode with the HTTP listener intentionally disabled, so a closed local port is not evidence that polling is disabled.
- Root cause: The legacy launcher hard-coded `ROOTD_TOKEN=srv_secret` instead of loading the Hub credential, and its runtime was not the supported Go ShellMCP package.
- Fix / verification: Replaced the active user-mode runtime with the current Go Windows binary, copied the existing identity, loaded the existing Hub credential without rotation, and verified an authenticated queue poll returns HTTP 200 with an empty job response.
- Next action: Remove or disable the inaccessible legacy system task from an elevated Windows session so it cannot resurrect the old runtime.

## 2026-07-23 - WIN-ROOTD-CERT-20260723 - Windows bundled CA path drift - fixed

- Component: Legacy Windows Python/PyInstaller ShellMCP runtime.
- First observed: 2026-07-23.
- Symptom / evidence: The exact runtime artifact `C:\ProgramData\gptadmin\rootd-25900.log` contains repeated failures referencing the removed temporary bundle path `C:\Temp\_MEI107362\certifi\cacert.pem`.
- Root cause: An old packaged runtime retained a PyInstaller-extracted certifi path instead of using a stable bundled or system CA location.
- Fix / verification: The active user-mode path now uses the Go binary and no longer uses the stale PyInstaller bundle. A fresh current Go log entry exists and the active log set contains zero `401`, `certifi`, or `unauthorized` matches.
- Next action: Keep the legacy artifact isolated until the separate privileged-task cleanup entry is handled.

## 2026-07-23 - WIN-ROOTD-REDIRECT-20260723 - Hub URL redirect drops agent auth - fixed

- Component: Windows ShellMCP Hub URL configuration.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime probe `win-rootd-redirect-20260723` showed the generic configured Hub host redirects to another host; a cross-host redirect can drop the Authorization header and produce 401 responses.
- Root cause: The agent was configured with a generic web host instead of the instance-specific public Hub origin.
- Fix / verification: The active user-mode config now uses the canonical instance origin; an authenticated queue probe returns HTTP 200.
- Next action: Keep installer input explicit for deployments where the generic host redirects; do not infer a private Hub origin in the repository.

## 2026-07-23 - WIN-USER-TASK-20260723 - Standard user Task Scheduler fallback - fixed

- Component: `deploy/install_win.ps1` and `public/install_win.ps1`.
- First observed: 2026-07-23.
- Symptom / evidence: User-mode Task Scheduler registration on BeyondInfinity returned access denied, while the user could execute the agent.
- Root cause: The installer treated user Task Scheduler ACLs as universally available.
- Fix / verification: Added a per-user Startup launcher fallback and kept Task Scheduler as the preferred backend; `python3 -m pytest -q tests/test_install_win.py` passes 3 tests.
- Next action: Validate the fallback installer on a clean non-admin Windows account in CI or the next Windows acceptance run.

## 2026-07-23 - WIN-ROOTD-LEGACY-TASK-20260723 - Privileged legacy task cleanup - in_progress

- Component: Old Windows scheduled task `gptadmin-rootd` under the system install.
- First observed: 2026-07-23.
- Symptom / evidence: `schtasks /query /tn gptadmin-rootd` returns access denied for the authenticated non-admin SSH user; the task and its old ProgramData runtime remain outside that user’s ACL.
- Root cause: The historical system installation was not removed when the supported Go user-mode runtime was installed.
- Fix / verification: The active agent is now the supported Go process and remains alive after the SSH connection closes; full deletion of the stale task requires an elevated Windows session.
- Next action: From an elevated local Windows session, disable/remove `gptadmin-rootd`, then verify one clean post-logon Go ShellMCP process and close this entry.

## 2026-07-23 - FAILOVER-PHYSICAL-INGRESS-20260723 - Physical Hub failover has no active takeover path - fixed

- Component: `server-100` Hub watchdog/FRP path and HAOS standby.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime artifact `failover-runtime-20260723-01` shows `gptadmin-hub-watchdog.timer=bad` on `server-100`, no active failover watchdog/proxy unit, HAOS reachable on `:9001`, and HAOS `:9101` refusing connections. The public route therefore has no verified takeover owner when the primary Hub is stopped.
- Root cause: Physical deployment wiring is incomplete or invalid even though the repository Docker failover harness passes; the HAOS standby is only a local Hub and the public tunnel/proxy promotion path is not active.
- Fix / verification: Added the systemd-free HAOS watchdog/proxy runtime, ARM64 FRP packaging, one valid FRP config/process per endpoint, secret-safe reclaim key fallback, dead-child pipe fix, reclaim cooldown reset, and primary FRP `BindsTo=gptadmin-hub.service`. `7` focused regressions passed; physical drill stopped only the Hub, systemd showed Hub inactive and FRP failed, public fallback `/healthz` and `/version` returned `200` with the standby build, automatic reclaim logged `reclaimed_primary`, and final public responses returned primary build `128` with both primary units active.
- Next action: Keep the second physical fallback host disabled until its own deployment drill is run under S3.4.

## 2026-07-23 - HAOS-SUPERVISOR-JOB-20260723 - Stale unrelated app job blocks failover add-on update - open

- Component: Home Assistant OS Supervisor Job Manager, `local_bezrabotnyi_recovery_haproxy` and `local_gptadmin_hub_standby` app jobs.
- First observed: 2026-07-23.
- Symptom / evidence: Runtime artifact `haos-supervisor-job-20260723-01` shows `addon_restart` for `local_bezrabotnyi_recovery_haproxy` and dependent GPTAdmin update jobs at `progress=0`, `done=false`; Supervisor logs report the recovery HAProxy app exited with code 1. The GPTAdmin standby is stopped while the `1.0.3` update waits.
- Root cause: Hypothesis is a stale/failing recovery HAProxy app job serializing the Supervisor app job group; this is outside the GPTAdmin add-on image but blocks its normal update/start path.
- Fix / verification: GPTAdmin update eventually completed without resetting Job Manager state; add-on `1.0.4` is started and the failover drill passed. The unrelated recovery HAProxy app remains in `error` with a separate missing `mgmt_auth` userlist and certificate-rate-limit errors.
- Next action: Repair `local_bezrabotnyi_recovery_haproxy` in its owning deployment task; it no longer blocks GPTAdmin failover acceptance.
