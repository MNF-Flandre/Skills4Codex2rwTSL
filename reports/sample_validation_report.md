# Validation Report: case_static_error

## Validation Outcome
- status: `fail`
- failure_kind: `lint_error`
- mode: `smoke`
- lint_policy: `block`
- adapter: `none`
- runtime_stage: ``
- adapter_resolution: `{"requested_adapter": "auto", "actual_adapter": "none", "fallback_used": false, "fallback_reason": ""}`

## Task Spec
- task_id: `ma_signal_validation`
- objective: Validate TSL output against Python reference for moving-average-like logic
- expected_behavior: Core value fields should match tolerance in stable mappings
- tolerance: 1e-06

## Input Snapshot
- case_id: `case_static_error`
- name: Static obvious error case
- input_series: `[10, 11, 12, 13, 14]`
- parameters: `{"reference_strategy": "moving_average_signal", "window": 3, "compare_fields": ["signal", "value"], "required_fields": ["signal", "value"]}`

## Python Reference Output
```json
{
  "outputs": {
    "signal": 0.0,
    "value": 13,
    "series_tail": [
      12,
      13,
      14
    ],
    "window": 3
  },
  "reference_strategy": "moving_average_signal",
  "reference_metadata": {
    "config": {},
    "strategy_intent": "Moving-average based truth oracle for signal/value."
  },
  "intermediate": {
    "window": 3,
    "tail": [
      12,
      13,
      14
    ],
    "last": 14,
    "tail_mean": 13
  }
}
```

## TSL / Adapter Output
```json
{}
```

## Static Diagnostics
```json
[
  {
    "severity": "error",
    "code": "TSL002",
    "message": "Block likely missing closing 'end'.",
    "range": [
      6,
      1
    ],
    "suggestion": "Add missing 'end' for opened blocks."
  },
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'y' may be used before assignment.",
    "range": [
      3,
      6
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  },
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'threshold' may be used before assignment.",
    "range": [
      4,
      20
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  },
  {
    "severity": "error",
    "code": "TSL020",
    "message": "Function MA expects 2 args, got 1.",
    "range": [
      2,
      11
    ],
    "suggestion": "Adjust arguments for MA with 2 parameters."
  }
]
```

## Diff Summary
- runtime skipped
- mismatch_types: none

## Priority Fix Focus
- top mismatch fields: none
- Suggested order: schema/type issues -> numeric divergence -> semantic divergence

## Key Field Diffs
| field | python | tsl | delta | status | mismatch_type | suggestion |
|---|---:|---:|---:|---|---|---|

## TSL Source
```tsl
begin
signal := MA(close);
x := y + 1;
if crossup(signal, threshold) then
  buy := true;
end

```