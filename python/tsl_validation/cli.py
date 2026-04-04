from __future__ import annotations

import argparse
import json
from pathlib import Path

from tsl_validation.linting import TslLinter
from tsl_validation.runner import run_validation
from tsl_validation.schemas import TaskSpec, ValidationCase


def _read_text(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def _load_case(path: str) -> ValidationCase:
    data = json.loads(_read_text(path))
    return ValidationCase(**data)


def _load_task(path: str) -> TaskSpec:
    data = json.loads(_read_text(path))
    return TaskSpec(**data)


def cmd_lint(args: argparse.Namespace) -> int:
    source = _read_text(args.file)
    diagnostics = TslLinter().lint(source)
    payload = [d.__dict__ for d in diagnostics]
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 1 if any(d["severity"] == "error" for d in payload) else 0


def cmd_validate(args: argparse.Namespace) -> int:
    source = _read_text(args.file)
    case = _load_case(args.case)
    task = _load_task(args.task)
    result = run_validation(
        tsl_source=source,
        case=case,
        task_spec=task,
        adapter_name=args.adapter,
        report_path=args.report,
    )
    print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="TSL inline validation prototype CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    lint = sub.add_parser("lint", help="Run lightweight TSL lint checks")
    lint.add_argument("file", help="Path to .tsl source")
    lint.set_defaults(func=cmd_lint)

    validate = sub.add_parser("validate", help="Run validation with adapter + diff report")
    validate.add_argument("file", help="Path to .tsl source")
    validate.add_argument("--case", required=True, help="Path to validation case JSON")
    validate.add_argument("--task", required=True, help="Path to task spec JSON")
    validate.add_argument("--adapter", default="mock", choices=["mock", "pytsl"])
    validate.add_argument(
        "--report",
        default="reports/sample_validation_report.md",
        help="Path to markdown report output",
    )
    validate.set_defaults(func=cmd_validate)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
