from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Any, Dict, Optional

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.adapters.mock_adapter import MockTSLAdapter
from tsl_validation.adapters.pytsl_adapter import PyTSLAdapter
from tsl_validation.diffing import build_diff_report, render_markdown_report
from tsl_validation.linting import TslLinter
from tsl_validation.schemas import TaskSpec, ValidationCase, ValidationResult


def _python_reference(case: ValidationCase) -> Dict[str, Any]:
    window = int(case.parameters.get("window", 3))
    values = case.input_series
    if not values:
        return {"signal": 0.0, "value": 0.0}
    tail = values[-window:] if window > 0 else values
    value = mean(tail)
    return {
        "signal": 1.0 if value > values[-1] else 0.0,
        "value": value,
        "series_tail": tail,
        "window": window,
    }


def resolve_adapter(name: str) -> TSLRuntimeAdapter:
    if name == "mock":
        return MockTSLAdapter()
    if name == "pytsl":
        return PyTSLAdapter()
    raise ValueError(f"Unknown adapter: {name}")


def run_validation(
    tsl_source: str,
    case: ValidationCase,
    task_spec: TaskSpec,
    adapter_name: str = "mock",
    report_path: Optional[str] = None,
) -> ValidationResult:
    linter = TslLinter()
    diagnostics = linter.lint(tsl_source)

    python_reference = _python_reference(case)
    adapter = resolve_adapter(adapter_name)
    tsl_output = adapter.execute(tsl_source=tsl_source, case=case, task_spec=task_spec)

    diff_report = build_diff_report(
        case=case,
        task_spec=task_spec,
        python_reference=python_reference,
        tsl_output=tsl_output,
    )

    result = ValidationResult(
        task_spec=task_spec,
        case=case,
        diagnostics=diagnostics,
        python_reference=python_reference,
        tsl_output=tsl_output,
        metadata={
            "adapter": adapter.name,
            "prototype_mode": "vertical_slice",
            "todo": "TODO(integration point): replace mock adapter in real env",
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
            tsl_output=tsl_output,
            diff_report=diff_report,
            diagnostics=[d.__dict__ for d in diagnostics],
        )
        report_file.write_text(markdown, encoding="utf-8")

        json_file = report_file.with_suffix(".json")
        json_file.write_text(json.dumps(result.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")

    return result
