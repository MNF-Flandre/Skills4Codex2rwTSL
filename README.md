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
