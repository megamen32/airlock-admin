package summary

import "testing"

// Fast unit, expected1s/max10s: untrusted chat/form URLs must never become
// arbitrary provider fetches. This test makes no runtime/integration claim.
func TestNormalizeLink(t *testing.T) {
	for in, want := range map[string]string{"": "", " https://max.ru/ria ": "https://max.ru/ria", "https://web.max.ru/hello-world/": "https://max.ru/hello-world", "https://max.ru/abc_123": "https://max.ru/abc_123"} {
		got, e := NormalizeLink(in)
		if e != nil || got != want {
			t.Errorf("%q: %q, %v", in, got, e)
		}
	}
	for _, in := range []string{"http://max.ru/ria", "https://evil.test/ria", "https://max.ru.evil.test/ria", "https://max.ru:443/ria", "https://u@max.ru/ria", "https://max.ru/ria?foo=bar", "https://max.ru/ria#x", "https://max.ru/%72ia", "https://max.ru/../ria", "https://max.ru/a/b", "https://max.ru/", "https://max.ru/\\ria", "https://max.ru/риа"} {
		if got, e := NormalizeLink(in); e == nil {
			t.Errorf("accepted %q as %q", in, got)
		}
	}
}
