# Veylora architecture

## Product strategy

Veylora is a branded distribution and first-party extension layer on top of Microsoft's open-source **Code - OSS** workbench. We reuse the mature upstream editor instead of recreating its editor engine, workbench, extension host, language integrations, debugger, terminal, accessibility behavior and command system independently.

The upstream source is pinned in `vendor/code-oss` as a Git submodule. The pin is deliberate: Veylora updates are reviewed against a known upstream revision rather than silently tracking an unstable branch.

## Layers

- **Code - OSS workbench:** editor model, tabs, command palette, keybindings, settings, extension host, debugging infrastructure, integrated terminal and workbench UI.
- **Veylora product layer:** product identity, default theme, Open VSX gallery configuration and launch/build scripts.
- **Veylora Core extension:** first-party dashboard, workspace initialization, diagnostics, settings entry points and future product-specific workflows.
- **Legacy prototype:** original PyQt6 implementation retained under `legacy/` for reference; it is no longer the primary application runtime.

## Extension boundaries

The first-party extension uses the stable VS Code extension API. It avoids patching private workbench internals for ordinary workspace features. Webview content uses a restrictive Content Security Policy, message validation and extension-owned resources.

Future first-party capabilities should be added as focused modules or extensions rather than coupling product features to private workbench implementation details.

## Upstream updates

1. Review upstream release notes and breaking changes.
2. Update the submodule to a selected, tested commit.
3. Rebuild the first-party extension against the supported API.
4. Run root tests and strict TypeScript checks.
5. Verify product branding and Open VSX configuration against the updated upstream `product.json`.
6. Run the full upstream build and smoke tests before publishing a release.

The normal Veylora CI validates our integration layer without rebuilding all of Code - OSS on every small extension change. Release CI must additionally build the pinned upstream source on supported operating systems.
