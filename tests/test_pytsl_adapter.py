import json
import tempfile
import unittest
from pathlib import Path

from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


ROOT = Path(__file__).resolve().parents[1]


class TestPyTSLAdapter(unittest.TestCase):
    def test_unconfigured_environment_returns_graceful_failure(self):
        adapter = PyTSLAdapter()
        payload = adapter.execute(
            tsl_source="begin signal := MA(close, 3); end",
            case=ValidationCase(case_id="x", name="x", input_series=[1, 2, 3], parameters={}),
            task_spec=TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertEqual(payload.get("runtime_status"), "failed")
        self.assertIn("runtime_errors", payload)
        self.assertIn("integration", payload)
        self.assertEqual(payload.get("integration", {}).get("stage"), "preflight")

    def test_check_environment_contains_implemented_flag(self):
        adapter = PyTSLAdapter()
        info = adapter.check_environment()
        self.assertIn("implemented", info)

    def test_preflight_structure(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(
            case_id="live",
            name="live",
            parameters={
                "runtime_case": {
                    "symbol": "000001.SH",
                    "period": "DAY",
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                }
            },
        )
        pre = adapter.preflight(case)
        for key in ["package_ready", "config_ready", "case_ready", "implemented", "overall_ready", "problems"]:
            self.assertIn(key, pre)

    def test_normalize_outputs_handles_scalars_and_series(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(
            case_id="x",
            name="x",
            parameters={
                "required_fields": ["signal", "value"],
                "output_fields": ["signal", "value", "series_tail"],
            },
        )
        outputs, info = adapter._normalize_outputs(
            {
                "records": [
                    {"value": 1.0, "signal": False},
                    {"value": 2.0, "signal": True},
                ],
                "window": 3,
            },
            case,
            TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertEqual(outputs.get("value"), 2.0)
        self.assertEqual(outputs.get("signal"), 1.0)
        self.assertIn("series_tail", outputs)
        self.assertIn("ok", info)


if __name__ == "__main__":
    unittest.main()
