# Veylora IDE

**Code Beyond Limits.**

Veylora is a modern, privacy-first desktop IDE built on the open-source **Code - OSS** workbench. Rather than recreating a mature editor engine, we pin and reuse the upstream VS Code source, then layer Veylora's product identity, first-party features, defaults and release workflow on top.

> The primary runtime is Code - OSS. The original Python/PyQt6 implementation is retained as a compatibility/reference prototype and is not the application launched by the supported entrypoints.

## Why Veylora

| Focus | Approach |
| --- | --- |
| Editor engine | Code - OSS (MIT) — proven, accessible, extensible |
| Marketplace | Open VSX (not Microsoft Marketplace) |
| Product layer | Veylora branding, theme, dashboard, workspace tools |
| Privacy | No forced proprietary chat agent in product defaults |
| Builds | GitHub Actions for integration + VSIX packaging |

See [ROADMAP](docs/ROADMAP.md) for the path toward a sharper, more modern experience than a stock workbench.

## What Veylora inherits from Code - OSS

The upstream workbench provides the mature foundation for editing, tabs, command palette, keyboard shortcuts, settings, extension host, language integrations, debugging infrastructure, integrated terminal, accessibility and workbench layout. Available features depend on the pinned upstream revision and bundled extensions.

## Veylora features in this repository

- Veylora product identity and build-time branding overlay
- Vendor-neutral Open VSX extension gallery configuration
- First-party Veylora activity-bar workspace view and dashboard
- Workspace initialization via `.veylora/workspace.json` (schema v2, modern defaults)
- Workspace health check and richer runtime diagnostics
- Keybindings (`Ctrl/Cmd+Shift+V` dashboard)
- Veylora Dark theme and Python snippets
- Pinned upstream source for reproducible builds
- Automated tests, TypeScript strict checks, VSIX packaging via GitHub Actions

## Source and licensing

The upstream source is Microsoft's Code - OSS repository, available under the MIT License. Veylora does not bundle Microsoft's branded Visual Studio Code distribution or connect to Microsoft's Visual Studio Marketplace. See [Licensing](docs/LICENSING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Quick start

Requirements: Git, Node.js 22 or newer, Corepack, and the native build prerequisites documented by the upstream Code - OSS project.

Clone with submodules:

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
npm run bootstrap
npm run brand
```

Run the upstream watcher in one terminal:

```bash
npm run dev:watch
```

Launch the actual Code - OSS workbench with the Veylora extension in another terminal:

```bash
npm run dev:launch
```

The compatibility entrypoint `python main.py` delegates to the same Code - OSS launcher; it does not start the old PyQt prototype. The upstream watcher must already be running for a development launch.

See [the upstream workflow](docs/UPSTREAM.md) for requirements, development and update procedures.

## Package the first-party extension

```bash
npm run package:extension
```

This compiles TypeScript and produces a `.vsix` under `extensions/veylora-core/`.

On GitHub, the **Build** workflow uploads the VSIX as an artifact on pushes to `main` and `develop/**`.

## Repository layout

```text
vendor/code-oss/              Pinned upstream Code - OSS source (Git submodule)
extensions/veylora-core/      First-party Veylora extension
scripts/                      Bootstrap, launch and product branding
docs/                         Architecture, roadmap, licensing and upstream workflow
tests/                        Repository integration tests
legacy/ and veylora/           Preserved Python/PyQt prototype code
.github/workflows/            CI (fast) and Build (VSIX + optional full compile)
```

## Development checks

```bash
npm test
npm run typecheck
python -m pytest
python -m compileall -q legacy veylora
```

The root CI validates Veylora-owned integration code. A release pipeline can additionally compile the full upstream workbench on Linux via the Build workflow (`workflow_dispatch` or tags).
