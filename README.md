# **TSL** sucks, you need Codex.

> 本仓库收录了一套面向 **TSL** 的技术文档，旨在辅助 Coding Agents 自动生成、检查和调试 TSL 代码。

---

## 📂 文档说明

### 全量技术文档

| 文件 | 内容 |
|------|------|
| [`tinysoft_syntax_tutorial.md`](./tinysoft_syntax_tutorial.md) | TSL 语法与教程全量参考，共 91 页，涵盖语言基础、控制流、数据类型、TS-SQL 等核心语法内容。 |
| [`tinysoft_functions.md`](./tinysoft_functions.md) | TSL 内建函数全量参考，共 1538 页，收录所有内建函数的签名、参数说明与示例，条目较为繁杂。 |

### Agent 精简技术文档

| 文件 | 内容 |
|------|------|
| [`agent_skill_tsl_syntax.md`](./agent_skill_tsl_syntax.md) | 为自动化系统设计的语法参考，目标是让 agent 能精确解析 TSL 源码、生成 AST/模板，并安全构造 TS-SQL 查询。 |
| [`agent_skill_tsl_functions.md`](./agent_skill_tsl_functions.md) | 为 agent 提供结构化的内建函数目录，按类别整理代表性函数，包含签名模板、参数说明、返回值语义与典型示例，便于代码生成、参数校验与单元测试。 |

### 语言对比文档

| 文件 | 内容 |
|------|------|
| [`tsl_vs_pascal_common_pitfalls.md`](./tsl_vs_pascal_common_pitfalls.md) | TSL 与 Pascal 的对比及常见迁移易错点（TSL 与 Pascal 语法相似度约 72%）。为有 Pascal 或类似语言背景的 coding agents 提供类比学习的切入点，帮助快速建立正确的语言直觉。 |

### 问题记录

| 文件 | 内容 |
|------|------|
| [`issue_log_public.md`](./issue_log_public.md) | 实际使用 TSL 过程中遇到的问题与解决方案的脱敏公开版本。**此文件会随实际使用持续更新。** |

---

## 🗺️ 版本路线图

### ✅ v1.0（当前版本）
本仓库目前维护的版本，包含上述所有文档。

### 🚧 v1.1（规划中，有概率推出）
计划加入一个基于 **Python 实现的 Linter**，用于对 TSL 代码进行静态检查，帮助在运行前捕获语法错误与常见问题。

### 🏗️ v2.0（超赞画饼中）
计划基于 **pyTSL** 构建一个**伪内联执行**版本，实现更自动化的 debug 流程——在代码执行链路中自动插入检查点，辅助定位运行时问题。


---

## 🧪 TSL Inline Validation Prototype（v0.1）

新增一个可运行的纵向原型（vertical slice），目标是打通：

- Run TSL Check（轻量静态检查）
- Run Validation（Python参考 + adapter执行 + diff）
- Show Diff Report（markdown/json）
- Ask AI/Copilot to Fix（命令占位 + prompt 生成）

### 目录

- `docs/tsl_inline_validation_prototype.md`
- `python/tsl_validation/`（lint / runner / adapters / schemas）
- `python/ide_bridge.py`（IDE命令桥接）
- `examples/golden_cases/`
- `reports/`
- `tests/`

### 安装依赖

当前原型只依赖 Python 标准库，无需额外安装第三方包。

### 运行静态检查

```bash
PYTHONPATH=python python -m tsl_validation.cli lint examples/golden_cases/static_error_case.tsl
```

### 运行 Validation Runner（mock 模式）

```bash
PYTHONPATH=python python -m tsl_validation.cli validate   examples/golden_cases/mock_pass_case.tsl   --case examples/golden_cases/case_mock_pass.json   --task examples/golden_cases/task_spec.json   --adapter mock   --report reports/sample_validation_report.md
```

### 没有 pyTSL 环境时

使用 `--adapter mock` 跑完整链路；这是默认可演示路径。

### 接入真实 pyTSL/TSLPy 时

实现并替换 `python/tsl_validation/adapters/pytsl_adapter.py` 中：

- `PyTSLAdapter.execute(...)`（当前为 `TODO(integration point)`）
- 保持输出 schema 与 `ValidationResult` 对齐

