import csv
import io
import json
import threading
import zipfile
from datetime import date, timedelta

import pytest

from cafcm_certidoes.browser import CollectionStopped, VerificationNeeded
from cafcm_certidoes.domain import InputCompany, ImportData, parse_certificate
from cafcm_certidoes.engine import Engine
from cafcm_certidoes.store import Store, WorkspaceLock


def seed(store):
    store.import_data(ImportData([
        InputCompany("02529330000102", "Empresa A", 69, [{"E-mail": "a@example.com"}, {"E-mail": "bad@@example.com"}]),
        InputCompany("58528281000130", "Empresa B", 49, [{"E-mail": "b@example.com"}]),
    ], 0, [], "a" * 64))


def test_engine_stops_at_verification_and_resumes_without_repeating_completed_jobs(tmp_path, pdf_factory):
    store = Store(tmp_path)
    seed(store)
    stop = threading.Event()
    attempts, events = [], []
    class Browser:
        def __init__(self, *args):
            self.block = True
        def emit(self, cnpj):
            attempts.append(cnpj)
            if cnpj == "58528281000130" and self.block:
                self.block = False
                raise VerificationNeeded("Teste: verificação necessária.")
            return pdf_factory(cnpj="02.529.330/0001-02" if cnpj == "02529330000102" else "58.528.281/0001-30")
        def close(self):
            pass
    engine = Engine(store, stop, lambda *event: events.append(event), Browser)
    engine.run()
    assert store.stats()["done"] == 1 and store.stats()["blocked"] == 1
    assert len(attempts) == 2
    engine.run(resume=True)
    assert attempts == ["02529330000102", "58528281000130", "58528281000130"]
    assert store.stats()["done"] == 2
    assert len(list((tmp_path / "certidoes").glob("*.pdf"))) == 2


def test_pause_keeps_download_and_leaves_next_job_pending(tmp_path, pdf_factory):
    store = Store(tmp_path)
    seed(store)
    stop = threading.Event()
    class Browser:
        def __init__(self, *args): pass
        def emit(self, cnpj):
            stop.set()
            return pdf_factory()
    Engine(store, stop, lambda *args: None, Browser).run()
    assert store.stats()["done"] == 1 and store.stats()["pending"] == 1


def test_unfinished_job_recovers_and_reimport_keeps_result(tmp_path, pdf_factory):
    store = Store(tmp_path)
    seed(store)
    store.mark("02529330000102", "running")
    Store(tmp_path).recover_interrupted()
    assert store.stats()["pending"] == 2
    cert = parse_certificate(pdf_factory(), "02529330000102")
    store.complete(cert)
    seed(store)
    assert store.stats()["done"] == 1 and store.stats()["contacts"] == 3


def test_export_filters_missing_stale_and_bad_email_and_excludes_profile(tmp_path, pdf_factory):
    store = Store(tmp_path)
    seed(store)
    data = pdf_factory()
    cert = parse_certificate(data, "02529330000102")
    cert.pdf_path = "certidoes/teste.pdf"
    (tmp_path / cert.pdf_path).write_bytes(data)
    store.complete(cert)
    profile = tmp_path / "perfil_navegador"
    profile.mkdir()
    (profile / "cookies").write_text("NO_EXPORT")
    archive_path = tmp_path / "resultados.zip"
    summary = store.export(archive_path)
    assert summary["contatos_com_formato_valido"] == 1 and summary["contatos_para_revisao"] == 1
    with zipfile.ZipFile(archive_path) as archive:
        assert "certidoes/teste.pdf" in archive.namelist()
        assert not any("perfil" in name or "sqlite" in name for name in archive.namelist())
        rows = list(csv.DictReader(io.StringIO(archive.read("contatos_deficit_confirmado.csv").decode("utf-8-sig")), delimiter=";"))
        assert rows[0]["CNPJ"] == "02.529.330/0001-02" and rows[0]["E-mail"] == "a@example.com"
    (tmp_path / cert.pdf_path).unlink()
    assert store.export(archive_path)["contatos_com_formato_valido"] == 0
    (tmp_path / cert.pdf_path).write_bytes(data)
    cert.reference_date = (date.today() - timedelta(days=8)).isoformat()
    store.complete(cert)
    assert store.export(archive_path)["contatos_com_formato_valido"] == 0


def test_workspace_lock_rejects_second_instance(tmp_path):
    lock = WorkspaceLock(tmp_path)
    with pytest.raises(RuntimeError):
        WorkspaceLock(tmp_path)
    lock.close()
    WorkspaceLock(tmp_path).close()
