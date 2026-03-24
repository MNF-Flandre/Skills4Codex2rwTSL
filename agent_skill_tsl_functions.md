# TSL / TS-SQL — Agent Skill: 内建函数详尽目录

目的：为 agents 提供结构化的内建函数参考，包含分类、签名模板、参数说明、返回值语义与典型示例。便于自动完成：代码生成、参数校验、单元测试与文档化。

说明：`tinysoft_functions.md` 为原始函数参考（人类可读、条目繁多）。本文件筛选并按类别整理代表性函数，并为 agent 提供用于自动抽取全量函数的流程与示例。若你需要，我可以把 `tinysoft_functions.md` 自动解析为完整 JSON/CSV 索引（每个条目：name, signature, params[], return, category, example）。

## 分类索引（更详细）

- 字符串处理
  - `Trim(s:String):String` — 去两端空白。示例：`Trim(' abc ') -> 'abc'`。
  - `Split(s:String, sep:String):Array` — 分割字符串为数组。
  - `Pos(sub,s):Integer` — 子串位置。

- 数学与统计
  - `Abs(x)`, `Pow(x,y)`, `Sqr(x)`, `Log(x)`, `Exp(x)`。
  - `SumOf(series, n)`: 滑动窗口求和（在 TS-SQL 聚合上下文中常见）。

- 时间与日期
  - `DateAdd(date, n, unit)` — 日期加减。
  - `DateDiff(d1,d2,unit)` — 返回差值。
  - `YearOf/MonthOf/DayOf` — 提取日期字段。

- 数组与矩阵
  - `MFind(M, cond)`: 按 条件 查找矩阵元素，返回坐标和/或值。
  - `MRow(M,i)`, `MCol(M,j)` — 返回矩阵的行/列。

- 文件与 IO
  - `ReadFile(path)`, `WriteFile(path, data)`。
  - `CopyFrom(src,dest)`、`Seek(handle, pos, mode)`。

- 网络与系统
  - `SendCmd(host, cmd)`, `Recv(handle)` — 基础套接字/协议函数。
  - `SetSysParam(name,val)`, `GetSysParam(name)`。

- 金融/时序（常用）
  - `Spec(code, field)` — 返回标的字段序列（例如 Close, Open, High, Low, Vol）。
  - `SpecDate(code, date)` — 返回指定日期的指定标的数值。
  - `MA(series, n)`, `EMA(series, n)`, `RSI(series, n)`, `MACD(series, fast, slow, sig)`。

## 代表性函数条目（模板化，agent 可据此扩展）

- Name: `SumOf`
  - Category: 聚合/统计
  - Signature: `SumOf(series, n, [opts])`
  - Params:
    - `series` (Array/Matrix/FieldExpr): 待聚合序列或表达式
    - `n` (Integer): 窗口大小
    - `opts` (optional): 额外选项（如边界策略）
  - Return: Number or Array (depending on上下文)
  - Example: `SumOf(["Close"], 5)`

- Name: `Spec`
  - Category: 金融/数据访问
  - Signature: `Spec(code, field[, options])`
  - Params: `code` (String), `field` (String)
  - Return: TimeSeries（Array/Matrix）
  - Example: `Spec('SZ000001','Close')`

- Name: `MFind`
  - Category: 矩阵/数组
  - Signature: `MFind(M:Matrix, cond:Expr[, returnValue:Boolean])`
  - Return: Array of {row, col, value}
  - Example: `MFind(A, MCell>0.9, true)`

## Agent 使用建议（生成与校验）

- 参数校验模板：在调用任何内建函数前，生成参数检查代码，例如：

```
if not ifArray(series) then
  raise('invalid series');
if not ifInt(n) then n := int(n);
res := SumOf(series, n);
```

- 错误/异常处理：对 IO/网络/外部调用自动包裹 `try/except`，并将错误转为统一结构：`{ok:false, err:'msg', code:123}`。

- 性能建议：对昂贵计算（大型矩阵/外部请求）自动加入 `STATIC` 或缓存键以避免重复计算；对聚集/滑窗尽量使用内部向量化函数。

## 自动提取全量函数（建议流程）

1. 读取 `tinysoft_functions.md`（已在工作区）。
2. 使用正则/规则抽取：条目名、签名行、参数说明、示例片段。
3. 生成 JSON 行为记录：

```
{
  "name": "SumOf",
  "signature":"SumOf(series,n)",
  "category":"aggregation",
  "params":[{"name":"series","type":"array"},{"name":"n","type":"int"}],
  "example":"SumOf([\"Close\"],5)"
}
```

4. 验证：对 50-100 条代表性函数生成 unit tests（示例调用）并检查解析/签名匹配。

我可以现在直接：
- A）从 `tinysoft_functions.md` 自动抽取并输出完整 JSON（每项包含签名、类别、示例）；
- B）仅扩展当前文件，加入更多代表性函数与示例（我已经把模板写好）；
- C）生成 CSV 以便导入数据库或表格工具。

