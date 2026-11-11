#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -f "$ROOT/vendor/code-oss/scripts/code.sh" ]] || { echo "Run ./scripts/bootstrap.sh first." >&2; exit 1; }
npm --prefix "$ROOT/extensions/veylora-core" run compile
cd "$ROOT/vendor/code-oss"
exec ./scripts/code.sh --extensionDevelopmentPath="$ROOT/extensions/veylora-core" "$@"
