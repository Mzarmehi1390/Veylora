#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/vendor/code-oss"
[[ -d node_modules ]] || { echo "Run ./scripts/bootstrap.sh first." >&2; exit 1; }
corepack pnpm run watch
