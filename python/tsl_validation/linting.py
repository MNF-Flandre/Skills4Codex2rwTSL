from __future__ import annotations

import re
from typing import Dict, List

from tsl_validation.schemas import Diagnostic


_BLOCK_BEGIN_RE = re.compile(r"\b(begin|if|for|while|case)\b", re.IGNORECASE)
_BLOCK_END_RE = re.compile(r"\b(end)\b", re.IGNORECASE)
_ASSIGN_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:=")
_VAR_TOKEN_RE = re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\b")
_CALL_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)")
_DATE_LITERAL_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")

_RESERVED = {
    "begin",
    "end",
    "if",
    "then",
    "else",
    "for",
    "while",
    "case",
    "and",
    "or",
    "not",
    "true",
    "false",
}

_FUNCTION_SIGNATURES: Dict[str, int] = {
    "MA": 2,
    "REF": 2,
    "MAX": 2,
    "MIN": 2,
    "SUM": 2,
}

_FUTURE_HINTS = {"REF", "FUTURE", "LEAD", "FORWARD"}


class TslLinter:
    def lint(self, source: str) -> List[Diagnostic]:
        diagnostics: List[Diagnostic] = []
        lines = source.splitlines()
        self._check_block_balance(lines, diagnostics)
        self._check_variable_usage(lines, diagnostics)
        self._check_function_signatures(lines, diagnostics)
        self._check_type_mix(lines, diagnostics)
        self._check_future_hints(lines, diagnostics)
        return diagnostics

    def _check_block_balance(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        balance = 0
        for idx, line in enumerate(lines, start=1):
            if _BLOCK_BEGIN_RE.search(line):
                balance += 1
            if _BLOCK_END_RE.search(line):
                balance -= 1
                if balance < 0:
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="TSL001",
                            message="Unmatched 'end' detected.",
                            range=(idx, 1),
                            suggestion="Check block structure and remove extra 'end'.",
                        )
                    )
                    balance = 0
        if balance > 0:
            diagnostics.append(
                Diagnostic(
                    severity="error",
                    code="TSL002",
                    message="Block likely missing closing 'end'.",
                    range=(len(lines) or 1, 1),
                    suggestion="Add missing 'end' for opened blocks.",
                )
            )

    def _check_variable_usage(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        defined = {"close", "open", "high", "low", "volume", "date", "true", "false"}
        for idx, line in enumerate(lines, start=1):
            assign = _ASSIGN_RE.match(line)
            if assign:
                defined.add(assign.group(1).lower())
            for token in _VAR_TOKEN_RE.findall(line):
                lower = token.lower()
                if lower in _RESERVED:
                    continue
                if token.upper() in _FUNCTION_SIGNATURES:
                    continue
                if lower not in defined and ":=" not in line:
                    diagnostics.append(
                        Diagnostic(
                            severity="warning",
                            code="TSL010",
                            message=f"Variable '{token}' may be used before assignment.",
                            range=(idx, max(1, line.find(token) + 1)),
                            suggestion="Initialize the variable before use or check spelling.",
                        )
                    )

    def _check_function_signatures(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        for idx, line in enumerate(lines, start=1):
            call = _CALL_RE.search(line)
            if not call:
                continue
            fn = call.group(1).upper()
            if fn not in _FUNCTION_SIGNATURES:
                continue
            raw_args = call.group(2).strip()
            argc = 0 if not raw_args else len([x for x in raw_args.split(",") if x.strip()])
            expected = _FUNCTION_SIGNATURES[fn]
            if argc != expected:
                diagnostics.append(
                    Diagnostic(
                        severity="error",
                        code="TSL020",
                        message=f"Function {fn} expects {expected} args, got {argc}.",
                        range=(idx, max(1, line.find(fn) + 1)),
                        suggestion=f"Adjust arguments for {fn}({', '.join(['arg'] * expected)}).",
                    )
                )

    def _check_type_mix(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        for idx, line in enumerate(lines, start=1):
            has_bool = re.search(r"\b(true|false)\b", line, re.IGNORECASE)
            has_date = _DATE_LITERAL_RE.search(line)
            has_numeric_op = re.search(r"[+\-*/]", line)
            if has_bool and has_numeric_op:
                diagnostics.append(
                    Diagnostic(
                        severity="warning",
                        code="TSL030",
                        message="Boolean value mixed with numeric operation.",
                        range=(idx, 1),
                        suggestion="Convert boolean to numeric explicitly or rewrite expression.",
                    )
                )
            if has_date and has_numeric_op:
                diagnostics.append(
                    Diagnostic(
                        severity="warning",
                        code="TSL031",
                        message="Date literal used in arithmetic expression.",
                        range=(idx, 1),
                        suggestion="Use date functions instead of direct arithmetic.",
                    )
                )

    def _check_future_hints(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        for idx, line in enumerate(lines, start=1):
            upper_line = line.upper()
            if any(hint in upper_line for hint in _FUTURE_HINTS):
                if re.search(r"REF\s*\([^,]+,\s*-\d+\s*\)", upper_line):
                    diagnostics.append(
                        Diagnostic(
                            severity="warning",
                            code="TSL040",
                            message="Potential look-ahead bias via negative REF offset.",
                            range=(idx, 1),
                            suggestion="Avoid future-looking offsets in backtests.",
                        )
                    )
                elif "FUTURE" in upper_line or "LEAD" in upper_line:
                    diagnostics.append(
                        Diagnostic(
                            severity="info",
                            code="TSL041",
                            message="Potential future function usage detected.",
                            range=(idx, 1),
                            suggestion="Confirm no time-travel leakage in strategy logic.",
                        )
                    )
