# Veylora — AI / developer handoff

**Repository:** https://github.com/Mzarmehi1390/Veylora  
**Owner:** Mzarmehi1390  
**Product goal:** a desktop IDE that feels more modern and polished than stock VS Code, while reusing Code - OSS (not rewriting the editor engine).

This document is the single entry point for another AI or developer taking over.

---

## 1. What this project is

| Layer | Role | Location |
| --- | --- | --- |
| **Runtime** | Real desktop IDE | `vendor/code-oss` (Git submodule → `microsoft/vscode`) |
| **Product identity** | Name, Open VSX, no MS Marketplace | `scripts/apply-branding.mjs` → patches `product.json` |
| **First-party features** | Dashboard, workspace, theme, diagnostics, scaffolds, profile, multi-root helpers, optional AI points | `extensions/veylora-core/` |
| **Dev orchestration** | Bootstrap / watch / launch | `scripts/*.mjs` |
| **Legacy prototype** | Old PyQt6 editor — **reference only** | `veylora/`, `legacy/` |
| **Compat entry** | `python main.py` → same Code-OSS launcher | `main.py` |

**Do not** treat `veylora/` or `legacy/` as the app to ship. Supported launch path is Code - OSS + Veylora Core.

---

## 2. Current branch state

| Ref | Meaning |
| --- | --- |
| `main` | Last merged foundation (Code-OSS adoption, Core ~0.2, basic CI) |
| `develop/modern-foundation` | **Preferred work branch** — Core 0.4.5, scaffolds, modern profile, light theme, walkthrough, multi-root helpers, optional AI integration points, improved product icon, restored dashboard/commands entrypoint, release workflow |

If `develop/modern-foundation` is not yet merged, continue from that branch (or merge it to `main` first).

Pinned upstream example (verify with `git submodule status`):  
`vendor/code-oss` → `microsoft/vscode` at a fixed commit (see `.gitmodules` + submodule SHA).

---

## 6. What is already done

- [x] Code - OSS submodule + launch unification
- [x] Branding + Open VSX
- [x] Veylora Core: dashboard webview, workspace init (`.veylora/workspace.json`), diagnostics
- [x] Core 0.3: health check, welcome command, keybinding, init hint, schema v2 modern defaults, richer theme
- [x] Core 0.4: project scaffolds for Python, Node, and static web (skip existing files, stamp `.veylora/workspace.json`)
- [x] Modern settings profile (telemetry off, quieter watcher/search, folder-scoped)
- [x] Veylora Light theme + getting-started walkthrough
- [x] Multi-root workspace helpers (folder picker, apply profile to all, health/dashboard awareness)
- [x] Optional AI assistant integration points (provider-agnostic, user-controlled, off by default)
- [x] Improved product icon (modern gradient V mark for activity bar, walkthrough, and installer resources)
- [x] Dashboard panel reuse + live AI status + Getting Started button
- [x] Additional keybindings for new project and health check
- [x] Restored complete `extension.ts` entrypoint (previously placeholder) wiring all commands, sidebar, status bar, CSP webviews
- [x] Integration CI
- [x] Build workflow that packages VSIX
- [x] Release workflow: tag `v*` publishes the VSIX plus `SHA256SUMS` on a GitHub Release
- [x] Docs: architecture, upstream, licensing, roadmap, this handoff

---

## 7. Suggested next work (priority order)

1. **Confirm CI + Build green** on `develop/modern-foundation` (typecheck should now pass) and merge to `main`.
2. **Full Linux workbench compile** — harden `compile-workbench-linux` job against the pinned gulp/pnpm scripts.
3. **Open VSX publish** for `veylora-core` when ready.
4. **Installers** — signed or portable archives after the workbench compile is reliable.
5. **Recommended extensions** curation and contribution guide polish.

Non-goals: rewriting the editor from scratch; shipping MS branding/Marketplace; forcing any specific AI vendor.
