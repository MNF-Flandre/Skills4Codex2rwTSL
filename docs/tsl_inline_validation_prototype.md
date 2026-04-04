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
