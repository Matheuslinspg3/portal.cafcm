from __future__ import annotations

import threading
from datetime import datetime
from pathlib import Path
from typing import Callable

from .browser import CollectionStopped, PortalBrowser, VerificationNeeded
from .domain import parse_certificate
from .store import Store


class Engine:
    def __init__(self, store: Store, stop: threading.Event, notify: Callable[[str, str], None],
                 browser_factory=PortalBrowser):
        self.store, self.stop, self.notify = store, stop, notify
        self.browser_factory = browser_factory
        self.browser = None

    def close(self):
        if self.browser:
            self.browser.close()
            self.browser = None

    def run(self, limit: int | None = None, resume: bool = False):
        jobs = self.store.pending(resume_blocked=resume)
        if limit is not None:
            jobs = jobs[:limit]
        if not jobs:
            self.notify("idle", "Nenhuma consulta pendente nesta seleção.")
            return
        try:
            if self.browser is None:
                self.browser = self.browser_factory(self.store.workspace, self.stop)
        except Exception as error:
            self.notify("error", str(error))
            return
        for job in jobs:
            if self.stop.is_set():
                self.notify("paused", "Execução pausada. Os documentos obtidos estão salvos.")
                return
            cnpj = job["cnpj"]
            self.store.mark(cnpj, "running")
            self.notify("running", f"Consultando {cnpj} — {job['name']}")
            try:
                data = self.browser.emit(cnpj)
                # A completed download is saved even when Pause was pressed while it finished.
                cert = parse_certificate(data, cnpj)
                stamp = datetime.now().strftime("%Y%m%dT%H%M%S")
                filename = f"{cnpj}_{stamp}_{cert.sha256[:12]}.pdf"
                cert.pdf_path = f"certidoes/{filename}"
                target = self.store.workspace / cert.pdf_path
                temp = target.with_suffix(".part")
                temp.write_bytes(data)
                temp.replace(target)
                self.store.complete(cert)
                self.notify("saved", f"PDF salvo: {cnpj}. " + ("Precisa de revisão." if cert.review_reason else f"Situação: {cert.quota_status}."))
            except VerificationNeeded as error:
                self.store.mark(cnpj, "blocked", str(error))
                self.notify("blocked", str(error))
                return
            except CollectionStopped:
                self.store.mark(cnpj, "pending", "Pausado antes de obter documento.")
                self.notify("paused", "Execução pausada; retome do mesmo CNPJ.")
                return
            except Exception as error:
                # Exception text from drivers/HTTP libraries may contain session data: don't persist it.
                message = "Não foi possível obter e conferir o documento. Confira o navegador e use Repetir falhas."
                self.store.mark(cnpj, "error", message)
                self.notify("error", message)
                return
        self.notify("finished", "Seleção concluída. Os PDFs e resultados foram preservados.")
