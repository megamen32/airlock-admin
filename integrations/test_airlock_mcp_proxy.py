"""focused integration: credential and MCP session forwarding; expected 1s, max 10s."""
import http.client
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading
import unittest

import airlock_mcp_proxy as proxy

class Upstream(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", "0")))
        self.server.seen = dict(self.headers)
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Mcp-Session-Id", "fixture-session")
        self.end_headers()
        self.wfile.write(b'data: {"jsonrpc":"2.0","id":1,"result":{"tools":[]}}\n\n')

class TestProxy(unittest.TestCase):
    def test_auth_denial_and_native_session_forwarding(self):
        upstream = HTTPServer(("127.0.0.1",0),Upstream)
        server = proxy.Server(("127.0.0.1",0),proxy.Handler)
        server.tokens = {"/herder":"test-fixture-token"}
        old = proxy.UPSTREAMS["/herder"]
        proxy.UPSTREAMS["/herder"] = upstream.server_port
        for instance in (upstream,server):
            threading.Thread(target=instance.serve_forever,daemon=True).start()
        try:
            def call(headers):
                c=http.client.HTTPConnection("127.0.0.1",server.server_port,timeout=3)
                c.request("POST","/herder",body=b'{}',headers=headers)
                r=c.getresponse(); status=r.status; session=r.getheader("Mcp-Session-Id");body=r.read();c.close()
                return status,session,body
            self.assertEqual(call({"Authorization":"Bearer invalid"})[0],401)
            self.assertFalse(hasattr(upstream,"seen"))
            status,session,body=call({"Authorization":"Bearer test-fixture-token","MCP-Protocol-Version":"2025-03-26","Mcp-Session-Id":"fixture-request","Accept":"text/event-stream"})
            self.assertEqual(status,200)
            self.assertEqual(session,"fixture-session")
            self.assertIn(b'"tools":[]',body)
            self.assertEqual(upstream.seen.get("Mcp-Session-Id"),"fixture-request")
            self.assertEqual(upstream.seen.get("MCP-Protocol-Version"),"2025-03-26")
            self.assertNotIn("Authorization",upstream.seen)
        finally:
            proxy.UPSTREAMS["/herder"] = old
            for instance in (server,upstream):instance.shutdown();instance.server_close()

if __name__ == "__main__":unittest.main()
