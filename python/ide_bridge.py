from __future__ import annotations

import argparse
import json
from pathlib import Path

from tsl_validation.cli import _load_case, _load_task
from tsl_validation.linting import TslLinter
from tsl_validation.runner import run_validation


def run_tsl_check(tsl_file: str) -> dict:
    source = Path(tsl_file).read_text(encoding="utf-8")
    diagnostics = [d.__dict__ for d in TslLinter().lint(source)]
    return {
        "command": "Run TSL Check",
        "file": tsl_file,
        "diagnostics": diagnostics,
        "quick_fix_suggestions": [d["suggestion"] for d in diagnostics],
    }


def run_validation_command(
    tsl_file: str,
    case_file: str,
    task_file: str,
    adapter: str,
    report: str,
) -> dict:
    source = Path(tsl_file).read_text(encoding="utf-8")
    result = run_validation(
        tsl_source=source,
        case=_load_case(case_file),
        task_spec=_load_task(task_file),
        adapter_name=adapter,
        report_path=report,
    )
    return {
        "command": "Run Validation",
        "file": tsl_file,
        "report": report,
        "diff_summary": result.diff_report.summary,
        "adapter": result.metadata.get("adapter"),
    }


def show_diff_report(report_file: str) -> dict:
    p = Path(report_file)
    return {
        "command": "Show Diff Report",
        "file": str(p),
        "exists": p.exists(),
        "preview": p.read_text(encoding="utf-8")[:800] if p.exists() else "",
    }


def ask_ai_to_fix(tsl_file: str, report_file: str) -> dict:
    prompt = (
        "You are fixing TSL code based on static diagnostics and diff report. "
        "Focus on mismatched fields, function signatures, undefined variables, and look-ahead bias. "
        f"TSL file: {tsl_file}; report: {report_file}. "
        "Return patched TSL and explain key fixes."
    )
    return {
        "command": "Ask AI/Copilot to Fix",
        "integration_point": "TODO(mock): connect this payload to VS Code command/copilot chat API.",
        "prompt": prompt,
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
    p_validate.add_argument("--adapter", default="mock", choices=["mock", "pytsl"])
    p_validate.add_argument("--report", default="reports/sample_validation_report.md")

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
        payload = run_validation_command(args.file, args.case, args.task, args.adapter, args.report)
    elif args.command == "show-diff":
        payload = show_diff_report(args.report)
    else:
        payload = ask_ai_to_fix(args.file, args.report)

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
