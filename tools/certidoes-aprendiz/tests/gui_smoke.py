"""Desktop construction check on a Windows runner, with no browser or portal access."""
import tempfile
import tkinter as tk
from pathlib import Path

from cafcm_certidoes.gui import App

with tempfile.TemporaryDirectory() as folder:
    root = tk.Tk()
    root.withdraw()
    app = App(root, Path(folder))
    root.update_idletasks()
    assert app.run_button.cget('text') == 'Executar fila'
    assert app.store.stats()['documents'] == 0
    assert len(app.tree.get_children()) == 0
    app.close()
    root.mainloop()
