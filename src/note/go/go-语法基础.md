---
# 这是文章的标题
title: go语法基础
# 你可以自定义封面图片
cover: /assets/images/cover1.jpg
# 这是页面的图标
icon: file
# 这是侧边栏的顺序
order: 3
# 设置作者
author: HotMilk
# 设置写作时间
date: 2024-07-15
# 一个页面可以有多个分类

category:
  - Go
# 一个页面可以有多个标签

tag:
  - go语法基础

# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权


---

go-语法

<!-- more -->

# 语法注意事项

（1）源文件以"go"为扩展名。
（2）程序的执行入口是main()函数。
（3）严格区分大小写。
（4）方法由一条条语句构成，每个语句后不需要分号(Go语言会在每行后自动加分号)，这也体现出Golang的简洁性。
（5）Go编译器是一行行进行编译的，因此我们一行就写一条语句，不能把多条语句写在同一个，否则报错
（6）定义的变量或者import的包如果没有使用到，代码不能编译通过。
（7）大括号都是成对出现的，缺一不可

# API


Go语言提供了大量的标准库，因此 google 公司也为这些标准库提供了相应的API文档，用于告诉开发者如何使用这些标准库，以及标准库包含的方法。官方位置：https://golang.org

Golang中文网在线标准库文档: https://studygolang.com/pkgdoc

![image-20240720193943393](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407201939493.png)

函数对应的源码查看：

![image-20240720193959648](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407201939719.png)

也可以使用离线API：



# 变量定义

变量的使用步骤：
1.声明
2.赋值
3.使用 

## 1.1 声明变量

var 名称 类型 是声明单个变量的语法。

> 以字母或下划线开头，由一个或多个字母、数字、下划线组成

声明一个变量

第一种，指定变量类型，声明后若不赋值，使用默认值

```go
var name type
name = value
```

第二种，根据值自行判定变量类型(类型推断Type inference)

如果一个变量有一个初始值，Go将自动能够使用初始值来推断该变量的类型。因此，如果变量具有初始值，则可以省略变量声明中的类型。

```go
var name = value
```

第三种，省略var, 声明并赋值，请注意此处声明了变量，所以不能对已经声明的变量再次声明。这个方式不能用于全局变量，全局变量请使用var。

```go
name := value

// 例如
var a int = 10
var b = 10
c : = 10
b: = 10 //前面已经声明了b变量，所以此处会报错。
```

> 这种方式它只能被用在函数体内，而不可以用于全局变量的声明与赋值

示例代码：

```go
package main
var a = "Hello"
var b string = "World"
var c bool

func main(){
    println(a, b, c)
}
```

运行结果：

```go
Hello World false
```

##  1.2 多变量声明

第一种，以逗号分隔，声明与赋值分开，若不赋值，存在默认值

```go
var name1, name2, name3 type
name1, name2, name3 = v1, v2, v3
```

第二种，直接赋值，下面的变量类型可以是不同的类型

```go
var name1, name2, name3 = v1, v2, v3
```

第三种，集合类型

```go
var (
    name1 type1
    name2 type2
)
```

## 1.3 注意事项

- 变量必须先定义才能使用
- go语言是静态语言，要求变量的类型和赋值的类型必须一致。
- 变量名不能冲突。(同一个作用于域内不能冲突)
- 简短定义方式，左边的变量名至少有一个是新的
- 简短定义方式，不能定义全局变量。
- 变量的零值。也叫默认值。
- 变量定义了就要使用，否则无法通过编译。

如果在相同的代码块中，我们不可以再次对于相同名称的变量使用初始化声明，例如：a := 20 就是不被允许的，编译器会提示错误 no new variables on left side of :=，但是 a = 20 是可以的，因为这是给相同的变量赋予一个新的值。

如果你在定义变量 a 之前使用它，则会得到编译错误 undefined: a。如果你声明了一个局部变量却没有在相同的代码块中使用它，同样会得到编译错误，例如下面这个例子当中的变量 a：

```go
func main() {
   var a string = "abc"
   fmt.Println("hello, world")
}
```

尝试编译这段代码将得到错误 a declared and not used

此外，单纯地给 a 赋值也是不够的，这个值必须被使用，所以使用

在同一个作用域中，已存在同名的变量，则之后的声明初始化，则退化为赋值操作。但这个前提是，最少要有一个新的变量被定义，且在同一作用域，例如，下面的y就是新定义的变量

