---
# 这是文章的标题
title: Java虚拟机
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
  - JVM
# 一个页面可以有多个标签

tag:
  - jvm

# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权

---

Java 虚拟机

<!-- more -->

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806488.png)

Java Class

ClassLoader

# 一、Java内存结构

## 1.程序计数器

#### 1.1定义

Program Counter Register 程序计数器（寄存器） 作用：是记录下一条 jvm 指令的执行地址行号。 特点：

- 是线程私有的
- 不会存在内存溢出

```Java
0: getstatic #20 // PrintStream out = System.out;
3: astore_1 // --
4: aload_1 // out.println(1);
5: iconst_1 // --
6: invokevirtual #26 // --
9: aload_1 // out.println(2);
10: iconst_2 // --
11: invokevirtual #26 // --
14: aload_1 // out.println(3);
15: iconst_3 // --
16: invokevirtual #26 // --
19: aload_1 // out.println(4);
20: iconst_4 // --
21: invokevirtual #26 // --
24: aload_1 // out.println(5);
25: iconst_5 // --
26: invokevirtual #26 // --
29: return
```

- 解释器会解释指令为机器码交给 cpu 执行，程序计数器会记录下一条指令的地址行号，这样下一次解释器会从程序计数器拿到指令然后进行解释执行。
- 多线程的环境下，如果两个线程发生了上下文切换，那么程序计数器会记录线程下一行指令的地址行号，以便于接着往下执行。

## 2.虚拟机栈

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806323.png)

#### 2.1 定义

- 每个线程运行需要的内存空间，称为虚拟机栈
- 每个栈由多个栈帧（Frame）组成，对应着每次调用方法时所占用的内存
- 每个线程只能有一个活动栈帧，对应着当前正在执行的方法

```Java
public class main1 {
    public static void main(String[] args) {
        method1();
    }

    public static void method1() {
        method2(1, 2);
    }

    public static int method2(int a, int b) {
        int c = a + b;
        return c;
    }
}
```

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806481.png)

问题辨析：

1. 垃圾回收是否涉及栈内存？ 不会。栈内存是方法调用产生的，方法调用结束后会弹出栈。
2. 栈内存分配越大越好吗？ 不是。因为物理内存是一定的，栈内存越大，可以支持更多的递归调用，但是可执行的线程数就会越少。
3. 方法呢的局部变量是否线程安全
   1. 如果方法内部的变量没有逃离方法的作用范围，它是线程安全的
   2. 如果是局部变量引用了对象，并逃离了方法的范围，那就要考虑线程安全问题。

```Java
public class main1 {
    public static void main(String[] args) {

    }
    //下面各个方法会不会造成线程安全问题？

    //不会
    public static void m1() {
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        sb.append(2);
        sb.append(3);
        System.out.println(sb.toString());
    }

    //会，可能会有其他线程使用这个对象
    public static void m2(StringBuilder sb) {
        sb.append(1);
        sb.append(2);
        sb.append(3);
        System.out.println(sb.toString());
    }

    //会，其他线程可能会拿到这个线程的引用
    public static StringBuilder m3() {
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        sb.append(2);
        sb.append(3);
        return sb;
    }
    
}
```

#### 2.2 栈内存溢出

**`Java.lang.stackOverflowError`** 栈内存溢出

**导致栈****内存****溢出的情况**：

- **栈帧****过多**导致栈内存溢出
- **栈帧****过大**导致栈内存溢出

栈帧过大、过多、或者第三方类库操作，都有可能造成栈内存溢出 java.lang.stackOverflowError ，使用 -Xss256k 指定栈内存大小！

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806492.png)

**设置****虚拟机****栈****内存****大小**：

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806444.png)

#### 2.3 线程运行诊断

案例：CPU占用过高

Linux环境下运行某些程序的时候，可能导致CPU的占用过高，这时需要定位占用CPU过高的线程

- 用`top`定位哪个进程对cpu的占用过高
- `ps H -eo pid,tid,%cpu | grep 进程id` ，刚才通过top查到的进程号，用ps命令进一步定位是哪个线程引起的cpu占用过高
- `jstack 进程id`，通过查看进程中的线程的nid，刚才通过ps命令看到的tid来**对比定位**，注意jstack查找出的线程id是**16进制的**，**需要转换**

## 3.本地方法栈

一些带有**native关键字**的方法就是需要JAVA去调用本地的C或者C++方法，因为JAVA有时候没法直接和操作系统底层交互，所以需要用到本地方法。

## 4.堆

#### 4.1 定义

通过**new关键字创建的对象**都会使用堆内存

#### 4.2特点

- 它是**线程共享**的，堆中对象都需要考虑线程安全的问题
- 有垃圾回收机制

#### 4.3堆内存溢出

`java.lang.OutofMemoryError ：java heap space` 堆内存溢出

案例：

```Java
/**
 * 演示堆内存溢出 java.lang.OutOfMemoryError: Java heap space
 * -Xmx8m ，最大堆空间的jvm虚拟机参数，默认是4g
 */
public class main1 {
    public static void main(String[] args) {
        int i = 0;

        try {
            ArrayList<String> list = new ArrayList<>();// new 一个list 存入堆中
            String a = "hello";
            while (true) {
                list.add(a);// 不断地向list 中添加 a
                a = a + a;
                i++;
            }
        } catch (Throwable e) {// list 使用结束，被jc 垃圾回收
            e.printStackTrace();
            System.out.println(i);
        }
    }
}
```

结果：

```Java
java.lang.OutOfMemoryError: Java heap space
        at java.util.Arrays.copyOf(Arrays.java:3332)
        at java.lang.AbstractStringBuilder.ensureCapacityInternal(AbstractStringBuilder.java:124)
        at java.lang.AbstractStringBuilder.append(AbstractStringBuilder.java:448)
        at java.lang.StringBuilder.append(StringBuilder.java:136)
        at com.itcast.itheima.xpp.main1.main(main1.java:14)
22
```

#### 4.4堆内存诊断

1. **jps** **工具**

查看当前系统中有哪些 java 进程

1. **jmap 工具**

查看堆内存占用情况 `jmap - heap 进程id`

1. **jconsole 工具**

图形界面的，多功能的监测工具，可以连续监测

1. jvisualvm 工具

## 5.方法区

#### 5.1 定义

Java 虚拟机有一个在所有 Java 虚拟机线程之间共享的方法区域。方法区域类似于用于传统语言的编译代码的存储区域，或者类似于操作系统进程中的“文本”段。它存储每个类的结构，例如运行时常量池、字段和方法数据，以及方法和构造函数的代码，包括特殊方法，用于类和实例初始化以及接口初始化方法区域是在虚拟机启动时创建的。尽管方法区域在逻辑上是堆的一部分，但简单的实现可能不会选择垃圾收集或压缩它。此规范不强制指定方法区的位置或用于管理已编译代码的策略。方法区域可以具有固定的大小，或者可以根据计算的需要进行扩展，并且如果不需要更大的方法区域，则可以收缩。方法区域的内存不需要是连续的！

#### 5.2 组成

- **永久代**用的**堆内存**
- **元空间**用的**本地****内存**

Hotspot 虚拟机 jdk1.6 1.7 1.8 内存结构图

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806556.png)

#### 5.3 方法区内存溢出

- 1.8以前会导致**永久代**内存溢出`java.lang.OutOfMemoryError: PermGen space`
- 1.8以后会导致**元空间**内存溢出`java.lang.OutOfMemoryError: Metaspace`
- 1.8 之前会导致永久代内存溢出
  - 使用 -XX:MaxPermSize=8m 指定永久代内存大小
- 1.8 之后会导致元空间内存溢出
  - 使用 -XX:MaxMetaspaceSize=8m 指定元空间大小

```Java
/**
 * 演示元空间内存溢出:java.lang.OutOfMemoryError: Metaspace
 * -XX:MaxMetaspaceSize=8m
 */
public class main1 extends ClassLoader {//可以用来加载类的二进制字节码

    public static void main(String[] args) {
        int j = 0;
        try {
            main1 test = new main1();
            for (int i = 0; i < 10000; i++,j++) {
                //ClassWriter 作用是生产类的二进制字节码
                ClassWriter cw = new ClassWriter(0);
                //版本号，public，类名
                cw.visit(Opcodes.V1_8, Opcodes.ACC_PUBLIC, "Class" + i, null, "java/lang/Object", null);
                //返回 byte[]
                byte[] code = cw.toByteArray();
                //执行类的加载
                test.defineClass("Class" + i, code, 0, code.length);
            }
        } finally {
            System.out.println(j);
        }
    }
}
Exception in thread "main" java.lang.OutOfMemoryError: Metaspace
        at java.lang.ClassLoader.defineClass1(Native Method)
        at java.lang.ClassLoader.defineClass(ClassLoader.java:763)
        at java.lang.ClassLoader.defineClass(ClassLoader.java:642)
        at com.itcast.itheima.xpp.main1.main(main1.java:26)
4865

Process finished with exit code 1
```

#### 5.4 通过反编译来查看类的信息

- 获得对应类的.class文件，`javac xxx.java`
  - 在JDK对应的bin目录下运行cmd，**也可以在IDEA控制台输入**
  - ![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806505.png)

  - 输入 **javac** **对应类的绝对路径**
  - ```Java
    F:\JAVA\JDK8.0\bin>javac F:\Thread_study\src\com\nyima\JVM\day01\Main.java
    ```

  - 输入完成后，对应的目录下就会出现类的.class文件
- 在控制台输入 `javap -v 类的绝对路径`

```Plain
javap -v F:\Thread_study\src\com\nyima\JVM\day01\Main.class
```

- 然后能在控制台看到反编译以后类的信息了
  - 类的基本信息
  - ![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806336.png)

  - 常量池
  - ![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806606.png)

  - 虚拟机中执行编译的方法（框内的是真正编译执行的内容，**#号的内容需要在****常量池****中查找**）
  - ![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806528.png)

#### 5.5 运行时常量池

- **常量池**：就是一张表，虚拟机指令根据这张常量表找到要执行的类名、方法名、参数类型、字面量等信息
- **运行时常量池**：常量池是 *.class 文件中的，当该类被加载，它的常量池信息就会放入运行时常量池，并把里面的符号地址变为真实地址

#### 5.6 常量池与串池StringTable的关系

**StringTable 特性**

- 常量池中的字符串仅是符号，只有**在被用到时才会转化为对象**
- 利用串池的机制，来避免重复创建字符串对象
- 字符串**变量**拼接的原理是**StringBuilder**
- 字符串**常量**拼接的原理是**编译器优化**
- 可以使用**intern方法**，主动将串池中还没有的字符串对象放入串池中
  - 1.8 将这个字符串对象尝试放入串池，如果有则并不会放入，如果没有则放入串池，会把串池中的对象返回
  - 1.6 将这个字符串对象尝试放入串池，如果有则并不会放入，如果没有会把此对象复制一份，放入串池，会把串池中的对象返回

**栗子1**：

```Java
public class StringTableStudy {
        public static void main(String[] args) {
                String a = "a"; 
                String b = "b";
                String ab = "ab";
        }
}
```

常量池中的信息，都会被加载到运行时常量池中，但这是a b ab 仅是常量池中的符号，**还没有成为java字符串**

```Java
0: ldc           #2                  // String a
2: astore_1
3: ldc           #3                  // String b
5: astore_2
6: ldc           #4                  // String ab
8: astore_3
9: return
```

当执行到 ldc #2 时，会把符号 a 变为 “a” 字符串对象，**并放入串池中**（hashtable结构 不可扩容）

当执行到 ldc #3 时，会把符号 b 变为 “b” 字符串对象，并放入串池中

当执行到 ldc #4 时，会把符号 ab 变为 “ab” 字符串对象，并放入串池中

最终**StringTable [“a”, “b”, “****ab****”]**

**注意**：字符串对象的创建都是**懒惰的**，只有当运行到那一行字符串且在串池中不存在的时候（如 ldc #2）时，该字符串才会被创建并放入串池中。

**栗子2**：使用拼接**字符串****变量对象**创建字符串的过程

```Java
public class HelloWorld {
    public static void main(String[] args) {
        String s1 = "a";
        String s2 = "b";
        String s3 = "ab";
        String s4=s1+s2;//new StringBuilder().append("a").append("2").toString()  new String("ab")
        System.out.println(s3==s4);//false
//结果为false,因为s3是存在于串池之中，s4是由StringBuffer的toString方法所返回的一个对象，存在于堆内存之中
    }
}
```

反编译后的结果

```Java
         Code:
      stack=2, locals=5, args_size=1
         0: ldc           #2                  // String a
         2: astore_1
         3: ldc           #3                  // String b
         5: astore_2
         6: ldc           #4                  // String ab
         8: astore_3
         9: new           #5                  // class java/lang/StringBuilder
        12: dup
        13: invokespecial #6                  // Method java/lang/StringBuilder."<init>":()V
        16: aload_1
        17: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        20: aload_2
        21: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        24: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/Str
ing;
        27: astore        4
        29: return
```

- 通过拼接的方式来创建字符串的**过程**是：`StringBuilder().append(“a”).append(“b”).toString()`
- 最后的toString方法的返回值是一个**新的字符串**，但字符串的**值**和拼接的字符串一致，但是两个不同的字符串，**一个存在于串池之中，一个存在于****堆内存****之中**

**栗子3**：使用**拼接字符串常量对象**的方法创建字符串

```Java
public class HelloWorld {
    public static void main(String[] args) {
        String s1 = "a";
        String s2 = "b";
        String s3 = "ab";
        String s4=s1+s2;//new StringBuilder().a|ppend("a").append("2").toString()  new String("ab")
        String s5="a"+"b";
        System.out.println(s5==s3);//true
    }
}
```

反编译后的结果

```Java
           Code:
      stack=2, locals=6, args_size=1
         0: ldc           #2                  // String a
         2: astore_1
         3: ldc           #3                  // String b
         5: astore_2
         6: ldc           #4                  // String ab
         8: astore_3
         9: new           #5                  // class java/lang/StringBuilder
        12: dup
        13: invokespecial #6                  // Method java/lang/StringBuilder."<init>":()V
        16: aload_1
        17: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        20: aload_2
        21: invokevirtual #7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String
;)Ljava/lang/StringBuilder;
        24: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/Str
ing;
        27: astore        4
        //ab3初始化时直接从串池中获取字符串
        29: ldc           #4                  // String ab
        31: astore        5
        33: return
```

- 使用**拼接字符串常量**的方法来创建新的字符串时，因为**内容是常量，****javac****在编译期会进行优化，结果已在编译期确定为ab**，而创建ab的时候已经在串池中放入了“ab”，所以s5直接从串池中获取值，所以进行的操作和 s3= “ab” 一致。
- 使用**拼接字符串变量**的方法来创建新的字符串时，因为内容是变量，只能**在运行期确定它的值，所以需要使用****StringBuilder****来创建**

**intern方法 1.8**：

调用字符串对象的intern方法，会将该字符串对象尝试放入到串池中

- 如果串池中没有该字符串对象，则放入成功
- 如果有该字符串对象，则放入失败

无论放入是否成功，都会返回**串池中**的字符串对象

```Java
public class HelloWorld {

    public static void main(String[] args) {
        String x = "ab";
        String s = new String("a") + new String("b");

        String s2 = s.intern();//将这个字符串对象尝试放入串池，如果有则并不会放入，如果没有则放入串池，这两种情况都会把串池中的对象返回
        System.out.println(s2 == x);//true
        System.out.println(s == x);//false
    }
}
```

##### **面试题：String str1 = new String("abc")和String str2 = "abc" 和 区别？**

答：编译器在编译期间会把abc作为常量放在常量池中，这两个语句都会去字符串常量池中检查是否已经存在 “abc”，区别在于new会在堆中创建一个新的对象，String str2 = "abc" 返回字符串常量池的引用。

##### **面试题：String s = new String("a") + new String("b");**        

**String s3 = "ab";** **String s4=s1+s2; //new** **StringBuilder****().a|ppend("a").append("2").toString()  new String("ab")** **String s5="a"+"b";**

这类题记住编译器在编译期间会把字符字面量作为常量放在常量池中，如果操作的是对象和变量是不会放入常量池中的。

**intern方法 1.6**：

调用字符串对象的intern方法，会将该字符串对象尝试放入到串池中

- 如果串池中没有该字符串对象，会将该字符串对象复制一份，再放入到串池中
- 如果有该字符串对象，则放入失败

无论放入是否成功，都会返回**串池中**的字符串对象

**面试题（1.8）**：

```Java
package com.itcast.itheima.xpp;

public class main {
    public static void main(String[] args) {

        String s1="a";
        String s2="b";
        String s3="a"+"b";
        String s4=s1+s2;
        String s5="ab";
        String s6=s4.intern();
        System.out.println(s3==s4);//false
        System.out.println(s3==s5);//true
        System.out.println(s3==s6);//true

        String x2=new String("c")+new String("d");
        String x1="cd";
        x2.intern();
        System.out.println(x1==x2);//false


        String x4=new String("e")+new String("f");
        x4.intern();
        String x3="ef";
        System.out.println(x3==x4);//true

    }
}
```

#### 5.7 StringTable 位置

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806611.png)

- JDK1.6 时，StringTable是属于**常量池**的一部分。
- JDK1.8 以后，StringTable是放在**堆**中的。

#### 5.8 StringTable 垃圾回收

StringTable在内存紧张时，会发生垃圾回收

-Xmx10m 指定堆内存大小 -XX:+PrintStringTableStatistics 打印字符串常量池信息 -XX:+PrintGCDetails -verbose:gc 打印 gc 的次数，耗费时间等信息

```Java
/**
 * 演示 StringTable 垃圾回收
 * -Xmx10m -XX:+PrintStringTableStatistics -XX:+PrintGCDetails -verbose:gc
 */
public class Code_05_StringTableTest {

    public static void main(String[] args) {
        int i = 0;
        try {
            for(int j = 0; j < 10000; j++) { // j = 100, j = 10000
                String.valueOf(j).intern();
                i++;
            }
        }catch (Exception e) {
            e.printStackTrace();
        }finally {
            System.out.println(i);
        }
    }

}
```

#### 5.9 StringTable 性能调优

- 因为StringTable是由HashTable实现的，所以可以适当增加HashTable桶的个数，来减少字符串放入串池所需要的时间

```Java
-XX:StringTableSize=桶个数（最少设置为 1009 以上）
```

- 考虑是否需要将字符串对象入池 可以通过 intern 方法减少重复入池

## 6.直接内存

#### 6.1 定义

- 属于操作系统，常见于NIO操作时，用于数据缓冲区
- 分配回收成本较高，但读写性能高
- 不受JVM内存回收管理

#### 6.2 使用直接内存的好处

文件读写流程：

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806759.png)

因为 java 不能直接操作文件管理，需要切换到内核态，使用本地方法进行操作，然后读取磁盘文件，会在系统内存中创建一个缓冲区，将数据读到系统缓冲区， 然后在将系统缓冲区数据，复制到 java 堆内存中。缺点是数据存储了两份，在系统内存中有一份，java 堆中有一份，造成了不必要的复制。

**使用了 DirectBuffer 文件读取流程**

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806509.png)

直接内存是操作系统和 Java 代码都可以访问的一块区域，无需将代码从系统内存复制到 Java 堆内存，从而提高了效率。

#### **直接****内存****也会导致内存溢出**

