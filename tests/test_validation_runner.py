import json
import tempfile
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

    def test_mock_pass_case_oracle_passes(self):
        source, case, task = self._load("mock_pass_case.tsl", "case_mock_pass.json")
        report_path = Path(tempfile.gettempdir()) / "test_validation_report.md"
        result = run_validation(
            tsl_source=source,
            case=case,
            task_spec=task,
            adapter_name="mock",
            mode="oracle",
            report_path=str(report_path),
        )
        self.assertEqual(result.metadata["status"], "pass")
        self.assertEqual(result.metadata["failure_kind"], "")
        self.assertFalse(any(item.status == "mismatch" for item in result.diff_report.items))

    def test_tsl_source_affects_output(self):
        source_a = (ROOT / "examples/golden_cases/mock_pass_case.tsl").read_text(encoding="utf-8")
        source_b = (ROOT / "examples/golden_cases/spec_fail_case.tsl").read_text(encoding="utf-8")
        case = ValidationCase(**load_json(ROOT / "examples/golden_cases/case_mock_pass.json"))
        task = TaskSpec(**load_json(ROOT / "examples/golden_cases/task_spec.json"))

        result_a = run_validation(source_a, case, task, adapter_name="mock", mode="smoke")
        result_b = run_validation(source_b, case, task, adapter_name="mock", mode="smoke")
        self.assertNotEqual(result_a.tsl_output.get("signal"), result_b.tsl_output.get("signal"))

    def test_semantic_mismatch_case_oracle_fails(self):
        source, case, task = self._load("semantic_mismatch_case.tsl", "case_semantic_mismatch.json")
        result = run_validation(source, case, task, adapter_name="mock", mode="oracle")
        self.assertEqual(result.metadata["failure_kind"], "oracle_mismatch")
        self.assertGreater(result.metadata["mismatch_count"], 0)

    def test_smoke_pass_but_spec_fail(self):
        source, case, task = self._load("spec_fail_case.tsl", "case_spec_fail.json")
        smoke = run_validation(source, case, task, adapter_name="mock", mode="smoke")
        spec = run_validation(source, case, task, adapter_name="mock", mode="spec")
        self.assertEqual(smoke.metadata["status"], "pass")
        self.assertEqual(spec.metadata["failure_kind"], "spec_failure")


if __name__ == "__main__":
    unittest.main()