```go
package main

import (
	"fmt"
)

func main() {
	x := 140
	fmt.Println(&x)
	x, y := 200, "abc"
	fmt.Println(&x, x)
	fmt.Print(y)
}
```

运行结果：

```go
0xc04200a2b0
0xc04200a2b0 200
abc
```



## 常量constant

### 1.1 常量声明

常量是一个简单值的标识符，在程序运行时，不会被修改的量。

```go
const identifier [type] = value
显式类型定义： const b string = "abc"
隐式类型定义： const b = "abc"
package main

import "fmt"

func main() {
   const LENGTH int = 10
   const WIDTH int = 5   
   var area int
   const a, b, c = 1, false, "str" //多重赋值

   area = LENGTH * WIDTH
   fmt.Printf("面积为 : %d", area)
   println()
   println(a, b, c)   
}
```

运行结果：

```go
面积为 : 50
1 false str
```

常量可以作为枚举，常量组

```go
const (
    Unknown = 0
    Female = 1
    Male = 2
)
```

常量组中如不指定类型和初始化值，则与上一行非空常量右值相同

```go
package main

import (
	"fmt"
)

func main() {
	const (
		x uint16 = 16
		y
		s = "abc"
		z
	)
	fmt.Printf("%T,%v\n", y, y)
	fmt.Printf("%T,%v\n", z, z)
}
```

运行结果：

```go
uint16,16
string,abc
```

常量的注意事项：

- 常量中的数据类型只可以是布尔型、数字型（整数型、浮点型和复数）和字符串型
- 不曾使用的常量，在编译的时候，是不会报错的
- 显示指定类型的时候，必须确保常量左右值类型一致，需要时可做显示类型转换。这与变量就不一样了，变量是可以是不同的类型值

### 1.2 iota

iota，特殊常量，可以认为是一个可以被编译器修改的常量

iota 可以被用作枚举值：

```go
const (
    a = iota
    b = iota
    c = iota
)
```

第一个 iota 等于 0，每当 iota 在新的一行被使用时，它的值都会自动加 1；所以 a=0, b=1, c=2 可以简写为如下形式：

```go
const (
    a = iota
    b
    c
)
```

**iota 用法**

```go
package main

import "fmt"

func main() {
    const (
            a = iota   //0
            b          //1
            c          //2
            d = "ha"   //独立值，iota += 1
            e          //"ha"   iota += 1
            f = 100    //iota +=1
            g          //100  iota +=1
            h = iota   //7,恢复计数
            i          //8
    )
    fmt.Println(a,b,c,d,e,f,g,h,i)
}
```

运行结果：

```
0 1 2 ha ha 100 100 7 8
```

如果中断iota自增，则必须显式恢复。且后续自增值按行序递增

自增默认是int类型，可以自行进行显示指定类型

数字常量不会分配存储空间，无须像变量那样通过内存寻址来取值，因此无法获取地址

# 数据类型

![image-20240720205940115](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202059193.png)

整数类型

浮点类型

字符类型

布尔类型

字符串类型

基本数据类型的默认值

基本数据类型之间的转换

基本数据类型转为String

string转为基本数据类型

# 运算符



# 流程控制

程序的流程控制结构一共有三种：顺序结构，选择结构，循环结构。

顺序结构：从上向下，逐行执行。

选择结构：条件满足，某些代码才会执行。0-1次

 分支语句：if，switch，select

循环结构：条件满足，某些代码会被反复的执行多次。0-N次

 循环语句：for

# 二、条件语句

## 2.1 if 语句

语法格式：

```go
if 布尔表达式 {
   /* 在布尔表达式为 true 时执行 */
}
if 布尔表达式 {
   /* 在布尔表达式为 true 时执行 */
} else {
  /* 在布尔表达式为 false 时执行 */
}
if 布尔表达式1 {
   /* 在布尔表达式1为 true 时执行 */
} else if 布尔表达式2{
   /* 在布尔表达式1为 false ,布尔表达式2为true时执行 */
} else{
   /* 在上面两个布尔表达式都为false时，执行*/
}
```

示例代码：

