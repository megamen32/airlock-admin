package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"sync"
	"time"
)

// The native platform lazily recreates app containers after idle shutdown.
// Reconcile only the authenticated configured app, without a timer or core edit.
type runtimeBudget struct {
	client  *http.Client
	base    string
	mu      sync.Mutex
	applied map[string]string
}

func newRuntimeBudget() *runtimeBudget {
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", "/var/run/docker.sock")
	}}
	return &runtimeBudget{client: &http.Client{Transport: transport, Timeout: 5 * time.Second}, base: "http://docker/v1.47", applied: map[string]string{}}
}

func (b *runtimeBudget) ensure(ctx context.Context, appID string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	filters, _ := json.Marshal(map[string][]string{"label": {"run.airlock.agent=" + appID}})
	req, _ := http.NewRequestWithContext(ctx, "GET", b.base+"/containers/json?filters="+url.QueryEscape(string(filters)), nil)
	resp, err := b.client.Do(req)
	if err != nil {
		return errors.New("runtime budget unavailable")
	}
	var containers []struct {
		ID     string `json:"Id"`
		Labels map[string]string
	}
	err = json.NewDecoder(http.MaxBytesReader(nil, resp.Body, 64<<10)).Decode(&containers)
	resp.Body.Close()
	if err != nil || resp.StatusCode != 200 || len(containers) != 1 || containers[0].Labels["run.airlock.agent"] != appID || containers[0].ID == "" {
		return errors.New("owned running container not uniquely identified")
	}
	id := containers[0].ID
	b.mu.Lock()
	applied := b.applied[appID] == id
	b.mu.Unlock()
	if applied {
		return nil
	}
	limits, _ := json.Marshal(map[string]int64{"Memory": 256 << 20, "MemoryReservation": 128 << 20, "MemorySwap": 256 << 20, "NanoCpus": 1e9, "PidsLimit": 128})
	req, _ = http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/containers/%s/update", b.base, url.PathEscape(id)), bytes.NewReader(limits))
	req.Header.Set("Content-Type", "application/json")
	resp, err = b.client.Do(req)
	if err != nil {
		return errors.New("runtime budget update unavailable")
	}
	resp.Body.Close()
	if resp.StatusCode != 200 {
		return errors.New("runtime budget update rejected")
	}
	b.mu.Lock()
	b.applied[appID] = id
	b.mu.Unlock()
	return nil
}
