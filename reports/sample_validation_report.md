# Validation Report: case_mock_pass

## Task Spec
- task_id: `ma_signal_validation`
- objective: Validate TSL output against Python reference for moving-average-like logic
- expected_behavior: Core value fields should match tolerance in stable mappings
- tolerance: 1e-06

## Input Snapshot
- case_id: `case_mock_pass`
- name: Mock adapter pass flow
- input_series: `[1, 2, 3, 4, 5]`
- parameters: `{"window": 3, "compare_fields": ["signal", "value", "series_tail", "window"], "required_fields": ["signal", "value"], "field_types": {"signal": "number", "value": "number", "series_tail": "array"}}`

## Python Reference Output
```json
{
  "signal": 0.0,
  "value": 4,
  "series_tail": [
    3,
    4,
    5
  ],
  "window": 3
}
```

## TSL / Adapter Output
```json
{
  "signal": 0.0,
  "value": 4,
  "avg": 4,
  "series_tail": [
    3,
    4,
    5
  ],
  "window": 3
}
```

## Static Diagnostics
```json
[]
```

## Diff Summary
- All compared fields match

## Key Field Diffs
| field | python | tsl | delta | status | reason | suggestion |
|---|---:|---:|---:|---|---|---|
| series_tail | [3, 4, 5] | [3, 4, 5] |  | match | - | - |
| signal | 0.0 | 0.0 | 0.000000 | match | - | - |
| value | 4 | 4 | 0.000000 | match | - | - |
| window | 3 | 3 | 0.000000 | match | - | - |

## Next-Step Fix Suggestions
- Prioritize static diagnostics with error severity.
- For mismatch fields, verify window size, offset semantics, and function mapping.
- If using mock adapter, replace pyTSL adapter in a real runtime environment and re-run.

## TSL Source
```tsl
begin
avg := MA(close, 3);
value := avg;
signal := avg > close;
end

```