```Java
public class Main {
    static int _100MB = 1024 * 1024 * 100;

    public static void main(String[] args) throws IOException {
        List<ByteBuffer> list = new ArrayList<>();
        int i = 0;
        try {
            while (true) {
                ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_100MB);
                list.add(byteBuffer);
                i++;
            }
        } finally {
            System.out.println(i);
        }

    }
}
//输出：
2
Exception in thread "main" java.lang.OutOfMemoryError: Direct buffer memory
        at java.nio.Bits.reserveMemory(Bits.java:694)
        at java.nio.DirectByteBuffer.<init>(DirectByteBuffer.java:123)
        at java.nio.ByteBuffer.allocateDirect(ByteBuffer.java:311)
        at main.Main.main(Main.java:19)
```

**直接****内存****释放原理**：

直接内存的回收不是通过JVM的垃圾回收来释放的，而是通过`unsafe.freeMemory`来手动释放

通过申请直接内存，但JVM并不能回收直接内存中的内容，它是如何实现回收的呢？

```Java
//通过ByteBuffer申请1M的直接内存ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_1M);
```

**allocateDirect的实现**：

```Java
public static ByteBuffer allocateDirect(int capacity) {return new DirectByteBuffer(capacity);}
```

**DirectByteBuffer类**：

```Java
DirectByteBuffer(int cap) {   // package-private

    super(-1, 0, cap, cap);
    boolean pa = VM.isDirectMemoryPageAligned();
    int ps = Bits.pageSize();
    long size = Math.max(1L, (long)cap + (pa ? ps : 0));
    Bits.reserveMemory(size, cap);

    long base = 0;
    try {
        base = unsafe.allocateMemory(size); //申请内存
    } catch (OutOfMemoryError x) {
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    unsafe.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        // Round up to page boundary
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap)); //通过虚引用，来实现直接内存的释放，this为虚引用的实际对象
    att = null;
}
```

这里调用了一个Cleaner的create方法，且后台线程还会对虚引用的对象监测，如果虚引用的实际对象（这里是DirectByteBuffer）被回收以后，就会调用Cleaner的clean方法，来清除直接内存中占用的内存

```Java
public void clean() {
    if (remove(this)) {
        try {
            this.thunk.run(); //调用run方法
        } catch (final Throwable var2) {
            AccessController.doPrivileged(new PrivilegedAction<Void>() {
                public Void run() {
                    if (System.err != null) {
                        (new Error("Cleaner terminated abnormally", var2)).printStackTrace();
                    }

                    System.exit(1);
                    return null;
                }
            });
        }
```

**run方法**：

```Java
public void run() {
    if (address == 0) {
        // Paranoia
        return;
    }
    unsafe.freeMemory(address); //释放直接内存中占用的内存
    address = 0;
    Bits.unreserveMemory(size, capacity);
}
```

**直接****内存****的回收机制总结**：

- 使用了 `Unsafe` 对象完成直接内存的分配回收，并且回收需要主动调用 `freeMemory` 方法
- `ByteBuffer` 的实现类内部，使用了 `Cleaner` （虚引用）来监测 ByteBuffer 对象，一旦 ByteBuffer 对象被垃圾回收，那么就会由 `ReferenceHandler` 线程通过 Cleaner 的 clean 方法调 用 freeMemory 来释放直接内存

#### 6.3 直接内存回收原理

```Java
public class Code_06_DirectMemoryTest {

    public static int _1GB = 1024 * 1024 * 1024;

    public static void main(String[] args) throws IOException, NoSuchFieldException, IllegalAccessException {
//        method();
        method1();
    }

    // 演示 直接内存 是被 unsafe 创建与回收
    private static void method1() throws IOException, NoSuchFieldException, IllegalAccessException {

        Field field = Unsafe.class.getDeclaredField("theUnsafe");
        field.setAccessible(true);
        Unsafe unsafe = (Unsafe)field.get(Unsafe.class);

        long base = unsafe.allocateMemory(_1GB);
        unsafe.setMemory(base,_1GB, (byte)0);
        System.in.read();

        unsafe.freeMemory(base);
        System.in.read();
    }

    // 演示 直接内存被 释放
    private static void method() throws IOException {
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_1GB);
        System.out.println("分配完毕");
        System.in.read();
        System.out.println("开始释放");
        byteBuffer = null;
        System.gc(); // 手动 gc
        System.in.read();
    }

}
/**
     * -XX:+DisableExplicitGC 显示的
     */
    private static void method() throws IOException {
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_1GB);
        System.out.println("分配完毕");
        System.in.read();
        System.out.println("开始释放");
        byteBuffer = null;
        System.gc(); // 手动 gc 失效
        System.in.read();
    }
```

一般用 jvm 调优时，会加上下面的参数：

```Java
-XX:+DisableExplicitGC  // 静止显示的 GC
```

意思就是禁止我们手动的 GC，比如手动 System.gc() 无效，它是一种 full gc，会回收新生代、老年代，会造成程序执行的时间比较长。所以我们就通过 unsafe 对象调用 freeMemory 的方式释放内存。

# 二、垃圾回收

## 1.如何判断对象可以回收

#### 1.1 引用计数法

- 当一个对象被其他变量引用，该对象计数加一，当某个变量不在引用该对象，其计数减一
- 当一个对象引用没有被其他变量引用时，即计数变为0时，该对象就可以被回收

##### **缺点**：循环引用时，两个对象的计数都为1，导致两个对象都无法被释放

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806290.png)

#### 1.2 可达性分析算法

- JVM中的垃圾回收器通过**可达性分析**来探索所有存活的对象
- 扫描堆中的对象，看能否沿着**GC** **Root**对象为起点的引用链找到该对象，如果**找不到**，则表示**可以回收**

##### 可以作为**GC** **Root**的对象

- 虚拟机栈（栈帧中的本地变量表）中引用的对象。
- 方法区中类静态属性引用的对象
- 方法区中常量引用的对象
- 本地方法栈中JNI（即一般说的Native方法）引用的对象
- 所有被同步锁（synchronized关键字）持有的对象。

##### 使用Memory Analyzer (MAT)分析。

```Java
public static void main(String[] args) throws IOException {

        ArrayList<Object> list = new ArrayList<>();
        list.add("a");
        list.add("b");
        list.add(1);
        System.out.println(1);
        System.in.read();

        list = null;
        System.out.println(2);
        System.in.read();
        System.out.println("end");
    }
```

对于以上代码，可以使用如下命令将堆内存信息转储成一个文件，然后使用 Eclipse Memory Analyzer 工具进行分析。 第一步： 使用 jps 命令，查看程序的进程

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806559.png)

第二步：

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806527.png)

使用 jmap -dump:format=b,live,file=1.bin 16104 命令转储文件 dump：转储文件 format=b：二进制文件 file：文件名 16104：进程的id 第三步：打开 Eclipse Memory Analyzer 对 1.bin 文件进行分析。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806840.png)

分析的 gc root，找到了 ArrayList 对象，然后将 list 置为null，再次转储，那么 list 对象就会被回收。

#### 1.3 五种引用

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806056.png)

1. ##### **强引用**

   - 只有所有 GC Roots 对象都不通过【强引用】引用该对象，该对象才能被垃圾回收

1. ##### **软引用**

   - 仅有【软引用】引用该对象时，在垃圾回收后，**内存****仍不足**时会再次出发垃圾回收，回收软引用对象
   - 可以配合【引用队列】来释放软引用自身

1. ##### **弱引用**

   - 仅有【弱引用】引用该对象时，在垃圾回收时，**无论****内存****是否充足**，都会回收弱引用对象
   - 可以配合【引用队列】来释放弱引用自身

1. ##### **虚引用**

   - 必须配合【引用队列】使用，主要配合 `ByteBuffer` 使用，被引用对象回收时，会将【虚引用】入队， 由 `Reference Handler` 线程调用虚引用相关方法释放【直接内存】
   - 如上图，B对象不再引用`ByteBuffer`对象，`ByteBuffer`就会被回收。但是直接内存中的内存还未被回收。这时需要将虚引用对象`Cleaner`放入引用队列中，然后调用它的`clean`方法来释放直接内存

1. ##### **终结器引用**

   - 无需手动编码，但其内部配合【引用队列】使用，在垃圾回收时，【终结器引用】入队（被引用对象暂时没有被回收），再由 `Finalizer` 线程通过【终结器引用】找到被引用对象并调用它的 `finalize` 方法，第二次 GC 时才能回收被引用对象
   - 如上图，B对象不再引用A4对象。这时终结器对象就会被放入引用队列中，引用队列会根据它，找到它所引用的对象。然后调用被引用对象的`finalize`方法。调用以后，该对象就可以被垃圾回收了

##### **软引用使用**

```Java
public class Demo1 {
        public static void main(String[] args) {
                final int _4M = 4*1024*1024;
                //使用软引用对象 list和SoftReference是强引用，而SoftReference和byte数组则是软引用
                List<SoftReference<byte[]>> list = new ArrayList<>();
                SoftReference<byte[]> ref= new SoftReference<>(new byte[_4M]);
        }
}
/**
 * 演示 软引用
 * -Xmx20m -XX:+PrintGCDetails -verbose:gc
 */
public class Code_08_SoftReferenceTest {

    public static int _4MB = 4 * 1024 * 1024;

    public static void main(String[] args) throws IOException {
        method2();
    }

    // 设置 -Xmx20m , 演示堆内存不足,
    public static void method1() throws IOException {
        ArrayList<byte[]> list = new ArrayList<>();

        for(int i = 0; i < 5; i++) {
            list.add(new byte[_4MB]);
        }
        System.in.read();
    }

    // 演示 软引用
    public static void method2() throws IOException {
        ArrayList<SoftReference<byte[]>> list = new ArrayList<>();
        for(int i = 0; i < 5; i++) {
            SoftReference<byte[]> ref = new SoftReference<>(new byte[_4MB]);
            System.out.println(ref.get());
            list.add(ref);
            System.out.println(list.size());
        }
        System.out.println("循环结束：" + list.size());
        for(SoftReference<byte[]> ref : list) {
            System.out.println(ref.get());
        }
    }
}
```

method1 方法解析： 首先会设置一个堆内存的大小为 20m，然后运行 mehtod1 方法，会抛异常，堆内存不足，因为 mehtod1 中的 list 都是强引用。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806314.png)

method2 方法解析： 在 list 集合中存放了 软引用对象，当内存不足时，会触发 full gc，将软引用的对象回收。细节如图：

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806561.png)

上面的代码中，当软引用引用的对象被回收了，但是软引用还存在，所以，一般软引用需要搭配一个引用队列一起使用。

修改 method2 如下：

```Java
// 演示 软引用 搭配引用队列
    public static void method3() throws IOException {
        //使用软引用对象 list和SoftReference是强引用，而SoftReference和byte数组则是软引用
        ArrayList<SoftReference<byte[]>> list = new ArrayList<>();
        ///使用引用队列，用于移除引用为空的软引用对象
        ReferenceQueue<byte[]> queue = new ReferenceQueue<>();

        for(int i = 0; i < 5; i++) {
            // 关联了引用队列，当软引用所关联的 byte[] 被回收时，软引用自己会加入到 queue 中去
            SoftReference<byte[]> ref = new SoftReference<>(new byte[_4MB], queue);
            System.out.println(ref.get());
            list.add(ref);
            System.out.println(list.size());
        }

        // 从队列中获取无用的 软引用对象，并移除
        Reference<? extends byte[]> poll = queue.poll();
        //遍历引用队列，如果有元素，则移除
        while(poll != null) {
            list.remove(poll);
            poll = queue.poll();
        }

        System.out.println("=====================");
        for(SoftReference<byte[]> ref : list) {
            System.out.println(ref.get());
        }
    }
```

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806479.png)

##### **弱引用****使用**

弱引用的使用和软引用类似，只是将 `SoftReference` 换为了 `WeakReference`

```Java
public class Code_09_WeakReferenceTest {

    public static void main(String[] args) {
//        method1();
        method2();
    }

    public static int _4MB = 4 * 1024 *1024;

    // 演示 弱引用
    public static void method1() {
        List<WeakReference<byte[]>> list = new ArrayList<>();
        for(int i = 0; i < 10; i++) {
            WeakReference<byte[]> weakReference = new WeakReference<>(new byte[_4MB]);
            list.add(weakReference);

            for(WeakReference<byte[]> wake : list) {
                System.out.print(wake.get() + ",");
            }
            System.out.println();
        }
    }

    // 演示 弱引用搭配 引用队列
    public static void method2() {
        List<WeakReference<byte[]>> list = new ArrayList<>();
        ReferenceQueue<byte[]> queue = new ReferenceQueue<>();

        for(int i = 0; i < 9; i++) {
            WeakReference<byte[]> weakReference = new WeakReference<>(new byte[_4MB], queue);
            list.add(weakReference);
            for(WeakReference<byte[]> wake : list) {
                System.out.print(wake.get() + ",");
            }
            System.out.println();
        }
        System.out.println("===========================================");
        Reference<? extends byte[]> poll = queue.poll();
        while (poll != null) {
            list.remove(poll);
            poll = queue.poll();
        }
        for(WeakReference<byte[]> wake : list) {
            System.out.print(wake.get() + ",");
        }
    }

}
```

## 2. 垃圾回收算法

#### 2.1 标记清除

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806087.png)

**定义**：在虚拟机执行垃圾回收的过程中，先采用标记算法确定可回收对象，然后垃圾收集器根据标识清除相应的内容，给堆内存腾出相应的空间

> 注意：这里的清除并不是将内存空间字节清零，而是记录这段内存的起始地址，下次分配内存的时候，会直接覆盖这段内存。

**优点**：速度快

**缺点**：容易产生内存碎片。一旦分配较大内存的对象，由于内存不连续，导致无法分配，最后就会造成内存溢出问题

#### 2.2 标记整理

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806182.png)

**定义**：在虚拟机执行垃圾回收的过程中，先采用标记算法确定可回收对象，然后整理剩余的对象，将可用的对象移动到一起，使内存更加紧凑，连续的空间就更多。

**优点**：不会有内存碎片

**缺点**：整理时需要重新处理引用关系，速度慢

#### 2.3 复制

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806969.png)

**定义**：将内存分为等大小的两个区域，FROM和TO（TO中为空）。将被GC Root引用的对象从FROM放入TO中，再回收不被GC Root引用的对象。然后交换FROM和TO。这样也可以避免内存碎片的问题，但是会占用双倍的内存空间。

**优点**：不会有内存碎片

**缺点**：会占用双倍的内存空间。

## 3. 分代垃圾回收

将堆内存分为**新生代**和**老年代**，新生代有划分为**伊甸园**，**幸存区To**，**幸存区From**。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806904.png)

#### 3.1 回收流程

对象首先分配在伊甸园区域

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806959.png)

新生代空间不足时，触发 **Minor** **GC**，伊甸园和 from 存活的对象使用 copy 复制到 to 中，存活的对象**年龄加 1**并且交换 from to

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806010.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806615.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806783.png)

再次创建对象，若新生代的伊甸园又满了，则会再次触发 **Minor** **GC**（minor gc 会引发 **stop the world（可以看下go语言的垃圾三色标记机制，减少STW）**，暂停其它用户的线程，等垃圾回收结束，用户线程才恢复运行），这时不仅会回收伊甸园中的垃圾，**还会回收幸存区中的垃圾**，再将活跃对象复制到幸存区TO中。回收以后会交换两个幸存区，并让幸存区中的对象**寿命加1**

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806878.png)

当对象寿命超过阈值时，会晋升至老年代，最大寿命是**15**（4bit），因为java对象头只用4个bit来表示，最大表示2进制1111。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806958.png)

当老年代空间不足，会先尝试触发**Minor** **GC**，如果之后空间仍不足，那么触发 **Full GC**，**stop the world**的时间更长

#### 3.2 GC 分析

##### **相关****VM****参数**

含义参数堆初始大小-Xms堆最大大小-Xmx 或 -XX:MaxHeapSize=size新生代大小-Xmn 或 (-XX:NewSize=size + -XX:MaxNewSize=size )幸存区比例（动态）-XX:InitialSurvivorRatio=ratio 和 -XX:+UseAdaptiveSizePolicy幸存区比例-XX:SurvivorRatio=ratio晋升阈值-XX:MaxTenuringThreshold=threshold晋升详情-XX:+PrintTenuringDistributionGC详情-XX:+PrintGCDetails -verbose:gcFullGC 前 MinorGCXX:+ScavengeBeforeFullGC

```Java
public class Code_10_GCTest {

    private static final int _512KB = 512 * 1024;
    private static final int _1MB = 1024 * 1024;
    private static final int _6MB = 6 * 1024 * 1024;
    private static final int _7MB = 7 * 1024 * 1024;
    private static final int _8MB = 8 * 1024 * 1024;

    // -Xms20m -Xmx20m -Xmn10m -XX:+UseSerialGC -XX:+PrintGCDetails -verbose:gc
    public static void main(String[] args) {
        List<byte[]> list = new ArrayList<>();
        list.add(new byte[_6MB]);
        list.add(new byte[_512KB]);
        list.add(new byte[_6MB]);
        list.add(new byte[_512KB]);
        list.add(new byte[_6MB]);
    }

}
```

通过上面的代码，给 list 分配内存，来观察 新生代和老年代的情况，什么时候触发 minor gc，什么时候触发 full gc 等情况，使用前需要设置 jvm 参数。

##### **大对象处理策略**

遇到一个较大的对象时，就算新生代的伊甸园为空，也**无法容纳该对象**时，会将该对象**直接晋升为老年代**

```Java
/**
 *  演示内存的分配策略
 */
public class Main {
    private static final int _512KB = 512 * 1024;
    private static final int _1MB = 1024 * 1024;
    private static final int _6MB = 6 * 1024 * 1024;
    private static final int _7MB = 7 * 1024 * 1024;
    private static final int _8MB = 8 * 1024 * 1024;
    // -Xms20M -Xmx20M -Xmn10M -XX:+UseSerialGC -XX:+PrintGCDetails -verbose:gc -XX:-ScavengeBeforeFullGC
    public static void main(String[] args) throws InterruptedException {
        ArrayList<byte[]> list=new ArrayList<>();
        list.add(new byte[_8MB]);
    }
}
```

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806023.png)

##### **线程****内存****溢出**

某个线程的内存溢出了而抛异常（out of memory），不会让其他的线程结束运行。这是因为当一个线程**抛出****OOM****异常后**，**它所占据的内存资源会全部被释放掉**，从而不会影响其他线程的运行，**进程依然正常**

```Java
/**
 * 演示内存的分配策略
 */
public class Main {
    private static final int _512KB = 512 * 1024;
    private static final int _1MB = 1024 * 1024;
    private static final int _6MB = 6 * 1024 * 1024;
    private static final int _7MB = 7 * 1024 * 1024;
    private static final int _8MB = 8 * 1024 * 1024;

    // -Xms20M -Xmx20M -Xmn10M -XX:+UseSerialGC -XX:+PrintGCDetails -verbose:gc -XX:-ScavengeBeforeFullGC
    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            ArrayList<byte[]> list = new ArrayList<>();
            list.add(new byte[_8MB]);
            list.add(new byte[_8MB]);
        }).start();
                //主线程还是会正常执行
        System.out.println("sleep....");
        Thread.sleep(1000L);
    }
}
```

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806120.png)

## 4. 垃圾回收器

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806464.png)

