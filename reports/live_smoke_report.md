# Validation Report: live_smoke_case

## Validation Outcome
- status: `pass`
- failure_kind: ``
- mode: `smoke`
- lint_policy: `warn`
- adapter: `pytsl`
- runtime_stage: `completed`
- adapter_resolution: `{"requested_adapter": "pytsl", "actual_adapter": "pytsl", "fallback_used": false, "fallback_reason": ""}`

## Task Spec
- task_id: `ma_signal_validation`
- objective: Validate TSL output against Python reference for moving-average-like logic
- expected_behavior: Core value fields should match tolerance in stable mappings
- tolerance: 1e-06

## Input Snapshot
- case_id: `live_smoke_case`
- name: Live pyTSL smoke template
- input_series: `[]`
- parameters: `{"reference_strategy": "last_value", "runtime_case": {"connection_mode": "local_client_bridge", "network_required": false, "host": "10.15.21.181", "port": 443, "username": "", "password": "", "symbol": "TODO_LOCAL_SYMBOL", "period": "TODO_LOCAL_PERIOD", "start_date": "2023-10-01", "end_date": "2023-10-25", "market": "SH", "adjust_mode": "unadjusted", "server": "", "runtime": "", "auth": "", "extra_system_params": "", "connection_label": "local_client_bridge", "note": "fill username/password via env or .env.local; keep real credentials out of git", "output_fields": ["signal", "value", "series_tail", "window"]}, "output_fields": ["signal", "value", "series_tail", "window"], "compare_fields": ["signal", "value"], "required_fields": ["signal", "value"], "field_types": {"signal": "number", "value": "number", "series_tail": "array"}}`

## Python Reference Output
```json
{
  "outputs": {
    "signal": 0.0,
    "value": 0.0,
    "series_tail": [],
    "window": 0
  },
  "reference_strategy": "last_value",
  "reference_metadata": {
    "note": "empty input series",
    "config": {}
  },
  "intermediate": {}
}
```

## TSL / Adapter Output
```json
{
  "signal": 1,
  "value": 1,
  "series_tail": [
    1,
    2,
    3
  ],
  "window": 3
}
```

## Static Diagnostics
```json
[
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'return' may be used before assignment.",
    "range": [
      2,
      1
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  },
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'signal' may be used before assignment.",
    "range": [
      2,
      15
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  },
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'value' may be used before assignment.",
    "range": [
      2,
      28
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  },
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'series_tail' may be used before assignment.",
    "range": [
      2,
      40
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  },
  {
    "severity": "warning",
    "code": "TSL010",
    "message": "Variable 'window' may be used before assignment.",
    "range": [
      2,
      69
    ],
    "suggestion": "Initialize the variable before use or check spelling."
  }
]
```

## Diff Summary
- diff skipped in smoke mode
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
  return array("signal", 1, "value", 1, "series_tail", array(1,2,3), "window", 3);
end;

```