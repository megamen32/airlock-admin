package views

type ChannelView struct{ Title, Description, Link, Category, Followers, Views24, Views48, ER24, ER48, UpdatedAt string }
type HomeView struct {
	Title, Link, Message, FetchedAt string
	Ready                           bool
	Channels                        []ChannelView
}
