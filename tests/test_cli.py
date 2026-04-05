import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_cli(args):
    cmd = [sys.executable, "-m", "tsl_validation.cli"] + args
    env = {"PYTHONPATH": str(ROOT / "python")}
    proc = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True)
    payload = json.loads(proc.stdout) if proc.stdout.strip() else {}
    return proc.returncode, payload


class TestCliExitCodes(unittest.TestCase):
    def test_lint_error_exit_code(self):
        code, payload = run_cli(["lint", "examples/golden_cases/static_error_case.tsl"])
        self.assertEqual(code, 1)
        self.assertEqual(payload.get("status"), "fail")

    def test_oracle_mismatch_exit_code(self):
        report_path = Path(tempfile.gettempdir()) / "cli_oracle_mismatch.md"
        code, payload = run_cli([
            "validate",
            "examples/golden_cases/semantic_mismatch_case.tsl",
            "--case",
            "examples/golden_cases/case_semantic_mismatch.json",
            "--task",
            "examples/golden_cases/task_spec.json",
            "--adapter",
            "mock",
            "--mode",
            "oracle",
            "--report",
            str(report_path),
            "--no-lint-gate",
        ])
        self.assertEqual(code, 2)
        self.assertEqual(payload.get("failure_kind"), "oracle_mismatch")

    def test_config_error_exit_code(self):
        code, payload = run_cli([
            "validate",
            "examples/golden_cases/mock_pass_case.tsl",
            "--case",
            "examples/golden_cases/does_not_exist.json",
            "--task",
            "examples/golden_cases/task_spec.json",
        ])
        self.assertEqual(code, 3)
        self.assertEqual(payload.get("status"), "error")


if __name__ == "__main__":
    unittest.main()
