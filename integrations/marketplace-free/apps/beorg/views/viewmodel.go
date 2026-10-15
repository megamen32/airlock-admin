package views

type FieldView struct{ Name, Value string }
type ItemView struct{ Name, Quantity, UnitPrice, Amount string }
type HomeView struct {
	Ready               bool
	Message, ReadAt     string
	Fields              []FieldView
	Items               []ItemView
	Recognized, Missing int
}
