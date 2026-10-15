package views

import "agent/summary"

type HomeView struct {
	Title string
	summary.Result
}
