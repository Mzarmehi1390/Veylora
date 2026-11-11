"""Lightweight, dependency-free syntax highlighting for common file types."""

from __future__ import annotations

import re

from PyQt6.QtGui import QColor, QFont, QSyntaxHighlighter, QTextCharFormat


def _format(color: str, *, bold: bool = False, italic: bool = False) -> QTextCharFormat:
    result = QTextCharFormat()
    result.setForeground(QColor(color))
    if bold:
        result.setFontWeight(QFont.Weight.Bold)
    if italic:
        result.setFontItalic(True)
    return result


class LanguageHighlighter(QSyntaxHighlighter):
    """Small regex highlighter; deliberately not a substitute for an LSP."""

    _KEYWORDS = {
        "python": "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield",
        "javascript": "async await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while",
    }

    def __init__(self, document, language: str) -> None:
        super().__init__(document)
        self.language = language
        self.rules: list[tuple[re.Pattern[str], QTextCharFormat]] = []
        self._build_rules()

    def _build_rules(self) -> None:
        keyword_format = _format("#569CD6", bold=True)
        string_format = _format("#CE9178")
        comment_format = _format("#6A9955", italic=True)
        number_format = _format("#B5CEA8")
        function_format = _format("#DCDCAA")

        keywords = self._KEYWORDS.get(self.language, "")
        if keywords:
            pattern = r"\b(?:" + "|".join(map(re.escape, keywords.split())) + r")\b"
            self.rules.append((re.compile(pattern), keyword_format))

        self.rules.extend([
            (re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\''), string_format),
            (re.compile(r"\b\d+(?:\.\d+)?\b"), number_format),
            (re.compile(r"\b[A-Za-z_]\w*(?=\s*\()"), function_format),
        ])

        comment_pattern = r"#.*" if self.language == "python" else r"//.*"
        if self.language in {"python", "javascript"}:
            self.rules.append((re.compile(comment_pattern), comment_format))

        if self.language == "markdown":
            self.rules = [
                (re.compile(r"^#{1,6}\s.*$"), _format("#569CD6", bold=True)),
                (re.compile(r"\*\*.+?\*\*"), _format("#4EC9B0", bold=True)),
                (re.compile(r"`[^`]+`"), _format("#D7BA7D")),
                (re.compile(r"^\s*>.*$"), _format("#6A9955", italic=True)),
            ]

    def highlightBlock(self, text: str) -> None:
        for pattern, text_format in self.rules:
            for match in pattern.finditer(text):
                self.setFormat(match.start(), match.end() - match.start(), text_format)
