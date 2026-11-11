"""Application bootstrap and process-level configuration."""

from __future__ import annotations

import sys

from PyQt6.QtWidgets import QApplication

from veylora.ui.main_window import MainWindow


def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("Veylora IDE")
    app.setOrganizationName("Veylora")
    app.setStyle("Fusion")

    window = MainWindow()
    window.show()
    return app.exec()
