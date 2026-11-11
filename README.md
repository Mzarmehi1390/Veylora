# Veylora IDE

**Code Beyond Limits.**

Veylora is an experimental desktop IDE built with Python and PyQt6. The project is being evolved from a single-file prototype into a modular application with clear boundaries and automated quality checks.

## Current capabilities

- Multi-tab editing with line numbers and current-line highlighting
- Basic Python, JavaScript, and Markdown syntax highlighting
- Automatic bracket and quote pairing
- Workspace file explorer
- Save, Save As, and unsaved-change protection
- Run the active Python file and view process output
- Dark desktop theme

This is an early-stage IDE, not yet a feature-complete replacement for Visual Studio Code. Language Server Protocol support, debugging, extension APIs, a full terminal emulator, and advanced source control are planned areas of development.

## Requirements

- Python 3.10+
- PyQt6 6.6+

## Run

```bash
python -m venv .venv
# Activate the environment, then:
python -m pip install -r requirements.txt
python -m veylora
```

The backward-compatible launcher is also available with `python main.py`.

## Development checks

```bash
python -m compileall -q main.py veylora tests
ruff check .
pytest
```

## Architecture

```text
veylora/
  app.py                 Application bootstrap
  editor/
    code_editor.py       Editing widget and line-number gutter
    highlighting.py      Lightweight language highlighting
  services/              Application services
  ui/
    main_window.py       Main window and user workflows
tests/                   Automated tests
legacy/                  Original prototype retained for reference
```

Editor behavior, language tooling, workspace services, terminal execution, and source control will evolve as independent modules.
