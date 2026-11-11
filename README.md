# Veylora IDE

**Code Beyond Limits.**

Veylora is an experimental, desktop-first code editor built with Python and PyQt6. The repository currently contains the migrated prototype; the next development goal is to evolve it into a modular, testable IDE with a reliable editing core and a polished developer workflow.

## Current prototype capabilities

- Multi-tab text editing
- Basic Python, JavaScript, and Markdown syntax highlighting
- Word completion and automatic bracket pairing
- File-system explorer
- Integrated terminal sessions
- Basic Git status and commit panel
- Markdown preview
- Run the active Python file

> This is an early prototype, not yet a feature-complete replacement for Visual Studio Code. Language intelligence, debugging, extension APIs, robust terminal emulation, and advanced source-control workflows remain future work.

## Requirements

- Python 3.10+
- PyQt6
- Git (optional; required for the source-control panel)

## Run from source

```bash
python -m venv .venv
```

Activate the virtual environment, then install dependencies:

```bash
python -m pip install -r requirements.txt
python main.py
```

## Project direction

The codebase will be progressively organized around clear boundaries:

- **Application shell:** window composition, menus, commands, and lifecycle
- **Editor:** document models, tabs, editing behavior, and language services
- **Workspace:** project discovery and file navigation
- **Terminal:** process lifecycle and output handling
- **Source control:** Git operations and repository state
- **Services:** settings, logging, and shared infrastructure
- **Tests:** isolated unit and integration coverage

Architecture changes will preserve working behavior where practical and add automated checks before larger refactors.
