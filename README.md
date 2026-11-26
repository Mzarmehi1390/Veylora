# Veylora IDE

**Code Beyond Limits.**

Veylora is a modern, privacy-first desktop IDE built on the open-source **Code - OSS** workbench. Rather than recreating a mature editor engine, we pin and reuse the upstream VS Code source, then layer Veylora's product identity, first-party features, defaults and release workflow on top.

> The primary runtime is Code - OSS. The original Python/PyQt6 implementation is retained as a compatibility/reference prototype and is not the application launched by the supported entrypoints.

## Handoff / continue development

| Doc | Purpose |
| --- | --- |
| **[docs/HANDOFF.md](docs/HANDOFF.md)** | **Start here** — status, rules, next tasks for a new AI or developer |
| [docs/AGENTS.md](docs/AGENTS.md) | Short rules for coding agents |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Directory map and launch mental model |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased product plan |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layered architecture |
| [docs/UPSTREAM.md](docs/UPSTREAM.md) | Submodule and branding workflow |

Work branch for the latest product-layer work (if not yet merged): `develop/modern-foundation`.

## Why Veylora

| Focus | Approach |
| --- | --- |
| Editor engine | Code - OSS (MIT) — proven, accessible, extensible |
| Marketplace | Open VSX (not Microsoft Marketplace) |
| Product layer | Veylora branding, theme, dashboard, workspace tools |
| Privacy | No forced proprietary chat agent in product defaults |
| Builds | GitHub Actions for integration + VSIX packaging |

## What Veylora inherits from Code - OSS

The upstream workbench provides the mature foundation for editing, tabs, command palette, keyboard shortcuts, settings, extension host, language integrations, debugging infrastructure, integrated terminal, accessibility and workbench layout. Available features depend on the pinned upstream revision and bundled extensions.

## Veylora features in this repository

- Veylora product identity and build-time branding overlay
- Vendor-neutral Open VSX extension gallery configuration
- First-party Veylora activity-bar workspace view and dashboard
- Workspace initialization via `.veylora/workspace.json` (schema v2, modern defaults)
- Project templates for Python, Node, and static web (existing files are never overwritten)
- Workspace health check and richer runtime diagnostics
- Keybindings (`Ctrl/Cmd+Shift+V` dashboard)
- Veylora Dark theme and Python snippets
- Pinned upstream source for reproducible builds
- Automated tests, TypeScript strict checks, VSIX packaging via GitHub Actions

## Source and licensing

The upstream source is Microsoft's Code - OSS repository, available under the MIT License. Veylora does not bundle Microsoft's branded Visual Studio Code distribution or connect to Microsoft's Visual Studio Marketplace. See [Licensing](docs/LICENSING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Quick start

Requirements: Git, Node.js 22 or newer, Corepack, and the native build prerequisites documented by the upstream Code - OSS project.

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
npm run bootstrap
npm run brand
```

Terminal A: `npm run dev:watch`  
Terminal B: `npm run dev:launch`

`python main.py` uses the same Code - OSS launcher (not the PyQt prototype).

See [UPSTREAM.md](docs/UPSTREAM.md) for details.

## Package the first-party extension

```bash
npm run package:extension
```

GitHub **Build** workflow uploads the VSIX as an artifact on pushes to `main` and `develop/**`.

## Repository layout

```text
vendor/code-oss/              Pinned upstream Code - OSS (submodule)
extensions/veylora-core/      First-party extension
scripts/                      Bootstrap, launch, branding
docs/                         Handoff, architecture, roadmap, agents
tests/                        Integration tests
legacy/ and veylora/           PyQt prototype (reference only)
.github/workflows/            CI + Build
```

Full map: [docs/STRUCTURE.md](docs/STRUCTURE.md).

## Development checks

```bash
npm test
npm run typecheck
python -m pytest
python -m compileall -q legacy veylora
```

Integration CI is the default gate. Full workbench compile is available via the Build workflow (`workflow_dispatch` or tags).
