import sys
import os
import re
import subprocess
from PyQt6.QtCore import Qt, QRect, QSize, QProcess, QModelIndex, QStringListModel
from PyQt6.QtGui import (
    QColor, QFont, QPainter, QTextFormat, QSyntaxHighlighter, 
    QTextCharFormat, QAction, QKeySequence, QTextCursor, QFileSystemModel
)
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QTextEdit, QWidget, QVBoxLayout, 
    QHBoxLayout, QTabWidget, QFileDialog, QMessageBox, QStatusBar, 
    QMenuBar, QMenu, QPlainTextEdit, QSplitter, QPushButton, QLineEdit, 
    QLabel, QTreeView, QCompleter, QListWidget, QListWidgetItem, QTextBrowser
)

# ----------------- بانک کلمات کلیدی -----------------
PYTHON_KEYWORDS = [
    'and', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
    'del', 'elif', 'else', 'except', 'exec', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass',
    'print', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True',
    'False', 'None', 'self', '__init__', 'range', 'len', 'str', 'int', 'list', 'dict'
]

JS_KEYWORDS = [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally',
    'for', 'function', 'if', 'import', 'in', 'let', 'new', 'null', 'return',
    'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'while'
]

HTML_KEYWORDS = ['html', 'head', 'body', 'title', 'div', 'span', 'h1', 'h2', 'h3', 'p', 'a', 'img', 'ul', 'li', 'form', 'input', 'button', 'script', 'style']
CSS_KEYWORDS = ['align-items', 'background', 'border', 'color', 'display', 'flex', 'font-size', 'height', 'margin', 'padding', 'width']


# ----------------- هایلایت‌کننده‌ها -----------------
class MarkdownHighlighter(QSyntaxHighlighter):
    def __init__(self, document):
        super().__init__(document)
        self.rules = []
        header_fmt = QTextCharFormat()
        header_fmt.setForeground(QColor("#569cd6"))
        header_fmt.setFontWeight(QFont.Weight.Bold)
        self.rules.append((re.compile(r"^#.*"), header_fmt))

        bold_fmt = QTextCharFormat()
        bold_fmt.setFontWeight(QFont.Weight.Bold)
        bold_fmt.setForeground(QColor("#4ec9b0"))
        self.rules.append((re.compile(r"\*\*.*?\*\*"), bold_fmt))

        code_fmt = QTextCharFormat()
        code_fmt.setForeground(QColor("#d7ba7d"))
        self.rules.append((re.compile(r"`.*?`"), code_fmt))

    def highlightBlock(self, text):
        for pattern, fmt in self.rules:
            for match in pattern.finditer(text):
                start, end = match.span()
                self.setFormat(start, end - start, fmt)


class PythonHighlighter(QSyntaxHighlighter):
    def __init__(self, document):
        super().__init__(document)
        self.rules = []
        kw_fmt = QTextCharFormat()
        kw_fmt.setForeground(QColor("#569cd6"))
        kw_fmt.setFontWeight(QFont.Weight.Bold)
        for w in PYTHON_KEYWORDS:
            self.rules.append((re.compile(f"\\b{w}\\b"), kw_fmt))

        str_fmt = QTextCharFormat()
        str_fmt.setForeground(QColor("#ce9178"))
        self.rules.append((re.compile(r"\".*?\""), str_fmt))
        self.rules.append((re.compile(r"'.*?'"), str_fmt))

        comm_fmt = QTextCharFormat()
        comm_fmt.setForeground(QColor("#6a9955"))
        comm_fmt.setFontItalic(True)
        self.rules.append((re.compile(r"#.*"), comm_fmt))

    def highlightBlock(self, text):
        for pattern, fmt in self.rules:
            for match in pattern.finditer(text):
                start, end = match.span()
                self.setFormat(start, end - start, fmt)


