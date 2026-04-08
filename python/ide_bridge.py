from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.cli import _load_case, _load_task
from tsl_validation.linting import TslLinter
from tsl_validation.runner import run_validation
from tsl_validation.textio import read_text_auto


def run_tsl_check(tsl_file: str) -> dict:
    source = read_text_auto(tsl_file)
    diagnostics = [d.__dict__ for d in TslLinter().lint(source)]
    return {
        "command": "Run TSL Check",
        "file": tsl_file,
        "status": "fail" if any(d["severity"] == "error" for d in diagnostics) else "pass",
        "diagnostics": diagnostics,
        "quick_fix_suggestions": [d["suggestion"] for d in diagnostics],
    }


def run_validation_command(
    tsl_file: str,
    case_file: str,
    task_file: str,
    adapter: str,
    report: str,
    mode: str,
    lint_policy: str,
) -> dict:
    source = read_text_auto(tsl_file)
    result = run_validation(
        tsl_source=source,
        case=_load_case(case_file),
        task_spec=_load_task(task_file),
        adapter_name=adapter,
        mode=mode,
        lint_policy=lint_policy,
        report_path=report,
    )
    return {
        "command": "Run Validation",
        "file": tsl_file,
        "report": report,
        "mode": mode,
        "lint_policy": lint_policy,
        "status": result.metadata.get("status"),
        "failure_kind": result.metadata.get("failure_kind"),
        "summary": result.diff_report.summary,
        "adapter": result.metadata.get("adapter"),
        "requested_adapter": result.metadata.get("requested_adapter"),
        "actual_adapter": result.metadata.get("actual_adapter"),
        "connection_mode": result.metadata.get("connection_mode"),
        "adapter_resolution": result.metadata.get("adapter_resolution"),
        "runtime_stage": result.metadata.get("runtime_stage"),
    }


def run_preflight_command(case_file: str) -> dict:
    case = _load_case(case_file)
    adapter = PyTSLAdapter()
    preflight = adapter.preflight(case)
    return {
        "command": "Run PyTSL Preflight",
        "adapter": "pytsl",
        "connection_mode": preflight.get("connection_mode", ""),
        "package_ready": preflight.get("package_ready", False),
        "config_ready": preflight.get("config_ready", False),
        "case_ready": preflight.get("case_ready", False),
        "network_ready": preflight.get("network_ready", False),
        "sdk_ready": preflight.get("sdk_ready", False),
        "overall_ready": preflight.get("overall_ready", False),
        "status": "pass" if preflight.get("overall_ready") else "fail",
        "preflight": preflight,
    }


def show_diff_report(report_file: str) -> dict:
    p = Path(report_file)
    j = p.with_suffix(".json")
    payload: Dict[str, Any] = {
        "command": "Show Diff Report",
        "file": str(p),
        "exists": p.exists(),
        "preview": read_text_auto(p)[:800] if p.exists() else "",
    }
    if j.exists():
        payload["json_report"] = str(j)
    return payload


def _collect_mismatch_fields(report_json: Dict[str, Any]) -> List[str]:
    items = report_json.get("diff_report", {}).get("items", [])
    return [item.get("field", "") for item in items if item.get("status") == "mismatch"]


def _preview_prompt(payload: Dict[str, Any]) -> str:
    return (
        "You are fixing TSL code for validation failure. "
        f"Mode={payload.get('validation_mode')} Failure={payload.get('failure_kind')}. "
        f"Reference strategy={payload.get('reference_strategy')}, Adapter={payload.get('runtime_adapter')}. "
        f"Focus mismatch fields: {', '.join(payload.get('mismatch_fields', [])[:5]) or 'none'}. "
        f"Runtime errors: {payload.get('runtime_errors', [])[:2]}. "
        f"Suggested action: {payload.get('suggested_next_action')}"
    )


