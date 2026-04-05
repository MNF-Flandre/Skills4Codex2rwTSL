from __future__ import annotations

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
            left = left + [left[-1]] * (size - len(left)) if len(left) < size and left else left
            right = right + [right[-1]] * (size - len(right)) if len(right) < size and right else right
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

    def repl(match: re.Match[str]) -> str:
        token = match.group(0)
        upper = token.upper()
        lower = token.lower()
        if upper in {"MA", "REF"}:
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


class MockTSLAdapter(TSLRuntimeAdapter):
    """Local evaluator adapter for small TSL subset validation."""

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
            eval_env.update({"MA": _ma, "REF": _ref})

            try:
                value = eval(expr, {"__builtins__": {}}, eval_env)
            except Exception as exc:
                runtime_errors.append(f"line {lineno}: {exc}")
                continue

            env[name] = value if isinstance(value, _EvalValue) else _EvalValue(value)
            assignments.append(name)

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

        return {
            "adapter": self.name,
            "execution_mode": "local_evaluator",
            "runtime_status": "failed" if runtime_errors else "ok",
            "runtime_errors": runtime_errors,
            "outputs": outputs,
            "intermediate": {
                "parsed_assignments": assignments,
                "todo": "TODO(integration point): replace with real runtime traces when pyTSL is wired.",
            },
        }
