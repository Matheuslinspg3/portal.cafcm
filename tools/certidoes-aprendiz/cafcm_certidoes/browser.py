from __future__ import annotations

import threading
import time
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

PORTAL_URL = "https://certidoes.sit.trabalho.gov.br/aprendiz"
FORM_TIMEOUT_SECONDS = 15
VERIFICATION_TIMEOUT_SECONDS = 25
PDF_TIMEOUT_SECONDS = 60


class VerificationNeeded(RuntimeError):
    pass


class CollectionStopped(RuntimeError):
    pass


class PortalError(RuntimeError):
    pass


class PortalBrowser:
    """Submit the site's actual form. No replay, token solver, request forgery or protection bypass."""

    def __init__(self, workspace: Path, stop: threading.Event):
        self.workspace = workspace
        self.stop = stop
        self.playwright = sync_playwright().start()
        self.context = None
        try:
            self.context = self._launch_context()
            self.page = self.context.pages[0] if self.context.pages else self.context.new_page()
            self.page.set_default_timeout(10000)
            self.prepared_cnpj = None
            self.opened = False
        except Exception as error:
            self.close()
            raise PortalError("Não foi possível abrir o Google Chrome. Confira se ele está instalado e feche outra instância do coletor.") from error

    def _launch_context(self):
        return self.playwright.chromium.launch_persistent_context(
            user_data_dir=str(self.workspace / "perfil_navegador"), channel="chrome",
            headless=False, accept_downloads=True)

    def close(self):
        try:
            if self.context:
                self.context.close()
        finally:
            self.playwright.stop()

    def _check_stop(self):
        if self.stop.is_set():
            raise CollectionStopped("Execução pausada.")
        if self.page.is_closed():
            raise PortalError("O navegador foi fechado. Abra novamente o coletor para retomar.")

    def _form(self):
        return self.page.locator('form').filter(has=self.page.locator('input[name="form-id"][value="emitir"]')).first

    def _form_visible(self) -> bool:
        return self._form().count() > 0 and self._form().is_visible()

    def _protection_visible(self) -> bool:
        body = self.page.locator("body").inner_text(timeout=3000).lower()
        return any(value in body for value in ["vamos confirmar que você é humano", "verify you are human",
                                               "checking your browser", "just a moment", "access denied"])

    def emit(self, cnpj: str) -> bytes:
        self._check_stop()
        if not self.opened or (self.prepared_cnpj != cnpj and not self._form_visible()):
            try:
                self.page.goto(PORTAL_URL, wait_until="domcontentloaded", timeout=30000)
                self.opened = True
            except Exception as error:
                raise PortalError("O portal não respondeu dentro do prazo. A fila foi preservada.") from error
        elif self.prepared_cnpj != cnpj and self.prepared_cnpj is not None:
            # Normal navigation obtains the form for the next issuance; old tokens are not reused.
            self.page.goto(PORTAL_URL, wait_until="domcontentloaded", timeout=30000)
        deadline = time.monotonic() + FORM_TIMEOUT_SECONDS
        while not self._form_visible():
            self._check_stop()
            if self._protection_visible() or time.monotonic() >= deadline:
                raise VerificationNeeded("O portal exige verificação. Conclua no Chrome e use Retomar; a execução não repetirá a tentativa sozinha.")
            self.page.wait_for_timeout(250)
        form = self._form()
        cookies = self.page.get_by_role("button", name="Aceitar", exact=True)
        if cookies.count() == 1 and cookies.is_visible():
            cookies.click()
        if self.prepared_cnpj != cnpj:
            form.locator('input[name="cnpjForm"]').fill(cnpj)
            self.prepared_cnpj = cnpj
        deadline = time.monotonic() + VERIFICATION_TIMEOUT_SECONDS
        token_inputs = form.locator('input[name="cf-turnstile-response-emitir"], input[name="cf-turnstile-response"]')
        while True:
            self._check_stop()
            # Read only readiness. Tokens are never copied, saved, logged, or sent separately.
            ready = token_inputs.evaluate_all("els => els.some(el => Boolean(el.value))")
            if ready:
                break
            if time.monotonic() >= deadline:
                raise VerificationNeeded("A verificação não foi concluída automaticamente. A fila está pausada no CNPJ atual.")
            self.page.wait_for_timeout(250)
        downloads, responses, rejected = [], [], []

        def on_response(response):
            parsed = urlsplit(response.url)
            expected = urlsplit(PORTAL_URL)
            if parsed.netloc != expected.netloc or parsed.path.rstrip("/") != expected.path.rstrip("/"):
                return
            if response.status in {403, 429}:
                rejected.append(response.status)
            content_type = response.headers.get("content-type", "").lower()
            disposition = response.headers.get("content-disposition", "").lower()
            if "application/pdf" in content_type or ".pdf" in disposition:
                responses.append(response)

        def on_download(download):
            if urlsplit(download.url).netloc == urlsplit(PORTAL_URL).netloc:
                downloads.append(download)

        self.page.on("response", on_response)
        self.page.on("download", on_download)
        try:
            # All native form fields, including both Turnstile fields, are submitted by the site.
            form.get_by_role("button", name="Emitir", exact=True).click(no_wait_after=True)
            deadline = time.monotonic() + PDF_TIMEOUT_SECONDS
            while time.monotonic() < deadline:
                self._check_stop()
                if rejected:
                    raise VerificationNeeded("O portal recusou a emissão ou limitou consultas. A execução foi interrompida.")
                if downloads:
                    path = downloads[0].path()
                    if path is None or Path(path).stat().st_size > 20 * 1024 * 1024:
                        raise PortalError("Download ausente ou maior que 20 MB.")
                    data = Path(path).read_bytes()
                    self.prepared_cnpj = None
                    self.opened = False
                    return data
                if responses:
                    data = responses[0].body()
                    if len(data) > 20 * 1024 * 1024:
                        raise PortalError("A resposta ultrapassa 20 MB.")
                    self.prepared_cnpj = None
                    self.opened = False
                    return data
                if self._protection_visible():
                    raise VerificationNeeded("O portal pediu nova verificação após o envio. A emissão não será repetida automaticamente.")
                self.page.wait_for_timeout(250)
            raise PortalError("A emissão não produziu um PDF dentro de 60 segundos. Confira o Chrome antes de retomar.")
        finally:
            self.page.remove_listener("response", on_response)
            self.page.remove_listener("download", on_download)
