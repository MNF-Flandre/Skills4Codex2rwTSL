from __future__ import annotations

import ast
import copy
import re
from statistics import mean
from typing import Any, Callable, Dict, List

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


_IDENT_RE = re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\b")


class _EvalValue:
    def __init__(self, value: Any):
        self.value = value

    def _as_list(self) -> List[Any]:
        if isinstance(self.value, list):
            return self.value
        return [self.value]

    def _scalar(self) -> Any:
        if isinstance(self.value, list):
            if not self.value:
                return None
            return self.value[-1]
        return self.value

    def _binary(self, other: Any, op: Callable[[Any, Any], Any]) -> "_EvalValue":
        other_v = other if isinstance(other, _EvalValue) else _EvalValue(other)
        left_list = isinstance(self.value, list)
        right_list = isinstance(other_v.value, list)

        if left_list or right_list:
            left = self._as_list()
            right = other_v._as_list()
            size = max(len(left), len(right))
            left = self._pad_to_size(left, size)
            right = self._pad_to_size(right, size)
            out: List[Any] = []
            for a, b in zip(left, right):
                if a is None or b is None:
                    out.append(None)
                    continue
                try:
                    out.append(op(a, b))
                except Exception:
                    out.append(None)
            return _EvalValue(out)

        a = self._scalar()
        b = other_v._scalar()
        if a is None or b is None:
            return _EvalValue(None)
        try:
            return _EvalValue(op(a, b))
        except Exception:
            return _EvalValue(None)

    @staticmethod
    def _pad_to_size(values: List[Any], size: int) -> List[Any]:
        if not values or len(values) >= size:
            return values
        return values + [values[-1]] * (size - len(values))

    def __add__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a + b)

    def __sub__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a - b)

    def __mul__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a * b)

    def __truediv__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a / b)

    def __gt__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a > b)

    def __ge__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a >= b)

    def __lt__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a < b)

    def __le__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: a <= b)

    def __eq__(self, other: Any) -> "_EvalValue":  # type: ignore[override]
        return self._binary(other, lambda a, b: a == b)

    def __and__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: bool(a) and bool(b))

    def __or__(self, other: Any) -> "_EvalValue":
        return self._binary(other, lambda a, b: bool(a) or bool(b))

    def __invert__(self) -> "_EvalValue":
        if isinstance(self.value, list):
            return _EvalValue([None if x is None else (not bool(x)) for x in self.value])
        return _EvalValue(not bool(self.value))

    def __bool__(self) -> bool:
        v = self._scalar()
        return bool(v)

    def to_output(self) -> Any:
        v = self._scalar()
        if isinstance(v, bool):
            return 1.0 if v else 0.0
        return v


def _normalize_expr(expr: str) -> str:
    normalized = expr.replace("<>", "!=")
    normalized = re.sub(r"(?<![<>!=])=(?!=)", "==", normalized)
    normalized = re.sub(r"\bAND\b", " and ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\bOR\b", " or ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\bNOT\b", " not ", normalized, flags=re.IGNORECASE)

    def repl(match: re.Match[str]) -> str:
        token = match.group(0)
        upper = token.upper()
        lower = token.lower()
        if upper in {"MA", "REF", "ABS", "MAX", "MIN"}:
            return upper
        if lower == "true":
            return "True"
        if lower == "false":
            return "False"
        return lower

    return _IDENT_RE.sub(repl, normalized)


def _ma(series_value: Any, n: Any) -> _EvalValue:
    series = series_value if isinstance(series_value, _EvalValue) else _EvalValue(series_value)
    seq = series._as_list()
    window = int(n.value if isinstance(n, _EvalValue) else n)
    window = max(1, window)
    out: List[Any] = []
    for idx in range(len(seq)):
        start = max(0, idx - window + 1)
        chunk = [x for x in seq[start : idx + 1] if x is not None]
        out.append(mean(chunk) if chunk else None)
    return _EvalValue(out)


