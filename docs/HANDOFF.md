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
| **First-party features** | Dashboard, workspace, theme, diagnostics, scaffolds, settings profile | `extensions/veylora-core/` |
| **Dev orchestration** | Bootstrap / watch / launch | `scripts/*.mjs` |
| **Legacy prototype** | Old PyQt6 editor — **reference only** | `veylora/`, `legacy/` |
| **Compat entry** | `python main.py` → same Code-OSS launcher | `main.py` |

**Do not** treat `veylora/` or `legacy/` as the app to ship. Supported launch path is Code - OSS + Veylora Core.

---

## 2. Current branch state

| Ref | Meaning |
| --- | --- |
| `main` | Last merged foundation (Code-OSS adoption, Core ~0.2, basic CI) |
| `develop/modern-foundation` | Preferred work branch — Core 0.4 scaffolds |
| `feat/profile-light-theme-release` | Core 0.4.1: modern settings profile, Veylora Light, walkthrough, tag VSIX releases |

Pinned upstream: `vendor/code-oss` → `microsoft/vscode` at a fixed commit.

---

## 6. What is already done

- [x] Code - OSS submodule + launch unification
- [x] Branding + Open VSX
- [x] Veylora Core: dashboard, workspace init, diagnostics, scaffolds
- [x] Core 0.4.1: folder-scoped modern settings profile (telemetry off), Veylora Light theme, getting-started walkthrough, v* tag VSIX + SHA256SUMS release workflow
- [x] Integration CI and Build workflow
- [x] Docs: architecture, upstream, licensing, roadmap, this handoff

---

## 7. Suggested next work (priority order)

1. Merge `feat/profile-light-theme-release` → `develop/modern-foundation` (or main) and confirm CI + Build green.
2. Harden the Linux workbench compile job against the pinned gulp/pnpm scripts.
3. Optional AI hooks (provider-agnostic, user-controlled).
4. Open VSX publish for `veylora-core`.
5. Installers after the workbench compile is reliable.

Non-goals: rewriting the editor from scratch; shipping MS branding/Marketplace.
