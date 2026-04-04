from __future__ import annotations

import json
from typing import Any, Dict, List

from tsl_validation.schemas import DiffItem, DiffReport, TaskSpec, ValidationCase


def build_diff_report(
    case: ValidationCase,
    task_spec: TaskSpec,
    python_reference: Dict[str, Any],
    tsl_output: Dict[str, Any],
) -> DiffReport:
    items: List[DiffItem] = []
    fields = sorted(set(python_reference.keys()) | set(tsl_output.keys()))
    for field in fields:
        py = python_reference.get(field)
        tsl = tsl_output.get(field)
        delta = None
        status = "match"
        reason_hint = ""
        suggestion = ""
        if isinstance(py, (int, float)) and isinstance(tsl, (int, float)):
            delta = float(tsl) - float(py)
            if abs(delta) > task_spec.tolerance:
                status = "mismatch"
                reason_hint = "Numeric divergence exceeds tolerance."
                suggestion = "Check window, offset, and runtime function semantics."
        elif py != tsl:
            status = "mismatch"
            reason_hint = "Field values differ."
            suggestion = "Verify adapter mapping and output schema alignment."
        items.append(
            DiffItem(
                field=field,
                python_value=py,
                tsl_value=tsl,
                delta=delta,
                status=status,
                reason_hint=reason_hint,
                suggestion=suggestion,
            )
        )

    mismatch_count = sum(1 for item in items if item.status == "mismatch")
    summary = (
        f"{mismatch_count} mismatches found" if mismatch_count else "All compared fields match"
    )
    return DiffReport(case_id=case.case_id, summary=summary, items=items)


def render_markdown_report(
    case: ValidationCase,
    task_spec: TaskSpec,
    tsl_source: str,
    python_reference: Dict[str, Any],
    tsl_output: Dict[str, Any],
    diff_report: DiffReport,
    diagnostics: List[Dict[str, Any]],
) -> str:
    lines = [
        f"# Validation Report: {case.case_id}",
        "",
        "## Task Spec",
        f"- task_id: `{task_spec.task_id}`",
        f"- objective: {task_spec.objective}",
        f"- expected_behavior: {task_spec.expected_behavior}",
        f"- tolerance: {task_spec.tolerance}",
        "",
        "## Input Snapshot",
        f"- case_id: `{case.case_id}`",
        f"- name: {case.name}",
        f"- input_series: `{case.input_series}`",
        f"- parameters: `{json.dumps(case.parameters, ensure_ascii=False)}`",
        "",
        "## Python Reference Output",
        f"```json\n{json.dumps(python_reference, ensure_ascii=False, indent=2)}\n```",
        "",
        "## TSL / Adapter Output",
        f"```json\n{json.dumps(tsl_output, ensure_ascii=False, indent=2)}\n```",
        "",
        "## Static Diagnostics",
        f"```json\n{json.dumps(diagnostics, ensure_ascii=False, indent=2)}\n```",
        "",
        "## Diff Summary",
        f"- {diff_report.summary}",
        "",
        "## Key Field Diffs",
        "| field | python | tsl | delta | status | reason | suggestion |",
        "|---|---:|---:|---:|---|---|---|",
    ]

    for item in diff_report.items:
        lines.append(
            "| {field} | {py} | {tsl} | {delta} | {status} | {reason} | {sugg} |".format(
                field=item.field,
                py=item.python_value,
                tsl=item.tsl_value,
                delta="" if item.delta is None else f"{item.delta:.6f}",
                status=item.status,
                reason=item.reason_hint or "-",
                sugg=item.suggestion or "-",
            )
        )

    lines.extend(
        [
            "",
            "## Next-Step Fix Suggestions",
            "- 优先处理 error 级别静态诊断。",
            "- 针对 mismatch 字段检查参数窗口、偏移和函数语义映射。",
            "- 若使用 mock adapter，请在真实环境下替换 pyTSL adapter 并复跑。",
            "",
            "## TSL Source",
            "```tsl",
            tsl_source,
            "```",
        ]
    )

    return "\n".join(lines)
