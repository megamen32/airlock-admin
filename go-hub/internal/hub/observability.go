package hub

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
)

const requestTraceHeader = "X-Request-ID"

type requestTraceContextKey struct{}

// withRequestTrace assigns a bounded, non-secret correlation identifier to
// every HTTP request and exposes the same value in the response header. The
// identifier is useful for joining audit/job events without storing payloads.
func withRequestTrace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := normalizeRequestTraceID(r.Header.Get(requestTraceHeader))
		if traceID == "" {
			traceID = newRequestTraceID()
		}
		r = r.WithContext(context.WithValue(r.Context(), requestTraceContextKey{}, traceID))
		w.Header().Set(requestTraceHeader, traceID)
		next.ServeHTTP(w, r)
	})
}

func requestTraceID(r *http.Request) string {
	if r == nil {
		return ""
	}
	if traceID, ok := r.Context().Value(requestTraceContextKey{}).(string); ok {
		return traceID
	}
	return normalizeRequestTraceID(r.Header.Get(requestTraceHeader))
}

func normalizeRequestTraceID(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || len(value) > 64 {
		return ""
	}
	for _, char := range value {
		if (char < 'a' || char > 'z') && (char < 'A' || char > 'Z') && (char < '0' || char > '9') && char != '-' && char != '_' && char != '.' {
			return ""
		}
	}
	return value
}

func newRequestTraceID() string {
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return "generated"
	}
	return hex.EncodeToString(raw[:])
}
