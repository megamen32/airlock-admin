package views

type HomeView struct {
	Title              string
	Ready              bool
	Total              int
	Message, FetchedAt string
}