垃圾收集器特点算法适用场景优点缺点Serial最基本、历史最悠久的单线程垃圾收集器。新生代采用标记-复制算法运行在 Client 模式下的虚拟机简单、高效垃圾回收时必须暂停其他所有的工作线程ParNewSerial 收集器的多线程版本新生代采用标记-复制算法运行在 Server 模式下的虚拟机并行，效率高
Parallel Scavenge使用标记-复制算法的多线程收集器，关注吞吐量新生代采用标记-复制算法JDK1.8 默认收集器在注重吞吐量及CPU资源的场合吞吐量高
Serial OldSerial 收集器的老年代版本标记-整理算法在 JDK<1.5与 Parallel Scavenge 收集器搭配使用作为CMS收集器的后备方案简单、高效垃圾回收时必须暂停其他所有的工作线程Parallel OldParallel Scavenge 收集器的老年代标记-整理算法在注重吞吐量及CPU资源的场合吞吐量高
CMS多线程的垃圾收集器（用户线程和垃圾回收线程可以同时进行）标记-清除算法希望系统停顿时间最短，注重服务的响应速度的场景并发收集、低停顿对 CPU 资源敏感，无法处理浮动垃圾，产生垃圾碎片G1一款面向服务器的垃圾收集器，并行并发，空间整合，可预测的停顿时间标记-复制算法服务端应用、针对具有大内存多处理器的机器停顿时间可控、基本无空间碎片可能存在空间浪费、程序运行时的额外执行负载高

**相关概念**：

- **并行****收集**：指多条垃圾收集线程并行工作，但此时**用户线程****仍处于等待状态**
- **并发收集**：指用户线程与垃圾收集线程**同时工作**（不一定是并行的可能会交替执行）。用户程序在继续运行，而垃圾收集程序运行在另一个CPU上
- **吞吐量**：即CPU用于**运行用户代码的时间**与CPU**总消耗时间**的比值（吞吐量 = 运行用户代码时间 / ( 运行用户代码时间 + 垃圾收集时间 )），也就是。例如：虚拟机共运行100分钟，垃圾收集器花掉1分钟，那么吞吐量就是99%

#### 4.1 串行（Serial + SerialOld，新生代复制，老年代标记整理）

- 单线程
- 堆内存小，适合个人电脑

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806544.png)

**开启串行回收器**：

`XX:+UseSerialGC = Serial + SerialOld`，新生代**Serial** ，老年代**SerialOld**

**安全点**：让其他线程都在这个点停下来，以免垃圾回收时移动对象地址，使得其他线程找不到被移动的对象。

**阻塞**：因为是串行的，所以只有一个垃圾回收线程。且在该线程执行回收工作时，其他线程进入**阻塞**状态

**Serial 收集器**：

- 定义：Serial收集器是最基本的、发展历史最悠久的收集器
- 特点：**单线程**收集器。采用**复制**算法。工作在**新生代**
- Serial 收集器是最基本的、发展历史最悠久的收集器 **特点**：单线程、简单高效（与其他收集器的单线程相比），采用复制算法。对于限定单个 CPU 的环境来说，Serial 收集器由于没有线程交互的开销，专心做垃圾收集自然可以获得最高的单线程收集效率。收集器进行垃圾回收时，必须暂停其他所有的工作线程，直到它结束（Stop The World）！

**Serial Old收集器**：

- 定义：Serial Old是Serial收集器的老年代版本
- 特点：**单线程**收集器。采用**标记-整理**算法。工作在**老年代**
- 同样是单线程收集器，采用标记-整理算法

**ParNew 收集器** ParNew 收集器其实就是 Serial 收集器的多线程版本 **特点**：多线程、ParNew 收集器默认开启的收集线程数与CPU的数量相同，在 CPU 非常多的环境中，可以使用 -XX:ParallelGCThreads 参数来限制垃圾收集的线程数。和 Serial 收集器一样存在 Stop The World 问题

#### 4.2 吞吐量优先

- 多线程
- 堆内存较大，多核cpu
- 让**单位时间****内**暂停时间（STW）最短
- **JDK1.8默认使用**的垃圾回收器

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806723.png)

```Java
-XX:+UseParallelGC ~ -XX:+UsePrallerOldGC
-XX:+UseAdaptiveSizePolicy
-XX:GCTimeRatio=ratio // 1/(1+radio)
-XX:MaxGCPauseMillis=ms // 200ms
-XX:ParallelGCThreads=n
```

**Parallel 收集器**：

- 定义：与吞吐量关系密切，故也称为吞吐量优先收集器
- 特点：**并行****的**，工作于**新生代**，采用**复制**算法
- 与吞吐量关系密切，故也称为吞吐量优先收集器 **特点**：属于新生代收集器也是采用复制算法的收集器（用到了新生代的幸存区），又是并行的多线程收集器（与 ParNew 收集器类似）
- 该收集器的目标是达到一个可控制的吞吐量。还有一个值得关注的点是：GC自适应调节策略（与 ParNew 收集器最重要的一个区别）
- GC自适应调节策略： Parallel Scavenge 收集器可设置 -XX:+UseAdptiveSizePolicy 参数。 当开关打开时不需要手动指定新生代的大小（-Xmn）、Eden 与 Survivor 区的比例（-XX:SurvivorRation）、 晋升老年代的对象年龄（-XX:PretenureSizeThreshold）等，虚拟机会根据系统的运行状况收集性能监控信息，动态设置这些参数以提供最优的停顿时间和最高的吞吐量，这种调节方式称为 GC 的自适应调节策略。

Parallel Scavenge 收集器使用两个参数控制吞吐量：

- XX:MaxGCPauseMillis=ms 控制最大的垃圾收集停顿时间（默认200ms）
- XX:GCTimeRatio=rario 直接设置吞吐量的大小

**Parallel Old 收集器**：

- 定义：是Parallel 收集器的老年代版本
- 特点：**并行****的**，工作与**老年代**，采用**标记-整理算法**
- 是 Parallel Scavenge 收集器的老年代版本 **特点**：多线程，采用标记-整理算法（老年代没有幸存区）

#### 4.3 响应时间优先

- 多线程
- 堆内存较大，多核cpu
- 尽可能让**单次的**暂停时间（STW）最短

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806901.png)

```Java
-XX:+UseConcMarkSweepGC ~ -XX:+UseParNewGC ~ SerialOld
-XX:ParallelGCThreads=n ~ -XX:ConcGCThreads=threads
-XX:CMSInitiatingOccupancyFraction=percent
-XX:+CMSScavengeBeforeRemark
```

**CMS****收集器**：

- 定义：Concurrent Mark Sweep（并发，标记，清除）
- 特点：基于**标记-清除**算法的垃圾回收器。是并发的。工作在**老年代**。
- Concurrent Mark Sweep，一种以获取最短回收停顿时间为目标的**老年代收集器** **特点**：基于标记-清除算法实现。并发收集、低停顿，但是会产生内存碎片 **应用场景**：适用于注重服务的响应速度，希望系统停顿时间最短，给用户带来更好的体验等场景下。如 web 程序、b/s 服务

**CMS** **收集器的运行过程分为下列4步：**

- **初始标记**：标记 GC Roots 能直接到的对象。速度很快但是仍存在 Stop The World 问题。
- **并发标记**：进行 GC Roots Tracing 的过程，找出存活对象且用户线程可并发执行。
- **重新标记**：为了修正并发标记期间因用户程序继续运行而导致标记产生变动的那一部分对象的标记记录。仍然存在 Stop The World 问题
- **并发清除**：对标记的对象进行清除回收，清除的过程中，可能任然会有新的垃圾产生，这些垃圾就叫浮动垃圾，如果当用户需要存入一个很大的对象时，新生代放不下去，老年代由于浮动垃圾过多，就会退化为 serial Old 收集器，将老年代垃圾进行标记-整理，当然这也是很耗费时间的！

CMS 收集器的内存回收过程是与用户线程一起并发执行的，可以搭配 ParNew 收集器（多线程，新生代，复制算法）与 Serial Old 收集器（单线程，老年代，标记-整理算法）使用。

**ParNew 收集器**：

- 定义：ParNew收集器其实就是Serial收集器的多线程版本
- 特点：工作在**新生代**，基于**复制**算法的垃圾回收器。

#### 4.4 Garbage First

- JDK 9以后默认使用，而且替代了CMS 收集器

**适用场景**：

- 同时注重**吞吐量****（****Throughput****）和****低延迟**（Low latency），默认的暂停目标是 200 ms
- 超大堆内存，会将堆划分为多个**大小相等**的 **Region**
- 整体上是 **标记+整理** 算法，两个区域之间是 **复制** 算法

**相关参数：** JDK8 并不是默认开启的，所需要参数开启

```Java
-XX:+UseG1GC
-XX:G1HeapRegionSize=size
-XX:MaxGCPauseMillis=time
```

**垃圾回收****阶段**：

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806946.png)

新生代伊甸园垃圾回收—–>内存不足，新生代回收+并发标记—–>混合收集，回收新生代伊甸园、幸存区、老年代内存——>新生代伊甸园垃圾回收（重新开始）

Young Collection：对新生代垃圾收集 Young Collection + Concurrent Mark：如果老年代内存到达一定的阈值了，新生代垃圾收集同时会执行一些并发的标记。 Mixed Collection：会对新生代 + 老年代 + 幸存区等进行混合收集，然后收集结束，会重新进入新生代收集。

##### Young Collection

**新生代存在 STW：** 分代是按对象的生命周期划分，分区则是将堆空间划分连续几个不同小区间，每一个小区间独立回收，可以控制一次回收多少个小区间，方便控制 GC 产生的停顿时间！ E：eden，S：幸存区，O：老年代 新生代收集会产生 STW ！

E：伊甸园 S：幸存区 O：老年代

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806753.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806075.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806106.png)

##### **Young Collection +** **CM**：

- CM：并发标记
- 在 Young GC 时会**对 GC Root 进行初始标记**
- 在老年代**占用****堆内存****的比例**达到阈值时，对进行并发标记（不会STW），阈值可以根据用户来进行设定，由下面的 JVM 参数决定 -XX:InitiatingHeapOccupancyPercent=percent （默认45%）

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806741.png)

##### **Mixed Collection**

会对E S O 进行**全面的回收**

- 最终标记（Remark）会STW
- 拷贝存活（Evacuation）会STW
- `-XX:MaxGCPauseMills:xxx` ：用于指定最长的停顿时间

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806880.png)

> **问**：为什么有的老年代被拷贝了，有的没拷贝？
>
> 因为指定了最大停顿时间，如果对所有老年代都进行回收，耗时可能过高。为了保证时间不超过设定的停顿时间，会**回收最有价值的老年代**（回收后，能够得到更多内存）

##### **Full** **GC**

- **SerialGC**
  - 新生代内存不足发生的垃圾收集 - minor gc
  - 老年代内存不足发生的垃圾收集 - full gc
- **ParallelGC**
  - 新生代内存不足发生的垃圾收集 - minor gc
  - 老年代内存不足发生的垃圾收集 - full gc
- **CMS**
  - 新生代内存不足发生的垃圾收集 - minor gc
  - 老年代内存不足
- **G1**
  - 新生代内存不足发生的垃圾收集 - minor gc
  - 老年代内存不足（老年代所占内存超过阈值）
    - 如果垃圾产生速度慢于垃圾回收速度，不会触发Full GC，还是并发地进行清理
    - 如果垃圾产生速度快于垃圾回收速度，便会触发Full GC，然后退化成 serial Old 收集器串行的收集，就会导致停顿的时候长。

##### Young Collection 跨代引用

- 新生代回收的跨代引用（老年代引用新生代）问题

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806753.png)

- 卡表：老年代被划为一个个卡表
- Remembered Set：Remembered Set 存在于E（新生代）中，用于保存新生代对象对应的脏卡
- 脏卡：O被划分为多个区域（一个区域512K），如果该区域引用了新生代对象，则该区域被称为脏卡
- 在引用变更时通过post-write barried + dirty card queue
- concurrent refinement threads 更新 Remembered Set

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806868.png)

##### **Remark**

重新标记阶段 在垃圾回收时，收集器处理对象的过程中

- 黑色：已被处理，需要保留的
- 灰色：正在处理中的
- 白色：还未处理的

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806873.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806924.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806440.png)

但是在**并发标记过程中**，有可能黑色A被处理了以后未引用C，后面又引用了C，这时就会用到remark

- 之前C未被引用，这时A引用了C，就会给C加一个写屏障，写屏障的指令会被执行，将C放入一个队列当中，并将C变为 处理中 状态
- 在**并发标记**阶段结束以后，重新标记阶段会STW，然后将放在该队列中的对象重新处理，发现有强引用引用它，就会处理它

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806424.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806496.png)

##### **JDK 8u20 字符串去重**：

- 优点：节省大量内存
- 缺点：略微多占用了 cpu 时间，新生代回收时间略微增加

例如：

```Java
String s1 = new String("hello"); // char[]{'h','e','l','l','o'}
String s2 = new String("hello"); // char[]{'h','e','l','l','o'}
```

- 将所有新分配的字符串（底层是char[]）放入一个队列
- 当新生代回收时，G1并发检查是否有重复的字符串
- 如果字符串的值一样，就让他们**引用同一个字符串对象**
- 注意，其与String.intern的区别
  - intern关注的是字符串对象
  - 字符串去重关注的是char[]
  - 在JVM内部，使用了不同的字符串表

```Java
-XX:+UseStringDeduplication
```

##### **JDK 8u40 并发标记类卸载**

所有对象都经过并发标记后，就能知道哪些类不再被使用，当一个类加载器的所有类都不再使用，则卸载它所加载的所有类 

`-XX:+ClassUnloadingWithConcurrentMark` 默认启用

##### JDK 8u60 回收巨型对象

- 一个对象大于region的一半时，就称为巨型对象
- G1不会对巨型对象进行拷贝
- 回收时被优先考虑
- G1会跟踪老年代所有incoming引用，如果老年代incoming引用为0的巨型对象就可以在新生代垃圾回收时处理掉

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806602.png)

**JDK 9 并发标记起始时间的调整**：

- 并发标记必须在堆空间占满前完成，否则退化为 FullGC
- JDK 9 之前需要使用 `-XX:InitiatingHeapOccupancyPercent`
- JDK 9 可以动态调整
  - `-XX:InitiatingHeapOccupancyPercent` 用来设置初始值
  - 进行数据采样并动态调整
  - 总会添加一个安全的空档空间

## 5. 垃圾回收调优

查看虚拟机参数命令

```Java
D:\JavaJDK1.8\bin\java  -XX:+PrintFlagsFinal -version | findstr "GC"
```

可以根据参数去查询具体的信息

#### 5.1 调优领域

- 内存
- 锁竞争
- cpu 占用
- io
- gc

#### 5.2 确定目标

低延迟/高吞吐量？ 选择合适的GC，科学运算注重吞吐量，互联网注重低延迟。

- CMS G1 ZGC，低延迟
- ParallelGC，高吞吐量
- Zing

#### 5.3 最快的 GC是不发生GC

首先排除减少因为自身编写的代码而引发的内存问题

- 查看 Full GC 前后的内存占用，考虑以下几个问题
  - 数据是不是太多？
    - resultSet = statement.executeQuery(“select * from 大表 limit n”)
  - 数据表示是否太臃肿
    - 对象图
    - 对象大小 16 Integer 24 int 4
  - 是否存在内存泄漏
    - static Map map …
    - 软
    - 弱
    - 第三方缓存实现 redis......

#### 5.4 新生代调优

- 新生代的特点
  - 所有的 new 操作分配内存都是非常廉价的
    - TLAB thread-local allocation buffer（可防止多个线程创建对象时的干扰）
  - 死亡对象回收零代价
  - 大部分对象用过即死（朝生夕死）
  - Minor GC 所用时间远小于 Full GC
- 新生代内存越大越好么？
  - 不是
    - 新生代内存太小：频繁触发 Minor GC ，会 STW ，会使得吞吐量下降
    - 新生代内存太大：老年代内存占比有所降低，会更频繁地触发 Full GC。而且触发 Minor GC 时，清理新生代所花费的时间会更长
  - 新生代内存设置为内容纳[并发量*(请求-响应)]的数据为宜

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806701.png)

- 幸存区需要能够保存 当前活跃对象+需要晋升的对象
- 晋升阈值配置得当，让长时间存活的对象尽快晋升

```Java
-XX:MaxTenuringThreshold=threshold
-XX:+PrintTenuringDistrubution
```

#### 5.5 老年代调优

以 CMS 为例：

- CMS 的老年代内存越大越好
- 先尝试不做调优，如果没有 Full GC 那么已经，否者先尝试调优新生代。
- 观察发现 Full GC 时老年代内存占用，将老年代内存预设调大 1/4 ~ 1/3

```Java
-XX:CMSInitiatingOccupancyFraction=percent
```

#### 5.6 案例

案例1：Full GC 和 Minor GC 频繁 案例2：请求高峰期发生 Full GC，单次暂停时间特别长（CMS） 案例3：老年代充裕情况下，发生 Full GC（jdk1.7）

# 三、类加载与字节码技术

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806770.png)

## 1. 类文件结构

一个简单的 `HelloWorld.java`

```Java
// HelloWorld 示例
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("hello world");
    }
}
```

执行 `javac -parameters -d . HellowWorld.java`

> Linux 为：od -t xC HelloWorld.class

编译为 `HelloWorld.class` 得到的**字节码文件**是这个样子的：

```Java
0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09 
0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07 
0000040 00 1c 01 00 06 3c 69 6e 69 74 3e 01 00 03 28 29 
0000060 56 01 00 04 43 6f 64 65 01 00 0f 4c 69 6e 65 4e 
0000100 75 6d 62 65 72 54 61 62 6c 65 01 00 12 4c 6f 63 
0000120 61 6c 56 61 72 69 61 62 6c 65 54 61 62 6c 65 01 
0000140 00 04 74 68 69 73 01 00 1d 4c 63 6e 2f 69 74 63 
0000160 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 6f 
0000200 57 6f 72 6c 64 3b 01 00 04 6d 61 69 6e 01 00 16 
0000220 28 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 
0000240 69 6e 67 3b 29 56 01 00 04 61 72 67 73 01 00 13 
0000260 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 
0000300 6e 67 3b 01 00 10 4d 65 74 68 6f 64 50 61 72 61 
0000320 6d 65 74 65 72 73 01 00 0a 53 6f 75 72 63 65 46 
0000340 69 6c 65 01 00 0f 48 65 6c 6c 6f 57 6f 72 6c 64
0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e 
0000400 00 1f 01 00 0b 68 65 6c 6c 6f 20 77 6f 72 6c 64 
0000420 07 00 20 0c 00 21 00 22 01 00 1b 63 6e 2f 69 74 
0000440 63 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 
0000460 6f 57 6f 72 6c 64 01 00 10 6a 61 76 61 2f 6c 61 
0000500 6e 67 2f 4f 62 6a 65 63 74 01 00 10 6a 61 76 61 
0000520 2f 6c 61 6e 67 2f 53 79 73 74 65 6d 01 00 03 6f 
0000540 75 74 01 00 15 4c 6a 61 76 61 2f 69 6f 2f 50 72 
0000560 69 6e 74 53 74 72 65 61 6d 3b 01 00 13 6a 61 76 
0000600 61 2f 69 6f 2f 50 72 69 6e 74 53 74 72 65 61 6d 
0000620 01 00 07 70 72 69 6e 74 6c 6e 01 00 15 28 4c 6a 
0000640 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 6e 67 3b 
0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01 
0000700 00 07 00 08 00 01 00 09 00 00 00 2f 00 01 00 01 
0000720 00 00 00 05 2a b7 00 01 b1 00 00 00 02 00 0a 00 
0000740 00 00 06 00 01 00 00 00 04 00 0b 00 00 00 0c 00 
0000760 01 00 00 00 05 00 0c 00 0d 00 00 00 09 00 0e 00 
0001000 0f 00 02 00 09 00 00 00 37 00 02 00 01 00 00 00 
0001020 09 b2 00 02 12 03 b6 00 04 b1 00 00 00 02 00 0a 
0001040 00 00 00 0a 00 02 00 00 00 06 00 08 00 07 00 0b 
0001060 00 00 00 0c 00 01 00 00 00 09 00 10 00 11 00 00 
0001100 00 12 00 00 00 05 01 00 10 00 00 00 01 00 13 00 
0001120 00 00 02 00 14
```