class JavaScriptHighlighter(QSyntaxHighlighter):
    def __init__(self, document):
        super().__init__(document)
        self.rules = []
        kw_fmt = QTextCharFormat()
        kw_fmt.setForeground(QColor("#569cd6"))
        kw_fmt.setFontWeight(QFont.Weight.Bold)
        for w in JS_KEYWORDS:
            self.rules.append((re.compile(f"\\b{w}\\b"), kw_fmt))

        str_fmt = QTextCharFormat()
        str_fmt.setForeground(QColor("#ce9178"))
        self.rules.append((re.compile(r"\".*?\""), str_fmt))
        self.rules.append((re.compile(r"'.*?'"), str_fmt))

        comm_fmt = QTextCharFormat()
        comm_fmt.setForeground(QColor("#6a9955"))
        comm_fmt.setFontItalic(True)
        self.rules.append((re.compile(r"//.*"), comm_fmt))

    def highlightBlock(self, text):
        for pattern, fmt in self.rules:
            for match in pattern.finditer(text):
                start, end = match.span()
                self.setFormat(start, end - start, fmt)


# ----------------- پنل کنترل نسخه (Source Control Panel) -----------------
class SourceControlPanel(QWidget):
    def __init__(self, repo_path, parent=None):
        super().__init__(parent)
        self.repo_path = repo_path
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(5, 5, 5, 5)

        layout.addWidget(QLabel("<b>SOURCE CONTROL (GIT)</b>"))
        
        # فیلد پیام کامیت
        self.commit_input = QLineEdit()
        self.commit_input.setPlaceholderText("Message (Ctrl+Enter to commit)")
        layout.addWidget(self.commit_input)

        # دکمه کامیت
        self.commit_btn = QPushButton("Commit")
        self.commit_btn.clicked.connect(self.do_commit)
        layout.addWidget(self.commit_btn)

        # فهرست فایل‌های تغییریافته
        layout.addWidget(QLabel("Changes:"))
        self.changes_list = QListWidget()
        self.changes_list.setStyleSheet("background-color: #1e1e24; color: #d4d4d4; border: 1px solid #333;")
        layout.addWidget(self.changes_list)

        # دکمه رفرش وضعیت
        refresh_btn = QPushButton("Refresh Status")
        refresh_btn.clicked.connect(self.refresh_status)
        layout.addWidget(refresh_btn)

        self.refresh_status()

    def refresh_status(self):
        self.changes_list.clear()
        try:
            res = subprocess.run(
                ["git", "-C", self.repo_path, "status", "--porcelain"],
                capture_output=True, text=True, check=True
            )
            for line in res.stdout.splitlines():
                if len(line) >= 3:
                    status = line[:2].strip()
                    filepath = line[3:].strip()
                    item = QListWidgetItem(f"[{status}] {filepath}")
                    item.setData(Qt.ItemDataRole.UserRole, filepath)
                    self.changes_list.addItem(item)
        except Exception:
            pass

    def do_commit(self):
        msg = self.commit_input.text().strip()
        if not msg:
            QMessageBox.warning(self, "Warning", "Please enter a commit message.")
            return
        try:
            # Stage all changes
            subprocess.run(["git", "-C", self.repo_path, "add", "."], check=True)
            # Commit
            subprocess.run(["git", "-C", self.repo_path, "commit", "-m", msg], check=True)
            self.commit_input.clear()
            self.refresh_status()
            QMessageBox.information(self, "Success", "Changes committed successfully!")
        except Exception as e:
            QMessageBox.critical(self, "Git Error", str(e))


# ----------------- شماره‌گذار خطوط -----------------
class LineNumberArea(QWidget):
    def __init__(self, editor):
        super().__init__(editor)
        self.code_editor = editor

    def sizeHint(self):
        return QSize(self.code_editor.line_number_area_width(), 0)

    def paintEvent(self, event):
        self.code_editor.line_number_area_paint_event(event)


