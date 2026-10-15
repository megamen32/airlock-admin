package main

import (
	"github.com/airlockrun/agentsdk/capability"
	"github.com/airlockrun/agentsdk/wire"
	"testing"
)

func TestGuestCannotUseRawVendorConnection(t *testing.T) {
	m := newAgent().Manifest()
	if len(m.Connections) != 1 || m.Connections[0].Access != wire.AccessAdmin {
		t.Fatal("vendor connection must be admin-only")
	}
	d, e := capability.Catalog(m, capability.Discovery{})
	if e != nil {
		t.Fatal(e)
	}
	for _, x := range d {
		if x.Path.Kind() == capability.Connection && x.Access != wire.AccessAdmin {
			t.Fatal("raw connection exposed to guest")
		}
	}
	if len(m.Webhooks) != 1 || m.Webhooks[0].Verify != "bearer" {
		t.Fatal("callback must be verified by native core")
	}
	for _, r := range m.Routes {
		if r.Access == wire.AccessPublic && !(r.Method == "GET" && r.Path == "/static/{name}") {
			t.Fatal("unexpected unauthenticated route")
		}
		if r.Path == "/admin/tester" && r.Access != wire.AccessAdmin {
			t.Fatal("guest may change recipient")
		}
	}
	if len(m.Tools) != 1 || m.Tools[0].Name != "botmother_demo" || m.Tools[0].Access != wire.AccessUser {
		t.Fatal("missing user-facing domain tool")
	}
}
