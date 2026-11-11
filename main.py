"""Backward-compatible launcher for Veylora IDE.

Preferred launch command: python -m veylora
"""

from veylora.app import main


if __name__ == "__main__":
    raise SystemExit(main())
