package views

type Finding struct{ Number, Title, Description, Recommendation, Quote, Example, Reference, Level, Class string }
type Tab struct {
	Name, URL, Section string
	Count              int
	Active             bool
}
type HomeView struct {
	Ready                                        bool
	Error, Summary, ContractType, Score, Section string
	Parties                                      []string
	Tabs                                         []Tab
	Findings                                     []Finding
	High, Medium, Low, Total                     int
}