根据 JVM 规范，**类文件结构**如下

```Java
u4             magic;
u2             minor_version;    
u2             major_version;    
u2             constant_pool_count;    
cp_info        constant_pool[constant_pool_count-1];    
u2             access_flags;    
u2             this_class;    
u2             super_class;   
u2             interfaces_count;    
u2             interfaces[interfaces_count];   
u2             fields_count;    
field_info     fields[fields_count];   
u2             methods_count;    
method_info    methods[methods_count];    
u2             attributes_count;    
attribute_info attributes[attributes_count];
```

### 1.1 魔数

u4 magic

对应字节码文件 0~3 字节，表示它是否是【class】类型的文件

0000000 **ca fe ba be** 00 00 00 34 00 23 0a 00 06 00 15 09

ca fe ba be ：意思是 .class 文件，不同的东西有不同的魔数，比如 jpg、png 图片等！

### 1.2 版本

u2 minor_version; u2 major_version; 0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09 00 00 00 34：34H（16进制） = 52（10进制），代表JDK8

对应字节码文件 4~7 字节，表示类的版本 00 34（52） 表示是 Java 8

0000000 ca fe ba be **00 00 00 34** 00 23 0a 00 06 00 15 09

### 1.3 常量池

参考文档 [传送门](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html)

| **Constant Type**           | **Value** |
| --------------------------- | --------- |
| CONSTANT_Class              | 7         |
| CONSTANT_Fieldref           | 9         |
| CONSTANT_Methodref          | 10        |
| CONSTANT_InterfaceMethodref | 11        |
| CONSTANT_String             | 8         |
| CONSTANT_Integer            | 3         |
| CONSTANT_Float              | 4         |
| CONSTANT_Long               | 5         |
| CONSTANT_Double             | 6         |
| CONSTANT_NameAndType        | 12        |
| CONSTANT_Utf8               | 1         |
| CONSTANT_MethodHandle       | 15        |
| CONSTANT_MethodType         | 16        |
| CONSTANT_InvokeDynamic      | 18        |

8~9 字节，表示常量池长度，00 23 （35） 表示常量池有 #1~#34项，注意 #0 项不计入，也没有值，

分析过程，碰到属于**Constant Type的值就去表中找类型，**

比如第一项0a是CONSTANT_Methodref，00 06 00 15引用了常量池中 #6 和 #21 项，后面09是CONSTANT_Fieldref，00 16 00 17表示它引用了常量池中 #22 和 # 23 项，依次类推，另外utf-8的串用2个字节来表示长度，后面是数据。

0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09

1. 第#1项 0a 表示一个 Method 信息，00 06 和 00 15（21） 表示它引用了常量池中 #6 和 #21 项来获得这个方法的【所属类】和【方法名】

0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09

1. 第#2项 09 表示一个 Field 信息，00 16（22）和 00 17（23） 表示它引用了常量池中 #22 和 # 23 项来获得这个成员变量的【所属类】和【成员变量名】
   1.  0000000 ca fe ba be 00 00 00 34 00 23 0a 00 06 00 15 09

   2.  0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07
2. 第#3项 08 表示一个字符串常量名称，00 18（24）表示它引用了常量池中 #24 项

0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07

1. 第#4项 0a 表示一个 Method 信息，00 19（25） 和 00 1a（26） 表示它引用了常量池中 #25 和 #26

项来获得这个方法的【所属类】和【方法名】

0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07

1. 第#5项 07 表示一个 Class 信息，00 1b（27） 表示它引用了常量池中 #27 项

0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07

1. 第#6项 07 表示一个 Class 信息，00 1c（28） 表示它引用了常量池中 #28 项
   1.  0000020 00 16 00 17 08 00 18 0a 00 19 00 1a 07 00 1b 07

   2.  0000040 00 1c 01 00 06 3c 69 6e 69 74 3e 01 00 03 28 29
2. 第#7项 01 表示一个 utf8 串，00 06 表示长度，3c 69 6e 69 74 3e 是【 <init> 】

0000040 00 1c 01 00 06 3c 69 6e 69 74 3e 01 00 03 28 29

1. 第#8项 01 表示一个 utf8 串，00 03 表示长度，28 29 56 是【()V】其实就是表示无参、无返回值

0000040 00 1c 01 00 06 3c 69 6e 69 74 3e 01 00 03 28 29

0000060 56 01 00 04 43 6f 64 65 01 00 0f 4c 69 6e 65 4e

1. 第#9项 01 表示一个 utf8 串，00 04 表示长度，43 6f 64 65 是【Code】

0000060 56 01 00 04 43 6f 64 65 01 00 0f 4c 69 6e 65 4e

1. 第#10项 01 表示一个 utf8 串，00 0f（15） 表示长度，4c 69 6e 65 4e 75 6d 62 65 72 54 61 62 6c 65是【LineNumberTable】
   1.  0000060 56 01 00 04 43 6f 64 65 01 00 0f 4c 69 6e 65 4e

   2.  0000100 75 6d 62 65 72 54 61 62 6c 65 01 00 12 4c 6f 63
2. 第#11项 01 表示一个 utf8 串，00 12（18） 表示长度，4c 6f 63 61 6c 56 61 72 69 61 62 6c 65 54 61 62 6c 65是【LocalVariableTable】
   1.  0000100 75 6d 62 65 72 54 61 62 6c 65 01 00 12 4c 6f 63

   2.  0000120 61 6c 56 61 72 69 61 62 6c 65 54 61 62 6c 65 01
3. 第#12项 01 表示一个 utf8 串，00 04 表示长度，74 68 69 73 是【this】
   1.  0000120 61 6c 56 61 72 69 61 62 6c 65 54 61 62 6c 65 01

   2.  0000140 00 04 74 68 69 73 01 00 1d 4c 63 6e 2f 69 74 63
4. 第#13项 01 表示一个 utf8 串，00 1d（29） 表示长度，是【Lcn/itcast/jvm/t5/HelloWorld;】
   1.  0000140 00 04 74 68 69 73 01 00 1d 4c 63 6e 2f 69 74 63

   2.  0000160 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c 6f

   3.  0000200 57 6f 72 6c 64 3b 01 00 04 6d 61 69 6e 01 00 16
5. 第#14项 01 表示一个 utf8 串，00 04 表示长度，74 68 69 73 是【main】

0000200 57 6f 72 6c 64 3b 01 00 04 6d 61 69 6e 01 00 16

1. 第#15项 01 表示一个 utf8 串，00 16（22） 表示长度，是【([Ljava/lang/String;)V】其实就是参数为字符串数组，无返回值

0000200 57 6f 72 6c 64 3b 01 00 04 6d 61 69 6e 01 00 16

0000220 28 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72

0000240 69 6e 67 3b 29 56 01 00 04 61 72 67 73 01 00 13

1. 第#16项 01 表示一个 utf8 串，00 04 表示长度，是【args】

0000240 69 6e 67 3b 29 56 01 00 04 61 72 67 73 01 00 13

1. 第#17项 01 表示一个 utf8 串，00 13（19） 表示长度，是【[Ljava/lang/String;】
   1.  0000240 69 6e 67 3b 29 56 01 00 04 61 72 67 73 01 00 13

   2.  0000260 5b 4c 6a 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69

   3.  0000300 6e 67 3b 01 00 10 4d 65 74 68 6f 64 50 61 72 61
2. 第#18项 01 表示一个 utf8 串，00 10（16） 表示长度，是【MethodParameters】
   1.  0000300 6e 67 3b 01 00 10 4d 65 74 68 6f 64 50 61 72 61

   2.  0000320 6d 65 74 65 72 73 01 00 0a 53 6f 75 72 63 65 46
3. 第#19项 01 表示一个 utf8 串，00 0a（10） 表示长度，是【SourceFile】
   1.  0000320 6d 65 74 65 72 73 01 00 0a 53 6f 75 72 63 65 46

   2.  0000340 69 6c 65 01 00 0f 48 65 6c 6c 6f 57 6f 72 6c 64
4. 第#20项 01 表示一个 utf8 串，00 0f（15） 表示长度，是【HelloWorld.java】
   1.  0000340 69 6c 65 01 00 0f 48 65 6c 6c 6f 57 6f 72 6c 64

   2.  0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e
5. 第#21项 0c 表示一个 【名+类型】，00 07 00 08 引用了常量池中 #7 #8 两项

0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e

1. 第#22项 07 表示一个 Class 信息，00 1d（29） 引用了常量池中 #29 项

0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e

1. 第#23项 0c 表示一个 【名+类型】，00 1e（30） 00 1f （31）引用了常量池中 #30 #31 两项
   1.  0000360 2e 6a 61 76 61 0c 00 07 00 08 07 00 1d 0c 00 1e

   2.  0000400 00 1f 01 00 0b 68 65 6c 6c 6f 20 77 6f 72 6c 64
2. 第#24项 01 表示一个 utf8 串，00 0f（15） 表示长度，是【hello world】

0000400 00 1f 01 00 0b 68 65 6c 6c 6f 20 77 6f 72 6c 64

1. 第#25项 07 表示一个 Class 信息，00 20（32） 引用了常量池中 #32 项

0000420 07 00 20 0c 00 21 00 22 01 00 1b 63 6e 2f 69 74

1. 第#26项 0c 表示一个 【名+类型】，00 21（33） 00 22（34）引用了常量池中 #33 #34 两项

0000420 07 00 20 0c 00 21 00 22 01 00 1b 63 6e 2f 69 74

1. 第#27项 01 表示一个 utf8 串，00 1b（27） 表示长度，是【cn/itcast/jvm/t5/HelloWorld】
   1.  0000420 07 00 20 0c 00 21 00 22 01 00 1b 63 6e 2f 69 74

   2.  0000440 63 61 73 74 2f 6a 76 6d 2f 74 35 2f 48 65 6c 6c

   3.  0000460 6f 57 6f 72 6c 64 01 00 10 6a 61 76 61 2f 6c 61
2. 第#28项 01 表示一个 utf8 串，00 10（16） 表示长度，是【java/lang/Object】
   1.  0000460 6f 57 6f 72 6c 64 01 00 10 6a 61 76 61 2f 6c 61

   2.  0000500 6e 67 2f 4f 62 6a 65 63 74 01 00 10 6a 61 76 61
3. 第#29项 01 表示一个 utf8 串，00 10（16） 表示长度，是【java/lang/System】
   1.  0000500 6e 67 2f 4f 62 6a 65 63 74 01 00 10 6a 61 76 61

   2.  0000520 2f 6c 61 6e 67 2f 53 79 73 74 65 6d 01 00 03 6f
4. 第#30项 01 表示一个 utf8 串，00 03 表示长度，是【out】
   1.  0000520 2f 6c 61 6e 67 2f 53 79 73 74 65 6d 01 00 03 6f

   2.  0000540 75 74 01 00 15 4c 6a 61 76 61 2f 69 6f 2f 50 72
5. 第#31项 01 表示一个 utf8 串，00 15（21） 表示长度，是【Ljava/io/PrintStream;】
   1.  0000540 75 74 01 00 15 4c 6a 61 76 61 2f 69 6f 2f 50 72

   2.  0000560 69 6e 74 53 74 72 65 61 6d 3b 01 00 13 6a 61 76

   3.  Flag Name Value Interpretation

   4.  ACC_PUBLIC 0x0001

   5.  Declared public ; may be accessed from outside its 

   6.  package.

   7.  ACC_FINAL 0x0010 Declared final ; no subclasses allowed.

   8.  ACC_SUPER 0x0020

   9.  Treat superclass methods specially when invoked by the

   10.  invokespecial instruction.

   11.  ACC_INTERFACE 0x0200 Is an interface, not a class.

   12.  ACC_ABSTRACT 0x0400 Declared abstract ; must not be instantiated.

   13.  ACC_SYNTHETIC 0x1000 Declared synthetic; not present in the source code.

   14.  ACC_ANNOTATION 0x2000 Declared as an annotation type.

   15.  ACC_ENUM 0x4000 Declared as an enum type.
6. 第#32项 01 表示一个 utf8 串，00 13（19） 表示长度，是【java/io/PrintStream】
   1.  0000560 69 6e 74 53 74 72 65 61 6d 3b 01 00 13 6a 61 76

   2.  0000600 61 2f 69 6f 2f 50 72 69 6e 74 53 74 72 65 61 6d
7. 第#33项 01 表示一个 utf8 串，00 07 表示长度，是【println】

0000620 01 00 07 70 72 69 6e 74 6c 6e 01 00 15 28 4c 6a

1. 第#34项 01 表示一个 utf8 串，00 15（21） 表示长度，是【(Ljava/lang/String;)V】
   1.  0000620 01 00 07 70 72 69 6e 74 6c 6e 01 00 15 28 4c 6a

   2.  0000640 61 76 61 2f 6c 61 6e 67 2f 53 74 72 69 6e 67 3b

   3.  0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01

### 1.4 访问标识与继承信息

21 表示该 class 是一个类，公共的

0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01

05 表示根据常量池中 #5 找到本类全限定名

0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01

06 表示根据常量池中 #6 找到父类全限定名

0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01

表示接口的数量，本类为 0

0000660 29 56 00 21 00 05 00 06 00 00 00 00 00 02 00 01

## 2. 字节码指令

可参考： [字节码指令](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-6.html#jvms-6.5)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806182.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806241.png)

### 2.1 javap工具

Oracle 提供了 javap 工具来反编译 class 文件，还有其他的idea插件可以直接查看。

```Java
javap -v 类名.class
```

### 2.2 图解方法执行流程

#### （1）**代码**

```Java
public class Demo3_1 {    
        public static void main(String[] args) {        
                int a = 10;        
                int b = Short.MAX_VALUE + 1;        
                int c = a + b;                
                System.out.println(c);   
    } 
}
```

#### （2）编译后的字节码文件

```Java
C:\Users\30287\IdeaProjects\paiXppLL\src\main>javap -v Main.class
Classfile /C:/Users/30287/IdeaProjects/paiXppLL/src/main/Main.class
  Last modified 2021-10-14; size 419 bytes
  MD5 checksum eda2e7897356a975438fe5899c0b4a6c
  Compiled from "Main.java"
public class main.Main
  minor version: 0
  major version: 52
  flags: ACC_PUBLIC, ACC_SUPER
Constant pool:
   #1 = Methodref          #6.#15         // java/lang/Object."<init>":()V
   #2 = Fieldref           #16.#17        // java/lang/System.out:Ljava/io/PrintStream;
   #3 = String             #18            // hello world!
   #4 = Methodref          #19.#20        // java/io/PrintStream.println:(Ljava/lang/String;)V
   #5 = Class              #21            // main/Main
   #6 = Class              #22            // java/lang/Object
   #7 = Utf8               <init>
   #8 = Utf8               ()V
   #9 = Utf8               Code
  #10 = Utf8               LineNumberTable
  #11 = Utf8               main
  #12 = Utf8               ([Ljava/lang/String;)V
  #13 = Utf8               SourceFile
  #14 = Utf8               Main.java
  #15 = NameAndType        #7:#8          // "<init>":()V
  #16 = Class              #23            // java/lang/System
  #17 = NameAndType        #24:#25        // out:Ljava/io/PrintStream;
  #18 = Utf8               hello world!
  #19 = Class              #26            // java/io/PrintStream
  #20 = NameAndType        #27:#28        // println:(Ljava/lang/String;)V
  #21 = Utf8               main/Main
  #22 = Utf8               java/lang/Object
  #23 = Utf8               java/lang/System
  #24 = Utf8               out
  #25 = Utf8               Ljava/io/PrintStream;
  #26 = Utf8               java/io/PrintStream
  #27 = Utf8               println
  #28 = Utf8               (Ljava/lang/String;)V
{
  public main.Main();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 13: 0

  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=1, args_size=1
         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
         3: ldc           #3                  // String hello world!
         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
         8: return
      LineNumberTable:
        line 15: 0
        line 16: 8
}
```

#### （3）常量池载入运行时常量池

常量池也属于方法区，只不过这里单独提出来了

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806174.png)

#### （4）**方法字节码载入方法区**

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806552.png)

#### （5）main 线程开始运行，分配栈帧内存

stack=2，locals=4） 对应操作数栈有2个空间（每个空间4个字节），局部变量表中有4个槽位

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806608.png)

#### **（6）执行引擎开始执行字节码** **bipush 10**

- **将一个 byte 压入操作数栈**（其长度会补齐 4 个字节），类似的指令还有
- sipush 将一个 short 压入操作数栈（其长度会补齐 4 个字节）
- ldc 将一个 int 压入操作数栈
- ldc2_w 将一个 long 压入操作数栈（**分两次压入**，因为 long 是 8 个字节）
- 这里小的数字都是和字节码指令存在一起，**超过 short 范围的数字存入了****常量池**

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806670.png)

**istore 1** 将操作数栈栈顶元素弹出，放入局部变量表的 slot 1 中 对应代码中的 a = 10

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806036.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806984.png)

**ldc #3**

- 读取运行时常量池中 #3 ，即 32768 (超过 short 最大值范围的数会被放到运行时常量池中)，将其加载到操作数栈中
- 注意 Short.MAX_VALUE 是 32767，所以 32768 = Short.MAX_VALUE + 1 实际是在编译期间计算好的。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806093.png)

**istore 2** 将操作数栈中的元素弹出，放到局部变量表的 2 号位置

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806432.png)

**iload1 iload2** 将局部变量表中 1 号位置和 2 号位置的元素放入操作数栈中。因为只能在操作数栈中执行运算操作

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806537.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806754.png)

**iadd** 将操作数栈中的两个元素弹出栈并相加，结果在压入操作数栈中。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806177.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806829.png)

**istore 3** 将操作数栈中的元素弹出，放入局部变量表的3号位置。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806104.png)

**getstatic #4** 在运行时常量池中找到 #4 ，发现是一个对象，在堆内存中找到该对象，并将其引用放入操作数栈中

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806300.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806281.png)

**iload 3** 将局部变量表中 3 号位置的元素压入操作数栈中。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806529.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806658.png)

**invokevirtual #5**

- 找到常量池 #5 项，
- 定位到方法区 java/io/PrintStream.println:(I)V 方法
- 生成新的栈帧（分配 locals、stack等）
- 传递参数，执行新栈帧中的字节码

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806004.png)

执行完毕，弹出栈帧 清除 main 操作数栈内容

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806053.png)

**return** 完成 main 方法调用，弹出 main 栈帧，程序结束

### 2.3 练习 - 分析 i++

 代码

```Java
package cn.itcast.jvm.t3.bytecode;
/**
* 从字节码角度分析 a++ 相关题目
*/
public class Demo3_2 {
public static void main(String[] args) {
    int a = 10;
    int b = a++ + ++a + a--;
    System.out.println(a);
    System.out.println(b);
    }
}
public static void main(java.lang.String[]);
descriptor: ([Ljava/lang/String;)V
flags: (0x0009) ACC_PUBLIC, ACC_STATIC
Code:
stack=2, locals=3, args_size=1
0: bipush 10
2: istore_1
3: iload_1
4: iinc 1, 1
7: iinc 1, 1
10: iload_1
11: iadd
12: iload_1
13: iinc 1, -1
16: iadd
17: istore_2
18: getstatic #2 // Field
java/lang/System.out:Ljava/io/PrintStream;
21: iload_1
22: invokevirtual #3 // Method
java/io/PrintStream.println:(I)V
25: getstatic #2 // Field
java/lang/System.out:Ljava/io/PrintStream;
28: iload_2
29: invokevirtual #3 // Method
java/io/PrintStream.println:(I)V
32: return
LineNumberTable:
line 8: 0
line 9: 3
line 10: 18
line 11: 25
line 12: 32
LocalVariableTable:
Start Length Slot Name Signature
0 33 0 args [Ljava/lang/String;
3 30 1 a I
18 15 2 b I
```

