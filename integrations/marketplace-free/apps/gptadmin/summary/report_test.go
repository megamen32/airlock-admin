package summary

import (
	"encoding/json"
	"os"
	"testing"
)

func actual(t *testing.T) Envelope {
	t.Helper()
	b, e := os.ReadFile("testdata/read.json")
	if e != nil {
		t.Fatal(e)
	}
	var v Envelope
	if e = json.Unmarshal(b, &v); e != nil {
		t.Fatal(e)
	}
	return v
}
func TestRealRead(t *testing.T) {
	r, e := Report(actual(t))
	if e != nil || !r.Ready || r.Total != 7 || r.CheckedAt != "2026-10-15" {
		t.Fatalf("unexpected catalogue %#v %v", r, e)
	}
}
func TestRejectIncompleteOrDifferentRead(t *testing.T) {
	for _, name := range []string{"pending", "wrongtarget", "wrongpath", "truncated", "toolerror", "badjson", "externalurl", "duplicates"} {
		t.Run(name, func(t *testing.T) {
			v := actual(t)
			i := &v.Response.StructuredContent.Result.StructuredContent.Inspection
			switch name {
			case "pending":
				v.Status = "running"
			case "wrongtarget":
				v.ServerID = "file:other"
			case "wrongpath":
				i.Path = "/etc/passwd"
			case "truncated":
				i.Size++
			case "toolerror":
				v.Response.StructuredContent.Result.IsError = true
			case "badjson":
				i.Content = "not json"
				i.Size = len(i.Content)
				i.BytesRead = i.Size
			case "externalurl", "duplicates":
				var p map[string]any
				json.Unmarshal([]byte(i.Content), &p)
				a := p["apps"].([]any)
				if name == "externalurl" {
					a[0].(map[string]any)["chat_url"] = "https://example.org/"
				} else {
					a[1] = a[0]
				}
				b, _ := json.Marshal(p)
				i.Content = string(b)
				i.Size = len(b)
				i.BytesRead = len(b)
			}
			if _, e := Report(v); e == nil {
				t.Fatal("invalid read accepted")
			}
		})
	}
}
