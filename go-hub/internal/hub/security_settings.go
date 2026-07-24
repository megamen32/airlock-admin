package hub

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	securityPresetWorkingDefault = "working_default"
	securityPresetPrivateAccess  = "private_access"
	securityPresetLockedDown     = "locked_down"
	securityStateFilename        = "security_state.json"
	securityStateMaxBytes        = 16 << 10
)

type securitySettings struct {
	Preset        string    `json:"preset"`
	TOTPSecret    string    `json:"totp_secret,omitempty"`
	MFAEnrolledAt time.Time `json:"mfa_enrolled_at,omitempty"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func defaultSecuritySettings() securitySettings {
	return securitySettings{Preset: securityPresetWorkingDefault}
}

func validateSecurityPreset(preset string) error {
	switch preset {
	case securityPresetWorkingDefault, securityPresetPrivateAccess, securityPresetLockedDown:
		return nil
	default:
		return errors.New("preset must be working_default, private_access or locked_down")
	}
}

func loadSecuritySettings(path string) (securitySettings, error) {
	state := defaultSecuritySettings()
	if path == "" {
		return state, nil
	}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return state, nil
	}
	if err != nil {
		return state, err
	}
	if len(data) > securityStateMaxBytes {
		return state, errors.New("security settings file is too large")
	}
	if err := json.Unmarshal(data, &state); err != nil {
		return defaultSecuritySettings(), fmt.Errorf("decode security settings: %w", err)
	}
	if state.Preset == "" {
		state.Preset = securityPresetWorkingDefault
	}
	if err := validateSecurityPreset(state.Preset); err != nil {
		return defaultSecuritySettings(), err
	}
	if state.TOTPSecret != "" && !validTOTPSecret(state.TOTPSecret) {
		return defaultSecuritySettings(), errors.New("security settings contains invalid TOTP secret")
	}
	return state, nil
}

func saveSecuritySettings(path string, state securitySettings) error {
	if path == "" {
		return nil
	}
	if err := validateSecurityPreset(state.Preset); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	data, err := json.Marshal(state)
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".security-state-*")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return err
	}
	if _, err := tmp.Write(append(data, '\n')); err != nil {
		_ = tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}

func generateTOTPSecret() (string, error) {
	raw := make([]byte, 20)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(raw), nil
}

func validTOTPSecret(secret string) bool {
	secret = strings.ToUpper(strings.TrimSpace(secret))
	if secret == "" {
		return false
	}
	decoded, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(secret)
	return err == nil && len(decoded) >= 16
}

func totpCode(secret string, now time.Time) string {
	decoded, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(strings.TrimSpace(secret)))
	if err != nil || len(decoded) == 0 {
		return ""
	}
	counter := uint64(now.Unix() / 30)
	var message [8]byte
	binary.BigEndian.PutUint64(message[:], counter)
	mac := hmac.New(sha1.New, decoded) // RFC 6238's interoperable default.
	_, _ = mac.Write(message[:])
	digest := mac.Sum(nil)
	offset := digest[len(digest)-1] & 0x0f
	value := (uint32(digest[offset])&0x7f)<<24 | uint32(digest[offset+1])<<16 | uint32(digest[offset+2])<<8 | uint32(digest[offset+3])
	return fmt.Sprintf("%06d", value%1000000)
}

func validTOTPCode(secret, code string, now time.Time) bool {
	code = strings.TrimSpace(code)
	if len(code) != 6 {
		return false
	}
	for _, offset := range []int64{-30, 0, 30} {
		want := totpCode(secret, now.Add(time.Duration(offset)*time.Second))
		if want != "" && hmac.Equal([]byte(want), []byte(code)) {
			return true
		}
	}
	return false
}

func (s *Server) securitySnapshot() securitySettings {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.security
}

func (s *Server) securityPublicSnapshot() map[string]any {
	state := s.securitySnapshot()
	return map[string]any{
		"preset":        state.Preset,
		"mfa_enrolled":  !state.MFAEnrolledAt.IsZero(),
		"updated_at":    state.UpdatedAt,
		"mfa_method":    map[bool]string{true: "totp", false: "none"}[!state.MFAEnrolledAt.IsZero()],
		"restart_bound": true,
	}
}

func (s *Server) persistSecurity(state securitySettings) error {
	return saveSecuritySettings(s.securityPath, state)
}

func (s *Server) adminSecurityPreset(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.securityPublicSnapshot())
	case http.MethodPut:
		var req struct {
			Preset string `json:"preset"`
		}
		if err := readJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
			return
		}
		preset := strings.ToLower(strings.TrimSpace(req.Preset))
		if err := validateSecurityPreset(preset); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
			return
		}
		s.mu.Lock()
		state := s.security
		if preset == securityPresetLockedDown && (state.TOTPSecret == "" || state.MFAEnrolledAt.IsZero()) {
			s.mu.Unlock()
			writeJSON(w, http.StatusPreconditionFailed, map[string]any{"detail": "Locked down requires enrolled MFA"})
			return
		}
		state.Preset = preset
		state.UpdatedAt = s.now()
		s.security = state
		s.mu.Unlock()
		if err := s.persistSecurity(state); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "failed to persist security preset"})
			return
		}
		s.addSecurityAudit("security_preset_changed", map[string]any{"preset": preset})
		writeJSON(w, http.StatusOK, s.securityPublicSnapshot())
	default:
		w.Header().Set("Allow", "GET, PUT")
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"detail": "method not allowed"})
	}
}

func (s *Server) adminTOTPEnroll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"detail": "method not allowed"})
		return
	}
	s.mu.Lock()
	if s.security.TOTPSecret != "" {
		s.mu.Unlock()
		writeJSON(w, http.StatusConflict, map[string]any{"detail": "TOTP is already enrolled; reset requires an explicit recovery flow"})
		return
	}
	secret, err := generateTOTPSecret()
	if err != nil {
		s.mu.Unlock()
		writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "failed to generate TOTP enrollment"})
		return
	}
	state := s.security
	state.TOTPSecret = secret
	state.UpdatedAt = s.now()
	s.security = state
	s.mu.Unlock()
	if err := s.persistSecurity(state); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "failed to persist TOTP enrollment"})
		return
	}
	s.addSecurityAudit("mfa_totp_enrollment_started", map[string]any{})
	issuer := url.QueryEscape("GPTAdmin")
	account := url.QueryEscape("admin")
	uri := "otpauth://totp/" + issuer + ":" + account + "?secret=" + secret + "&issuer=" + issuer
	writeJSON(w, http.StatusOK, map[string]any{"mfa_enrolled": false, "method": "totp", "secret": secret, "otpauth_uri": uri, "message": "Store the setup secret securely, then verify one code."})
}

func (s *Server) adminTOTPVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"detail": "method not allowed"})
		return
	}
	var req struct {
		Code string `json:"code"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
		return
	}
	s.mu.Lock()
	state := s.security
	now := s.now()
	valid := validTOTPCode(state.TOTPSecret, req.Code, now)
	if valid {
		state.MFAEnrolledAt = now
		state.UpdatedAt = now
		s.security = state
	}
	s.mu.Unlock()
	if !valid {
		s.addSecurityAudit("mfa_totp_verification_denied", map[string]any{"reason": "invalid_code"})
		writeJSON(w, http.StatusUnauthorized, map[string]any{"detail": "invalid MFA code"})
		return
	}
	if err := s.persistSecurity(state); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "failed to persist MFA enrollment"})
		return
	}
	s.addSecurityAudit("mfa_totp_enrolled", map[string]any{"method": "totp"})
	writeJSON(w, http.StatusOK, map[string]any{"mfa_enrolled": true, "method": "totp"})
}

func (s *Server) addSecurityAudit(name string, fields map[string]any) {
	s.mu.Lock()
	s.addAuditLocked(name, fields)
	s.mu.Unlock()
}

func (s *Server) securityRequiresMFA() bool {
	state := s.securitySnapshot()
	return state.Preset == securityPresetLockedDown
}

func (s *Server) verifyAdminMFA(code string) bool {
	state := s.securitySnapshot()
	return !state.MFAEnrolledAt.IsZero() && validTOTPCode(state.TOTPSecret, code, s.now())
}