### IDE 命令桥接示例

```bash
PYTHONPATH=python python python/ide_bridge.py run-check --file examples/golden_cases/static_error_case.tsl
PYTHONPATH=python python python/ide_bridge.py run-validation --file examples/golden_cases/mock_pass_case.tsl --case examples/golden_cases/case_mock_pass.json --task examples/golden_cases/task_spec.json --adapter mock --report reports/sample_validation_report.md
PYTHONPATH=python python python/ide_bridge.py show-diff --report reports/sample_validation_report.md
PYTHONPATH=python python python/ide_bridge.py ask-fix --file examples/golden_cases/semantic_mismatch_case.tsl --report reports/sample_validation_report.md
```


### 执行式验证模式（smoke/spec/oracle）

`validate` 命令支持三档模式：

- `smoke`：只验证“能执行、无运行时异常、输出结构可返回”
- `spec`：在 smoke 基础上校验输出字段/类型/缺失值
- `oracle`：在 spec 基础上执行 Python reference vs runtime 输出关键字段对拍（最终 correctness 判定）

推荐顺序：`smoke -> spec -> oracle`。

### Mock/Local Evaluator 子集（对源码敏感）

当前 mock adapter 不再仅依赖 case 参数，而是读取 `tsl_source` 并求值以下最小子集：

- 赋值语句：`x := expr;`
- 函数：`MA(close, n)`、`REF(x, k)`
- 运算：`+ - * /`，比较 `> < >= <= =`（内部归一为 `==`）
- 布尔：`true / false`
- 变量引用与中间变量链式计算

> 这是一个 very small evaluator，用于验证工程链路可行性；不是完整 TSL 编译器。

### CLI gate 退出码语义

`python -m tsl_validation.cli` 的退出码：

- `0`：通过
- `1`：lint error / runtime failure / spec failure
- `2`：oracle diff mismatch
- `3`：usage/configuration error（例如缺失 case 文件）

示例：

```bash
PYTHONPATH=python python -m tsl_validation.cli validate \
  examples/golden_cases/mock_pass_case.tsl \
  --case examples/golden_cases/case_mock_pass.json \
  --task examples/golden_cases/task_spec.json \
  --adapter auto \
  --mode oracle \
  --report reports/sample_validation_report.md
```

### pyTSL 集成说明（保持 adapter 边界）

`python/tsl_validation/adapters/pytsl_adapter.py` 已支持：

- 运行环境检测（`pytsl`/`tslpy` 包可用性）
- 配置检测（`PYTSL_SERVER`、`PYTSL_RUNTIME`、`PYTSL_AUTH_TOKEN` 等）
- 未就绪时返回结构化 graceful failure（而非直接抛异常）

真实接入需在 `PyTSLAdapter.execute()` 中替换 `TODO(integration point)`，并保持输出 schema：

- `adapter` / `execution_mode` / `runtime_status` / `runtime_errors`
- `outputs`（至少与 compare/required 字段对齐）
- `integration`（环境与对接元数据）


### Reference Strategy（Oracle Reference Layer）

`runner` 现在支持可配置 reference strategy（优先从 `case.parameters.reference_strategy` / `case.parameters.python_reference` 读取）：

- `moving_average_signal`：基于窗口均值产生 `value/signal`
- `last_value`：以最后一个点作为 `value`
- `identity`：恒等映射（可配 threshold）
- `custom_case_config`：由 case 明确提供 `custom_outputs`

`python_reference` 结构化输出包括：
- `outputs`
- `reference_strategy`
- `reference_metadata`
- `intermediate`

### Lint Policy（执行策略）

`validate` 支持 lint policy：

- `block`：有 lint error 直接短路，不执行 runtime
- `warn`：记录 lint error，继续执行 runtime（默认）
- `off`：忽略 lint gate

CLI 示例：

```bash
PYTHONPATH=python python -m tsl_validation.cli validate   examples/golden_cases/static_error_case.tsl   --case examples/golden_cases/case_static_error.json   --task examples/golden_cases/task_spec.json   --mode smoke   --lint-policy block
```

### Auto Adapter Fallback（稳态选路）

