package views

type CourseView struct{ Title string }
type HomeView struct {
	Title              string
	Ready              bool
	Total              int
	Courses            []CourseView
	Message, FetchedAt string
}
