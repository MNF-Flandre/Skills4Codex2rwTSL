from __future__ import annotations

from typing import Any, Dict

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


class PyTSLAdapter(TSLRuntimeAdapter):
    """Integration point for real pyTSL/TSLPy runtime.

    TODO(integration point): wire actual pyTSL/TSLPy SDK calls here.
    """

    name = "pytsl"

    def execute(
        self,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
        raise RuntimeError(
            "TODO(integration point): pyTSL runtime is not configured in this environment; "
            "use --adapter mock or implement PyTSLAdapter.execute()."
        )
