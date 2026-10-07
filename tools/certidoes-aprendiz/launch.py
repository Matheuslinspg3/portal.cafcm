"""Windows bundle entry point and offline smoke check."""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path

from cafcm_certidoes import __version__


def main():
    parser = argparse.ArgumentParser(description="CAFCM: coleta de certidões de aprendizagem")
    parser.add_argument("--workspace", type=Path, help="Pasta dos dados, PDFs e perfil dedicado do Chrome")
    parser.add_argument("--input", type=Path, help="Base CSV ou fila JSON")
    parser.add_argument("--run-all", action="store_true", help="Iniciar a fila carregada ao abrir")
    parser.add_argument("--self-test", action="store_true", help="Verificar pacote offline, sem acessar o portal")
    args = parser.parse_args()
    if args.self_test:
        from playwright.sync_api import sync_playwright
        from cafcm_certidoes.domain import load_input, normalize_cnpj
        from cafcm_certidoes.store import Store, WorkspaceLock
        with tempfile.TemporaryDirectory() as temp:
            workspace = Path(temp)
            lock = WorkspaceLock(workspace)
            source = workspace / "base.json"
            source.write_text(json.dumps([{"cnpj": "02529330000102", "deficit_anterior": 69, "contatos": []}]))
            store = Store(workspace)
            store.import_data(load_input(source))
            assert store.stats()["total"] == 1 and store.stats()["documents"] == 0
            assert normalize_cnpj("02.529.330/0001-02") == "02529330000102"
            store.export(workspace / "resultados.zip")
            with sync_playwright():
                pass  # Starts the bundled driver, but does not open a browser or access any site.
            lock.close()
        return 0
    import tkinter as tk
    from tkinter import messagebox
    from cafcm_certidoes.gui import App
    root = tk.Tk()
    base = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
    workspace = args.workspace or base / "dados"
    initial = args.input or base / "base_cnpjs_deficit.csv"
    try:
        app = App(root, workspace, initial, args.run_all)
    except Exception as error:
        root.withdraw()
        messagebox.showerror("CAFCM", str(error), parent=root)
        root.destroy()
        return 1
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
