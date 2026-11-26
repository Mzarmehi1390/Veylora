# Agent guide (AI and automation)

Concise rules for automated coding agents working on Veylora.

## Mission

Improve Veylora as a **product layer on Code - OSS**: modern UX, privacy-first defaults, reliable CI/builds. Do not replace the workbench with a custom editor.

## Before you change code

1. Read `docs/HANDOFF.md` and `docs/ROADMAP.md`.
2. Confirm which git branch is canonical for the task (`main` vs `develop/modern-foundation`).
3. Run or reason about: `npm test`, `npm run typecheck`.

## Allowed high-value changes

- `extensions/veylora-core/**` — features, theme, commands, webviews
- `scripts/**` — bootstrap, brand, launch (keep cross-platform)
- `.github/workflows/**` — CI/Build/Release
- `docs/**`, root `README.md`, tests under `tests/`
- Submodule **pointer** updates to `vendor/code-oss` after reviewing upstream

## Disallowed / high-risk without explicit owner request

- Rewriting `veylora/` PyQt app as the primary IDE
- Adding Microsoft Marketplace endpoints
- Committing full contents of `vendor/code-oss` into the parent tree
- Secret keys, tokens, or telemetry back to third parties by default
- Breaking the single launch path (`scripts/launch.mjs` / `python main.py` → Code-OSS)

## Quality bar

- TypeScript: `strict` remains on for the extension
- Webviews: CSP + message validation (see existing dashboard)
- Tests: update `tests/project.test.mjs` when manifests/commands change
- Commits: focused messages; prefer PR description with checklist

## Build notes

- Fast path: integration CI (no full Electron build)
- VSIX: `npm run package:extension` or Build workflow artifact
- Full compile: Build workflow job `compile-workbench-linux` (manual/tag); expect long runtime and native deps

## Product constants

- Display name: Veylora / Veylora IDE
- Extension id publisher: `veylora`, name: `veylora-core`
- Workspace config: `.veylora/workspace.json`
- Gallery: Open VSX URLs in `scripts/apply-branding.mjs`
