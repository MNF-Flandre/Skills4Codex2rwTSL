from __future__ import annotations

from statistics import mean
from typing import Any, Dict

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


class MockTSLAdapter(TSLRuntimeAdapter):
    """Mock runtime adapter for environments without pyTSL/TSLPy."""

    name = "mock"

    def execute(
        self,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
        window = int(case.parameters.get("window", 3))
        values = case.input_series
        if not values:
            return {
                "signal": 0.0,
                "value": 0.0,
                "series_tail": [],
                "adapter": self.name,
                "execution_mode": "mock",
                "note": "TODO(mock): replace with real TSL runtime output",
            }

        tail = values[-window:] if window > 0 else values
        baseline = mean(tail)
        bias = float(case.parameters.get("mock_bias", 0.0))
        value = baseline + bias
        signal = 1.0 if value >= baseline else 0.0
        return {
            "signal": signal,
            "value": value,
            "series_tail": tail,
            "adapter": self.name,
            "execution_mode": "mock",
            "note": "mock adapter output for prototype validation",
        }
