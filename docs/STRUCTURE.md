# Repository structure

```text
Veylora/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Fast integration: tests, typecheck, Python compile
│       └── build.yml       # VSIX package artifact; optional full Code-OSS compile
├── docs/
│   ├── HANDOFF.md          # Start here for takeover
│   ├── AGENTS.md           # Rules for AI agents
│   ├── ARCHITECTURE.md     # Product/runtime layers
│   ├── ROADMAP.md          # Phased plan
│   ├── STRUCTURE.md        # This file
│   ├── UPSTREAM.md         # Submodule workflow
│   └── LICENSING.md
├── extensions/
│   └── veylora-core/       # First-party VS Code-compatible extension
│       ├── src/extension.ts
│       ├── themes/
│       ├── snippets/
│       ├── resources/
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── bootstrap.mjs       # Submodule + installs
│   ├── apply-branding.mjs  # product.json → Veylora + Open VSX
│   ├── watch.mjs           # Upstream watch
│   ├── launch.mjs          # Dev launch with extensionDevelopmentPath
│   └── launcher-paths.mjs
├── tests/                  # Node integration tests (manifest + scripts)
├── vendor/
│   └── code-oss/           # Git submodule (microsoft/vscode pin)
├── veylora/                # LEGACY PyQt package — not the shipped runtime
├── legacy/                 # LEGACY prototype scripts
├── main.py                 # Compat entry → Code-OSS launcher
├── package.json            # Root orchestration (v0.3.0 on develop branch)
├── pyproject.toml
├── requirements.txt
├── README.md
└── THIRD_PARTY_NOTICES.md
```

## Mental model

```text
[User launches Veylora]
        │
        ▼
scripts/launch.mjs ──► vendor/code-oss (Electron workbench)
        │                        │
        │                        ├── extensions host
        │                        └── Veylora Core (extensionDevelopmentPath or bundled later)
        ▼
product.json branding (name, Open VSX, ids)
```

Legacy Python UI is intentionally off the launch path.
