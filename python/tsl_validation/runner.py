from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional, Tuple

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.adapters.mock_adapter import MockTSLAdapter
from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.diffing import build_diff_report, render_markdown_report
from tsl_validation.linting import TslLinter
from tsl_validation.schemas import DiffReport, TaskSpec, ValidationCase, ValidationResult

_REFERENCE_STRATEGIES = {
    "moving_average_signal",
    "last_value",
    "identity",
    "custom_case_config",
}
_LINT_POLICIES = {"block", "warn", "off"}


def _reference_strategy(case: ValidationCase, task_spec: TaskSpec) -> str:
    case_cfg = case.parameters.get("python_reference", {})
    task_default = "moving_average_signal"
    if "reference_strategy=" in task_spec.expected_behavior:
        task_default = task_spec.expected_behavior.split("reference_strategy=")[-1].split()[0]
    strategy = (
        case_cfg.get("reference_strategy")
        or case.parameters.get("reference_strategy")
        or task_default
    )
    strategy = str(strategy)
    if strategy not in _REFERENCE_STRATEGIES:
        return "moving_average_signal"
    return strategy


def _build_python_reference(case: ValidationCase, task_spec: TaskSpec) -> Dict[str, Any]:
    values = case.input_series
    strategy = _reference_strategy(case, task_spec)
    cfg = case.parameters.get("python_reference", {})

    if not values:
        return {
            "outputs": {"signal": 0.0, "value": 0.0, "series_tail": [], "window": 0},
            "reference_strategy": strategy,
            "reference_metadata": {
                "note": "empty input series",
                "config": cfg,
            },
            "intermediate": {},
        }

    if strategy == "last_value":
        last = values[-1]
        return {
            "outputs": {
                "value": last,
                "signal": 1.0 if last > 0 else 0.0,
                "series_tail": values[-3:],
                "window": 1,
            },
            "reference_strategy": strategy,
            "reference_metadata": {
                "config": cfg,
                "strategy_intent": "Use latest value as canonical output.",
            },
            "intermediate": {"last": last},
        }

    if strategy == "identity":
        signal_threshold = float(cfg.get("signal_threshold", values[-1]))
        last = values[-1]
        return {
            "outputs": {
                "value": last,
                "signal": 1.0 if last >= signal_threshold else 0.0,
                "series_tail": values[-3:],
                "window": 1,
            },
            "reference_strategy": strategy,
            "reference_metadata": {
                "config": cfg,
                "strategy_intent": "Identity mapping for sanity checks.",
            },
            "intermediate": {
                "last": last,
                "signal_threshold": signal_threshold,
            },
        }

    if strategy == "custom_case_config":
        custom_outputs = cfg.get("custom_outputs", {})
        if custom_outputs:
            merged_outputs = {
                "series_tail": values[-3:],
                **custom_outputs,
            }
            return {
                "outputs": merged_outputs,
                "reference_strategy": strategy,
                "reference_metadata": {
                    "config": cfg,
                    "strategy_intent": "Use case-level custom oracle outputs.",
                },
                "intermediate": {
                    "custom_outputs_keys": sorted(custom_outputs.keys()),
                },
            }

    window = int(cfg.get("window", case.parameters.get("window", 3)))
    window = max(1, window)
    tail = values[-window:]
    value = mean(tail)
    return {
        "outputs": {
            "signal": 1.0 if value > values[-1] else 0.0,
            "value": value,
            "series_tail": values[-3:],
            "window": window,
        },
        "reference_strategy": "moving_average_signal",
        "reference_metadata": {
            "config": cfg,
            "strategy_intent": "Moving-average based truth oracle for signal/value.",
        },
        "intermediate": {
            "window": window,
            "tail": tail,
            "last": values[-1],
            "tail_mean": value,
        },
    }


def _lint_error_count(diagnostics: List[Any]) -> int:
    return sum(1 for d in diagnostics if d.severity == "error")


def _check_spec(case: ValidationCase, outputs: Dict[str, Any]) -> List[str]:
    issues: List[str] = []
    required_fields = case.parameters.get("required_fields", ["signal", "value"])
    field_types = case.parameters.get("field_types", {})
    non_null_fields = case.parameters.get("non_null_fields", required_fields)

    for field in required_fields:
        if field not in outputs:
            issues.append(f"missing field: {field}")

    for field in non_null_fields:
        if field in outputs and outputs[field] is None:
            issues.append(f"null field: {field}")

    for field, expected in field_types.items():
        if field not in outputs:
            continue
        value = outputs[field]
        if expected == "number" and not isinstance(value, (int, float)):
            issues.append(f"type mismatch: {field} expected number")
        if expected == "boolean" and not isinstance(value, (bool, int, float)):
            issues.append(f"type mismatch: {field} expected boolean-like")
        if expected == "array" and not isinstance(value, list):
            issues.append(f"type mismatch: {field} expected array")

    return issues


def resolve_adapter(name: str) -> Tuple[TSLRuntimeAdapter, Dict[str, Any]]:
    if name == "mock":
        return MockTSLAdapter(), {
            "requested_adapter": "mock",
            "actual_adapter": "mock",
            "fallback_used": False,
            "fallback_reason": "",
        }
    if name == "pytsl":
        return PyTSLAdapter(), {
            "requested_adapter": "pytsl",
            "actual_adapter": "pytsl",
            "fallback_used": False,
            "fallback_reason": "",
        }
    if name == "auto":
        py_adapter = PyTSLAdapter()
        env_info = py_adapter.check_environment()
        if env_info.get("available") and env_info.get("implemented"):
            return py_adapter, {
                "requested_adapter": "auto",
                "actual_adapter": "pytsl",
                "fallback_used": False,
                "fallback_reason": "",
                "pytsl_environment": env_info,
            }
        reason = "pytsl_not_ready_or_not_implemented"
        if env_info.get("available") and not env_info.get("implemented"):
            reason = "pytsl_execute_not_implemented"
        return MockTSLAdapter(), {
            "requested_adapter": "auto",
            "actual_adapter": "mock",
            "fallback_used": True,
            "fallback_reason": reason,
            "pytsl_environment": env_info,
        }
    raise ValueError(f"Unknown adapter: {name}")


