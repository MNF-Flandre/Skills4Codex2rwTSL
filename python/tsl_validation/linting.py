from __future__ import annotations

import re
from typing import Dict, List, Set, Tuple

from tsl_validation.schemas import Diagnostic


_BLOCK_BEGIN_RE = re.compile(r"\bbegin\b", re.IGNORECASE)
_CONTROL_BLOCK_BEGIN_RE = re.compile(r"^\s*(try|case)\b", re.IGNORECASE)
_BLOCK_END_RE = re.compile(r"\b(end)\b", re.IGNORECASE)
_SELECT_BLOCK_BEGIN_RE = re.compile(r"^\s*(?:return\s+|[A-Za-z_][A-Za-z0-9_]*\s*:=\s*)?select\b", re.IGNORECASE)
_ASSIGN_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:=(.*)$")
_VAR_TOKEN_RE = re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\b")
_DATE_LITERAL_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
_FUNCTION_DEF_RE = re.compile(r"^\s*Function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*;", re.IGNORECASE)
_FOR_IN_RE = re.compile(r"^\s*for\s+(.+?)\s+in\s+(.+?)\s+do\b", re.IGNORECASE)
_FOR_TO_RE = re.compile(r"^\s*for\s+([A-Za-z_][A-Za-z0-9_]*)\s*:=", re.IGNORECASE)

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
    "function",
    "return",
    "try",
    "except",
    "do",
    "to",
    "in",
    "continue",
    "break",
    "downto",
    "select",
    "from",
    "where",
    "order",
    "by",
    "desc",
    "asc",
    "of",
    "group",
    "having",
    "limit",
    "join",
    "left",
    "right",
    "inner",
    "outer",
    "on",
    "as",
    "union",
    "nil",
    "null",
}

_FUNCTION_SIGNATURES: Dict[str, int] = {
    "MA": 2,
    "REF": 2,
    "MAX": 2,
    "MIN": 2,
    "SUM": 2,
    "CROSSUP": 2,
    "CROSSDOWN": 2,
    "ABS": 1,
}

_FUTURE_HINTS = {"REF", "FUTURE", "LEAD", "FORWARD"}

_BUILTIN_NAMES = {
    "array",
    "dupvalue",
    "eval",
    "ifnil",
    "ifarray",
    "inttodate",
    "length",
    "mcols",
    "mrows",
    "reindex",
    "tostn",
}