def _ref(series_value: Any, k: Any) -> _EvalValue:
    series = series_value if isinstance(series_value, _EvalValue) else _EvalValue(series_value)
    seq = series._as_list()
    offset = int(k.value if isinstance(k, _EvalValue) else k)
    out: List[Any] = []
    for idx in range(len(seq)):
        src = idx - offset
        out.append(seq[src] if 0 <= src < len(seq) else None)
    return _EvalValue(out)


def _abs(x: Any) -> _EvalValue:
    xv = x if isinstance(x, _EvalValue) else _EvalValue(x)
    if isinstance(xv.value, list):
        return _EvalValue([None if v is None else abs(v) for v in xv.value])
    if xv.value is None:
        return _EvalValue(None)
    return _EvalValue(abs(xv.value))


def _max2(a: Any, b: Any) -> _EvalValue:
    av = a if isinstance(a, _EvalValue) else _EvalValue(a)
    return av._binary(b, lambda x, y: max(x, y))


def _min2(a: Any, b: Any) -> _EvalValue:
    av = a if isinstance(a, _EvalValue) else _EvalValue(a)
    return av._binary(b, lambda x, y: min(x, y))


def _safe_eval_expr(expr: str, env: Dict[str, Any]) -> _EvalValue:
    tree = ast.parse(expr, mode="eval")

    def convert(v: Any) -> _EvalValue:
        return v if isinstance(v, _EvalValue) else _EvalValue(v)

    def eval_node(node: ast.AST) -> _EvalValue:
        if isinstance(node, ast.Expression):
            return eval_node(node.body)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float, bool)):
                return _EvalValue(node.value)
            raise ValueError("unsupported constant")
        if isinstance(node, ast.Name):
            if node.id not in env:
                raise NameError(f"unknown identifier: {node.id}")
            return convert(env[node.id])
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise ValueError("unsupported call")
            fn_name = node.func.id
            if fn_name not in {"MA", "REF", "ABS", "MAX", "MIN"}:
                raise NameError(f"unknown function: {fn_name}")
            fn = env[fn_name]
            args = [eval_node(arg) for arg in node.args]
            return convert(fn(*args))
        if isinstance(node, ast.BinOp):
            left = eval_node(node.left)
            right = eval_node(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
            raise ValueError("unsupported binary operator")
        if isinstance(node, ast.UnaryOp):
            operand = eval_node(node.operand)
            if isinstance(node.op, ast.USub):
                return _EvalValue(0) - operand
            if isinstance(node.op, ast.UAdd):
                return operand
            if isinstance(node.op, ast.Not):
                return ~operand
            raise ValueError("unsupported unary operator")
        if isinstance(node, ast.Compare):
            if len(node.ops) != 1 or len(node.comparators) != 1:
                raise ValueError("chained comparisons unsupported")
            left = eval_node(node.left)
            right = eval_node(node.comparators[0])
            op = node.ops[0]
            if isinstance(op, ast.Gt):
                return left > right
            if isinstance(op, ast.GtE):
                return left >= right
            if isinstance(op, ast.Lt):
                return left < right
            if isinstance(op, ast.LtE):
                return left <= right
            if isinstance(op, ast.Eq):
                return left == right
            if isinstance(op, ast.NotEq):
                return ~(left == right)
            raise ValueError("unsupported comparison operator")
        if isinstance(node, ast.BoolOp):
            values = [eval_node(v) for v in node.values]
            if not values:
                return _EvalValue(None)
            acc = values[0]
            for nxt in values[1:]:
                if isinstance(node.op, ast.And):
                    acc = acc & nxt
                elif isinstance(node.op, ast.Or):
                    acc = acc | nxt
                else:
                    raise ValueError("unsupported bool operator")
            return acc
        raise ValueError(f"unsupported expression node: {type(node).__name__}")

    return eval_node(tree)


class MockTSLAdapter(TSLRuntimeAdapter):
    """Local evaluator adapter for a very small TSL subset.

    Supported: assignment lines, MA/REF/ABS/MAX/MIN, arithmetic, comparisons, boolean ops.
    Not supported: control flow semantics, loops, user-defined functions, full TSL grammar.
    """

    name = "mock"

    def execute(
        self,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
        values = case.input_series
        output_fields = case.parameters.get(
            "output_fields",
            ["signal", "value", "avg", "score", "lead_signal", "buy"],
        )

        env: Dict[str, _EvalValue] = {
            "close": _EvalValue(values),
            "open": _EvalValue(values),
            "high": _EvalValue(values),
            "low": _EvalValue(values),
            "volume": _EvalValue([1.0 for _ in values]),
            "true": _EvalValue(True),
            "false": _EvalValue(False),
        }

        runtime_errors: List[str] = []
        assignments: List[str] = []
        trace: List[Dict[str, Any]] = []

        for lineno, raw_line in enumerate(tsl_source.splitlines(), start=1):
            line = raw_line.split("//", 1)[0].strip()
            if not line:
                continue
            if line.endswith(";"):
                line = line[:-1].strip()
            if not line:
                continue
            low = line.lower()
            if low in {"begin", "end", "else"}:
                continue
            if low.startswith("if ") or low.startswith("for ") or low.startswith("while "):
                continue
            if ":=" not in line:
                continue

            lhs, rhs = line.split(":=", 1)
            name = lhs.strip().lower()
            expr = _normalize_expr(rhs.strip())

            eval_env: Dict[str, Any] = {k: v for k, v in env.items()}
            eval_env.update({"MA": _ma, "REF": _ref, "ABS": _abs, "MAX": _max2, "MIN": _min2})

            try:
                value = _safe_eval_expr(expr, eval_env)
                env[name] = value if isinstance(value, _EvalValue) else _EvalValue(value)
                assignments.append(name)
                trace.append(
                    {
                        "line": lineno,
                        "assignment": name,
                        "expression": rhs.strip(),
                        "normalized_expression": expr,
                        "value": env[name].to_output(),
                    }
                )
            except Exception as exc:
                runtime_errors.append(f"line {lineno}: {exc}")
                trace.append(
                    {
                        "line": lineno,
                        "assignment": name,
                        "expression": rhs.strip(),
                        "normalized_expression": expr,
                        "error": str(exc),
                    }
                )
                continue

        outputs: Dict[str, Any] = {}
        for field in output_fields:
            key = field.lower()
            if key in env:
                outputs[key] = env[key].to_output()

        if "value" not in outputs and "avg" in outputs:
            outputs["value"] = outputs["avg"]

        if not outputs and assignments:
            outputs[assignments[-1]] = env[assignments[-1]].to_output()

        outputs["series_tail"] = values[-3:] if values else []
        if "window" in case.parameters:
            outputs["window"] = case.parameters["window"]

        final_env: Dict[str, Any] = {
            k: v.to_output()
            for k, v in env.items()
            if k not in {"close", "open", "high", "low", "volume", "true", "false"}
        }

        return {
            "adapter": self.name,
            "execution_mode": "local_evaluator",
            "runtime_status": "failed" if runtime_errors else "ok",
            "runtime_errors": runtime_errors,
            "outputs": outputs,
            "intermediate": {
                "parsed_assignments": assignments,
                "trace": trace,
                "final_env": final_env,
                "support_scope": {
                    "supported": [
                        "assignment",
                        "MA/REF/ABS/MAX/MIN",
                        "arithmetic +-*/",
                        "comparisons",
                        "boolean and/or/not",
                    ],
                    "unsupported": [
                        "control flow execution",
                        "loops",
                        "full tsl grammar",
                    ],
                },
                "todo": "TODO(integration point): replace with real runtime traces when pyTSL is wired.",
            },
        }
