#!/usr/bin/env python3
"""Bearer-protected loopback MCP ingress. Product MCP implementations stay intact."""
import hmac
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import threading

UPSTREAMS = {"/herder": 18787, "/grepmesh": 9419}
TOKEN_PATHS = {"/herder": "AIRLOCK_HERDER_TOKEN_FILE", "/grepmesh": "AIRLOCK_GREPMESH_TOKEN_FILE"}
HOP_HEADERS = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host", "content-length"}
MAX_BODY = 4 << 20

class Server(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 16
    slots = threading.BoundedSemaphore(16)

    def process_request(self, request, address):
        if not self.slots.acquire(blocking=False):
            try:
                request.sendall(b"HTTP/1.1 503 Busy\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
            finally:
                self.shutdown_request(request)
            return
        try:
            super().process_request(request, address)
        except BaseException:
            self.slots.release()
            raise

    def process_request_thread(self, request, address):
        try:
            super().process_request_thread(request, address)
        finally:
            self.slots.release()

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args):
        pass  # MCP args/results and credentials never enter service logs.

    def do_GET(self): self.proxy()
    def do_POST(self): self.proxy()
    def do_DELETE(self): self.proxy()

    def proxy(self):
        key = self.path
        if key not in UPSTREAMS:
            self.send_error(404)
            return
        expected = self.server.tokens[key]
        values = self.headers.get_all("Authorization", [])
        if len(values) != 1 or not hmac.compare_digest(values[0], "Bearer " + expected):
            self.send_error(401, "Authentication required")
            return
        if self.headers.get("Transfer-Encoding"):
            self.send_error(400, "Content-Length required")
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(400)
            return
        if size < 0 or size > MAX_BODY:
            self.send_error(413)
            return
        self.connection.settimeout(60)
        body = self.rfile.read(size) if size else None
        headers = {k:v for k,v in self.headers.items() if k.lower() not in HOP_HEADERS | {"authorization", "cookie"} and not k.lower().startswith("x-airlock-")}
        headers["Host"] = "127.0.0.1:" + str(UPSTREAMS[key])
        conn = http.client.HTTPConnection("127.0.0.1", UPSTREAMS[key], timeout=55)
        try:
            conn.request(self.command, "/mcp", body=body, headers=headers)
            upstream = conn.getresponse()
            self.send_response(upstream.status)
            for k,v in upstream.getheaders():
                if k.lower() not in HOP_HEADERS | {"set-cookie"}:
                    self.send_header(k,v)
            # Connection-close framing streams SSE without buffering or rewriting
            # MCP session/protocol IDs. Every connection is bounded by timeout.
            self.send_header("Connection", "close")
            self.end_headers()
            total = 0
            while chunk := upstream.read1(64 << 10):
                total += len(chunk)
                if total > 8 << 20:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (OSError, http.client.HTTPException):
            self.close_connection = True
        finally:
            conn.close()
            self.close_connection = True

def main():
    server = Server(("127.0.0.1", 19418), Handler)
    server.tokens = {k:Path(os.environ[env]).read_text().strip() for k,env in TOKEN_PATHS.items()}
    if any(len(t) < 32 for t in server.tokens.values()):
        raise SystemExit("MCP ingress credentials are not configured")
    server.serve_forever(poll_interval=0.5)

if __name__ == "__main__": main()
