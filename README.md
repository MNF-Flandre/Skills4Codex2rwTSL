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
