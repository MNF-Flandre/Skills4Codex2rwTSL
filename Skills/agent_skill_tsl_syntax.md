## 概要与目的
本文件为 agent 而写，目标是让自动化系统可以：
- 精确解析 TSL 源码并生成 AST/模板；
- 自动化生成符合约定的 TSL 代码（含错误处理与回退）；
- 基于 TS-SQL 语句安全构造查询与聚集；
- 将语言特性（类/继承/Operator/MakeInstance）映射为目标运行时调用（C/外部 API）。

> 说明：实际部署环境会影响可用内置函数（金融数据源、扩展模块）。agent 在生产代码中应把外部依赖标注并提供 mock 或回退实现。

## 词法（Tokens）

- 标识符正则（推荐）： [A-Za-z_][A-Za-z0-9_]*。
- 关键字（示例）： Function, Begin, End, Type, Class, private, protected, public, var, const, if, then, else, case, of, for, in, while, repeat, try, except, finally, return, uses, property, operator, external, overload, virtual, override, inherited, self, nil, true, false。
- 数字、字符串与日期字面量：整数/浮点 (支持 L 后缀)、"..." 或 '...' 字符串、`20190101T`（时间字面或用 `inttodate()`）。

## 数据类型

- 基本：Integer, Int64, Real, String, WideString, Boolean, Nil。
- 复合：Array、Matrix、TableArray、Object（类实例）、TDateTime。
- 特殊：MailMsg、TStream、Binary、Any/Variant。

## 表达式与运算

- 运算优先级（示意，从高到低）：函数调用/索引/属性访问 > 一元运算（not, -）> 幂(^) > *,/,% > +,- > 比较运算 > and > or > 赋值。
- 三元：`cond ? a : b`；简写 `x?:y` 在 x 为真时返回 x，否则 y。

## 语句

- 条件与分支：if/else, case ... of ... end（支持区间和逗号分隔标签）。
- 循环：for（普通/倒序/step）、for in（遍历）、while、repeat...until。
- 异常：try ... except ... end; try ... finally ... end。异常对象可通过 `ExceptObject` 读取详细信息。

## 函数签名与调用约定

- 定义：`Function name(params) [:ReturnType]; Begin ... End;`（返回类型可省略）。
- 命名参数：`f(a:1,b:2)`。
- 解包赋值：`[a,b] := array(1,2)`。
- 重载：使用 `overload` 表示。

生成建议（agent）：对所有函数生成签名模板，包含参数类型断言与默认值处理；在调用外部依赖前自动插入 `ifParamType` 校验代码。

## 面向对象：类 / 继承 / 属性

- 类定义、访问控制（private/protected/public）、构造/析构、virtual/override、Inherited 与 Class(Base).Method 的差别。
- 属性与索引器：property read/write 与 index 支持字符串/整数索引。

示例：

```
Type TPerson = Class
private
  _Name;
public
  function Create(n); begin _Name:=n; end;
  function GetName(); begin return _Name; end;
  property Name read GetName write _Name;
End;
```

## Operator（运算符重载）

- 语法：`Operator op(opdata[;isLeft])`，用于类内部定义自定义运算行为（对 agent 生成时注意左/右操作数类型）。

## TS-SQL（Select / 聚集 / RefsOf）

- 基本：`Select <exprs> from <Source> [where <cond>] [group by ...] [having ...] [order by ...] end`。
- RefsOf：`RefsOf(expr, upLevel)` 引用上层结果。
- 聚集扩展：AGGOF 与用户回调（flag 语义：初始化/逐行/完成），内建聚集如 `SumOf`, `AvgOf` 等。

示例：

```
res := select sum(["Close"]) as SumClose from Market where ["Vol"]>1000 group by ["Sector"] end;
```

## 矩阵与数组操作

- 构造：`array(...)`, `zeros(r,c)`, `nils(r,c)`。
- 遍历与 MFind：`MFind(A,cond)` 返回矩阵匹配坐标与值；矩阵表达式 `A::=expr` 把 expr 应用于每个元素并写回。

## 外部接口与 MakeInstance

- external 声明调用 DLL；MakeInstance 把 TSL 函数转换为 C 回调指针（注意 ABI、线程模式以及内存管理）。

## 并发

- `#multirun(expr)` 并行化短任务。agent 在生成并行逻辑时要保证副作用隔离与并发安全。

## 编译指令与运行时

- `{$VarByRef-}` / `{$VarByRef+}`，参数传递控制；`STATIC expr 'name'` 用于缓存。

## 常见陷阱与 agent 注意点

- `for in` 中不能修改容器结构；多重继承调用需显式避免歧义；时间字面与 inttodate 表示需一致化。自动生成代码时务必附带参数校验与异常处理模板。

## 扩展示例（可直接复用）

1) 继承与覆盖：

```
Type A = Class
  function Work(); virtual; begin return 'A'; end;
End;

Type B = Class(A)
  function Work(); override; begin return 'B'; end;
End;
```

2) TS-SQL + RefsOf：

```
R := select *, select sum(["Close"]) from SubTable where ["key"]=RefsOf(["key"],1) end as sub from MainTable end;
```

3) 外部函数与 MakeInstance：

```
Function c_s2d(s:String):Double; external "tslib.dll" name "s2d";
handle := MakeInstance(findfunction('c_s2d'));
```

---
下一步选项（由你选择）：
- 生成 EBNF / JSON 语法规范；
- 把所有内置函数导出为机器可读 JSON/CSV（从 `tinysoft_functions.md` 自动抽取）；
- 扩展示例库为可运行的 TSL 测试片段。

