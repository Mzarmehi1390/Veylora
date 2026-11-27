# Veylora Roadmap

**Goal:** a desktop IDE that feels faster, cleaner and more modern than stock Visual Studio Code, while reusing the mature Code - OSS workbench.

We do not reimplement the editor engine. Differentiation comes from product defaults, first-party experience, privacy posture, packaging and focused workflows.

**Handoff:** see [HANDOFF.md](./HANDOFF.md) for current branch status and agent instructions.

## Guiding principles

1. **Reuse the best of Code - OSS** — editing, LSP, terminal, debugger, extensions.
2. **Own the product surface** — identity, defaults, onboarding, dashboard, themes.
3. **Open by default** — Open VSX gallery, no Microsoft Marketplace lock-in.
4. **Privacy first** — no forced telemetry or proprietary chat agents in product.json.
5. **Ship continuously** — integration CI on every change; reproducible builds via GitHub Actions.

## Phase 0 — Foundation

- [x] Pin Code - OSS as Git submodule
- [x] Veylora product branding overlay + Open VSX
- [x] First-party `veylora-core` extension (dashboard, workspace init, diagnostics)
- [x] Cross-platform launch / watch / bootstrap scripts
- [x] Integration CI (tests + typecheck + Python prototype compile)
- [x] Package Veylora Core as VSIX artifact (Build workflow on `develop/modern-foundation`)
- [x] Document release path and full workbench compile (manual/tag job)

## Phase 1 — Modern product layer (in progress on `develop/modern-foundation`)

- [x] Richer workspace dashboard
- [x] Init hint + schema v2 modern defaults in workspace.json
- [x] Stronger Veylora Dark theme
- [x] Status bar + command palette commands + keybindings
- [x] Workspace health check
- [x] CI job that packages the extension as a downloadable artifact
- [ ] Merge develop branch to `main` and verify Actions on default branch
- [x] Optional light theme
- [x] First-run walkthrough polish

## Phase 2 — Differentiation

- [x] Project templates / quick-start scaffolds (Python, Node, static web; never overwrite existing files)
- [x] Built-in task recipes and run configuration helpers (per scaffold; existing tasks are kept)
- [x] Optional local AI assistant integration points (provider-agnostic, user-controlled OpenAI-compatible endpoint, off by default)
- [x] Performance-oriented default settings profile
- [x] Multi-root workspace helpers
- [x] Improved icons and product resources for installers (activity-bar / dashboard mark refined; full installer icons still later)

## Phase 3 — Release quality

- [ ] Full Code - OSS compile + package on Linux (harden Actions job)
- [ ] Windows and macOS release builds where feasible
- [ ] Signed installers / portable archives where practical
- [ ] Automated smoke test of launched workbench
- [x] Versioned GitHub Releases with notes and checksums (VSIX on `v*` tags; installers still later)

## Phase 4 — Ecosystem

- [ ] Publish Veylora Core to Open VSX
- [ ] Recommended extension set curated for Veylora
- [ ] Contribution guide and extension API boundaries doc
- [ ] Optional sync of selected upstream security fixes on a fixed cadence

## Non-goals

- Replacing Monaco / the workbench with a custom editor from scratch
- Shipping Microsoft Visual Studio Code branding or Marketplace
- Tracking floating upstream `main` without review

## Success metrics

- Cold start and extension activation remain competitive with Code - OSS
- New users can open a folder, initialize a Veylora workspace and run a file in under two minutes
- Every main commit produces a green CI and a VSIX artifact
- Releases are reproducible from a tagged commit and the pinned submodule SHA
