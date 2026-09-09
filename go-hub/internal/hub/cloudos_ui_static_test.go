package hub

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestCloudOSUIServesInstalledDist(t *testing.T) {
	dir := t.TempDir()
	dist := filepath.Join(dir, "cloudos-ui")
	if err := os.MkdirAll(filepath.Join(dist, "app-icons", "finder"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dist, "index.html"), []byte("<!doctype html><title>CloudOS</title>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dist, "app-icons", "finder", "32.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	server := New(Config{PublicDir: dir})

	res := httptest.NewRecorder()
	server.Handler().ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/cloudos/", nil))
	if res.Code != http.StatusOK {
		t.Fatalf("index status = %d, want 200", res.Code)
	}
	if body := res.Body.String(); body != "<!doctype html><title>CloudOS</title>" {
		t.Fatalf("unexpected index body: %q", body)
	}

	res = httptest.NewRecorder()
	server.Handler().ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/cloudos/app-icons/finder/32.png", nil))
	if res.Code != http.StatusOK {
		t.Fatalf("asset status = %d, want 200", res.Code)
	}

	// Path traversal must never escape the installed dist.
	res = httptest.NewRecorder()
	server.Handler().ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/cloudos/..%2f..%2fetc%2fpasswd", nil))
	if res.Code == http.StatusOK {
		t.Fatalf("traversal returned 200")
	}

	// A missing installation fails closed instead of proxying anywhere.
	empty := New(Config{PublicDir: t.TempDir()})
	res = httptest.NewRecorder()
	empty.Handler().ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/cloudos/", nil))
	if res.Code != http.StatusServiceUnavailable {
		t.Fatalf("missing dist status = %d, want 503", res.Code)
	}
}
