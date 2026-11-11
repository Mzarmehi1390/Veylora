"""Main Veylora IDE window and editor workflow."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PyQt6.QtCore import QDir, QProcess, Qt
from PyQt6.QtGui import QAction, QKeySequence
from PyQt6.QtWidgets import (
    QFileDialog, QFileSystemModel, QLabel, QMainWindow, QMessageBox,
    QPlainTextEdit, QSplitter, QTabWidget, QTreeView, QVBoxLayout, QWidget,
)

from veylora.editor.code_editor import CodeEditor
from veylora.editor.highlighting import LanguageHighlighter


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Veylora IDE")
        self.resize(1440, 900)
        self.workspace = Path.cwd()
        self._build_ui()
        self._build_menus()
        self.new_file()
        self._apply_theme()

    def _build_ui(self) -> None:
        root = QSplitter(Qt.Orientation.Horizontal)
        self.setCentralWidget(root)

        self.file_model = QFileSystemModel(self)
        self.file_model.setRootPath(QDir.rootPath())
        self.file_tree = QTreeView()
        self.file_tree.setModel(self.file_model)
        self.file_tree.setRootIndex(self.file_model.index(str(self.workspace)))
        for column in range(1, self.file_model.columnCount()):
            self.file_tree.hideColumn(column)
        self.file_tree.doubleClicked.connect(self._open_tree_item)
        root.addWidget(self.file_tree)

        right = QSplitter(Qt.Orientation.Vertical)
        root.addWidget(right)
        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.currentChanged.connect(self._refresh_status)
        right.addWidget(self.tabs)

        terminal_panel = QWidget()
        terminal_layout = QVBoxLayout(terminal_panel)
        terminal_layout.setContentsMargins(8, 8, 8, 8)
        terminal_layout.addWidget(QLabel("OUTPUT"))
        self.output = QPlainTextEdit()
        self.output.setReadOnly(True)
        self.output.setMaximumBlockCount(5000)
        terminal_layout.addWidget(self.output)
        right.addWidget(terminal_panel)
        root.setSizes([280, 1160])
        right.setSizes([650, 220])

        self.status = self.statusBar()
        self.cursor_status = QLabel("Ln 1, Col 1")
        self.language_status = QLabel("Plain Text")
        self.status.addPermanentWidget(self.cursor_status)
        self.status.addPermanentWidget(self.language_status)

    def _build_menus(self) -> None:
        file_menu = self.menuBar().addMenu("&File")
        self._action(file_menu, "&New", QKeySequence.StandardKey.New, self.new_file)
        self._action(file_menu, "&Open…", QKeySequence.StandardKey.Open, self.open_file)
        self._action(file_menu, "&Save", QKeySequence.StandardKey.Save, self.save_file)
        file_menu.addSeparator()
        self._action(file_menu, "Save &As…", QKeySequence.StandardKey.SaveAs, self.save_file_as)

        run_menu = self.menuBar().addMenu("&Run")
        self._action(run_menu, "Run Python File", QKeySequence("F5"), self.run_file)

    def _action(self, menu, title: str, shortcut, callback) -> None:
        action = QAction(title, self)
        action.setShortcut(shortcut)
        action.triggered.connect(callback)
        menu.addAction(action)

    def _apply_theme(self) -> None:
        self.setStyleSheet("""
            QMainWindow, QWidget { background: #17191f; color: #d7dae0; }
            QTreeView, QPlainTextEdit { background: #1e2129; color: #d7dae0; border: 0; }
            QTabWidget::pane { border: 0; }
            QTabBar::tab { background: #222630; color: #aeb4c0; padding: 9px 16px; }
            QTabBar::tab:selected { background: #303746; color: white; border-top: 2px solid #6ca6f7; }
            QMenuBar, QMenu { background: #20242d; color: #e3e6ec; }
            QMenu::item:selected { background: #365a87; }
            QStatusBar { background: #242a35; }
        """)

    def _current_editor(self) -> CodeEditor | None:
        widget = self.tabs.currentWidget()
        return widget if isinstance(widget, CodeEditor) else None

    def _configure_editor(self, editor: CodeEditor, path: str | None) -> None:
        suffix = Path(path).suffix.lower() if path else ""
        language = {
            ".py": "python", ".js": "javascript", ".mjs": "javascript",
            ".md": "markdown", ".markdown": "markdown",
        }.get(suffix, "text")
        editor.highlighter = LanguageHighlighter(editor.document(), language)
        self.language_status.setText(language.title() if language != "text" else "Plain Text")
        editor.cursorPositionChanged.connect(self._refresh_status)
        editor.textChanged.connect(lambda e=editor: self._mark_dirty(e))

    def _mark_dirty(self, editor: CodeEditor) -> None:
        index = self.tabs.indexOf(editor)
        if index >= 0:
            label = self.tabs.tabText(index).removesuffix(" •")
            if not label.endswith(" •"):
                self.tabs.setTabText(index, label + " •")

    def new_file(self) -> None:
        editor = CodeEditor()
        self._configure_editor(editor, None)
        index = self.tabs.addTab(editor, "Untitled")
        self.tabs.setCurrentIndex(index)

    def open_file(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Open File", str(self.workspace))
        if path:
            self._load_file(path)

    def _open_tree_item(self, index) -> None:
        path = self.file_model.filePath(index)
        if os.path.isfile(path):
            self._load_file(path)

    def _load_file(self, path: str) -> None:
        try:
            content = Path(path).read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            QMessageBox.critical(self, "Unable to open file", str(exc))
            return
        for index in range(self.tabs.count()):
            existing = self.tabs.widget(index)
            if isinstance(existing, CodeEditor) and existing.file_path == path:
                self.tabs.setCurrentIndex(index)
                return
        editor = CodeEditor()
        editor.file_path = path
        self._configure_editor(editor, path)
        editor.setPlainText(content)
        editor.document().setModified(False)
        index = self.tabs.addTab(editor, Path(path).name)
        self.tabs.setCurrentIndex(index)

    def save_file(self) -> None:
        editor = self._current_editor()
        if editor is None:
            return
        if not editor.file_path:
            self.save_file_as()
            return
        self._write_editor(editor, editor.file_path)

    def save_file_as(self) -> None:
        editor = self._current_editor()
        if editor is None:
            return
        path, _ = QFileDialog.getSaveFileName(self, "Save File", str(self.workspace))
        if path:
            editor.file_path = path
            self._configure_editor(editor, path)
            self._write_editor(editor, path)

    def _write_editor(self, editor: CodeEditor, path: str) -> None:
        try:
            Path(path).write_text(editor.toPlainText(), encoding="utf-8", newline="")
        except OSError as exc:
            QMessageBox.critical(self, "Unable to save file", str(exc))
            return
        editor.document().setModified(False)
        index = self.tabs.indexOf(editor)
        if index >= 0:
            self.tabs.setTabText(index, Path(path).name)
        self.status.showMessage(f"Saved {path}", 3000)

    def close_tab(self, index: int) -> None:
        editor = self.tabs.widget(index)
        if isinstance(editor, CodeEditor) and editor.document().isModified():
            answer = QMessageBox.question(
                self, "Unsaved changes", f"Save changes to {self.tabs.tabText(index)}?",
                QMessageBox.StandardButton.Save | QMessageBox.StandardButton.Discard |
                QMessageBox.StandardButton.Cancel,
            )
            if answer == QMessageBox.StandardButton.Cancel:
                return
            if answer == QMessageBox.StandardButton.Save:
                self.tabs.setCurrentIndex(index)
                self.save_file()
                if editor.document().isModified():
                    return
        self.tabs.removeTab(index)
        editor.deleteLater()
        if self.tabs.count() == 0:
            self.new_file()

    def _refresh_status(self, _index: int = 0) -> None:
        editor = self._current_editor()
        if editor is None:
            return
        cursor = editor.textCursor()
        self.cursor_status.setText(
            f"Ln {cursor.blockNumber() + 1}, Col {cursor.positionInBlock() + 1}"
        )

    def run_file(self) -> None:
        editor = self._current_editor()
        if editor is None:
            return
        if not editor.file_path:
            self.save_file()
        if not editor.file_path:
            return
        if Path(editor.file_path).suffix.lower() != ".py":
            self.status.showMessage("Run currently supports Python files.", 4000)
            return
        self.output.appendPlainText(f"\n$ {sys.executable} {editor.file_path}")
        process = QProcess(self)
        process.setWorkingDirectory(str(Path(editor.file_path).parent))
        process.readyReadStandardOutput.connect(
            lambda p=process: self.output.insertPlainText(bytes(p.readAllStandardOutput()).decode(errors="replace"))
        )
        process.readyReadStandardError.connect(
            lambda p=process: self.output.insertPlainText(bytes(p.readAllStandardError()).decode(errors="replace"))
        )
        process.finished.connect(lambda *_args, p=process: p.deleteLater())
        process.start(sys.executable, [editor.file_path])

    def closeEvent(self, event) -> None:
        for index in range(self.tabs.count() - 1, -1, -1):
            editor = self.tabs.widget(index)
            if isinstance(editor, CodeEditor) and editor.document().isModified():
                self.tabs.setCurrentIndex(index)
                answer = QMessageBox.question(
                    self, "Unsaved changes", f"Save changes to {self.tabs.tabText(index)}?",
                    QMessageBox.StandardButton.Save | QMessageBox.StandardButton.Discard |
                    QMessageBox.StandardButton.Cancel,
                )
                if answer == QMessageBox.StandardButton.Cancel:
                    event.ignore()
                    return
                if answer == QMessageBox.StandardButton.Save:
                    self.save_file()
                    if editor.document().isModified():
                        event.ignore()
                        return
        event.accept()
