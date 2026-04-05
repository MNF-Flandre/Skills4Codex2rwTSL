# Validation Report: live_smoke_case

## Validation Outcome
- status: `fail`
- failure_kind: `config_failure`
- mode: `smoke`
- lint_policy: `warn`
- adapter: `pytsl`
- runtime_stage: `preflight`
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
- parameters: `{"reference_strategy": "last_value", "runtime_case": {"symbol": "TODO_LOCAL_SYMBOL", "period": "TODO_LOCAL_PERIOD", "start_date": "TODO_LOCAL_START_DATE", "end_date": "TODO_LOCAL_END_DATE", "market": "TODO_LOCAL_MARKET", "adjust_mode": "TODO_LOCAL_ADJUST_MODE", "server": "", "runtime": "", "auth": "", "extra_system_params": "", "output_fields": ["signal", "value", "series_tail", "window"]}, "output_fields": ["signal", "value", "series_tail", "window"], "compare_fields": ["signal", "value"], "required_fields": ["signal", "value"], "field_types": {"signal": "number", "value": "number", "series_tail": "array"}}`

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
{}
```

## Static Diagnostics
```json
[]
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
avg := MA(close, 3);
value := avg;
signal := avg > close;
end

```