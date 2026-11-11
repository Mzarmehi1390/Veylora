# Veylora IDE

**Code Beyond Limits.**

Veylora is a desktop IDE built on the open-source **Code - OSS** workbench. Rather than recreating a mature editor engine, we pin and reuse the upstream VS Code source, then build Veylora's product identity, first-party extension features, defaults and release workflow around it.

> The current primary runtime is Code - OSS. The original Python/PyQt6 prototype is preserved under `legacy/` for reference and is no longer the main application architecture.

## What Veylora inherits from Code - OSS

The upstream workbench provides the mature foundation for editing, tabs, command palette, keyboard shortcuts, settings, extension host, language integrations, debugging infrastructure, integrated terminal, accessibility and workbench layout. Available features depend on the pinned upstream revision and bundled extensions.

## Veylora features in this repository

- Veylora product identity and build-time branding overlay
- Vendor-neutral Open VSX extension gallery configuration
- First-party Veylora activity-bar workspace view and dashboard
- Workspace initialization via `.veylora/workspace.json`
- Runtime diagnostics output channel
- Veylora Dark theme and Python snippets
- Pinned upstream source for reproducible builds
- Automated tests and TypeScript strict type-checking for the integration layer

## Source and licensing

The upstream source is Microsoft's Code - OSS repository, available under the MIT License. Veylora does not bundle Microsoft's branded Visual Studio Code distribution or connect to Microsoft's Visual Studio Marketplace. See [Licensing](docs/LICENSING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Quick start

Clone with submodules:

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
npm run bootstrap
```

Run the upstream watcher in one terminal:

```bash
npm run dev:watch
```

Launch the workbench with the Veylora extension in another terminal:

```bash
npm run dev:launch
```

Apply Veylora product identity to the local upstream checkout before preparing a branded build:

```bash
npm run brand
```

See [the upstream workflow](docs/UPSTREAM.md) for requirements, development and update procedures.

## Repository layout

```text
vendor/code-oss/              Pinned upstream Code - OSS source (Git submodule)
extensions/veylora-core/      First-party Veylora extension
scripts/                      Bootstrap, launch and product branding
docs/                         Architecture, licensing and upstream workflow
tests/                        Repository integration tests
legacy/                       Preserved original PyQt6 prototype
```

## Development checks

```bash
npm test
npm run typecheck
python -m compileall -q legacy
```

The root CI validates Veylora-owned integration code. A release pipeline must additionally build and smoke-test the full upstream workbench on Windows, macOS and Linux.
