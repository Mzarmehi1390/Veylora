# Recommended extensions for Veylora

Veylora uses Open VSX (not the Microsoft Marketplace). These are suggestions only — install what you need. Prefer extensions that work offline or with clear telemetry controls.

## Language & tooling

| Extension | Publisher | Why |
| --- | --- | --- |
| Python | `ms-python.python` (Open VSX mirror or official) | Core Python support, debugging, testing |
| Pylance | `ms-python.vscode-pylance` | Fast type checking and IntelliSense for Python |
| ESLint | `dbaeumer.vscode-eslint` | JavaScript/TypeScript linting |
| Prettier | `esbenp.prettier-vscode` | Consistent formatting (pairs with Veylora format-on-save profile) |
| GitLens | `eamodio.gitlens` | Richer Git history and blame (disable telemetry in its settings if preferred) |

## Productivity

| Extension | Publisher | Why |
| --- | --- | --- |
| Error Lens | `usernamehw.errorlens` | Inline diagnostics |
| Todo Tree | `Gruntfuggly.todo-tree` | Surface TODOs across the workspace |
| Project Manager | `alefragnani.project-manager` | Quick switching between projects |

## Privacy notes

- Veylora Core sets `telemetry.telemetryLevel` to `off` for the workspace when you apply the modern profile.
- Review each extension's own telemetry settings.
- Avoid extensions that require a Microsoft account or phone-home by default if that conflicts with your workflow.

## Adding more

Contributions of curated lists or a `extensions.json` recommendations file are welcome. See `docs/AGENTS.md` for the contribution bar.
