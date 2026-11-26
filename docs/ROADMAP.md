# Veylora Roadmap

**Goal:** a desktop IDE that feels faster, cleaner and more modern than stock Visual Studio Code, while reusing the mature Code - OSS workbench.

We do not reimplement the editor engine. Differentiation comes from product defaults, first-party experience, privacy posture, packaging and focused workflows.

## Guiding principles

1. **Reuse the best of Code - OSS** — editing, LSP, terminal, debugger, extensions.
2. **Own the product surface** — identity, defaults, onboarding, dashboard, themes.
3. **Open by default** — Open VSX gallery, no Microsoft Marketplace lock-in.
4. **Privacy first** — no forced telemetry or proprietary chat agents in product.json.
5. **Ship continuously** — integration CI on every change; reproducible builds via GitHub Actions.

## Phase 0 — Foundation (done / in progress)

- [x] Pin Code - OSS as Git submodule
- [x] Veylora product branding overlay + Open VSX
- [x] First-party `veylora-core` extension (dashboard, workspace init, diagnostics)
- [x] Cross-platform launch / watch / bootstrap scripts
- [x] Integration CI (tests + typecheck + Python prototype compile)
- [ ] Package Veylora Core as VSIX artifact on every main build
- [ ] Document release and full workbench build path

## Phase 1 — Modern product layer (current)

- [ ] Richer workspace dashboard and onboarding
- [ ] First-run welcome experience and sensible modern defaults
- [ ] Stronger Veylora Dark (and optional light) theme
- [ ] Status bar / command palette polish
- [ ] Keybindings and command discoverability
- [ ] Workspace health checks (config present, recommended extensions hints)
- [ ] CI job that compiles and packages the extension as a downloadable artifact

## Phase 2 — Differentiation

- [ ] Project templates / quick-start scaffolds (Python, Node, web)
- [ ] Built-in task recipes and run configurations helpers
- [ ] Optional local AI assistant integration points (provider-agnostic, user-controlled)
- [ ] Performance-oriented default settings profile
- [ ] Multi-root workspace helpers
- [ ] Improved icons and product resources for installers

## Phase 3 — Release quality

- [ ] Full Code - OSS compile + package on Linux (GitHub Actions)
- [ ] Windows and macOS release builds (self-hosted or GitHub-hosted where feasible)
- [ ] Signed installers / portable archives where practical
- [ ] Automated smoke test of launched workbench
- [ ] Versioned GitHub Releases with notes and checksums

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
