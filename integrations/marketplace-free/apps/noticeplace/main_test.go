package main

import (
	"github.com/airlockrun/agentsdk/capability"
	"github.com/airlockrun/agentsdk/wire"
	"testing"
)

func TestRestrictedGuestSurface(t *testing.T) {
	m := newAgent().Manifest()
	if len(m.Connections) != 1 || m.Connections[0].Access != wire.AccessAdmin {
		t.Fatal("raw intake connection exposed")
	}
	d, e := capability.Catalog(m, capability.Discovery{})
	if e != nil {
		t.Fatal(e)
	}
	for _, x := range d {
		if x.Path.Kind() == capability.Connection && x.Access != wire.AccessAdmin {
			t.Fatal("guest raw connection")
		}
	}
	for _, r := range m.Routes {
		if r.Access == wire.AccessPublic && !(r.Method == "GET" && r.Path == "/static/{name}") {
			t.Fatal("unexpected public route")
		}
	}
	if len(m.Tools) != 1 || m.Tools[0].Name != "noticeplace_demo" || m.Tools[0].Access != wire.AccessUser {
		t.Fatal("missing guest tool")
	}
}
