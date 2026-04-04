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
- parameters: `{"window": 3, "mock_bias": 0, "compare_fields": ["signal", "value", "series_tail", "window"]}`

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
  "value": 4.0,
  "series_tail": [
    3,
    4,
    5
  ],
  "window": 3,
  "adapter": "mock",
  "execution_mode": "mock",
  "note": "mock adapter output for prototype validation"
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
| value | 4 | 4.0 | 0.000000 | match | - | - |
| window | 3 | 3 | 0.000000 | match | - | - |

## Next-Step Fix Suggestions
- 优先处理 error 级别静态诊断。
- 针对 mismatch 字段检查参数窗口、偏移和函数语义映射。
- 若使用 mock adapter，请在真实环境下替换 pyTSL adapter 并复跑。

## TSL Source
```tsl
begin
avg := MA(close, 3);
signal := avg > close;
end

```