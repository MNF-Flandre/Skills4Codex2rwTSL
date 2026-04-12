# TSL Issue Log - Public Version

This file is a sanitized, shareable summary of TSL issues and fixes. It omits user-specific function names, assignment-specific values, and private debugging details.

## 2026-03-19

### 001 - Compile error caused by invalid string concatenation
- Symptom:
  - Parser reported `end not found`, `statement error`, and cascading compile failures.
- Context:
  - The error appeared in a helper function that built strings for display and evaluation.
- Root cause:
  - A non-supported string concatenation operator was used for the target runtime.
- Fix:
  - Replace it with the runtime-supported concatenation operator.
  - Keep `if/else` blocks explicit when the parser is sensitive to block structure.
- Status: fixed

### 002 - Runtime error from `eval`
- Symptom:
  - `eval(...)` failed with an error indicating the input type was wrong.
- Context:
  - The expression being evaluated was assembled dynamically.
- Root cause:
  - `eval` received a non-string value instead of a plain expression string.
- Fix:
  - Build the expression as a scalar string first, then pass that string to `eval`.
- Status: fixed

### 003 - Final answer packaging was too indirect
- Symptom:
  - The top-level entry returned a nested structure that was inconvenient to inspect in the UI.
- Context:
  - Multiple question outputs were combined into one aggregate result.
- Root cause:
  - The final answer assembly lived in helper logic instead of the submission entry point.
- Fix:
  - Keep the final return in the main entry function.
  - Use per-question entry points only for inspection.
- Status: fixed

### 004 - Top-level return was not user-friendly in the UI
- Symptom:
  - The main result rendered as a compact opaque object instead of a drillable table.
- Context:
  - The top-level output was a nested array-of-arrays.
- Root cause:
  - The result shape was valid but not convenient for interactive inspection.
- Fix:
  - Add single-question entry points for debugging and inspection.
- Status: fixed

## 2026-03-24

### 005 - Report publish date came from the wrong field
- Symptom:
  - The report-date column returned blank or inconsistent values.
- Context:
  - Candidate date sources were compared side by side.
- Root cause:
  - A generic recent-month field was used where the report publish date field was needed.
- Fix:
  - Use the report-specific right/date query as the primary source.
  - Keep only a narrow fallback for missing data.
- Status: fixed

### 006 - Rolling report list duplicated the newest report
- Symptom:
  - The newest report period appeared twice and an older period disappeared.
- Context:
  - A list of recent report periods was built from two overlapping sources.
- Root cause:
  - A manually added latest period overlapped with an already returned sequence.
- Fix:
  - Normalize the report-period list with deduplication and a fixed cap.
- Status: fixed

### 007 - Report and market calculations used inconsistent dates
- Symptom:
  - Some market-derived fields were constant across multiple report rows.
- Context:
  - Report metrics and market metrics were computed in different contexts.
- Root cause:
  - The market context was not always reset to the correct trading day for each derived field.
- Fix:
  - Recompute market-derived fields on the trading day aligned with the report release date.
- Status: fixed

### 008 - ROE needed the report-period query path
- Symptom:
  - A generic recent-month data call produced ROE values that did not match the reference.
- Context:
  - Several candidate ROE extraction paths were compared directly.
- Root cause:
  - The indicator in question was a report-period value, not a recent-month value.
- Fix:
  - Use the report-period finance query path for ROE.
  - Keep TTM-style metrics on the recent-month path.
- Status: fixed

### 009 - Some finance ratios were still off until the publish-date context was used
- Symptom:
  - ROE and PE values still diverged from the reference after earlier fixes.
- Context:
  - The issue remained after publish-date selection was corrected.
- Root cause:
  - Ratio evaluation needed to be aligned to the report publish date rather than the prior market day.
- Fix:
  - Evaluate ratio and market metrics in the publish-date context when the reference requires it.
- Status: fixed

## Common TSL Notes

- Use `Function ... Begin ... End;` for function bodies.
- Use English punctuation only.
- `array()` is the default table/array constructor.
- `reindex(...)` renames row and column labels.
- `SetSysParam(...)` is the main way to set stock/date/rate context.
- `eval(...)` requires a string expression.
- `if`, `for`, and `while` need explicit `Begin ... End` blocks when there is more than one statement.
- `ReportOfAll(...)` is the report-period data path.
- `Last12MData(...)` is the recent-12-month path.
- `NewReportDateOfEndT2(...)` returns the latest report period before a trading day.
- `IsStockGoMarket()` checks whether the current stock is listed.