分析：

注意 iinc 指令是直接在局部变量 slot 上进行运算

a++ 和 ++a 的区别是先执行 iload 还是 先执行 iinc

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806072.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806127.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806165.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806461.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806768.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806950.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806098.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806079.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806159.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806271.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806382.png)

### 2.4 条件判断指令

| 指令 | 助记符 | 含义          |
| ---- | ------ | ------------- |
| 0x99 | ifeq   | 判断是否 == 0 |
| 0x9a | ifne   | 判断是否 != 0 |
| 0x9b | iflt   | 判断是否 < 0  |

几点说明：

- byte，short，char 都会按 int 比较，因为操作数栈都是 4 字节
- goto 用来进行跳转到指定行号的字节码

```Java
public class Demo3_3 {
public static void main(String[] args) {
        int a = 0;
        if(a == 0) {
            a = 10;
        } else {
        a = 20;
        }
    }
}
0: iconst_0
1: istore_1
2: iload_1
3: ifne 12
6: bipush 10
8: istore_1
9: goto 15
12: bipush 20
14: istore_1
15: return
```

> 思考
>
> 细心的同学应当注意到，以上比较指令中没有 long，float，double 的比较，那么它们要比较怎么办？
>
> 参考 https://docs.oracle.com/javase/specs/jvms/se7/html/jvms-6.html#jvms-6.5.lcmp

### 2.5 循环控制指令

其实循环控制还是前面介绍的那些指令，例如 while 循环：

```Java
public class Demo3_4 {
public static void main(String[] args) {
int a = 0;
while (a < 10) {
a++;
}
}
}
0: iconst_0
1: istore_1
2: iload_1
3: bipush 10
5: if_icmpge 14
8: iinc 1, 1
11: goto 2
14: return
```

再比如 do while 循环：

```Java
public class Demo3_5 {
public static void main(String[] args) {
int a = 0;
do {
a++;
} while (a < 10);
}
}
字节码是：
 0: iconst_0
 1: istore_1
 2: iinc 1, 1
 5: iload_1
 6: bipush 10
 8: if_icmplt 2
11: return
```

最后再看看 for 循环：

```Java
public class Demo3_6 {
public static void main(String[] args) {
for (int i = 0; i < 10; i++) {
}
}
}
0: iconst_0
1: istore_1
2: iload_1
3: bipush 10
5: if_icmpge 14
8: iinc 1, 1
11: goto 2
14: return
```

> 注意
>
> 比较 while 和 for 的字节码，你发现它们是一模一样的，殊途也能同归😊

### 2.6 练习-判断结果

```Java
public class Code_11_ByteCodeTest {
    public static void main(String[] args) {

        int i = 0;
        int x = 0;
        while (i < 10) {
            x = x++;
            i++;
        }
        System.out.println(x); // 0
    }
}
```

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806675.png)

为什么最终的 x 结果为 0 呢？ 通过分析字节码指令即可知晓

```Java
Code:
     stack=2, locals=3, args_size=1        // 操作数栈分配2个空间，局部变量表分配 3 个空间
        0: iconst_0        // 准备一个常数 0
        1: istore_1        // 将常数 0 放入局部变量表的 1 号槽位 i = 0
        2: iconst_0        // 准备一个常数 0
        3: istore_2        // 将常数 0 放入局部变量的 2 号槽位 x = 0        
        4: iload_1                // 将局部变量表 1 号槽位的数放入操作数栈中
        5: bipush        10        // 将数字 10 放入操作数栈中，此时操作数栈中有 2 个数
        7: if_icmpge     21        // 比较操作数栈中的两个数，如果下面的数大于上面的数，就跳转到 21 。这里的比较是将两个数做减法。因为涉及运算操作，所以会将两个数弹出操作数栈来进行运算。运算结束后操作数栈为空
       10: iload_2                // 将局部变量 2 号槽位的数放入操作数栈中，放入的值是 0 
       11: iinc          2, 1        // 将局部变量 2 号槽位的数加 1 ，自增后，槽位中的值为 1 
       14: istore_2        //将操作数栈中的数放入到局部变量表的 2 号槽位，2 号槽位的值又变为了0
       15: iinc          1, 1 // 1 号槽位的值自增 1 
       18: goto          4 // 跳转到第4条指令
       21: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
       24: iload_2
       25: invokevirtual #3                  // Method java/io/PrintStream.println:(I)V
       28: return
```

### 2.7 构造方法

**cinit()V**

```Java
public class Code_12_CinitTest {
        static int i = 10;

        static {
                i = 20;
        }

        static {
                i = 30;
        }

        public static void main(String[] args) {
                System.out.println(i); // 30
        }
}
```

编译器会按**从上至下**的顺序，收集所有 `static` 静态代码块和静态成员赋值的代码，**合并**为一个特殊的方法 `cinit()V` ：

```Java
stack=1, locals=0, args_size=0
         0: bipush        10
         2: putstatic     #3                  // Field i:I
         5: bipush        20
         7: putstatic     #3                  // Field i:I
        10: bipush        30
        12: putstatic     #3                  // Field i:I
        15: return
```

`cinit()V` 方法会在[类加载](https://so.csdn.net/so/search?q=类加载&spm=1001.2101.3001.7020)的初始化阶段被调用

**init()V**

```Java
public class Main {
    private String a = "s1";

    {
        b = 20;
    }

    private int b = 10;

    {
        a = "s2";
    }

    public Main(String a, int b) {
        this.a = a;
        this.b = b;
    }

    public static void main(String[] args) {
        Main d = new Main("s3", 30);
        System.out.println(d.a);//s3
        System.out.println(d.b);//30
    }    
}
```

编译器会按**从上至下**的顺序，收集所有 {} 代码块和成员变量赋值的代码，**形成新的构造方法**，但**原始构造方法**内的代码**总是在后**

```Java
Code:
stack=2, locals=3, args_size=3
0: aload_0
1: invokespecial #1 // super.<init>()V
4: aload_0
5: ldc #2         // <- "s1"
7: putfield #3    // -> this.a
10: aload_0
11: bipush 20     // <- 20
13: putfield #4   // -> this.b
16: aload_0
17: bipush 10     // <- 10
19: putfield #4   // -> this.b
22: aload_0
23: ldc #5        // <- "s2"
25: putfield #3   // -> this.a
28: aload_0       // ------------------------------
29: aload_1       // <- slot 1(a) "s3"            |
30: putfield #3   // -> this.a                    |
33: aload_0                                       |
34: iload_2       // <- slot 2(b) 30              |
35: putfield #4   // -> this.b --------------------
38: return
```

### 2.8 方法调用

看一下几种不同的方法调用对应的字节码指令

```Java
package main;


public class Main {
    public Main() {

    }

    private void test1() {

    }

    private final void test2() {

    }

    public void test3() {

    }

    public static void test4() {

    }

    public static void main(String[] args) {
        Main m = new Main();
        m.test1();
        m.test2();
        m.test3();
        Main.test4();
    }
}
```

不同方法在调用时，对应的虚拟机指令有所区别：

- **私有**、**构造**、被**final**修饰的方法，在调用时都使用**invokespecial**指令，属于**静态绑定**
- **普通成员**方法在调用时，使用**invokevirtual**指令。因为编译期间无法确定该方法的内容，只有在运行期间才能确定，属于**动态绑定**，即支持多态
- **静态方法**在调用时使用**invokestatic**指令

对应的字节码文件：

```Java
 Code:
      stack=2, locals=2, args_size=1
         0: new           #2                  // class main/Main
         3: dup
         4: invokespecial #3                  // Method "<init>":()V
         7: astore_1
         8: aload_1
         9: invokespecial #4                  // Method test1:()V
        12: aload_1
        13: invokespecial #5                  // Method test2:()V
        16: aload_1
        17: invokevirtual #6                  // Method test3:()V
        20: invokestatic  #7                  // Method test4:()V
        23: return
```

- new 是创建【对象】，给对象分配堆内存，执行成功会将【对象引用】压入操作数栈
- dup 是复制操作数栈栈顶的内容，本例即为【对象引用】，为什么需要两份引用呢，一个是要配合 `invokespecial` 调用该对象的构造方法 `"<init>":()V` （会消耗掉栈顶一个引用），另一个要配合 `astore_1` 赋值给局部变量
- 终方法（ﬁnal），私有方法（private），构造方法都是由 invokespecial 指令来调用，属于静态绑定
- 普通成员方法是由 invokevirtual 调用，属于动态绑定，即支持多态，成员方法与静态方法调用的另一个区别是，执行方法前是否需要【对象引用】
- 比较有意思的是 d.test4(); 是通过【对象引用】调用一个静态方法，可以看到在调用invokestatic 之前执行了 pop 指令，把【对象引用】从操作数栈弹掉了😂
- 还有一个执行 invokespecial 的情况是通过 super 调用父类方法

### 2.9 多态的原理

因为普通成员方法需要在运行时才能确定具体的内容，所以虚拟机需要调用**invokevirtual**指令

在执行**invokevirtual**指令时，经历了以下几个步骤

- 先通过栈帧中对象的引用找到对象
- 分析对象头，找到对象实际的Class
- Class结构中有**vtable**，它在类加载的链接阶段就已经根据方法的重写规则生成好了
- 查询**vtable**找到方法的具体地址
- 执行方法的字节码

```Java
package cn.itcast.jvm.t3.bytecode;
import java.io.IOException;
/**
* 演示多态原理，注意加上下面的 JVM 参数，禁用指针压缩
* -XX:-UseCompressedOops -XX:-UseCompressedClassPointers
*/
public class Demo3_10 {
    public static void test(Animal animal) {
        animal.eat();
        System.out.println(animal.toString());
    }
    public static void main(String[] args) throws IOException {
        test(new Cat());
        test(new Dog());
        System.in.read();
    }
}
abstract class Animal {
    public abstract void eat();
    @Override
    public String toString() {
        return "我是" + this.getClass().getSimpleName();
    }
}
class Dog extends Animal {
    @Override
    public void eat() {
    System.out.println("啃骨头");
    }
}
class Cat extends Animal {
    @Override
    public void eat() {
    System.out.println("吃鱼");
    }
}
```

#### 1）运行代码

停在 System.in.read() 方法上，这时运行 jps 获取进程 id

#### 2）运行 HSDB 工具

进入 JDK 安装目录，执行

```Java
java -cp ./lib/sa-jdi.jar sun.jvm.hotspot.HSDB
```

进入图形界面 attach 进程 id

#### 3）查找某个对象

打开 Tools -> Find Object By Query

输入

```Java
select d from cn.itcast.jvm.t3.bytecode.Dog d
```

点击 Execute 执行

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806863.png)

#### 4）查看对象内存结构

点击超链接可以看到对象的内存结构，此对象没有任何属性，因此只有对象头的 16 字节，前 8 字节是

MarkWord，后 8 字节就是对象的 Class 指针

但目前看不到它的实际地址

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806948.png)

#### 5）查看对象 Class 的内存地址

可以通过 Windows -> Console 进入命令行模式，执行

```Java
mem 0x00000001299b4978 2
```

mem 有两个参数，参数 1 是对象地址，参数 2 是查看 2 行（即 16 字节）

结果中第二行 0x000000001b7d4028 即为 Class 的内存地址

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806050.png)

#### 6）查看类的 vtable

方法1：Alt+R 进入 Inspector 工具，输入刚才的 Class 内存地址，看到如下界面

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806161.png)

方法2：或者 Tools -> Class Browser 输入 Dog 查找，可以得到相同的结果

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806177.png)

无论通过哪种方法，都可以找到 Dog Class 的 vtable 长度为 6，意思就是 Dog 类有 6 个虚方法（多态相关的，final，static 不会列入）

那么这 6 个方法都是谁呢？从 Class 的起始地址开始算，偏移 0x1b8 就是 vtable 的起始地址，进行计算得到：

```Java
0x000000001b7d4028
               1b8 +
---------------------
0x000000001b7d41e0
```

通过 Windows -> Console 进入命令行模式，执行

```Java
mem 0x000000001b7d41e0 6
0x000000001b7d41e0: 0x000000001b3d1b10
0x000000001b7d41e8: 0x000000001b3d15e8
0x000000001b7d41f0: 0x000000001b7d35e8
0x000000001b7d41f8: 0x000000001b3d1540
0x000000001b7d4200: 0x000000001b3d1678
0x000000001b7d4208: 0x000000001b7d3fa8
```

就得到了 6 个虚方法的入口地址

#### 7）验证方法地址

通过 Tools -> Class Browser 查看每个类的方法定义，比较可知

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806295.png)

```Java
Dog - public void eat() @0x000000001b7d3fa8
Animal - public java.lang.String toString() @0x000000001b7d35e8;
Object - protected void finalize() @0x000000001b3d1b10;
Object - public boolean equals(java.lang.Object) @0x000000001b3d15e8;
Object - public native int hashCode() @0x000000001b3d1540;
Object - protected native java.lang.Object clone() @0x000000001b3d1678;
```

对号入座，发现

- eat() 方法是 Dog 类自己的
- toString() 方法是继承 String 类的
- finalize() ，equals()，hashCode()，clone() 都是继承 Object 类的

#### 8）小结

当执行 invokevirtual 指令时，

1. 先通过栈帧中的对象引用找到对象
2. 分析对象头，找到对象的实际 Class
3. Class 结构中有 vtable，它在类加载的链接阶段就已经根据方法的重写规则生成好了
4. 查表得到方法的具体地址
5. 执行方法的字节码

### 2.10 异常处理

#### （1）try-catch

```Java
public class Main {
    public static void main(String[] args) {
        int i = 0;
        try {
            i = 10;
        } catch (Exception e) {
            i = 20;
        }
    }
}
```

对应的字节码文件（为了抓住重点，下面的字节码省略了不重要的部分）：

```Java
  Code:
      stack=1, locals=3, args_size=1
         0: iconst_0
         1: istore_1
         2: bipush        10
         4: istore_1
         5: goto          12
         8: astore_2
         9: bipush        20
        11: istore_1
        12: return
      Exception table:
         from    to  target type
             2     5     8   Class java/lang/Exception
```

- 可以看到多出来一个 **Exception table** 的结构，[from, to) 是**前闭后开**（也就是检测2~4行）的检测范围，一旦这个范围内的字节码执行出现异常，则通过 type 匹配异常类型，如果一致，进入 target 所指示行号
- 8行的字节码指令 astore_2 是将异常对象引用存入局部变量表的2号位置（为e）

#### （2）多个 single-catch 块的情况

```Java
public class Demo3_11_2 {
public static void main(String[] args) {
        int i = 0;
        try {
            i = 10;
        } catch (ArithmeticException e) {
            i = 30;
        } catch (NullPointerException e) {
            i = 40;
        } catch (Exception e) {
            i = 50;
        }
    }
}
```

对应的字节码文件：

```Java
public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
        stack=1, locals=3, args_size=1
            0: iconst_0
            1: istore_1
            2: bipush            10
            4: istore_1
            5: goto              26
            8: astore_2
            9: bipush            30
            11: istore_1
            12: goto             26
            15: astore_2
            16: bipush           40
            18: istore_1
            19: goto             26
            22: astore_2
            23: bipush           50
            25: istore_1
            26: return
    Exception table:
    from to target type
       2  5   8     Class java/lang/ArithmeticException
       2  5   15     Class java/lang/NullPointerException
       2  5   22     Class java/lang/Exception
    LineNumberTable: ...
    LocalVariableTable:
    Start Length Slot Name Signature
        9     3     2   e     Ljava/lang/ArithmeticException;
       16     3     2   e     Ljava/lang/NullPointerException;
       23     3     2   e     Ljava/lang/Exception;
        0    27     0  args   [Ljava/lang/String;
        2    25     1   i     I
    StackMapTable: ...
    MethodParameters: ...
```

- 因为异常出现时，**只能进入** Exception table 中**一个分支**，所以局部变量表 slot 2 位置**被共用**

#### （3）multi-catch 的情况

```Java
public class Demo3_11_3 {
    public static void main(String[] args) {
        try {
                Method test = Demo3_11_3.class.getMethod("test");
                test.invoke(null);
            } catch (NoSuchMethodException | IllegalAccessException |
            InvocationTargetException e) {
                e.printStackTrace();
                }
            }
        public static void test() {
            System.out.println("ok");
    }
}
public static void main(java.lang.String[]);
descriptor: ([Ljava/lang/String;)V
flags: ACC_PUBLIC, ACC_STATIC
Code:
stack=3, locals=2, args_size=1
0: ldc #2
2: ldc #3
4: iconst_0
5: anewarray #4
8: invokevirtual #5
11: astore_1
12: aload_1
13: aconst_null
14: iconst_0
15: anewarray #6
18: invokevirtual #7
21: pop
22: goto 30
25: astore_1
26: aload_1
27: invokevirtual #11 // e.printStackTrace:()V
30: return
Exception table:
from to target type
0 22 25 Class java/lang/NoSuchMethodException
0 22 25 Class java/lang/IllegalAccessException
0 22 25 Class java/lang/reflect/InvocationTargetException
LineNumberTable: ...
LocalVariableTable:
Start Length Slot Name Signature
12 10 1 test Ljava/lang/reflect/Method;
26 4 1 e Ljava/lang/ReflectiveOperationException;
0 31 0 args [Ljava/lang/String;
StackMapTable: ...
MethodParameters: ...
```

#### （4）finally

```Java
public class Main {
    public static void main(String[] args) {
        int i = 0;
        try {
            i = 10;
        } catch (Exception e) {
            i = 20;
        } finally {
            i = 30;
        }
    }
}
```

对应的字节码文件：

```Java
   Code:
      stack=1, locals=4, args_size=1
          
         0: iconst_0
         1: istore_1
          //try块
         2: bipush        10
         4: istore_1
         5: bipush        30
         //try块执行完后，会执行finally 
         7: istore_1
         8: goto          27
         //catch块
        11: astore_2
        12: bipush        20
        14: istore_1
         //catch块执行完，会执行finally
        15: bipush        30
        17: istore_1
        18: goto          27
        //出现异常，但未被Exception捕获，会抛出其他异常，这时也需要执行finally块中的代码   
        21: astore_3
        22: bipush        30
        24: istore_1
        25: aload_3
        26: athrow //抛出异常
        27: return
      Exception table:
         from    to  target type
             2     5    11   Class java/lang/Exception
             2     5    21   any //剩余的异常类型，比如 Error
            11    15    21   any //剩余的异常类型，比如 Erro
```

可以看到 finally 中的代码被复制了 3 份，分别放入 try 流程，catch 流程以及 catch 剩余的异常类型流程

> 注意：
>
> 虽然从字节码指令看来，每个块中都有finally块，但是finally块中的代码**只会被执行一次**

#### （5）finally中的return

```Java
public class Main {
    public static void main(String[] args) {
        int result = test();
        System.out.println(result);//20
    }

    public static int test() {
        try {
            return 10;
        } finally {
            return 20;
        }
    }
}
```

对应的字节码文件：

