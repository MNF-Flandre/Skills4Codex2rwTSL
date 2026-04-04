from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict

from tsl_validation.schemas import TaskSpec, ValidationCase


class TSLRuntimeAdapter(ABC):
    """Adapter contract for TSL runtime execution."""

    name: str = "base"

    @abstractmethod
    def execute(
        self,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
        """Execute TSL source and return structured output payload."""
        raise NotImplementedError
