package hub

import (
	"errors"
	"strings"
)

const (
	processSecurityNormal  = "normal"
	processSecurityMaximum = "maximum"
	processSecurityCustom  = "custom"
)

// Process security is independent from the bearer/OAuth preset.
type processSecurityProfile struct {
	Mode            string `json:"mode"`
	NoNewPrivileges bool   `json:"no_new_privileges"`
	PrivateTmp      bool   `json:"private_tmp"`
	ProtectSystem   bool   `json:"protect_system"`
	ProtectHome     bool   `json:"protect_home"`
	AllowPrivileged bool   `json:"allow_privileged_execution"`
}

func defaultProcessSecurityProfile() processSecurityProfile {
	return processSecurityProfile{Mode: processSecurityNormal, AllowPrivileged: true}
}

func validateProcessSecurityProfile(profile processSecurityProfile) error {
	switch strings.ToLower(strings.TrimSpace(profile.Mode)) {
	case processSecurityNormal:
		if profile.NoNewPrivileges || profile.PrivateTmp || profile.ProtectSystem || profile.ProtectHome {
			return errors.New("normal process profile cannot enable hardening flags")
		}
	case processSecurityMaximum:
		if !profile.NoNewPrivileges || !profile.PrivateTmp || !profile.ProtectSystem || !profile.ProtectHome || profile.AllowPrivileged {
			return errors.New("maximum process profile requires all hardening flags and disables privileged execution")
		}
	case processSecurityCustom:
		// Refusing privileged execution must be backed by the systemd
		// no-new-privileges boundary; otherwise the UI would claim a control
		// that the generated unit does not actually enforce.
		if !profile.AllowPrivileged && !profile.NoNewPrivileges {
			return errors.New("custom profile denying privileged execution requires no_new_privileges")
		}
	default:
		return errors.New("process security mode must be normal, maximum or custom")
	}
	return nil
}
