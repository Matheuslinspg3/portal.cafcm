from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import unicodedata
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path

from pypdf import PdfReader


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    return " ".join("".join(c for c in value if not unicodedata.combining(c)).lower().split())


def normalize_cnpj(value: str) -> str:
    # This first version deliberately accepts only the numeric CNPJs in the supplied base.
    if not re.fullmatch(r"[0-9.\-/\s]+", str(value)):
        raise ValueError("Esta versão aceita CNPJ numérico completo, com 14 dígitos.")
    digits = re.sub(r"\D", "", str(value))
    if len(digits) != 14 or len(set(digits)) == 1:
        raise ValueError("CNPJ numérico inválido.")
    for size, weights in [(12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]),
                          (13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])]:
        remainder = sum(int(n) * w for n, w in zip(digits[:size], weights)) % 11
        if int(digits[size]) != (0 if remainder < 2 else 11 - remainder):
            raise ValueError("Dígitos verificadores do CNPJ inválidos.")
    return digits


def format_cnpj(cnpj: str) -> str:
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"


def valid_email_format(value: str) -> bool:
    value = value.strip()
    if len(value) > 254 or value.count("@") != 1:
        return False
    local, domain = value.rsplit("@", 1)
    return bool(
        re.fullmatch(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}", local)
        and not local.startswith(".") and not local.endswith(".") and ".." not in local
        and re.fullmatch(r"(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}", domain)
    )


def old_deficit(value: str) -> int | None:
    match = re.search(r"\bfaltam\s+(-?\d+)\s+aprendizes?\b", normalize_text(value))
    return int(match.group(1)) if match else None


@dataclass
class InputCompany:
    cnpj: str
    name: str = ""
    previous_deficit: int | None = None
    contacts: list[dict[str, str]] = field(default_factory=list)


@dataclass
class ImportData:
    companies: list[InputCompany]
    skipped: int
    problems: list[str]
    source_sha256: str


