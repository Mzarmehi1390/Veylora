import contextlib
import importlib.util
import io
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("veylora_entrypoint", ROOT / "main.py")
ENTRYPOINT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ENTRYPOINT)


class EntrypointTests(unittest.TestCase):
    def test_python_entrypoint_delegates_to_code_oss_and_forwards_arguments(self):
        completed = subprocess.CompletedProcess([], 7)
        with patch.object(ENTRYPOINT.shutil, "which", return_value="/usr/bin/node"), patch.object(
            ENTRYPOINT.subprocess, "run", return_value=completed
        ) as run:
            result = ENTRYPOINT.main(["--disable-extensions"])

        self.assertEqual(result, 7)
        run.assert_called_once_with(
            ["/usr/bin/node", str(ROOT / "scripts" / "launch.mjs"), "--disable-extensions"],
            cwd=ROOT,
            check=False,
        )

    def test_missing_node_reports_actionable_error(self):
        output = io.StringIO()
        with patch.object(ENTRYPOINT.shutil, "which", return_value=None), contextlib.redirect_stderr(output):
            result = ENTRYPOINT.main([])

        self.assertEqual(result, 1)
        self.assertIn("Node.js 22", output.getvalue())


if __name__ == "__main__":
    unittest.main()
