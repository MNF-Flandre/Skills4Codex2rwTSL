import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

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

    def test_build_runtime_config_env_overrides_template_connection_fields(self):
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
                }
            },
        )
        with patch.dict(
            "os.environ",
            {
                "PYTSL_CONNECTION_MODE": "remote_api",
                "PYTSL_NETWORK_REQUIRED": "true",
                "PYTSL_HOST": "remote-host",
                "PYTSL_PORT": "9443",
                "PYTSL_USERNAME": "alice",
                "PYTSL_PASSWORD": "secret",
            },
            clear=False,
        ):
            cfg = adapter._build_runtime_config(case)
        self.assertEqual(cfg.get("connection_mode"), "remote_api")
        self.assertTrue(cfg.get("network_required"))
        self.assertEqual(cfg.get("host"), "remote-host")
        self.assertEqual(cfg.get("port"), 9443)
        self.assertEqual(cfg.get("username"), "alice")
        self.assertEqual(cfg.get("password"), "secret")

    def test_connection_mode_order_supports_fallback(self):
        adapter = PyTSLAdapter()
        simple_source = "Begin\n  return 1;\nEnd;\n"
        get_bk_source = 'Begin\n  stks := GetBKByDate("SH000016", d);\nEnd;\n'
        self.assertEqual(adapter._connection_mode_order("auto", tsl_source=simple_source), ["remote_api", "local_client_bridge"])
        self.assertEqual(adapter._connection_mode_order("auto", tsl_source=get_bk_source), ["remote_api", "local_client_bridge"])
        self.assertEqual(adapter._connection_mode_order("local_client_bridge", tsl_source=get_bk_source), ["local_client_bridge", "remote_api"])
        self.assertEqual(adapter._connection_mode_order("remote_api", tsl_source=simple_source), ["remote_api", "local_client_bridge"])

    def test_classify_execution_failure_kind_detects_local_bridge_capability_gap(self):
        adapter = PyTSLAdapter()
        error_text = "function:GetBKByDate:GetBKByDatesub:line 55:instruction:sselect: Select/Update/Delete类型不对"
        self.assertEqual(adapter._classify_execution_failure_kind("local_client_bridge", error_text), "local_bridge_capability_gap")
        self.assertEqual(adapter._classify_execution_failure_kind("remote_api", error_text), "execute_failure")

    def test_execute_falls_back_to_second_connection_mode(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(case_id="x", name="x", parameters={})
        task = TaskSpec(task_id="t", objective="o", expected_behavior="e")
        adapter.preflight = Mock(return_value={"overall_ready": True, "connection_mode": "local_client_bridge"})
        adapter._load_runtime_package = Mock(return_value=(object(), {"ok": True}))
        adapter._build_runtime_config = Mock(return_value={"connection_mode": "local_client_bridge"})
        adapter._execute_attempt = Mock(side_effect=[
            {
                "adapter": "pytsl",
                "execution_mode": "pytsl",
                "runtime_status": "failed",
                "failure_kind": "execute_failure",
                "runtime_errors": ["execute_failed", "local failed"],
                "outputs": {},
                "integration": {"stage": "execute", "connection_mode": "local_client_bridge"},
            },
            {
                "adapter": "pytsl",
                "execution_mode": "pytsl",
                "runtime_status": "ok",
                "failure_kind": "",
                "runtime_errors": [],
                "outputs": {"Q2": 81},
                "integration": {"stage": "completed", "connection_mode": "remote_api"},
            },
        ])

        payload = adapter.execute("Begin\n  return 1;\nEnd;\n", case, task)
        self.assertEqual(payload.get("runtime_status"), "ok")
        self.assertEqual(payload.get("outputs", {}).get("Q2"), 81)
        self.assertTrue(payload.get("integration", {}).get("fallback_used"))
        self.assertEqual([a["mode"] for a in payload.get("integration", {}).get("attempts", [])], ["local_client_bridge", "remote_api"])

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
        self.assertEqual(pre.get("runtime_config", {}).get("username"), "<set>")
        self.assertEqual(pre.get("runtime_config", {}).get("password"), "<set>")

    def test_prepare_executable_source_wraps_first_no_arg_function(self):
        adapter = PyTSLAdapter()
        source, info = adapter._prepare_executable_source("Function demo();\nBegin\n  return 1;\nEnd;\n")
        self.assertTrue(info.get("wrapped_entrypoint"))
        self.assertTrue(source.startswith("Begin\n  return demo();\nEnd;"))

    def test_prepare_executable_source_leaves_begin_source_unchanged(self):
        adapter = PyTSLAdapter()
        source, info = adapter._prepare_executable_source("Begin\n  return 1;\nEnd;\n")
        self.assertFalse(info.get("wrapped_entrypoint"))
        self.assertEqual(source, "Begin\n  return 1;\nEnd;\n")

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

    def test_normalize_outputs_preserves_raw_fields_when_smoke_aliases_are_absent(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(
            case_id="hw2",
            name="hw2",
            parameters={
                "output_fields": ["signal", "value"],
                "required_fields": ["signal", "value"],
            },
        )
        outputs, info = adapter._normalize_outputs(
            {"Q2": 81, "Q3": ["2023-10-01", 45200, 20231001]},
            case,
            TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertTrue(info.get("ok"))
        self.assertIsNone(outputs.get("signal"))
        self.assertIsNone(outputs.get("value"))
        self.assertEqual(outputs.get("Q2"), 81)
        self.assertEqual(outputs.get("Q3"), ["2023-10-01", 45200, 20231001])

    def test_normalize_outputs_unwraps_singleton_tabular_wrappers_for_raw_fields(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(case_id="hw3", name="hw3", parameters={})
        outputs, info = adapter._normalize_outputs(
            {
                "Q1": [[{"stock": "SH600000"}]],
                "Q2": [{"stock": "SH600028"}],
                "Q6": [[{"stock": "SH600000"}, {"stock": "SH600009"}]],
            },
            case,
            TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertTrue(info.get("ok"))
        self.assertEqual(outputs.get("Q1"), [{"stock": "SH600000"}])
        self.assertEqual(outputs.get("Q2"), [{"stock": "SH600028"}])
        self.assertEqual(outputs.get("Q6"), [{"stock": "SH600000"}, {"stock": "SH600009"}])

    def test_normalize_outputs_still_unwraps_requested_singleton_fields(self):
        adapter = PyTSLAdapter()
        case = ValidationCase(
            case_id="hw3",
            name="hw3",
            parameters={"output_fields": ["Q1", "Q2"], "required_fields": ["Q1", "Q2"]},
        )
        outputs, info = adapter._normalize_outputs(
            {
                "Q1": [[{"stock": "SH600000"}]],
                "Q2": [{"stock": "SH600028"}],
                "Q6": [[{"stock": "SH600009"}]],
            },
            case,
            TaskSpec(task_id="t", objective="o", expected_behavior="e"),
        )
        self.assertTrue(info.get("ok"))
        self.assertEqual(outputs.get("Q1"), [{"stock": "SH600000"}])
        self.assertEqual(outputs.get("Q2"), {"stock": "SH600028"})
        self.assertEqual(outputs.get("Q6"), [{"stock": "SH600009"}])


if __name__ == "__main__":
    unittest.main()
