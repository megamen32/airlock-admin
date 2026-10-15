package summary

import (
	"strings"
	"testing"
)

func TestQuestionNormalizationAndLimits(t *testing.T) {
	for _, q := range []string{"", " \n\t"} {
		got, e := NormalizeQuestion(q)
		if e != nil || got != DefaultQuestion {
			t.Fatal(got, e)
		}
	}
	got, e := NormalizeQuestion("  Где\nпроверяются   права?  ")
	if e != nil || got != "Где проверяются права?" {
		t.Fatal(got, e)
	}
	for _, q := range []string{strings.Repeat("я", 601), "вопрос\x00скрытый", string([]byte{0xff})} {
		if _, e := NormalizeQuestion(q); e == nil {
			t.Fatal("invalid question accepted")
		}
	}
	if _, e := NormalizeQuestion(strings.Repeat("я", 600)); e != nil {
		t.Fatal(e)
	}
}
func TestActualQuestionReachesVendor(t *testing.T) {
	auth := vendorQuery("Где проверяются права доступа?")
	storage := vendorQuery("Как хранятся секреты?")
	if auth == storage || !strings.Contains(auth, "Где проверяются права доступа?") || !strings.Contains(storage, "Как хранятся секреты?") || strings.Contains(auth, "Какие Docker image") {
		t.Fatal("user question replaced by compose example")
	}
	if vendorQuery(DefaultQuestion) != demoQuestion {
		t.Fatal("existing verified compose example changed")
	}
}
