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
        if not os.getenv("PYTSL_USERNAME") or not os.getenv("PYTSL_PASSWORD") or not os.getenv("PYTSL_SDK_PATH"):
            self.skipTest("set PYTSL_USERNAME/PYTSL_PASSWORD/PYTSL_SDK_PATH for live pyTSL smoke runs")
        case = _load_case(ROOT / "examples" / "live_cases" / "live_smoke_case.json")
        task = TaskSpec(
            task_id="live_smoke",
            objective="Live pyTSL smoke run",
            expected_behavior="Runtime should execute and return outputs",
        )
        payload = PyTSLAdapter().execute(
            tsl_source=(ROOT / "examples" / "live_cases" / "live_smoke_source.tsl").read_text(encoding="utf-8"),
            case=case,
            task_spec=task,
        )
        self.assertIn("runtime_status", payload)
        self.assertIn("integration", payload)
        self.assertEqual(payload.get("runtime_status"), "ok")
        self.assertIn("signal", payload.get("outputs", {}))
        self.assertIn("value", payload.get("outputs", {}))


if __name__ == "__main__":
    unittest.main()
