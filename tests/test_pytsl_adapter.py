import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


ROOT = Path(__file__).resolve().parents[1]


class TestPyTSLAdapter(unittest.TestCase):
    def test_build_runtime_config_reads_connection_env(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(case_id="live", name="live", parameters={"runtime_case": {}})
        with patch.dict(
            "os.environ",
            {
                "PYTSL_CONNECTION_MODE": "remote_api",
                "PYTSL_HOST": "TODO_LOCAL_HOST",
                "PYTSL_PORT": "443",
                "PYTSL_USERNAME": "alice",
                "PYTSL_PASSWORD": "secret",
            },
            clear=False,
        ):
            cfg = adapter._build_runtime_config(case)
        self.assertEqual(cfg.get("connection_mode"), "remote_api")
        self.assertEqual(cfg.get("host"), "TODO_LOCAL_HOST")
        self.assertEqual(cfg.get("port"), 443)
        self.assertEqual(cfg.get("username"), "alice")
        self.assertEqual(cfg.get("password"), "secret")

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
                    "connection_mode": "remote_api",
                    "network_required": True,
                    "host": "TODO_LOCAL_HOST",
                    "port": 443,
                    "username": "alice",
                    "password": "secret",
                    "symbol": "000001.SH",
                    "period": "DAY",
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                }
            },
        )
        pre = adapter.preflight(case)
        for key in ["package_ready", "config_ready", "case_ready", "network_ready", "sdk_ready", "connection_mode", "overall_ready", "problems"]:
            self.assertIn(key, pre)

    def test_preflight_backfills_env_for_local_bridge(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(
            case_id="live",
            name="live",
            parameters={
                "runtime_case": {
                    "connection_mode": "local_client_bridge",
                    "network_required": False,
                    "host": "TODO_LOCAL_HOST",
                    "port": 443,
                    "username": "",
                    "password": "",
                    "symbol": "000001.SH",
                    "period": "DAY",
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                }
            },
        )
        with patch.dict(
            "os.environ",
            {
                "PYTSL_CONNECTION_MODE": "local_client_bridge",
                "PYTSL_USERNAME": "alice",
                "PYTSL_PASSWORD": "secret",
            },
            clear=False,
        ):
            pre = adapter.preflight(case)
        self.assertTrue(pre.get("case_ready"))
        self.assertTrue(pre.get("config_ready"))
        self.assertEqual(pre.get("runtime_config", {}).get("username"), "alice")
        self.assertEqual(pre.get("runtime_config", {}).get("password"), "secret")

    def test_normalize_outputs_handles_tuple_scalars_series_and_aliases(self):
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
            (
                0,
                [b"buy", True, b"score", float("nan"), b"series_tail", (1, 2, 3), b"n", 5],
                b"",
                0,
            ),
            case,
            TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertEqual(outputs.get("signal"), 1.0)
        self.assertIsNone(outputs.get("value"))
        self.assertEqual(outputs.get("series_tail"), [1, 2, 3])
        self.assertEqual(outputs.get("window"), 5)
        self.assertIn("ok", info)

    def test_normalize_outputs_decodes_bytes_keys_from_dict_payload(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(
            case_id="hw2",
            name="hw2",
            parameters={
                "output_fields": ["Q2", "Q3", "Q4"],
                "required_fields": ["Q2", "Q3", "Q4"],
            },
        )
        outputs, info = adapter._normalize_outputs(
            {
                b"Q2": 81,
                b"Q3": [b"2023-10-01", 45200, 20231001],
                b"Q4": {"字符串".encode("gbk"): b"2023-10-01", "日期".encode("gbk"): 45200, "整数".encode("gbk"): 20231001},
            },
            case,
            TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertEqual(outputs.get("Q2"), 81)
        self.assertEqual(outputs.get("Q3"), ["2023-10-01", 45200, 20231001])
        self.assertEqual(outputs.get("Q4"), {"字符串": "2023-10-01", "日期": 45200, "整数": 20231001})
        self.assertTrue(info.get("ok"))


if __name__ == "__main__":
    unittest.main()
