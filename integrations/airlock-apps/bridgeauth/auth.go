package bridgeauth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

const Header = "X-Airlock-UI-Identity"

// Claims delegates one already-admitted native HTTP request. The signing key
// is a write-only encrypted Airlock EnvVar, not a human session or owner cookie.
type Claims struct {
	AppID   string `json:"app_id"`
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
	Role    string `json:"role"`
	Host    string `json:"host"`
	Method  string `json:"method"`
	URI     string `json:"uri"`
	Expires int64  `json:"expires"`
}

func Sign(c Claims, key string) (string, error) {
	if key == "" {
		return "", errors.New("missing UI delegation key")
	}
	data, err := json.Marshal(c)
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(data)
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(payload))
	return payload + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}

func Verify(assertion, key string, now time.Time, app, method, uri string) (Claims, error) {
	var c Claims
	deny := errors.New("invalid delegated identity")
	if len(assertion) > 16384 || key == "" {
		return c, deny
	}
	parts := strings.Split(assertion, ".")
	if len(parts) != 2 {
		return c, deny
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return c, deny
	}
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(parts[0]))
	if !hmac.Equal(sig, mac.Sum(nil)) {
		return c, deny
	}
	data, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return c, deny
	}
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&c) != nil {
		return c, deny
	}
	if c.AppID != app || c.Method != method || c.URI != uri || c.UserID == "" || c.Role != "admin" || c.Host == "" || c.Expires < now.Unix() || c.Expires > now.Add(time.Minute).Unix() {
		return Claims{}, deny
	}
	return c, nil
}
