import unittest

from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


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

    def test_check_environment_contains_implemented_flag(self):
        adapter = PyTSLAdapter()
        info = adapter.check_environment()
        self.assertIn("implemented", info)
        self.assertFalse(info["implemented"])


if __name__ == "__main__":
    unittest.main()
