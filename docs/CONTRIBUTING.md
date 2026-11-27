# Contributing to Veylora

Thank you for contributing to the Veylora product layer.

## Scope

Veylora is a **product layer on Code - OSS**. Contributions should focus on:

- `extensions/veylora-core/` — commands, webviews, themes, scaffolds, profile, diagnostics
- `scripts/` — bootstrap, branding, launch (keep cross-platform)
- `.github/workflows/` — CI, Build, Release
- `docs/` and root metadata
- Tests under `tests/`

**Do not** rewrite the editor engine or promote the legacy PyQt prototype (`veylora/`, `legacy/`) as the primary application.

## Development setup

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
npm run bootstrap
npm run brand
```

Then:

- Terminal A: `npm run dev:watch`
- Terminal B: `npm run dev:launch`

`python main.py` uses the same launcher.

## Quality bar

- TypeScript `strict` remains on for the extension.
- Webviews use a restrictive CSP and validate messages.
- Update `tests/project.test.mjs` when commands, versions, or manifests change.
- Run `npm test` and `npm run typecheck` before opening a PR.
- Prefer focused commits with clear messages.

## Branching

Preferred work branch: `develop/modern-foundation`. Create short-lived feature branches from it when helpful.

## Licensing

See [LICENSING.md](LICENSING.md) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Upstream Code - OSS is MIT. Do not introduce Microsoft Marketplace endpoints or proprietary branding.
