# Veylora architecture

## Product strategy

Veylora is a branded distribution and first-party extension layer on top of Microsoft's open-source **Code - OSS** workbench. We reuse the mature upstream editor instead of recreating its editor engine, workbench, extension host, language integrations, debugger, terminal, accessibility behavior and command system independently.

The upstream source is pinned in vendor/code-oss as a Git submodule. The pin is deliberate: Veylora updates are reviewed against a known upstream revision rather than silently tracking an unstable branch.

## Runtime and layers

- **Code - OSS workbench:** the actual desktop runtime; it owns editor models, tabs, command palette, keybindings, settings, extension host, debugging infrastructure, integrated terminal and workbench UI.
- **Veylora product layer:** product identity, default theme, Open VSX gallery configuration and launch/build scripts.
- **Veylora Core extension:** first-party dashboard, workspace initialization, diagnostics, settings entry points, scaffolds, modern profile, multi-root helpers, and optional provider-agnostic AI configuration points.
- **Python/PyQt prototype:** the original implementation remains in the veylora package for reference only. The supported main.py compatibility entrypoint delegates to scripts/launch.mjs; it does not start a separate editor implementation.

## Launch contract

There is one canonical development launch path: scripts/launch.mjs. It validates the initialized upstream checkout, selects the platform-native Code - OSS launcher (code.bat on Windows, code.sh on Linux/macOS), compiles Veylora Core and starts the workbench with the extension development path configured.

Both npm run dev:launch and python main.py use this path. Keeping a single launcher prevents the Python compatibility command from silently opening a different, limited application.

## Extension boundaries

The first-party extension uses the stable VS Code extension API. It avoids patching private workbench internals for ordinary workspace features. Webview content uses a restrictive Content Security Policy (nonce-gated scripts and styles), message validation and extension-owned resources.

Optional AI integration is configuration-only and provider-agnostic: users choose none, a local Ollama endpoint, an OpenAI-compatible server, or a custom URL. No vendor is hard-coded in product.json and the feature is disabled by default. Future chat or completion UI can consume the same settings without coupling to a specific provider.

Future first-party capabilities should be added as focused modules or extensions rather than coupling product features to private workbench implementation details.

## Reliability and upstream updates

1. Review upstream release notes and breaking changes.
2. Update the submodule to a selected, tested commit.
3. Rebuild the first-party extension against the supported API.
4. Run root tests and strict TypeScript checks.
5. Verify product branding and Open VSX configuration against the updated upstream product.json.
6. Run the full upstream build and smoke tests before publishing a release.

The normal Veylora CI validates our integration layer without rebuilding all of Code - OSS on every small extension change. Release CI must additionally build the pinned upstream source on supported operating systems. A passing integration CI is not, by itself, proof that the full desktop workbench builds or runs correctly.