# ----------------- ویرایشگر متن حرفه‌ای -----------------
class IntelliSenseEditor(QPlainTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.file_path = None
        self.setFont(QFont("JetBrains Mono", 11))
        
        self.line_number_area = LineNumberArea(self)
        self.blockCountChanged.connect(self.update_line_number_area_width)
        self.updateRequest.connect(self.update_line_number_area)
        self.cursorPositionChanged.connect(self.highlight_current_line)

        self.update_line_number_area_width(0)
        self.highlight_current_line()

        self.completer = QCompleter(self)
        self.completer.setWidget(self)
        self.completer.setCompletionMode(QCompleter.CompletionMode.PopupCompletion)
        self.completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.completer.activated.connect(self.insert_completion)

        if self.completer.popup():
            self.completer.popup().setStyleSheet("""
                QAbstractItemView {
                    background-color: rgba(30, 30, 35, 0.95);
                    color: #d4d4d4;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    selection-background-color: #007acc;
                    selection-color: #ffffff;
                    padding: 4px;
                    font-family: 'JetBrains Mono';
                }
            """)

    def set_completer_words(self, words):
        model = QStringListModel(words, self.completer)
        self.completer.setModel(model)

    def insert_completion(self, completion):
        tc = self.textCursor()
        extra = len(completion) - len(self.completer.completionPrefix())
        tc.movePosition(QTextCursor.MoveOperation.Left)
        tc.movePosition(QTextCursor.MoveOperation.EndOfWord)
        tc.insertText(completion[-extra:])
        self.setTextCursor(tc)

    def text_under_cursor(self):
        tc = self.textCursor()
        tc.select(QTextCursor.SelectionType.WordUnderCursor)
        return tc.selectedText()

    def keyPressEvent(self, event):
        if self.completer and self.completer.popup().isVisible():
            if event.key() in (Qt.Key.Key_Enter, Qt.Key.Key_Return, Qt.Key.Key_Tab, Qt.Key.Key_Backtab):
                event.ignore()
                return

        pairs = {'(': ')', '[': ']', '{': '}', '"': '"', "'": "'"}
        key_text = event.text()
        if key_text in pairs:
            super().keyPressEvent(event)
            self.insertPlainText(pairs[key_text])
            tc = self.textCursor()
            tc.movePosition(QTextCursor.MoveOperation.Left)
            self.setTextCursor(tc)
            return

        super().keyPressEvent(event)

        prefix = self.text_under_cursor()
        if len(prefix) < 2:
            self.completer.popup().hide()
            return

        if prefix != self.completer.completionPrefix():
            self.completer.setCompletionPrefix(prefix)
            popup = self.completer.popup()
            popup.setCurrentIndex(self.completer.completionModel().index(0, 0))

        cr = self.cursorRect()
        cr.setWidth(self.completer.popup().sizeHintForColumn(0) + 25)
        self.completer.complete(cr)

    def line_number_area_width(self):
        digits = 1
        max_val = max(1, self.blockCount())
        while max_val >= 10:
            max_val //= 10
            digits += 1
        return 15 + self.fontMetrics().horizontalAdvance('9') * digits

    def update_line_number_area_width(self, _):
        self.setViewportMargins(self.line_number_area_width(), 0, 0, 0)

    def update_line_number_area(self, rect, dy):
        if dy:
            self.line_number_area.scroll(0, dy)
        else:
            self.line_number_area.update(0, rect.y(), self.line_number_area.width(), rect.height())
        if rect.contains(self.viewport().rect()):
            self.update_line_number_area_width(0)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        cr = self.contentsRect()
        self.line_number_area.setGeometry(QRect(cr.left(), cr.top(), self.line_number_area_width(), cr.height()))

    def highlight_current_line(self):
        extra_selections = []
        if not self.isReadOnly():
            selection = QTextEdit.ExtraSelection()
            selection.format.setBackground(QColor(40, 42, 54, 120))
            selection.format.setProperty(QTextFormat.Property.FullWidthSelection, True)
            selection.cursor = self.textCursor()
            selection.cursor.clearSelection()
            extra_selections.append(selection)
        self.setExtraSelections(extra_selections)

    def line_number_area_paint_event(self, event):
        painter = QPainter(self.line_number_area)
        painter.fillRect(event.rect(), QColor(25, 25, 30))

        block = self.firstVisibleBlock()
        block_number = block.blockNumber()
        top = int(self.blockBoundingGeometry(block).translated(self.contentOffset()).top())
        bottom = top + int(self.blockBoundingRect(block).height())

        while block.isValid() and top <= event.rect().bottom():
            if block.isVisible() and bottom >= event.rect().top():
                number = str(block_number + 1)
                painter.setPen(QColor(110, 115, 125))
                painter.setFont(QFont("JetBrains Mono", 10))
                painter.drawText(0, top, self.line_number_area.width() - 8, self.fontMetrics().height(),
                                 Qt.AlignmentFlag.AlignRight, number)
            block = block.next()
            top = bottom
            bottom = top + int(self.blockBoundingRect(block).height())
            block_number += 1


# ----------------- ترمینال مستقل -----------------
class TerminalSession(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        self.output_view = QPlainTextEdit()
        self.output_view.setReadOnly(True)
        self.output_view.setFont(QFont("JetBrains Mono", 10))
        self.output_view.setStyleSheet("background-color: rgba(10, 12, 16, 0.9); color: #4ec9b0; border: none;")
        layout.addWidget(self.output_view)

        self.process = QProcess(self)
        self.process.readyReadStandardOutput.connect(self.handle_stdout)
        self.process.readyReadStandardError.connect(self.handle_stderr)

    def run_command(self, cmd, args=[]):
        self.output_view.appendPlainText(f">>> Executing: {cmd} {' '.join(args)}\n" + "-"*40 + "\n")
        self.process.start(cmd, args)

    def handle_stdout(self):
        data = self.process.readAllStandardOutput().data().decode('utf-8', errors='ignore')
        self.output_view.insertPlainText(data)

    def handle_stderr(self):
        data = self.process.readAllStandardError().data().decode('utf-8', errors='ignore')
        self.output_view.insertPlainText(data)


# ----------------- پنجره اصلی استودیو -----------------
class VSCodeMainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("GlassCode Ultimate Studio - SCM & Git Enabled")
        self.resize(1450, 900)
        
        self.setStyleSheet("""
            QMainWindow { background-color: #121216; }
            QTreeView, QListWidget { background-color: rgba(25, 27, 35, 0.85); color: #d4d4d4; border: none; border-right: 1px solid rgba(255, 255, 255, 0.05); font-size: 10pt; }
            QTreeView::item:hover, QListWidget::item:hover { background-color: rgba(255, 255, 255, 0.05); }
            QTreeView::item:selected, QListWidget::item:selected { background-color: rgba(0, 122, 204, 0.3); color: #ffffff; }
            QTabWidget::pane { border: none; background: rgba(20, 22, 28, 0.5); }
            QTabBar::tab { background: rgba(30, 32, 42, 0.6); color: #969696; padding: 8px 18px; border-right: 1px solid rgba(255, 255, 255, 0.03); border-top: 2px solid transparent; }
            QTabBar::tab:selected { background: rgba(30, 32, 42, 0.95); color: #ffffff; border-top: 2px solid #007acc; }
            QPlainTextEdit { background-color: transparent; color: #d4d4d4; border: none; selection-background-color: #264f78; }
            QTextBrowser { background-color: #1e1e24; color: #e1e1e1; border-left: 1px solid rgba(255, 255, 255, 0.1); padding: 10px; }
            QMenuBar { background-color: rgba(20, 22, 28, 0.9); color: #cccccc; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
            QMenuBar::item { background: transparent; padding: 6px 12px; }
            QMenuBar::item:selected { background: rgba(255, 255, 255, 0.1); }
            QMenu { background-color: #1e1e24; color: #cccccc; border: 1px solid rgba(255, 255, 255, 0.1); }
            QMenu::item:selected { background-color: #007acc; color: #ffffff; }
            QStatusBar { background-color: #007acc; color: #ffffff; font-size: 9pt; }
            QWidget#BottomPanel { background-color: rgba(18, 20, 25, 0.9); border-top: 1px solid rgba(255, 255, 255, 0.05); }
        """)

        root_splitter = QSplitter(Qt.Orientation.Horizontal)
        self.setCentralWidget(root_splitter)

        current_dir = os.getcwd()

        # سایدبار تب‌بندی شده برای Explorer و Source Control
        sidebar_tabs = QTabWidget()
        sidebar_tabs.setTabPosition(QTabWidget.TabPosition.West)

        # 1. تب فایل‌اسپلورر
        self.file_model = QFileSystemModel()
        self.file_model.setRootPath(current_dir)
        self.file_tree = QTreeView()
        self.file_tree.setModel(self.file_model)
        self.file_tree.setRootIndex(self.file_model.index(current_dir))
        for i in range(1, self.file_model.columnCount()):
            self.file_tree.setColumnHidden(i, True)
        self.file_tree.doubleClicked.connect(self.open_file_from_tree)
        sidebar_tabs.addTab(self.file_tree, "📁")

        # 2. تب کنترل نسخه (Git SCM)
        self.scm_panel = SourceControlPanel(current_dir)
        sidebar_tabs.addTab(self.scm_panel, "🔀")

        root_splitter.addWidget(sidebar_tabs)

        right_splitter = QSplitter(Qt.Orientation.Vertical)
        root_splitter.addWidget(right_splitter)

        # Workspace
        self.workspace_splitter = QSplitter(Qt.Orientation.Horizontal)
        self.tab_widget = QTabWidget()
        self.tab_widget.setTabsClosable(True)
        self.tab_widget.tabCloseRequested.connect(self.close_tab)
        self.tab_widget.currentChanged.connect(self.on_tab_changed)
        self.workspace_splitter.addWidget(self.tab_widget)

        self.markdown_preview = QTextBrowser()
        self.markdown_preview.setOpenExternalLinks(True)
        self.markdown_preview.hide()
        self.workspace_splitter.addWidget(self.markdown_preview)

        right_splitter.addWidget(self.workspace_splitter)

        # Multi-Terminal
        bottom_panel = QWidget()
        bottom_panel.setObjectName("BottomPanel")
        bottom_layout = QVBoxLayout(bottom_panel)
        bottom_layout.setContentsMargins(10, 5, 10, 10)

        term_header = QHBoxLayout()
        term_header.addWidget(QLabel("TERMINALS:"))
        add_term_btn = QPushButton("+ New Terminal")
        add_term_btn.clicked.connect(self.add_terminal_tab)
        term_header.addWidget(add_term_btn)
        
        term_header.addStretch()
        bottom_layout.addLayout(term_header)

        self.terminal_tabs = QTabWidget()
        self.terminal_tabs.setTabsClosable(True)
        self.terminal_tabs.tabCloseRequested.connect(self.close_terminal_tab)
        bottom_layout.addWidget(self.terminal_tabs)

        right_splitter.addWidget(bottom_panel)
        root_splitter.setSizes([300, 1150])
        right_splitter.setSizes([620, 280])

        self.init_menu_bar()
        self.init_status_bar()
        self.new_file()
        self.add_terminal_tab()

    def init_menu_bar(self):
        menubar = self.menuBar()
        file_menu = menubar.addMenu("File")
        
        new_act = QAction("New File", self)
        new_act.setShortcut(QKeySequence.StandardKey.New)
        new_act.triggered.connect(self.new_file)
        file_menu.addAction(new_act)

        open_act = QAction("Open File...", self)
        open_act.setShortcut(QKeySequence.StandardKey.Open)
        open_act.triggered.connect(self.open_file_dialog)
        file_menu.addAction(open_act)

        save_act = QAction("Save", self)
        save_act.setShortcut(QKeySequence.StandardKey.Save)
        save_act.triggered.connect(self.save_file)
        file_menu.addAction(save_act)

        run_menu = menubar.addMenu("Run")
        run_act = QAction("Run in Active Terminal (F5)", self)
        run_act.setShortcut(QKeySequence("F5"))
        run_act.triggered.connect(self.run_script)
        run_menu.addAction(run_act)

    def init_status_bar(self):
        self.status_bar = self.statusBar()
        self.cursor_pos_label = QLabel("Ln 1, Col 1")
        self.lang_label = QLabel("Python")
        self.status_bar.addPermanentWidget(self.cursor_pos_label)
        self.status_bar.addPermanentWidget(QLabel(" | "))
        self.status_bar.addPermanentWidget(self.lang_label)

    def add_terminal_tab(self):
        term = TerminalSession()
        index = self.terminal_tabs.addTab(term, f"Terminal {self.terminal_tabs.count() + 1}")
        self.terminal_tabs.setCurrentIndex(index)

    def close_terminal_tab(self, index):
        if self.terminal_tabs.count() > 1:
            widget = self.terminal_tabs.widget(index)
            self.terminal_tabs.removeTab(index)
            widget.deleteLater()
        else:
            QMessageBox.warning(self, "Warning", "At least one terminal session must remain open.")

    def update_cursor_position(self):
        editor = self.tab_widget.currentWidget()
        if isinstance(editor, IntelliSenseEditor):
            cursor = editor.textCursor()
            line = cursor.blockNumber() + 1
            col = cursor.columnNumber() + 1
            self.cursor_pos_label.setText(f"Ln {line}, Col {col}")

    def update_markdown_preview(self):
        editor = self.tab_widget.currentWidget()
        if isinstance(editor, IntelliSenseEditor) and self.markdown_preview.isVisible():
            self.markdown_preview.setMarkdown(editor.toPlainText())

    def on_tab_changed(self, index):
        editor = self.tab_widget.widget(index)
        if isinstance(editor, IntelliSenseEditor):
            ext = os.path.splitext(editor.file_path)[1].lower() if editor.file_path else ''
            if ext in ['.md', '.markdown']:
                self.markdown_preview.show()
                self.update_markdown_preview()
            else:
                self.markdown_preview.hide()

    def configure_editor_lang(self, editor, file_path):
        ext = os.path.splitext(file_path)[1].lower() if file_path else '.py'
        if ext == '.py':
            editor.highlighter = PythonHighlighter(editor.document())
            editor.set_completer_words(PYTHON_KEYWORDS)
            self.lang_label.setText("Python")
        elif ext in ['.js', '.mjs']:
            editor.highlighter = JavaScriptHighlighter(editor.document())
            editor.set_completer_words(JS_KEYWORDS)
            self.lang_label.setText("JavaScript")
        elif ext in ['.md', '.markdown']:
            editor.highlighter = MarkdownHighlighter(editor.document())
            self.lang_label.setText("Markdown")
        elif ext == '.css':
            editor.set_completer_words(CSS_KEYWORDS)
            self.lang_label.setText("CSS")
        else:
            editor.set_completer_words(PYTHON_KEYWORDS)
            self.lang_label.setText("Plain Text")

    def new_file(self):
        editor = IntelliSenseEditor()
        editor.cursorPositionChanged.connect(self.update_cursor_position)
        editor.textChanged.connect(self.update_markdown_preview)
        self.configure_editor_lang(editor, None)
        index = self.tab_widget.addTab(editor, "Untitled-1")
        self.tab_widget.setCurrentIndex(index)

    def open_file_dialog(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Open File", "", "All Files (*.*)")
        if file_path:
            self.load_file_into_tab(file_path)

    def open_file_from_tree(self, index: QModelIndex):
        file_path = self.file_model.filePath(index)
        if os.path.isfile(file_path):
            self.load_file_into_tab(file_path)

    def load_file_into_tab(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            editor = IntelliSenseEditor()
            editor.cursorPositionChanged.connect(self.update_cursor_position)
            editor.textChanged.connect(self.update_markdown_preview)
            self.configure_editor_lang(editor, file_path)
            editor.setPlainText(content)
            editor.file_path = file_path
            
            index = self.tab_widget.addTab(editor, os.path.basename(file_path))
            self.tab_widget.setCurrentIndex(index)
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))

    def save_file(self):
        editor = self.tab_widget.currentWidget()
        if not editor or not isinstance(editor, IntelliSenseEditor):
            return
        if not editor.file_path:
            file_path, _ = QFileDialog.getSaveFileName(self, "Save File", "", "All Files (*.*)")
            if not file_path:
                return
            editor.file_path = file_path
            self.configure_editor_lang(editor, file_path)

        try:
            with open(editor.file_path, 'w', encoding='utf-8') as f:
                f.write(editor.toPlainText())
            self.tab_widget.setTabText(self.tab_widget.currentIndex(), os.path.basename(editor.file_path))
            # رفرش پنل کنترل نسخه بعد از ذخیره
            self.scm_panel.refresh_status()
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))

    def close_tab(self, index):
        widget = self.tab_widget.widget(index)
        self.tab_widget.removeTab(index)
        widget.deleteLater()

    def run_script(self):
        editor = self.tab_widget.currentWidget()
        if not editor or not isinstance(editor, IntelliSenseEditor):
            return
        if not editor.file_path:
            self.save_file()
            if not editor.file_path:
                return
        
        active_term = self.terminal_tabs.currentWidget()
        if isinstance(active_term, TerminalSession):
            active_term.run_command(sys.executable, [editor.file_path])


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = VSCodeMainWindow()
    window.show()
    sys.exit(app.exec())