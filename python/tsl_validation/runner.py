from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.adapters.mock_adapter import MockTSLAdapter
from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.diffing import build_diff_report, render_markdown_report
from tsl_validation.linting import TslLinter
from tsl_validation.schemas import DiffReport, TaskSpec, ValidationCase, ValidationResult


def _python_reference(case: ValidationCase) -> Dict[str, Any]:
    values = case.input_series
    if not values:
        return {"signal": 0.0, "value": 0.0, "series_tail": [], "window": 0}

    reference_cfg = case.parameters.get("python_reference", {})
    window = int(reference_cfg.get("window", case.parameters.get("window", 3)))
    window = max(1, window)
    tail = values[-window:] if window > 0 else values
    value = mean(tail)
    return {
        "signal": 1.0 if value > values[-1] else 0.0,
        "value": value,
        "series_tail": values[-3:],
        "window": window,
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


def resolve_adapter(name: str) -> TSLRuntimeAdapter:
    if name == "mock":
        return MockTSLAdapter()
    if name == "pytsl":
        return PyTSLAdapter()
    if name == "auto":
        py_adapter = PyTSLAdapter()
        if py_adapter.check_environment().get("available"):
            return py_adapter
        return MockTSLAdapter()
    raise ValueError(f"Unknown adapter: {name}")


def run_validation(
    tsl_source: str,
    case: ValidationCase,
    task_spec: TaskSpec,
    adapter_name: str = "auto",
    mode: str = "oracle",
    lint_gate: bool = True,
    report_path: Optional[str] = None,
) -> ValidationResult:
    if mode not in {"smoke", "spec", "oracle"}:
        raise ValueError("mode must be one of: smoke/spec/oracle")

    linter = TslLinter()
    diagnostics = linter.lint(tsl_source)
    lint_errors = _lint_error_count(diagnostics)

    adapter = resolve_adapter(adapter_name)
    runtime_payload = adapter.execute(tsl_source=tsl_source, case=case, task_spec=task_spec)
    runtime_status = runtime_payload.get("runtime_status", "failed")
    runtime_errors = runtime_payload.get("runtime_errors", [])
    runtime_ok = runtime_status == "ok"
    outputs = runtime_payload.get("outputs", {})

    spec_issues = _check_spec(case, outputs)
    python_reference = _python_reference(case)

    diff_report: DiffReport
    if mode == "oracle":
        diff_report = build_diff_report(
            case=case,
            task_spec=task_spec,
            python_reference=python_reference,
            tsl_output=outputs,
        )
    else:
        diff_report = DiffReport(case_id=case.case_id, summary=f"diff skipped in {mode} mode", items=[])

    mismatch_count = sum(1 for item in diff_report.items if item.status == "mismatch")

    failure_kind = ""
    if lint_gate and lint_errors > 0:
        failure_kind = "lint_error"
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
        python_reference=python_reference,
        tsl_output=outputs,
        metadata={
            "adapter": runtime_payload.get("adapter", adapter.name),
            "execution_mode": runtime_payload.get("execution_mode", "unknown"),
            "validation_mode": mode,
            "status": status,
            "failure_kind": failure_kind,
            "lint_gate": lint_gate,
            "lint_error_count": lint_errors,
            "runtime_status": runtime_status,
            "runtime_errors": runtime_errors,
            "spec_issues": spec_issues,
            "mismatch_count": mismatch_count,
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
            python_reference=python_reference,
            tsl_output=outputs,
            diff_report=diff_report,
            diagnostics=[d.__dict__ for d in diagnostics],
        )
        report_file.write_text(markdown, encoding="utf-8")

        json_file = report_file.with_suffix(".json")
        json_file.write_text(json.dumps(result.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")

    return result
