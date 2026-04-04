import unittest
from pathlib import Path

from tsl_validation.linting import TslLinter


ROOT = Path(__file__).resolve().parents[1]


class TestTslLinting(unittest.TestCase):
    def test_static_error_case_has_errors(self):
        source = (ROOT / "examples/golden_cases/static_error_case.tsl").read_text(encoding="utf-8")
        diagnostics = TslLinter().lint(source)
        self.assertTrue(any(d.code == "TSL020" for d in diagnostics))

    def test_semantic_case_has_lookahead_warning(self):
        source = (ROOT / "examples/golden_cases/semantic_mismatch_case.tsl").read_text(encoding="utf-8")
        diagnostics = TslLinter().lint(source)
        self.assertTrue(any(d.code == "TSL040" for d in diagnostics))


if __name__ == "__main__":
    unittest.main()
