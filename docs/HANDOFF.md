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
| **First-party features** | Dashboard, workspace, theme, diagnostics, scaffolds, profile, multi-root helpers | `extensions/veylora-core/` |
| **Dev orchestration** | Bootstrap / watch / launch | `scripts/*.mjs` |
| **Legacy prototype** | Old PyQt6 editor — **reference only** | `veylora/`, `legacy/` |
| **Compat entry** | `python main.py` → same Code-OSS launcher | `main.py` |

**Do not** treat `veylora/` or `legacy/` as the app to ship. Supported launch path is Code - OSS + Veylora Core.

---

## 2. Current branch state

| Ref | Meaning |
| --- | --- |
| `main` | Last merged foundation (Code-OSS adoption, Core ~0.2, basic CI) |
| `develop/modern-foundation` | **Preferred work branch** — Core 0.4.1, scaffolds, modern profile, light theme, walkthrough, multi-root helpers, release workflow |

If `develop/modern-foundation` is not yet merged, continue from that branch (or merge it to `main` first).

Pinned upstream example (verify with `git submodule status`):  
`vendor/code-oss` → `microsoft/vscode` at a fixed commit (see `.gitmodules` + submodule SHA).

---

## 3. How to run (dev)

Requirements: Git, **Node.js ≥ 22**, Corepack, native deps required by Code - OSS.

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
# prefer develop branch if still unmerged:
# git checkout develop/modern-foundation
npm run bootstrap
npm run brand
```

Terminal A:

```bash
npm run dev:watch
```

Terminal B:

```bash
npm run dev:launch
```

Checks:

```bash
npm test
npm run typecheck
python -m pytest
python -m compileall -q legacy veylora
```

Package extension:

```bash
npm run package:extension
```

---

## 4. Architecture rules (do not violate)

1. **Reuse Code - OSS** for editing, terminal, debugger, extensions, LSP. Do not reimplement Monaco/workbench.
2. **Differentiate** via branding, defaults, first-party extension, themes, onboarding, CI/release.
3. **Open VSX only** in product gallery config — never wire Microsoft Marketplace.
4. **No forced proprietary chat agent** in `product.json` (branding script deletes `defaultChatAgent`).
5. **Pin upstream** — update submodule only after review; never float on unreviewed `main` for releases.
6. **Extension API only** for product features — avoid private workbench patches unless unavoidable and documented.
7. **CI split:** fast integration on every PR; full Code-OSS compile is optional/heavy (`workflow_dispatch` / tags).

Details: [ARCHITECTURE.md](./ARCHITECTURE.md), [UPSTREAM.md](./UPSTREAM.md), [LICENSING.md](./LICENSING.md).

---

## 5. Important files map

```text
package.json                          Root scripts (bootstrap, brand, test, typecheck)
extensions/veylora-core/package.json  Extension manifest (commands, views, themes, walkthrough)
extensions/veylora-core/src/extension.ts   Activation, dashboard, workspace init, health
extensions/veylora-core/src/scaffolds.ts   Python / Node / web starters (no overwrite)
extensions/veylora-core/src/profile.ts     Folder-scoped modern settings profile
extensions/veylora-core/src/workspace.ts   Multi-root folder selection helpers
extensions/veylora-core/themes/       Veylora Dark and Veylora Light
scripts/apply-branding.mjs            product.json overlay + Open VSX
scripts/bootstrap.mjs                 submodule + pnpm + extension npm install
scripts/launch.mjs                    compile extension + start Code-OSS launcher
.github/workflows/ci.yml              Fast tests + typecheck + Python compile
.github/workflows/build.yml           VSIX artifact; optional full compile
.github/workflows/release.yml         Tag v* → GitHub Release with VSIX + checksum
docs/ROADMAP.md                       Phased product plan
tests/*.test.mjs                      Integration contracts (keep green)
```

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
- [x] Integration CI
- [x] Build workflow that packages VSIX
- [x] Release workflow: tag `v*` publishes the VSIX plus `SHA256SUMS` on a GitHub Release
- [x] Docs: architecture, upstream, licensing, roadmap, this handoff

---

## 7. Suggested next work (priority order)

1. **Merge** `develop/modern-foundation` → `main` if still open; confirm CI + Build green.
2. **Full Linux workbench compile** — harden `compile-workbench-linux` job against the pinned gulp/pnpm scripts.
3. **Optional AI hooks** — provider-agnostic, user-configured; no vendor lock-in in core product.json.
4. **Improved product icons** for installers.
5. **Open VSX publish** for `veylora-core` when ready.
6. **Installers** — signed or portable archives after the workbench compile is reliable.

Non-goals: rewriting the editor from scratch; shipping MS branding/Marketplace.

---

## 8. Instructions for an AI agent continuing this repo

- Read this file + `docs/ROADMAP.md` + `docs/ARCHITECTURE.md` before coding.
- Prefer small PRs on `develop/*` or feature branches; keep `npm test` and `npm run typecheck` green.
- Touch `vendor/code-oss` only via submodule pointer updates (never copy-paste huge upstream trees into the parent repo).
- When changing extension commands/config, update `tests/project.test.mjs`.
- When changing scripts, ensure `node --check` still passes (CI does this).
- Branding is **local working-tree** mutation of submodule `product.json`; re-run `npm run brand` after submodule update/reset.
- Full Electron/Code-OSS builds are slow and environment-sensitive; do not block every PR on them.
- Respond to the owner in their language when chatting; keep code/docs in English unless they ask otherwise.

See also [AGENTS.md](./AGENTS.md).

---

## 9. Owner note (Persian summary)

این پروژه یک IDE مبتنی بر **Code - OSS** است. کد اصلی ادیتور را از صفر ننویس؛ روی برندینگ، اکستنشن `veylora-core`، پیش‌فرض‌های مدرن، CI و بیلد کار کن.  
نمونهٔ پایتونی (`veylora/` و `legacy/`) فقط مرجع است.  
برنچ کاری ترجیحی برای ادامه: **`develop/modern-foundation`** (اگر هنوز merge نشده).  
هدف: تجربه‌ای مدرن‌تر و تمیزتر از VS Code معمولی، با گالری Open VSX و حفظ حریم خصوصی.
