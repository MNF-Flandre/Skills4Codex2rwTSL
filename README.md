# **TSL** sucks, you need Codex.

> 本仓库收录了一套面向 **TSL** 的技术文档、验证后端与编辑器前端，目标是让 Coding Agents 与开发者能够更高效地生成、检查、调试并接管 TSL 代码。

---

## 仓库定位

本仓库当前包含三层内容：

1. **TSL 技术文档层**
   - 语法、函数、语言对比、问题记录等文档
2. **Python 验证与执行层**
   - 轻量静态检查、执行式验证、报告生成、IDE 命令桥接
3. **VS Code 前端层**
   - 以扩展形式提供连接配置、预检、验证、报告查看与 Codex handoff 工作流

当前推荐入口是 **`vscode-extension/`**。

---

## 文档说明

### 全量技术文档

| 文件 | 内容 |
|------|------|
| [`tinysoft_syntax_tutorial.md`](./tinysoft_syntax_tutorial.md) | TSL 语法与教程全量参考，涵盖语言基础、控制流、数据类型、TS-SQL 等核心语法内容。 |
| [`tinysoft_functions.md`](./tinysoft_functions.md) | TSL 内建函数全量参考，收录大量内建函数签名、参数说明与示例。 |

### Agent 精简技术文档

| 文件 | 内容 |
|------|------|
| [`agent_skill_tsl_syntax.md`](./agent_skill_tsl_syntax.md) | 面向自动化系统的 TSL 语法精简参考。 |
| [`agent_skill_tsl_functions.md`](./agent_skill_tsl_functions.md) | 面向 agent 的结构化函数目录与调用模板。 |

### 语言对比文档

| 文件 | 内容 |
|------|------|
| [`tsl_vs_pascal_common_pitfalls.md`](./tsl_vs_pascal_common_pitfalls.md) | TSL 与 Pascal 的对比及常见迁移易错点。 |

### 问题记录

| 文件 | 内容 |
|------|------|
| [`issue_log_public.md`](./issue_log_public.md) | 实际使用 TSL 过程中遇到的问题与解决方案的脱敏公开版本。 |

---

## 版本路线图

### ✅ v1.0
完成基础文档仓库建设，包含：
- TSL 全量语法文档
- TSL 全量函数文档
- Agent 精简技能文档
- Pascal 对比与常见问题记录

### ✅ 1.1
完成基于 **Python** 的轻量静态检查与验证后端，包括：
- TSL Linter
- Validation Runner
- Diff Report
- IDE Bridge
- golden cases 与测试体系

### ✅ 2.0
完成基于 **pyTSL / 本地桥接路径** 的执行式验证原型，包括：
- preflight / smoke / spec / oracle 分层验证
- live case 模板
- 本地桥接 smoke 路径
- 结构化运行时诊断与报告输出

### ✅ 3.0
完成基于 **VS Code Extension** 的前端工作台，包括：
- Sidebar / StatusBar / CodeLens / Commands
- Connection 配置与 Diagnostic Wizard
- 当前文件 Lint / Smoke / Spec / Oracle
- Codex-friendly handoff
- 本地打包、安装与发布前 hardening 流程

### 🚧 4.0
TBC，欢迎 issue。

---

## VS Code Extension（当前推荐前端）

`vscode-extension/` 提供当前推荐的使用方式。

它负责：
- 连接配置
- backend 发现
- preflight 与验证命令
- 报告查看
- Codex handoff

Python backend 仍作为底层执行层：
- `python/tsl_validation/*`
- `python/ide_bridge.py`

扩展支持：
- `repo_attached_mode`
- `external_workspace_mode`

当前项目形态已经从“文档仓库”升级为：
- **文档 + Python backend + VS Code extension** 的完整工作流仓库。

---

## Python Validation Backend

Python 层提供以下能力：

- TSL 静态检查
- smoke / spec / oracle 执行式验证
- mock / pyTSL adapter
- report 生成
- IDE bridge
- live runtime 准备与预检

核心目录：

- `python/tsl_validation/`
- `python/ide_bridge.py`
- `examples/golden_cases/`
- `examples/live_cases/`
- `reports/`
- `tests/`

---

## Codex / Copilot 协作定位

本仓库不是单纯的文档集合，也不是单纯的扩展前端。  
它的核心目标是为 **Codex / Copilot / Coding Agents** 提供一个更稳定的 TSL 工作台，使其可以：

- 读取文档
- 生成 TSL
- 检查 TSL
- 执行验证
- 读取报告
- 在 VS Code 中接管当前文件继续修改

---

## 相关目录

- `vscode-extension/`：VS Code 前端
- `python/`：验证与桥接后端
- `examples/`：golden cases / live cases
- `reports/`：样例报告与运行输出
- `docs/`：原型与设计说明
- `tests/`：测试

---

## 备注

详细使用方式、排障说明与扩展侧说明请分别查看：

- `vscode-extension/README.md`
- `vscode-extension/TROUBLESHOOTING.md`
- `docs/tsl_inline_validation_prototype.md`