def run_validation(
    tsl_source: str,
    case: ValidationCase,
    task_spec: TaskSpec,
    adapter_name: str = "auto",
    mode: str = "oracle",
    lint_policy: str = "warn",
    report_path: Optional[str] = None,
) -> ValidationResult:
    if mode not in {"smoke", "spec", "oracle"}:
        raise ValueError("mode must be one of: smoke/spec/oracle")
    if lint_policy not in _LINT_POLICIES:
        raise ValueError("lint_policy must be one of: block/warn/off")

    diagnostics = TslLinter().lint(tsl_source)
    lint_errors = _lint_error_count(diagnostics)

    reference = _build_python_reference(case=case, task_spec=task_spec)
    python_reference_outputs = reference.get("outputs", {})

    runtime_payload: Dict[str, Any] = {
        "adapter": "none",
        "execution_mode": "skipped",
        "runtime_status": "skipped",
        "runtime_errors": [],
        "outputs": {},
        "runtime_skipped": True,
        "skip_reason": "",
    }
    resolution_info: Dict[str, Any] = {
        "requested_adapter": adapter_name,
        "actual_adapter": "none",
        "fallback_used": False,
        "fallback_reason": "",
    }

    if lint_policy == "block" and lint_errors > 0:
        runtime_payload["skip_reason"] = "lint_policy_blocked_by_error"
    else:
        adapter, resolution_info = resolve_adapter(adapter_name)
        runtime_payload = adapter.execute(tsl_source=tsl_source, case=case, task_spec=task_spec)
        runtime_payload["runtime_skipped"] = False
        runtime_payload.setdefault("skip_reason", "")

    runtime_status = runtime_payload.get("runtime_status", "failed")
    runtime_errors = runtime_payload.get("runtime_errors", [])
    runtime_ok = runtime_status == "ok"
    outputs = runtime_payload.get("outputs", {})
    runtime_skipped = bool(runtime_payload.get("runtime_skipped", False))
    skip_reason = runtime_payload.get("skip_reason", "")

    spec_issues = _check_spec(case, outputs) if not runtime_skipped else []

    diff_report: DiffReport
    if mode == "oracle" and not runtime_skipped:
        diff_report = build_diff_report(
            case=case,
            task_spec=task_spec,
            python_reference=python_reference_outputs,
            tsl_output=outputs,
            context={
                "reference": reference,
                "runtime": runtime_payload,
                "mode": mode,
            },
        )
    else:
        reason = "runtime skipped" if runtime_skipped else f"diff skipped in {mode} mode"
        diff_report = DiffReport(case_id=case.case_id, summary=reason, items=[])

    mismatch_count = sum(1 for item in diff_report.items if item.status == "mismatch")

    failure_kind = ""
    if lint_policy == "block" and lint_errors > 0:
        failure_kind = "lint_error"
    elif runtime_skipped:
        failure_kind = "runtime_skipped"
    elif not runtime_ok:
        failure_kind = "runtime_failure"
    elif mode in {"spec", "oracle"} and spec_issues:
        failure_kind = "spec_failure"
    elif mode == "oracle" and mismatch_count > 0:
        failure_kind = "oracle_mismatch"

    status = "pass" if not failure_kind else "fail"

    result = ValidationResult(
        task_spec=task_spec,
        case=case,
        diagnostics=diagnostics,
        python_reference=reference,
        tsl_output=outputs,
        metadata={
            "adapter": runtime_payload.get("adapter", resolution_info.get("actual_adapter", "unknown")),
            "adapter_resolution": resolution_info,
            "execution_mode": runtime_payload.get("execution_mode", "unknown"),
            "validation_mode": mode,
            "status": status,
            "failure_kind": failure_kind,
            "lint_policy": lint_policy,
            "lint_error_count": lint_errors,
            "runtime_status": runtime_status,
            "runtime_errors": runtime_errors,
            "runtime_skipped": runtime_skipped,
            "skip_reason": skip_reason,
            "spec_issues": spec_issues,
            "mismatch_count": mismatch_count,
            "reference_strategy": reference.get("reference_strategy", "unknown"),
            "reference_metadata": reference.get("reference_metadata", {}),
            "runtime_payload": runtime_payload,
            "todo": "TODO(integration point): replace mock/local evaluator with pyTSL execution in production.",
        },
        diff_report=diff_report,
    )

    if report_path:
        report_file = Path(report_path)
        report_file.parent.mkdir(parents=True, exist_ok=True)
        markdown = render_markdown_report(
            case=case,
            task_spec=task_spec,
            tsl_source=tsl_source,
            python_reference=reference,
            tsl_output=outputs,
            diff_report=diff_report,
            diagnostics=[d.__dict__ for d in diagnostics],
            validation_metadata=result.metadata,
        )
        report_file.write_text(markdown, encoding="utf-8")

        json_file = report_file.with_suffix(".json")
        json_file.write_text(json.dumps(result.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")

    return result
