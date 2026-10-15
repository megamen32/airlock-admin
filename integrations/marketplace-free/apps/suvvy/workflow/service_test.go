package workflow

import (
	"strings"
	"testing"
)

func TestReceipt(t *testing.T) {
	good := []byte(`{"event_type":"new_messages","chat_id":"f08c8947-0e77-49cb-99d3-8c54ab6b6269","new_messages":[{"type":"text","message_sender":"ai","text":"Ответ Савви"}]}`)
	_, a, e := DecodeReceipt(good)
	if e != nil || a != "Ответ Савви" {
		t.Fatalf("%q %v", a, e)
	}
	for _, raw := range []string{`{}`, `{"event_type":"new_messages","chat_id":"not-a-run"}`, strings.Replace(string(good), `"ai"`, `"employee"`, 1), strings.Replace(string(good), `Ответ Савви`, strings.Repeat("x", 17000), 1)} {
		if _, _, e := DecodeReceipt([]byte(raw)); e == nil {
			t.Fatal("invalid callback accepted")
		}
	}
	if _, _, e := DecodeReceipt([]byte(`{"event_type":"test_request"}`)); e != nil {
		t.Fatal(e)
	}
}
func TestQuestion(t *testing.T) {
	if _, e := Question("   "); e == nil {
		t.Fatal("blank accepted")
	}
	if _, e := Question(strings.Repeat("я", 601)); e == nil {
		t.Fatal("oversized accepted")
	}
	if q, e := Question("  Вопрос  "); e != nil || q != "Вопрос" {
		t.Fatal(q, e)
	}
}
