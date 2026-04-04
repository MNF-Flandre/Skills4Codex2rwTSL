import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class TestIdeBridge(unittest.TestCase):
    def test_run_check_command(self):
        cmd = [
            sys.executable,
            str(ROOT / "python" / "ide_bridge.py"),
            "run-check",
            "--file",
            str(ROOT / "examples" / "golden_cases" / "static_error_case.tsl"),
        ]
        env = {"PYTHONPATH": str(ROOT / "python")}
        out = subprocess.check_output(cmd, cwd=ROOT, env=env)
        payload = json.loads(out.decode("utf-8"))
        self.assertEqual(payload["command"], "Run TSL Check")
        self.assertGreaterEqual(len(payload["diagnostics"]), 1)


if __name__ == "__main__":
    unittest.main()
