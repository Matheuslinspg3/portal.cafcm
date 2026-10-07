import io
from datetime import date

import pytest
from pypdf import PdfWriter
from pypdf.generic import ArrayObject, DecodedStreamObject, DictionaryObject, NameObject


@pytest.fixture
def pdf_factory():
    def make(cnpj="02.529.330/0001-02", status="inferior", reference=None, code="AbC123XYZ456", extra=""):
        reference = reference or date.today().strftime("%d/%m/%Y")
        lines = ["DOCUMENTO FICTICIO EXCLUSIVO PARA TESTE UNITARIO",
                 "Certidão de Regularidade na Contratação de Aprendizes", f"CNPJ: {cnpj}"]
        if status == "desobrigado":
            lines += ["O empregador está DESOBRIGADO de contratar aprendizes.", f"Data de processamento: {reference}"]
        else:
            lines += [f"O empregador empregava, em {reference}, aprendizes em número {status} ao percentual mínimo."]
        lines += [f"Certidão emitida em {date.today():%d/%m/%Y}.", f"Código de verificação: {code}", extra]
        writer = PdfWriter()
        page = writer.add_blank_page(width=595, height=842)
        font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'),
                                 NameObject('/BaseFont'): NameObject('/Helvetica'), NameObject('/Encoding'): NameObject('/WinAnsiEncoding')})
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
        commands = ["BT /F1 9 Tf 40 780 Td 14 TL"]
        for line in lines:
            escaped = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
            commands.append(f"({escaped}) Tj T*")
        commands.append("ET")
        stream = DecodedStreamObject()
        stream.set_data("\n".join(commands).encode('cp1252'))
        page[NameObject('/Contents')] = writer._add_object(stream)
        output = io.BytesIO()
        writer.write(output)
        return output.getvalue()
    return make
