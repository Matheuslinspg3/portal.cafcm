from __future__ import annotations

import csv
import io
import json
import os
import sqlite3
import zipfile
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from .domain import Certificate, ImportData, format_cnpj, normalize_text, valid_email_format


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class WorkspaceLock:
    """OS lock: a crash releases it, and two app instances cannot share the queue/profile."""

    def __init__(self, workspace: Path):
        workspace.mkdir(parents=True, exist_ok=True)
        self.handle = (workspace / "coletor.lock").open("a+b")
        self.handle.seek(0)
        self.handle.write(b"0")
        self.handle.flush()
        self.handle.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            self.handle.close()
            raise RuntimeError("O coletor já está aberto nesta pasta de trabalho.") from error

    def close(self):
        if not self.handle.closed:
            if os.name == "nt":
                import msvcrt
                self.handle.seek(0)
                msvcrt.locking(self.handle.fileno(), msvcrt.LK_UNLCK, 1)
            self.handle.close()


class Store:
    def __init__(self, workspace: Path):
        self.workspace = workspace.resolve()
        self.workspace.mkdir(parents=True, exist_ok=True)
        (self.workspace / "certidoes").mkdir(exist_ok=True)
        self.db = self.workspace / "consulta.sqlite3"
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS jobs (
                    cnpj TEXT PRIMARY KEY, name TEXT NOT NULL,
                    previous_deficit INTEGER, state TEXT NOT NULL DEFAULT 'pending',
                    message TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL,
                    certificate_json TEXT
                );
                CREATE TABLE IF NOT EXISTS contacts (
                    cnpj TEXT NOT NULL REFERENCES jobs(cnpj), fingerprint TEXT NOT NULL,
                    raw_json TEXT NOT NULL, PRIMARY KEY(cnpj, fingerprint)
                );
                CREATE TABLE IF NOT EXISTS imports (
                    sha256 TEXT PRIMARY KEY, imported_at TEXT NOT NULL, companies INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS documents (
                    sha256 TEXT PRIMARY KEY, cnpj TEXT NOT NULL REFERENCES jobs(cnpj),
                    certificate_json TEXT NOT NULL, collected_at TEXT NOT NULL
                );
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.db, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def recover_interrupted(self):
        with self.connect() as db:
            db.execute("UPDATE jobs SET state='pending', message='Consulta interrompida; pronta para retomar.', updated_at=? WHERE state='running'", (now(),))

    def import_data(self, data: ImportData):
        import hashlib
        with self.connect() as db:
            for company in data.companies:
                db.execute("""INSERT INTO jobs(cnpj,name,previous_deficit,updated_at) VALUES(?,?,?,?)
                    ON CONFLICT(cnpj) DO UPDATE SET name=excluded.name, previous_deficit=excluded.previous_deficit""",
                    (company.cnpj, company.name, company.previous_deficit, now()))
                for contact in company.contacts:
                    raw = json.dumps(contact, ensure_ascii=False, sort_keys=True)
                    fingerprint = hashlib.sha256(raw.encode()).hexdigest()
                    db.execute("INSERT OR IGNORE INTO contacts(cnpj,fingerprint,raw_json) VALUES(?,?,?)", (company.cnpj, fingerprint, raw))
            db.execute("INSERT OR IGNORE INTO imports VALUES(?,?,?)", (data.source_sha256, now(), len(data.companies)))

    def list_jobs(self) -> list[dict]:
        with self.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM jobs ORDER BY COALESCE(previous_deficit,0) DESC,cnpj")]

    def pending(self, resume_blocked: bool = False) -> list[dict]:
        states = {"pending", "blocked"} if resume_blocked else {"pending"}
        return [row for row in self.list_jobs() if row["state"] in states]

    def stats(self) -> dict:
        rows = self.list_jobs()
        stats = {key: 0 for key in ["pending", "running", "blocked", "done", "review", "error"]}
        stats["total"] = len(rows)
        stats["documents"] = sum(bool(row["certificate_json"]) for row in rows)
        stats["below_quota"] = sum(row["state"] == "done" and json.loads(row["certificate_json"] or "{}").get("quota_status") == "inferior" for row in rows)
        for row in rows:
            stats[row["state"]] += 1
        with self.connect() as db:
            stats["contacts"] = db.execute("SELECT COUNT(*) FROM contacts").fetchone()[0]
        return stats

    def mark(self, cnpj: str, state: str, message: str = ""):
        if state not in {"pending", "running", "blocked", "done", "review", "error"}:
            raise ValueError("Estado da consulta inválido.")
        with self.connect() as db:
            db.execute("UPDATE jobs SET state=?,message=?,updated_at=? WHERE cnpj=?", (state, message, now(), cnpj))

    def complete(self, certificate: Certificate):
        raw = json.dumps(certificate.to_dict(), ensure_ascii=False)
        state = "review" if certificate.review_reason else "done"
        with self.connect() as db:
            db.execute("INSERT OR IGNORE INTO documents VALUES(?,?,?,?)", (certificate.sha256, certificate.cnpj, raw, now()))
            db.execute("UPDATE jobs SET state=?, message=?, certificate_json=?, updated_at=? WHERE cnpj=?",
                       (state, certificate.review_reason, raw, now(), certificate.cnpj))

    def queue_stale(self, max_age_days: int = 7) -> int:
        cutoff = (date.today() - timedelta(days=max_age_days)).isoformat()
        stale = [row["cnpj"] for row in self.list_jobs() if row["state"] == "done"
                 and (json.loads(row["certificate_json"])["reference_date"] or "") < cutoff]
        with self.connect() as db:
            db.executemany("UPDATE jobs SET state='pending', message='Certidão antiga: atualizar.', updated_at=? WHERE cnpj=?", [(now(), cnpj) for cnpj in stale])
        return len(stale)

    def export(self, destination: Path, max_age_days: int = 7) -> dict:
        # A closed archive contains only reports and actual certificate files; never browser/session data.
        jobs = self.list_jobs()
        statuses = {"pending": "Não consultado", "running": "Em consulta", "blocked": "Verificação necessária",
                    "done": "Documento conferido", "review": "Revisar documento", "error": "Falha na consulta"}
        cutoff = (date.today() - timedelta(days=max_age_days)).isoformat()
        results, contacts_below, contacts_review = [], [], []
        files: set[str] = set()
        confirmed = 0
        with self.connect() as db:
            for job in jobs:
                cert = json.loads(job["certificate_json"] or "{}")
                path = cert.get("pdf_path", "")
                file_exists = bool(path) and (self.workspace / path).is_file()
                eligible = job["state"] == "done" and cert.get("quota_status") == "inferior" and file_exists and cutoff <= (cert.get("reference_date") or "") <= date.today().isoformat()
                if eligible:
                    confirmed += 1
                row = {"CNPJ": format_cnpj(job["cnpj"]), "Empresa": job["name"],
                       "Déficit anterior (sem data)": job["previous_deficit"], "Estado": statuses[job["state"]],
                       "Situação da certidão": cert.get("quota_status", ""),
                       "Data de referência": cert.get("reference_date", ""), "Data de emissão": cert.get("issued_date", ""),
                       "Código de autenticidade": cert.get("verification_code", ""),
                       "Documento": path if file_exists else "", "SHA-256": cert.get("sha256", ""),
                       "Revisão": job["message"] if file_exists or not path else "PDF ausente na pasta de trabalho.",
                       "Coleta": job["updated_at"], "Déficit confirmado na janela": "Sim" if eligible else "Não"}
                results.append(row)
                if file_exists:
                    files.add(path)
                if not eligible:
                    continue
                for contact in db.execute("SELECT raw_json FROM contacts WHERE cnpj=?", (job["cnpj"],)):
                    raw = json.loads(contact[0])
                    normalized = {normalize_text(key): value for key, value in raw.items()}
                    email = normalized.get("e-mail", normalized.get("email", "")).strip()
                    output = {"Razão Social": normalized.get("razao social", job["name"]),
                              "Categoria": normalized.get("categoria", ""), "CNPJ": format_cnpj(job["cnpj"]),
                              "Endereço": normalized.get("endereco", ""), "Telefone": normalized.get("telefone", ""),
                              "E-mail": email, "Observações/Status anterior": normalized.get("observacoes/status", ""),
                              "Situação da certidão": "inferior", "Data de referência": cert["reference_date"],
                              "Documento": path, "Código de autenticidade": cert.get("verification_code", ""),
                              "Validação do e-mail": "Somente formato; caixa e vínculo não verificados"}
                    (contacts_below if valid_email_format(email) else contacts_review).append(output)
        manifests = {"gerado_em": now(), "versao": "1.0.0", "estatisticas": self.stats(),
                     "cnpjs_com_deficit_confirmado_na_janela": confirmed,
                     "contatos_com_formato_valido": len(contacts_below), "contatos_para_revisao": len(contacts_review),
                     "janela_dados_dias": max_age_days,
                     "observacao": "Resultados referem-se à data da certidão. Autenticidade por código não consultada separadamente. Nenhum e-mail enviado."}
        contact_fields = ["Razão Social", "Categoria", "CNPJ", "Endereço", "Telefone", "E-mail", "Observações/Status anterior",
                          "Situação da certidão", "Data de referência", "Documento", "Código de autenticidade", "Validação do e-mail"]
        result_fields = list(results[0]) if results else ["CNPJ", "Empresa", "Estado", "Situação da certidão", "Documento"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        temp = destination.with_suffix(".part")
        with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, rows, fields in [("resultados_cnpjs.csv", results, result_fields),
                                      ("contatos_deficit_confirmado.csv", contacts_below, contact_fields),
                                      ("contatos_revisao_email.csv", contacts_review, contact_fields)]:
                output = io.StringIO(newline="")
                writer = csv.DictWriter(output, fieldnames=fields, delimiter=";", lineterminator="\r\n")
                writer.writeheader()
                for row in rows:
                    writer.writerow({key: safe_cell(value) for key, value in row.items()})
                archive.writestr(name, output.getvalue().encode("utf-8-sig"))
            archive.writestr("resumo.json", json.dumps(manifests, ensure_ascii=False, indent=2))
            for path in sorted(files):
                resolved = (self.workspace / path).resolve()
                if resolved.parent != (self.workspace / "certidoes").resolve():
                    raise ValueError("Caminho de documento inesperado.")
                archive.write(resolved, path)
        temp.replace(destination)
        return manifests


def safe_cell(value) -> str:
    value = "" if value is None else str(value)
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@")) else value
