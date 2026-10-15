package views

import (
	"agent/workflow"
	"time"
)

type HomeView struct{ Result workflow.Result }

func DisplayTime(raw string) string {
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return ""
	}
	return t.In(time.FixedZone("МСК", 3*60*60)).Format("02.01.2006, 15:04:05 МСК")
}