```Java
Code:
     stack=1, locals=3, args_size=0
        0: bipush        10
        2: istore_0
        3: iload_0
        4: istore_1  // 暂存返回值
        5: bipush        20
        7: istore_0
        8: iload_0
        9: ireturn        // ireturn 会返回操作数栈顶的整型值 20
       // 如果出现异常，还是会执行finally 块中的内容，没有抛出异常
       10: astore_2
       11: bipush        20
       13: istore_0
       14: iload_0
       15: ireturn        // 这里没有 athrow 了，也就是如果在 finally 块中如果有返回操作的话，且 try 块中出现异常，会吞掉异常！
     Exception table:
        from    to  target type
            0     5    10   any
```

- 由于 finally 中的 ireturn 被插入了所有可能的流程，因此返回结果肯定以 finally 的为准
- 跟前一个中的 finally 相比，发现没有 athrow 了，这告诉我们：如果在 finally 中出现了 return，会吞掉异常
- 所以不要在finally中进行返回操作

运行下面的代码，不会抛出异常：

```Java
public class Main {
    public static void main(String[] args) {
        int result = test();
        System.out.println(result);
    }

    public static int test() {
        try {
            int i = 1 / 0;
            return 10;
        } finally {
            return 20;
        }
    }
}
```

#### （6）finally不带return

```Java
public class Main {
    public static void main(String[] args) {
        int i = Main.test();
        System.out.println(i);//输出为10
    }

    public static int test() {
        int i = 10;
        try {
            return i;
        } finally {
            i = 20;
        }
    }
}
```

对应的字节码文件：

```Java
Code:
      stack=1, locals=3, args_size=0
        0: bipush        10
        2: istore_0     //赋值给i 10
        3: iload_0      //加载到操作数栈顶
        4: istore_1     //加载到局部变量表的1号位置
        5: bipush        20
        7: istore_0     //赋值给i 20
        8: iload_1      //加载局部变量表1号位置的数10到操作数栈
        9: ireturn      //返回操作数栈顶元素 10
       10: astore_2
       11: bipush        20
       13: istore_0
       14: aload_2      //加载异常
       15: athrow       //抛出异常
      Exception table:
         from    to  target type
             3     5    10   any
```

### 2.11 synchronized

```Java
public class Code_19_SyncTest {

    public static void main(String[] args) {
        Object lock = new Object();
        synchronized (lock) {
            System.out.println("ok");
        }
    }
}
Code:
      stack=2, locals=4, args_size=1
         0: new           #2                  // class java/lang/Object
         3: dup // 复制一份栈顶，然后压入栈中。用于函数消耗
         4: invokespecial #1                  // Method java/lang/Object."<init>":()V
         7: astore_1 // 将栈顶的对象地址方法 局部变量表中 1 中
         8: aload_1 // 加载到操作数栈
         9: dup // 复制一份，放到操作数栈，用于加锁时消耗
        10: astore_2 // 将操作数栈顶元素弹出，暂存到局部变量表的 2 号槽位。这时操作数栈中有一份对象的引用
        11: monitorenter // 加锁
        12: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
        15: ldc           #4                  // String ok
        17: invokevirtual #5                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
        20: aload_2 // 加载对象到栈顶
        21: monitorexit // 释放锁
        22: goto          30
        // 异常情况的解决方案 释放锁！
        25: astore_3
        26: aload_2
        27: monitorexit
        28: aload_3
        29: athrow
        30: return
        // 异常表！
      Exception table:
         from    to  target type
            12    22    25   any
            25    28    25   any
```

## 3. 编译器处理

所谓的 **语法糖** ，其实就是指 java 编译器把 .java 源码编译为 .class 字节码的过程中，自动生成和转换的一些代码，主要是为了减轻程序员的负担，算是 java 编译器给我们的一个额外福利 **注意**，以下代码的分析，借助了 javap 工具，idea 的反编译功能，idea 插件 jclasslib 等工具。另外， 编译器转换的**结果直接就是 class 字节码**，只是为了便于阅读，给出了 几乎等价 的 java 源码方式，并不是编译器还会转换出中间的 java 源码，切记。

### 3.1 默认构造器

```Java
public class Candy1 {}
```

编译成class后的代码：

```Java
public class Candy1 {
   // 这个无参构造器是java编译器帮我们加上的
   public Candy1() {
      // 即调用父类 Object 的无参构造方法，即调用 java/lang/Object." <init>":()V
      super();
   }
}
```

### 3.2 自动拆装箱

基本类型和其包装类型的相互转换过程，称为拆装箱 在 JDK 5 以后，它们的转换可以在编译期自动完成

这个特性是 `JDK 5` 开始加入的， 如下代码 ：

```Java
public class Candy2 {
    public static void main(String[] args) {
        Integer x = 1;
        int y = x;
    }
}
```

这段代码在 `JDK 5` 之前是无法编译通过的，必须改写下面这样 :

```Java
public class Candy2 {
    public static void main(String[] args) {
        //基本类型转包装类型→装箱
        Integer x = Integer.valueOf(1);
        //包装类型转基本类型→拆箱
        int y = x.intValue();
    }
}
```

转换过程如下

```Java
public class Candy2 {
   public static void main(String[] args) {
      // 基本类型赋值给包装类型，称为装箱
      Integer x = Integer.valueOf(1);
      // 包装类型赋值给基本类型，称谓拆箱
      int y = x.intValue();
   }
}
```

### 3.3 泛型集合取值

泛型也是在 `JDK 5` 开始加入的特性，但 java 在编译泛型代码后会执行**泛型擦除** 的动作，即泛型信息在编译为字节码之后就丢失了（实际上有一些类信息没被擦除，为了反射使用），实际的类型都当做了 **Object** 类型来处理：

```Java
public class Candy3 {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10); // 实际调用的是 List.add(Object e)
        Integer x = list.get(0); // 实际调用的是 Object obj = List.get(int index);
    }
}
```

所以在取值时，编译器真正生成的字节码中，还要额外做一个类型转换的操作：

```Java
// 需要将 Object 转为 Integer
Integer x = (Integer)list.get(0);
```

如果前面的 x 变量类型修改为 int 基本类型那么最终生成的字节码是：

```Java
// 需要将 Object 转为 Integer, 并执行拆箱操作
int x = ((Integer)list.get(0)).intValue();
```

对应字节码：

```Java
Code:
    stack=2, locals=3, args_size=1
       0: new           #2                  // class java/util/ArrayList
       3: dup
       4: invokespecial #3                  // Method java/util/ArrayList."<init>":()V
       7: astore_1
       8: aload_1
       9: bipush        10
      11: invokestatic  #4                  // Method java/lang/Integer.valueOf:(I)Ljava/lang/Integer;
      //这里进行了泛型擦除，实际调用的是add(Objcet o)
      14: invokeinterface #5,  2            // InterfaceMethod java/util/List.add:(Ljava/lang/Object;)Z

      19: pop
      20: aload_1
      21: iconst_0
      //这里也进行了泛型擦除，实际调用的是get(Object o)   
      22: invokeinterface #6,  2            // InterfaceMethod java/util/List.get:(I)Ljava/lang/Object;
//这里进行了类型转换，将Object转换成了Integer
      27: checkcast     #7                  // class java/lang/Integer
      30: astore_2
      31: return
```

所以调用 get 函数取值时，有一个类型转换的操作。

```Java
Integer x = (Integer) list.get(0);
```

如果要将返回结果赋值给一个 int 类型的变量，则还有自动拆箱的操作

```Java
int x = (Integer) list.get(0).intValue();
```

### 3.4反射获取泛型信息

擦除的是字节码上的泛型信息，可以看到 LocalVariableTypeTable 仍然保留了方法参数泛型的信息

```Java
public cn.itcast.jvm.t3.candy.Candy3();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
        stack=1, locals=1, args_size=1
        0: aload_0
        1: invokespecial #1 // Method java/lang/Object."
 <init>":()V
        4: return
       LineNumberTable:
        line 6: 0
        LocalVariableTable:
        Start Length Slot Name Signature
            0     5     0 this Lcn/itcast/jvm/t3/candy/Candy3;
  public static void main(java.lang.String[]);
       descriptor: ([Ljava/lang/String;)V
       flags: ACC_PUBLIC, ACC_STATIC
       Code:
        stack=2, locals=3, args_size=1
        0: new #2 // class java/util/ArrayList
        3: dup
        4: invokespecial #3 // Method java/util/ArrayList."
        <init>":()V
        7: astore_1
        8: aload_1
        9: bipush 10
        11: invokestatic #4 // Method
        java/lang/Integer.valueOf:(I)Ljava/lang/Integer;
        14: invokeinterface #5, 2 // InterfaceMethod
        java/util/List.add:(Ljava/lang/Object;)Z
        19: pop
        20: aload_1
        21: iconst_0
        22: invokeinterface #6, 2 // InterfaceMethod
        java/util/List.get:(I)Ljava/lang/Object;
        27: checkcast #7 // class java/lang/Integer
        30: astore_2
        31: return
        LineNumberTable:
        line 8: 0
        line 9: 8
        line 10: 20
        line 11: 31
        LocalVariableTable:
        Start Length Slot Name Signature
            0     32   0  args [Ljava/lang/String;
            8     24   1  list Ljava/util/List;
        LocalVariableTypeTable:
        Start Length Slot Name Signature
            8     24  1   list Ljava/util/List<Ljava/lang/Integer;>;
```

使用反射可以得到，参数的类型以及泛型类型。泛型反射代码如下：

```Java
    public static void main(String[] args) throws NoSuchMethodException {
        // 1. 拿到方法
        Method method = Code_20_ReflectTest.class.getMethod("test", List.class, Map.class);
        // 2. 得到泛型参数的类型信息
        Type[] types = method.getGenericParameterTypes();
        for(Type type : types) {
            // 3. 判断参数类型是否，带泛型的类型。
            if(type instanceof ParameterizedType) {
                ParameterizedType parameterizedType = (ParameterizedType) type;

                // 4. 得到原始类型
                System.out.println("原始类型 - " + parameterizedType.getRawType());
                // 5. 拿到泛型类型
                Type[] arguments = parameterizedType.getActualTypeArguments();
                for(int i = 0; i < arguments.length; i++) {
                    System.out.printf("泛型参数[%d] - %s\n", i, arguments[i]);
                }
            }
        }
    }

    public Set<Integer> test(List<String> list, Map<Integer, Object> map) {
        return null;
    }
原始类型 - interface java.util.List
泛型参数[0] - class java.lang.String
原始类型 - interface java.util.Map
泛型参数[0] - class java.lang.Integer
泛型参数[1] - class java.lang.Object
```

### 3.5 可变参数

可变参数也是 JDK 5 开始加入的新特性： 例如：

```Java
public class Candy4 {
   public static void foo(String... args) {
      // 将 args 赋值给 arr ，可以看出 String... 实际就是 String[]  
      String[] arr = args;
      System.out.println(arr.length);
   }

   public static void main(String[] args) {
      foo("hello", "world");
   }
}
```

可变参数 `String... args` 其实是一个 `String[] args` ，从代码中的赋值语句中就可以看出来。 同 样 java 编译器会在编译期间将上述代码变换为：

```Java
public class Candy4 {
   public Candy4 {}
   public static void foo(String[] args) {
      String[] arr = args;
      System.out.println(arr.length);
   }

   public static void main(String[] args) {
      foo(new String[]);
   }
}
```

注意，如果调用的是 foo() ，即未传递参数时，等价代码为 foo(new String[]{}) ，创建了一个空数组，而不是直接传递的 null .

### 3.6 foreach 循环

仍是 JDK 5 开始引入的语法糖，**数组**的循环：

```Java
public class Candy5_1 {
    public static void main(String[] args) {
        int[] array = {1, 2, 3, 4, 5}; // 数组赋初值的简化写法也是语法糖哦
        for (int e : array) {
            System.out.println(e);
        }
    }
}
```

编译器会帮我们转换为

```Java
public class Candy5_1 {
    public Candy5_1() {
    }
    public static void main(String[] args) {
        int[] array = new int[]{1, 2, 3, 4, 5};
        for(int i = 0; i < array.length; ++i) {
            int e = array[i];
            System.out.println(e);
        }
    }
}
```

如果是集合使用 foreach

```Java
public class Candy5_2 {
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(1,2,3,4,5);
        for (Integer i : list) {
            System.out.println(i);
        }
    }
}
```

集合要使用 foreach ，需要该集合类实现了 Iterable 接口，因为集合的遍历需要用到迭代器 Iterator.

```Java
public class Candy5 {
    public Candy5(){}
    
   public static void main(String[] args) {
      List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
      // 获得该集合的迭代器
      Iterator<Integer> iterator = list.iterator();
      while(iterator.hasNext()) {
         Integer x = iterator.next();
         System.out.println(x);
      }
   }
}
```

**注意** ：foreach 循环写法，能够配合数组，以及所有实现了 **Iterable** 接口的集合类一起使用，其 中 Iterable 用来获取集合的迭代器（ **Iterator** ）

### 3.7 switch 字符串

从 JDK 7 开始，switch 可以作用于字符串和枚举类，这个功能其实也是语法糖，例如：

```Java
public class Cnady6 {
   public static void main(String[] args) {
      String str = "hello";
      switch (str) {
         case "hello" :
            System.out.println("h");
            break;
         case "world" :
            System.out.println("w");
            break;
         default:
            break;
      }
   }
}
```

> **注意**： switch 配合 String 和枚举使用时，变量不能为null，原因分析完语法糖转换后的代码应当自然清楚

会被编译器转换为：

```Java
public class Candy6 {
   public Candy6() {
      
   }
   public static void main(String[] args) {
      String str = "hello";
      int x = -1;
      // 通过字符串的 hashCode + value 来判断是否匹配
      switch (str.hashCode()) {
         // hello 的 hashCode
         case 99162322 :
            // 再次比较，因为字符串的 hashCode 有可能相等
            if(str.equals("hello")) {
               x = 0;
            }
            break;
         // world 的 hashCode
         case 11331880 :
            if(str.equals("world")) {
               x = 1;
            }
            break;
         default:
            break;
      }

      // 用第二个 switch 在进行输出判断
      switch (x) {
         case 0:
            System.out.println("h");
            break;
         case 1:
            System.out.println("w");
            break;
         default:
            break;
      }
   }
}
```

过程说明：

- 在编译期间，单个的 switch 被分为了两个
  - 第一个用来匹配字符串，并给 x 赋值
    - 字符串的匹配用到了字符串的 hashCode ，还用到了 equals 方法
    - 使用 hashCode 是为了提高比较效率，使用 equals 是防止有 hashCode 冲突（如 BM 和 C .）
  - 第二个用来根据x的值来决定输出语句

以看到，执行了两遍 switch，第一遍是根据字符串的 hashCode 和 equals 将字符串的转换为相应 byte 类型，第二遍才是利用 byte 执行进行比较。

> **问**：为什么第一遍时必须既比较 hashCode，又利用 equals 比较呢？hashCode 是为了提高效率，减少可能的比较；而 equals 是为了防止 hashCode 冲突。
>
> 例如 `BM` 和 `C.` 这两个字符串的hashCode值都是 2123 ，如果有如下代码：

```Java
public class Candy6_1 {
    public static void choose(String str) {
        switch (str) {
            case "BM": {
                System.out.println("h");
                break;
            }
            case "C.": {
                System.out.println("w");
                break;
            }
        }
    }
}
```

会被编译器转换为：

```Java
public class Candy6_1 {
    public Candy6_1() {
    }

    public static void choose(String var0) {
        byte var2 = -1;
        switch(var0.hashCode()) {
        case 2123:
            if (var0.equals("C.")) {
                var2 = 1;
            } else if (var0.equals("BM")) {
                var2 = 0;
            }
        default:
            switch(var2) {
            case 0:
                System.out.println("h");
                break;
            case 1:
                System.out.println("w");
            }

        }
    }
}
```

### 3.8 switch 枚举

```Java
enum SEX {
   MALE, FEMALE;
}
public class Candy7 {
   public static void main(String[] args) {
      SEX sex = SEX.MALE;
      switch (sex) {
         case MALE:
            System.out.println("man");
            break;
         case FEMALE:
            System.out.println("woman");
            break;
         default:
            break;
      }
   }
}
enum SEX {
   MALE, FEMALE;
}

public class Candy7 {
   /**     
    * 定义一个合成类（仅 jvm 使用，对我们不可见）     
    * 用来映射枚举的 ordinal 与数组元素的关系     
    * 枚举的 ordinal 表示枚举对象的序号，从 0 开始     
    * 即 MALE 的 ordinal()=0，FEMALE 的 ordinal()=1     
    */ 
   static class $MAP {
      // 数组大小即为枚举元素个数，里面存放了 case 用于比较的数字
      static int[] map = new int[2];
      static {
         // ordinal 即枚举元素对应所在的位置，MALE 为 0 ，FEMALE 为 1
         map[SEX.MALE.ordinal()] = 1;
         map[SEX.FEMALE.ordinal()] = 2;
      }
   }

   public static void main(String[] args) {
      SEX sex = SEX.MALE;
      // 将对应位置枚举元素的值赋给 x ，用于 case 操作
      int x = $MAP.map[sex.ordinal()];
      switch (x) {
         case 1:
            System.out.println("man");
            break;
         case 2:
            System.out.println("woman");
            break;
         default:
            break;
      }
   }
}
```

### 3.9 枚举类

`JDK 7` 新增了枚举类，以前面的性别枚举为例：

```Java
public enum Sex {
    MALE,FEMALE
}
```

转换后的代码

```Java
public final class Sex extends Enum<Sex> {   
   // 对应枚举类中的元素
   public static final Sex MALE;    
   public static final Sex FEMALE;    
   private static final Sex[] $VALUES;
   
    static {       
            // 调用构造函数，传入枚举元素的值及 ordinal
        MALE = new Sex("MALE", 0);    
        FEMALE = new Sex("FEMALE", 1);   
        $VALUES = new Sex[]{MALE, FEMALE}; 
   }
         
   // 调用父类中的方法
    private Sex(String name, int ordinal) {     
        super(name, ordinal);    
    }
   
    public static Sex[] values() {  
        return $VALUES.clone();  
    }
    public static Sex valueOf(String name) { 
        return Enum.valueOf(Sex.class, name);  
    } 
   
}
```

### 3.10 try-with-resources

JDK 7 开始新增了对需要关闭的资源处理的特殊语法，‘try-with-resources’

```Java
try(资源变量 = 创建资源对象) {
        
} catch() {

}
```

其中资源对象需要实现 AutoCloseable 接口，例如 InputStream 、 OutputStream 、 Connection 、 Statement 、 ResultSet 等接口都实现了 AutoCloseable ，使用 try-with- resources 可以不用写 finally 语句块，编译器会帮助生成关闭资源代码，例如：

```Java
public class Candy9 { 
        public static void main(String[] args) {
                try(InputStream is = new FileInputStream("d:\\1.txt")){        
                        System.out.println(is); 
                } catch (IOException e) { 
                        e.printStackTrace(); 
                } 
        } 
}
```

会被转换为：

```Java
public class Candy9 { 
    
    public Candy9() { }
   
    public static void main(String[] args) { 
        try {
            InputStream is = new FileInputStream("d:\\1.txt");
            Throwable t = null; 
            try {
                System.out.println(is); 
            } catch (Throwable e1) { 
                // t 是我们代码出现的异常 
                t = e1; 
                throw e1; 
            } finally {
                // 判断了资源不为空 
                if (is != null) { 
                    // 如果我们代码有异常
                    if (t != null) { 
                        try {
                            is.close(); 
                        } catch (Throwable e2) { 
                            // 如果 close 出现异常，作为被压制异常添加
                            t.addSuppressed(e2); 
                        } 
                    } else { 
                        // 如果我们代码没有异常，close 出现的异常就是最后 catch 块中的 e 
                        is.close(); 
                    } 
                } 
            } 
        } catch (IOException e) {
            e.printStackTrace(); 
        } 
    }
}
```

