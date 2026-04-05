from __future__ import annotations

import importlib.util
import os
from typing import Any, Dict, List

from tsl_validation.adapters.base import TSLRuntimeAdapter
from tsl_validation.schemas import TaskSpec, ValidationCase


class PyTSLAdapter(TSLRuntimeAdapter):
    """Integration point for real pyTSL/TSLPy runtime.

    execute path stays intentionally unimplemented until real SDK contract is wired.
    """

    name = "pytsl"

    def is_implemented(self) -> bool:
        return False

    def check_environment(self) -> Dict[str, Any]:
        package_candidates = ["pytsl", "tslpy"]
        found_packages: List[str] = [
            name for name in package_candidates if importlib.util.find_spec(name) is not None
        ]

        runtime_config = {
            "server": os.getenv("PYTSL_SERVER"),
            "runtime": os.getenv("PYTSL_RUNTIME"),
            "auth": os.getenv("PYTSL_AUTH_TOKEN"),
            "symbol": os.getenv("PYTSL_SYMBOL"),
            "period": os.getenv("PYTSL_PERIOD"),
            "extra_system_params": os.getenv("PYTSL_EXTRA_SYSTEM_PARAMS"),
        }

        missing_required = [k for k in ["server", "runtime", "auth"] if not runtime_config.get(k)]
        available = bool(found_packages) and not missing_required
        return {
            "available": available,
            "implemented": self.is_implemented(),
            "packages": found_packages,
            "runtime_config": runtime_config,
            "missing_required": missing_required,
        }

    def execute(
        self,
        tsl_source: str,
        case: ValidationCase,
        task_spec: TaskSpec,
    ) -> Dict[str, Any]:
        env_info = self.check_environment()
        if not env_info["available"]:
            return {
                "adapter": self.name,
                "execution_mode": "pytsl",
                "runtime_status": "failed",
                "runtime_errors": [
                    "pyTSL runtime is not ready: package/config not satisfied.",
                    "TODO(integration point): install pytsl/tslpy and provide PYTSL_SERVER/PYTSL_RUNTIME/PYTSL_AUTH_TOKEN.",
                ],
                "outputs": {},
                "integration": {
                    "environment": env_info,
                    "expected_execute_contract": {
                        "inputs": ["tsl_source", "ValidationCase", "TaskSpec", "runtime_config"],
                        "outputs": ["signal", "value", "series_tail", "window"],
                        "todo": "TODO(integration point): wire real SDK calls and map to output schema.",
                    },
                },
            }

        if not env_info["implemented"]:
            return {
                "adapter": self.name,
                "execution_mode": "pytsl",
                "runtime_status": "failed",
                "runtime_errors": [
                    "TODO(integration point): pyTSL execute path is not implemented yet despite environment readiness."
                ],
                "outputs": {},
                "integration": {
                    "environment": env_info,
                    "todo": "TODO(integration point): implement real execute and return runtime outputs.",
                },
            }

        return {
            "adapter": self.name,
            "execution_mode": "pytsl",
            "runtime_status": "failed",
            "runtime_errors": [
                "TODO(integration point): real pyTSL call path placeholder; return mapped outputs when integrated."
            ],
            "outputs": {},
            "integration": {
                "environment": env_info,
                "todo": "TODO(integration point): replace placeholder with production pyTSL invocation.",
            },
        }
