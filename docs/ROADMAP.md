# Veylora Roadmap

Phased plan for the product layer on Code - OSS. The editor engine is not rewritten.

## Phase 0 — Foundation (done)

- [x] Code - OSS submodule + single launch path (`scripts/launch.mjs` / `python main.py`)
- [x] Branding + Open VSX gallery configuration
- [x] Veylora Core extension skeleton (dashboard, workspace init, diagnostics)
- [x] Integration CI (tests + typecheck + legacy Python)
- [x] Build workflow that packages VSIX
- [x] Docs: architecture, upstream, licensing, structure, handoff

## Phase 1 — Product polish & merge readiness (mostly done)

- [x] Core 0.3: health check, welcome, keybinding, init hint, schema v2 modern defaults, richer theme
- [x] Core 0.4: project scaffolds (Python, Node, static web) — skip existing files, stamp `.veylora/workspace.json`
- [x] Modern settings profile (telemetry off, quieter watcher/search, folder-scoped)
- [x] Veylora Light theme + getting-started walkthrough
- [x] Multi-root workspace helpers
- [x] Optional provider-agnostic AI configuration points (off by default)
- [x] Improved product icon
- [x] Dashboard panel reuse + live AI status + Getting Started button (Core 0.4.4)
- [x] Additional keybindings
- [x] Release workflow: tag `v*` publishes VSIX + SHA256SUMS
- [ ] Confirm CI + Build green on `develop/modern-foundation` and merge to `main`

## Phase 2 — Differentiation & reliability (in progress)

- [ ] Harden `compile-workbench-linux` job against the pinned gulp/pnpm scripts (manual/tag only)
- [x] Recommended extensions curation + contribution guide polish (`docs/RECOMMENDED.md`)
- [x] Tasks helpers and richer workspace health signals (Core 0.4.6)
- [x] Settings profile refinements (more privacy/performance defaults)
- [ ] Open VSX publish for `veylora-core` when ready
- [ ] Installers — signed or portable archives after workbench compile is reliable

## Non-goals

- Rewriting the editor from scratch
- Shipping Microsoft Marketplace endpoints or MS branding
- Forcing any specific AI vendor
- Promoting the legacy PyQt prototype (`veylora/`, `legacy/`) as the primary app

## Notes

Preferred work branch: `develop/modern-foundation`. Full Code - OSS Electron rebuild stays on `workflow_dispatch` or release tags.