def load_input(path: Path, positive_only: bool = True) -> ImportData:
    raw = path.read_bytes()
    if len(raw) > 30 * 1024 * 1024:
        raise ValueError("A base ultrapassa o limite de 30 MB.")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("cp1252")
    companies: dict[str, InputCompany] = {}
    problems: list[str] = []
    skipped = 0
    if path.suffix.lower() == ".json":
        records = json.loads(text)
        if not isinstance(records, list):
            raise ValueError("A fila JSON deve ser uma lista de empresas.")
        rows = []
        for item in records:
            if not isinstance(item, dict):
                raise ValueError("A fila contém um registro que não é uma empresa.")
            rows.append((item.get("cnpj", ""), item.get("razao_social_base", item.get("empresa", "")),
                         item.get("deficit_anterior"), item.get("contatos", [])))
    else:
        try:
            dialect = csv.Sniffer().sniff(text[:16384], delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        if not reader.fieldnames:
            raise ValueError("A base não possui cabeçalho.")
        keys = {normalize_text(k): k for k in reader.fieldnames}
        cnpj_key = keys.get("cnpj")
        if not cnpj_key:
            raise ValueError("A base precisa da coluna CNPJ.")
        name_key = keys.get("razao social", keys.get("empresa", ""))
        status_key = keys.get("observacoes/status", keys.get("observacoesstatus", ""))
        rows = []
        for row in reader:
            if None in row:
                problems.append(f"Linha {reader.line_num}: quantidade de campos inválida.")
                continue
            rows.append((row.get(cnpj_key, ""), row.get(name_key, ""),
                         old_deficit(row.get(status_key, "")) if status_key else None,
                         [row]))
    for index, (value, name, deficit, contacts) in enumerate(rows, start=2):
        try:
            cnpj = normalize_cnpj(str(value))
            if deficit is not None:
                if isinstance(deficit, bool) or not re.fullmatch(r"-?\d+", str(deficit)):
                    raise ValueError("Déficit anterior inválido.")
                deficit = int(deficit)
            if positive_only and deficit is not None and deficit <= 0:
                skipped += 1
                continue
            # If the source has an old-status column, only its positive indications are in scope.
            if positive_only and path.suffix.lower() != ".json" and status_key and deficit is None:
                skipped += 1
                continue
            if not isinstance(contacts, list):
                raise ValueError("Contatos devem ser uma lista.")
            company = companies.setdefault(cnpj, InputCompany(cnpj, str(name or ""), deficit))
            if company.previous_deficit != deficit:
                raise ValueError("O mesmo CNPJ possui indicações antigas conflitantes.")
            for contact in contacts:
                if not isinstance(contact, dict):
                    raise ValueError("Contato inválido.")
                safe_contact = {str(k): str(v or "") for k, v in contact.items()
                                if normalize_text(str(k)) in {
                                    "razao social", "categoria", "cnpj", "endereco", "telefone", "e-mail",
                                    "email", "observacoes/status", "linha", "email_formato"}}
                if safe_contact not in company.contacts:
                    company.contacts.append(safe_contact)
        except ValueError as error:
            problems.append(f"Registro {index}: {error}")
    return ImportData(list(companies.values()), skipped, problems, hashlib.sha256(raw).hexdigest())


class InvalidPDF(ValueError):
    pass


@dataclass
class Certificate:
    cnpj: str
    quota_status: str
    reference_date: str | None
    issued_date: str | None
    verification_code: str | None
    sha256: str
    review_reason: str
    pdf_path: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


DATE_PATTERN = r"(\d{2}/\d{2}/\d{4})"
CNPJ_PATTERN = r"(?<!\d)(?:\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{14})(?!\d)"


def extract_date(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern + DATE_PATTERN, text)
        if match:
            try:
                return datetime.strptime(match.group(1), "%d/%m/%Y").date().isoformat()
            except ValueError:
                return None
    return None


def parse_certificate(data: bytes, expected_cnpj: str, today: date | None = None,
                      max_age_days: int = 7) -> Certificate:
    today = today or date.today()
    expected_cnpj = normalize_cnpj(expected_cnpj)
    if len(data) > 20 * 1024 * 1024 or not data.lstrip().startswith(b"%PDF-"):
        raise InvalidPDF("A resposta não é um PDF válido dentro do limite de 20 MB.")
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(""):
            raise InvalidPDF("PDF protegido: leitura precisa de revisão.")
        if not 1 <= len(reader.pages) <= 10:
            raise InvalidPDF("Quantidade de páginas inesperada para uma certidão.")
        text = normalize_text("\n".join(page.extract_text() or "" for page in reader.pages))
    except InvalidPDF:
        raise
    except Exception as error:
        raise InvalidPDF("Não foi possível ler o PDF recebido.") from error
    reasons = []
    if "certidao de regularidade na contratacao de aprendizes" not in text:
        reasons.append("Título da certidão de aprendizes não reconhecido.")
    found_cnpjs = {re.sub(r"\D", "", value) for value in re.findall(CNPJ_PATTERN, text)}
    if found_cnpjs != {expected_cnpj}:
        reasons.append("O documento não identifica exclusivamente o CNPJ consultado.")
    statuses = set(re.findall(
        r"aprendizes(?:\s+contratados)?\s+em\s+numero\s+(inferior|igual|superior)\b", text))
    statuses.update(re.findall(
        r"numero de aprendizes(?:\s+\w+){0,5}\s+(inferior|igual|superior)\b", text))
    if re.search(r"(?:empregador|estabelecimento)[^.]{0,200}\bdesobrigado\b", text):
        statuses.add("desobrigado")
    quota_status = next(iter(statuses)) if len(statuses) == 1 else "nao_identificado"
    if quota_status == "nao_identificado":
        reasons.append("Situação da cota ausente ou ambígua.")
    reference = extract_date(text, [r"empregava\s*,?\s*em\s+",
        r"data (?:de |do )?processamento(?: dos dados)?\s*[:\-]?\s*",
        r"dados (?:disponiveis|processados) (?:ate|em)\s+", r"data de referencia\s*[:\-]?\s*"])
    issued = extract_date(text, [r"(?:certidao )?emitida(?: eletronicamente)? em\s+",
                                r"data de emissao\s*[:\-]?\s*"])
    code_match = re.search(
        r"(?:codigo|chave)(?: de)? (?:autenticidade|verificacao|validacao)\s*[:\-]?\s*([a-z0-9][a-z0-9\-]{7,127})",
        text)
    code = code_match.group(1) if code_match else None
    # Preserve the original code's letter case instead of the normalized text's case.
    if code:
        original = "\n".join(page.extract_text() or "" for page in reader.pages)
        original_match = re.search(re.escape(code), original, re.IGNORECASE)
        if original_match:
            code = original_match.group(0)
    if not code:
        reasons.append("Código de autenticidade não identificado.")
    if not reference:
        reasons.append("Data de referência não identificada.")
    elif not today - timedelta(days=max_age_days) <= date.fromisoformat(reference) <= today:
        reasons.append("Data de referência fora da janela de atualização.")
    if issued and date.fromisoformat(issued) > today:
        reasons.append("Data de emissão futura.")
    return Certificate(expected_cnpj, quota_status, reference, issued, code,
                       hashlib.sha256(data).hexdigest(), " ".join(reasons))
