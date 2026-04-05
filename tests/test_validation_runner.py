import json
import unittest
from pathlib import Path

from tsl_validation.runner import run_validation
from tsl_validation.schemas import TaskSpec, ValidationCase


ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


class TestValidationRunner(unittest.TestCase):
    def _load(self, tsl_name: str, case_name: str):
        source = (ROOT / f"examples/golden_cases/{tsl_name}").read_text(encoding="utf-8")
        case = ValidationCase(**load_json(ROOT / f"examples/golden_cases/{case_name}"))
        task = TaskSpec(**load_json(ROOT / "examples/golden_cases/task_spec.json"))
        return source, case, task

    def test_reference_strategy_changes_reference_behavior(self):
        source, case, task = self._load("mock_pass_case.tsl", "case_reference_last_value.json")
        result = run_validation(source, case, task, adapter_name="mock", mode="oracle")
        self.assertEqual(result.python_reference.get("reference_strategy"), "last_value")
        self.assertEqual(result.python_reference.get("outputs", {}).get("value"), 8)

    def test_mock_pass_case_oracle_passes(self):
        source, case, task = self._load("mock_pass_case.tsl", "case_mock_pass.json")
        result = run_validation(
            tsl_source=source,
            case=case,
            task_spec=task,
            adapter_name="mock",
            mode="oracle",
        )
        self.assertEqual(result.metadata["status"], "pass")
        self.assertEqual(result.metadata["failure_kind"], "")

    def test_semantic_mismatch_case_oracle_fails(self):
        source, case, task = self._load("semantic_mismatch_case.tsl", "case_semantic_mismatch.json")
        result = run_validation(source, case, task, adapter_name="mock", mode="oracle")
        self.assertEqual(result.metadata["failure_kind"], "oracle_mismatch")
        self.assertGreater(result.metadata["mismatch_count"], 0)

    def test_lint_policy_block_short_circuits_runtime(self):
        source, case, task = self._load("static_error_case.tsl", "case_static_error.json")
        result = run_validation(source, case, task, adapter_name="mock", mode="smoke", lint_policy="block")
        self.assertTrue(result.metadata.get("runtime_skipped"))
        self.assertEqual(result.metadata.get("skip_reason"), "lint_policy_blocked_by_error")

    def test_lint_policy_warn_runs_runtime(self):
        source, case, task = self._load("static_error_case.tsl", "case_static_error.json")
        result = run_validation(source, case, task, adapter_name="mock", mode="smoke", lint_policy="warn")
        self.assertFalse(result.metadata.get("runtime_skipped"))

    def test_auto_fallback_to_mock_when_pytsl_not_implemented(self):
        source, case, task = self._load("mock_pass_case.tsl", "case_mock_pass.json")
        result = run_validation(source, case, task, adapter_name="auto", mode="smoke")
        self.assertEqual(result.metadata.get("adapter"), "mock")
        self.assertTrue(result.metadata.get("adapter_resolution", {}).get("fallback_used"))

    def test_trace_and_final_env_present_for_complex_case(self):
        source, case, task = self._load("complex_logic_case.tsl", "case_complex_logic.json")
        result = run_validation(source, case, task, adapter_name="mock", mode="spec")
        trace = result.metadata.get("runtime_payload", {}).get("intermediate", {}).get("trace", [])
        final_env = result.metadata.get("runtime_payload", {}).get("intermediate", {}).get("final_env", {})
        self.assertGreaterEqual(len(trace), 3)
        self.assertIn("value", final_env)

    def test_live_case_schema_is_compatible(self):
        source = (ROOT / "examples/golden_cases/mock_pass_case.tsl").read_text(encoding="utf-8")
        case = ValidationCase(**load_json(ROOT / "examples/live_cases/live_smoke_case.json"))
        task = TaskSpec(**load_json(ROOT / "examples/golden_cases/task_spec.json"))
        result = run_validation(source, case, task, adapter_name="pytsl", mode="smoke", lint_policy="warn")
        self.assertIn(result.metadata.get("failure_kind"), {"preflight_failure", "config_failure", "runtime_failure"})
        self.assertIn("runtime_stage", result.metadata)


if __name__ == "__main__":
    unittest.main()