def ask_ai_to_fix(tsl_file: str, report_file: str) -> dict:
    source = read_text_auto(tsl_file)
    report_json_path = Path(report_file).with_suffix(".json")
    report_json: Dict[str, Any] = {}
    if report_json_path.exists():
        try:
            report_json = json.loads(report_json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            report_json = {
                "metadata": {
                    "failure_kind": "report_json_decode_error",
                    "runtime_errors": [f"failed to parse report json: {report_json_path}: {exc}"],
                }
            }

    diagnostics = report_json.get("diagnostics", [])
    metadata = report_json.get("metadata", {})
    case_info = report_json.get("case", {})
    diff_summary = report_json.get("diff_report", {}).get("summary", "no diff summary available")
    mismatch_fields = _collect_mismatch_fields(report_json)
    runtime_payload = metadata.get("runtime_payload", {})

    next_action = (
        "Fix lint/schema errors first, then align mismatch fields with oracle reference strategy."
        if diagnostics or mismatch_fields
        else "No obvious mismatch; verify strategy intent and rerun oracle mode."
    )

    repair_payload = {
        "source": source,
        "diagnostics": diagnostics,
        "validation_mode": metadata.get("validation_mode"),
        "failure_kind": metadata.get("failure_kind"),
        "diff_summary": diff_summary,
        "mismatch_fields": mismatch_fields,
        "reference_strategy": metadata.get("reference_strategy"),
        "runtime_adapter": metadata.get("adapter"),
        "adapter_resolution": metadata.get("adapter_resolution", {}),
        "runtime_stage": metadata.get("runtime_stage", ""),
        "runtime_errors": metadata.get("runtime_errors", []),
        "runtime_intermediate_trace": runtime_payload.get("intermediate", {}).get("trace", []),
        "runtime_final_env": runtime_payload.get("intermediate", {}).get("final_env", {}),
        "suggested_next_action": next_action,
        "minimal_repro_case": {
            "case_id": case_info.get("case_id"),
            "input_series": case_info.get("input_series"),
            "parameters": case_info.get("parameters"),
        },
        "report_file": report_file,
    }
    repair_payload["repair_prompt_preview"] = _preview_prompt(repair_payload)

    return {
        "command": "Ask AI/Copilot to Fix",
        "integration_point": "TODO(integration point): connect payload to VS Code command/copilot chat API.",
        "repair_payload": repair_payload,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="IDE bridge for TSL inline validation prototype")
    sub = parser.add_subparsers(dest="command", required=True)

    p_check = sub.add_parser("run-check")
    p_check.add_argument("--file", required=True)

    p_validate = sub.add_parser("run-validation")
    p_validate.add_argument("--file", required=True)
    p_validate.add_argument("--case", required=True)
    p_validate.add_argument("--task", required=True)
    p_validate.add_argument("--adapter", default="auto", choices=["auto", "mock", "pytsl"])
    p_validate.add_argument("--mode", default="oracle", choices=["smoke", "spec", "oracle"])
    p_validate.add_argument("--lint-policy", default="warn", choices=["block", "warn", "off"])
    p_validate.add_argument("--report", default="reports/sample_validation_report.md")

    p_preflight = sub.add_parser("run-preflight")
    p_preflight.add_argument("--case", required=True)

    p_diff = sub.add_parser("show-diff")
    p_diff.add_argument("--report", required=True)

    p_fix = sub.add_parser("ask-fix")
    p_fix.add_argument("--file", required=True)
    p_fix.add_argument("--report", required=True)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "run-check":
        payload = run_tsl_check(args.file)
    elif args.command == "run-validation":
        payload = run_validation_command(
            args.file,
            args.case,
            args.task,
            args.adapter,
            args.report,
            args.mode,
            args.lint_policy,
        )
    elif args.command == "show-diff":
        payload = show_diff_report(args.report)
    elif args.command == "run-preflight":
        payload = run_preflight_command(args.case)
    else:
        payload = ask_ai_to_fix(args.file, args.report)

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
