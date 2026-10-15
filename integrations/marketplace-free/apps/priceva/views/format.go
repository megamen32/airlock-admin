package views

import (
	"strconv"
	"strings"
	"time"
)

func Money(n float64) string {
	return strings.ReplaceAll(strconv.FormatFloat(n, 'f', 2, 64), ".", ",") + " ₽"
}
func CheckedAt(s string) string {
	t, e := time.Parse(time.RFC3339, s)
	if e != nil {
		return s
	}
	return t.In(time.FixedZone("МСК", 3*3600)).Format("02.01.2006 15:04 МСК")
}
