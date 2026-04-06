from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple


RangeTuple = Tuple[int, int]


@dataclass
class Diagnostic:
    severity: str
    code: str
    message: str
    range: RangeTuple
    suggestion: str


@dataclass
class TaskSpec:
    task_id: str
    objective: str
    expected_behavior: str
    tolerance: float = 1e-6


@dataclass
class ValidationCase:
    case_id: str
    name: str
    input_series: List[float] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DiffItem:
    field: str
    python_value: Any
    tsl_value: Any
    delta: Optional[float]
    status: str
    reason_hint: str
    suggestion: str


@dataclass
class DiffReport:
    case_id: str
    summary: str
    items: List[DiffItem] = field(default_factory=list)


@dataclass
class ValidationResult:
    task_spec: TaskSpec
    case: ValidationCase
    diagnostics: List[Diagnostic]
    python_reference: Dict[str, Any]
    tsl_output: Dict[str, Any]
    metadata: Dict[str, Any]
    diff_report: DiffReport

    def to_dict(self) -> Dict[str, Any]:
        return _jsonable(asdict(self))


def _jsonable(value: Any) -> Any:
    if isinstance(value, bytes):
        for encoding in ("utf-8", "gbk", "gb18030"):
            try:
                return value.decode(encoding)
            except Exception:
                continue
        return value.decode("utf-8", errors="ignore")
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, tuple):
        return [_jsonable(v) for v in value]
    return value
