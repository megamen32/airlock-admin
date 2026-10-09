package main

import (
	"agent/bridgeauth"
	"bufio"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// focused integration; expected<1/max5s. Streaming must arrive before EOF;
// upgraded connections retain the product's bidirectional transport.
func TestOriginalStreamingAndUpgradeTransport(t *testing.T) {
	release := make(chan struct{})
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/stream" {
			w.Header().Set("Content-Type", "text/event-stream")
			io.WriteString(w, "event: ready\ndata: {}\n\n")
			w.(http.Flusher).Flush()
			<-release
			return
		}
		conn, rw, err := w.(http.Hijacker).Hijack()
		if err != nil {
			t.Error(err)
			return
		}
		defer conn.Close()
		rw.WriteString("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n")
		rw.Flush()
		data := make([]byte, 4)
		if _, err := io.ReadFull(rw, data); err != nil {
			return
		}
		rw.Write(data)
		rw.Flush()
	}))
	defer backend.Close()
	g := &gateway{targets: map[string]targetConfig{"fixture": {AppID: "fixture", URL: backend.URL, Principals: map[string]string{"user": "user@example.com"}}}, keys: map[string]string{"fixture": "fixture-key"}}
	server := httptest.NewServer(g)
	defer server.Close()
	sign := func(path string) string {
		value, _ := bridgeauth.Sign(bridgeauth.Claims{AppID: "fixture", UserID: "user", Email: "user@example.com", Role: "admin", Host: "fixture.airlock.bezrabotnyi.com", Method: "GET", URI: path, Expires: time.Now().Add(30 * time.Second).Unix()}, "fixture-key")
		return value
	}
	req, _ := http.NewRequest("GET", server.URL+"/fixture/stream", nil)
	req.Header.Set(bridgeauth.Header, sign("/stream"))
	client := &http.Client{Timeout: 2 * time.Second}
	response, err := client.Do(req)
	if err != nil {
		close(release)
		t.Fatal(err)
	}
	line, err := bufio.NewReader(response.Body).ReadString('\n')
	close(release)
	response.Body.Close()
	if err != nil || line != "event: ready\n" {
		t.Fatal("SSE flush lost")
	}
	conn, err := net.DialTimeout("tcp", strings.TrimPrefix(server.URL, "http://"), 2*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(2 * time.Second))
	req, _ = http.NewRequest("GET", server.URL+"/fixture/socket", nil)
	req.Header.Set(bridgeauth.Header, sign("/socket"))
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Upgrade", "websocket")
	req.Write(conn)
	reader := bufio.NewReader(conn)
	response, err = http.ReadResponse(reader, req)
	if err != nil || response.StatusCode != 101 {
		t.Fatal("upgrade lost")
	}
	frame := []byte{0x82, 2, 0x12, 0x34}
	conn.Write(frame)
	got := make([]byte, 4)
	if _, err = io.ReadFull(reader, got); err != nil || string(got) != string(frame) {
		t.Fatal("bidirectional upgraded data lost")
	}
}
