"""Regression tests for PyQt6 API imports."""

import ast
from pathlib import Path


def test_file_system_model_is_imported_from_qtgui() -> None:
    source = Path("veylora/ui/main_window.py").read_text(encoding="utf-8")
    module = ast.parse(source)

    imports = {
        alias.name: node.module
        for node in ast.walk(module)
        if isinstance(node, ast.ImportFrom)
        for alias in node.names
    }

    assert imports.get("QFileSystemModel") == "PyQt6.QtGui"