```go
package main

import "fmt"

func main() {
   /* 定义局部变量 */
   var a int = 10
 
   /* 使用 if 语句判断布尔表达式 */
   if a < 20 {
       /* 如果条件为 true 则执行以下语句 */
       fmt.Printf("a 小于 20\n" )
   }
   fmt.Printf("a 的值为 : %d\n", a)
}
```

## 2.2 if 变体

如果其中包含一个可选的语句组件(在评估条件之前执行)，则还有一个变体。它的语法是

```go
if statement; condition {  
}

if condition{
    
    
}
```

示例代码：

```go
package main

import (  
    "fmt"
)

func main() {  
    if num := 10; num % 2 == 0 { //checks if number is even
        fmt.Println(num,"is even") 
    }  else {
        fmt.Println(num,"is odd")
    }
}
```

> 需要注意的是，num的定义在if里，那么只能够在该if..else语句块中使用，否则编译器会报错的。

## 2.3 switch语句：“开关”

switch是一个条件语句，它计算表达式并将其与可能匹配的列表进行比较，并根据匹配执行代码块。它可以被认为是一种惯用的方式来写多个if else子句。

switch 语句用于基于不同条件执行不同动作，每一个 case 分支都是唯一的，从上直下逐一测试，直到匹配为止。 switch 语句执行的过程从上至下，直到找到匹配项，匹配项后面也不需要再加break。

而如果switch没有表达式，它会匹配true

Go里面switch默认相当于每个case最后带有break，匹配成功后不会自动向下执行其他case，而是跳出整个switch, 但是可以使用fallthrough强制执行后面的case代码。

变量 var1 可以是任何类型，而 val1 和 val2 则可以是同类型的任意值。类型不被局限于常量或整数，但必须是相同的类型；或者最终结果为相同类型的表达式。 您可以**同时测试多个可能符合条件的值，使用逗号分割它们**，例如：case val1, val2, val3。

```go
switch var1 {
    case val1:
        ...
    case val2:
        ...
    default:
        ...
}
```

示例代码：

```go
package main

import "fmt"

func main() {
   /* 定义局部变量 */
   var grade string = "B"
   var marks int = 90

   switch marks {
      case 90: grade = "A"
      case 80: grade = "B"
      case 50,60,70 : grade = "C"  //case 后可以由多个数值
      default: grade = "D"  
   }

   switch {
      case grade == "A" :
         fmt.Printf("优秀!\n" )     
      case grade == "B", grade == "C" :
         fmt.Printf("良好\n" )      
      case grade == "D" :
         fmt.Printf("及格\n" )      
      case grade == "F":
         fmt.Printf("不及格\n" )
      default:
         fmt.Printf("差\n" );
   }
   fmt.Printf("你的等级是 %s\n", grade );      
}
```

## 2.4 fallthrough

如需贯通后续的case，就添加fallthrough

```go
package main

import (
	"fmt"
)

type data [2]int

func main() {
	switch x := 5; x {
	default:
		fmt.Println(x)
	case 5:
		x += 10
		fmt.Println(x)
		fallthrough
	case 6:
		x += 20
		fmt.Println(x)

	}

}
```

运行结果：

```go
15
35
```

case中的表达式是可选的，可以省略。如果该表达式被省略，则被认为是switch true，并且每个case表达式都被计算为true，并执行相应的代码块。

示例代码：

```go
package main

import (  
    "fmt"
)

func main() {  
    num := 75
    switch { // expression is omitted
    case num >= 0 && num <= 50:
        fmt.Println("num is greater than 0 and less than 50")
    case num >= 51 && num <= 100:
        fmt.Println("num is greater than 51 and less than 100")
    case num >= 101:
        fmt.Println("num is greater than 100")
    }

}
```

> switch的注意事项
>
> 1. case后的常量值不能重复
> 2. case后可以有多个常量值
> 3. fallthrough应该是某个case的最后一行。如果它出现在中间的某个地方，编译器就会抛出错误。

## 2.5 Type Switch

switch 语句还可以被用于 type-switch 来判断某个 interface 变量中实际存储的变量类型。

```go
switch x.(type){
    case type:
       statement(s);      
    case type:
       statement(s); 
    /* 你可以定义任意个数的case */
    default: /* 可选 */
       statement(s);
}
package main

import "fmt"

func main() {
   var x interface{}
     
   switch i := x.(type) {
      case nil:	  
         fmt.Printf(" x 的类型 :%T",i)                
      case int:	  
         fmt.Printf("x 是 int 型")                       
      case float64:
         fmt.Printf("x 是 float64 型")           
      case func(int) float64:
         fmt.Printf("x 是 func(int) 型")                      
      case bool, string:
         fmt.Printf("x 是 bool 或 string 型" )       
      default:
         fmt.Printf("未知型")     
   }   
}
```

