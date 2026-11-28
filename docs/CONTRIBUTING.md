# Contributing to Veylora

Thank you for improving the product layer on Code - OSS.

## Scope

Veylora is a **product layer** on top of a pinned Code - OSS submodule. Preferred changes live in:

- `extensions/veylora-core/**` (commands, dashboard, themes, scaffolds, profile, tasks helpers)
- `scripts/**` (bootstrap, launch, branding)
- `.github/workflows/**`
- `docs/**` and root metadata
- tests under `tests/`

Do **not**:

- Rewrite the editor engine
- Promote the legacy PyQt prototype (`veylora/`, `legacy/`) as the primary app
- Add Microsoft Marketplace endpoints or MS branding
- Commit the full contents of `vendor/code-oss`

## Getting started

1. Read [HANDOFF.md](HANDOFF.md) and [ROADMAP.md](ROADMAP.md).
2. Work on `develop/modern-foundation` (or open a short-lived feature branch from it).
3. `npm run bootstrap` then `npm run brand` if you need a local workbench.
4. Extension-only changes can be type-checked with `npm run typecheck` and tested with `npm test`.

## Pull requests

- Keep commits focused.
- Update `tests/project.test.mjs` when you change commands, versions, or manifests.
- Mention which ROADMAP item the change advances.
- CI (integration + typecheck) must stay green.

## Recommended extensions (curation notes)

For everyday work on this repo we suggest (Open VSX):

- Python / Pylance (or equivalent)
- ESLint / Prettier
- GitLens (optional)
- Markdown All in One

These are **not** forced. Users control their own extension set. The modern profile keeps telemetry off and auto-update manual by default.

## Code style

- TypeScript `strict` is on for the extension.
- Webviews must keep a strict CSP and validate incoming messages.
- Prefer pure helper modules (`scaffolds.ts`, `profile.ts`, `tasks.ts`, `ai.ts`, `workspace.ts`) so activation stays thin.
