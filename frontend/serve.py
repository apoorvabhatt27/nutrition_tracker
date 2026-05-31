#!/usr/bin/env python3
"""
No-cache dev server for the nutrition tracker frontend.

Replaces:  python -m http.server 5700
Usage:     python serve.py
"""
import http.server
import socketserver

PORT = 5700


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # suppress per-request noise; errors still go to stderr


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Frontend serving at http://localhost:{PORT}  (no-cache mode)")
        httpd.serve_forever()
