import json
import os
import unittest
from pathlib import Path

from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


ROOT = Path(__file__).resolve().parents[1]


def _load_case(path: Path) -> ValidationCase:
    return ValidationCase(**json.loads(path.read_text(encoding="utf-8")))


@unittest.skipUnless(os.getenv("RUN_PYTSL_LIVE") == "1", "set RUN_PYTSL_LIVE=1 to run live pyTSL tests")
class TestLivePyTSLIntegration(unittest.TestCase):
    def test_live_preflight_template(self):
        case = _load_case(ROOT / "examples" / "live_cases" / "live_smoke_case.json")
        preflight = PyTSLAdapter().preflight(case)
        self.assertIn("overall_ready", preflight)
        self.assertIn("problems", preflight)

    def test_live_smoke_execute_shell(self):
        case = _load_case(ROOT / "examples" / "live_cases" / "live_smoke_case.json")
        task = TaskSpec(
            task_id="live_smoke",
            objective="Live pyTSL smoke run",
            expected_behavior="Runtime should execute and return outputs",
        )
        payload = PyTSLAdapter().execute(
            tsl_source="begin value := MA(close, 3); signal := value > close; end",
            case=case,
            task_spec=task,
        )
        self.assertIn("runtime_status", payload)
        self.assertIn("integration", payload)


if __name__ == "__main__":
    unittest.main()
