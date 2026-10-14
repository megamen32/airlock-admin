package summary

import "testing"

// Narrow unit proof only: the observed provider frame and malformed variants.
func TestCountPage(t *testing.T) {
	for _, tc := range []struct {
		name, raw string
		count     int
		ok        bool
	}{
		{"observed empty report", `{"objects_cnt":0,"pagination":{"pages_cnt":1,"page":1}}`, 0, true},
		{"observed product page", `{"objects_cnt":1,"objects":[{"id":"p"}]}`, 1, true},
		{"object map", `{"objects_cnt":1,"objects":{"p":{"id":"p"}}}`, 1, true},
		{"missing data is not zero", `{"pagination":{"page":1}}`, 0, false},
		{"nonempty count requires objects", `{"objects_cnt":1}`, 0, false},
		{"contradictory count", `{"objects_cnt":0,"objects":[{"id":"p"}]}`, 0, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := countPage([]byte(tc.raw))
			if (err == nil) != tc.ok || got != tc.count {
				t.Fatalf("count=%d err=%v", got, err)
			}
		})
	}
}
