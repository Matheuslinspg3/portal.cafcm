import json
from datetime import date, timedelta

import pytest

from cafcm_certidoes.domain import InvalidPDF, load_input, normalize_cnpj, parse_certificate, valid_email_format


def test_numeric_cnpj_keeps_leading_zero_and_full_establishment():
    assert normalize_cnpj("02.805.610/0002-79") == "02805610000279"
    for invalid in ["02805610000278", "00000000000000", "02805610", "02.A05.610/0002-79"]:
        with pytest.raises(ValueError):
            normalize_cnpj(invalid)


@pytest.mark.parametrize("status", ["inferior", "igual", "superior", "desobrigado"])
def test_certificate_classifies_only_document_bound_to_cnpj(pdf_factory, status):
    cert = parse_certificate(pdf_factory(status=status), "02529330000102")
    assert cert.quota_status == status
    assert cert.reference_date == date.today().isoformat()
    assert cert.verification_code == "AbC123XYZ456"
    assert not cert.review_reason


def test_stale_wrong_company_and_ambiguous_certificate_require_review(pdf_factory):
    stale = (date.today() - timedelta(days=8)).strftime("%d/%m/%Y")
    assert "janela" in parse_certificate(pdf_factory(reference=stale), "02529330000102").review_reason
    assert "CNPJ" in parse_certificate(pdf_factory(), "58528281000130").review_reason
    data = pdf_factory(extra="Outro resultado: aprendizes em número superior ao mínimo.")
    assert parse_certificate(data, "02529330000102").quota_status == "nao_identificado"


def test_html_and_corrupt_pdf_are_not_saved_as_certificates():
    for data in [b"<html>Confirme que e humano</html>", b"%PDF-invalid"]:
        with pytest.raises(InvalidPDF):
            parse_certificate(data, "02529330000102")


def test_csv_selection_is_based_on_old_status_without_confirming_anything(tmp_path):
    source = tmp_path / "base.csv"
    source.write_text("Razão Social;CNPJ;E-mail;Observações/Status\n"
                      "Empresa A;02.529.330/0001-02;a@example.com;Faltam 69 aprendizes\n"
                      "Empresa A;02.529.330/0001-02;b@example.com;Faltam 69 aprendizes\n"
                      "Empresa B;58.528.281/0001-30;c@example.com;Faltam 0 aprendizes\n"
                      "Empresa C;02.805.610/0002-79;d@example.com;desobrigado\n", encoding="utf-8-sig")
    data = load_input(source)
    assert len(data.companies) == 1 and len(data.companies[0].contacts) == 2
    assert data.skipped == 2 and not data.problems
    assert len(load_input(source, positive_only=False).companies) == 3


def test_json_does_not_import_cookies_or_tokens(tmp_path):
    source = tmp_path / "base.json"
    source.write_text(json.dumps([{"cnpj": "02529330000102", "aws-waf-token": "DO_NOT_STORE",
                                  "contatos": [{"email": "a@example.com", "token": "DO_NOT_STORE"}]}]))
    company = load_input(source).companies[0]
    assert company.contacts == [{"email": "a@example.com"}]


@pytest.mark.parametrize("email,valid", [("financeiro@example.com", True), ("a+b@sub.example.com", True),
                                          ("a..b@example.com", False), ("a@example_com", False),
                                          ("a@-example.com", False), ("a@@example.com", False)])
def test_email_checks_format_only(email, valid):
    assert valid_email_format(email) == valid