`--adapter auto` 现在只有在以下条件都满足时才选 pyTSL：
1. 环境 ready（包 + 必要配置）
2. execute path 已实现（`implemented=true`）

否则自动回退到 mock/local evaluator，并在 metadata 中记录：
- `requested_adapter`
- `actual_adapter`
- `fallback_used`
- `fallback_reason`

### Local Evaluator Trace（可解释执行）

mock/local evaluator 除 outputs 外还返回：
- `intermediate.parsed_assignments`
- `intermediate.trace`
- `intermediate.final_env`
- `intermediate.support_scope`

用于定位语义偏差，不把 prototype 引向完整编译器。

### Ask-Fix Payload（增强）

`ide_bridge.py ask-fix` 的 payload 现包含：
- 源码、diagnostics、mode、failure_kind、diff summary
- mismatch fields、reference strategy、runtime adapter/errors
- runtime intermediate trace/final_env
- minimal repro case
- `repair_prompt_preview`（可直接用于 Copilot/Codex 输入）



### Live pyTSL 本地试跑准备（preflight -> smoke -> oracle）

当前 pyTSL 集成已补齐“真实执行骨架 + preflight + 输出归一化 + live case 模板”，可用于本地带账号试跑准备。

#### 1) 本地配置

复制模板并填写：

```bash
cp .env.example .env.local
# 然后导出到当前 shell（示例）
set -a && source .env.local && set +a
```

必须字段（至少）：
- `PYTSL_SERVER`
- `PYTSL_RUNTIME`
- `PYTSL_AUTH_TOKEN`

常用字段：
- `PYTSL_SYMBOL`
- `PYTSL_PERIOD`
- `PYTSL_START_DATE`
- `PYTSL_END_DATE`
- `PYTSL_MARKET`
- `PYTSL_ADJUST_MODE`
- `PYTSL_EXTRA_SYSTEM_PARAMS`

> 不要提交真实凭证；`.env*` 已在 `.gitignore` 屏蔽（保留 `.env.example`）。

#### 2) live case schema

新增 live 模板在 `examples/live_cases/`：
- `live_smoke_case.json`
- `live_oracle_case.json`

live 关键字段放在：
- `parameters.runtime_case`

包括：
- `symbol/period/start_date/end_date`
- `market/adjust_mode`
- `server/runtime/auth`（可留空走环境变量）
- `extra_system_params`
- `output_fields`

旧 mock case 仍兼容（`input_series` + 既有 parameters）。

#### 3) preflight

先跑 preflight，再跑 validate：

```bash
PYTHONPATH=python python -m tsl_validation.cli preflight   --case examples/live_cases/live_smoke_case.json
```

preflight 结构化输出包含：
- `package_ready`
- `config_ready`
- `case_ready`
- `implemented`
- `overall_ready`
- `problems`

#### 4) live smoke

```bash
PYTHONPATH=python python -m tsl_validation.cli validate   examples/golden_cases/mock_pass_case.tsl   --case examples/live_cases/live_smoke_case.json   --task examples/golden_cases/task_spec.json   --adapter pytsl   --mode smoke   --lint-policy warn   --report reports/live_smoke_report.md
```

#### 5) live oracle

```bash
PYTHONPATH=python python -m tsl_validation.cli validate   examples/golden_cases/mock_pass_case.tsl   --case examples/live_cases/live_oracle_case.json   --task examples/golden_cases/task_spec.json   --adapter pytsl   --mode oracle   --lint-policy warn   --report reports/live_oracle_report.md
```

#### 6) adapter 选择语义

- `--adapter pytsl`：显式走 pyTSL，不会偷偷回退 mock（失败会直接暴露在 preflight/connect/execute/normalize 阶段）。
- `--adapter auto`：允许回退 mock，但会记录 `requested/actual/fallback/reason`。

#### 7) 仍是 TODO(integration point)

已完成：
- 执行分层骨架（load/build/preflight/connect/execute/normalize/disconnect）
- 结构化阶段错误
- 归一化输出层

仍需本地补充：
- 真实 pyTSL SDK 精确 connect/execute 签名与返回结构映射（文件内已显式 `TODO(integration point)`）

