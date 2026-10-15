package main

import (
	"github.com/airlockrun/agentsdk/wire"
	"testing"
)

func TestDemoConstructionAndAccessBoundary(t *testing.T) {
	m := newAgent().Manifest()
	if len(m.Connections) != 1 || m.Connections[0].Access != wire.AccessAdmin {
		t.Fatal("raw UserIO connection must remain administrative")
	}
	if len(m.Tools) != 1 || m.Tools[0].Name != "demo_mail" || m.Tools[0].Access != wire.AccessUser {
		t.Fatal("guest can use only fixed email reader")
	}
	if len(m.MCPServers)+len(m.Connectors)+len(m.Topics)+len(m.JobCrons)+len(m.JobHandlers) != 0 {
		t.Fatal("external sender or automation registered")
	}
}
