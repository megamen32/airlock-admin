package hub

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	telemetryStateFilename = "telemetry_state.json"
	telemetryStateMaxBytes = 16 << 10
)

var activationTelemetryEvents = map[string]struct{}{
	"connection_page_viewed": {},
	"client_connected":       {},
	"first_tool":             {},
	"failure":                {},
}

type telemetryState struct {
	Enabled   bool           `json:"enabled"`
	Counters  map[string]int `json:"counters,omitempty"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func defaultTelemetryState() telemetryState {
	return telemetryState{Counters: map[string]int{}}
}

func loadTelemetryState(path string) (telemetryState, error) {
	state := defaultTelemetryState()
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
	if len(data) > telemetryStateMaxBytes {
		return state, errors.New("telemetry state file is too large")
	}
	if err := json.Unmarshal(data, &state); err != nil {
		return defaultTelemetryState(), err
	}
	if state.Counters == nil {
		state.Counters = map[string]int{}
	}
	for event, count := range state.Counters {
		if _, ok := activationTelemetryEvents[event]; !ok || count < 0 || count > 1_000_000 {
			delete(state.Counters, event)
		}
	}
	return state, nil
}

func saveTelemetryState(path string, state telemetryState) error {
	if path == "" {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	data, err := json.Marshal(state)
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".telemetry-state-*")
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

func (s *Server) telemetrySnapshot() telemetryState {
	s.mu.Lock()
	defer s.mu.Unlock()
	state := s.telemetry
	state.Counters = cloneIntMap(state.Counters)
	return state
}

func cloneIntMap(source map[string]int) map[string]int {
	result := make(map[string]int, len(source))
	for key, value := range source {
		result[key] = value
	}
	return result
}

func (s *Server) persistTelemetry(state telemetryState) error {
	return saveTelemetryState(s.telemetryPath, state)
}

func (s *Server) adminTelemetry(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		state := s.telemetrySnapshot()
		writeJSON(w, http.StatusOK, map[string]any{"enabled": state.Enabled, "counters": state.Counters, "updated_at": state.UpdatedAt, "local_only": true})
	case http.MethodPut:
		var req struct {
			Enabled *bool `json:"enabled"`
		}
		if err := readJSON(r, &req); err != nil || req.Enabled == nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "enabled boolean is required"})
			return
		}
		s.mu.Lock()
		state := s.telemetry
		state.Enabled = *req.Enabled
		state.UpdatedAt = s.now()
		s.telemetry = state
		s.mu.Unlock()
		if err := s.persistTelemetry(state); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "failed to persist telemetry preference"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"enabled": state.Enabled, "counters": state.Counters, "local_only": true})
	case http.MethodPost:
		if !strings.HasSuffix(r.URL.Path, "/event") {
			w.Header().Set("Allow", "GET, PUT")
			writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"detail": "method not allowed"})
			return
		}
		var req struct {
			Event string `json:"event"`
		}
		if err := readJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
			return
		}
		event := strings.TrimSpace(req.Event)
		if _, ok := activationTelemetryEvents[event]; !ok {
			writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "unsupported telemetry event"})
			return
		}
		s.mu.Lock()
		state := s.telemetry
		if !state.Enabled {
			s.mu.Unlock()
			writeJSON(w, http.StatusForbidden, map[string]any{"detail": "activation telemetry is disabled"})
			return
		}
		if state.Counters == nil {
			state.Counters = map[string]int{}
		}
		if state.Counters[event] < 1_000_000 {
			state.Counters[event]++
		}
		state.UpdatedAt = s.now()
		s.telemetry = state
		s.mu.Unlock()
		if err := s.persistTelemetry(state); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "failed to persist telemetry event"})
			return
		}
		writeJSON(w, http.StatusAccepted, map[string]any{"accepted": true, "event": event, "local_only": true})
	default:
		w.Header().Set("Allow", "GET, PUT, POST")
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"detail": "method not allowed"})
	}
}
