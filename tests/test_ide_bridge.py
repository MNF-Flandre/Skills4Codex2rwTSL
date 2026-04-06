import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def _run(args):
    cmd = [sys.executable, str(ROOT / "python" / "ide_bridge.py")] + args
    env = {
        "PYTHONPATH": str(ROOT / "python"),
        "PYTHONUTF8": "1",
        "PYTHONIOENCODING": "utf-8",
    }
    out = subprocess.check_output(cmd, cwd=ROOT, env=env, encoding="utf-8", errors="replace")
    return json.loads(out)


class TestIdeBridge(unittest.TestCase):
    def test_run_check_command(self):
        payload = _run([
            "run-check",
            "--file",
            str(ROOT / "examples" / "golden_cases" / "static_error_case.tsl"),
        ])
        self.assertEqual(payload["command"], "Run TSL Check")
        self.assertGreaterEqual(len(payload["diagnostics"]), 1)

    def test_run_validation_mode_payload(self):
        report_path = Path(tempfile.gettempdir()) / "bridge_test_report.md"
        payload = _run([
            "run-validation",
            "--file",
            str(ROOT / "examples" / "golden_cases" / "mock_pass_case.tsl"),
            "--case",
            str(ROOT / "examples" / "golden_cases" / "case_mock_pass.json"),
            "--task",
            str(ROOT / "examples" / "golden_cases" / "task_spec.json"),
            "--mode",
            "oracle",
            "--adapter",
            "mock",
            "--lint-policy",
            "warn",
            "--report",
            str(report_path),
        ])
        self.assertEqual(payload["command"], "Run Validation")
        self.assertIn("mode", payload)
        self.assertIn("status", payload)
        self.assertIn("summary", payload)

    def test_ask_fix_payload_structure_and_preview(self):
        report_path = Path(tempfile.gettempdir()) / "bridge_fix_report.md"
        _run([
            "run-validation",
            "--file",
            str(ROOT / "examples" / "golden_cases" / "semantic_mismatch_case.tsl"),
            "--case",
            str(ROOT / "examples" / "golden_cases" / "case_semantic_mismatch.json"),
            "--task",
            str(ROOT / "examples" / "golden_cases" / "task_spec.json"),
            "--mode",
            "oracle",
            "--adapter",
            "mock",
            "--lint-policy",
            "warn",
            "--report",
            str(report_path),
        ])
        payload = _run([
            "ask-fix",
            "--file",
            str(ROOT / "examples" / "golden_cases" / "semantic_mismatch_case.tsl"),
            "--report",
            str(report_path),
        ])
        self.assertIn("repair_payload", payload)
        rp = payload["repair_payload"]
        for key in [
            "source",
            "diagnostics",
            "validation_mode",
            "failure_kind",
            "diff_summary",
            "mismatch_fields",
            "reference_strategy",
            "runtime_adapter",
            "runtime_errors",
            "runtime_intermediate_trace",
            "runtime_final_env",
            "suggested_next_action",
            "minimal_repro_case",
            "repair_prompt_preview",
        ]:
            self.assertIn(key, rp)
        self.assertTrue(rp["repair_prompt_preview"])

    def test_run_preflight_command(self):
        payload = _run([
            "run-preflight",
            "--case",
            str(ROOT / "examples" / "live_cases" / "live_smoke_case.json"),
        ])
        self.assertEqual(payload["command"], "Run PyTSL Preflight")
        self.assertIn("preflight", payload)
        for key in ["connection_mode", "package_ready", "config_ready", "case_ready", "network_ready", "sdk_ready", "overall_ready"]:
            self.assertIn(key, payload)


if __name__ == "__main__":
    unittest.main()
