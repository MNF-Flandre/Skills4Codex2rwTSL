import json
import unittest
from pathlib import Path

from tsl_validation.runner import run_validation
from tsl_validation.schemas import TaskSpec, ValidationCase


ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


class TestValidationRunner(unittest.TestCase):
    def test_mock_pass_case_runs_and_matches(self):
        source = (ROOT / "examples/golden_cases/mock_pass_case.tsl").read_text(encoding="utf-8")
        case = ValidationCase(**load_json(ROOT / "examples/golden_cases/case_mock_pass.json"))
        task = TaskSpec(**load_json(ROOT / "examples/golden_cases/task_spec.json"))

        result = run_validation(
            tsl_source=source,
            case=case,
            task_spec=task,
            adapter_name="mock",
            report_path=str(ROOT / "reports" / "test_validation_report.md"),
        )
        self.assertEqual(result.metadata["adapter"], "mock")
        self.assertTrue((ROOT / "reports" / "test_validation_report.md").exists())
        self.assertTrue(any(item.field == "value" for item in result.diff_report.items))
        self.assertFalse(any(item.status == "mismatch" for item in result.diff_report.items))


if __name__ == "__main__":
    unittest.main()
