# Tinysoft Syntax/Tutorial (with indentation)

Total pages: 91

## TOC

- [1382 - InputQuery](#page-1382)
- [1384 - MessageBox](#page-1384)
- [1485 - 概述](#page-1485)
- [1490 - 继承](#page-1490)
- [1491 - 作用域](#page-1491)
- [1494 - 声明和实现](#page-1494)
- [1499 - 多态](#page-1499)
- [1500 - 隐藏](#page-1500)
- [1501 - 重载(overload)](#page-1501)
- [1502 - 构造函数](#page-1502)
- [1505 - Self](#page-1505)
- [1506 - 类方法](#page-1506)
- [1507 - 属性Property](#page-1507)
- [1508 - 索引器(index)](#page-1508)
- [1509 - IS关键字](#page-1509)
- [20414 - FilterNotIn](#page-20414)
- [21143 - Fmin](#page-21143)
- [21144 - NonLP_minSUMT](#page-21144)
- [21145 - NonLP_minPS](#page-21145)
- [21146 - NonLP_minFactor](#page-21146)
- [21147 - NonLP_Fmincon](#page-21147)
- [21336 - 数据库访问函数](#page-21336)
- [21342 - SQLErrorMsg](#page-21342)
- [21393 - SysSendMail](#page-21393)
- [23270 - FundNAWByRateBegtEndt](#page-23270)
- [27627 - AD](#page-27627)
- [29423 - ExcelClose](#page-29423)
- [29424 - ExcelQuit](#page-29424)
- [29854 - 类类型声明的位置](#page-29854)
- [29855 - 类类型声明的语法](#page-29855)
- [29860 - 内联与外联](#page-29860)
- [29864 - Operator](#page-29864)
- [29978 - where进行条件查询](#page-29978)
- [29979 - Order By对返回的结果集进行排序](#page-29979)
- [29983 - Group by 进行分组与Having进行分组后的结果筛选](#page-29983)
- [30008 - RefsOf访问上级结果集](#page-30008)
- [30100 - AGGOF](#page-30100)
- [30101 - 聚集扩展函数的定义规范](#page-30101)
- [30103 - Correlof](#page-30103)
- [30104 - Covof](#page-30104)
- [30105 - Slopeof](#page-30105)
- [30106 - Interceptof](#page-30106)
- [30107 - Rsqof](#page-30107)
- [30108 - Steyxof](#page-30108)
- [30109 - Slopeandinterceptof](#page-30109)
- [30142 - TSL程序的基本构成](#page-30142)
- [30215 - STATIC静态计算](#page-30215)
- [30292 - ?:省略真表达式的三元运算符的特殊用法](#page-30292)
- [30310 - IF](#page-30310)
- [30311 - CASE](#page-30311)
- [30312 - 循环语句](#page-30312)
- [30313 - WHILE](#page-30313)
- [30314 - REPEAT](#page-30314)
- [30315 - FOR](#page-30315)
- [30316 - BREAK](#page-30316)
- [30317 - CONTINUE](#page-30317)
- [30318 - GOTO](#page-30318)
- [30321 - DEBUGRETURN](#page-30321)
- [30322 - 异常处理Try Except/Finally](#page-30322)
- [30327 - With => Do](#page-30327)
- [30342 - 概念](#page-30342)
- [30348 - VarByRef编译选项](#page-30348)
- [30386 - 隐藏](#page-30386)
- [30391 - 在function中使用uses](#page-30391)
- [30435 - MFind矩阵查找](#page-30435)
- [30521 - 矩阵查找和遍历](#page-30521)
- [30734 - 设定指定变量为自动弱引用](#page-30734)
- [31515 - 多参数赋值运算](#page-31515)
- [31517 - 命名参数调用](#page-31517)
- [31660 - Inherited](#page-31660)
- [31758 - 第一种：当前交互语句设置为Openforwardonly模式](#page-31758)
- [31759 - 第二种：设置当前环境缺省为Openforwardonly模式](#page-31759)
- [31778 - 使用范例](#page-31778)
- [31786 - MakeInstance](#page-31786)
- [32062 - TSL调用外部动态库的函数](#page-32062)
- [32759 - 循环语句](#page-32759)
- [32762 - fc_while](#page-32762)
- [32981 - UNIT单元中常量与变量](#page-32981)
- [33908 - for in循环在对象中的重载](#page-33908)
- [33909 - For in循环在对象中重载的示例](#page-33909)
- [34396 - ::,:.,mcell,mrow,mcol,mIndexCount,mIndex等算符在对象中的重载](#page-34396)
- [34453 - 平台模型远程调用客户端函数，访问客户端的资源](#page-34453)
- [34629 - 不定个数参数...](#page-34629)
- [34734 - 面向对象的Operator算符重载支持++,--,+=,-=](#page-34734)
- [34737 - 对象[]重载时允许多级的应用示例](#page-34737)
- [34738 - 对象算符重载数组set算符时none类型的应用实例](#page-34738)
- [34857 - IF表达式](#page-34857)
- [34860 - Not Like](#page-34860)
- [34867 - 网格计算设置任务超时时间](#page-34867)
- [34884 - 单元中的类-应用实例](#page-34884)
- [35807 - const常量成员](#page-35807)

---

## 1382 - InputQuery

InputQuery    复制链接
简述
 与前端交互函数，输入字符串对话框。如果选择OK则返回真，否则返回假。
定义
 InputQuery(Caption:String;Hint:String;VarResult:String):Boolean;
参数
名称
类型
说明
Caption
String
字符串类型，输入对话框的标题。
Hint
String
字符串类型，输入提示性语句
VarResult
String
字符串类型，入口作为初始字符串，返回为输入后的字符串；
返回
Boolean
 返回布尔型，如果选择OK则返回真，否则返回假。
范例
```tsl
if not rdo2 inputquery("输入数据","输入被除数",M1) then
return "未输入被除数";
if not rdo2 inputquery("输入数据","输入除数",M2) then
return "未输入除数";
return strtofloat(M1) / strtofloat(M2);
```
执行第一个if时，弹出如上对话框，输入3点击确定，这是执行第二个if弹出如下个对话框
输入6点击OK则返回的结果是0.5.
相关
对话框数据类别函数
InputQuery
PromptForFileName
MessageBox
InputDialog
BuildOptionComboValue
ShowValue

---

## 1384 - MessageBox

MessageBox    复制链接
简述
 与前端交互函数，显示消息对话框，返回用户选择的按钮ID号
此函数的功能显示消息对话框，比如在运行程序时如果触发了某个条件，就可以使用此函数弹出消息对话框进行提示，达到监控的状态。函数的第三个参数消息对话框的控制字，可以是单个控制字也可以是多个控制字的相加而成，实现多个控制字的相加的方法用位运算，用符号.∣。
天软有各类单一功能的控制字，可以相加变成多功能的消息对话框，将个类功能的控制字相加一起应用是一个完整的消息显示框。各类控制字如下表：
功能类别
范例控制字函数
类型控制字
mb_YesNo()
图标控制字
mb_IconWarning()
默认按钮控制字
mb_DefButton2()
模式控制字
mb_TaskModal()
其他控制字
mb_right()
返回字
idYes()
定义
 MessageBox(Text:String;Caption:String;uType:Integer):Integer;
参数
名称
类型
说明
Text
String
字符串类型，显示消息对话框的内容。
Caption
String
字符串类型，显示消息对话框的内容。
uType
Integer
整数类型。可由消息对话框的各种控制字相加而成。参见消息对话框的类型控制字，消息对话框的图标控制字，消息对话框的默认按钮控制字，消息对话框的模式控制字，消息对话框的其他控制字。
返回
Integer
 返回用户选择的按钮ID号，详情看消息对话框的返回字
范例
范例1：
```tsl
a:=3;
if a>2 then b:=rdo2 MessageBox('a>2,要继续吗？','测试对话框',rdo2 mb_YesNo());
if b=6 then return 1;
else return 0;
```
显示的消息对话框如下：
其中，mb_YesNo()函数为控制字函数，各控制字函数可以参考链接：
http://www.tinysoft.com.cn/tsdn/helpdoc/display.tsl?id=1380
 范例2：
两个控制字函数相加的消息显示框,两个控制字函数相加用位或的运算符号.|，程序如下：
```tsl
a:=3;
c:=rdo2 mb_YesNo().|rdo2 mb_IconWarning();
if a>2 then
b:=rdo2 MessageBox('a>2,要继续吗？','测试对话框',c);
if b=7 then return 1;
else return b;
```
弹出的消息显示框则如下：
比范例1多了一个警告图标，即mb_IconWarning()是警告图标控制字函数
参考
消息对话框的返回字。
相关
对话框数据类别函数
InputQuery
PromptForFileName
MessageBox
InputDialog
BuildOptionComboValue
ShowValue

---

## 1485 - 概述

概述    复制链接
  类（或者类类型）定义了一个结构，抽象地，这个结构既可以包括数据，也可以包括行为;
具体地,类可以包括字段、方法和属性；
类的字段、方法和属性被称为它的成员。
类的实例叫做对象；
  >>字段在本质上是一个对象的变量。和记录的字段类似，类的字段表示一个类实例的数据项；
  >>方法是一个函数，它和类相关联。绝大多数方法作用在对象（也就是类的实例）上，其它一些方法（称为类方法）作用在类上面。
  >>属性被看作是访问对象的数据的接口，对象的数据通常用字段来存储。属性可以决定数据如何被读取或修改。属性在被引用的时候就像一个字段，但被实现时候可以是一个方法。
声明了类以后，程序员可以创建作为此类的实例对象。尽管有时类和对象叫法可互换，但它们是不同的概念。类定义对象的类型，但它不是对象本身。对象是基于类的具体实体，有时称为类的实例。
Type MyClass = Class
End;
上面代码声明了一个类类型
Obj:=createObject("MyClass");
上面代码创建了类MyClass的实例.
创建类的实例后，将向程序员传递回对该对象的引用。
在前面的示例中，obj 是对基于 MyClass 的对象的引用。此引用指向了新对象，但不包含对象数据本身。

---

## 1490 - 继承

继承    复制链接
面向对象中，继承是基础。我们可以对已有的类复用和扩展。通过继承我们可以让新类拥有了已有类的数据和行为。也可以扩展新类，使它具有更多的数据和行为。
我们这里称已有类为新类的基类或父类，有的地方也叫超类。
我们称新类为已有类的子类或派生类。
由于TSL支持多级继承。其中基类，基类的基类（如果有的话）都统一叫做子类的祖先类。
子类可以通过继承获得基类的数据和方法，有效复用，提高开发效率，使代码易于维护。
TSL继承的实现方式是：声明类类型时，在Class后面的括号内指定父类型的名称。TSL支持多重继承，基类可以指定多个，其中用逗号分割。格式为：
 type myClass = class(BaseClass1[,BaseClass2,…]);
以上代码定义了一个叫做myClass 的类，它继承自BaseClass1、BaseClass2列表。这样我们称MyClass为子类，BaseClass1，BaseClass2…为MyClass的基类或父类。也可以叫祖先类.
子类MyClass将获得基类(BaseClass1、BaseClass2、…)的所有非私有数据和行为,此外新类可以为自己定义新的数据和行为进行扩展,也可以重新定义基类中的行为.
示例：
```tsl
Program test;
//声明类A
```
Type A = class
```tsl
  Function F1()
  Begin
    Writeln("call A.F1");
  End;
End;
//声明类B,继承自A
```
Type B =Class(A)
```tsl
End;
Begin
  //创建B类的实例对象BB
  BB:=CreateObject("B");
BB.F1;
End.
上面代码类B通过继承获得类A的方法F1(),自己确不用定义方法F1();
```
如果子类的多个基类都有同样的方法，在子类中调用这个方法时需要为这个方法指定具体的父类，方法为在调用的方法前面加上 Class(基类名称).
示例
Type Base1 =Class
```tsl
  Function F();
  Begin
    writeln("Base1.F");
  End;
End;
```
Type Base2 =Class
```tsl
  Function F();
  Begin
    writeln("Base2.F");
  End;
End;
```
Type SubClass =Class(Base1,Base2)
```tsl
  Function CallBaseF();
  Begin
```
    class(Base2).F();//指定要调用类Base2的F方法。
```tsl
  End;
End;
Begin
  S:=CreateObject("SubClass");
  S.CallBaseF();
End.
```
以上代码演示在类内部调用多个基类相同方法的方法，如果在子类的外部调用这个方法，总是调用基类声明在最前面的类的方法。没有办法调用其他基类的方法，一个技巧是必须在子类中包装这个方法，在外面调用包装的方法。
内容
继承单元类以及成员类

---

## 1491 - 作用域

作用域    复制链接
类的每个成员都有一个称为可见性的属性，我们称为作用域。
作用域决定了一个成员在哪些地方以及如何能被访问。TSL用下面3个关键字之一来表示它：private、protected、public
Private:私有域内定义的成员变量以及方法以及其他均属于私有的，仅供在类成员方法中使用
  即表示最小的访问能力，只能在类内部的方法、属性调用，不能从类的外部调用；也不能被继承。
Protected:相比Private，子类可以引用，但外部不行
 即表示中等的访问能力，在声明它的类的模块中是随处可用的，并且在它的派生类中也是可用的。
Public：公有域内定义的内容均可以被内外部调用
 即表示最大的访问能力，只要能使用类的地方都是可用的。
注：
若声明一个成员时没有指定其作用域，则它和前面的成员拥有相同的作用域.
若在类声明的开始没有指定作用域, TSL成员（包括字段、方法、属性）默认的作用域是public。
作用域关键字可以在程序中重复出现多次。
为可读性考虑，最好在声明类时用作用域来组织成员：把所有的private 成员组织在一起，接下来是所有的protected 成员，最后是public成员。用这种方法，每个可见性关键字最多出现一次，并且标明了每个新段的开始。所以，一个典型的类声明应该像下面的形式：
type
MyClass = class(BaseClass)
private
... { private declarations here}
protected
... { protected declarations here }
public
... { public declarations here }
end;
示例：
下面的代码详细说明了继承与作用域的关系
program test;
type A =class()
private
```tsl
  function F1();
  Begin
    Writeln("from private F1");
  End;
```
protected
```tsl
  Function F2();
  Begin
    Writeln("from protected F2");
  End;
```
public
```tsl
  Function F3();
  Begin
    Writeln("from public F3");
  End;
  Function F4();
  Begin
    Writeln("from public F4");
```
    F1();//正确,可以在类内部的方法调用private 的成员。
    F2();//正确,可以在类内部的方法调用protected的成员
    F3();//正确,可以在类内部的方法调用public的成员
```tsl
  End;
End;
```
Type B = Class(A)
```tsl
  Function F5();
  Begin
    Writeln(" Inherit test :call private funciton ");
```
    F1();//错误,不能调用基类的私有方法
```tsl
  End;
  Function F6();
  Begin
    Writeln("inherit test: call protected function");
```
    F2();//正确,调用基类的protected 方法
```tsl
  End;
  Function F7();
  Begin
    Writeln("inhert test :call public function ");
```
    F3();//正确,调用基类的public 方法
```tsl
  End;
End;
Begin
  AA:=createobject("A");
```
  AA.F1();//错误,不能调用类型的private方法
  AA.F2();//错误,不能调用类型的protected方法
  AA.F3();//正确,可以调用类型的public 方法
  AA.F4();//正确,可以调用类型的public 方法,方法内部可以调用private成员.
End.

---

## 1494 - 声明和实现

声明和实现    复制链接
有2种方法为类添加方法。
在类声明中，可以直接定义方法的声明和实现，
或者只在类中定义方法的声明，在类声明后的某个地方（必须属于同一模块）定义它的实现，实现的时候在方法名称前加“类名.”。这种方法称为为外联，上一种方法称为内联.
示例：
Type myClass =class
```tsl
 Function F1();
 Begin
  writeln("内联");
 End;
 Function F2();
End;
function myClass.F2();
Begin
 Writeln("外联");
End;
```
外联声明时，方法名总是使用类名进行限定,形式为：类名.方法名。在方法的头部必须重新列出类声明时的参数，名称可以与声明时的不同，但是参数的顺序必须完全相同。
内容
内联与外联
静态方法声明和调用
对象的方法调用

---

## 1499 - 多态

多态    复制链接
多态是面向对象的重要特性,简单点说:“一个接口，多种实现”，就是同一种事物表现出的多种形态。
编程其实就是一个将具体世界进行抽象化的过程，多态就是抽象化的一种体现，把一系列具体事物的共同点抽象出来, 再通过这个抽象的事物, 与不同的具体事物进行对话。
通过继承可以实现多态。父类中调用被覆盖的方法，如果当前对象是子类的实例，那么实际调用的是子类的方法，而非父类的方法。
通过继承，一个类可以用作多种类型：可以用作它自己的类型、任何祖先类型，当把子类型当作祖先类型时，调用被覆盖的方法，实际调用的是子类本身的方法，而非基类型的方法。
示例：
program test;
type Figure = class
```tsl
  Function Draw(); virtual;//虚方法，可以被覆盖
  Begin
    Writeln("draw Figure");
  End;
  Function DrawAction();
  Begin
    Draw();
  End;
End;
```
Type Ellipse = class(Figure)
```tsl
  Function Draw(); override;//重写父类方法
  Begin
    Writeln("draw Ellipse");
  End;
end;
Begin
  F:=CreateObject("Figure");
```
  F.DrawAction();//输出 draw Figure
  E:=CreateObject("Ellipse");
  E.DrawAction();//输出 draw Ellipse
End.
上面的示例中：
类Ellipse的方法Draw,重写了父类Draw这个虚方法，父类的DrawAction调用了Draw方法，当对象调用DrawAction方法时，实际上是间接调用了Draw方法。
当父类的对象间接Draw方法时：执行的是父类的方法。
  F:=CreateObject("Figure");
  F.DrawAction();//输出 draw Figure
当子类的对象间接用Draw方法时：执行的是子类的方法：
  E:=CreateObject("Ellipse");
  E.DrawAction();//输出 draw Ellipse
如果要强制子类调用父类的方法。需要用下面的方式：
Class(BaseClass,SubObject).FunctionName.
上面的事例中，
```tsl
E:=CreateObject("Ellipse");
Class(Figure,E).Draw();
```
执行的却是父类的Draw方法.输出：输出 draw Figure

---

## 1500 - 隐藏

隐藏    复制链接
如果在子类中重写父类的方法确没有使用override标志符，子类的方法隐藏了基类的方法，而非覆盖。
父类中调用覆盖的方法时，实际执行的是父类的方法。如果当前对象是子类的实例时，执行的还是父类的方法。因为方法在子类型中给隐藏了，而没有被覆盖。
示例：
program test;
type Figure = class
```tsl
  Function Draw();
  Begin
    Writeln("draw Figure");
  End;
  Function DrawAction();
  Begin
    Draw();
  End;
End;
```
Type Ellipse = class(Figure)
```tsl
  Function Draw();//注意没有override
  Begin
    Writeln("draw Ellipse");
  End;
end;
Begin
  F:=CreateObject("Figure");
```
  F.DrawAction();//输出draw Figure
  E:=CreateObject("Ellipse");
  E.DrawAction();//输出draw Figure
End.
与上节的例子不同，子类中定义Draw方法没有使用override关键字，说明子类的Draw方法隐藏了父类的Draw方法.
在父类在中调用Draw方法时，始终执行的是父类的Draw方法.

---

## 1501 - 重载(overload)

重载(overload)    复制链接
TSL可以为一个类声明相同的名称不同参数的多个方法，这叫做重载。
每个重载方法声明后面加关键字overload，并且它们必须有不同的参数列表。
形式为：
Function F();overload;
示例：
Type BaseClass =class
public
```tsl
  function Display(str,str2) ;overload;
  Begin
    writeln(str,' ',str2);
  End;
  function Display(str); overload;
  begin
    writeln(str);
  end;
End;
```
上面的代码为BaseClass 声明了 2个Display方法。可以按照2种方式调用，可以在子类中重载也可以重载父类的方法。
示例：
program test;
Type BaseClass =class
public
```tsl
  function Display(str);
  begin
    writeln(str);
  end;
End;
```
Type SubClass =class(BaseClass)
```tsl
  function Display(str,str2);overload;
  Begin
  writeln(str,' ',str2);
  End;
End;
Begin
  SC:=createObject("SubClass");
  SC.Display("overload");
  SC.Display("overload","test");
End.
```
上面的例子中SubClass继承自BaseClass,而SubClass的Display方法重载了父类Display方法。
原理：SubClass通过继承实际上拥有了方法Display(str)方法，然后通过overload重载了本身的方法，于是SubClass具有了2个不同参数的Display方法。

---

## 1502 - 构造函数

构造函数    复制链接
构造函数是一个特殊的方法，用来创建和初始化一个实例对象。
声明一个构造函数就像声明一个函数一样，可以无参数也可以有参数，不同的是方法名必须是create，在创建实例时会自动查找适合的构造函数。
Function Create()
TSL总是为一个类生成默认的公有(public)的create方法, 如果显式没有为类声明public create，对象初始化时就使用默认的create方法，如果用户声明了public create 方法，对象初始化时就执行用户定义的方法。Create 不可以声明为私有(private)的和受保护(protected)的方法,否则对象初始化时不执行自己声明的方法.
Create 方法可以被重载(overload)几个不同的定义。
由于使用CreateObject方法创建对象，Craete 方法的返回值将被忽略。
示例：
示例是一个简单的日历类，说明了构造函数的重载,初始化时如果调用Create方法，设置为当前日期,否则可以指定具体的年月日
program test;
Type Calandar =Class
```tsl
  year;
  month;
  day;
  function Create() ;overload;
  Begin
    Create(YearOf(Date()),MonthOf(Date()),DayOf(Date()));
  End;
  function Create(y,m,d);overload;
  Begin
    year:=y;
    month:=m;
    day:=d;
  End;
End;
Begin
  C:=CreateObject("Calandar");
  //C:=CreateObject("Calandar",2008,8,8);也可以指定具体的年月日
  writeln(C.year,C.Month,C.Day);
End.
```
构造函数的覆盖：
构造函数可以在子类中被覆盖，如果显示声明了构造函数，为了是成员初始化，一般在新的构造函数中都要求实现基类的构造函数
调用Class(BaseClass).Create();

---

## 1505 - Self

Self    复制链接
在面向对象中，self有多种用途：
第一种：在指定方法时，可以通过self指向当前的实例对象。
第二种：self(N)方式，可以在类中创建当前类对象或创建实例所属对象。
第一种用途：
在实现方法时，标志符Self 引用方法所属的对象，如果是类方法，Self引用方法所属的类。
格式为：
Self.functionName();
编译器会自动匹配所调用的方法，Self方法一般可以省略。
有一点注意的是：
Self总是指向当前的实例对象。而不是Self所在的类的实例对象。与继承混合使用是需要注意。
示例：
Program test;
 type A= class
```tsl
  Function F(); virtual;
  Begin
   Self.F2();
  End;
  Function F2();virtual;
  Begin
   Writeln("A.F2");
  End;
 End;
```
 Type B = class(A)
```tsl
  Function F2();override;
  Begin
   Writeln("B.F2");
  End;
 end;
Begin
  AA:=CreateObject("A");
  AA.F();//输出 A.F2;
  BB:=CreateObject("B");
```
  BB.F();//输出 B.F2()
End.
说明：
```tsl
AA:=CreateObject("A");
AA.F();//输出 A.F2;
创建了类型A的实例对象，F()中的Self.F2(),表示调用的是类型A的F2();
BB:=CreateObject("B");
```
BB.F();//输出 B.F2()
以上代码创建了类型B的实例对象,F()中的Self.F2()表示调用类型B的F2()
Self的这种特性在某些情况下会出现理解上的歧义，如果想固定Self的意义，让他只表示当前的类。需要用Class(ClassName).FunctionName做替换。
以上代码中的Self.F2()需要换成 Class(A).F2();
那么以上代码输出
A.F2
A.F2
第二种用途：
在实现方法时，可以通过self(1)创建一个当前实例所属对象的实例对象。
self(0)等同于self()即创建一个当前方法所在类的实例对象。
如：
```tsl
Function Test_Ooself();
Begin
  obj:=CreateObject('TestSelf');
  obj.Test1();
End;
```
Type TestSelf=class(TDTestFClass)
```tsl
 Function Test1();
 begin
   returnV1();
   returnV0();
 end
end;
```
Type TDTestFClass=class()
Public
```tsl
 Function returnV1();
 Begin
   ss:=self(1); //创建当前实例所属类的实例对象
   echo "TDTestFClass-returnV1 ", ss.classinfo()['classname'];
 End;
 Function returnV0();
 Begin
   ss:=self(0); //创建当前类的对象
   echo "TDTestFClass-returnV0 ", ss.classinfo()['classname'];
 End;
End;
```
打印结果如下：
TDTestFClass-returnV1 testself
TDTestFClass-returnV0 tdtestfclass
注：示例中ss.classinfo()['classname'];是获取ss所属对象的类名

---

## 1506 - 类方法

类方法    复制链接
类方法是作用在类而不是对象上面的方法（不同于构造函数）。类方法的定义必须以关键字class 开始
类方法用于创建无需创建类的实例就能够访问的方法。类方法可用于分离独立于任何对象标识的行为：无论对象发生什么更改，这些函数都不会随之变化。
形式为：
Type ClassName =Class
```tsl
  Class Function FuncName();
  Begin
    //方法实现
  End;
End
```
在类方法的定义部分，Self 表示调用方法的类（它或许是定义方法的类的一个派生类）。由于类方法与实例对象无关，所以，你不能使用Self 访问字段、属性和实例的方法，但能调用构造函数和其它类方法。
类方法可以通过类引用来调用
Class(类名).类方法
示例：
上例中，可以
Class(ClassName).FuncName();
注：
一个类方法也可以被当作实例方法使用，使用方法和实例方法完全一样。方法的内部也可以调用实例的字段、属性和方法，如果方法调用了这样的数据或方法，就不能当作类方法使用了，否则的话会出错。
在Tsl中，字段和属性不支持这种静态的属性方法.
静态的字段可以通过全局变量实现。
更多可参考：静态方法声明和调用

---

## 1507 - 属性Property

属性Property    复制链接
属性是这样的成员：它们提供灵活的机制来读取、编写或计算私有字段的值。可以像使用公共数据成员一样使用属性，但实际上它们是称作“访问器”的特殊方法。这使得可以轻松访问数据，此外还有助于提高方法的安全性和灵活性。
语法：Property PropertyName[(ParamList)] [read fieldOrMethod][write fieldOrMethod][Index IndexValue]
其中，
1、关键字 Property 关键字表示开始声明了一个属性；
2、PropertyName是自定义合法的属性名，可以带参数，写法如PropertyName(a,b);
3、每个属性至少有一个读限定符或一个写限定符，或两者都有，它们称为访问限定符，具有以下的格式:
read fieldOrMethod
write fieldOrMethod
fieldOrMethod可以是成员变量，也可以是成员方法。
4、在TSL.INI支持，一旦设定该选项为1，则任何域的property都可被访问，无论是public还是protected,private。默认情况下这种违反规则是不被允许的。
 [Compatible]
 PrivatePropertyAccess=1
5、属性可以具有Private,Protected或public可见性，默认为public.
6、如果单有读限定符，表示属性只读；如果单有写限定符,表示属性只写。
7、如果它是在祖先类中声明的，则它对派生类必须是可见的，则fieldOrMethod不能是私有的字段或方法；
8、在读限定符中，若fieldOrMethod 是一个方法，它须是一个小于等于定义中参数数量的函数
9、在写限定符中，若fieldOrMethod 是一个方法，属性的设置值会以参数方式送入成员方法，即它须是一个与定义中参数数量多一个的方法。
10、属性可以在派生类中给重新定义.
示例：
program test;
Type myDate = Class
  private
```tsl
  _year;
  _month;
  _day;
  Function SetMonth(value);
  Begin
    if value>0 and value<13 then
      _month:=value;
  End;
```
  public
  //不带参数的定义
  property Month read _month write setMonth;//读时访问成员变量_month，写时调用成员方法setMonth
```tsl
  //带参数的定义
  property DateV(y,m) read getDateV write setDateV;
  Function getDateV();
  begin
    return _year*10000+_month*100+_day;
  end;
  Function setDateV(y,m,d); //比定义中多一个参数
  begin
    _year:=y;
    SetMonth(m);
    _day:=d;
  end;
End;
Begin
  D:=CreateObject("myDate");
  D.Month:=7; //写
```
  echo D.Month;//读
  D.DateV(2025,8):=10;//写
  echo D.DateV();//读
End.
打印结果：
7
20250810

---

## 1508 - 索引器(index)

索引器(index)    复制链接
简单说来，所谓索引器就是一类特殊的属性，通过它们你就可以像引用数组一样引用自己的对象。索引器通常用于对象容器中为其内的对象提供友好的存取界面.
显然，这一功能在创建集合类的场合特别有用，而在其他某些情况下，比如处理大型文件或者抽象某些有限资源等，能让类具有类似数组的行为当然也是非常有用的。
索引器的定义方式为：
Property PropertyName Index IndexValue read ReadMethod write WriteMethod
与属性不同的是，其中读写限定符必须是方法，不能是字段。而且
读限定符中的方法声明必须带有一个参数，这个参数指向索引器的索引。
写限定符的方法声明必须带有2个参数，第一个参数是索引器的索引，第二个是要设置的值。
与数组的区别，调用索引器的时候用圆括号，不能用方括号。
与Object pascal不同的地方：TSL的索引器的索引值除了支持整数以外，还可以支持字符串。
实例：
program test;
type A=class()
```tsl
  arr;
  function create()
  Begin
    arr:=array();
  End;
  function rIndex(i);
  Begin
    return arr[i];
  End;
  function wIndex(i,value);
  Begin
    arr[i]:=value;
  End;
  property idx read rindex write windex;
End;
begin
  AA:=createobject("A");
  AA.idx(0):="abc";
  writeln(AA.idx(0));
End.
```
上面的示例演示了索引器的使用方法。对类A的数据arr的操作，不必通过对象AA.arr来设置或读取，只要通过索引器即可。索引器为A中的数据提供友好的存取界面。
我们可以把索引器的一个索引固定为属性，就需要下面的定义方法：
Property PropertyName Index IndexValue read ReadMethod write WriteMethod
用index n指定索引的位置
上例中可声明
property idx0 index 0 read rindex  write windex;
表示idx0表示专门对索引器中的位置 0进行对写，也就是对arr[0]进行操作。
当然，假使有需要，索引也可以使字符串，那样，例如：
property idx0 index "High school" read rindex  write windex;

---

## 1509 - IS关键字

IS关键字    复制链接
关键字IS 用户判断一个对象是否是某个类的实例。返回值为Bool类型。一个子类属于所有它祖先类的类型。
2025/8月版本开始支持not is，即判断一个对象是否不是某个类的实例。
以前需要not (B is class(ClassB))模式现在可以直接写为B not is class(ClassB)
示例：
program test;
Type A=Class
End;
Type B =Class(A)
End;
Type C=Class(B)
```tsl
End
Begin
 CC:=CreateObject("C");
```
 Writeln(CC is Class(C)); // 输出 1
 Writeln(CC is Class(A)); // 输出 1
 Writeln(CC is Class(B));// 输出 1
 Writeln(CC not is Class(B));// 输出 0
End.

---

## 20414 - FilterNotIn

FilterNotIn    复制链接
简述
返回指定列的值不在过滤集内的子结果集或者下标列表。
定义
FilterNotIn(R;V;Field;[bReturnSubResult=true]):Array
参数
名称
类型
说明
R
Array,TableArray
需要过滤的结果集。
V
Array,TableArray
过滤集。
Field
String
过滤的结果集的字段，如果Field为nil则表示整行过滤。如果Field为一个数组，则表示需要过滤的字段组。
如果过滤的数组是二维数组，Field为nil时，则过滤的当前行类似于集合运算，与集合运算的差异为过滤运算并不消除重复行。
bReturnSubResult
Boolean
过滤后是否返回子集。默认为真，为真时返回整个结果集符合条件的子集，为假时返回结果集符合条件的下标列表。
返回
Array,TableArray
数组
范例
用法同FilterIn
```tsl
a:=array();
for i:=0 to 5 do
begin
 a[i]["a"]:=i;
 a[i]["b"]:=i div 2;
 a[i]["c"]:=i*2;
end;
b:=array(1,3,5);
c1:=FilterNotIn(a,b,"a"); //过滤结果
c2:=FilterNotIn(a,b,"a",false); //过滤仅返回下标
return array(c1,c2);
//c1结果：
//c2结果：
```
二维数组中，过滤行运算示例：
```tsl
 t:=array(
("a":0,"b":0,"c":0),
("a":1,"b":0,"c":2),
("a":2,"b":1,"c":4),
("a":2,"b":1,"c":4),
("a":4,"b":2,"c":8),
("a":4,"b":2,"c":8),
("a":6,"b":3,"c":12));
return filternotin(t,array(("a":2,"b":1,"c":4)),nil);
```
返回结果：过滤后保留重复行。
一维数组的过滤：
return FilterNotIn(array(1,-5,10,2,10,14,-5),array(2,3,10),nil);
返回结果：array(1,-5,14,-5)
相关
AppendArray
DeleteNILValueByField
FilterIn
FilterNotIn
IN1
DeleteColumnByField
Inserttablebyrno
GetValuesByFieldValue
Arrayextend
Arrayinsert
Frameinsert
searchsorted
argconfirst
SeekPosInArray
StockAmount

---

## 21143 - Fmin

Fmin    复制链接
简述
（非线性规划建议统一使用prog_n函数），用起作用集法求任意形式非线性优化问题，结果返回最优点、最优值。可求解如下问题：
定义
NonLP_Fmincon(Fun:String;X0:array;A:Array;B:Array;Aeq:Array;Beq:Array;Nonlcon:String):array
参数
名称
类型
说明
Fun
String
目标函数表达式，为字符串类型；
x0
array
初值向量，为一维数组类型；
A
Array
线性矩阵不等式约束，为二维数组类型；
B
Array
线性向量不等式约束值，为一维数组类型；
Aeq
Array
线性矩阵等式约束，为二维数组类型；
Beq
Array
线性向量等式约束值，为一维数组类型；
Nonlcon
String
非线性约束回调，为字符串类型；nonlcon回调需用户自己新建一个函数，然后把函数名传进nonlcon，函数格式如下:
```tsl
Function “函数名”(x);
Begin
```
C
=array();//*
```tsl
C[0]:=……
C[1]:=……
```
……
```tsl
Ceq:=array();//*
Ceq[0]:=……
Ceq[1]:=……
```
……
```tsl
Return array(0:c,1:ceq);//*
End;
//*号的式子一定要写
```
范例
Find values of x that minimize
f(x) = –x1x2x3, starting at the point x = [10;10;10],
subject to the constraints:
0 ≤ x1 + 2x2 + 2x3 ≤ 72.
TSL代码：
```tsl
fun:="Fmin_FunCall";//回调目标函数
x0:=array(10,10,10);//初值
A:=array((-1,-2,-2),(1,2,2));//线性不等式左边
B:=array(0,72);//线性不等式右边
Aeq:=array();//
Beq:=array();//
lb:=array();
ub:=array();
nonlcon:="";//回调非线性约束为空
return fmin(fun,x0,A,B,Aeq,Beq,lb,ub,nonlcon);
```
结果：
x1=24,x2=12,x3=12,最优值f(x)=-3456
回调函数：
```tsl
Function Fmin_FunCall(x);
Begin
 return -x[0]*x[2]*x[1];
End;
```
参考
Prog_N NonLP_minSUMT NonLP_minPS NonLP_minFactor NonLP_Fmincon
相关
Prog_L
Prog_Q
Prog_N
Prog_M
NonLP_Fminsearch
NonLP_Fminbnd
Fmin
NonLP_minSUMT
NonLP_minPS
NonLP_minFactor
NonLP_Fmincon
NonLP_Range
NonLP_BSearch
NonLP_Golden
NonLP_Fibonacci
NonLP_GP
NonLP_Nelder
NonLP_Hooke_Jeeves
NonLP_Rosenbrock
LinearProgramming
IntLinProg
OZProg
Quadprog
QuadTrackRoute
QuadLagR
TSOptimizer
无约束优化算法
有约束优化算法
测试

---

## 21144 - NonLP_minSUMT

NonLP_minSUMT    复制链接
简述
（非线性规划建议统一使用prog_n函数）混合惩罚函数+转轴法/模式搜索法：可解所有优化问题，返回最优点、最优值和迭代次数。可求解如下问题：
定义
NonLP_minSUMT(Fun:String;X0:array;A:Array;B:Array;Aeq:Array;Beq:Array; Nonlcon;Methods:String):array
参数
名称
类型
说明
Fun
String
目标函数表达式，为字符串类型；
x0
array
初值向量，为一维数组类型；
A
Array
线性矩阵不等式约束，为二维数组类型；
B
Array
线性向量不等式约束值，为一维数组类型；
Aeq
Array
线性矩阵等式约束，为二维数组类型；
Beq
Array
线性向量等式约束值，为一维数组类型；
Nonlcon
String
非线性约束回调，为字符串类型；
METHODS
String
方法选择,’NM’,’Rb’,’HJ’
范例
{线性不等式约束
  x[0]+x[1] <= 3;
  4*x[0]+x[1]<=9 ; }
```tsl
  A :=ARRAY((1,1),(4,1));
  B := array(3,9);
  //线性等式约束
  AEQ := ARRAY();
  BEQ := ARRAY();
  // 初始值
  x0:=array(1,1) ;
  //分别设置的变量,约束条件,目标函数的迭代精度；不设置采用默认值
  Return NonLP_minSUMT('obj',X0,A,B,Aeq,Beq,'constr',"NM");
//目标函数
Function obj(x);
Begin
  Return 2*x[0]^2-4*x[0]*x[1]+4*x[1]^2-6*x[0]-3*x[1];
End;
//非线性约束:
function constr(x);
begin
ne := array();
e := array() ;
ne[0]:= x[0]+x[1]^2-5;//x[0]+x[1]^2<5非线性不等式约束
e[0]:=x[1]^2+x[0]^2-4;//x[1]^2=4非线性等式约束
return array(ne,e);
end
```
结果：
参考
Prog_N Fmin NonLP_minPS NonLP_minFactor NonLP_Fmincon
相关
Prog_L
Prog_Q
Prog_N
Prog_M
NonLP_Fminsearch
NonLP_Fminbnd
Fmin
NonLP_minSUMT
NonLP_minPS
NonLP_minFactor
NonLP_Fmincon
NonLP_Range
NonLP_BSearch
NonLP_Golden
NonLP_Fibonacci
NonLP_GP
NonLP_Nelder
NonLP_Hooke_Jeeves
NonLP_Rosenbrock
LinearProgramming
IntLinProg
OZProg
Quadprog
QuadTrackRoute
QuadLagR
TSOptimizer
无约束优化算法
有约束优化算法
测试

---

## 21145 - NonLP_minPS

NonLP_minPS    复制链接
简述
（非线性规划建议统一使用prog_n函数）,坐标轮换法求不等式约束问题，初值必须在可行域内！可求解如下问题：
定义
NonLP_minPS(Fun:String;X0:array;A:Array;B:Array;Nonlcon:String):array
参数
名称
类型
说明
Fun
String
目标函数表达式，为字符串类型；
x0
array
初值向量，为一维数组类型；
A
Array
线性矩阵不等式约束，为二维数组类型；
B
Array
线性向量不等式约束值，为一维数组类型；
Nonlcon
String
非线性约束回调，为字符串类型；
范例
{线性不等式约束
  x[0]+x[1] <= 3;
  4*x[0]+x[1]<=9 ; }
```tsl
  A :=ARRAY((1,1),(4,1));
  B := array(3,9);
  // 初始值S
X0:=array(1,1) ;
  //分别设置的变量,约束条件,目标函数的迭代精度；不设置采用默认值
return NonLP_minPS('obj',x0,A,B,'constr');
//目标函数
Function obj(x);
Begin
  Return 2*x[0]^2-4*x[0]*x[1]+4*x[1]^2-6*x[0]-3*x[1];
End;
//非线性约束:
function constr(x);
begin
ne := array();
e := array() ;
ne[0]:= x[0]+x[1]^2-5;//x[0]+x[1]^2<5非线性不等式约束
return array(ne,e);
end
```
结果：
参考
Prog_N Fmin NonLP_minSUMT NonLP_minFactor NonLP_Fmincon
相关
Prog_L
Prog_Q
Prog_N
Prog_M
NonLP_Fminsearch
NonLP_Fminbnd
Fmin
NonLP_minSUMT
NonLP_minPS
NonLP_minFactor
NonLP_Fmincon
NonLP_Range
NonLP_BSearch
NonLP_Golden
NonLP_Fibonacci
NonLP_GP
NonLP_Nelder
NonLP_Hooke_Jeeves
NonLP_Rosenbrock
LinearProgramming
IntLinProg
OZProg
Quadprog
QuadTrackRoute
QuadLagR
TSOptimizer
无约束优化算法
有约束优化算法
测试

---

## 21146 - NonLP_minFactor

NonLP_minFactor    复制链接
简述
（非线性规划建议统一使用prog_n函数）,乘子法求等式约束问题，可求解如下问题：
定义
NonLP_minFactor (Fun:String;X0:array;Aeq:Array;Beq:Array;Nonlcon:String):array
参数
名称
类型
说明
Fun
String
目标函数表达式，为字符串类型；
x0
array
初值向量，为一维数组类型；
Aeq
Array
线性矩阵等式约束，为二维数组类型；
Beq
Array
线性向量等式约束值，为一维数组类型；
Nonlcon
String
非线性约束回调，为字符串类型；
范例
参考有约束非线性优化总函数NonLP_Fmincon的范例和参考
```tsl
//线性等式约束
AEQ := ARRAY();
BEQ := ARRAY();
// 初始值
x0:=array(1,1) ;
//分别设置的变量,约束条件,目标函数的迭代精度；不设置采用默认值
Return NonLP_minFactor( 'obj',X0,AEQ,BEQ,'constr');
//目标函数
Function obj(x);
Begin
  Return 2*x[0]^2-4*x[0]*x[1]+4*x[1]^2-6*x[0]-3*x[1];
End;
//非线性约束:
function constr(x);
begin
ne := array();
e := array() ;
//ne[0]:= x[0]+x[1]^2-5;//x[0]+x[1]^2<5非线性不等式约束
e[0]:=x[1]^2+x[0]^2-4;//x[1]^2=4非线性等式约束
return array(ne,e);
end
```
结果：
参考
Prog_N Fmin NonLP_minSUMT NonLP_minPS NonLP_Fmincon
相关
Prog_L
Prog_Q
Prog_N
Prog_M
NonLP_Fminsearch
NonLP_Fminbnd
Fmin
NonLP_minSUMT
NonLP_minPS
NonLP_minFactor
NonLP_Fmincon
NonLP_Range
NonLP_BSearch
NonLP_Golden
NonLP_Fibonacci
NonLP_GP
NonLP_Nelder
NonLP_Hooke_Jeeves
NonLP_Rosenbrock
LinearProgramming
IntLinProg
OZProg
Quadprog
QuadTrackRoute
QuadLagR
TSOptimizer
无约束优化算法
有约束优化算法
测试

---

## 21147 - NonLP_Fmincon

NonLP_Fmincon    复制链接
简述
（非线性规划建议统一使用prog_n函数）默认选项只适合于单纯的等式约束问题或者单纯的不等式约束问题，罚函数+转轴法/模式搜索法适合于任何问题，结果返回最优点、最优值和迭代次数。
可求解如下问题：
定义
NonLP_Fmincon(Fun:String;X0:array;A:Array;B:Array;Aeq:Array;Beq:Array; Nonlcon:String;Methods):array
参数
名称
类型
说明
Fun
String
目标函数表达式，为字符串类型；
x0
array
初值向量，为一维数组类型；
A
Array
线性矩阵不等式约束，为二维数组类型；
B
Array
线性向量不等式约束值，为一维数组类型；
Aeq
Array
线性矩阵等式约束，为二维数组类型；
Beq
Array
线性向量等式约束值，为一维数组类型；
Nonlcon
String
非线性约束回调，为字符串类型；nonlcon回调需用户自己新建一个函数，然后把函数名传进nonlcon，函数格式如下:
```tsl
Function “函数名”(x);
Begin
```
C
=array();//*
```tsl
C[0]:=……
C[1]:=……
```
……
```tsl
Ceq:=array();//*
Ceq[0]:=……
Ceq[1]:=……
```
……
```tsl
Return array(0:c,1:ceq);//*
End;
//*号的式子一定要写
```
Methods
优化方法（0:默认，1:罚函数+转轴法，2:罚函数+模式搜索法），为用户自定义类型（整型）；
范例
{线性不等式约束
  x[0]+x[1] <= 3;
  4*x[0]+x[1]<=9 ; }
```tsl
  A :=ARRAY((1,1),(4,1));
  B := array(3,9);
  //线性等式约束
  AEQ := ARRAY();
  BEQ := ARRAY();
  // 初始值
x0:=array(1,1) ;
  //分别设置的变量,约束条件,目标函数的迭代精度；不设置采用默认值
 Return NonLP_Fmincon ('obj',x0,a,b,aeq,beq,'constr',1);
//目标函数
Function obj(x);
Begin
  Return 2*x[0]^2-4*x[0]*x[1]+4*x[1]^2-6*x[0]-3*x[1];
End;
//非线性约束:
function constr(x);
begin
ne := array();
e := array() ;
ne[0]:= x[0]+x[1]^2-5;//x[0]+x[1]^2<5非线性不等式约束
e[0]:=x[1]^2+x[0]^2-4;//x[1]^2=4非线性等式约束
return array(ne,e);
end
```
结果：
参考
Prog_N Fmin NonLP_minSUMT NonLP_minPS NonLP_minFactor
相关
Prog_L
Prog_Q
Prog_N
Prog_M
NonLP_Fminsearch
NonLP_Fminbnd
Fmin
NonLP_minSUMT
NonLP_minPS
NonLP_minFactor
NonLP_Fmincon
NonLP_Range
NonLP_BSearch
NonLP_Golden
NonLP_Fibonacci
NonLP_GP
NonLP_Nelder
NonLP_Hooke_Jeeves
NonLP_Rosenbrock
LinearProgramming
IntLinProg
OZProg
Quadprog
QuadTrackRoute
QuadLagR
TSOptimizer
无约束优化算法
有约束优化算法
测试

---

## 21336 - 数据库访问函数

数据库访问函数    复制链接
函数名
别名
备注
ExecSQL
SQL执行
SQLBeginTrans
开始一个数据库事务
SQLInTrans
检查是否在一个数据库事务中
SQLCommit
提交事务
SQLRollBack
回滚事务
SQLErrorMsg
SQL语法数据库错误信息
SQLCloseConn
主动关闭指定别名的数据库链接或者关闭所有数据库链接
内容
ExecSQL
SQLBeginTrans
SQLInTrans
SQLCommit
SQLRollBack
SQLErrorMsg
SQLCloseConn
数据库配置
Openforwardonly模式

---

## 21342 - SQLErrorMsg

SQLErrorMsg    复制链接
简述
返回最近出错的SQL语法执行的数据库出错信息。
定义
SQLErrorMsg():String;
相关
ExecSQL
SQLBeginTrans
SQLInTrans
SQLCommit
SQLRollBack
SQLErrorMsg
SQLCloseConn
数据库配置
Openforwardonly模式

---

## 21393 - SysSendMail

SysSendMail    复制链接
说明：利用SMTP服务器发送邮件，成功返回真，否则返回假。如果有MSG这个参数，则当失败的时候返回失败的具体信息到MSG参数。
定义一：SysSendMail(AHost,ASubject,ATo,AFrom,AText:String;[Var Msg:String]):Boolean;
参数：
  AHost：字符串类型，SMTP服务器地址或者别名。如果端口特殊或者需要认证，可在配置文件中设置。
  ASubject：字符串类型，邮件标题。
  ATo：字符串类型，收件人。
  AFrom：字符串类型，发件人。
  AText：字符串类型，邮件内容。
  MSG：用于接收错误信息的参数，可省略。
定义二：SysSendMail(AHost,ASubject,ATo,AFrom,AText,ACharSet,ABccList,ACCList:String; APriority:Integer;[<AttachmentName1:String;AttachmentContent1:String>[…<AttachmentNameN:String;AttachmentContentN:String>]][Var Msg:String]):Boolean;
参数：
  AHost：字符串类型，SMTP服务器地址或者别名。如果端口特殊或者需要认证，可在配置文件中设置。
  ASubject：字符串类型，邮件标题。
  ATo：字符串类型，收件人。
  AFrom：字符串类型，发件人。
  AText：字符串类型，邮件内容。
  ACharSet：字符串类型，邮件编码类型。
  ABccList：字符串类型，密件抄送地址。
  ACCList：字符串类型，抄送地址。
  APriority：整数类型，邮件优先级。
  附件可选参数,AttachmentName和AttachmentContent任意对参数组合。
  AttachmentName..：添加的附件在邮件里的文件名称。
  AttachmentContent..：添加的附件的内容，如果该内容为字符串类型且存在该文件，则将文件内容作为附件内容。
  MSG：用于接收错误信息的参数，可省略。
返回：如果发送成功，则返回1，否则返回0；
范例：
```tsl
//范例一：
ret:=rdo2 sysSendmail("www.tinysoft.com.cn",
```
'客户端发邮件测试',
'xulihua@tinysoft.com.cn',
'support@tinysoft.com.cn',
'Tinysoft hello',
```tsl
msg);
return ret;
//结果：1
//范例二：
 ret:=rdo2 sysSendMail("www.tinysoft.com.cn",
```
         '客户端发邮件测试',
         'xulihua@tinysoft.com.cn',
         'support@tinysoft.com.cn',
         '邮件测试：Tinysoft',
         'gb2312',
         'wuxinxing@tinysoft.com.cn',
         'chenjuan@tinysoft.com.cn',
         1,
         '附件测试',
         'D:\\test1\\test.tsl',
```tsl
         msg);
 return ret;
 //返回：1，发送的附件为 "附件测试.dat"
//范例三：通过QQ邮箱发送邮件。注意，通过QQ邮箱发送邮件，需要使用QQ账户和账户授权码。授权码的获取参照步骤说明进行配置并获取：
```
http://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256
```tsl
//通过调用类smtp设置配置信息及发送邮件
Function SendEmailTest_QQ();
Begin
return rdo2 SendEamailTest();
End;
function SendEamailTest();
begin
  obj:= CreateObject("smtp") ;
  obj.UserName := '510543292' ;    //邮箱账号（用户QQ账号）
  obj.Password := 'abcdefg' ;       //安全验证码（用户QQ的授权码）
  obj.UseTLS:=1;           //安全传输协议
  obj.Host := 'smtp.qq.com' ;    //smtp服务器
  //obj.AuthType := 1 ;
  obj.port:=465;           //smtp服务器端口 465或587
```
  try
```tsl
   Ret := obj.Connect();
   echo ret;
```
  Except
```tsl
   return echo "\r\nconnect fail\r\n" ;
  end;
  msg := CreateObject("MailMsg");
  msg.subject := "邮件发送测试";    //文件标题
  msg.from := "510543292@qq.com";
  msg.ContentType:='text/html; charset="gb2312"';
  msg.body := "定时任务调度";      //文件内容
  msg.Sender := "510543292@qq.com";  //邮件发送人
  msg.Recipients :="510543292@qq.com";//邮件接收人
```
  try
```tsl
   echo obj.send(msg);
   echo msg;
```
  except
```tsl
   echo '\r\n邮件错误信息',obj.LastCmdResult();
   return echo '\r\n邮件发送失败:',ExceptObject.errinfo;
  end;
  return echo 'over';
end
//范例四：通过QQ邮箱发送邮件。注意，通过QQ邮箱发送邮件，需要使用QQ账户和账户授权码。授权码的获取参照步骤说明进行配置并获取：
```
http://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256
//发送邮件的用户名及授权码的配置写在\tinysoft\analyse.net\plugin\fileMgr.ini 文件里
{ fileMgr.ini 文件中配置语句如(端口465或587)：
[Smtp Settings]
smtp.QQ.COM:UseTLS=1
smtp.QQ.COM:Port=465
smtp.QQ.COM:UserName=510543292
smtp.QQ.COM:Password=abc
smtp.QQ.COM=smtp.QQ.COM
}
ret:=sysSendmail("smtp.qq.com",
         '客户端发邮件测试',
         '510543292@qq.com',
         '510543292@qq.com',
         'Tinysoft hello',
```tsl
         msg);
return msg;
```
内容
SMTP登录以及配置文件

---

## 23270 - FundNAWByRateBegtEndt

FundNAWByRateBegtEndt    复制链接
简述
区间复权单位净值，与系统参数基金代码、复权方式、复权基准日相关。
定义
 FundNAWByRateBegtEndt(begt:date;endt:date):array
参数
名称
类型
说明
begt
date
date,开始日期
endt
date
date,截止日期
返回
array
数组，复权后的基金净值数据
范例
范例1：
```tsl
//返回OF000001在2021-05-01至2021-05-14的复权基准日为上市日的比例复权净值数据
  setsysparam(pn_stock(),"OF000001");
  SetSysParam(PN_Rate(),1) ;
  SetSysParam(PN_RateDay(),-1);
  return FundNAWByRateBegtEndt(20210501T,20210514T);
```
返回结果：(图中结果保留了四位小数）
范例2：
```tsl
//返回多个票在一段区间内的复权净值数据
funds:= array('OF00006','OF000017','OF000020');
r:=array();
SetSysParam(PN_Rate(),1) ;
SetSysParam(PN_RateDay(),-1);
for i:=0 to length(funds)-1 do
 r&=select funds[i] as "Fundid",* from spec(FundNAWByRateBegtEndt(20240601T,20240621T),funds[i]) end;
return r;
```
相关
FundMaxMinNAW
FundMaxMinNAW2
FundNAW
FundNAWDW
FundNAWLInfo
FundNAWLInfo2
FundNAWLJ
FundNAWZf
FundNAWLInfoFromBegT
FundNAWZf4
FundNAWZf3
FundNAWZf_fh
FundIPOV
FundIPOC
FundNAWLAccumulativeNetAsset
FundNAWMWFJJDWSY
FundNAWLNetAsset
FundNAWZJQRSYZSDNSYL
FundNAWByRateBegtEndt
FundNAWByRateEndT
FundZjRatio4
Fund7DaysAnnualRate
中间函数
FundAdjustNAW
FundNetAssetperUnitInReportDate

---

## 27627 - AD

AD    复制链接
简述
Accumulation/Distribution；对每一交易日求：
　偏移值＝（收盘价－最低价）－（最高价－收盘价）
　振幅＝最高价－最低价
　用偏移值除以振幅，再乘以成交量，得一值。
将该值从上市第一天起开始累加，得AD值。
定义
AD(N:Integer):Graph
参数
名称
类型
说明
N
Integer
整数
返回
Graph
图形
范例
```tsl
SetSysParam(pn_stock(),'SH000001');
SetSysParam(pn_date(),inttodate(20140123));
Return AD(10);
//结果：
```
相关
MaSS
ARBR
CR
VOSC
AD
CYR
PCNT
VR
PSY
WAD
VRSI
VROC
CDP
FAQ/知识库链接
Tradedays，N日和区间时间序列转换的桥梁
IsTradeDay
TRADETABLE
Q：在MatLab直接调用MarketTradeDayQK(begt,endt) ,为什么执行不出结果？调用的语句如下：
SaveTable,LoadTable来保存或者获取用户自己的数据存贮
Q：Savetable之后，在用户数据下面看不到，但是可以用loadtable取出来
Q：几点钟开始可以判断istradeday？是9:30以后吗？
Q：安装天软.net，提示错："You must be logged in as administrator when installing this program",本机都未授权 Administrator权限，如何解决？
Q：savetable之后，在用户数据下面看不到，loadtable也取不出来
Q：“TABLE SIZE:360701491>104857600(max download size),loadtable to return it”是什么报错？
Q：为什么用tradetable取股票行情数据，每一行的open、close、high、low都是相同的？
Q：安装天软客户端报错：无法定位程序输入点TSLP_SetThreadExtInfo于动态链接库protocol.dll上及无法定位程序输入点TSL_SwapHash于动态链接库tslkrnl.dll上
Q：Windows、python环境中import pyTSL时出错ImportError: DLL load failed: 找不到指定的模块。
交易明细表tradetable、分时表markettable
Q：函数istradeday判断是否交易日的规则
Q：数量类回测框架中，CalcashByTradeData(tjy)通过交易明细计算出剩余资金，其中参数交易明细tjy是如何给，是否会对清算造成影响？
Q：ADO方式下用DML方式插入数据报参数冲突的错误
Q：Python：ImportError: DLL load failed while importing TSLPy3: %1 不是有效的 Win32 应用程序
Q：python中通过pandas的read_sql方法以ODBC方式连接天软服务器时出现异常警告
Q：天软取表格数据中(Infotable|Marketable|Tradetable)字段StockName的说明
Q：Markettable与tradetable中取出来的StockName字段说明
Q：安装新一代客户端版本启动报错：Error loading libcef.dll

---

## 29423 - ExcelClose

ExcelClose    复制链接
简述
 关闭Excel文件。注意：将打开的文件关闭后，就可以进行手动打开修改数据，相当于程序解锁。
定义
 ExcelClose(FileName:String):Boolean;
参数
名称
类型
说明
FileName
String
字符串类型。Excel文件名称
返回
Boolean
 文件关闭成功则返回真，假如文件不存在或者关闭失败则返回假
范例
```tsl
//关闭本地文件：C:\VBA.xls
ret:=rdo2 excelopen("C:\\VBA.xls");
if ret then
ret1:=rdo2 excelclose("C:\\VBA.xls");
return ret1;
//结果：1
```
相关
ExcelGetApplication
ExcelGetDataRange
ExcelGetCell
ExcelSetCell
ExcelGetCells
ExcelSetCells
ExcelGetSheetCount
ExcelGetChartSheetCount
ExcelGetSheetNameByIndex
ExcelGetChartSheetNameByIndex
ExcelSaveAs
ExcelSaveAs2
ExcelSave
ExcelOpen
ExcelClose
ExcelQuit
ExcelDeleteSheet
ExcelDeleteChartSheet
ExcelNewSheet
ExcelNewChartSheet
ExcelRenameChartSheet
ExcelRenameSheet
ExcelRangeSetProp
ExcelSetRangeProp
ExcelGetRangeProp
ExcelMerge
ExcelUnMerge
ExcelCopySheet
ExcelCopyChartSheet
ExcelSetActiveSheet
ExcelSetActiveChart
ExcelSetChartSheetDataSource

---

## 29424 - ExcelQuit

ExcelQuit    复制链接
简述
 退出Excel文件进程。注意：会同时关闭所有被打开的excel文件。
定义
 ExcelQuit():Boolean;
参数
名称
类型
说明
返回
Boolean
 退出成功则返回真，否则返回假
范例
```tsl
//关闭本地文件：C:\VBA1.xls，C:\VBA2.xls
ret:=rdo2 excelopen("C:\\VBA1.xls");
ret1:=rdo2 excelopen("C:\\VBA2.xls");
if ret and ret1 then
   ret2:=rdo2 excelquit();
return ret2;
//结果：1
```
相关
ExcelGetApplication
ExcelGetDataRange
ExcelGetCell
ExcelSetCell
ExcelGetCells
ExcelSetCells
ExcelGetSheetCount
ExcelGetChartSheetCount
ExcelGetSheetNameByIndex
ExcelGetChartSheetNameByIndex
ExcelSaveAs
ExcelSaveAs2
ExcelSave
ExcelOpen
ExcelClose
ExcelQuit
ExcelDeleteSheet
ExcelDeleteChartSheet
ExcelNewSheet
ExcelNewChartSheet
ExcelRenameChartSheet
ExcelRenameSheet
ExcelRangeSetProp
ExcelSetRangeProp
ExcelGetRangeProp
ExcelMerge
ExcelUnMerge
ExcelCopySheet
ExcelCopyChartSheet
ExcelSetActiveSheet
ExcelSetActiveChart
ExcelSetChartSheetDataSource

---

## 29854 - 类类型声明的位置

类类型声明的位置    复制链接
  与其他类型不同，类类型必须在实例化之前声明并给定一个名称。有三种地方可以声明类类型：
  1、在程序（program）的最外层声明类，在执行语句块的前面，而不能在过程或函数中声明.
  示例：
```tsl
  program test;
  //声明了一个名称为myClass的类类型
```
  Type myClass = Class
```tsl
    //这里可以定义类的成员：字段、方法、属性
  End;
  Begin
    //这里可以初始化并使用上面声明的类类型
    C:=CreateObject("myClass");
  End.
```
  2、在主函数的后便声明，示例：
```tsl
  Function abcd();
  Begin
    A:=CreateObject("myClass");
  End;
```
  Type myClass = Class
  End;
  3、在非Program开头的TSL语句段后。
  如：
  …………..
  A:=CreateObject("myClass");
  …………
  Type myClass = Class
  End;
  4、也可以在 "TSL解释器安装目录\funcext\" 下面或者在其下的子目录下建立一个同名的.tsf文件，在文件内部声明一个类类型，文件名和类名必须相同。
如:把myClass的类类型放在 myClass.tsf文件中。这样可以被全局引用。

---

## 29855 - 类类型声明的语法

类类型声明的语法    复制链接
type className = class([BaseClass1[,BaseClass2,…]])
private //作用域关键字，private表示下面声明的是私有化成员
 //memberList
Public //作用域关键字，public表示公开成员，不写此类关键字时默认为public
```tsl
 //memberList
 function Create();overload;//初始化--构造函数--可省
 function Destroy();//析构函数--可省
 function func1();//成员方法
end;
```
说明：
Type是一个关键字，说明要声明一个类型，Class也是一个关键字，表示要声明一个类类型。
className 是要声明的你自己定义的类类型的名字，可以是任何有效标志符.
BaseClass1,BaseClass2,… 可选，表示要继承的父类型，可以是0个、1个或多个,如果是多个其中用逗号分割.如果此参数为空，可以省略class后面的小括号
memberList 声明类的各成员，也就是它的字段、方法和属性。可选.
注：
一个Type …End;只能声明一个类类型；
即使memberList为空也不能省略end;
完整示例：
Type Person = Class
```tsl
  //字段
  name;
  //方法
  function SetName(newName);
  Begin
    name:=newName;
  end;
  // 方法
  Function DisplayName();
  begin
   writeln(name);
  end;
  //属性
  Property theName read name write name;
End;
```
以上代码包括了一个完整类类型的声明：
声明了一个Person的类类型，也为Person类型声明了下面的成员：
字段：Name
方法：SetName 和 DisplayName
属性：theName

---

## 29860 - 内联与外联

内联与外联    复制链接
如果函数的实现在类体内，叫内联方法。
如果函数的实现在类体外，叫外联方法。
示例：
Type TSamClass=Class
 Public
```tsl
 Function MethodInside(); //内联方法--声名+实现
 begin
  return "Inside";
 end;
 function MethodOutSide();//仅声名
End;
Function TSamClass.MethodOutSide(); //外联方法--具体实现
Begin
 return "outside";
End;
```
外联声明时，方法名总是使用类名进行限定,形式为：类名.方法名。在方法的头部必须重新列出类声明时的参数，参数名称可以与声明时的不同，但是参数的顺序必须完全相同，

---

## 29864 - Operator

Operator    复制链接
简述
  Op就是TSL所支持的算符，由于赋值语句的特殊性，目前不支持对:=的重载。
默认的算符重载是对象在左，操作数在右，若需要支持对象为右值，则需要两个参数，第二参数为是否对象为左值。
需要注意的是，在外联模式下，由于.<本身就是一个算符，对于这类的op应在.和op之间用空格分开，否则会导致错误。
该函数返回的值就是算符的返回值。
定义
Operator op(opData[;isLeft])
外联模式的定义为:Function Operator ClassName. Op(opData[;isLeft])
参数
名称
类型
说明
opData
real
操作数
isLeft
Boolean
可选参数，对象在左为真，在右为假，无该参数时只支持对象在左
相关
Operator
算符重载的案例
面向对象的Operator重载支持[]
面向对象的Operator算符重载支持++,--,+=,-=

---

## 29978 - where进行条件查询

where进行条件查询    复制链接
  假如我们有一个二维数组EnglishScore，结构如下：
  学号姓名英语成绩
  01 张三 80
  02 李四 60
  03 王五 90
  04 赵六 50
  05 钱七 88
  我们现在有一个需求，我们需要查找出成绩大于85分的人的情况，并存贮在数组B中。通过我们已经掌握的知识，我们知道，通过一个循环语句可以解决这个问题。
  假定EnglishScore是一个二维数组并已经存贮了英语成绩表。
```tsl
  B:=array();
  Index:=0;
  For i:=0 to length(EnglishScore)-1 do
  Begin
    If EnglishScore [i]["英语成绩"]>85 then
    Begin
      B[Index]:= EnglishScore [i]; //将A的i行的内容赋给B的Index行
      Index++;
    End;
  End;
```
  这样我们得到了一个B，存贮的是英语成绩大于85的英语成绩信息。
  我们来看另外一种写法：
  B:=Select * from EnglishScore where ["英语成绩"]>85 end;
  这样看起来是不是很简洁呢？我们是否发现这种写法更容易理解呢？事实上，SQL语法比较接近自然语言，我们可以把以上语法理解为:查询所有的从 EnglishScore 中的英语成绩> 85的记录。
  Select from结果集之后，允许跟 where以及一个查询条件，这个约定俗成称之为Where子句。
  注：TS-SQL访问数据项是用[数组下标]的模式，而在真实的SQL中，假如有【英语成绩】这个字段，是不需要在【英语成绩】前后加引号的。例如在SQL中abcd或者[abcd]表示字段abcd，而不需要用["abcd"]，但是在TSL中却例外，因为在TSL语言中，abcd表示变量，你可以采用给abcd赋值为"英语成绩"，使用["abcd"]来表示["英语成绩"]。此外，SQL语法的SELECT是不需要END为结束符的，SQL语法的结束符和TSL类似，大多为分号“;”但如果遵循该规则，B:=Select * from EnglishScore where ["英语成绩"]>85 end;写成B:=Select * from EnglishScore where ["英语成绩"]>85;;就很难看了，第一个;表示select的结束，第二个;表示:=语句的结束。

---

## 29979 - Order By对返回的结果集进行排序

Order By对返回的结果集进行排序    复制链接
  假如我们除了需要查询出数据，并且还要对查询的结果的英语成绩从小到大进行排序，我们没办法再用简单的几行程序直接写出来了。因为排序牵涉到排序的算法，我们可能会封装一个排序的算法，假定叫SortFunction，我们用最简单的冒泡排序为例：
```tsl
Function SortFunction(Arr,SortField);
Begin
For i:=0 to length(Arr)-1 do
For j:=I to length(Arr)-1 do
Begin
If Arr[i][SortField]>Arr[j][SortField] then
Begin
   swap:=Arr[i];
   Arr[i]:=Arr[j];
   Arr[j]:=swap;
End;
End;
End;
```
  那么在对结果B我们可以使用SortFunction(B,"英语成绩");从我们实现查询到排序，总共使用了10好几条语句。
  我们再看下SQL的写法：
  B:=Select * from EnglishScore where ["英语成绩"]>85 order by ["英语成绩"] end;
  也就是说，SQL允许在where子句之后（或者省略where子句返回所有），可以带order by 排序的表达式。order by默认是从小到大排序的，事实上，order by允许对多个字段同时进行排序，并且支持从大到小排序。我们如果要对ScoreList的语文成绩正序排序，然后对英语成绩和语文成绩的比值进行逆序排列，我们可以如下写：
  B:=select * from ScoreList Order by ["语文成绩"] asc,["英语成绩"]/["语文成绩"] desc end;
  也就是说order by 后的排序表达式之后允许跟asc或者desc来描述排序的方向，缺省为正序(asc可以省略)，而desc则代表逆序，并且order by之后支持多个排序，多个排序表达式和排序方向之间使用逗号进行分割。

---

## 29983 - Group by 进行分组与Having进行分组后的结果筛选

Group by 进行分组与Having进行分组后的结果筛选    复制链接
  如果我们现在的需求进行了一个变化，我们需要得到的是不及格的人数和平均分，中等60-70分的人数和平均分，良好70-85的人数和平均分，85以上优秀的平均分。
  这样的需要我们可以采用多条SELECT语句来分别实现各个成绩段的统计。但是SQL同样提供了直接的方法。我们看以下的写法：
```tsl
  Return SELECT AvgOf(["英语成绩"]),CountOf( * ),groupfunc(["英语成绩"]) from EnglishScore group by groupfunc(["英语成绩"]) end;
Function groupfunc(score);
Begin
  If score<60 then return "不及格"
  Else
  If Score <70 then return "中等"
  Else
  If Score < 85 then return "良好"
  Else
  Return "优秀";
End;
```
  上述代码我们可以如此理解：groupfunc只是一个自己定义的函数，用途仅仅只是为了上面的分组需要，因为英语成绩表中并没有什么是优秀什么是及格的标准。
  GroupFunc把成绩分成了四档，而group by则把这四档进行分组，Avgof和countof对分组的内容进行聚集计算。如何理解呢？Avgof在没有group by的时候是对整个结果集进行处理，而有group by的时候是对分组后的每个子结果集进行运算处理。
  上述代码的返回结果为：
  如果我们需要的内容是返回个数>1的。那么我们的语句为：
  Return SELECT AvgOf(["英语成绩"]),CountOf( * ),groupfunc(["英语成绩"]) from EnglishScore group by groupfunc(["英语成绩"]) Having CountOf( * ) >1 end;
  运行结果如下：
  Having和Where是不是很类似呢？许多初学SQL的人会很容易混淆两者的差异，事实上Having可以用聚集函数作为条件，而Where是不行的，Having是先group分组再计算having条件，而where则是最先开始进行条件筛选。在group by之前是允许有where条件的。

---

## 30008 - RefsOf访问上级结果集

RefsOf访问上级结果集    复制链接
  RefsOf的定义为：RefsOf(Exp,UpLevel)
 其中Exp是一个任意的计算表达式，UpLevel是上几级，1表示上一级，2表示上两级,依此类推。
 RefsOf的含义是，使用指定的上级结果集计算EXP表达式。可能这样说会很抽象，举几个例子：
例如：RefsOf(["学号"],1)表示上级结果集的学号字段，假定存在一个函数SQLTest，其定义为
```tsl
  Function SQLTest();
  begin
   return ["学号"];
  end;
```
  RefsOf(SQLTest(),1)同样访问的是上级结果集的学号字段。
在这里，这样重复地说明只是为了告诉读者，在RefsOf中的第一个参数中的计算，无论是直接访问结果集（如访问字段,ThisRow等等），还是间接地访问（例如通过函数），访问的结果集均是指定的上层结果集的内容，够拗口吧。
之前的例子我们可以修改成如下代码：
  R:=select *,Select ["课程时间"],["缺课"] from D where ["学号"]=RefsOf(["学号"],1) and ["缺课"]="Yes" end as "出勤记录" from B end;
实例展示：在表t2中增加t1表中对应行业个股涨幅大于行业涨幅的情况
```tsl
 t1:= array(
("证券":"SH600028","行业":"采矿业","涨幅(%)":-1.01),
("证券":"SH600030","行业":"金融业","涨幅(%)":0.07),
("证券":"SH601166","行业":"金融业","涨幅(%)":-1.6),
("证券":"SH601211","行业":"金融业","涨幅(%)":0.29),
("证券":"SH601225","行业":"采矿业","涨幅(%)":-0.49),
("证券":"SH601658","行业":"金融业","涨幅(%)":-1.62),
("证券":"SH601668","行业":"建筑业","涨幅(%)":1.16));
t2:=array(("行业":"采矿业","行业涨幅(%)":-1.1),
("行业":"金融业","行业涨幅(%)":-0.12),
("行业":"建筑业","行业涨幅(%)":2.1));
return select *,
```
  select * from t1 where ["行业"]=refsof(["行业"],1)
       and ["涨幅(%)"]>=refsof(["行业涨幅(%)"],1) end as "行业成份"
  from t2 end;
返回结果：

---

## 30100 - AGGOF

AGGOF    复制链接
简述
返回给定表达式（自定义聚集函数）中所有值的填充利用回调函数计算聚集的值。
定义
AGGOf( name_str:TExpression; Expression:TExpression[;BoolConditionExp:TExpression[;N:Integer[;MovingFirst:Bool[;CacheId:String]]]]):any
参数
名称
类型
说明
name_str
TExpression
字符串表达式，扩展聚集函数的名称。
Expression
TExpression
任意类型表达式。参见多字段聚集。可在表达式前加关键字DISTINCT，表示不管该值出现了多少次，只使用每个值的唯一实例。不添加即统计所有。
BoolConditionExp
TExpression
布尔型表达式，如果存在该参数，则统计内容为该表达式为真的行，否则统计所有。
N
integer
整数，如果没有N参数，则统计对象为全部，否则统计对象为满足条件的从当前行起往前总共的N条记录, 如果为负数，则为从当前起往后总共|N|行。
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。默认为假，此省略模式可以通过SelectOpt(64)进行变换，具体参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
由扩展聚集函数的返回决定
范例
```tsl
Table1 := Array(
('A':6,'B':20,'C':1),
('A':5,'B':20,'C':2),
('A':9,'B':2,'C':3),
('A':2,'B':20,'C':4),
('A':7,'B':18,'C':5));
Return vSelect aggof('AggSumSample',['C']) from Table1 end; //返回结果15
//自定义的AggSumSample聚集函数。
Function AggSumSample(Flag,Value);
begin
  if FLag=0 then
  begin
   SysParams['SumSample']:=0;
   return true;
  end
  else if Flag=1 then
  begin
   SysParams['SumSample']:=SysParams['SumSample']+Value;
   return true;
  end
  else
   return SysParams['SumSample'];
end;
```
内容
聚集扩展函数的定义规范
相关
多字段聚集
COUNTOF
REFOF
COUNTIFOF
AVGOF
EMAOF
SMAOF
HARMEANOF
GEOMEANOF
SUMOF
MINOF
MAXOF
RefMinOf
RefMaxOf
MODEOF
MEDIANOF
STDEVOF
STDEVPOF
VarOf
VarpOf
TotalVarOf
AvedevOF
DEVSQOF
NORMOF
SKEWOF
SKEW2OF
KURTOSISOF
KURTOSIS2OF
Largeof
Smallof
Percentileof
PercentRankOf
QuartileOf
RankOf
TrimMeanOf
FrequencyOf
ProductOf
AGGVALUE
CHECKSUM_AGGOF
AGGOF
双序列统计聚集函数
SQL时间序列统计缓存标志与性能加速

---

## 30101 - 聚集扩展函数的定义规范

聚集扩展函数的定义规范    复制链接
语法：Function AggFunctionName(Flag:Integer;Value:[Boolean|Any]):[Boolean|Any];
说明
flag的值表示调用该函数时的状态。
0：聚集的初始化
  value 为真则是DISTINCT，否则为所有。
返回为真表示成功，为假则失败。
1：行数据
  value为当前行的表达式执行的值。
返回为真表示成功，为假则失败。
2：聚集结束
返回聚集函数的执行结果。
范例：求和的聚集函数，其中利用系统参数来缓存数据。
```tsl
Function AggSumSample(Flag,Value);
begin
if FLag=0 then
begin
SysParams["SumSample"]:=0;
return true;
  end
  else if Flag=1 then
begin
SysParams["SumSample"]:=SysParams["SumSample"]+Value;
return true;
  end
  else
  return SysParams["SumSample"];
end;
```
---

## 30103 - Correlof

Correlof    复制链接
简述
 相关系数的聚集函数
定义
 Correlof([DISTINCT]Exp1;Exp2: Expression [;BoolConditionExp:Exp[ ;N[;MovingFirst [;CacheId]]]]);
参数
名称
类型
说明
DISTINCT
指定 Correlof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
real
 数据的相关系数，实数
算法
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的相关系数
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect correlof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30104 - Covof

Covof    复制链接
简述
 协方差的聚集函数
定义
 Covof([DISTINCT]Exp1;Exp2: Expression [;BoolConditionExp:Exp[;N[;MovingFirst [;CacheId]]]])
参数
名称
类型
说明
DISTINCT
指定 Covof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
real
 数据间的协方差，实数
算法
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的协方差
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect covof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30105 - Slopeof

Slopeof    复制链接
简述
 回归斜率的聚集函数
定义
 Slopeof([DISTINCT]Exp1;Exp2: Expression[;BoolConditionExp:Exp [;N[;MovingFirst [;CacheId]]]] )
参数
名称
类型
说明
DISTINCT
指定 Slopeof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
integer
 数据的回归斜率，实数
算法
 or
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的回归斜率
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect Slopeof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30106 - Interceptof

Interceptof    复制链接
简述
 回归截距的聚集函数
定义
 Interceptof([DISTINCT]Exp1;Exp2: Expression [;BoolConditionExp:Exp[ ;N[;MovingFirst [;CacheId]]]])
参数
名称
类型
说明
DISTINCT
指定 Interceptof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
 回归截距，实数
算法
其中，b为回归斜率
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的回归截距
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect Interceptof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30107 - Rsqof

Rsqof    复制链接
简述
 乘积矩相关系数平方的聚集函数
定义
 Rsqof([DISTINCT]Exp1;Exp2: Expression[;BoolConditionExp:Exp [;N[;MovingFirst ;CacheId]]]])
参数
名称
类型
说明
DISTINCT
指定 Rsqof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
real
 乘积矩相关系数的平方，实数
算法
其中，r即为相关系数
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的乘积矩相关系数的平方
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect RSQof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30108 - Steyxof

Steyxof    复制链接
简述
 相对标准偏差的聚集函数
定义
 Steyxof([DISTINCT] Exp1;Exp2: Expression[;BoolConditionExp:Exp [;N[;MovingFirst [;CacheId]]]])
参数
名称
类型
说明
DISTINCT
指定 Steyxof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
real
 相对标准偏差，实数
算法
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的相对标准偏差
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect steyxof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30109 - Slopeandinterceptof

Slopeandinterceptof    复制链接
简述
 回归斜率和截距的聚集函数
定义
 Slopeandinterceptof([DISTINCT]Exp1;Exp2: Expression[;BoolConditionExp:Exp [;N[;MovingFirst [;CacheId]]]])
参数
名称
类型
说明
DISTINCT
指定 Slopeandinterceptof第一个表达式的操作只使用每个值的唯一实例，如果不加此参数，则对所有的值进行聚合函数运算。
Exp1
TExpression
字段或表达式
Exp2
TExpression
字段或表达式
BoolConditionExp
TExpression
条件表达式，bool值(默认为真)
N
integer
移动数据长度（没有值时取统计所有数据，否则统计对象为满足条件的从当前行起往前总共的N条记录，如果为负数，则为从当前起往后总共|N|行。）
MovingFirst
Boolean
布尔型，为真表示统计内容为最近N条内符合BoolConditionExp条件的，为假表示统计内容为最近N条符合BoolConditionExp条件的。省略的时候具体默认值由SelectOpt来决定，参见:SELECTOPT(Options)。
CacheId
String
字符串型，缓存标识串，参见:SQL时间序列统计缓存标志与性能加速
返回
Array,TableArray
 回归斜率和截距，一维数组，长度为2，分别表示回归斜率和截距
算法
备注：移动条件统计时，满足条件长度的数据必须大于等于2
范例
万科A在2018/10/1~2018/10/30日线收盘与大盘的回归斜率和截距
```tsl
begt:=20181001T;
Endt:=20181030T;
Setsysparam(Pn_Stock(),"SZ000002");
dateArr:=markettradedayQK(begt,Endt);
data:=select thisrow as "日期",
```
       Spec(Specdate(close(),thisrow),"SZ000002") as "价格",
       SPec(Specdate(Close(),thisrow),"SH000001") as "大盘"
     from dateArr
```tsl
     End;
return vselect slopeandinterceptof(["价格"],["大盘"])from data end;
```
相关
Correlof
Covof
Slopeof
Interceptof
Rsqof
Steyxof
Slopeandinterceptof

---

## 30142 - TSL程序的基本构成

TSL程序的基本构成    复制链接
TSL程序的基本构成是函数定义体，一个函数定义体中可包含有多个的函数。函数是TSL程序的最小可执行的单元，函数的基本结构如下：
```tsl
  Function FunctionName([Param1,Param2…]);//函数申明头，在关键字Function后带有函数名称，函数名称的后面带有括号对，其中可带有参数。
  Begin //用Begin作为函数开始标志。
  Statement;
  [Statement;
```
  ……
  Statement;]
```tsl
    //函数体，可包括多个语句段。
  End; //用End作为函数的结束标志。
```
  例子1、下面是一个最简单的显示当天日期的函数例子：
```tsl
  Function HelloTSL();
  Begin
     dToday := Date(); //将函数Date返回的值赋值给变量dToday
     strToday := 'Hello ,today is' + DateToStr(dToday) + '!';
     //调用函数DateToStr将dToday转换为字符串并合成输出串赋值给//strToDay
     return strToday;//返回strToday。
  End;
```
  本函数又可以简化为如下：
```tsl
  Function HelloTSL();
  Begin
    Return 'Hello ,today is' + DateToStr(Date()) + '!';
  End;
```
---

## 30215 - STATIC静态计算

STATIC静态计算    复制链接
  语法：STATIC Expression [name nameExpression]
  功能：指定后边的表达式为静态计算（常量计算），该计算只计算一次，用于加速。
  其中，
  Expression ：为表达式
  nameExpression：为该静态计算标识符，每个标识符代表的表达式只执行一次，即若该标识符在第二次被调用时，则直接返回第一次执行的结果。
  例1：
```tsl
  Begin
    Return Teststatic("BBBB");
  End;
  Function teststatic(key);
  Begin
//这个变量A的值是一个不需要每次调用重新构造的静态计算，即它右边的表达式不管上层调用多少次，它只执行一次
    A:=static array("ABCD":1,"BBBB":2,"CCCC":3……..);
    Return A[key];
  End;
```
  例2：
```tsl
  Begin
    Return staticstockname("SZ000002");
  End;
  Function staticstockname(key);
  Begin
    Return static StockName(key) name "stkname"$key; //每个股票代码求名称都只要计算一次，假如StockName函数耗费的时间比较长，则静态计算可以加速。
  End;
```
---

## 30292 - ?:省略真表达式的三元运算符的特殊用法

?:省略真表达式的三元运算符的特殊用法    复制链接
语法2：Condition?:FalseResult
说明：若Condition为真，则返回Condition，若Condition为假，则返回FalseResult。
  在计算中，经常会出现有NIL值，NIL值的产生原因是多种多样的，例如多表的SELECT JOIN查询产生（我们姑且先不去理解什么是SELECT JOIN），当产生NIL值以后，NIL无法和其他数据类型进行运算，会产生错误。用户可能会希望在计算的时候利用0或者空字符串来替代掉NIL，使得计算可以继续。
  例如：
  Aexp+1，由于Aexp可能是NIL会出错，那么用户可能会采用如下来替代：
  (Aexp?Aexp:0)+1
  有时候Aexp计算的表达式很长，这样写起来就会很不方便，运算的时候效率也会比较低，因为Aexp可能需要计算两次，在这种特殊用途中，TSL语言支持省略掉真表达式，缺省认为为真的时候的值就是?之前表达式的本身的计算结果，这种写法就可以缩略为：
  (Aexp?:0)+1
示例：计算一个序列中各元素的和，nil值用0替代。
```tsl
a:=array(1,2,3,nil,100);
s:=0;
for i,v in a do
 s+=v?:0;
return s;
```
返回结果为：106

---

## 30310 - IF

IF    复制链接
IF语句是由一个布尔表达式和两个供选择的操作序列组成。运行时根据布尔表达式求值结果，选取其中之一的操作序列执行。有两种形式的IF语句：
```tsl
If <布尔表达式> then <语句>;
If <布尔表达式> then <语句1>
else <语句2>;
```
当布尔表达式的值为真，执行then后面的语句；当值为假时则有两种情况：要么什么也不做，要么执行else后面的语句。
注意：
else前面没有分号，因为分号是两个语句之间的分隔符，而else并非语句。如果在该处添了分号，则远程服务器在编译的时候就会认为if 语句到此结束，而把else当作另一句的开头，这样就会输出出错信息。
语句可以是一条语句或是一组语句，如果是一组语句时，这组语句必须使用Begin … End标识符来限定，写成复合语句。在用if语句连续嵌套时，如果你插入适量的复合语句，有利于程序的阅读和理解。
例2：求y=f(x),当x>0时，y=1，当x=0时，y=0，当x<0时，y=-1。
```tsl
 Function IfExample();
 Begin
  if x>0 then y:=1
  else if x=0 then y:=0
  else y:=-1;
  return y;
End;
```
例3：当x>0时候，计算x*x，并且输出x*x，否则输出0。
```tsl
 FunctionIfExample2(x);
 begin
  if x>=0 then
  begin
    x1:=x*x;
    return x1;
  end
  else
    return 0;
end;
```
注意：当if 语句嵌套时，TSL约定else总是和最近的一个if配对。

---

## 30311 - CASE

CASE    复制链接
多分支条件语句，Case of
语法一：普通语法。
```tsl
CASE <Expression> OF
<情况标号表1>: 语句1;
<情况标号表2>: 语句2;
```
...
<情况标号表N>: 语句N;
 [Else 例外语句;]
End;
情况标号表的语法为：
  CASE区间1[,CASE区间2..CASE区间N]
CASE区间的语法为：
  区间开始值[TO 区间结束值]
如果没有TO语句，则结束值和开始值相同。
例：
```tsl
Function CaseExample(Age);
Begin
 Case Age Of
 0: Writeln("婴儿");
 1 ,2: Writeln("婴幼儿");
 3 TO 6: Writeln("幼儿");
 7 TO 14: Writeln("少年");
 15 TO 17: Writeln("青少年");
 Else
  Writeln("成年");
 End;
End;
```
语法二：支持Case表达式，在该种情况下，分支语句不支持语句段，只能是单语句表达式。
```tsl
B:= CASE <Expression> OF
<情况标号表1>: 表达式1;
<情况标号表2>: 表达式2;
```
…（其它的与普通用法一致）
 范例：
范例一：
```tsl
a:=3;
b:=case a of
1,2:"1/2";
3,4:"3/4";
else
"OTHER";
end;
return b;
//结果：3/4
```
范例二：
```tsl
a:=3;
b:=case a of
1,2:echo "1/2";
3,4:echo "3/4";
else
"OTHER";
end;
return b;
//结果：0。打印窗口：3/4
```
范例三：表达式的用法
```tsl
b:=@case a of
 1,2:"1/2";
 3,4:"3/4";
 else
  "OTHER";
end;
a:=2;
return eval(b);
//结果：1/2
```
---

## 30312 - 循环语句

循环语句    复制链接
  当需要重复执行一条或是一组语句时，可以使用循环控制语句。TSL中的循环控制语句有While语句和For语句。
函数名
别名
备注
WHILE
while语句
REPEAT
重复执行语句直到满足某一条件
FOR
for 语句用来描述已知重复次数的循环结构
BREAK
从当前循环的语句段中跳出来
CONTINUE
强制地结束当前循环开始进入下一次循环
内容
WHILE
REPEAT
FOR
BREAK
CONTINUE

---

## 30313 - WHILE

WHILE    复制链接
while语句用于"当满足某一条件时重复执行语句"的情况。while语句的语法格式：
while 布尔表达式 do 语句；
循环结束条件在进入循环体之前测试，若最初的测试值为false，则根本不进入循环体。为了能使while重复能终止，循环体中一定要有影响布尔表达式的操作，否则该循就是一个死循环。
说明：
语句可以是一条语句或是一组语句，如果是一组语句时，这组语句必须使用Begin … End标识符来限定，写成复合语句。
例4：计算从0到某个数之间的和。
```tsl
Function sums(limit);
begin
  sum:=0;
  num:=0;
  while num<=limit do
  begin
    sum:=sum+num;
    num++;
  end;
  return sum;
end;
```
---

## 30314 - REPEAT

REPEAT    复制链接
repeat语句用于”重复执行语句直到满足某一条件”的情况。repeat语句的语法格式：
repeat
```tsl
语句段;
until 布尔表达式;
```
说明：
repeat与while不同之处有几点：
1,repeat先做后判断是否结束，while先判断后做，也就是说repeat至少会做一次；
2,repeat的判断条件是结束条件，而while的判定条件是开始做的条件；
3,repeat和util之间可以有语句段，不需要begin end来限定，而while由于没有结束的特殊标识符，因此当使用语句段的时候必须用Begin end来约束。
例5：求第一个阶乘超过指定值的值
```tsl
Function MinMultiValue(limit);
begin
 multi:=1;
 value:=1;
```
 repeat
```tsl
  multi:=multi*value;
  value++;
 until multi>limit;
 return value;
end;
```
---

## 30315 - FOR
```tsl
FOR    复制链接
for 语句用来描述已知重复次数的循环结构。for 语句有三种形式：
(1) for 控制变量:=初值 to 终值 [step 步长] do 语句；
(2) for 控制变量:=初值 downto 终值 [step 步长] do 语句；
```
(3) for 控制变量1，控制变量2 IN 数组 Do 语句；
第一种形式的for 语句是递增循环。
首先将初值赋给控制变量，接着判断控制变量的值是否小于或等于终值，若是，则执行循环体，在执行了循环体之后，自动将控制变量的值该为它的后继值，并重新判断是否小于或等于终值。当控制变量的值大于终值时，退出for循环，执行for语句之后的语句。
可通过step N方式指定递增步长，可省，默认为1。
第二种形式的for 语句是递减循环。
首先将初值赋给控制变量，接着判断控制变量的值是否大于或等于终值，若是，则执行循环体，在执行了循环体之后，自动将控制变量的值该为它的前趋值，并重新判断是否大于或等于终值。当控制变量的值小于终值时，退出for循环，执行for语句之后的语句。
可通过step N方式指定递减步长，可省，默认为1。
注意：for 语句中，当初值、终值、步长确定后，重复的次数就确定不变了，并且控制变量在重复语句内不能施加任何赋值操作。
例如：计算1+2+3+……+99+100的值
```tsl
Function PlusFor();
begin
  sum:=0;
  for i:=1 to 100 do //缺省步长，默认步长为1
    sum:=sum+i;
  return sum;
end;
```
例如：计算1+3+5+……+99的值
```tsl
Function PlusFor2();
begin
  sum:=0;
  for i:=1 to 100 step 2 do
    sum:=sum+i;
  return sum;
end;
```
第三种形式的for语句是直接对数组进行遍历
对数组中的每一行（第一维）进行遍历，当前行的下标存放在第一个控制变量中，该行对应的值存放在第二个控制变量中。从第一行开始，将行标与当前行的值分别赋值给控制变量1与控制变量2后，执行循环体，在执行了循环体之后，自动将2个控制变量的值赋值为下一行的下标及该行值，当遍历完最后一行之后，退出for循环，执行for语句之后的语句。
For … IN 遍历的用法说明
语法：For i,v IN TArray DO 语句;说明：对数据的遍历。
其中，i：控制变量1,获取当前循环中数组第一维的下标值v：控制变量2，对应当前循环中第一维度的值
TArray：需要被遍历的数组。
注1：二维及多维数组可当作一维处理，此时的控制变量2的值则可能是一个数组。
注2：在此过程中，不可更改一维数组的值，也不可对该数组中的任何元素进行赋值操作，对在循环过程中不可对循环数组TArray进行变更操作。
适应场景：对于非数字下标的数组，处理比较方便，且效率高
范例一：一维数组的应用
```tsl
data:=array('a':1,'b':5,'c':3,'d':-2);
s:=0;
for i,v in data do
 s+=v;
return s;
//返回实数7
```
范例二：二维数组的应用
```tsl
data:=rand(array('a','b','c'),array('AA','BB','CC','DD'));
s:=0;
t:=1;
for i,v in data do //data是二维数组，所以第一维中，v的值是一个一维数组，即当前行。
  for j,v1 in v do
  begin
   s+=v1;
   t*=v1;
  end
return array(s,t);
```
返回：array(12,1)

---

## 30316 - BREAK

BREAK    复制链接
在执行WHILE和FOR以及REPEAT UNTIL循环语句时，可以用BREAK语句随时从当前循环的语句段中跳出来，并继续执行循环语句后面的语句。
注意：Break语句只是从当前的语句循环中跳出来，如果要从多个嵌套的循环语句中跳出，则需要通过多个对应的Break语句来完成。
例7：我们用While语句和Break语句重新来例5中的1+2+3+……+99+100值
```tsl
Function PlusWhile();
begin
 sum:=0;
 i:=0;
 while True do
 begin
  i++;
  if i>100 then
  break;
  sum:=sum+i;
 end;
 return sum; //BREAK后执行的第一行语句。
end;
```
---

## 30317 - CONTINUE

CONTINUE    复制链接
  CONTINUE语句和BREAK语句一样，都可以改变WHILE循环语句和FOR循环语句以及REPEAT UNTIL的执行顺序。
  BREAK是强制地从一个循环语句中跳出来,提前结束循环，而CONTINUE语句则强制地结束当前循环开始进入下一次循环。
如：
```tsl
While true do
Begin
 i++;
 if i=100 then continue;//跳过100
 if i>=1000 then break; //到1000结束
End;
```
---

## 30318 - GOTO

GOTO    复制链接
  几乎所有的分支流程控制语句都指令跳转有关，只是绝大多数情况下是有条件跳转,GOTO是无条件跳转语句，其规则是使用label 定义标号，使用goto可以跳转到指定的标号。
一个GOTO的案例：
```tsl
for i := 0 to length(data) -1 do
  begin
   for j := 0 to length(data[i])-1 do
   begin
     if data[i][j] = target then
     begin
      goto finded;
     end;
   end;
  end;
  label finded;
  //在一个二维数组中查找只要查找到则结束
```
  GOTO有一个特性，就是只能从内层往外层跳转（且不能跨越函数）

---

## 30321 - DEBUGRETURN

DEBUGRETURN    复制链接
  调试返回，后面跟返回值，可在任何地方直接将结果返回，而不是象RETURN一样返回到上一级别，这有助于用户调试使用。
如下面示例，返回为3而不是4：
```tsl
A:=abcd(3);
Return A+1;
Function abcd(bb);
Begin
  debugreturn bb;
End;
```
---

## 30322 - 异常处理Try Except/Finally

异常处理Try Except/Finally    复制链接
  某些函数在执行的过程中可能会自动抛出异常，或者被手动Raise抛出异常，这个时候如果没有异常处理运行就会终止。
使用异常处理则可以保护程序继续执行，并可以对异常进行相应的处理。异常的信息可以由ExceptObject对象获得，异常处理使用如下模式：
Try
被保护的程序执行段
Except
异常处理程序段
End;
例如：
Try
  I:=StrToInt(S); //当S不能转换为整数的时候会产生异常。
Except
```tsl
  I:=0; //当发生异常的时候设置I为0；
  Writeln(ExceptObject.ErrInfo);
End;
```
对于某个程序段可能出现中途返回或者退出，或者中途被异常中断，而某些代码必需要在其后执行的，则采用如下模式：
Try
被保护的程序执行段
Finally
保证执行的处理程序段，即便Try Finally之间的语句有返回或者异常产生。
End;
注：try...Except...end可以使程序在报错时继续向下运行，即主程序不终止。
try...Finally...end则是该报错时就会报错，即发生错误时程序会报错且终止，只是在中断前会执行完Finally中的命令行。

---

## 30327 - With => Do

With => Do    复制链接
其语法如下：
WITH [S=>StockID,T=>Time] DO Statements;
例如：
With S=>'SZ000001',T=>IntToDate(20020601) Do
```tsl
Begin
  C:=Close();
  RC:=Ref(Close(),1);
  Diff:=C-RC;
End;
```
其工作原理如下：
先根据S和T设置当前的股票和日期，然后执行DO后的语句，执行完后恢复股票和日期的环境。
参见：系统参数设置和获取函数

---

## 30342 - 概念

概念    复制链接
  TSL语言中，有两种可执行单元，它们分别是函数定义体和函数。
  函数是一个由多条语句组合的，可以在远程服务器上运行并允许返回结果的语句集合和最小运行单元，TSL语言是纯函数语言，所有的任务均需通过函数来实现。
  函数的结构说明如下：
```tsl
  Function 函数名称(参数1，参数2…)；
  Begin
  语句;
  语句;
```
  ……
```tsl
  语句;
  End;
```
  函数说明的第一行为函数声明头。它指明一个函数的函数名和参数信息，一个函数允许带零到多个的任意数据类型的参数。一个完整的函数声明必须包含有Begin和End标识符。
  函数定义体是TSL是多个函数的集合，定义体的名称与函数集合中的主运行函数相同。
  在一个函数定义体中不允许出现两个重名的函数声明。
  函数中可以返回内容，返回的内容可以通过变参返回，返回值和C类似，使用Return返回。
  函数返回参数类型可以任意类型。
  TSL仅允许return一个值，如果需要返回多个内容，建议用户使用数组来包装返回，例如return array(X,Y);

---

## 30348 - VarByRef编译选项

VarByRef编译选项    复制链接
  编译选项。
  插入{$VarByRef-}可以关闭允许参数值修改的编译选项，系统默认是允许修改的，一旦关闭了编译选项，函数将无法修改传入的参数。
  如果要重新打开该选项，用{$VarByRef}或者{$VarByRef+}即可。如果我们要临时允许修改，可以使用var前缀。
  编译选项是影响的编译，而非运行。所以在一个函数中打开或者关闭了开关，调用到另外一个函数的时候，该开关是不会生效的。所以每一个函数里都需要使用开关。
  编译选项影响的编译是编译选项后的程序的编译代码，如果一个在函数体内里包括局部函数，编译选项也会影响到下边的局部函数。
  事实上，TSL语言可以利用编译选项修改默认参数传递为形参的。
  例如：
  {$VarByRef-}//关闭允许参数值修改的编译选项
```tsl
  RealA:=100;
  RealB:=200;
  Writeln(Abcd(RealA,RealB));
  Writeln("RealA=",RealA," RealB=",RealB);
Function abcd(a,b);
Begin
  A:=a*2;
  B:=b*3;
  Abcd:=A+B;
  return Abcd;
End;
```
结果为
  800
  RealA=100 RealB=200
  也就是说默认变为形参后，在函数abcd里修改a,b参数都不再会影响RealA,RealB的值了。
  {$VarByRef+}可以重新打开开关。
  注意：编译选项对后边的所有源代码的编译都有效，并不仅仅局限在当前的函数内（而是整个文件或者函数体内有效）。
  为了改变参数传递的方式，用户可以在参数前加in/const,var/out前缀。

---

## 30386 - 隐藏

隐藏    复制链接
  Unit的使用具有代码重用，信息隐藏的优势。一个单元的interface中的所有标识符(函数，类等)对于使用该unit的任何程序都是可用的，而这些标识符的实现部分都隐藏在相应的unit中(implementation部分)。调用者只需要知道接口部分的语法，利用unit中的公有方法，unit中的内部运行机制并不是调用者需要关心的，只在Implementation中定义而不在Interface定义的内容是不能被unit的引用者访问的。
一个例子：
Unit UnitB;
Interface
  Function PublicFunc;
Implementation
```tsl
  Function PublicFunc();
  Begin
    Echo 'Public Function is called!';
    PrivateFunc();
  End;
  Function PrivateFunc();
  Begin
    Echo 'Private Function is called!';
  End;
End.
Function FunctionUsingUnit();
Begin
  uses UnitB;
```
  PublicFunc();//"Public Function is called!Private Function is called!"
  PrivateFunc();//函数privatefunc编译错误，或者找不到该函数
End;

---

## 30391 - 在function中使用uses

在function中使用uses    复制链接
```tsl
Function FunctionUsingUnit();
Begin
uses UnitA,UnitB,UnitC;
  FuncInUnitA();
End;
```
  在function中uses子句必须写在函数体的第一行，且一个函数体中只能使用一次uses语句，否则无法通过语法检查。引用后，函数可以直接调用在各个被引用单元中的接口函数和类。

---

## 30435 - MFind矩阵查找

MFind矩阵查找    复制链接
  MFind可以查找矩阵中的符合条件的行列以及值。
  例如，我们在一个随机矩阵中寻找值大于0.9的值所处在的位置：
```tsl
A:=Rand(10,10);
B:=MFind(A,MCell>0.9);
```
 B的返回结果为一个二维数组，第0列为符合条件的行号，第1列为符合条件的列号。
  如果我们除了要返回行列号，还需要返回符合条件的结果，则用MFind(A,MCell>0.9,True)即可，这样第2列为符合条件的值。
  在查找的时候，第二个参数为一个条件表达式，我们可以利用MCell获得值，也可以利用MRow获得行下标，MCol获得列下标，所以我们也可以做出复杂的查询。
  复杂应用案例：
  例如：
  A为矩阵，内容为股票的最近N日的日期，我们假定我们的范例中的股票均已上市N日以上。
```tsl
N:=100;//一百个交易日
A:=Zeros(N,array("SZ000001","SZ000002")); //得到一个N行两列的0矩阵，列名为股票代码
Cols:=MCols(A,1);
for j:=0 to length(Cols)-1 do //初始化时间数组
begin
  SetSysParam(pn_stock(),Cols[j]);
  SetSysParam(pn_date(),now());
  A[:,j:j]:=`NDay3(N,sp_time()); //给第J列赋值为时间
end;
B:=MFind(A,Spec(SpecDate(Close()>Ref(Close(),1)*1.02,MCell),MCol),1); //MCell为时间，MCol为股票代码
return B;
```
  返回的B的结果为股票涨幅大于2%的股票和时间。

---

## 30521 - 矩阵查找和遍历

矩阵查找和遍历    复制链接
  MFind可以查找矩阵中的符合条件的行列以及值。
  例如，我们在一个随机矩阵中寻找值大于0.9的值所处在的位置：
```tsl
 A:=Rand(10,10);
 B:=MFind(A,MCell>0.9);
```
  B的返回结果为一个二维数组，第0列为符合条件的行号，第1列为符合条件的列号。如果我们除了要返回行列号，还需要返回符合条件的结果，则用MFind(A,MCell>0.9,True)即可，这样第2列为符合条件的值。
  在查找的时候，第二个参数为一个条件表达式，我们可以利用MCell获得值，也可以利用MRow获得行下标，MCol获得列下标
```tsl
 Stks:=Array("SZ000001","SZ000002");
 Times:=Array("2008-12-31","2007-12-31","2006-12-31");
 A:=Nils(Stks,Times);
 //生成列下标为时间字符串，行下标为股票的空矩阵。
```
 A::Begin
```tsl
   SetSysParam(pn_Stock(),MRow);
 T:=StrToDate(MCol);
 if FirstDay()>T then continue;
 MCell:=SpecDate(Close(),T);
 end;
```
  ::实现一次Stks与Times的笛卡尔积的遍历，判断了是否已经上市，如果未上市则保持为NIL值，否则利用MCell来赋值为收盘价。
```tsl
 A:=Array((1,-2,3),(2,-0.5,-1));
 A::=abs(MCell);
  A的结果为Array((1,2,3),(2,0.5,1));
  ::=的工作原理是，遍历矩阵，对右表达式进行计算，计算结果设置给矩阵的对应项。
```
---

## 30734 - 设定指定变量为自动弱引用

设定指定变量为自动弱引用    复制链接
语法：
[WeakRef] x1[,x2,…];
指定成员x1(或x2等，多个变量用,隔开)为自动弱引用
[AutoRef]x1[,x2,…];
指定成员x1(或x2等，多个变量用,隔开)为强引用，一般在弱引用设定环境下使用。
即带[ ]只对当前语句中的变量有效，不带[]就是对段落有效。
范例：
Type AutoWeakTest2=class
  FA;
[WeakRef]FB,FB2,FB3;//在强引用环境下，定义弱引用
  FC;
WeakRef  //指定当前环境下定义的成员为弱引用
```tsl
  FOnClick;
[AutoRef]FD;
  FOnMouseMove;
  FOnMouseOver;
End;
即，上面的强引用成员变量有：FA,FC,FD;
```
弱引用成员变量有：FB,FB2,FB3,FonClick, FonMouseMove, FonMouseOver。

---

## 31515 - 多参数赋值运算

多参数赋值运算    复制链接
说明：将数组中的值依次赋值给对应位置的变量
语法：[变量1,变量2,...]:=array(值1,值2,...);
注意：
 1 右边的数组行标（即第一维）必须是自然数字下标，支持多维数组。
 2 左边变量必须从第一个开始，依次赋值，前面的变量不能为空。当变量名存在同名时，后面的会覆盖前面的。
 3 该种用法中，变量个数只有一个时，后面的逗号不能省，即最短写法为[r1,]:=array(1)；
 4 右边的值必须是一个数组，可以是多维数组
 5 左边的变量数大于右边的行数时，无对应值的变量值为nil。左边的变量个数可以少于右边数组的行数。
 6 支持在函数传参中使用，具体用法可参考范例05。
范例：
范例01：一般用法
```tsl
//将数组中每个值都赋值给对应位置变量
[r1,r2]:=array(1,3,5,7,9);
return r1+r2;//返回4，其中，r1的值为1，r2的值为3。
```
范例02：变量最少的用法
```tsl
//将数组第一个值赋值给变量
[re,]:=array(1,2,3,4);
return re;//返回1
```
范例03：变量个数多于数组长度的示例
```tsl
//数组中只有一个值
[r1,r2]:=array(1);
return r2;//返回nil
```
范例04：二维数组
```tsl
[r1,r2]:=array((1,2),(3,4));
return r2;//返回array(3,4)
```
范例05：函数传参
说明：调用函数时，当参数是表达式时，会先根据参数的位置依次执行表达式，然后将表达式的值传入到被调函数中。
  比如存在函数test(a,b,c)，具体实现如下，在调用时，执行如下：
```tsl
    return test(e:=3,[f,g]:=array(1,2),g);
  其传参数可理解为：先将3赋值给变量e，再将e的值作为函数的第一个参数传入，再执行表达式[f,g]:=array(1,2)，分别给变量f、g赋值并将变量f（[f,g]中的第一个值）的值作为函数的第二个参数传入，最后一步将变量g的值作为函数的第三个参数传入；所以执行结果为3+1+2=6。
  而当执行return test(e:=3,[f,g]:=array(1,2))会返回4。原因是，没有传入第三个参数，因此结果为3+1+nil=4。(nil参与运算不报错的情况下，若报错模式则会引发程序报错)。
```
注：此种用法并不常用。
```tsl
//test函数内容
function test(a,b,c)
begin
  return a+b+c;
end
```
范例06：实用场景，当我们执行某个程序之后想要返回多个指标值，可以采用这种方式进行处理会更快便捷。比如在数据库交互过程中，做一个数据提取的操作的时候，我既希望可以返回提取的数据结果集，又希望在提取失败时返回具体失败的信息，方便查看失败的原因。那此时，就希望能一次返回两个结果，一个代表数据库操作是否成功的Bool类型结果，另一个代表的是提取的结果集或报错信息。那通过数组绑定变量的方式就可以很好地读取到对应的信息值，大致过程如下所示：
```tsl
//被调函数
function add(a,b)
begin
  if not (ifreal(a) and ifreal(b)) then
    return array(1,"传入参数不为实数");
  return array(0,a+b);
end
```
调用方式如下：
```tsl
[error,re]:=add(3,4); //error变量取到的是计算结果是否异常，re代表的是执行结果或报错信息
if error then begin
```
...//异常处理
end
...//获取到的正常值继续进行计算

---

## 31517 - 命名参数调用

命名参数调用    复制链接
功能：调用函数时，通过给指定参数名进行传值，无需区分先后次序。
多用于数学方法的调用（在定义时可搭配缺省参数的使用）、OFFICE的COM调用以及PYTHON的一些机器学习方法调用中。
TSL内置已实现对COM命名参数调用，并支持PYTHON对象以及函数的命名参数调用。
用法：funcName(参数名:参数值,…)
说明：天软新一代语言中支持。
例如：
```tsl
function funcA(a,b,c);
begin
 echo "funcA--","a:",a," b:",b," c:",c;
end
执行：funcA(1,c:3);
```
打印：funcA--a:1 b:<NIL> c:3
注意：
 1、在传统传参方式与命名参数传参方式混合使用时：
  a、命名参数方式出现之后，后面所有参数都需用命名参数的方式传入（否则会引发语法报错），命名参数传入参数后就不再考虑参数位置关系，根据参数名对指定参数进行传值。
  b、前面有通过非命名参数方式传过参的参数，后面不可再通过命名参数对该参数再次传参（否则会引发运行时错误，找不到该变量），只能对未赋值过的参数进行传参。即，不能出现重复传参数的情况。
 2、函数体是TSL语言实现的才可用命名参数的方式传入，二进制函数（看不到函数体的）不支持，需要用户重新封装。
```tsl
例如：系统函数inttostr(value)，由于属于二进制函数，所以不支持inttostr(value:200)方式调用，可以进行如下封装进行转变：
//封装MM_inttostr(V)调用inttostr来替代它
Function MM_inttostr(V);
begin
  return inttostr(v);
end
调用：return MM_inttostr(v:200);
```
返回：'200'
 3、除了函数的直接调用上支持命名参数的调用外，通过函数名或指针去调用函数或类的成员方法的模型也支持传参时以命名参数的方式进行，例如，call、invokeinarray等。
例如：有函数testFuc
```tsl
Function testFuc(a,b,c);
begin
  return array(a,b,c);
end
调用：return call("testFuc",a:1,c:2,b:3);
```
返回结果：array(3,2,1)
4、在函数存在多态的功能时，比如类成员方法中存在多个同名函数重载的方法时，此时不建议使用命名参数的调用，可能引发不可控的调用问题。

---

## 31660 - Inherited

Inherited    复制链接
Inherited是一种调用父类的巧妙的实现，这个实现和Object pascal遵循相同的规则。由于tsl支持多重继承，因而Inherited会优先调用第一个继承的父类，如果没找到则会遍历之后继承的类。
Inherited和java的super有一定的类似之处，但又不相同， java的super可以表达成父类，也可以调用父类的方法，而Inherited都是调用父类的方法，而且单独Inheritd的写法，在父类不存在方法的时候不会出错，这样的特性非常便于桌面应用开发里的子类窗口的消息事件响应。
用法有两种：
方式一：在方法中，增加inherited;则表示执行父类中存在的与当前方法名同名同参数的方法，若父类中查找不到，不报错，即什么也不做，继续向下执行。
方式二：使用如inherited func(a,b,c);的模式调用方法，表示调用父类中的该方法，若存在多父类，则按顺序查找，若父类中查找不到，则报错。
例如：
Type Base1 =Class
```tsl
 Function Method1(s,a,b); virtual;
 Begin
   s:=s$"-Base1-Method1-"$(a+b);
 End;
 Function Method2(a,b);
 begin
   return "Base1-Method2-"$(a*b);
 end;
End;
```
Type SubClass =Class(Base1)
```tsl
 Function Method1(s,a,b); override;
 Begin
```
  Inherited; //优先调用父类中Method1(s,a,b)方法，找不到不报错
```tsl
  s:=s+"->SubClass";
  s2:=Inherited Method2(a,b);//指定调用父类中的Method2(a,b)方法，找不到会报错
  s:=s+"->"+s2;
  return s;
 End;
 Function Method2(a,b);
 begin
   return "SubClass-Method2-"$(a/b);
 end;
End;
```
调用：
```tsl
obj:=new SubClass();
return obj.Method1("S",2,50);
```
返回结果为：S-Base1-Method1-52->SubClass->Base1-Method2-100
即：Inherited;语句执行父类Base1中同名同参数方法Method1(s,a,b)
Inherited Method2(a,b);执行父类Base1中指定方法Method2，而非当前类SubClass的Method2方法

---

## 31758 - 第一种：当前交互语句设置为Openforwardonly模式

第一种：当前交互语句设置为Openforwardonly模式    复制链接
通过设置Flags参数的第27位为真（即0x8000000）生效。
```tsl
SQLStr:="select * from Test where EndDate>='2013-06-30'";
Flags:=0x8000000; //选择Openforwardonly模式
Ret:=rdo2 ExecSQL(Flags,'SQLAlias',SQLStr,t);
if ret then
return result;
else
return rdo2 SQLErrorMsg();//报错信息
```
例如：执行下列SQL语句时，服务器端不会缓存该语句访问的结果集。

---

## 31759 - 第二种：设置当前环境缺省为Openforwardonly模式

第二种：设置当前环境缺省为Openforwardonly模式    复制链接
在ExecSQL的方式中，还可以通过配置改变当前交互环境的默认方式为Openforwardonly模式。
支持配置ExecSql交互的缺省方式与指定数据库交互的缺省方式。
当配置为Openforwardonly模式后，可以通过指定设置Flags参数的第26位为真（即0x4000000）来取消，即临时指定为Notopenforwardonly模式。
配置方法：
[ExecSql Config]
ExecSqlForwardOnly=1

#设置此处则，默认任何别名在EXECSQL均启用openforwardonly模式

[DBAlias]
ExecSqlForwardOnly=1

#设置此处则，默认数据库别名DBAlias在EXECSQL均启用openforwardonly模式在天软安装目录下的plugin\ExecSql.ini文件中，添加以下配置

注：以上缺省方式的设置仅支持ExecSql的操作，不支持TS-SQL语句。
```tsl
SQLStr:="select * from Test where EndDate>='2013-06-30'";
Ret:=rdo2 ExecSQL('SQLAlias',SQLStr,t);
if ret then
return result;
else
return rdo2 SQLErrorMsg();//报错信息使用范例：在配置了上述缺省方式之后，操作如下
```
即，由于ExecSQL执行的当前环境缺省为Openforwardonly模式，所以默认情况下上述执行的sql语句不会缓存结果集。
```tsl
SQLStr:="select * from Test where EndDate>='2013-06-30'";
Flags:=0x4000000; //指定为Notopenforwardonly模式
Ret:=rdo2 ExecSQL(Flags,'SQLAlias',SQLStr,t);
if ret then
return result;
else
return rdo2 SQLErrorMsg();//报错信息
```
在这种环境下，当提取的某次结果集，在后面的过程中还需要被再次或多次访问时，我们又希望它能够被缓存，来提高访问效率，此时，我们可以在本次执行的ExecSQL操作中进行单次取消Openforwardonly模式，进入Notopenforwardonly模式进行执行，例如：

---

## 31778 - 使用范例

使用范例    复制链接
在设置为5个最大线程数的情况下，运行10个线程，每个线程暂停5秒并返回id编号和线程号。
最后，打印所有的线程id编号和线程号，和程序运行时间，运行时间10秒多一点说明，最大线程数设置成功。
代码如下：
```tsl
mtic;
a:=array();
for i:=0 to 9 do
begin
  a[i]:=#multirun(i);//语句前增加标识#即可执行多线程。
end
echo tostn(a);
echo "总花费秒数为：",mtoc;
return 1;
function multirun(id);
begin
  sleep(5000);
  return array(id,systhreadid());
end
```
---

## 31786 - MakeInstance

MakeInstance    复制链接
简述
将TSL函数生成C的函数指针。如果需要将TSL函数输出为外部程序调用的函数指针，如C语言函数的指针，就可以通过MakeInstance来实现。
产生一个TSL函数的函数指针，Fun可以是TSL函数、类成员函数类型。
注：在该模式下，对于TSL函数一定要有类型声明，若没有类型声明，就无法去生成C语言的调用，所以一定要有类型声明。
```tsl
声明语法：function TsfunName(p1:DataType;p2:Datetype;…):returnType;
Begin
//函数体
End;
```
如，声明一个天软函数：
```tsl
function TSFunc(a:integer;b:integer):Double;
begin
  return inttodate(a)-inttodate(b);
end;
```
生成函数指针：
f1:=MakeInstance(findfunction("TSFunc"));
目前makeinstance支持的返回类型仅支持数字浮点（单精度和双精度）和整数，用于各式回调支持。
定义
MakeInstance(Fun:String|TFunction;[mode:”cdecl”/”stdcall”;Threadmode:Integer]):pointer
参数
名称
类型
说明
Fun
String|TFunction
可以是TSL函数，也可以是TSL类的成员函数。
Mode
”cdecl”/”stdcall”
可选参数，缺省调用方式采用cdecl模式，除win32外，其它环境无意义。
在win32下，由于系统的回调函数许多是stdcall的，因而也支持stdcall模式。
在Linx以及win64下，stdcall和cdecl的调用模式相同。
Threadmode
Integer
可选参数，线程模式，缺省调用单线程模式
取值
线程模式
0
单线程模式
1
多线程单模
2
多线程多模
返回
pointer
函数的指针。等同于C语言中的函数指针，在C语言中可以直接进行调用。
范例
c代码

#include <Windows.h>

#include <Windows.h>

#include <string>

using std::string;
extern "C" {

#include "TSSVRAPI.h"

}
```tsl
typedef void(*fInterpPrepare)(TSL_State* L);
typedef void(*fInitPubkrnl)(void);
```
using func = double(*)(int); //c++11
int main()
{
```tsl
TSL_InterpInit();
fInterpPrepare TSL_InterpPrepare = (fInterpPrepare)GetProcAddress(LoadLibraryA("TSLInterp.dll"), "TSL_InterpPrepare");
fInitPubkrnl TSL_InitPubkrnl = (fInitPubkrnl)GetProcAddress(LoadLibraryA("tslkrnl.dll"), "TSL_InitPubkrnl");
```
TSL_InitPubkrnl(); //初始tsl内核
```tsl
TObject* r = TSL_NewObject();
TObject* v = TSL_NewObject();
TObject* err = TSL_NewObject();
TSL_State* L = TS_GetGlobalL();
```
TSL_InterpPrepare(L); //初始化解析器
```tsl
//重新定义TSL函数接口，并生成该函数的函数指针
string s = "f1:=MakeInstance(findfunction('TS_inttodate'));  return f1;//对天软公用函数进行重新封装，声明接口输入输出的类型  \r\nfunction TS_inttodate(a:integer) :Double;  \r\nbegin   \r\nreturn inttodate(a);  \r\nend; ";
```
int ret = TSL_ScriptGo(L, s.c_str(), v); //执行tsl 获取tsl构造的函数指针
if (ret == TSL_OK)
{
```tsl
 func inttodate;
 inttodate = (func)TSL_AsInt64(v);
 double re = inttodate(20220101);
 printf("%lf\n", re);
```
}
```tsl
else {
 printf("TSL error");
```
}
}
执行结果：
相关
DLL外部函数引入
MakeInstance
DeleteInstance
多线程调用
FAQ/知识库链接
Q：外部交互之External和MakeInstance

---

## 32062 - TSL调用外部动态库的函数

TSL调用外部动态库的函数    复制链接
语法：Function newFuncName(p1:DataType;p2:Datetype;…):returnType;external FuncDLL name FuncName;
其中，多个参数用;隔开，注意每个参数的参数类型要与原函数对应
returnType：是函数返回结果数据类型
FuncDLL：字符串，如”funcs.dll’，函数所在的动态库名。若平台支持External常量，则该字段除了可以是字符串名，还可以是一个常量，在跨平台上有帮助，可以在不同平台上定义不同的常量。
FuncName：是动态库中的函数原名（注意大小写）.
newFuncName：是自定义的在TSL语言中被调用的函数名。
举例：
TSL调用“tslkrnl.dll”动态库中的函数TS_strtofloat实现字符串转浮点数的功能。
```tsl
Echo TSstrtofloat("1.23");
//声明
Function TSstrtofloat(s:string):double;external "tslkrnl.dll" name "TS_strtofloat";
```
---

## 32759 - 循环语句

循环语句    复制链接
函数名
别名
备注
fc_break
break语句
for_Downto
for + DownTo语句
fc_while
while语句
fc_continue
continue语句
fc_For
for语句
内容
fc_break
for_Downto
fc_while
fc_continue
fc_For

---

## 32762 - fc_while

fc_while    复制链接
简述
while循环语句教学函数。对i自1向99累加到初始值为1的sum，返回sum。
定义
fc_while():integer
参数
名称
类型
说明
返回
integer
整数
范例
```tsl
return fc_while();
//返回：4951
```
相关
fc_break
for_Downto
fc_while
fc_continue
fc_For

---

## 32981 - UNIT单元中常量与变量

UNIT单元中常量与变量    复制链接
TSL语言UNIT支持在interface或implementation中定义变量或者常量，支持findfunction获得一个unit对象，unit对象支持用.来调用方法或者interface里定义的变量或常量。
用来支持在单元中对全局变量的需求。
版本说明：新一代TSL语言中支持该功能。
UNIT中变量的作用范围：全局变量
interface中声明的变量或常量，可被对象访问。
implementation中声明的变量或常量，只能被当前Unit单元内的方法访问。
变量的定义：由关键字Var开头，后面接变量名，多个变量名之间用逗号分隔。
如定义变量UA,UC：Var UA,UC;
常量的定义：由关键字Const开头，后面接常量，具体用法可参考：常量及常量成员的定义与初始化
如定义一个常量：Const UcA=100;
外部对单元变量或常量的引用：findfunction(UnitName).UnitA
示例：
定义一个单元DeMo_Unit_Test01如下：
Unit DeMo_Unit_Test01;
interface
```tsl
var Ua,Ub;
const CS=888;
function addv();
function NumbJO(v); //判断奇偶
function print();
```
implementation
```tsl
const CN=array("奇数","偶数");
var Uc;
function print();//打印变量与常量
begin
 echo "当前值-Ua:",Ua," Ub:",Ub," Uc:",Uc," CS:",CS;
end
function addv();
begin
  Ua+=10;
  Uc+=1;
end;
function NumbJO(v);
begin
  if (v mod 2) =0 then
   echo v,"是一个",CN[1];
  else echo v,"是一个",CN[0];
end;
```
initialization //初始化
```tsl
 Ua:=100;
 Ub:="Tinysoft Unit";
 Uc:=1;
```
Finalization//析构前
```tsl
 echo "DeMo_Unit_Test01 End.";
end.
```
应用展示：
```tsl
uses DeMo_Unit_Test01;
obj:=findfunction("DeMo_Unit_Test01");//获取单元的对象
//--获取Unit中变量Ua的值
echo obj.Ua;
obj.print();
//--给变量重新赋值
obj.Ua:=500;
print();
//--调用Unit中的方法
```
{对方法的调用，当只存在一个单元时，可省略，若存在多个单元且有同名方法时，建议通过对象方式进行指定}
```tsl
obj.NumbJO(58);
NumbJO(33);
addv();
print();
return obj.Ub;
```
打印结果：
100
当前值-Ua:100 Ub:Tinysoft Unit Uc:1 CS:888
当前值-Ua:500 Ub:Tinysoft Unit Uc:1 CS:888
58是一个偶数
33是一个奇数
当前值-Ua:510 Ub:Tinysoft Unit Uc:2 CS:888
DeMo_Unit_Test01 End.
程序返回结果："Tinysoft Unit"

---

## 33908 - for in循环在对象中的重载
```tsl
for in循环在对象中的重载    复制链接
定义： function operator for(flag:integer);
```
说明：
Operator：为重载关键字
flag：整型，运行标识，由两位二进制数字组成，低位表示是否不是初始化状态，
高位表示for in中是否有两个循环变量。因为我们普通的for in有for a in t do与for a,b in t do两种语法。
如0b10（十进制2）表示第一次循环且有两个循环变量；0b11(十进制3)表示非第一次循环且有两循环变量；
循环过程中，若返回nil则表示循环结束，若为数值则表示循环继续。
内容
For in循环在对象中重载的示例

---

## 33909 - For in循环在对象中重载的示例

For in循环在对象中重载的示例    复制链接
实际对对象进行for in循环时，对对象的data属性进行循环操作。
```tsl
a:=array("A","B","C");
echo "For in table---------\r\n";
for n,v in a do
begin
 echo n,"->",v,"\r\n";
end;
echo "For in obj-一个变量---------\r\n";
c1:=new c(a);
for n in c1 do
begin
  echo n,"\r\n";
end;
echo "For in obj-两个变量---------\r\n";
for n,v in c1 do
begin
  echo n,"->",v,"\r\n";
end;
return;
```
type c=class
public
```tsl
 data;
 lengtD;
 findex;
 function create(v);
 begin
  data:=v;
  lengtD:=length(v);
 end;
 function operator for(flag);//flag控制参数个数，n,v
 begin
  n:=flag .& 2;//n即为高位数值，1表示两个变量，0表示只有一个变量
  b:=flag .& 1;//b即为低位数值，1表示不是第一次循环，0表示第一次循环
  echo "--for--:",flag," flag高位：",n," flag低位：",b,"\r\n";
  if not b then //循环开始初始化
    findex:=0
  else if findex<lengtD-1 then findex++; //循环过程非初始化
  else return nil;//循环结束
  if n then//for i,v in 方式，返回对应I,v的值
    return array(findex,data[findex])
  else//for i in 方式，返回对应I的值
   return findex;
 end;
end;
```
打印结果：
For in table---------
0->A
1->B
2->C
For in obj-一个变量---------
--for--:0 flag高位：0 flag低位：0
0
--for--:1 flag高位：0 flag低位：1
1
--for--:1 flag高位：0 flag低位：1
2
--for--:1 flag高位：0 flag低位：1
For in obj-两个变量---------
--for--:2 flag高位：2 flag低位：0
0->A
--for--:3 flag高位：2 flag低位：1
1->B
--for--:3 flag高位：2 flag低位：1
2->C
--for--:3 flag高位：2 flag低位：1
解析：通过上面的过程可以看出，我们可以在对象中对for in操作进行重载实现，通过对flag的控制，可以实现每次循环过程中对对象的操作。
打印结果中，两个循环变量的循环中，高位值为2是因为代表二进制数值0b10，即二进制中高位为1。

---

## 34396 - ::,:.,mcell,mrow,mcol,mIndexCount,mIndex等算符在对象中的重载

::,:.,mcell,mrow,mcol,mIndexCount,mIndex等算符在对象中的重载    复制链接
定义：function operator KeyWord([p1[,p2[,…]]]);
说明：
Operator：为重载关键字
KeyWord：表示关键字函数，如::,:.,mcell,mrow,mcol,mIndexCount,mIndex等
p1,p2，…：函数参数列表。
其中，在::与:.遍历过程中，有一个参数，该参数为0时表示第一次循环，为1时表示非第一次循环。
循环过程中，返回0或nil表示循环结束，非0数字则表示循环继续。
重载示例（模拟相关算符与关键字在数组中的功能）：
type c1=class
public
```tsl
 data;
 Rdata;
 findex;
 lengtD;
 function create(v);
 begin
  data:=v;
 end;
 function operator ::(flag);//flag:0表示第一次循环；1表示非第一次循环 ，最多支持二维
 begin
  // echo "::flag ",flag;
  if not flag then //循环开始-初始化-第一次
  begin
    Rdata:=array();
    k:=0;
```
    data::begin
```tsl
      Rdata[k]:=array(mcell,mIndexCount,mrow,mcol);
      if mIndexCount>2 then for i:=2 to mIndexCount-1 do Rdata[k,i+2]:=mIndex(i);
      k++;
     end
    lengtD:=length(Rdata);
    findex:=0;
  end
  else if findex<lengtD-1 then findex++; //循环过程
  else return nil;//循环结束
  return 1;//返回0或nil循环结束，其它数值则循环继续
 end;
 function operator :.(flag);//flag:0表示第一次循环；1表示非第一次循环 ，深度遍历
 begin
 // echo ":.flag ",flag;
  if not flag then //循环开始-初始化-第一次
  begin
    Rdata:=array();
    k:=0;
```
    data:.begin
```tsl
      Rdata[k]:=array(mcell,mIndexCount,mrow,mcol);
      if mIndexCount>2 then for i:=2 to mIndexCount-1 do Rdata[k,i+2]:=mIndex(i);
      k++;
     end
    lengtD:=length(Rdata);
    findex:=0;
  end
  else if findex<lengtD-1 then findex++; //循环过程
  else return nil;//循环结束
  return 1;//返回0或nil循环结束，其它数值则循环继续
 end;
 function operator mcell();//单元值
 begin
  return Rdata[findex][0];
 end;
 function operator mIndexCount(); //维度数
 begin
  return Rdata[findex][1];
 end;
 function operator mrow();//单元行下标
 begin
  return Rdata[findex][2];
 end;
 function operator mcol();//单元列下标
 begin
  return Rdata[findex][3];
 end;
 function operator mIndex(n);//单元列下标
 begin
  if n<Rdata[findex][1] then
   return Rdata[findex][n+2];
  else raise "指定的维度超出最大维度数";
 end;
end;
```
调用示例：
```tsl
t:=array("A":0->3,"B":10->2,"C":20->21,"D":30->23);//不完全矩阵
 t["B",1]:=array(801,802,803); //多维矩阵
  obj:=new c1(t);
  echo "::遍历";
```
  obj::begin
```tsl
    s:="mcell:"$mcell$" mrow:"$mrow$" mcol:"$mcol$" mIndexCount:"$mIndexCount;
    for i:=0 to mIndexCount-1 do
     s+=" mIndex("$i$"):"$mIndex(0);
    echo s;
  end
  echo ":.深度遍历";
```
  obj:.begin
```tsl
    s:="mcell:"$mcell$" mrow:"$mrow$" mcol:"$mcol$" mIndexCount:"$mIndexCount;
    for i:=0 to mIndexCount-1 do
     s+=" mIndex("$i$"):"$mIndex(0);
    echo s;
  end
  return 1;
```
打印结果：
::遍历
```tsl
mcell:0 mrow:A mcol:0 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:1 mrow:A mcol:1 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:2 mrow:A mcol:2 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:3 mrow:A mcol:3 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell: mrow:B mcol:1 mIndexCount:2 mIndex(0):B mIndex(1):B
mcell:20 mrow:C mcol:0 mIndexCount:2 mIndex(0):C mIndex(1):C
mcell:21 mrow:C mcol:1 mIndexCount:2 mIndex(0):C mIndex(1):C
```
:.深度遍历
```tsl
mcell:0 mrow:A mcol:0 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:1 mrow:A mcol:1 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:2 mrow:A mcol:2 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:3 mrow:A mcol:3 mIndexCount:2 mIndex(0):A mIndex(1):A
mcell:801 mrow:B mcol:1 mIndexCount:3 mIndex(0):B mIndex(1):B mIndex(2):B
mcell:802 mrow:B mcol:1 mIndexCount:3 mIndex(0):B mIndex(1):B mIndex(2):B
mcell:803 mrow:B mcol:1 mIndexCount:3 mIndex(0):B mIndex(1):B mIndex(2):B
mcell:20 mrow:C mcol:0 mIndexCount:2 mIndex(0):C mIndex(1):C
mcell:21 mrow:C mcol:1 mIndexCount:2 mIndex(0):C mIndex(1):C
```
---

## 34453 - 平台模型远程调用客户端函数，访问客户端的资源

平台模型远程调用客户端函数，访问客户端的资源    复制链接
  我们在使用平台模型的时候，经常有需要要访问客户端本地资源。打个比方，我们需要导出计算的数据，而等待整个模型的返回特别长，所以可能我们需要边运行，边导出数据。又或者整个的数据结果集非常大，无法单次返回，需要分开成小结果集运行时导出到客户端，而导出数据可以通过ExecSql输出到数据库，也可以是通过ExportFile来导出文件，我们还可以通过WriteFile等文件读写函数来直接操作文件。以及通过封装好的系统或者用户写的TSL函数。
  平台提供了两个关键字RDo和RDo2来解决这个问题。RDo和RDo2可以在平台运行模型的时候远端调用客户端的函数运行。
例如：我们在运行的时候要导出一组股票的交易明细数据到客户机上。
```tsl
Stks:=GetBK("深证A股;上证A股");
Day:=Today();
for i:=0 to length(Stks)-1 do
begin
 SetSysParam(pn_Stock(),Stks[i]);
 if not isTradeDay(Day) then continue;//如果没有交易则下一个
 Data:=select DateTimeToStr(["date"]) as "Time",["close"],["vol"] from tradetable DateKey Day to Day+1 of Stks[i] where ["vol"]>0 end; //取出时间，收盘价，成交量
 RDo2 ExportFile(ftCSV(),"","C:\\DataStore\\"+IntToStr(DateToInt(Day))+"\\"+Stks[i]+".csv",Data);//导出数据
end;
```
  以上代码为将上证和深证A股的当天的交易明细导出到本地。ExportFile是一个导出的函数，但是在平台上运行的时候导出到的位置是在服务器上，而且需要在服务器上设置权限。而用RDo2则使导出命令在客户端上运行，所以输出会在客户端本地。
  由于要对本地文件进行读写，或者调用本地的其他资源，终端为了安全起见，默认禁止了这类远端调用，于是系统左上角会出现如下界面：
  系统还会终止模型的运行并且返回出错信息。
  用户可以通过菜单进入系统设置，也可以点击进入系统信任中心，界面如下：
  信任中心的初始是最高安全性，禁止了远程模型对本地资源的访问。如果我们只需要导出数据到本地或者执行本地的数据库查询语句，那么我们可以选择高安全性，高安全性允许RDO/RDO2执行的函数是ExportFile和ExecSQL。
  如果我们还需要从本地导入数据，调用ImportFile函数，则应该设置为中安全性。低安全性则是允许RDo/RDo2调用任何本地函数。而最低安全性则还允许使用SendToClient函数用”do”或者”getdo”命令组成命令串执行，这就可以不需要把命令串封装成函数来执行。
  如果信任中心拒绝了调用，系统会自动禁止该调用，并且会有一个禁止掉的提示小窗口。而当信任中心允许调用的时候，如果用户没有进行许可设置，系统依旧会对远程模型的本地资源调用进行安全提示。
  我们可以信任某个用户来源的所有的函数的调用，也可以信任该来源函数的调用，还可以仅仅信任该调用（例如信任导出的调用必须导出的文件名都是一致的），我们还可以临时允许该调用或者拒绝该调用。这样下次当调用发生的时候，该信任管理窗口依旧会出现。
  对于导入和导出的调用，还有一个信任路径的设置。当设置了信任路径以后，在该信任路径下以及该路径下的子目录下的所有导入/导出命令将会被允许而不再提示。
  无论是拒绝还是信任了，在运行信息中总是会显示收到的命令。此外，对于已经设置了信任的调用方式，如果用户需要修改，可以进入系统设置中，打开信任配置文件来修改INI文件，找到相应项目删除掉就可以了。
  RDo和RDo2的差异在于RDo2会返回函数的执行结果，因此RDo2是同步执行的方式，一定会等待客户端执行完毕才返回。而RDo则是不返回结果，直接把命令提交给客户端处理，至于执行的正确与否，RDo是不理会的，会出现模型执行完毕了，而客户端的命令仍然在排队执行的情况。
在绝大多数情况下，RDo2会更安全可靠，但是RDo的效率有时候会更高。但是平台会约束RDo送回到客户端的内容的带宽，并且系统也无法保障RDo的执行是否是正确的。
  而且有些函数是必须用RDo2的，例如ImportFile，因为不用RDo2，该调用毫无意义。而ExportFile,ExecSQL的调用，有点却不一定需要等待返回，所以也可以采用RDo，但是我们依旧推荐用户使用RDo2，除非用户确实需要使用RDo。
  如果RDo2所调用的函数使用了系统参数（客户端执行的函数并不多见），则可以使用With关键字把系统参数带进去。
例如A:=RDo2 LocalFunctionTest() with array("abcd":123,"bcd":234);
而LocalFunctiontest函数的内容则为:
Return GetSysParam("abcd")+GetSysParam("bcd");
则返回的结果是357
  RDo2调用的默认是300秒超时的，也就是说默认情况下当客户端未能在300秒内处理完请求（包括客户端无人响应确认），系统会抛出超时的异常。
  如果需要设置超时的时间，可以用TimeOut来设置超时，例如RDo2 ImportFile(ftCsv(),"","C:\\1.csv",Data) TimeOut 30; //调用ImportFile函数的超时时间为30秒。
参考：RDo,RDo2

---

## 34629 - 不定个数参数...

不定个数参数...    复制链接
简述
函数定义时支持最末尾以...支撑不定个数参数，并支持函数调用。
对于不定个数参数可以使用PARAMS来访问
可以在##函数指针、CALL调用中直接使用...进行传参，也可以在INVOKE等方式中使用调用类的方法等
定义：FunctionName([a,[b,[c......]]]...);
其中，a,b,c,表示已定义的参数，...表示不定个数的参数，不限个数，在调用时进行定义。
即支持定义如：FuncA(a,b,...)、FuncA(...)等。
支持将未定义参数的函数作为不定参数个数的函数。即定义FuncA()等同于定义FuncA(...)
调用时，根据输入的参数个数，按参数位置进行优先识别已定义的参数，多出来的则按顺序依次识别为不定个数参数。
不定个数参数组的传递：
在不定个数参数定义的函数中进行调用时，不定个数参数组可通过...在函数调用之间进行传递。
该功能在新一代TSL语言中支持。
在不定个数参数的函数实现中：
1、可通过params获得调用时所有输入参数的值，若通过params[i]进行访问时，下标i从1开始，当输入参数少于定义参数个数时，未输入的参数值为nil，不定个数参数在调用时确定。
2、可通过ParamCount返回定义的参数个数，逻辑同params。
3、可通过RealParamCount获得实际输入参数的个数，当输入参数少于定义参数个数时，返回的是实际输入参数的个数。
如，封装不定参数个数函数FuncB(a,b,c,...)，如下：
```tsl
Function FuncB(a,b,c,...);
begin
  echo "所有参数值：",tostn(Params);
  echo "定义的参数个数：",ParamCount;
  echo "实际的参数个数：",RealParamCount;
  return ;
end;
```
执行调用少于定义个数参数时：
FuncB(1);
打印结果如下：ParamCount>RealParamCount,Params获取到的未被输入的参数值为nil
所有参数值：
array(1,NIL,NIL)
定义的参数个数：3
实际的参数个数：1
执行调用多于定义个数参数时：
FuncB(1,2,3,4,5);
打印结果如下：ParamCount=RealParamCount,Params获取到所有参数值
所有参数值：
array(1,2,3,4,5)
定义的参数个数：5
实际的参数个数：5
范例
范例01：实现doSum(a,b,c,…)多个数据求和的功能
```tsl
//封装函数
Function doSum(a,...); //…指定不定参数
begin
  s:=0;
  for i,v in params do
   s+=v;
  return s;
end;
//调用
return doSum(1,2,3,4);
```
返回：10
范例02：通过不定个数参数给子函数传参
```tsl
//封装函数：
Function AAA(a,b,c,d);//展示各参数的值
begin
  return (b+c+d)/a;
end;
Function BBB(a,b,...);
begin
  c:=a+b;
  return AAA(c,...);
end;
//调用
return BBB(1,2,3,4,5);
```
返回：4
解析：函数中参数的传递按顺序解读，上面示例中即为(3+4+5)/(1+2)最终结果为4。
范例03：不定个数参数在执行不定函数中的应用+ call方式
```tsl
//封装函数实现统一接口执行含有不同参数的函数
Function doFunc(fc,...); //fc:为函数名或函数指针
begin
  return call(fc,...);
end;
//调用如下：
 return doFunc("StockName",'SZ000002');//返回：” 万 科Ａ”
 return doFunc("FormatFloatExt",101.4567,3);//返回：“101.457”
//或用下面这种调用方式，效果一样：
 return doFunc(thisfunction(stockname), 'SZ000002');
```
范例04：…支持在##方式中调用
注：与范例03的区别在于，##调用必须是函数指针，而非函数名字符串，可通过thisfunction(functioname)方式获取。
```tsl
//封装函数doFunc2，通过函数指针方式调用函数
Function doFunc2(fc,...); //fc:为函数指针
begin
  return ##fc(...);
end;
//调用
return doFunc2(thisfunction(stockname),'SZ000002'); //返回：” 万 科Ａ”
```
范例05：不定个数参数在类中方法的应用示例
//封装类testC
type testC=class()
public
```tsl
  function fcA(a,b,c);
  begin
   return a+b+c;
  end;
  function fcB(a,b,c);
  begin
   return a$b$c;
  end;
  function gg(f,...);
  begin
    if f="Int" then
     r:=fcA(...);
    else r:=fcB(...);
    return r;
  end;
end;
//调用：
obj:=new testC();
echo obj.gg("Int",2,20,200);
echo obj.gg("Str",2,20,200);
```
打印结果为：
222
220200
拓展：不定个数参数…在invoke中的使用示例，在上面示例的基础上，再封装模型设用该类的任意方法，如实现如下：
```tsl
Function doTestCFuc(fcName,...);
begin
  obj:=new testC();
  return invoke(obj,fcName,0,...);
  //return Invokeinarray(obj,fcName,0,...);
end;
//调用：
return doTestCFuc('gg',"Int",2,20,200);
```
返回结果为：222

---

## 34734 - 面向对象的Operator算符重载支持++,--,+=,-=

面向对象的Operator算符重载支持++,--,+=,-=    复制链接
简述
面向对象的Operator算符重载支持++,--,+=,-=，
实现示例如：
type bb=class
 data;
 public
```tsl
 function create(v);
 begin
   data:=v;
 end;
 function operator++(v);
 begin
   if v=0 then//d:=obj++;时
   begin
      r:= new bb();
      r.data:=data;
      r.data++;
      return r;
    end //其它情况下，都是++后的状态
    else data++;
  end;
  function operator--(v);
  begin
    if v=0 then
    begin
      r:= new bb();
      r.data:=data;
      r.data--;
      return r;
    end
    else data--;
  end;
  function operator+=(v);
  begin
    data+=v;
  end;
  function operator-=(v);
  begin
    data-=v;
  end;
end;
```
调用测试：
```tsl
t:=array(1,2,3,999,5);
 b:=new bb(t);
```
 ++b;//自加
```tsl
 echo "++b后：";
 echo "b.data: ",tostn(b.data);
 c:=b++;
 echo "c:=b++;后：";
 echo "c.data: ",tostn(c.data);
 echo "b.data:",tostn(b.data);
```
打印结果如下：
++b后：
b.data:
array(2,3,4,1000,6)
c:=b++;后：
c.data:
array(2,3,4,1000,6)
b.data:
array(3,4,5,1001,7)

---

## 34737 - 对象[]重载时允许多级的应用示例

对象[]重载时允许多级的应用示例    复制链接
示例：对象中[]算符重载多级的实现示例
示例实现：实现对对象的数组成员变量进行访问与写入---支持多维
type aa=class
```tsl
 data;
 indList;
```
 public
```tsl
  function create(v);
  begin
   data:=v;
   indList:=array();
  end;
  function operator[0](index,s1); //[0]读操作，多级访问
  begin
 //s1<0时，最后一层
    indList[length(indList)]:=index;
    v:=data;
    for i,ind in indList do
     v:=v[ind];
    if s1<0 then begin
      indList:=array();
      return v;
    end
    else
      return self; //返回对象
  end;
  function operator[1](index,v);//[1]写操作，
  begin
    indList[length(indList)]:=index;
    if ifnone(v) then return self; //返回对象，存在多级
    sv:='data';
    for i,ind in indList do
     if ifstring(ind) then sv+="['"+ind+"']";
     else sv+="["$ind$"]";
    sv+=":=v;";
    eval(&sv);
    indList:=array();
  end;
end;
```
调用测试：
```tsl
  t:=array(("A":1,"B":2,"C":3),("A":11,"B":22,"C":33));
  a:=new aa(t);
  echo a[0,"B"];
  a[1,"C"]:=999;
  echo tostn(a.data);
```
打印结果：
2
array(
```tsl
("A":1,"B":2,"C":3),
("A":11,"B":22,"C":999))
```
---

## 34738 - 对象算符重载数组set算符时none类型的应用实例

对象算符重载数组set算符时none类型的应用实例    复制链接
例如，实现一个资金流入流出的账单记录，当对历史记录进行篡改时，会引发赋值出错，进行数据回滚处理。如此来展示对象算符重载数组set算符时，ifnone(v,i)等功能的作用
//资金出入的联动实现，行标下只能依次递增，否则报错回滚
Type DepositMoney = class()
  FMoneyMX;
  FlastR; //上行
  FnewR; //当前行
```tsl
  function create(v);
  begin
    FMoneyMX:=array();
    FMoneyMX[0]["时间"] := datetimetostr(now());//初始资产
    FMoneyMX[0]["当前余额"] := v;//初始资产
    FMoneyMX[0]["出金"] := 0;//
    FMoneyMX[0]["入金"] := 0;//
    FlastR:=-1;
    FnewR:=0;
  end
  function operator[1](idx,v); //设置值
  begin
   // echo "Idx->",idx," v->",v;
 //当赋值出错时，进入该过程，进行回滚
    if ifnone(v,-1) then//none类型，且none整数位为-1
    begin
    //回滚到上一次的状态
      FMoneyMX:=FMoneyMX[0:FlastR];
      FnewR:=FlastR;
      FlastR:=FlastR-1;
      echo "发生错误-回滚到变更前状态：",tostn(FMoneyMX);
      return "Erro";
    end;
    if ifnone(v) then //中间层级
    begin
     // echo "getnone(v)->",getnone(v);//当前级别
     if getnone(v)=0 then begin //第一层
       FlastR:=FnewR;
       FnewR:=idx;
       FMoneyMX[idx,"时间"]:=datetimetostr(now());
       if FnewR<FlastR+1 then raise "不能对历史数据进行修改，当前最新行标："$FlastR;
       return self;
      end
      else raise "只支持二维数组";
    end
    if idx="出金" then
    begin
     FMoneyMX[FnewR]["当前余额"]:= FMoneyMX[FlastR]["当前余额"]-v;
     FMoneyMX[FnewR]["出金"]:= v;
     FMoneyMX[FnewR]["入金"]:= 0;
    end
    else if idx="入金" then
    begin
     FMoneyMX[FnewR]["当前余额"]:= FMoneyMX[FlastR]["当前余额"]+v;
     FMoneyMX[FnewR]["出金"]:= 0;
     FMoneyMX[FnewR]["入金"]:= v;
    end
  end
  function destroy();
  begin
    FMoneyMX := nil;
    FlastR := nil;
    FnewR :=nil;
  end
end
```
调用测试：
```tsl
//--事务示例
  obj:=new DepositMoney(100);
  sleep(1*1000);
  obj[1]["入金"]:=888;
  echo "入金888->",tostn(obj.FMoneyMX);
  sleep(1*1000);
  obj[2]["出金"]:=200;
  echo "出金200->",tostn(obj.FMoneyMX);
  sleep(1*1000);
  obj[2]["出金"]:=100; //此时变动下标应该是3，指定2会引发set出现，数据会进行回滚
  echo "出金100->",tostn(obj.FMoneyMX);
  return obj.FMoneyMX;
执行报错后，打印结果如下：（在 obj[2]["出金"]:=100;时触发出错逻辑，数据回到赋值之前的状态）
```
入金888->
array(
```tsl
("时间":"2025-08-12 17:55:40","当前余额":100,"出金":0,"入金":0),
("时间":"2025-08-12 17:55:41","当前余额":988,"出金":0,"入金":888))
```
出金200->
array(
```tsl
("时间":"2025-08-12 17:55:40","当前余额":100,"出金":0,"入金":0),
("时间":"2025-08-12 17:55:41","当前余额":988,"出金":0,"入金":888),
("时间":"2025-08-12 17:55:42","当前余额":788,"出金":200,"入金":0))
```
出金100->
发生错误-回滚到变更前状态：
array(
```tsl
("时间":"2025-08-12 17:55:40","当前余额":100,"出金":0,"入金":0),
("时间":"2025-08-12 17:55:41","当前余额":988,"出金":0,"入金":888),
("时间":"2025-08-12 17:55:43","当前余额":788,"出金":200,"入金":0))
```
---

## 34857 - IF表达式

IF表达式    复制链接
if表达式是一种条件表达式，它根据条件的真假来返回不同的值。它与if语句不同：
if语句：是一种控制流语句，用于决定是否执行某段代码块，本身不返回值。
if表达式：会计算一个结果，这个结果可以赋值给变量、作为函数参数或在其他表达式中使用。功能类似三元运算符，但if表达式更通用，可读性更高
其基本形式通常如下：
if 条件 then 值1 else 值2
例如 if a>1 then 2 else 1，如果a大于1，整个表达式的结果就是2，否则是1。
if表达式必须存在else部分，主要是为了确保表达式始终有确定的返回值。如果没有else，当条件为假时，表达式的返回值将是不确定的。
注：仅2025-08-27以后的语言版本支持此功能
示例：
```tsl
ret:=if x>0 then x*x else 0;
return ret;
```
当x>0，返回x*x；x<=0时，返回0。
```tsl
//多个分支
ret:=if x>0 then x*x else if x<0 then -(x*x) else 0;
return ret;
```
当x>0，返回x*x；x<0时，返回-x*x；x=0，返回0。

---

## 34860 - Not Like

Not Like    复制链接
2025/8月版本开始，TSL语言中支持NOT LIKE， 这样not(a like b)可以简单写成a not like b
Not Like 是与FAQ：LIKE相对应的模式匹配操作符，两者语法结构相似但逻辑功能完全相反。
字符串中的Not Like
Not Like 可用于判断某个字符串是否不符合指定的模式规则，当且仅当字符串与给定模式不匹配时返回True。
例如:
```tsl
if a not like "\\d{4}-\\d{2}-\\d{2}" then
begin
  return "a不包含'YYYY-MM-DD'格式日期字符串";
end
else return "包含'YYYY-MM-DD'格式";
```
数值中的Not Like
Not Like 可用于判断某个数值是否和指定值相似，当且仅当数值与给定模式不相似时返回True。
例如1.000001 not like 1为False。
计算方法和FAQ：LIKE类似，可参考其中的介绍。

---

## 34867 - 网格计算设置任务超时时间

网格计算设置任务超时时间    复制链接
网格调用时可通过设置timeout N对该子进程进行设置超时时间，若网格运行的程序运行时间超过该设置时间（单位：毫秒），则程序进行报错。
如有网格运行目标程序：
```tsl
Function testdo();
begin
  sleep(10*1000);
  return getsysparam(pn_stock());
end;
```
在网格中设置超时间为3秒，调用如下：
```tsl
  r:=# testDo() timeout 3000;
  t:=dupvalue(r);
  return t;
```
在网格中通过with传入系统参数的同时设置超时间为3秒，调用如下：
```tsl
  r:=# testDo() with array(pn_stock():"SZ000002") timeout 3000;
  t:=dupvalue(r);
  return t;
```
超时报错Grid timeout,示例如下：

---

## 34884 - 单元中的类-应用实例

单元中的类-应用实例    复制链接
现有日期相关单元TD_DateUnit，单元中包含类TD_DateClass、IntDate、StrDate。
Unit TD_DateUnit;
Interface
Type TD_DateClass=class()//父类
  value; //天软日期
```tsl
  Function create(v);
  begin
    value := isDate(v)?v:0;
  end;
  function isDate();overload;
  begin
    return isDate(value);
  end
```
  class Function isDate(v);overload; //是否是一个日期
  begin
    try
```tsl
      y := yearof(v);
      m := monthof(v);
      d := dayof(v);
      return isValidDate(y,m,d);
```
    except
```tsl
      return 0;
    end;
  end;
  //--整型-日期
```
  Type IntDate=class(TD_DateClass)//内部类，继承父类
    iDate;//对应的整数日期
```tsl
    Function create(v);
    begin
      iDate:=_datetoint(v);
      value:=inttodate(iDate);
    end;
    function _datetoint();overload;
    begin
      return iDate;
    end
    class Function _datetoint(v);overload;
    begin
      if ifstring(v)then
      begin
        _iDate := datetoint(strtodate(v));
      end else
      if v<99999 then
      begin
        isd := isDate(v);
        _iDate := isd?datetoint(v):v;
      end
      else _iDate:=Int(v);
      return _iDate;
    end
  end;
  //--字符串-日期
```
  Type StrDate=class()//内部类，不继承父类
    value;//天软日期
    sDate;//对应的字符串日期
```tsl
    Function create(v);
    begin
      sDate:=_datetostr(v);
      value:=strtodate(sDate);
    end;
```
    class Function _datetostr(v)
```tsl
    begin
      obj := new IntDate(v);
      _sDate := datetostr(obj.value);
      return _sDate;
    end
    Function formatS(f); //按指定符号生成字符串日期
    begin
      fs := "yyyy"+f+"mm"+f+"dd";
      return FormatDateTime(fs,value);
    end;
  end;
End;
```
Implementation
Initialization
Finalization End.
使用示例
  dateClass:=findclass("TD_DateUnit.TD_DateClass");
  echo dateClass.isDate(20250912T);//天软日期，返回值：1
  echo dateClass.isDate("2025-09-12");//字符串日期，返回值：0
```tsl
  //现有如下日期
  endt:=20250912T;
  //通过intDate类，转换成整数日期
  obj:=new TD_DateUnit.TD_DateClass.intDate(endt);
```
  echo obj.iDate;//返回值：20250912
  echo obj._datetoint("2025-09-12");//返回值：20250912
```tsl
  //通过strDate类，转换成整数日期
  obj:=new TD_DateUnit.TD_DateClass.strDate(endt);
```
  echo obj.sDate;//返回值：2025-09-12
  echo obj._datetoStr(20250912);//返回值：2025-09-12
  echo obj.formatS(".");//返回值：2025.09.12
  return 1;
打印结果如下：

---

## 35807 - const常量成员

const常量成员    复制链接
常量成员定义的值可以是一个常数也可以是常量参与的计算。具体定义与支持的运算符可参考常量及常量成员的定义与初始化
【常量成员定义】
Type C=class
 Const a="Hello"; //可以在声明中进行定义初始化
```tsl
 Const b=a+"Tinysoft";
 C=a+b+"from TSL";
End;
```
【使用范围】
1、成员函数使用
2、成员函数缺省参数使用
3、子类使用
4、通过实例访问
5、通过类访问静态常量成员
示例：
Type C=class
 public
 const mA=1;   //定义一个常量成员
 static const mB=mA+10; //允许静态成员常量
```tsl
 function TestConst();
 begin
```
  echo mA+mB,"\r\n"; //允许在成员函数中使用
```tsl
 end;
 function TestConstInParam(b=mB); //允许在缺省参数值中使用
 begin
  echo b,"\r\n";
 end;
End;
```
调用：
```tsl
 Cinstance:=New C();
 Cinstance.TestConst();
 Cinstance.TestConstInParam();
 echo Cinstance.mA,"\r\n";
 echo class(C).mB,"\r\n";
```
打印结果：
12
11
1
11
