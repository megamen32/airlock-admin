package views

type ItemView struct{ Title, Status, Responsible string }
type HomeView struct {
	Title              string
	Ready              bool
	Total              int
	Items              []ItemView
	Message, FetchedAt string
}