为什么要设计一个 addSuppressed(Throwable e) （添加被压制异常）的方法呢？是为了防止异常信息的丢失（想想 try-with-resources 生成的 fianlly 中如果抛出了异常）：

```Java
public class Test6 { 
        public static void main(String[] args) { 
                try (MyResource resource = new MyResource()) { 
                        int i = 1/0; 
                } catch (Exception e) { 
                        e.printStackTrace(); 
                } 
        } 
}
class MyResource implements AutoCloseable { 
        public void close() throws Exception { 
                throw new Exception("close 异常"); 
        } 
}
```

输出：

```Java
java.lang.ArithmeticException: / by zero 
        at test.Test6.main(Test6.java:7) 
        Suppressed: java.lang.Exception: close 异常 
                at test.MyResource.close(Test6.java:18) 
                at test.Test6.main(Test6.java:6)
```

### 3.11 方法重写时的桥接方法

- 我们都知道，方法重写时对返回值分两种情况： 父子类的返回值完全一致 子类返回值可以是父类返回值的子类（比较绕口，见下面的例子）

```Java
class A { 
        public Number m() { 
                return 1; 
        } 
}
class B extends A { 
        @Override 
        // 子类 m 方法的返回值是 Integer 是父类 m 方法返回值 Number 的子类         
        public Integer m() { 
                return 2; 
        } 
}
```

对于子类，java 编译器会做如下处理：

```Java
class B extends A { 
        public Integer m() { 
                return 2; 
        }
        // 此方法才是真正重写了父类 public Number m() 方法 
        public synthetic bridge Number m() { 
                // 调用 public Integer m() 
                return m(); 
        } 
}
```

其中桥接方法比较特殊，仅对 java 虚拟机可见，并且与原来的 public Integer m() 没有命名冲突，可以 用下面反射代码来验证：

```Java
public static void main(String[] args) {
        for(Method m : B.class.getDeclaredMethods()) {
            System.out.println(m);
        }
    }
```

结果：

```Java
public java.lang.Integer cn.ali.jvm.test.B.m()
public java.lang.Number cn.ali.jvm.test.B.m()
```

### 3.12 匿名内部类

```Java
public class Candy10 {
   public static void main(String[] args) {
      Runnable runnable = new Runnable() {
         @Override
         public void run() {
            System.out.println("running...");
         }
      };
   }
}
```

转换后的代码

```Java
public class Candy10 {
   public static void main(String[] args) {
      // 用额外创建的类来创建匿名内部类对象
      Runnable runnable = new Candy10$1();
   }
}

// 创建了一个额外的类，实现了 Runnable 接口
final class Candy10$1 implements Runnable {
   public Demo8$1() {}

   @Override
   public void run() {
      System.out.println("running...");
   }
}
```

引用局部变量的匿名内部类，源代码：

```Java
public class Candy11 { 
        public static void test(final int x) { 
                Runnable runnable = new Runnable() { 
                        @Override 
                        public void run() {         
                                System.out.println("ok:" + x); 
                        } 
                }; 
        } 
}
```

转换后代码：

```Java
// 额外生成的类 
final class Candy11$1 implements Runnable { 
        int val$x; 
        Candy11$1(int x) { 
                this.val$x = x; 
        }
        public void run() { 
                System.out.println("ok:" + this.val$x); 
        } 
}

public class Candy11 { 
        public static void test(final int x) { 
                Runnable runnable = new Candy11$1(x); 
        } 
}
```

注意：这同时解释了为什么匿名内部类引用局部变量时，局部变量必须是 final 的：因为在创建 Candy11$1 对象时，将 x 的值赋值给了 Candy11$1 对象的 值后，如果不是 final 声明的 x 值发生了改变，匿名内部类则值不一致。

这同时解释了为什么匿名内部类引用局部变量时，局部变量必须是final的：因为在创建Candy11$1对象时，将x的值赋值给了Candy11$1对象的vala属性，所以x不应该再发生变化了，如果变化，那么ualx属性没有机会再跟着一起变化

## 4. 类加载阶段

### 4.1 加载

- 将类的字节码载入方法区（1.8后为元空间，在本地内存中）中，内部采用 C++ 的 **instanceKlass** 描述 java 类，它的重要 ﬁeld 有：
  - **_java_mirror** 即 **java 的类镜像**，例如对 String 来说，它的镜像类就是 String.class，作用是把 klass 暴露给 java 使用
  - _super 即父类
  - _ﬁelds 即成员变量
  - _methods 即方法
  - _constants 即常量池
  - _class_loader 即类加载器
  - _vtable 虚方法表
  - _itable 接口方法
- 如果这个类还有父类没有加载，**先加载父类**
- 加载和链接可能是**交替运行**的
- **instanceKlass** 这样的【元数据】是存储在**方法区**（1.8 后的元空间内），但 **_java_mirror** 是存储在**堆**中，可以通过HSDB工具查看。
- instanceKlass和_java_mirror（java镜像类）互相保存了对方的地址
- 类的对象在对象头中保存了 *.class 的地址。让对象可以通过其找到方法区中的instanceKlass，从而获取类的各种信息

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151806520.png)

**注意**

- instanceKlass 这样的【元数据】是存储在方法区（1.8 后的元空间内），但 _java_mirror 是存储在堆中
- 可以通过前面介绍的 HSDB 工具查看

### 4.2 链接

#### （1）验证

验证类是否符合 JVM规范，安全性检查 用 UE 等支持二进制的编辑器修改 HelloWorld.class 的魔数，在控制台运行

#### （2）准备

为 `static` 变量分配空间，设置默认值

- static变量在JDK 7以前是存储与instanceKlass末尾。但在JDK 7以后就存储在_java_mirror末尾了
- static变量在分配空间和赋值是在两个阶段完成的。**分配空间**在**准备阶段**完成，**赋值**在**初始化阶段**完成
- 如果 static 变量是 ﬁnal 的**基本类型**，以及**字符串常量**，那么编译阶段值就确定了，**赋值在准备阶段完成**
- 如果 static 变量是 ﬁnal 的，但属于**引用类型**，那么**赋值**也会在**初始化阶段完成**

```Java
public class Code_22_AnalysisTest {


    public static void main(String[] args) throws ClassNotFoundException, IOException {
        ClassLoader classLoader = Code_22_AnalysisTest.class.getClassLoader();
        Class<?> c = classLoader.loadClass("cn.ali.jvm.test.C");

        // new C();
        System.in.read();
    }

}

class C {
    D d = new D();
}

class D {

}
```

#### （3）解析

将常量池中的符号引用解析为直接引用

```Java
package cn.itcast.jvm.t3.load;
/**
* 解析的含义
*/
public class Load2 {
    public static void main(String[] args) throws ClassNotFoundException,
    IOException {
        ClassLoader classloader = Load2.class.getClassLoader();
        // loadClass 方法不会导致类的解析和初始化
        Class<?> c = classloader.loadClass("cn.itcast.jvm.t3.load.C");
        // new C();
        System.in.read();
    }
}
class C {
    D d = new D();
}
class D {
}
```

### 4-3 初始化

#### （1）<cinit>()v 方法

初始化即调用 `<cinit>()`V，虚拟机会保证这个类的【构造方法】的线程安全

#### （2）发生的时机

**类的初始化的懒惰的**，以下情况会初始化：

- main 方法所在的类，总会被首先初始化
- 首次访问这个类的静态变量或静态方法时
- 子类初始化，如果父类还没初始化，会引发
- 子类访问父类的静态变量，只会触发父类的初始化
- `Class.forName`
- new 会导致初始化

以下情况不会初始化：

- 访问类的 static ﬁnal 静态常量（基本类型和字符串）
- 类对象.class 不会触发初始化
- 创建该类对象的数组
- 类加载器的.loadClass方法
- `Class.forName`的参数2为false时

**验证类是否被初始化，可以看改类的静态代码块是否被执行**

这里一个例子来验证：（实验时请先全部注释，每次只执行其中一个）

```Java
public class Load3 {
    static {
        System.out.println("main init");
    }
    public static void main(String[] args) throws ClassNotFoundException {
        // 1. 静态常量（基本类型和字符串）不会触发初始化
        System.out.println(B.b);
        // 2. 类对象.class 不会触发初始化
        System.out.println(B.class);
        // 3. 创建该类的数组不会触发初始化
        System.out.println(new B[0]);
        // 4. 不会初始化类 B，但会加载 B、A
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        cl.loadClass("cn.itcast.jvm.t3.B");
        // 5. 不会初始化类 B，但会加载 B、A
        ClassLoader c2 = Thread.currentThread().getContextClassLoader();
        Class.forName("cn.itcast.jvm.t3.B", false, c2);
        
        // 1. 首次访问这个类的静态变量或静态方法时
        System.out.println(A.a);
        // 2. 子类初始化，如果父类还没初始化，会引发
        System.out.println(B.c);
        // 3. 子类访问父类静态变量，只触发父类初始化
        System.out.println(B.a);
        // 4. 会初始化类 B，并先初始化类 A
        Class.forName("cn.itcast.jvm.t3.B");
    }
}
class A {
    static int a = 0;
    static {
        System.out.println("a init");
    }
}
class B extends A {
    final static double b = 5.0;
    static boolean c = false;
    static {
        System.out.println("b init");
    }
}
```

### 4）练习

从字节码分析，使用 a，b，c 这三个常量是否会导致 E 初始化

```Java
public class Load2 {

    public static void main(String[] args) {
        System.out.println(E.a);
        System.out.println(E.b);
        // 会导致 E 类初始化，因为 Integer 是包装类
        System.out.println(E.c);
    }
}

class E {
    public static final int a = 10;
    public static final String b = "hello";
    public static final Integer c = 20;

    static {
        System.out.println("E cinit");
    }
}
```

典型应用 - 完成懒惰初始化单例模式

```Java
public class Singleton {

    private Singleton() { } 
    // 内部类中保存单例
    private static class LazyHolder { 
        static final Singleton INSTANCE = new Singleton(); 
    }
    // 第一次调用 getInstance 方法，才会导致内部类加载和初始化其静态成员 
    public static Singleton getInstance() { 
        return LazyHolder.INSTANCE; 
    }
}
```

以上的实现特点是：

- 懒惰实例化
- 初始化时的线程安全是有保障的

## 5.类加载器

类加载器虽然只用于实现类的加载动作，但它在Java程序中起到的作用却远超类加载阶段 对于任意一个类，都必须由加载它的类加载器和这个类本身一起共同确立其在 Java 虚拟机中的唯一性，每一个类加载器，都拥有一个独立的类名称空间。这句话可以表达得更通俗一些：比较两个类是否“相等”，只有在这两个类是由同一个类加载器加载的前提下才有意义，否则，即使这两个类来源于同一个 Class 文件，被同一个 Java 虚拟机加载，只要加载它们的类加载器不同，那这两个类就必定不相等！

以 JDK 8 为例：

名称加载的类说明

| 名称                                      | 加载的类              | 说明                        |
| ----------------------------------------- | --------------------- | --------------------------- |
| Bootstrap ClassLoader（启动类加载器）     | JAVA_HOME/jre/lib     | 无法直接访问                |
| Extension ClassLoader(拓展类加载器)       | JAVA_HOME/jre/lib/ext | 上级为Bootstrap，显示为null |
| Application ClassLoader(应用程序类加载器) | classpath             | 上级为Extension             |
| 自定义类加载器                            | 自定义                | 上级为Application           |

### 5.1 启动类的加载器

可通过在控制台输入指令，使得类被启动类加器加载

用 Bootstrap 类加载器加载类：

```Java
package cn.itcast.jvm.t3.load;
public class F {
    static {
        System.out.println("bootstrap F init");
    }
}
package cn.itcast.jvm.t3.load;
public class Load5_1 {
    public static void main(String[] args) throws ClassNotFoundException {
        Class<?> aClass = Class.forName("cn.itcast.jvm.t3.load.F");
        System.out.println(aClass.getClassLoader());
    }
}
E:\git\jvm\out\production\jvm>java -Xbootclasspath/a:.
cn.itcast.jvm.t3.load.Load5
bootstrap F init
null
```

- -Xbootclasspath 表示设置 bootclasspath
- 其中 /a:. 表示将当前目录追加至 bootclasspath 之后
- 可以用这个办法替换核心类
  - `java -Xbootclasspath:<new bootclasspath>`
- 也可以追加
  - `java -Xbootclasspath/a:<追加路径>`（后追加）
  - `java -Xbootclasspath/p:<追加路径>`（前追加）

### 5.2 扩展类的加载器

如果 classpath 和 JAVA_HOME/jre/lib/ext 下有同名类，加载时会使用拓展类加载器加载。当应用程序类加载器发现拓展类加载器已将该同名类加载过了，则不会再次加载。

```Java
package cn.itcast.jvm.t3.load;
public class G {
    static {
    System.out.println("classpath G init");
    }
}
classpath G init
sun.misc.Launcher$AppClassLoader@18b4aac2
package cn.itcast.jvm.t3.load;
    public class G {
        static {
        System.out.println("ext G init");
    }
}
E:\git\jvm\out\production\jvm>jar -cvf my.jar cn/itcast/jvm/t3/load/G.class
已添加清单
正在添加: cn/itcast/jvm/t3/load/G.class(输入 = 481) (输出 = 322)(压缩了 33%)
```

将 jar 包拷贝到 JAVA_HOME/jre/lib/ext

重新执行 Load5_2

输出

```Java
ext G init
sun.misc.Launcher$ExtClassLoader@29453f44
```

### 5.3 双亲委派模式

- 当AppClassLoader加载一个class时，它首先不会自己去尝试加载这个类，而是把类加载请求委派给父类加载器ExtClassLoader去完成。
- 当ExtClassLoader加载一个class时，它首先也不会自己去尝试加载这个类，而是把类加载请求委派给BootStrapClassLoader去完成。
- 如果BootStrapClassLoader加载失败(例如在$JAVA_HOME/jre/lib里未查找到该class)，会使用ExtClassLoader来尝试加载；
- 若ExtClassLoader也加载失败，则会使用AppClassLoader来加载，如果AppClassLoader也加载失败，则会报出异常ClassNotFoundException。

所谓的**双亲委派**，就是指调用类加载器的 **loadClass** 方法时，查找类的规则

loadClass源码

