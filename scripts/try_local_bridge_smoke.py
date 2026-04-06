from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _ensure_pythonpath() -> None:
    python_dir = _repo_root() / "python"
    if str(python_dir) not in sys.path:
        sys.path.insert(0, str(python_dir))


def _default_sdk_path() -> str:
    env = os.getenv("PYTSL_SDK_PATH", "")
    if env:
        return env
    candidate = _repo_root().parent.parent / "AnalyseNG.NET"
    return str(candidate) if candidate.exists() else ""


def _build_case(args: argparse.Namespace):
    from tsl_validation.schemas import ValidationCase

    runtime_case = {
        "connection_mode": args.connection_mode,
        "network_required": False,
        "host": args.host,
        "port": args.port,
        "username": args.username,
        "password": args.password,
        "symbol": args.symbol,
        "period": args.period,
        "start_date": args.start_date,
        "end_date": args.end_date,
        "market": args.market,
        "adjust_mode": args.adjust_mode,
        "server": "",
        "runtime": "",
        "auth": "",
        "extra_system_params": "",
        "connection_label": args.connection_label,
        "output_fields": ["signal", "value", "series_tail", "window"],
    }
    return ValidationCase(
        case_id="local_bridge_smoke",
        name="Local bridge smoke",
        input_series=[],
        parameters={
            "reference_strategy": "last_value",
            "runtime_case": runtime_case,
            "output_fields": ["signal", "value", "series_tail", "window"],
            "compare_fields": ["signal", "value"],
            "required_fields": ["signal", "value"],
            "field_types": {
                "signal": "number",
                "value": "number",
                "series_tail": "array",
            },
        },
    )


def _build_task_spec():
    from tsl_validation.schemas import TaskSpec

    return TaskSpec(
        task_id="local_bridge_smoke",
        objective="Verify that pyTSL local bridge can execute a minimal script.",
        expected_behavior="Adapter should return structured outputs without a native crash.",
        tolerance=1e-6,
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a tiny local-client-bridge pyTSL smoke test.")
    parser.add_argument("--connection-mode", default=os.getenv("PYTSL_CONNECTION_MODE", "local_client_bridge"))
    parser.add_argument("--host", default=os.getenv("PYTSL_HOST", "TODO_TSL_HOST"))
    parser.add_argument("--port", type=int, default=int(os.getenv("PYTSL_PORT", "443")))
    parser.add_argument("--username", default=os.getenv("PYTSL_USERNAME", ""))
    parser.add_argument("--password", default=os.getenv("PYTSL_PASSWORD", ""))
    parser.add_argument("--symbol", default=os.getenv("PYTSL_SYMBOL", "TODO_LOCAL_SYMBOL"))
    parser.add_argument("--period", default=os.getenv("PYTSL_PERIOD", "TODO_LOCAL_PERIOD"))
    parser.add_argument("--start-date", default=os.getenv("PYTSL_START_DATE", "2023-10-01"))
    parser.add_argument("--end-date", default=os.getenv("PYTSL_END_DATE", "2023-10-25"))
    parser.add_argument("--market", default=os.getenv("PYTSL_MARKET", "SH"))
    parser.add_argument("--adjust-mode", default=os.getenv("PYTSL_ADJUST_MODE", "unadjusted"))
    parser.add_argument("--connection-label", default=os.getenv("PYTSL_CONNECTION_LABEL", "local_client_bridge"))
    return parser


def main() -> int:
    _ensure_pythonpath()
    sdk_path = _default_sdk_path()
    if sdk_path:
        os.environ["PYTSL_SDK_PATH"] = sdk_path

    parser = _build_parser()
    args = parser.parse_args()

    if not args.username or not args.password:
        print("username/password are required for this smoke run", file=sys.stderr)
        return 2

    from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter

    adapter = PyTSLAdapter()
    case = _build_case(args)
    task_spec = _build_task_spec()

    preflight = adapter.preflight(case)
    print(json.dumps({"stage": "preflight", "result": preflight}, ensure_ascii=False, indent=2, default=str))
    if not preflight.get("overall_ready"):
        return 3

    tsl_source = adapter.default_local_bridge_smoke_source()
    result = adapter.execute(tsl_source, case, task_spec)
    print(json.dumps({"stage": "execute", "result": result}, ensure_ascii=False, indent=2, default=str))
    return 0 if result.get("runtime_status") == "ok" else 4


if __name__ == "__main__":
    raise SystemExit(main())
