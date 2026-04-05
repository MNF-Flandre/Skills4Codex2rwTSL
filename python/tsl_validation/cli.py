from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from tsl_validation.linting import TslLinter
from tsl_validation.runner import run_validation
from tsl_validation.schemas import TaskSpec, ValidationCase


EXIT_OK = 0
EXIT_VALIDATION_ERROR = 1
EXIT_ORACLE_MISMATCH = 2
EXIT_CONFIG_ERROR = 3


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
    payload = {
        "command": "lint",
        "file": args.file,
        "status": "fail" if any(d.severity == "error" for d in diagnostics) else "pass",
        "diagnostic_count": len(diagnostics),
        "diagnostics": [d.__dict__ for d in diagnostics],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return EXIT_VALIDATION_ERROR if payload["status"] == "fail" else EXIT_OK


def _code_for_result(status: str, failure_kind: str) -> int:
    if status == "pass":
        return EXIT_OK
    if failure_kind == "oracle_mismatch":
        return EXIT_ORACLE_MISMATCH
    return EXIT_VALIDATION_ERROR


def cmd_validate(args: argparse.Namespace) -> int:
    source = _read_text(args.file)
    case = _load_case(args.case)
    task = _load_task(args.task)
    result = run_validation(
        tsl_source=source,
        case=case,
        task_spec=task,
        adapter_name=args.adapter,
        mode=args.mode,
        lint_gate=not args.no_lint_gate,
        report_path=args.report,
    )

    status = result.metadata.get("status", "fail")
    failure_kind = result.metadata.get("failure_kind", "runtime_failure")
    exit_code = _code_for_result(status, failure_kind)

    payload = {
        "command": "validate",
        "status": status,
        "failure_kind": failure_kind,
        "mode": args.mode,
        "exit_code": exit_code,
        "result": result.to_dict(),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return exit_code


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
    validate.add_argument("--adapter", default="auto", choices=["auto", "mock", "pytsl"])
    validate.add_argument("--mode", default="oracle", choices=["smoke", "spec", "oracle"])
    validate.add_argument("--no-lint-gate", action="store_true", help="Do not fail validate on lint errors")
    validate.add_argument(
        "--report",
        default="reports/sample_validation_report.md",
        help="Path to markdown report output",
    )
    validate.set_defaults(func=cmd_validate)
    return parser


def main() -> int:
    parser = build_parser()
    try:
        args = parser.parse_args()
        return args.func(args)
    except (FileNotFoundError, json.JSONDecodeError, ValueError) as exc:
        print(
            json.dumps(
                {
                    "status": "error",
                    "exit_code": EXIT_CONFIG_ERROR,
                    "error": str(exc),
                },
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stdout,
        )
        return EXIT_CONFIG_ERROR


if __name__ == "__main__":
    raise SystemExit(main())
