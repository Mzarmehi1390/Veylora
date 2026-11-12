"""Compatibility entrypoint that launches the Code - OSS based Veylora IDE.

Use npm run dev:watch in a separate terminal while developing the workbench.
This Python entrypoint intentionally never starts the retired PyQt prototype.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path
from typing import Sequence

ROOT = Path(__file__).resolve().parent
LAUNCH_SCRIPT = ROOT / "scripts" / "launch.mjs"


def main(argv: Sequence[str] | None = None) -> int:
    """Delegate to the canonical Code - OSS launcher and preserve CLI arguments."""
    node = shutil.which("node")
    if node is None:
        print(
            "Veylora requires Node.js 22 or newer. Install Node.js, then run "
            "npm run bootstrap from the Veylora repository.",
            file=sys.stderr,
        )
        return 1

    if not LAUNCH_SCRIPT.is_file():
        print(f"Veylora launcher was not found: {LAUNCH_SCRIPT}", file=sys.stderr)
        return 1

    try:
        result = subprocess.run(
            [node, str(LAUNCH_SCRIPT), *(list(argv) if argv is not None else sys.argv[1:])],
            cwd=ROOT,
            check=False,
        )
    except OSError as error:
        print(f"Unable to start the Veylora Code - OSS launcher: {error}", file=sys.stderr)
        return 1

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