运行结果：

```go
x 的类型 :<nil>
```













# 函数



# 错误处理



# 数组



# 切片



# 映射



# 面向对象



# 键盘输入输出

## 一、打印输出

### 1.1 fmt包

fmt包实现了类似C语言printf和scanf的格式化I/O。格式化verb（'verb'）源自C语言但更简单。

详见官网fmt的API：https://golang.google.cn/pkg/fmt/

![image-20240720210834530](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202108620.png)

### 1.2 导入包

```go
import "fmt"
```

### 1.3 常用打印函数

**打印：**

[func Print(a ...interface{}) (n int, err error)](https://golang.google.cn/pkg/fmt/#Print)

**格式化打印：**

[func Printf(format string, a ...interface{}) (n int, err error)](https://golang.google.cn/pkg/fmt/#Printf)

**打印后换行**

[func Println(a ...interface{}) (n int, err error)](https://golang.google.cn/pkg/fmt/#Println)

格式化打印中的常用占位符：

```
格式化打印占位符：
			%v,原样输出
			%T，打印类型
			%t,bool类型
			%s，字符串
			%f，浮点
			%d，10进制的整数
			%b，2进制的整数
			%o，8进制
			%x，%X，16进制
				%x：0-9，a-f
				%X：0-9，A-F
			%c，打印字符
			%p，打印地址
			。。。
```

示例代码：

```go
package main

import (
	"fmt"
)

func main() {
	a := 100           //int
	b := 3.14          //float64
	c := true          // bool
	d := "Hello World" //string
	e := `Ruby`        //string
	f := 'A'
	fmt.Printf("%T,%b\n", a, a)
	fmt.Printf("%T,%f\n", b, b)
	fmt.Printf("%T,%t\n", c, c)
	fmt.Printf("%T,%s\n", d, d)
	fmt.Printf("%T,%s\n", e, e)
	fmt.Printf("%T,%d,%c\n", f, f, f)
	fmt.Println("-----------------------")
	fmt.Printf("%v\n", a)
	fmt.Printf("%v\n", b)
	fmt.Printf("%v\n", c)
	fmt.Printf("%v\n", d)
	fmt.Printf("%v\n", e)
	fmt.Printf("%v\n", f)

}
```

运行结果：

![image-20240720210909087](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202109136.png)

## 二、键盘输入

### 2.1 fmt包读取键盘输入

常用方法：

[func Scan(a ...interface{}) (n int, err error)](https://golang.google.cn/pkg/fmt/#Scan)

[func Scanf(format string, a ...interface{}) (n int, err error)](https://golang.google.cn/pkg/fmt/#Scanf)

[func Scanln(a ...interface{}) (n int, err error)](https://golang.google.cn/pkg/fmt/#Scanln)

```go
package main

import (
	"fmt"
)

func main() {
	var x int
	var y float64
	fmt.Println("请输入一个整数，一个浮点类型：")
	fmt.Scanln(&x,&y)//读取键盘的输入，通过操作地址，赋值给x和y   阻塞式
	fmt.Printf("x的数值：%d，y的数值：%f\n",x,y)

	fmt.Scanf("%d,%f",&x,&y)
	fmt.Printf("x:%d,y:%f\n",x,y)
}
```

运行结果：

![image-20240720210930091](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202109140.png)

### 2.2 bufio包读取

https://golang.google.cn/pkg/bufio/

bufio包中都是IO操作的方法：

先创建Reader对象：

![image-20240720210942710](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202109787.png)

然后就可以各种读取了：

![image-20240720211002113](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202110189.png)

示例代码：

```go
package main

import (
	"fmt"
	"os"
	"bufio"
)

func main() {
	fmt.Println("请输入一个字符串：")
	reader := bufio.NewReader(os.Stdin)
	s1, _ := reader.ReadString('\n')
	fmt.Println("读到的数据：", s1)

}
```

运行效果：

![image-20240720211011947](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407202110995.png)





# 文件的操作







# 协程和管道





# 网络编程







# 反射

