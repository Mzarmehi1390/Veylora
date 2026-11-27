# Contributing to Veylora

Thank you for helping improve Veylora. This project is a **product layer on Code - OSS**. The editor engine itself is not rewritten.

## Quick rules

1. Read [docs/HANDOFF.md](HANDOFF.md) and [docs/AGENTS.md](AGENTS.md) first.
2. Preferred branch: `develop/modern-foundation` (or a short-lived feature branch from it).
3. Product changes belong in `extensions/veylora-core/`, `scripts/`, `docs/`, `tests/`, or `.github/workflows/`.
4. Do not treat `veylora/` or `legacy/` as the application to ship.
5. After changing commands, manifests, or public contracts, update `tests/project.test.mjs` (and related tests) so CI stays green.
6. TypeScript strict mode stays on for the extension.

## Recommended extensions (Open VSX)

Veylora uses Open VSX, not the Microsoft Marketplace. The following extensions are useful companions and can be recommended in a workspace `.vscode/extensions.json`:

| Extension | Publisher | Purpose |
| --- | --- | --- |
| Python | `ms-python` | Python language support (available on Open VSX mirrors or community builds) |
| ESLint | `dbaeumer` | JavaScript/TypeScript linting |
| Prettier | `esbenp` | Formatting |
| GitLens | `eamodio` | Enhanced Git (check Open VSX availability) |
| Live Server | `ritwickdey` | Static web preview |

**Note:** Always verify the exact publisher and availability on Open VSX before recommending. Veylora does not hard-depend on any of them. Scaffolds already include basic `.vscode/tasks.json` where useful.

Example `.vscode/extensions.json` you can drop into a scaffolded project:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Development workflow

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
npm run bootstrap
npm run brand
```

Terminal A: `npm run dev:watch`  
Terminal B: `npm run dev:launch`

Checks:

```bash
npm test
npm run typecheck
```

## Pull requests

- Keep commits focused.
- Describe what changed and why.
- Confirm `npm test` and `npm run typecheck` pass.
- Mention any new commands or configuration keys so docs and tests can be updated.

## Non-goals for contributions

- Replacing the Code - OSS workbench with a custom editor.
- Adding Microsoft Marketplace endpoints.
- Shipping the legacy PyQt prototype as the primary app.
