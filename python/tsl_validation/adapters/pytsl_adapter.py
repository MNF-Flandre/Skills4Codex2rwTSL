from __future__ import annotations

import importlib
import importlib.util
import inspect
import math
import os
from typing import Any, Dict, List, Optional, Tuple

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


class PyTSLAdapter(TSLRuntimeAdapter):
    """pyTSL/TSLPy integration skeleton for local credentialed live runs.

    This adapter provides a complete staged execution skeleton while leaving unknown SDK
    specifics as explicit TODO(integration point).
    """

    name = "pytsl"
    DEFAULT_OUTPUT_FIELDS = ["signal", "value", "series_tail", "window"]
    PROBLEM_RUNTIME_PACKAGE_MISSING = "runtime_package_missing"
    PROBLEM_RUNTIME_CONFIG_MISSING = "runtime_config_missing"
    PROBLEM_RUNTIME_CASE_MISSING = "runtime_case_missing"
    PROBLEM_EXECUTE_PATH_NOT_IMPLEMENTED = "execute_path_not_implemented"

    def _runtime_case(self, case: ValidationCase) -> Dict[str, Any]:
        runtime_case = case.parameters.get("runtime_case", {})
        if not isinstance(runtime_case, dict):
            runtime_case = {}
        return runtime_case

    def _load_runtime_package(self) -> Tuple[Optional[Any], Dict[str, Any]]:
        candidates = ["pytsl", "tslpy"]
        tried: List[str] = []
        for mod_name in candidates:
            tried.append(mod_name)
            spec = importlib.util.find_spec(mod_name)
            if spec is None:
                continue
            try:
                module = importlib.import_module(mod_name)
                return module, {
                    "ok": True,
                    "module_name": mod_name,
                    "tried": tried,
                    "error": "",
                }
            except Exception as exc:
                return None, {
                    "ok": False,
                    "module_name": mod_name,
                    "tried": tried,
                    "error": f"failed_to_import:{exc}",
                }
        return None, {
            "ok": False,
            "module_name": "",
            "tried": tried,
            "error": "runtime package not found",
        }

    def _build_runtime_config(self, case: ValidationCase) -> Dict[str, Any]:
        live = self._runtime_case(case)

        def choose(key: str, env_key: str) -> Any:
            return live.get(key) if live.get(key) not in {None, ""} else os.getenv(env_key)

        config = {
            "server": choose("server", "PYTSL_SERVER"),
            "runtime": choose("runtime", "PYTSL_RUNTIME"),
            "auth": choose("auth", "PYTSL_AUTH_TOKEN"),
            "symbol": choose("symbol", "PYTSL_SYMBOL"),
            "period": choose("period", "PYTSL_PERIOD"),
            "start_date": live.get("start_date") or os.getenv("PYTSL_START_DATE"),
            "end_date": live.get("end_date") or os.getenv("PYTSL_END_DATE"),
            "market": live.get("market") or os.getenv("PYTSL_MARKET"),
            "adjust_mode": live.get("adjust_mode") or os.getenv("PYTSL_ADJUST_MODE"),
            "extra_system_params": live.get("extra_system_params") or os.getenv("PYTSL_EXTRA_SYSTEM_PARAMS"),
            "output_fields": live.get("output_fields") or case.parameters.get("output_fields", []),
            "compare_fields": case.parameters.get("compare_fields", []),
            "required_fields": case.parameters.get("required_fields", []),
            "field_types": case.parameters.get("field_types", {}),
        }
        return config

    def _case_requirements(self, case: ValidationCase) -> Dict[str, Any]:
        live = self._runtime_case(case)
        is_live = bool(live)
        required_for_live = ["symbol", "period", "start_date", "end_date"]
        missing_live = [k for k in required_for_live if not live.get(k)] if is_live else []
        return {
            "is_live_case": is_live,
            "missing_live_fields": missing_live,
        }

    def _expected_sdk_functions(self, module: Any) -> Dict[str, bool]:
        # TODO(integration point): replace heuristic checks with concrete SDK function map.
        attrs = {
            "connect": hasattr(module, "connect") or hasattr(module, "Connect") or hasattr(module, "Client"),
            "execute": hasattr(module, "execute") or hasattr(module, "run") or hasattr(module, "Client"),
        }
        return attrs

    def is_implemented(self, module: Any = None) -> bool:
        if module is None:
            module, info = self._load_runtime_package()
            if not info.get("ok") or module is None:
                return False
        attrs = self._expected_sdk_functions(module)
        return bool(attrs.get("connect") and attrs.get("execute"))

    def preflight(self, case: ValidationCase) -> Dict[str, Any]:
        module, pkg = self._load_runtime_package()
        runtime_config = self._build_runtime_config(case)
        case_req = self._case_requirements(case)

        missing_config = [k for k in ["server", "runtime", "auth"] if not runtime_config.get(k)]
        package_ready = bool(pkg.get("ok"))
        config_ready = not missing_config
        case_ready = not case_req.get("missing_live_fields")
        implemented = self.is_implemented(module=module) if module is not None else False

        problems: List[str] = []
        if not package_ready:
            problems.append(self.PROBLEM_RUNTIME_PACKAGE_MISSING)
        if not config_ready:
            problems.append(
                {
                    "kind": self.PROBLEM_RUNTIME_CONFIG_MISSING,
                    "missing": missing_config,
                }
            )
        if case_req.get("is_live_case") and not case_ready:
            problems.append(
                {
                    "kind": self.PROBLEM_RUNTIME_CASE_MISSING,
                    "missing": case_req.get("missing_live_fields", []),
                }
            )
        if not implemented:
            problems.append(self.PROBLEM_EXECUTE_PATH_NOT_IMPLEMENTED)

        overall_ready = package_ready and config_ready and case_ready and implemented

        return {
            "package_ready": package_ready,
            "config_ready": config_ready,
            "case_ready": case_ready,
            "implemented": implemented,
            "overall_ready": overall_ready,
            "problems": problems,
            "package": pkg,
            "runtime_config": runtime_config,
            "case_requirements": case_req,
            "todo": "TODO(integration point): wire exact SDK capability checks for implementation readiness.",
        }

    def check_environment(self) -> Dict[str, Any]:
        module, pkg = self._load_runtime_package()
        cfg = self._build_runtime_config(ValidationCase(case_id="env", name="env", input_series=[], parameters={}))
        missing_required = [k for k in ["server", "runtime", "auth"] if not cfg.get(k)]
        available = bool(pkg.get("ok")) and not missing_required
        return {
            "available": available,
            "implemented": self.is_implemented(module=module) if module is not None else False,
            "packages": [pkg.get("module_name")] if pkg.get("module_name") else [],
            "runtime_config": cfg,
            "missing_required": missing_required,
            "package_info": pkg,
        }

    def _connect(self, runtime_module: Any, runtime_config: Dict[str, Any]) -> Tuple[Optional[Any], Dict[str, Any]]:
        # TODO(integration point): replace heuristic with concrete pyTSL/TSLPy connect call.
        connect_fn = getattr(runtime_module, "connect", None)
        if callable(connect_fn):
            try:
                conn = connect_fn(
                    server=runtime_config.get("server"),
                    runtime=runtime_config.get("runtime"),
                    auth=runtime_config.get("auth"),
                )
                return conn, {"ok": True, "stage": "connect", "error": ""}
            except Exception as exc:
                return None, {"ok": False, "stage": "connect", "error": str(exc)}

        if hasattr(runtime_module, "Client"):
            try:
                client = runtime_module.Client(
                    server=runtime_config.get("server"),
                    runtime=runtime_config.get("runtime"),
                    auth=runtime_config.get("auth"),
                )
                return client, {
                    "ok": True,
                    "stage": "connect",
                    "error": "",
                    "todo": "TODO(integration point): verify Client constructor/handshake contract.",
                }
            except Exception as exc:
                return None, {"ok": False, "stage": "connect", "error": str(exc)}

        return None, {
            "ok": False,
            "stage": "connect",
            "error": "No supported connect entrypoint discovered on runtime module.",
            "todo": "TODO(integration point): map actual SDK connect API.",
        }

    def _execute_tsl(
        self,
        connection: Any,
        runtime_module: Any,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
        runtime_config: Dict[str, Any],
    ) -> Tuple[Optional[Any], Dict[str, Any]]:
        live = self._runtime_case(case)
        payload = {
            "tsl_source": tsl_source,
            "symbol": runtime_config.get("symbol"),
            "period": runtime_config.get("period"),
            "start_date": runtime_config.get("start_date"),
            "end_date": runtime_config.get("end_date"),
            "market": runtime_config.get("market"),
            "adjust_mode": runtime_config.get("adjust_mode"),
            "extra_system_params": runtime_config.get("extra_system_params"),
            "task_id": task_spec.task_id,
            "runtime_case": live,
        }

        # TODO(integration point): replace generic execute/run calling with concrete SDK API.
        execute_fn = None
        for obj, name in [
            (connection, "execute"),
            (connection, "run"),
            (runtime_module, "execute"),
            (runtime_module, "run"),
        ]:
            fn = getattr(obj, name, None)
            if callable(fn):
                execute_fn = fn
                break

        if execute_fn is None:
            return None, {
                "ok": False,
                "stage": "execute",
                "error": "No supported execute entrypoint discovered on connection/module.",
                "expected_contract": {
                    "inputs": ["tsl_source", "symbol", "period", "start_date", "end_date", "runtime params"],
                    "outputs": ["signal", "value", "series-like fields or records"],
                },
                "todo": "TODO(integration point): bind concrete execute API and payload shape.",
            }

        try:
            sig = inspect.signature(execute_fn)
            params = sig.parameters
            if len(params) == 1 and "payload" in params:
                raw_result = execute_fn(payload)
            elif "tsl_source" in params:
                raw_result = execute_fn(
                    tsl_source=tsl_source,
                    **{k: v for k, v in payload.items() if k != "tsl_source"},
                )
            else:
                raw_result = execute_fn(payload)
            return raw_result, {"ok": True, "stage": "execute", "error": ""}
        except Exception as exc:
            return None, {"ok": False, "stage": "execute", "error": str(exc)}

    def _coerce_scalar(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            if isinstance(value, float) and math.isnan(value):
                return None
            return value
        return value

    def _tail_from_sequence(self, seq: Any, size: int = 3) -> List[Any]:
        if isinstance(seq, list):
            return [self._coerce_scalar(x) for x in seq[-size:]]
        return []

    def _normalize_outputs(self, raw_result: Any, case: ValidationCase, task_spec: TaskSpec) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        normalize_errors: List[str] = []
        debug_summary: Dict[str, Any] = {
            "raw_type": type(raw_result).__name__,
        }

        output_fields = list(case.parameters.get("output_fields", []))
        compare_fields = list(case.parameters.get("compare_fields", []))
        required_fields = list(case.parameters.get("required_fields", []))
        wanted = list(
            dict.fromkeys(output_fields + compare_fields + required_fields + self.DEFAULT_OUTPUT_FIELDS)
        )

        outputs: Dict[str, Any] = {}
        source_map: Dict[str, Any] = {}

        raw_dict: Dict[str, Any] = {}
        if isinstance(raw_result, dict):
            raw_dict = raw_result
        elif isinstance(raw_result, list):
            raw_dict = {"records": raw_result}
        else:
            raw_dict = {"value": raw_result}

        debug_summary["raw_keys"] = sorted(raw_dict.keys())[:20]

        def pick_field(field: str) -> Any:
            candidates = [field, field.lower(), field.upper()]
            alias = {
                "signal": ["signal", "sig", "lead_signal", "buy"],
                "value": ["value", "val", "avg", "score"],
                "window": ["window", "n"],
                "series_tail": ["series_tail", "tail", "close_tail"],
            }
            for name in alias.get(field, []):
                candidates.extend([name, name.lower(), name.upper()])
            for c in candidates:
                if c in raw_dict:
                    return raw_dict.get(c)
            records = raw_dict.get("records")
            if isinstance(records, list) and records:
                last = records[-1]
                if isinstance(last, dict):
                    for c in candidates:
                        if c in last:
                            return last.get(c)
            return None

        for field in wanted:
            raw_value = pick_field(field)
            if isinstance(raw_value, list) and field != "series_tail":
                outputs[field] = self._coerce_scalar(raw_value[-1]) if raw_value else None
                source_map[field] = "sequence_last"
            elif field == "series_tail":
                outputs[field] = self._tail_from_sequence(raw_value) if raw_value is not None else []
                source_map[field] = "tail"
            else:
                outputs[field] = self._coerce_scalar(raw_value)
                source_map[field] = "scalar"

        if outputs.get("series_tail") == [] and isinstance(raw_dict.get("records"), list):
            series = []
            for row in raw_dict.get("records", [])[-3:]:
                if isinstance(row, dict):
                    for key in ["close", "value", "avg"]:
                        if key in row:
                            series.append(self._coerce_scalar(row.get(key)))
                            break
            outputs["series_tail"] = series
            source_map["series_tail"] = "records_derived"

        for required in required_fields:
            if outputs.get(required) is None:
                normalize_errors.append(f"missing_or_unmapped_required_output:{required}")

        debug_summary["mapped_fields"] = source_map
        debug_summary["normalization_errors"] = normalize_errors

        return outputs, {
            "ok": not normalize_errors,
            "errors": normalize_errors,
            "raw_summary": debug_summary,
        }

    def _disconnect(self, connection: Any) -> Dict[str, Any]:
        if connection is None:
            return {"ok": True, "stage": "disconnect", "error": ""}
        for method in ["disconnect", "close"]:
            if hasattr(connection, method) and callable(getattr(connection, method)):
                try:
                    getattr(connection, method)()
                    return {"ok": True, "stage": "disconnect", "error": ""}
                except Exception as exc:
                    return {"ok": False, "stage": "disconnect", "error": str(exc)}
        return {
            "ok": True,
            "stage": "disconnect",
            "error": "",
            "todo": "TODO(integration point): confirm proper teardown call for SDK client/session.",
        }

    def execute(
        self,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
        preflight = self.preflight(case)
        if not preflight.get("overall_ready"):
            return {
                "adapter": self.name,
                "execution_mode": "pytsl",
                "runtime_status": "failed",
                "runtime_errors": [
                    "pyTSL preflight failed before execute.",
                    *preflight.get("problems", []),
                ],
                "outputs": {},
                "integration": {
                    "stage": "preflight",
                    "preflight": preflight,
                    "todo": "TODO(integration point): satisfy preflight and execute with real pyTSL SDK contract.",
                },
            }

        runtime_module, pkg = self._load_runtime_package()
        if runtime_module is None:
            return {
                "adapter": self.name,
                "execution_mode": "pytsl",
                "runtime_status": "failed",
                "runtime_errors": ["runtime_package_load_failed", pkg.get("error", "unknown")],
                "outputs": {},
                "integration": {
                    "stage": "load_runtime_package",
                    "package": pkg,
                },
            }

        runtime_config = self._build_runtime_config(case)

        connection = None
        connect_info = {"ok": False, "stage": "connect", "error": "not_started"}
        execute_info = {"ok": False, "stage": "execute", "error": "not_started"}
        disconnect_info = {"ok": True, "stage": "disconnect", "error": ""}

        try:
            connection, connect_info = self._connect(runtime_module, runtime_config)
            if not connect_info.get("ok"):
                return {
                    "adapter": self.name,
                    "execution_mode": "pytsl",
                    "runtime_status": "failed",
                    "runtime_errors": ["connect_failed", connect_info.get("error", "unknown")],
                    "outputs": {},
                    "integration": {
                        "stage": "connect",
                        "preflight": preflight,
                        "connect": connect_info,
                        "runtime_config_summary": {
                            "symbol": runtime_config.get("symbol"),
                            "period": runtime_config.get("period"),
                            "start_date": runtime_config.get("start_date"),
                            "end_date": runtime_config.get("end_date"),
                        },
                    },
                }

            raw_result, execute_info = self._execute_tsl(
                connection=connection,
                runtime_module=runtime_module,
                tsl_source=tsl_source,
                case=case,
                task_spec=task_spec,
                runtime_config=runtime_config,
            )
            if not execute_info.get("ok"):
                return {
                    "adapter": self.name,
                    "execution_mode": "pytsl",
                    "runtime_status": "failed",
                    "runtime_errors": ["execute_failed", execute_info.get("error", "unknown")],
                    "outputs": {},
                    "integration": {
                        "stage": "execute",
                        "preflight": preflight,
                        "connect": connect_info,
                        "execute": execute_info,
                        "expected_execute_contract": {
                            "inputs": ["tsl_source", "runtime_case(symbol/period/date_range)", "runtime_config"],
                            "outputs": ["raw records or dict with signal/value-like fields"],
                            "todo": "TODO(integration point): align with real pyTSL execute signature and return schema.",
                        },
                    },
                }

            outputs, normalize_info = self._normalize_outputs(raw_result=raw_result, case=case, task_spec=task_spec)
            if not normalize_info.get("ok"):
                return {
                    "adapter": self.name,
                    "execution_mode": "pytsl",
                    "runtime_status": "failed",
                    "runtime_errors": ["normalize_outputs_failed", *normalize_info.get("errors", [])],
                    "outputs": outputs,
                    "integration": {
                        "stage": "normalize_outputs",
                        "preflight": preflight,
                        "connect": connect_info,
                        "execute": execute_info,
                        "normalize": normalize_info,
                    },
                }

            return {
                "adapter": self.name,
                "execution_mode": "pytsl",
                "runtime_status": "ok",
                "runtime_errors": [],
                "outputs": outputs,
                "integration": {
                    "stage": "completed",
                    "preflight": preflight,
                    "connect": connect_info,
                    "execute": execute_info,
                    "normalize": normalize_info,
                },
                "intermediate": {
                    "runtime_case": self._runtime_case(case),
                    "runtime_config_summary": {
                        "symbol": runtime_config.get("symbol"),
                        "period": runtime_config.get("period"),
                        "start_date": runtime_config.get("start_date"),
                        "end_date": runtime_config.get("end_date"),
                    },
                },
            }

        finally:
            disconnect_info = self._disconnect(connection)
            _ = disconnect_info
