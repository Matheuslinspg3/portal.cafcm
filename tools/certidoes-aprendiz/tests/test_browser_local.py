"""Real browser against a localhost fixture only. No calls to the MTE or Cloudflare."""
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

import pytest

from cafcm_certidoes import browser as module
from cafcm_certidoes.browser import PortalBrowser, VerificationNeeded


@pytest.fixture
def portal(monkeypatch, pdf_factory):
    state = {"posts": [], "gets": 0, "mode": "attachment"}
    data = pdf_factory()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def do_GET(self):
            state["gets"] += 1
            token = "" if state["mode"] == "verification" else f"local-fixture-{state['gets']}"
            body = f'''<!doctype html><title>TESTE LOCAL</title>
                <form method="post" action="/aprendiz"><input type="hidden" name="form-id" value="emitir">
                <input name="cnpjForm"><input type="hidden" name="cf-turnstile-response" value="{token}">
                <input type="hidden" name="cf-turnstile-response-emitir" value="{token}"><button>Emitir</button></form>'''.encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def do_POST(self):
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            state["posts"].append(parse_qs(body.decode()))
            if state["mode"] == "rejected":
                self.send_response(403)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<html>Access denied</html>')
                return
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'{state["mode"]}; filename="teste-ficticio.pdf"')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    monkeypatch.setattr(module, 'PORTAL_URL', f'http://127.0.0.1:{server.server_port}/aprendiz')
    monkeypatch.setattr(module, 'VERIFICATION_TIMEOUT_SECONDS', 0.6)
    monkeypatch.setattr(module, 'PDF_TIMEOUT_SECONDS', 8)
    monkeypatch.setattr(PortalBrowser, '_launch_context', lambda self:
        self.playwright.chromium.launch_persistent_context(str(self.workspace / 'perfil_navegador'),
            headless=True, accept_downloads=True))
    yield state, data
    server.shutdown()
    server.server_close()
    thread.join(timeout=3)


@pytest.mark.parametrize('mode', ['attachment', 'inline'])
def test_native_post_and_pdf_capture(tmp_path, portal, mode):
    state, data = portal
    state['mode'] = mode
    browser = PortalBrowser(tmp_path, threading.Event())
    try:
        assert browser.emit('02529330000102') == data
        assert state['posts'][0]['form-id'] == ['emitir']
        assert state['posts'][0]['cnpjForm'] == ['02529330000102']
        assert state['posts'][0]['cf-turnstile-response'] == state['posts'][0]['cf-turnstile-response-emitir']
    finally:
        browser.close()


def test_missing_verification_token_does_not_send_request(tmp_path, portal):
    state, _ = portal
    state['mode'] = 'verification'
    browser = PortalBrowser(tmp_path, threading.Event())
    try:
        with pytest.raises(VerificationNeeded):
            browser.emit('02529330000102')
        assert state['posts'] == [] and state['gets'] == 1
    finally:
        browser.close()


def test_server_rejection_stops_without_replaying_post(tmp_path, portal):
    state, _ = portal
    state['mode'] = 'rejected'
    browser = PortalBrowser(tmp_path, threading.Event())
    try:
        with pytest.raises(VerificationNeeded):
            browser.emit('02529330000102')
        assert len(state['posts']) == 1 and state['gets'] == 1
    finally:
        browser.close()