_SYSTEM_TOKEN_RE = re.compile(r"^(pn|ct|cy)_[A-Za-z0-9_]*$", re.IGNORECASE)


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

    def _strip_strings(self, text: str) -> str:
        # TSL homework files often contain non-ASCII labels and date-like text.
        # Static checks should not treat content inside strings as identifiers.
        stripped = re.sub(r'"(?:[^"\\]|\\.)*"', '""', text)
        return re.sub(r"'(?:[^'\\]|\\.)*'", "''", stripped)

    def _code_without_comments_or_strings(self, line: str) -> str:
        return self._strip_strings(line.split("//", 1)[0])

    def _collect_defined_names(self, lines: List[str]) -> Set[str]:
        defined: Set[str] = {"close", "open", "high", "low", "volume", "date", "time", "true", "false"}
        defined.update(_BUILTIN_NAMES)
        for line in lines:
            code = self._code_without_comments_or_strings(line).strip()
            fn = _FUNCTION_DEF_RE.match(code)
            if fn:
                defined.add(fn.group(1).lower())
                for arg in self._split_args(fn.group(2)):
                    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", arg):
                        defined.add(arg.lower())
                continue
            assign = _ASSIGN_RE.match(code)
            if assign:
                defined.add(assign.group(1).lower())
            for_in = _FOR_IN_RE.match(code)
            if for_in:
                for name in for_in.group(1).split(","):
                    name = name.strip()
                    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
                        defined.add(name.lower())
            for_to = _FOR_TO_RE.match(code)
            if for_to:
                defined.add(for_to.group(1).lower())
        return defined

    def _extract_calls(self, expr: str, base_offset: int = 0) -> List[Tuple[str, str, int]]:
        calls: List[Tuple[str, str, int]] = []
        idx = 0
        while idx < len(expr):
            if not (expr[idx].isalpha() or expr[idx] == "_"):
                idx += 1
                continue
            start = idx
            while idx < len(expr) and (expr[idx].isalnum() or expr[idx] == "_"):
                idx += 1
            name = expr[start:idx]
            lookahead = idx
            while lookahead < len(expr) and expr[lookahead].isspace():
                lookahead += 1
            if lookahead >= len(expr) or expr[lookahead] != "(":
                continue
            depth = 0
            arg_start = lookahead + 1
            j = lookahead
            while j < len(expr):
                ch = expr[j]
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        args = expr[arg_start:j]
                        calls.append((name, args, base_offset + start))
                        calls.extend(self._extract_calls(args, base_offset + arg_start))
                        idx = j + 1
                        break
                j += 1
            else:
                idx += 1
        return calls

    def _is_known_runtime_symbol(self, token: str) -> bool:
        lower = token.lower()
        if lower in _BUILTIN_NAMES:
            return True
        if _SYSTEM_TOKEN_RE.match(token):
            return True
        return False

    def _split_args(self, args: str) -> List[str]:
        parts: List[str] = []
        current: List[str] = []
        depth = 0
        for ch in args:
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
            if ch == "," and depth == 0:
                part = "".join(current).strip()
                if part:
                    parts.append(part)
                current = []
            else:
                current.append(ch)
        tail = "".join(current).strip()
        if tail:
            parts.append(tail)
        return parts

    def _check_block_balance(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        balance = 0
        for idx, line in enumerate(lines, start=1):
            code = self._code_without_comments_or_strings(line)
            if _BLOCK_BEGIN_RE.search(code):
                balance += 1
            elif _CONTROL_BLOCK_BEGIN_RE.search(code):
                balance += 1
            elif _SELECT_BLOCK_BEGIN_RE.search(code):
                balance += 1
            if _BLOCK_END_RE.search(code):
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
        defined: Set[str] = self._collect_defined_names(lines)
        for idx, line in enumerate(lines, start=1):
            stripped = self._code_without_comments_or_strings(line).strip()
            if not stripped:
                continue
            if _FUNCTION_DEF_RE.match(stripped):
                continue

            expr_to_check = stripped
            lhs_name = ""
            assign = _ASSIGN_RE.match(stripped)
            if assign:
                lhs_name = assign.group(1).lower()
                expr_to_check = assign.group(2)

            call_names = {name.lower() for name, _, _ in self._extract_calls(expr_to_check)}
            for token in _VAR_TOKEN_RE.findall(expr_to_check):
                lower = token.lower()
                if lower in _RESERVED:
                    continue
                if lower in call_names:
                    continue
                if token.upper() in _FUNCTION_SIGNATURES:
                    continue
                if self._is_known_runtime_symbol(token):
                    continue
                if lower not in defined:
                    diagnostics.append(
                        Diagnostic(
                            severity="warning",
                            code="TSL010",
                            message=f"Variable '{token}' may be used before assignment.",
                            range=(idx, max(1, stripped.find(token) + 1)),
                            suggestion="Initialize the variable before use or check spelling.",
                        )
                    )

            if lhs_name:
                defined.add(lhs_name)

    def _check_function_signatures(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        for idx, line in enumerate(lines, start=1):
            code = self._code_without_comments_or_strings(line)
            for fn, args, start in self._extract_calls(code):
                fn_upper = fn.upper()
                if fn_upper not in _FUNCTION_SIGNATURES:
                    continue
                argc = len(self._split_args(args)) if args.strip() else 0
                expected = _FUNCTION_SIGNATURES[fn_upper]
                if argc != expected:
                    diagnostics.append(
                        Diagnostic(
                            severity="error",
                            code="TSL020",
                            message=f"Function {fn_upper} expects {expected} args, got {argc}.",
                            range=(idx, start + 1),
                            suggestion=f"Adjust arguments for {fn_upper} with {expected} parameters.",
                        )
                    )

    def _check_type_mix(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        for idx, line in enumerate(lines, start=1):
            code = self._code_without_comments_or_strings(line)
            has_bool = re.search(r"\b(true|false)\b", code, re.IGNORECASE)
            has_date = _DATE_LITERAL_RE.search(code)
            has_time_token = re.search(r"\b(date|time)\b", code, re.IGNORECASE)
            has_numeric_op = re.search(r"[+\-*/]", code)
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
            if has_time_token and has_numeric_op:
                diagnostics.append(
                    Diagnostic(
                        severity="info",
                        code="TSL032",
                        message="Potential date/time arithmetic usage detected.",
                        range=(idx, 1),
                        suggestion="Confirm date/time arithmetic is intended and unit-safe.",
                    )
                )

    def _check_future_hints(self, lines: List[str], diagnostics: List[Diagnostic]) -> None:
        for idx, line in enumerate(lines, start=1):
            upper_line = self._code_without_comments_or_strings(line).upper()
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
