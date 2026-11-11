#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
command -v git >/dev/null || { echo "Git is required." >&2; exit 1; }
command -v node >/dev/null || { echo "Node.js 22+ is required." >&2; exit 1; }
command -v corepack >/dev/null || { echo "Corepack is required." >&2; exit 1; }
git submodule sync --recursive
git submodule update --init --recursive
[[ -f vendor/code-oss/package.json ]] || { echo "Code - OSS submodule is missing." >&2; exit 1; }
corepack enable
(cd vendor/code-oss && corepack pnpm install)
npm --prefix extensions/veylora-core install
echo "Veylora development dependencies are ready."
