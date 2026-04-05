from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from tsl_validation.schemas import DiffItem, DiffReport, TaskSpec, ValidationCase


def _mismatch_classification(py: Any, tsl: Any, delta: Optional[float], tolerance: float) -> str:
    if py is None and tsl is None:
        return "match"
    if py is None and tsl is not None:
        return "schema_mismatch"
    if py is not None and tsl is None:
        return "missing_field"
    if type(py) is not type(tsl) and not (
        isinstance(py, (int, float, bool)) and isinstance(tsl, (int, float, bool))
    ):
        return "type_mismatch"
    if delta is not None and abs(delta) > tolerance:
        return "numeric_tolerance_exceeded"
    if py != tsl:
        return "semantic_divergence"
    return "match"


def _suggestion_for_field(field: str, mismatch_kind: str, context: Dict[str, Any]) -> str:
    reference_strategy = context.get("reference", {}).get("reference_strategy", "unknown")
    runtime_intermediate = context.get("runtime", {}).get("intermediate", {})
    trace = runtime_intermediate.get("trace", [])
    trace_hint = ""
    if trace:
        last = trace[-1]
        trace_hint = f" Last assignment: {last.get('assignment')}@line {last.get('line')}."

    if mismatch_kind == "missing_field":
        return f"Runtime output lacks '{field}'. Ensure assignment exists and output_fields include it.{trace_hint}"
    if mismatch_kind == "type_mismatch":
        return f"Field '{field}' type mismatched. Normalize type at assignment and adapter mapping.{trace_hint}"
    if mismatch_kind == "numeric_tolerance_exceeded":
        return (
            f"Field '{field}' exceeded tolerance; verify formula/window/offset vs "
            f"reference strategy '{reference_strategy}'.{trace_hint}"
        )
    if mismatch_kind == "schema_mismatch":
        return f"Field '{field}' exists only in runtime output; align compare_fields/schema contract."
    if mismatch_kind == "semantic_divergence":
        return f"Field '{field}' diverges semantically from oracle strategy '{reference_strategy}'.{trace_hint}"
    return ""


def build_diff_report(
    case: ValidationCase,
    task_spec: TaskSpec,
    python_reference: Dict[str, Any],
    tsl_output: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None,
) -> DiffReport:
    ctx = context or {}
    items: List[DiffItem] = []
    comparable_fields = set(case.parameters.get("compare_fields", []))
    if comparable_fields:
        fields = sorted(comparable_fields)
    else:
        fields = sorted(set(python_reference.keys()) | set(tsl_output.keys()))

    for field in fields:
        py = python_reference.get(field)
        tsl = tsl_output.get(field)
        delta = None
        if isinstance(py, (int, float)) and isinstance(tsl, (int, float)):
            delta = float(tsl) - float(py)

        mismatch_kind = _mismatch_classification(py, tsl, delta, task_spec.tolerance)
        status = "match" if mismatch_kind == "match" else "mismatch"

        reason_hint = ""
        if mismatch_kind != "match":
            reason_hint = mismatch_kind

        suggestion = _suggestion_for_field(field, mismatch_kind, ctx)

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

    mismatch_items = [item for item in items if item.status == "mismatch"]
    mismatch_count = len(mismatch_items)
    if mismatch_count:
        top_fields = ", ".join(item.field for item in mismatch_items[:3])
        summary = f"{mismatch_count} mismatches found (top: {top_fields})"
    else:
        summary = "All compared fields match"

    return DiffReport(case_id=case.case_id, summary=summary, items=items)


def render_markdown_report(
    case: ValidationCase,
    task_spec: TaskSpec,
    tsl_source: str,
    python_reference: Dict[str, Any],
    tsl_output: Dict[str, Any],
    diff_report: DiffReport,
    diagnostics: List[Dict[str, Any]],
    validation_metadata: Optional[Dict[str, Any]] = None,
) -> str:
    metadata = validation_metadata or {}
    mismatch_items = [item for item in diff_report.items if item.status == "mismatch"]
    mismatch_types = sorted({item.reason_hint for item in mismatch_items if item.reason_hint})

    lines = [
        f"# Validation Report: {case.case_id}",
        "",
        "## Validation Outcome",
        f"- status: `{metadata.get('status', 'unknown')}`",
        f"- failure_kind: `{metadata.get('failure_kind', '')}`",
        f"- mode: `{metadata.get('validation_mode', '')}`",
        f"- lint_policy: `{metadata.get('lint_policy', '')}`",
        f"- adapter: `{metadata.get('adapter', '')}`",
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
        f"- mismatch_types: {', '.join(mismatch_types) if mismatch_types else 'none'}",
        "",
        "## Priority Fix Focus",
        f"- top mismatch fields: {', '.join(item.field for item in mismatch_items[:3]) if mismatch_items else 'none'}",
        "- Suggested order: schema/type issues -> numeric divergence -> semantic divergence",
        "",
        "## Key Field Diffs",
        "| field | python | tsl | delta | status | mismatch_type | suggestion |",
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
            "## TSL Source",
            "```tsl",
            tsl_source,
            "```",
        ]
    )

    return "\n".join(lines)
