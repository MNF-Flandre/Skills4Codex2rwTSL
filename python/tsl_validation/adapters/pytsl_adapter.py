from __future__ import annotations

import importlib
import importlib.util
import inspect
import math
import os
import re
import socket
import ssl
import sys
import time
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
    PROBLEM_NETWORK_UNREACHABLE = "network_unreachable"
    PROBLEM_TLS_HANDSHAKE_FAILED = "tls_handshake_failed"
    PROBLEM_SDK_NOT_READY = "sdk_not_ready"
    PROBLEM_EXECUTE_PATH_NOT_IMPLEMENTED = "execute_path_not_implemented"
    CONNECTION_MODES = {"remote_api", "local_client_bridge", "auto"}
    VERSIONED_SDK_MODULES = [
        "TSLPy314",
        "TSLPy313",
        "TSLPy312",
        "TSLPy311",
        "TSLPy310",
        "TSLPy39",
        "TSLPy38",
        "TSLPy37",
        "TSLPy36",
        "TSLPy35",
        "TSLPy34",
        "TSLPy3",
        "TSLPy2",
        "pytsl",
        "tslpy",
    ]

    @staticmethod
    def default_local_bridge_smoke_source() -> str:
        return (
            "begin\n"
            '  return array("signal", 1, "value", 1, "series_tail", array(1,2,3), "window", 3);\n'
            "end;\n"
        )

    def _env(self, key: str, default: Any = None) -> Any:
        value = os.getenv(key)
        return default if value in {None, ""} else value

    def _choose(self, live: Dict[str, Any], keys: List[str], env_key: str, default: Any = None) -> Any:
        for key in keys:
            value = live.get(key)
            if value not in {None, ""}:
                return value
        env_value = self._env(env_key)
        if env_value not in {None, ""}:
            return env_value
        return default

    def _choose_env_first(self, live: Dict[str, Any], keys: List[str], env_key: str, default: Any = None) -> Any:
        env_value = self._env(env_key)
        if env_value not in {None, ""}:
            return env_value
        return self._choose(live, keys, env_key, default)

    def _choose_int(self, live: Dict[str, Any], keys: List[str], env_key: str, default: Any = None) -> Any:
        value = self._choose(live, keys, env_key, default)
        if value in {None, ""}:
            return default
        try:
            return int(value)
        except Exception:
            return value

    def _choose_int_env_first(self, live: Dict[str, Any], keys: List[str], env_key: str, default: Any = None) -> Any:
        value = self._choose_env_first(live, keys, env_key, default)
        if value in {None, ""}:
            return default
        try:
            return int(value)
        except Exception:
            return value

    def _parse_bool(self, value: Any, default: bool = False) -> bool:
        if value in {None, ""}:
            return default
        if isinstance(value, bool):
            return value
        text = str(value).strip().lower()
        if text in {"1", "true", "yes", "y", "on"}:
            return True
        if text in {"0", "false", "no", "n", "off"}:
            return False
        return default

    def _runtime_case(self, case: ValidationCase) -> Dict[str, Any]:
        runtime_case = case.parameters.get("runtime_case", {})
        if not isinstance(runtime_case, dict):
            runtime_case = {}
        return runtime_case

    def _candidate_sdk_paths(self) -> List[str]:
        keys = [
            "PYTSL_SDK_PATH",
            "PYTSL_PATH",
            "TSLPY_PATH",
            "TSL_HOME",
            "TINYSOFT_HOME",
            "TINYSOFT_PATH",
            "TSL_CLIENT_DIR",
            "TSL_CLIENT_HOME",
        ]
        paths: List[str] = []
        for key in keys:
            value = self._env(key)
            if value:
                paths.append(str(value))
        for path in sys.path:
            if path and any(token in path.lower() for token in ["pytsl", "tslpy", "tinysoft", "tsl"]):
                paths.append(path)
        deduped: List[str] = []
        for path in paths:
            if path not in deduped:
                deduped.append(path)
        return deduped

    def _prepare_sdk_search_paths(self) -> None:
        seen = getattr(self, "_sdk_search_paths_seen", set())
        for path in self._candidate_sdk_paths():
            if not path or not os.path.isdir(path) or path in seen:
                continue
            if path not in sys.path:
                sys.path.insert(0, path)
            if os.name == "nt" and hasattr(os, "add_dll_directory"):
                try:
                    handle = os.add_dll_directory(path)
                    handles = getattr(self, "_sdk_dll_handles", [])
                    handles.append(handle)
                    self._sdk_dll_handles = handles
                except Exception:
                    pass
            seen.add(path)
        self._sdk_search_paths_seen = seen

    def _probe_runtime_modules(self) -> Dict[str, Any]:
        self._prepare_sdk_search_paths()
        candidates = list(self.VERSIONED_SDK_MODULES)
        probe: List[Dict[str, Any]] = []
        importable = []
        for mod_name in candidates:
            spec = importlib.util.find_spec(mod_name)
            item: Dict[str, Any] = {
                "name": mod_name,
                "found": bool(spec),
                "origin": getattr(spec, "origin", "") if spec else "",
                "loader": type(getattr(spec, "loader", None)).__name__ if spec and getattr(spec, "loader", None) else "",
            }
            if spec:
                try:
                    module = importlib.import_module(mod_name)
                    item["import_ok"] = True
                    item["module_file"] = getattr(module, "__file__", "")
                    item["entrypoints"] = self._discover_entrypoints(module)
                    importable.append(mod_name)
                except Exception as exc:
                    item["import_ok"] = False
                    item["import_error"] = f"{type(exc).__name__}: {exc}"
            else:
                item["import_ok"] = False
                item["import_error"] = "module not found"
            probe.append(item)
        return {
            "candidates": probe,
            "importable_modules": importable,
            "candidate_paths": self._candidate_sdk_paths(),
        }

    def _discover_entrypoints(self, module: Any) -> Dict[str, Any]:
        connect_names = [
            "ConnectServer",
            "LoginServer",
            "DefaultConnectAndLogin",
            "Disconnect",
            "SetService",
            "SetComputeBitsOption",
            "GetService",
            "Logined",
            "LoginedUser",
            "RemoteAddress",
            "RemotePort",
        ]
        execute_names = [
            "RemoteExecute",
            "RemoteCallFunc",
            "LocalExecute",
            "LocalCallFunc",
        ]
        entrypoints: Dict[str, Any] = {
            "connect": [name for name in connect_names if hasattr(module, name)],
            "execute": [name for name in execute_names if hasattr(module, name)],
        }
        entrypoints["remote_execute"] = [name for name in ["RemoteExecute", "RemoteCallFunc"] if hasattr(module, name)]
        entrypoints["local_execute"] = [name for name in ["LocalExecute", "LocalCallFunc"] if hasattr(module, name)]
        entrypoints["sdk_ready"] = bool(entrypoints["connect"] and entrypoints["execute"])
        return entrypoints

    def _expected_sdk_functions(self, module: Any) -> Dict[str, bool]:
        attrs = self._discover_entrypoints(module)
        return {
            "connect": bool(attrs.get("connect")),
            "execute": bool(attrs.get("execute")),
        }

    def _network_probe(self, host: Any, port: Any, timeout: float = 5.0) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "host": host,
            "port": port,
            "tcp_port_open": False,
            "network_reachable": False,
            "tls_ready": False,
            "latency_ms": None,
            "error": "",
        }
        if not host or port in {None, ""}:
            result["error"] = "missing_host_or_port"
            return result
        try:
            start = time.time()
            with socket.create_connection((str(host), int(port)), timeout=timeout) as sock:
                result["tcp_port_open"] = True
                result["network_reachable"] = True
                result["latency_ms"] = round((time.time() - start) * 1000.0, 1)
                try:
                    context = ssl.create_default_context()
                    context.check_hostname = False
                    context.verify_mode = ssl.CERT_NONE
                    with context.wrap_socket(sock, server_hostname=str(host)) as secure_sock:
                        secure_sock.do_handshake()
                        result["tls_ready"] = True
                        try:
                            cert = secure_sock.getpeercert()
                            result["tls_subject"] = cert.get("subject", [])
                        except Exception as exc:
                            result["tls_subject_error"] = f"{type(exc).__name__}: {exc}"
                except Exception as exc:
                    result["tls_ready"] = False
                    result["tls_error"] = f"{type(exc).__name__}: {exc}"
        except Exception as exc:
            result["error"] = f"{type(exc).__name__}: {exc}"
        return result

    def _connection_mode_hint(self, runtime_config: Dict[str, Any], module: Any = None) -> Dict[str, Any]:
        explicit = runtime_config.get("connection_mode")
        if explicit == "auto":
            return {
                "connection_mode": "auto",
                "source": "explicit",
                "reason": "auto mode supplied by case/env; execution will fallback across modes",
            }
        if explicit in self.CONNECTION_MODES:
            return {
                "connection_mode": explicit,
                "source": "explicit",
                "reason": "connection_mode supplied by case/env",
            }
        sdk_probe = self._probe_runtime_modules() if module is None else self._discover_entrypoints(module)
        if isinstance(sdk_probe, dict) and sdk_probe.get("sdk_ready"):
            return {
                "connection_mode": "local_client_bridge",
                "source": "auto",
                "reason": "local sdk entrypoints discovered",
            }
        return {
            "connection_mode": "remote_api",
            "source": "auto",
            "reason": "default school host/port flow; no local sdk module discovered",
        }

    def _load_runtime_package(self) -> Tuple[Optional[Any], Dict[str, Any]]:
        probe = self._probe_runtime_modules()
        tried = [item["name"] for item in probe["candidates"]]
        for item in probe["candidates"]:
            if not item.get("import_ok"):
                continue
            try:
                module = importlib.import_module(item["name"])
                return module, {
                    "ok": True,
                    "module_name": item["name"],
                    "tried": tried,
                    "probe": probe,
                    "error": "",
                }
            except Exception as exc:
                return None, {
                    "ok": False,
                    "module_name": item["name"],
                    "tried": tried,
                    "probe": probe,
                    "error": f"failed_to_import:{type(exc).__name__}:{exc}",
                }
        return None, {
            "ok": False,
            "module_name": "",
            "tried": tried,
            "probe": probe,
            "error": "runtime package not found",
        }

    def _build_runtime_config(self, case: ValidationCase) -> Dict[str, Any]:
        live = self._runtime_case(case)
        connection_mode = self._choose_env_first(live, ["connection_mode"], "PYTSL_CONNECTION_MODE")
        config = {
            "host": self._choose_env_first(live, ["host", "ip"], "PYTSL_HOST"),
            "port": self._choose_int_env_first(live, ["port"], "PYTSL_PORT"),
            "username": self._choose_env_first(live, ["username", "user"], "PYTSL_USERNAME"),
            "password": self._choose_env_first(live, ["password", "passwd"], "PYTSL_PASSWORD"),
            "connection_mode": connection_mode if connection_mode in self.CONNECTION_MODES else "",
            "network_required": self._parse_bool(self._choose_env_first(live, ["network_required"], "PYTSL_NETWORK_REQUIRED", True), True),
            "server": self._choose_env_first(live, ["server"], "PYTSL_SERVER"),
            "runtime": self._choose_env_first(live, ["runtime"], "PYTSL_RUNTIME"),
            "auth": self._choose_env_first(live, ["auth", "auth_token"], "PYTSL_AUTH_TOKEN"),
            "connection_label": self._choose_env_first(live, ["connection_label", "alias"], "PYTSL_CONNECTION_LABEL"),
            "symbol": self._choose(live, ["symbol"], "PYTSL_SYMBOL"),
            "period": self._choose(live, ["period"], "PYTSL_PERIOD"),
            "start_date": self._choose(live, ["start_date"], "PYTSL_START_DATE"),
            "end_date": self._choose(live, ["end_date"], "PYTSL_END_DATE"),
            "market": self._choose(live, ["market"], "PYTSL_MARKET"),
            "adjust_mode": self._choose(live, ["adjust_mode"], "PYTSL_ADJUST_MODE"),
            "extra_system_params": self._choose(live, ["extra_system_params"], "PYTSL_EXTRA_SYSTEM_PARAMS", {}),
            "output_fields": live.get("output_fields") or case.parameters.get("output_fields", []),
            "compare_fields": case.parameters.get("compare_fields", []),
            "required_fields": case.parameters.get("required_fields", []),
            "field_types": case.parameters.get("field_types", {}),
        }
        if not isinstance(config["extra_system_params"], (dict, list, str, type(None))):
            config["extra_system_params"] = str(config["extra_system_params"])
        return config

    def _safe_runtime_config(self, runtime_config: Dict[str, Any]) -> Dict[str, Any]:
        safe = dict(runtime_config)
        for key in ["username", "password", "auth", "auth_token"]:
            if safe.get(key):
                safe[key] = "<set>"
        return safe

    def _case_requirements(self, case: ValidationCase, runtime_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        live = runtime_config if runtime_config is not None else self._runtime_case(case)
        is_live = bool(live)
        required_for_live = ["host", "port", "username", "password", "symbol", "period", "start_date", "end_date"]
        missing_live = [k for k in required_for_live if not live.get(k)] if is_live else []
        return {
            "is_live_case": is_live,
            "missing_live_fields": missing_live,
        }

    def _sdk_readiness(self, module: Any = None, pkg: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if module is None:
            module = None
            pkg = pkg or self._load_runtime_package()[1]
        importable = bool(pkg and pkg.get("ok"))
        entrypoints = self._discover_entrypoints(module) if module is not None else {"connect": [], "execute": [], "sdk_ready": False}
        return {
            "package_ready": importable,
            "module_name": pkg.get("module_name", "") if pkg else "",
            "entrypoints": entrypoints,
            "connect_entrypoints": entrypoints.get("connect", []),
            "execute_entrypoints": entrypoints.get("execute", []),
            "sdk_ready": bool(importable and entrypoints.get("sdk_ready")),
        }

    def _classify_failure_kind(self, stage: str, error_text: Any) -> str:
        message = self._decode_text(error_text).lower()
        if stage == "preflight":
            return "preflight_failure"
        if stage == "connect":
            if any(token in message for token in ["invalid username or password", "invalid user", "relogin refused", "authentication", "login failed"]):
                return "auth_failure"
            if any(token in message for token in ["missing host", "missing port", "host/port", "missing host/port"]):
                return "config_failure"
            if any(token in message for token in ["timeout", "timed out", "refused", "unreachable", "network", "socket"]):
                return "network_failure"
            return "connect_failure"
        if stage == "login":
            if any(token in message for token in ["invalid username or password", "invalid user", "relogin refused", "authentication", "login failed"]):
                return "auth_failure"
            if any(token in message for token in ["timeout", "timed out", "refused", "unreachable", "network", "socket"]):
                return "network_failure"
            return "connect_failure"
        if stage == "execute":
            if any(token in message for token in ["statement missing terminator", "syntax", "parse", "compile", "illegal", "unexpected"]):
                return "execute_failure"
            return "execute_failure"
        if stage == "normalize_outputs":
            return "normalization_failure"
        if stage == "load_runtime_package":
            return "sdk_failure"
        return "runtime_failure"

    def _classify_preflight_failure_kind(self, preflight: Dict[str, Any]) -> str:
        kinds = []
        for problem in preflight.get("problems", []):
            if isinstance(problem, dict):
                kinds.append(str(problem.get("kind", "")))
            else:
                kinds.append(str(problem))
        if "runtime_config_missing" in kinds:
            return "config_failure"
        if "network_unreachable" in kinds or "tls_handshake_failed" in kinds:
            return "network_failure"
        if "sdk_not_ready" in kinds:
            return "sdk_failure"
        return "preflight_failure"

    def _unwrap_execution_result(self, raw_result: Any) -> Any:
        if isinstance(raw_result, (tuple, list)) and len(raw_result) >= 2:
            head = raw_result[0]
            if head in {0, True, None}:
                payload = raw_result[1]
                if isinstance(payload, (dict, list, tuple)) or payload is None:
                    return payload
        return raw_result

    def _normalize_tree(self, value: Any) -> Any:
        if isinstance(value, dict):
            normalized: Dict[str, Any] = {}
            for key, item in value.items():
                if isinstance(key, bytes):
                    key = self._decode_text(key)
                elif not isinstance(key, str):
                    key = self._decode_text(key)
                normalized[key] = self._normalize_tree(item)
            return normalized
        if isinstance(value, (list, tuple)):
            return [self._normalize_tree(item) for item in value]
        return self._coerce_scalar(value)

    def is_implemented(self, module: Any = None) -> bool:
        if module is None:
            module, info = self._load_runtime_package()
            if not info.get("ok") or module is None:
                return False
        attrs = self._discover_entrypoints(module)
        return bool(attrs.get("sdk_ready"))

    def _decode_text(self, value: Any) -> str:
        if isinstance(value, bytes):
            for encoding in ("utf-8", "gbk", "gb18030"):
                try:
                    return value.decode(encoding)
                except Exception:
                    continue
            return value.decode("utf-8", errors="ignore")
        if value is None:
            return ""
        return str(value)

    def _result_ok(self, result: Any) -> bool:
        if isinstance(result, tuple):
            if not result:
                return True
            head = result[0]
            return head in {0, True, None}
        if isinstance(result, bool):
            return result
        if isinstance(result, int):
            return result == 0
        return result is not None

    def _result_error(self, result: Any) -> str:
        if isinstance(result, tuple):
            if len(result) >= 3 and not self._result_ok(result):
                return self._decode_text(result[2])
            if len(result) >= 2 and not self._result_ok(result):
                return self._decode_text(result[1])
            return ""
        if self._result_ok(result):
            return ""
        return self._decode_text(result)

    def _call_module_function(self, module: Any, name: str, *args: Any) -> Tuple[Any, Dict[str, Any]]:
        fn = getattr(module, name, None)
        if not callable(fn):
            return None, {"ok": False, "stage": name, "error": "entrypoint_not_found"}
        try:
            result = fn(*args)
            return result, {"ok": True, "stage": name, "error": "", "entrypoint": name}
        except Exception as exc:
            return None, {"ok": False, "stage": name, "error": f"{type(exc).__name__}: {exc}", "entrypoint": name}

    def preflight(self, case: ValidationCase) -> Dict[str, Any]:
        module, pkg = self._load_runtime_package()
        runtime_config = self._build_runtime_config(case)
        case_req = self._case_requirements(case, runtime_config)
        connection_mode_info = self._connection_mode_hint(runtime_config, module=module)
        connection_mode = connection_mode_info.get("connection_mode", "remote_api")
        network_required = bool(runtime_config.get("network_required", True))
        network_probe = self._network_probe(runtime_config.get("host"), runtime_config.get("port")) if network_required else {
            "host": runtime_config.get("host"),
            "port": runtime_config.get("port"),
            "tcp_port_open": True,
            "network_reachable": True,
            "tls_ready": True,
            "latency_ms": None,
            "error": "",
            "note": "network check skipped by configuration",
        }
        sdk_info = self._sdk_readiness(module=module, pkg=pkg)
        config_missing = [k for k in case_req.get("missing_live_fields", []) if k in {"host", "port", "username", "password", "symbol", "period", "start_date", "end_date"}]
        package_ready = bool(pkg.get("ok"))
        case_ready = not case_req.get("missing_live_fields")
        config_ready = not config_missing
        network_ready = bool(network_probe.get("tcp_port_open")) or not network_required
        sdk_ready = bool(sdk_info.get("sdk_ready"))

        problems: List[Any] = []
        if not package_ready:
            problems.append({"kind": self.PROBLEM_RUNTIME_PACKAGE_MISSING, "stage": "load_runtime_package", "details": pkg})
        if not config_ready:
            problems.append({
                "kind": self.PROBLEM_RUNTIME_CONFIG_MISSING,
                "stage": "config",
                "missing": config_missing,
                "runtime_config": {
                    k: self._safe_runtime_config(runtime_config).get(k)
                    for k in ["connection_mode", "host", "port", "username", "password", "symbol", "period", "start_date", "end_date"]
                },
            })
        if case_req.get("is_live_case") and not case_ready:
            problems.append({
                "kind": self.PROBLEM_RUNTIME_CASE_MISSING,
                "stage": "case",
                "missing": case_req.get("missing_live_fields", []),
            })
        if network_required and not network_ready:
            if not network_probe.get("tcp_port_open"):
                problems.append({
                    "kind": self.PROBLEM_NETWORK_UNREACHABLE,
                    "stage": "network",
                    "details": network_probe,
                })
        if not sdk_ready:
            problems.append({
                "kind": self.PROBLEM_SDK_NOT_READY,
                "stage": "sdk",
                "details": sdk_info,
            })

        overall_ready = package_ready and config_ready and case_ready and network_ready and sdk_ready

        return {
            "package_ready": package_ready,
            "config_ready": config_ready,
            "case_ready": case_ready,
            "network_ready": network_ready,
            "sdk_ready": sdk_ready,
            "connection_mode": connection_mode,
            "connection_mode_info": connection_mode_info,
            "overall_ready": overall_ready,
            "problems": problems,
            "package": pkg,
            "runtime_config": self._safe_runtime_config(runtime_config),
            "case_requirements": case_req,
            "network_probe": network_probe,
            "sdk_probe": sdk_info,
            "todo": "TODO(integration point): wire exact SDK capability checks for implementation readiness.",
        }

    def check_environment(self) -> Dict[str, Any]:
        module, pkg = self._load_runtime_package()
        cfg = self._build_runtime_config(ValidationCase(case_id="env", name="env", input_series=[], parameters={}))
        case_req = self._case_requirements(ValidationCase(case_id="env", name="env", input_series=[], parameters={"runtime_case": cfg}))
        network_required = bool(cfg.get("network_required", True))
        network_probe = self._network_probe(cfg.get("host"), cfg.get("port")) if network_required else {
            "host": cfg.get("host"),
            "port": cfg.get("port"),
            "tcp_port_open": True,
            "network_reachable": True,
            "tls_ready": True,
            "latency_ms": None,
            "error": "",
            "note": "network check skipped by configuration",
        }
        sdk_info = self._sdk_readiness(module=module, pkg=pkg)
        available = bool(pkg.get("ok")) and not case_req.get("missing_live_fields") and bool(network_probe.get("tcp_port_open")) and bool(sdk_info.get("sdk_ready"))
        return {
            "available": available,
            "implemented": self.is_implemented(module=module) if module is not None else False,
            "packages": [pkg.get("module_name")] if pkg.get("module_name") else [],
            "runtime_config": self._safe_runtime_config(cfg),
            "missing_required": case_req.get("missing_live_fields", []),
            "package_info": pkg,
            "connection_mode": self._connection_mode_hint(cfg, module=module).get("connection_mode"),
            "network_probe": network_probe,
            "sdk_probe": sdk_info,
        }

    def _connect_with_entrypoint(self, entrypoint: Any, runtime_config: Dict[str, Any]) -> Tuple[Optional[Any], Dict[str, Any]]:
        kwargs = {
            "host": runtime_config.get("host"),
            "ip": runtime_config.get("host"),
            "port": runtime_config.get("port"),
            "username": runtime_config.get("username"),
            "password": runtime_config.get("password"),
            "server": runtime_config.get("server"),
            "runtime": runtime_config.get("runtime"),
            "auth": runtime_config.get("auth"),
        }
        try:
            if inspect.isclass(entrypoint):
                sig = inspect.signature(entrypoint)
                ctor_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters or any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values())}
                return entrypoint(**ctor_kwargs), {"ok": True, "stage": "connect", "error": "", "entrypoint": getattr(entrypoint, "__name__", repr(entrypoint))}
            sig = inspect.signature(entrypoint)
            call_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters or any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values())}
            result = entrypoint(**call_kwargs)
            return result, {"ok": True, "stage": "connect", "error": "", "entrypoint": getattr(entrypoint, "__name__", repr(entrypoint))}
        except Exception as exc:
            return None, {"ok": False, "stage": "connect", "error": f"{type(exc).__name__}: {exc}", "entrypoint": getattr(entrypoint, "__name__", repr(entrypoint))}

    def _connect_remote_api(self, runtime_module: Any, runtime_config: Dict[str, Any]) -> Tuple[Optional[Any], Dict[str, Any]]:
        host = runtime_config.get("host")
        port = runtime_config.get("port")
        username = runtime_config.get("username")
        password = runtime_config.get("password")
        if not host or not port:
            return None, {
                "ok": False,
                "stage": "connect",
                "mode": "remote_api",
                "error": "missing host/port",
            }

        connect_result, connect_info = self._call_module_function(runtime_module, "ConnectServer", host, int(port))
        if not connect_info.get("ok"):
            connect_info["mode"] = "remote_api"
            connect_info["failure_kind"] = self._classify_failure_kind("connect", connect_info.get("error", ""))
            return None, connect_info
        if not self._result_ok(connect_result):
            return None, {
                "ok": False,
                "stage": "connect",
                "mode": "remote_api",
                "error": f"ConnectServer returned {self._decode_text(connect_result)}",
                "result": connect_result,
                "failure_kind": self._classify_failure_kind("connect", self._result_error(connect_result) or connect_result),
            }

        login_result, login_info = self._call_module_function(runtime_module, "LoginServer", username, password)
        login_info["mode"] = "remote_api"
        if not login_info.get("ok"):
            login_info["failure_kind"] = self._classify_failure_kind("login", login_info.get("error", ""))
            return None, login_info
        if not self._result_ok(login_result):
            return None, {
                "ok": False,
                "stage": "login",
                "mode": "remote_api",
                "error": self._result_error(login_result) or f"LoginServer returned {self._decode_text(login_result)}",
                "result": login_result,
                "failure_kind": self._classify_failure_kind("login", self._result_error(login_result) or login_result),
            }

        logged_in = None
        logged_in_info: Dict[str, Any] = {}
        if hasattr(runtime_module, "Logined") and callable(getattr(runtime_module, "Logined")):
            try:
                logged_in = runtime_module.Logined()
            except Exception as exc:
                logged_in_info["logined_error"] = f"{type(exc).__name__}: {exc}"

        return runtime_module, {
            "ok": True,
            "stage": "login",
            "mode": "remote_api",
            "error": "",
            "connect_result": connect_result,
            "login_result": login_result,
            "logined": logged_in,
            **logged_in_info,
        }

    def _connect_local_client_bridge(self, runtime_module: Any, runtime_config: Dict[str, Any]) -> Tuple[Optional[Any], Dict[str, Any]]:
        alias = runtime_config.get("connection_label") or runtime_config.get("runtime") or runtime_config.get("server") or "default"
        local_execute_ready = callable(getattr(runtime_module, "LocalExecute", None))
        if not local_execute_ready:
            return None, {
                "ok": False,
                "stage": "connect",
                "mode": "local_client_bridge",
                "error": "LocalExecute not available on runtime module.",
                "failure_kind": "sdk_failure",
                "todo": "TODO(integration point): map actual local bridge login/session API.",
            }

        connect_attempt: Dict[str, Any] = {
            "alias": alias,
            "bridge_state": "local_execute_only",
            "mode": "local_client_bridge",
        }
        if hasattr(runtime_module, "DefaultConnectAndLogin") and callable(getattr(runtime_module, "DefaultConnectAndLogin")):
            result, info = self._call_module_function(runtime_module, "DefaultConnectAndLogin", alias)
            connect_attempt["default_connect_result"] = result
            connect_attempt["default_connect_info"] = info
            if info.get("ok") and self._result_ok(result):
                connect_attempt["bridge_state"] = "default_connect_and_login"
            else:
                connect_attempt["bridge_state"] = "local_execute_only"

        return runtime_module, {
            "ok": True,
            "stage": "connect",
            "mode": "local_client_bridge",
            "error": "",
            "connect_attempt": connect_attempt,
            "todo": "TODO(integration point): local bridge may execute without a new login when the client runtime is already available.",
        }

    def _connect(self, runtime_module: Any, runtime_config: Dict[str, Any]) -> Tuple[Optional[Any], Dict[str, Any]]:
        connection_mode = self._connection_mode_hint(runtime_config, module=runtime_module).get("connection_mode", "remote_api")
        if connection_mode == "local_client_bridge":
            return self._connect_local_client_bridge(runtime_module, runtime_config)
        return self._connect_remote_api(runtime_module, runtime_config)

    def _connection_mode_order(self, requested_mode: str) -> List[str]:
        if requested_mode == "remote_api":
            return ["remote_api", "local_client_bridge"]
        return ["local_client_bridge", "remote_api"]

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
        connection_mode = runtime_config.get("connection_mode", "remote_api")
        executable_source, source_info = self._prepare_executable_source(tsl_source)
        payload = {
            "tsl_source": executable_source,
            "source_info": source_info,
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
        sys_param = {
            "symbol": runtime_config.get("symbol"),
            "period": runtime_config.get("period"),
            "start_date": runtime_config.get("start_date"),
            "end_date": runtime_config.get("end_date"),
            "market": runtime_config.get("market"),
            "adjust_mode": runtime_config.get("adjust_mode"),
            "extra_system_params": runtime_config.get("extra_system_params"),
            "runtime_case": live,
            "task_id": task_spec.task_id,
        }

        exec_target = connection if connection is not None else runtime_module

        if connection_mode == "local_client_bridge":
            raw_result, execute_info = self._call_module_function(exec_target, "LocalExecute", executable_source)
            if not execute_info.get("ok"):
                execute_info["mode"] = connection_mode
                execute_info["failure_kind"] = self._classify_failure_kind("execute", execute_info.get("error", ""))
                return None, execute_info
            if not self._result_ok(raw_result):
                return None, {
                    "ok": False,
                    "stage": "execute",
                    "mode": connection_mode,
                    "error": self._result_error(raw_result) or f"LocalExecute returned {self._decode_text(raw_result)}",
                    "result": raw_result,
                    "payload": payload,
                    "sys_param": sys_param,
                    "failure_kind": self._classify_failure_kind("execute", self._result_error(raw_result) or raw_result),
                }
            return self._unwrap_execution_result(raw_result), {
                "ok": True,
                "stage": "execute",
                "error": "",
                "mode": connection_mode,
                "entrypoint": "LocalExecute",
                "raw_result": raw_result,
            }

        raw_result, execute_info = self._call_module_function(exec_target, "RemoteExecute", executable_source, sys_param)
        if not execute_info.get("ok"):
            execute_info["mode"] = connection_mode
            execute_info["failure_kind"] = self._classify_failure_kind("execute", execute_info.get("error", ""))
            return None, execute_info
        if not self._result_ok(raw_result):
            return None, {
                "ok": False,
                "stage": "execute",
                "mode": connection_mode,
                "error": self._result_error(raw_result) or f"RemoteExecute returned {self._decode_text(raw_result)}",
                "result": raw_result,
                "payload": payload,
                "sys_param": sys_param,
                "failure_kind": self._classify_failure_kind("execute", self._result_error(raw_result) or raw_result),
            }
        return self._unwrap_execution_result(raw_result), {
            "ok": True,
            "stage": "execute",
            "error": "",
            "mode": connection_mode,
            "entrypoint": "RemoteExecute",
            "raw_result": raw_result,
        }

    def _prepare_executable_source(self, tsl_source: str) -> Tuple[str, Dict[str, Any]]:
        stripped = tsl_source.lstrip("\ufeff\r\n\t ")
        if re.match(r"(?is)^begin\b", stripped):
            return tsl_source, {"wrapped_entrypoint": False, "reason": "source starts with begin"}
        match = re.search(r"(?im)^\s*Function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*;", tsl_source)
        if not match:
            return tsl_source, {"wrapped_entrypoint": False, "reason": "no function declaration found"}
        function_name = match.group(1)
        args = match.group(2).strip()
        if args:
            return tsl_source, {"wrapped_entrypoint": False, "reason": "first function has arguments", "function": function_name}
        wrapper = f"Begin\n  return {function_name}();\nEnd;\n\n"
        return wrapper + tsl_source.lstrip("\ufeff\r\n\t "), {
            "wrapped_entrypoint": True,
            "function": function_name,
            "reason": "source contains function declarations; prepended top-level entrypoint",
        }

    def _coerce_scalar(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, bytes):
            return self._decode_text(value)
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            if isinstance(value, float) and math.isnan(value):
                return None
            if isinstance(value, float) and value.is_integer():
                return int(value)
            return value
        if isinstance(value, tuple):
            return [self._coerce_scalar(x) for x in value]
        if isinstance(value, list):
            return [self._coerce_scalar(x) for x in value]
        return value

    def _tail_from_sequence(self, seq: Any, size: int = 3) -> List[Any]:
        if isinstance(seq, (list, tuple)):
            return [self._coerce_scalar(x) for x in seq[-size:]]
        return []

    def _list_to_mapping(self, seq: List[Any]) -> Dict[str, Any]:
        if len(seq) % 2 != 0 or not seq:
            return {}
        mapping: Dict[str, Any] = {}
        for idx in range(0, len(seq), 2):
            key = seq[idx]
            if isinstance(key, bytes):
                key = self._decode_text(key)
            if not isinstance(key, str):
                return {}
            mapping[key] = seq[idx + 1]
        return mapping

    def _unwrap_singleton_output_fields(self, raw_dict: Dict[str, Any]) -> Dict[str, Any]:
        singleton_keys = [
            key for key, value in raw_dict.items()
            if isinstance(value, list) and len(value) == 1
        ]
        if len(singleton_keys) < 2:
            return raw_dict
        return {
            key: value[0] if isinstance(value, list) and len(value) == 1 else value
            for key, value in raw_dict.items()
        }

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

        raw_result = self._normalize_tree(self._unwrap_execution_result(raw_result))
        raw_dict: Dict[str, Any] = {}
        if isinstance(raw_result, dict):
            raw_dict = raw_result
        elif isinstance(raw_result, (list, tuple)):
            mapped = self._list_to_mapping(raw_result)
            raw_dict = mapped if mapped else {"records": raw_result}
        else:
            raw_dict = {"value": raw_result}
        raw_dict = self._unwrap_singleton_output_fields(raw_dict)

        debug_summary["raw_keys"] = sorted(raw_dict.keys())[:20]

        def pick_field(field: str) -> Any:
            candidates = [field, field.lower(), field.upper()]
            alias = {
                "signal": ["signal", "sig", "lead_signal", "buy", "lead_buy"],
                "value": ["value", "val", "avg", "score", "last_value"],
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
            normalized_value = self._normalize_tree(raw_value)
            if field == "series_tail":
                if normalized_value is None:
                    outputs[field] = self._tail_from_sequence(raw_value) if raw_value is not None else []
                else:
                    outputs[field] = normalized_value
                source_map[field] = "tail"
            else:
                outputs[field] = normalized_value
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

        for key, value in raw_dict.items():
            if key not in outputs:
                outputs[key] = self._normalize_tree(value)
                source_map[key] = "raw"

        debug_summary["mapped_fields"] = source_map
        debug_summary["normalization_errors"] = normalize_errors

        return outputs, {
            "ok": True,
            "errors": normalize_errors,
            "raw_summary": debug_summary,
        }

    def _disconnect(self, connection: Any) -> Dict[str, Any]:
        if connection is None:
            return {"ok": True, "stage": "disconnect", "error": ""}
        for method in ["Disconnect", "disconnect", "close"]:
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

    def _execute_attempt(
        self,
        runtime_module: Any,
        runtime_config: Dict[str, Any],
        preflight: Dict[str, Any],
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
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
                    "failure_kind": connect_info.get("failure_kind", self._classify_failure_kind("connect", connect_info.get("error", ""))),
                    "runtime_errors": ["connect_failed", connect_info.get("error", "unknown")],
                    "outputs": {},
                    "integration": {
                        "stage": "connect",
                        "connection_mode": connect_info.get("mode", preflight.get("connection_mode", "")),
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
                    "failure_kind": execute_info.get("failure_kind", self._classify_failure_kind("execute", execute_info.get("error", ""))),
                    "runtime_errors": ["execute_failed", execute_info.get("error", "unknown")],
                    "outputs": {},
                    "integration": {
                        "stage": "execute",
                        "connection_mode": execute_info.get("mode", connect_info.get("mode", preflight.get("connection_mode", ""))),
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
                    "failure_kind": self._classify_failure_kind("normalize_outputs", normalize_info.get("errors", [])),
                    "runtime_errors": ["normalize_outputs_failed", *normalize_info.get("errors", [])],
                    "outputs": outputs,
                    "integration": {
                        "stage": "normalize_outputs",
                        "connection_mode": execute_info.get("mode", connect_info.get("mode", preflight.get("connection_mode", ""))),
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
                "failure_kind": "",
                "runtime_errors": [],
                "outputs": outputs,
                "integration": {
                    "stage": "completed",
                    "connection_mode": execute_info.get("mode", connect_info.get("mode", preflight.get("connection_mode", ""))),
                    "preflight": preflight,
                    "connect": connect_info,
                    "execute": execute_info,
                    "normalize": normalize_info,
                    "disconnect": disconnect_info,
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
                "failure_kind": self._classify_preflight_failure_kind(preflight),
                "runtime_errors": [
                    "pyTSL preflight failed before execute.",
                    *preflight.get("problems", []),
                ],
                "outputs": {},
                "integration": {
                    "stage": "preflight",
                    "connection_mode": preflight.get("connection_mode", ""),
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
                "failure_kind": "sdk_failure",
                "runtime_errors": ["runtime_package_load_failed", pkg.get("error", "unknown")],
                "outputs": {},
                "integration": {
                    "stage": "load_runtime_package",
                    "connection_mode": preflight.get("connection_mode", ""),
                    "package": pkg,
                },
            }

        runtime_config = self._build_runtime_config(case)
        requested_mode = runtime_config.get("connection_mode") or preflight.get("connection_mode", "auto")
        attempts: List[Dict[str, Any]] = []
        last_payload: Dict[str, Any] = {}

        for mode in self._connection_mode_order(requested_mode):
            attempt_config = dict(runtime_config)
            attempt_config["connection_mode"] = mode
            payload = self._execute_attempt(
                runtime_module=runtime_module,
                runtime_config=attempt_config,
                preflight=preflight,
                tsl_source=tsl_source,
                case=case,
                task_spec=task_spec,
            )
            integration = payload.setdefault("integration", {})
            attempts.append({
                "mode": mode,
                "runtime_status": payload.get("runtime_status"),
                "failure_kind": payload.get("failure_kind", ""),
                "stage": integration.get("stage", ""),
                "error": "; ".join(str(item) for item in payload.get("runtime_errors", [])[:2]),
            })
            integration["requested_connection_mode"] = requested_mode
            integration["attempts"] = attempts[:]
            if payload.get("runtime_status") == "ok":
                if len(attempts) > 1:
                    integration["fallback_used"] = True
                return payload
            last_payload = payload

        if last_payload:
            last_payload.setdefault("integration", {})["requested_connection_mode"] = requested_mode
            last_payload.setdefault("integration", {})["attempts"] = attempts
        return last_payload