```Java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // 首先查找该类是否已经被该类加载器加载过了
        Class<?> c = findLoadedClass(name);
        // 如果没有被加载过
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                // 看是否被它的上级加载器加载过了 Extension 的上级是Bootstarp，但它显示为null
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    // 看是否被启动类加载器加载过
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // ClassNotFoundException thrown if class not found
                // from the non-null parent class loader
                //捕获异常，但不做任何处理
            }

            if (c == null) {
                // 如果还是没有找到，先让拓展类加载器调用 findClass 方法去找到该类，如果还是没找到，就抛出异常
                // 然后让应用类加载器去找 classpath 下找该类
                long t1 = System.nanoTime();
                c = findClass(name);

                // 记录时间
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

### 5.4 自定义类加载器

**使用场景**

- 想加载非 classpath 随意路径中的类文件
- 通过接口来使用实现，希望解耦时，常用在框架设计
- 这些类希望予以隔离，不同应用的同名类都可以加载，不冲突，常见于 tomcat 容器

**步骤**

- 继承 ClassLoader 父类
- 要遵从双亲委派机制，重写 ﬁndClass 方法
  不是重写 loadClass 方法，否则不会走双亲委派机制
- 读取类文件的字节码
- 调用父类的 deﬁneClass 方法来加载类
- 使用者调用该类加载器的 loadClass 方法

**破坏双亲委派模式**

- 双亲委派模型的第一次“被破坏”其实发生在双亲委派模型出现之前——即JDK1.2面世以前的“远古”时代
  - 建议用户重写findClass()方法，在类加载器中的loadClass()方法中也会调用该方法
- 双亲委派模型的第二次“被破坏”是由这个模型自身的缺陷导致的
  - 如果有基础类型又要调用回用户的代码，此时也会破坏双亲委派模式
- 双亲委派模型的第三次“被破坏”是由于用户对程序动态性的追求而导致的
  - 这里所说的“动态性”指的是一些非常“热”门的名词：代码热替换（Hot Swap）、模块热部署（Hot Deployment）等

### 5.5 线程上下文类加载器

#### 背景

我们在使用 JDBC 时，都需要加载 Driver 驱动，不知道你注意到没有，不写

```java
Class.forName("com.mysql.jdbc.Driver")
```

也是可以让 com.mysql.jdbc.Driver 正确加载的，你知道是怎么做的吗？
让我们追踪一下源码：

```java
public class DriverManager {
    // 注册驱动的集合
    private final static CopyOnWriteArrayList<DriverInfo> registeredDrivers
    = new CopyOnWriteArrayList<>();
    // 初始化驱动
    static {
    loadInitialDrivers();
    println("JDBC DriverManager initialized");
}

```

先不看别的，看看 DriverManager 的类加载器：

```java
System.out.println(DriverManager.class.getClassLoader());
```

打印 null，表示它的类加载器是 Bootstrap ClassLoader，会到 JAVA_HOME/jre/lib 下搜索类，但 
JAVA_HOME/jre/lib 下显然没有 mysql-connector-java-5.1.47.jar 包，这样问题来了，在
DriverManager 的静态代码块中，怎么能正确加载 com.mysql.jdbc.Driver 呢？

#### SPI 服务提供接口

继续看 loadInitialDrivers() 方法：

```java
private static void loadInitialDrivers() {
    String drivers;
    try {
        drivers = AccessController.doPrivileged(new PrivilegedAction<String>
                () {
            public String run() {
                return System.getProperty("jdbc.drivers");
            }
        });
    } catch (Exception ex) {
        drivers = null;
    }
// 1）使用 ServiceLoader 机制加载驱动，即 SPI
    AccessController.doPrivileged(new PrivilegedAction<Void>() {
        public Void run() {
            ServiceLoader<Driver> loadedDrivers =
                    ServiceLoader.load(Driver.class);
            Iterator<Driver> driversIterator = loadedDrivers.iterator();
            try{
                while(driversIterator.hasNext()) {
                    driversIterator.next();
                }
            } catch(Throwable t) {
// Do nothing
            }
            return null;
        }
    });
    println("DriverManager.initialize: jdbc.drivers = " + drivers);
// 2）使用 jdbc.drivers 定义的驱动名加载驱动
    if (drivers == null || drivers.equals("")) {
        return;
    }
    String[] driversList = drivers.split(":");
    println("number of Drivers:" + driversList.length);
    for (String aDriver : driversList) {
        try {
            println("DriverManager.Initialize: loading " + aDriver);
// 这里的 ClassLoader.getSystemClassLoader() 就是应用程序类加载器
            Class.forName(aDriver, true,
                    ClassLoader.getSystemClassLoader());
        } catch (Exception ex) {
            println("DriverManager.Initialize: load failed: " + ex);
        }
    }
}
```

先看 2）发现它最后是使用 Class.forName 完成类的加载和初始化，关联的是应用程序类加载器，因此
可以顺利完成类加载
再看 1）它就是大名鼎鼎的 Service Provider Interface （SPI）
约定如下，在 jar 包的 META-INF/services 包下，以接口全限定名名为文件，文件内容是实现类名称

![image-20240715200831758](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152008060.png)

#### 使用

这样就可以使用

```java
ServiceLoader<接口类型> allImpls = ServiceLoader.load(接口类型.class);
Iterator<接口类型> iter = allImpls.iterator();
while(iter.hasNext()) {
        iter.next();
}
```

来得到实现类，体现的是【面向接口编程+解耦】的思想，在下面一些框架中都运用了此思想：

- JDBC
- Servlet 初始化器
- Spring 容器
- Dubbo（对 SPI 进行了扩展）

#### 原理

接着看 ServiceLoader.load 方法:

```java
public static <S> ServiceLoader<S> load(Class<S> service) {
// 获取线程上下文类加载器
    ClassLoader cl = Thread.currentThread().getContextClassLoader();
    return ServiceLoader.load(service, cl);
}
```

线程上下文类加载器是当前线程使用的类加载器，默认就是应用程序类加载器，它内部又是由
Class.forName 调用了线程上下文类加载器完成类加载，具体代码在 ServiceLoader 的内部类
LazyIterator 中：

```java
private S nextService() {
    if (!hasNextService())
        throw new NoSuchElementException();
    String cn = nextName;
    nextName = null;
    Class<?> c = null;
    try {
        c = Class.forName(cn, false, loader);
    } catch (ClassNotFoundException x) {
        fail(service,
        "Provider " + cn + " not found");
    }
    if (!service.isAssignableFrom(c)) {
        fail(service,
                "Provider " + cn + " not a subtype");
    }
    try {
        S p = service.cast(c.newInstance());
        providers.put(cn, p);
        return p;
    } catch (Throwable x) {
        fail(service,
                "Provider " + cn + " could not be instantiated",
                x);
    }
    throw new Error(); // This cannot happen
}
```



## 6、运行期优化

### 6.1 即时编译

#### （1）分层编译

JVM 将执行状态分成了 5 个层次：

- 0层：解释执行，用解释器将字节码翻译为机器码
- 1层：使用 C1 **即时编译器**编译执行（不带 proﬁling）
- 2层：使用 C1 即时编译器编译执行（带基本的profiling）
- 3层：使用 C1 即时编译器编译执行（带完全的profiling）
- 4层：使用 C2 即时编译器编译执行

> proﬁling 是指在运行过程中收集一些程序执行状态的数据，例如【方法的调用次数】，【循环的 回边次数】等

```java
public class JIT1 {
    public static void main(String[] args) {
        for (int i = 0; i < 200; i++) {
            long start = System.nanoTime();
            for (int j = 0; j < 1000; j++) {
                new Object();
            }
            long end = System.nanoTime();
            System.out.printf("%d\t%d\n",i,(end - start));
        }
    }
}
```

**即时编译器（JIT）与解释器的区别**：

- 解释器
  - 将字节码**解释**为机器码，下次即使遇到相同的字节码，仍会执行重复的解释
  - 是将字节码解释为针对所有平台都通用的机器码
- 即时编译器
  - 将一些字节码**编译**为机器码，**并存入 Code Cache**，下次遇到相同的代码，直接执行，无需再编译
  - 根据平台类型，生成平台特定的机器码

对于大部分的不常用的代码，我们无需耗费时间将其编译成机器码，而是采取解释执行的方式运行；另一方面，对于仅占据小部分的热点代码，我们则可以将其编译成机器码，以达到理想的运行速度。 执行效率上简单比较一下 Interpreter < C1 < C2，总的目标是发现热点代码（hotspot名称的由 来），并优化这些热点代码

**逃逸分析**：

发现新建的对象是否逃逸。可以使用 `-XX:- DoEscapeAnalysis` 关闭逃逸分析

#### （2）方法内联

举个栗子：

```java
private static int square(final int i) {
    return i * i;
}
```

```java
System.out.println(square(9));
```

如果发现 square 是热点方法，并且长度不太长时，会进行**内联**，所谓的内联就是把方法内代码拷贝、 粘贴到调用者的位置：

```java
System.out.println(9 * 9);
```

还能够进行**常量折叠**（constant folding）的优化

```java
System.out.println(8);
```

```java
public class JIT2 {
    // -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining （解锁隐藏参数）打印
    inlining 信息
    // -XX:CompileCommand=dontinline,*JIT2.square 禁止某个方法 inlining
// -XX:+PrintCompilation 打印编译信息
    public static void main(String[] args) {
        int x = 0;
        for (int i = 0; i < 500; i++) {
            long start = System.nanoTime();
            for (int j = 0; j < 1000; j++) {
                x = square(9);
            }
            long end = System.nanoTime();
            System.out.printf("%d\t%d\t%d\n",i,x,(end - start));
        }
    }
    private static int square(final int i) {
        return i * i;
    }
}
```



#### （3）字段优化

JMH 基准测试请参考：http://openjdk.java.net/projects/code-tools/jmh/
创建 maven 工程，添加依赖如下

```xml
<dependency>
<groupId>org.openjdk.jmh</groupId>
<artifactId>jmh-core</artifactId>
<version>${jmh.version}</version>
</dependency>
<dependency>
<groupId>org.openjdk.jmh</groupId>
<artifactId>jmh-generator-annprocess</artifactId>
<version>${jmh.version}</version>
<scope>provided</scope>
</dependency>
```



```java
package test;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
@Warmup(iterations = 2, time = 1)
@Measurement(iterations = 5, time = 1)
@State(Scope.Benchmark)
public class Benchmark1 {
    int[] elements = randomInts(1_000);
    private static int[] randomInts(int size) {
        Random random = ThreadLocalRandom.current();
        int[] values = new int[size];
        for (int i = 0; i < size; i++) {
            values[i] = random.nextInt();
        }
        return values;
    }
    @Benchmark
    public void test1() {
        for (int i = 0; i < elements.length; i++) {
            doSum(elements[i]);
        }
    }
    @Benchmark
    public void test2() {
        int[] local = this.elements;
        for (int i = 0; i < local.length; i++) {
            doSum(local[i]);
        }
    }
    @Benchmark
    public void test3() {
        for (int element : elements) {
            doSum(element);
        }
    }
    static int sum = 0;
    @CompilerControl(CompilerControl.Mode.INLINE)
    static void doSum(int x) {
        sum += x;
    }
    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
                .include(Benchmark1.class.getSimpleName())
                .forks(1)
                .build();
        new Runner(opt).run();
    }
}
```

首先启用 doSum 的方法内联，测试结果如下（每秒吞吐量，分数越高的更好）：

```java
Benchmark Mode Samples Score Score error Units
t.Benchmark1.test1 thrpt 5 2420286.539 390747.467 ops/s
t.Benchmark1.test2 thrpt 5 2544313.594 91304.136 ops/s
t.Benchmark1.test3 thrpt 5 2469176.697 450570.647 ops/s
```

接下来禁用 doSum 方法内联

```java
@CompilerControl(CompilerControl.Mode.DONT_INLINE)
static void doSum(int x) {
sum += x;
}
```

测试结果如下：

```java
Benchmark Mode Samples Score Score error Units
t.Benchmark1.test1 thrpt 5 296141.478 63649.220 ops/s
t.Benchmark1.test2 thrpt 5 371262.351 83890.984 ops/s
t.Benchmark1.test3 thrpt 5 368960.847 60163.391 ops/s

```

分析：
在刚才的示例中，doSum 方法是否内联会影响 elements 成员变量读取的优化：
如果 doSum 方法内联了，刚才的 test1 方法会被优化成下面的样子（伪代码）：

```java
@Benchmark
public void test1() {
// elements.length 首次读取会缓存起来 -> int[] local
for (int i = 0; i < elements.length; i++) { // 后续 999 次 求长度 <- local
sum += elements[i]; // 1000 次取下标 i 的元素 <- local
   }
}
```

可以节省 1999 次 Field 读取操作
但如果 doSum 方法没有内联，则不会进行上面的优化
练习：在内联情况下将 elements 添加 volatile 修饰符，观察测试结果





### 6.2 反射优化

```java
public class Reflect1 {
   public static void foo() {
      System.out.println("foo...");
   }

   public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
      Method foo = Demo3.class.getMethod("foo");
      for(int i = 0; i<=16; i++) {
         foo.invoke(null);
      }
   }
}
```

foo.invoke 前面 0 ~ 15 次调用使用的是 MethodAccessor 的 NativeMethodAccessorImpl 实现
invoke 方法源码

```java
import java.lang.reflect.Method;
import sun.reflect.misc.ReflectUtil;
class NativeMethodAccessorImpl extends MethodAccessorImpl {
    private final Method method;
    private DelegatingMethodAccessorImpl parent;
    private int numInvocations;
    NativeMethodAccessorImpl(Method method) {
        this.method = method;
    }
    public Object invoke(Object target, Object[] args)
            throws IllegalArgumentException, InvocationTargetException {
// inflationThreshold 膨胀阈值，默认 15
        if (++this.numInvocations > ReflectionFactory.inflationThreshold()
                && !ReflectUtil.isVMAnonymousClass(this.method.getDeclaringClass()))
        {
// 使用 ASM 动态生成的新实现代替本地实现，速度较本地实现快 20 倍左右
            MethodAccessorImpl generatedMethodAccessor =
                    (MethodAccessorImpl)
                            (new MethodAccessorGenerator())
                                    .generateMethod(
                                            this.method.getDeclaringClass(),
                                            this.method.getName(),
                                            this.method.getParameterTypes(),
                                            this.method.getReturnType(),
                                            this.method.getExceptionTypes(),
                                            this.method.getModifiers()
                                    );
            this.parent.setDelegate(generatedMethodAccessor);
        }
// 调用本地实现
        return invoke0(this.method, target, args);
    }
    void setParent(DelegatingMethodAccessorImpl parent) {
        this.parent = parent;
    }
    private static native Object invoke0(Method method, Object target, Object[]
            args);
}
```

当调用到第 16 次（从0开始算）时，会采用运行时生成的类代替掉最初的实现，可以通过 debug 得到
类名为 sun.reflect.GeneratedMethodAccessor1
可以使用阿里的 arthas 工具查看：

java -jar arthas-boot.jar

# 四、内存模型

- 很多人将【java 内存结构】与【java 内存模型】傻傻分不清，【java 内存模型】是 Java Memory Model（**JMM**）的意思。
- 简单的说，**JMM** 定义了一套在多线程读写共享数据时（成员变量、数组）时，对数据的**可见性**、**有序性**、和**原子性**的规则和保障
- JMM 即 Java Memory Model，它定义了主存（共享内存）、工作内存（线程私有）抽象概念，底层对应着 CPU 寄存器、缓存、硬件内存、 CPU 指令优化等。
  JMM 体现在以下几个方面
  - 原子性 - 保证指令不会受到线程上下文切换的影响
  - 可见性 - 保证指令不会受 cpu 缓存的影响
  - 有序性 - 保证指令不会受 cpu 指令并行优化的影响

## 1. 原子性

### 1-1 问题解析

提出问题：两个线程对初始值为 0 的静态变量一个做自增，一个做自减，各做 5000 次，结果是 0 吗？

```java
public class Demo1 {
    static int i = 0;

    public static void main(String[] args) throws InterruptedException {

        Thread t1 = new Thread(() -> {
            for (int j = 0; j < 50000; j++) {
                i++;
            }
        });
        Thread t2 = new Thread(() -> {
            for (int j = 0; j < 50000; j++) {
                i--;
            }
        });
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(i);

    }
}
```

以上的结果可能是正数、负数、零。为什么呢？因为 Java 中**对静态变量的自增，自减**并**不是原子操作**。

例如对于 `i++` 而言（i 为静态变量），实际会产生如下的 JVM 字节码指令：

```java
getstatic i // 获取静态变量i的值
iconst_1 // 准备常量1
iadd // 加法
putstatic i // 将修改后的值存入静态变量i

```

而对应 `i--` 也是类似：

```java
getstatic i // 获取静态变量i的值
iconst_1 // 准备常量1
isub // 减法
putstatic i // 将修改后的值存入静态变量i

```

而 Java 的内存模型如下，完成静态变量的自增，自减需要在**主存**和**线程内存**中进行数据交换：

![image-20240715213034845](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152130988.png)

如果是单线程以上 8 行代码是顺序执行（不会交错）没有问题：

```java
// 假设i的初始值为0
getstatic i // 线程1-获取静态变量i的值 线程内i=0
iconst_1 // 线程1-准备常量1
iadd // 线程1-自增 线程内i=1
putstatic i // 线程1-将修改后的值存入静态变量i 静态变量i=1
getstatic i // 线程1-获取静态变量i的值 线程内i=1
iconst_1 // 线程1-准备常量1
isub // 线程1-自减 线程内i=0
putstatic i // 线程1-将修改后的值存入静态变量i 静态变量i=0
```

但多线程下这 8 行代码可能交错运行（为什么会交错？思考一下）： 出现负数的情况：

```java
// 假设i的初始值为0
getstatic i // 线程1-获取静态变量i的值 线程内i=0
getstatic i // 线程2-获取静态变量i的值 线程内i=0
iconst_1 // 线程1-准备常量1
iadd // 线程1-自增 线程内i=1
putstatic i // 线程1-将修改后的值存入静态变量i 静态变量i=1
iconst_1 // 线程2-准备常量1
isub // 线程2-自减 线程内i=-1
putstatic i // 线程2-将修改后的值存入静态变量i 静态变量i=-1
```

出现正数的情况：

```java
// 假设i的初始值为0
getstatic i // 线程1-获取静态变量i的值 线程内i=0
getstatic i // 线程2-获取静态变量i的值 线程内i=0
iconst_1 // 线程1-准备常量1
iadd // 线程1-自增 线程内i=1
iconst_1 // 线程2-准备常量1
isub // 线程2-自减 线程内i=-1
putstatic i // 线程2-将修改后的值存入静态变量i 静态变量i=-1
putstatic i // 线程1-将修改后的值存入静态变量i 静态变量i=1
```

### 1-2 解决方法 -加锁

#### （1）synchronized（同步关键字）

语法：

```java
synchronized( 对象 ) {
    要作为原子操作代码
}
```

用 `synchronized` 解决并发问题：

```java
public class Demo1 {
    static int i = 0;
    static Object obj = new Object();

    public static void main(String[] args) throws InterruptedException {

        Thread t1 = new Thread(() -> {
            for (int j = 0; j < 50000; j++) {
                synchronized (obj) {
                    i++;
                }

            }
        });
        Thread t2 = new Thread(() -> {
            for (int j = 0; j < 50000; j++) {
                synchronized (obj) {
                    i--;
                }
            }
        });
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(i);//输出为0
    }
}
```

> 为什么需要这里的 `obj` 对象呢？

我们可以这样理解：可以把 obj 想象成一个房间，线程 t1，t2 想象成两个人。

当线程 t1 执行到 `synchronized(obj)` 时就好比 t1 进入了这个房间，并反手锁住了门，在门内执行 count++ 代码。

这时候如果 t2 也运行到了 `synchronized(obj)` 时，它发现门被锁住了，只能在门外等待。

当 t1 执行完 `synchronized{}` 块内的代码，这时候才会解开门上的锁，从 obj 房间出来。t2 线程这时才可以进入 obj 房间，反锁住门，执行它的 count-- 代码。

> 怎么从JVM角度理解呢？（这里引用《Java并发编程的艺术》里的一段话）

从JVM规范中可以看到`Synchonized`在JVM里的实现原理，JVM基于进入和退出`Monitor`对象来实现方法同步和代码块同步，但两者的实现细节不一样。代码块同步是使用`monitorenter` 和`monitorexit`指令实现的。 `monitorenter`指令是在编译后插入到同步代码块的**开始位置**，而`monitorexit`是插入到**方法结束处**和**异常处**，JVM要保证每个`monitorenter`必须有对应的`monitorexit`与之配对。任何对象都有一个`monitor`与之关联，当且一个`monitor`被持有后，它将处于锁定状态。线程执行到`monitorenter` 指令时，将会尝试获取对象所对应的`monitor`的所有权，即尝试获得对象的锁。

## 2.可见性

#### 2-1 退不出的循环

先来看一个现象，main 线程对 run 变量的修改对于 t 线程不可见，导致了 t 线程无法停止：

```java
static boolean run = true;
public static void main(String[] args) throws InterruptedException {
    Thread t = new Thread(()->{
        while(run){
            // ....
        }
    });
    t.start();
    Thread.sleep(1000);
    run = false; // 线程t不会如预想的停下来
}
```

为什么会这样？

1.    初始状态， t 线程刚开始从主内存读取了 run 的值到工作内存。

![image-20240715222147607](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152221819.png)

2. 因为 t 线程要频繁从**主内存**中读取 run 的值，**JIT 编译器**会将 run 的值缓存至自己工作内存中的**高速缓存**中，减少对主存中 run 的访问，提高效率

![image-20240715222337696](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152223824.png)

3. 1 秒之后，main 线程修改了 run 的值，并同步至主存，而 t 是从自己工作内存中的高速缓存中读取这个变量的值，结果永远是旧值

![image-20240715222432570](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152224719.png)

#### 2-2 解决办法

##### （1）volatile（易变关键字）

它可以用来修饰**成员变量**和**静态成员变量**，他可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，线程操作 **volatile** 变量都是直接操作主存，保证了共享变量的**可见性**，但**不能保证原子性**

```java
public class Demo1 {
    volatile static boolean run = true;

    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> {
            while (run) {
// ....
            }
        });
        t.start();
        Thread.sleep(1000);
        run = false; // 线程t如预想的停下来
    }

}
```

> **注意**：
>
> `synchronized` 语句块既可以保证代码块的**原子性**，也同时保证代码块内变量的**可见性**。但 缺点是`synchronized`是属于重量级操作，**性能相对更低**
>
> 如果在前面示例的死循环中加入 `System.out.println()` 会发现即使不加 volatile 修饰符，线程 t 也 能正确看到对 run 变量的修改了，想一想为什么？

进入`println`源码：

```java
public void println(int x) {
    synchronized (this) {
        print(x);
        newLine();
    }
}
```

可以看出加了`synchronized`，保证了每次`run`变量都会从主存中获取

### 2-3 可见性

前面例子体现的实际就是可见性，它保证的是在多个线程之间，一个线程对 volatile 变量的修改对另一
个线程可见， 不能保证原子性，仅用在一个写线程，多个读线程的情况：
上例从字节码理解是这样的：

```java
getstatic run // 线程 t 获取 run true
getstatic run // 线程 t 获取 run true
getstatic run // 线程 t 获取 run true
getstatic run // 线程 t 获取 run true
putstatic run // 线程 main 修改 run 为 false， 仅此一次
getstatic run // 线程 t 获取 run false
```

比较一下之前我们将线程安全时举的例子：两个线程一个 i++ 一个 i-- ，只能保证看到最新值，不能解
决指令交错

```java
// 假设i的初始值为0
getstatic i // 线程1-获取静态变量i的值 线程内i=0
getstatic i // 线程2-获取静态变量i的值 线程内i=0
iconst_1 // 线程1-准备常量1
iadd // 线程1-自增 线程内i=1
putstatic i // 线程1-将修改后的值存入静态变量i 静态变量i=1
iconst_1 // 线程2-准备常量1
isub // 线程2-自减 线程内i=-1
putstatic i // 线程2-将修改后的值存入静态变量i 静态变量i=-1

```



虚拟机调优

# 参考：

参考文章：https://blog.csdn.net/qq_45966440/article/details/120824295?spm=1001.2014.3001.5502

参考文章：https://blog.csdn.net/weixin_50280576/article/details/113742011

参考视频：https://www.bilibili.com/video/BV1yE411Z7AP?p=19&spm_id_from=pageDriver&vd_source=cd81f8812505504b960957155cd81114