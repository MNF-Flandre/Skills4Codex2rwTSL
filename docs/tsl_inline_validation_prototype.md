# TSL Inline Validation Prototype（Vertical Slice）

## 1. 问题定义
当前 TSL + LLM/Codex 常见流程是“生成代码 → 手工复制到天软 IDE → 运行后才发现问题 → 人工回传修复”。
该流程存在三类核心痛点：
1. 反馈回路长，问题定位慢。
2. 错误类型混杂（语法、口径、运行环境）导致修复成本高。
3. 缺少结构化结果，不利于自动化 Quick Fix 与可追溯演示。

## 2. 三阶段路线

### Stage 1：人工纠错阶段（现状）
- 主要依赖 IDE 内人工试错。
- 缺少本地统一入口与结构化诊断。

### Stage 2：本地静态检查器
- 在执行前做轻量高价值过滤（块结构、疑似未定义变量、函数签名、类型混用、未来函数启发式）。
- 输出结构化诊断，给出修复建议。

### Stage 3：Python + pyTSL 伪内联自校验闭环（主线）
- 同一输入下并行得到：Python 参考值 + TSL 执行值（adapter 抽象，支持 mock 与未来真实 pyTSL）。
- 自动生成 diff 报告，沉淀修复建议与下一步动作。
- 为 IDE 命令入口提供统一编排能力。

## 3. 为什么 Stage 3 是主线、Stage 2 是辅助
- Stage 2 能提前拦截显性问题，但无法证明“结果口径是否正确”。
- Stage 3 直接验证“结果正确性”，并把静态诊断、运行元数据、差异分析串成闭环。
- 因此 Stage 2 是过滤器，Stage 3 才是可演示、可扩展的验证主链路。

### 3.1 执行式验证模式分层（新增）
- `smoke`：仅验证可执行性（是否成功执行、是否有运行时异常、是否产生结构化输出）。
- `spec`：在 smoke 之上验证输出 schema（字段存在性、类型、缺失值）。
- `oracle`：在 spec 之上执行 Python 参考值与 runtime 输出关键字段对拍并产出 diff。最终 gate 以执行式验证结果为主。

结论：静态 lint 只做高价值早筛；`oracle` 执行式验证负责 correctness 定生死。

## 4. 原型范围（Prototype Scope）
本原型聚焦“可运行 vertical slice”，不尝试实现完整编译器或完整 pyTSL 运行时：
- ✅ 轻量静态检查器 + CLI
- ✅ Adapter 模式 Validation Runner（mock 可跑）
- ✅ Diff 报告（JSON + Markdown）
- ✅ IDE 可接入命令入口（命令桥接脚本）
- ✅ Golden cases 与最小测试
- ❌ 完整 TSL 语义执行器（TODO: integration point）

## 5. 目录结构说明

```text
/docs/tsl_inline_validation_prototype.md
/python/tsl_validation/
  adapters/
    base.py
    mock_adapter.py
    pytsl_adapter.py
  schemas.py
  linting.py
  diffing.py
  runner.py
  cli.py
/python/ide_bridge.py
/examples/golden_cases/
/reports/sample_validation_report.md
/tests/
```

## 6. 后续扩展点
1. 用真实 pyTSL / 天软 Python 接口替换 `pytsl_adapter.py` 的 TODO integration point。
2. 把 lint 规则升级为可配置规则集（severity、开关、项目级配置）。
3. 在 VS Code 扩展中接入命令：Run TSL Check / Run Validation / Show Diff / Ask AI to Fix。
4. 增加批量回归与黄金样例管理（基线快照、趋势对比）。
5. 引入更细粒度中间量对齐（逐 bar / 逐步骤 trace diff）。


## 7. pyTSL 集成点（更新）
真实 pyTSL/TSLPy 对接仍通过 adapter 边界完成，不直接耦合 runner：

- 入口：`python/tsl_validation/adapters/pytsl_adapter.py`
- 环境检测：包可用性 + `PYTSL_SERVER` / `PYTSL_RUNTIME` / `PYTSL_AUTH_TOKEN` 等配置
- 未就绪行为：返回结构化 `runtime_status=failed` 和 `runtime_errors`，便于 CLI/IDE graceful 处理
- 对接约束：替换 `TODO(integration point)` 时，必须保持输出结构契约（adapter/runtime status/errors/outputs）


## 8. Oracle Reference Layer（本轮强化）
- Reference 不再是单一均值函数，而是 strategy 驱动。
- 当前可用策略：`moving_average_signal` / `last_value` / `identity` / `custom_case_config`。
- 输出统一结构：`outputs + reference_strategy + reference_metadata + intermediate`。
- 目标：让 oracle 更接近任务规格级 truth layer，而非 case-driven 临时基线。

## 9. Lint Policy 与 Runtime 短路
- `block`：lint error 直接短路，返回结构化 `runtime_skipped=true` 与 `skip_reason`。
- `warn`：继续执行 runtime（默认，便于原型观察完整链路）。
- `off`：完全关闭 lint gate。

## 10. Auto Adapter 稳态回退
- `auto` 模式需要同时满足：`environment.available=true` 且 `implemented=true` 才走 pyTSL。
- 否则自动 fallback 到 mock，并记录 fallback reason。
- `implemented` 当前默认为 false（`TODO(integration point)`），因此默认行为是稳定回退 mock。

## 11. Local Evaluator 支持边界（明确声明）
支持：
- 赋值语句
- `MA/REF/ABS/MAX/MIN`
- `+ - * /`、比较、`and/or/not`

不支持：
- 控制流真实执行
- 循环语义
- 完整 TSL 语法

## 12. Ask-Fix Payload 升级
- 增加 validation mode / failure kind / reference strategy / runtime trace/final env / minimal repro。
- 提供 `repair_prompt_preview`，作为未来直接投喂模型的修复提示草稿。

