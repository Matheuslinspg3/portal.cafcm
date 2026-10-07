from __future__ import annotations

import os
import queue
import subprocess
import threading
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from . import __version__
from .domain import format_cnpj, load_input
from .engine import Engine
from .store import Store, WorkspaceLock


STATE_LABELS = {"pending": "Não consultado", "running": "Consultando", "blocked": "Verificação necessária",
                "done": "Documento conferido", "review": "Revisar documento", "error": "Falha na consulta"}


class App:
    def __init__(self, root: tk.Tk, workspace: Path, initial_input: Path | None = None,
                 auto_run: bool = False):
        self.root = root
        self.lock = WorkspaceLock(workspace)
        self.store = Store(workspace)
        self.store.recover_interrupted()
        self.stop = threading.Event()
        self.commands: queue.Queue = queue.Queue()
        self.events: queue.Queue = queue.Queue()
        self.busy = False
        self.closing = False
        self.worker = threading.Thread(target=self._work, daemon=True)
        self.message = tk.StringVar(value="Importe a base ou inicie a fila carregada.")
        self.progress_text = tk.StringVar()
        self.positive_only = tk.BooleanVar(value=True)
        self._build_ui()
        self.worker.start()
        root.protocol("WM_DELETE_WINDOW", self.close)
        if not self.store.stats()["total"] and initial_input and initial_input.is_file():
            self.import_path(initial_input, automatic=True)
        self.refresh()
        self.root.after(250, self.poll)
        if auto_run:
            self.root.after(1500, lambda: self.start_run(None, resume=True))

    def _build_ui(self):
        self.root.title(f"CAFCM | Certidões de aprendizagem {__version__}")
        self.root.geometry("1160x780")
        self.root.minsize(980, 720)
        self.root.configure(bg="#f3f5f8")
        style = ttk.Style(self.root)
        style.theme_use("clam")
        style.configure("TFrame", background="#f3f5f8")
        style.configure("TLabel", background="#f3f5f8", foreground="#23344a", font=("Segoe UI", 10))
        style.configure("TButton", font=("Segoe UI", 10), padding=(11, 8))
        style.configure("Accent.TButton", background="#173f73", foreground="white")
        style.map("Accent.TButton", background=[("active", "#22568f"), ("disabled", "#b3c4d8")])
        style.configure("Treeview", font=("Segoe UI", 10), rowheight=29, background="white", fieldbackground="white")
        style.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"), padding=8)
        style.configure("Horizontal.TProgressbar", background="#ee9828", troughcolor="#dce3eb")
        header = tk.Frame(self.root, bg="#173f73", height=105)
        header.pack(fill="x")
        tk.Label(header, text="CAFCM", font=("Segoe UI", 24, "bold"), fg="white", bg="#173f73").pack(anchor="w", padx=24, pady=(17, 0))
        tk.Label(header, text="Certidões de aprendizagem · coleta e conferência por CNPJ", font=("Segoe UI", 12),
                 fg="#deebf7", bg="#173f73").pack(anchor="w", padx=24, pady=(0, 17))
        container = ttk.Frame(self.root, padding=20)
        container.pack(fill="both", expand=True)
        stats = ttk.Frame(container)
        stats.pack(fill="x", pady=(0, 16))
        self.stat_labels = {}
        for index, (key, label) in enumerate([("total", "CNPJs na fila"), ("documents", "PDFs obtidos"),
                                           ("below_quota", "Inferior nos PDFs"), ("pending", "Pendentes"),
                                           ("blocked", "Verificação necessária")]):
            stats.columnconfigure(index, weight=1)
            tile = tk.Frame(stats, bg="white", highlightbackground="#dde4ed", highlightthickness=1)
            tile.grid(row=0, column=index, sticky="ew", padx=(0, 10 if index < 4 else 0))
            value = tk.Label(tile, text="0", font=("Segoe UI", 23, "bold"), bg="white", fg="#173f73")
            value.pack(anchor="w", padx=14, pady=(11, 0))
            tk.Label(tile, text=label, font=("Segoe UI", 9), bg="white", fg="#54677d").pack(anchor="w", padx=14, pady=(0, 12))
            self.stat_labels[key] = value
        controls = ttk.Frame(container)
        controls.pack(fill="x")
        self.import_button = ttk.Button(controls, text="Importar CSV/JSON", command=self.import_file)
        self.import_button.pack(side="left", padx=(0, 8))
        self.pilot_button = ttk.Button(controls, text="Testar 5 CNPJs", command=lambda: self.start_run(5, resume=True))
        self.pilot_button.pack(side="left", padx=(0, 8))
        self.run_button = ttk.Button(controls, text="Executar fila", style="Accent.TButton", command=lambda: self.start_run(None, resume=True))
        self.run_button.pack(side="left", padx=(0, 8))
        self.resume_button = ttk.Button(controls, text="Retomar", command=lambda: self.start_run(None, resume=True))
        self.resume_button.pack(side="left", padx=(0, 8))
        self.pause_button = ttk.Button(controls, text="Pausar", command=self.pause)
        self.pause_button.pack(side="left")
        other = ttk.Frame(container)
        other.pack(fill="x", pady=(9, 8))
        self.retry_button = ttk.Button(other, text="Repetir falhas", command=self.retry_failed)
        self.retry_button.pack(side="left", padx=(0, 8))
        self.stale_button = ttk.Button(other, text="Atualizar antigas", command=self.update_stale)
        self.stale_button.pack(side="left", padx=(0, 8))
        self.export_button = ttk.Button(other, text="Exportar resultados e PDFs", command=self.export)
        self.export_button.pack(side="left", padx=(0, 8))
        ttk.Button(other, text="Abrir pasta", command=self.open_workspace).pack(side="left")
        ttk.Checkbutton(container, text="Ao importar, selecionar somente indicações antigas “Faltam N aprendizes” com N positivo",
                        variable=self.positive_only).pack(anchor="w", pady=(0, 12))
        ttk.Label(container, textvariable=self.message, wraplength=1060, font=("Segoe UI", 10, "bold")).pack(anchor="w", fill="x")
        self.progress = ttk.Progressbar(container, mode="determinate")
        self.progress.pack(fill="x", pady=(10, 4))
        ttk.Label(container, textvariable=self.progress_text).pack(anchor="w", pady=(0, 12))
        table_frame = ttk.Frame(container)
        table_frame.pack(fill="both", expand=True)
        columns = ("cnpj", "empresa", "antigo", "estado", "cota")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", selectmode="browse")
        for name, title, width in [("cnpj", "CNPJ completo", 163), ("empresa", "Empresa", 390),
                                   ("antigo", "Déficit anterior", 113), ("estado", "Consulta", 185), ("cota", "Situação do PDF", 130)]:
            self.tree.heading(name, text=title)
            self.tree.column(name, width=width, stretch=name in {"empresa", "estado"})
        scroll = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")
        for state, color in [("done", "#edf7ef"), ("blocked", "#fff0d6"), ("review", "#fff7e6"), ("error", "#fceced")]:
            self.tree.tag_configure(state, background=color)
        self.tree.bind("<Double-1>", self.open_document)
        ttk.Label(container, text="Duplo clique abre o PDF. A indicação antiga não comprova a situação atual.\n"
                  "O site pode exigir sua verificação; a fila pausa nesse caso. Nenhum e-mail é enviado.",
                  foreground="#566a80", font=("Segoe UI", 9)).pack(anchor="w", pady=(12, 0))

    def _work(self):
        engine = Engine(self.store, self.stop, lambda kind, message: self.events.put((kind, message)))
        try:
            while True:
                command = self.commands.get()
                if command[0] == "close":
                    break
                try:
                    engine.run(limit=command[1], resume=command[2])
                except Exception:
                    self.events.put(("error", "A execução foi interrompida. Os resultados anteriores estão preservados."))
                finally:
                    self.events.put(("idle", ""))
        finally:
            try:
                engine.close()
            finally:
                self.events.put(("closed", ""))

    def refresh(self):
        import json
        stats = self.store.stats()
        for key, label in self.stat_labels.items():
            label.configure(text=str(stats[key]))
        completed = stats["done"] + stats["review"]
        self.progress.configure(maximum=max(stats["total"], 1), value=completed)
        self.progress_text.set(f"{completed} de {stats['total']} CNPJs com PDF conferido ou para revisão · {stats['contacts']} contatos · {stats['error']} falhas")
        self.jobs = {row["cnpj"]: row for row in self.store.list_jobs()}
        for row in self.jobs.values():
            cert = json.loads(row["certificate_json"] or "{}")
            values = (format_cnpj(row["cnpj"]), row["name"], row["previous_deficit"] if row["previous_deficit"] is not None else "",
                      STATE_LABELS[row["state"]], cert.get("quota_status", ""))
            if self.tree.exists(row["cnpj"]):
                self.tree.item(row["cnpj"], values=values, tags=(row["state"],))
            else:
                self.tree.insert("", "end", iid=row["cnpj"], values=values, tags=(row["state"],))
        for button in [self.import_button, self.pilot_button, self.run_button, self.resume_button,
                       self.retry_button, self.stale_button, self.export_button]:
            button.configure(state="disabled" if self.busy or self.closing else "normal")
        self.pause_button.configure(state="normal" if self.busy and not self.closing else "disabled")

    def poll(self):
        refresh = False
        while True:
            try:
                kind, message = self.events.get_nowait()
            except queue.Empty:
                break
            if kind == "closed":
                self.lock.close()
                self.root.destroy()
                return
            if kind == "idle":
                self.busy = False
            if message:
                self.message.set(message)
            refresh = True
        if refresh:
            self.refresh()
        self.root.after(250, self.poll)

    def start_run(self, limit: int | None, resume: bool):
        if self.busy or self.closing:
            return
        if not self.store.stats()["total"]:
            self.message.set("Importe uma base antes de iniciar.")
            return
        self.busy = True
        self.stop.clear()
        self.message.set("Abrindo o Chrome para iniciar a coleta…")
        self.commands.put(("run", limit, resume))
        self.refresh()

    def pause(self):
        self.stop.set()
        self.message.set("Pausando… o documento em conclusão será preservado.")

    def import_file(self):
        path = filedialog.askopenfilename(title="Selecionar base", filetypes=[("Base de CNPJs", "*.csv *.json"), ("Todos", "*.*")])
        if path:
            self.import_path(Path(path))

    def import_path(self, path: Path, automatic: bool = False):
        try:
            data = load_input(path, positive_only=self.positive_only.get())
            if not data.companies:
                raise ValueError("Nenhum CNPJ elegível encontrado. Confira a seleção de indicação antiga.")
            self.store.import_data(data)
            self.message.set(f"Base carregada: {len(data.companies)} CNPJs · {data.skipped} registros fora da seleção · {len(data.problems)} problemas.")
            if data.problems:
                messagebox.showwarning("Revisar base", "\n".join(data.problems[:12]), parent=self.root)
        except Exception as error:
            self.message.set(f"Não foi possível importar: {error}")
            if not automatic:
                messagebox.showerror("Importação", str(error), parent=self.root)
        self.refresh()

    def retry_failed(self):
        for row in self.store.list_jobs():
            if row["state"] == "error":
                self.store.mark(row["cnpj"], "pending", "Falha liberada para nova tentativa pelo usuário.")
        self.message.set("Falhas devolvidas à fila. Use Executar fila para iniciar.")
        self.refresh()

    def update_stale(self):
        count = self.store.queue_stale()
        self.message.set(f"{count} certidões com referência há mais de 7 dias voltaram à fila.")
        self.refresh()

    def export(self):
        name = f"CAFCM_certidoes_resultados_{datetime.now():%Y%m%d_%H%M%S}.zip"
        path = filedialog.asksaveasfilename(title="Exportar resultados e PDFs", defaultextension=".zip", initialfile=name,
                                          filetypes=[("Pacote ZIP", "*.zip")])
        if not path:
            return
        try:
            summary = self.store.export(Path(path))
            self.message.set(f"Pacote exportado: {summary['cnpjs_com_deficit_confirmado_na_janela']} CNPJs com déficit confirmado na janela de 7 dias.")
        except Exception:
            messagebox.showerror("Exportação", "Não foi possível gravar o pacote. Confira a pasta de destino e os PDFs.", parent=self.root)

    def open_workspace(self):
        open_local(self.store.workspace)

    def open_document(self, _event=None):
        import json
        selection = self.tree.selection()
        if not selection:
            return
        cert = json.loads(self.jobs[selection[0]]["certificate_json"] or "{}")
        if cert.get("pdf_path"):
            path = self.store.workspace / cert["pdf_path"]
            if path.is_file():
                open_local(path)

    def close(self):
        if not self.closing:
            self.closing = True
            self.stop.set()
            self.commands.put(("close",))
            self.message.set("Fechando o navegador e preservando a fila…")
            self.refresh()


def open_local(path: Path):
    if os.name == "nt":
        os.startfile(str(path))
    else:
        subprocess.Popen(["xdg-open", str(path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
