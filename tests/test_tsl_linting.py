import unittest
from pathlib import Path

from tsl_validation.linting import TslLinter


ROOT = Path(__file__).resolve().parents[1]


class TestTslLinting(unittest.TestCase):
    def test_static_error_case_has_errors_and_rhs_undefined(self):
        source = (ROOT / "examples/golden_cases/static_error_case.tsl").read_text(encoding="utf-8")
        diagnostics = TslLinter().lint(source)
        codes = {d.code for d in diagnostics}
        self.assertIn("TSL020", codes)
        self.assertIn("TSL010", codes)

    def test_semantic_case_has_lookahead_warning(self):
        source = (ROOT / "examples/golden_cases/semantic_mismatch_case.tsl").read_text(encoding="utf-8")
        diagnostics = TslLinter().lint(source)
        self.assertTrue(any(d.code == "TSL040" for d in diagnostics))

    def test_date_mix_case_has_time_warning(self):
        source = (ROOT / "examples/golden_cases/date_mix_case.tsl").read_text(encoding="utf-8")
        diagnostics = TslLinter().lint(source)
        self.assertTrue(any(d.code in {"TSL031", "TSL032"} for d in diagnostics))

    def test_nested_builtin_calls_and_continue_do_not_raise_undefined_warnings(self):
        source = """
Function demo(stock, calc_date, rate_day, rdate);
Begin
  SetSysParam(PN_Stock(), stock);
  SetSysParam(PN_Date(), calc_date);
  SetSysParam(PN_Cycle(), Cy_Day());
  SetSysParam(PN_RateDay(), rate_day);
  v := Int(ReportValueByRight(stock, IntToDate(rdate), 42001, 0));
  v2 := Last12MData(rdate, 42001);
  for i, row in array() do
  begin
    if IfNil(row) then
      continue;
  end;
  return StockPNA(calc_date);
End;
"""
        diagnostics = TslLinter().lint(source)
        self.assertFalse(any(d.code == "TSL010" for d in diagnostics), diagnostics)

    def test_hw4_style_runtime_functions_are_not_flagged_as_undefined(self):
        source = """
Function demo(stock, d, base_date, state);
Begin
  stks := GetBKByDate("SH000016", base_date);
  name := StockSWIndustryNameLv1();
  state := BackUpSystemParameters2();
  SetSysParam(CT_QuarterData(), True);
  ratio := AssetsNetProfitRatio(20200630);
  RestoreSystemParameters(state);
  price := StockPE_VI(d) + StockZF2(20);
  dates := PreviousRDateList_II(20200930, 4);
  beta := StockBeta3("SH000016", d);
  return array(stks, name, ratio, price, dates, beta);
End;
"""
        diagnostics = TslLinter().lint(source)
        self.assertFalse(any(d.code == "TSL010" for d in diagnostics), diagnostics)

    def test_single_quoted_symbols_and_downto_are_not_flagged_as_undefined(self):
        source = """
Begin
  index_id := 'SH000016';
  stock_id := 'SH600028';
  for i := 10 downto 1 do
  begin
    row := array(index_id, stock_id, i);
  end;
  return row;
End;
"""
        diagnostics = TslLinter().lint(source)
        self.assertFalse(any(d.code == "TSL010" for d in diagnostics), diagnostics)

    def test_sql_style_select_block_keywords_and_end_are_not_flagged(self):
        source = """
Function ts_sql();
Begin
  A := array(
    ("code":"SZ300001","eps":0.28,"close":21.16),
    ("code":"SZ300002","eps":0.78,"close":31.15),
    ("code":"SZ300003","eps":0.40,"close":15.65)
  );

  return select drange((0 to 2) of 10) *
         from A
         where ["eps"] > 0.2
         order by ["close"] desc
         end;
End;
"""
        diagnostics = TslLinter().lint(source)
        self.assertFalse(any(d.code in {"TSL001", "TSL002", "TSL010"} for d in diagnostics), diagnostics)


if __name__ == "__main__":
    unittest.main()
