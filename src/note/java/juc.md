---
# 这是文章的标题
title: Java并发包
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

Java 并发包

<!-- more -->

JUC是指package java.util.concurrent;这个并发包。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329333.png)

这个包是为了解决并发问题的。有atomic子包，locks子包，Semaphore，Threadlocal，ThreadPoolExecutor，Excutor，CyclicBarrier，Future，

# 线程间通信机制

讲到并发，那要先提一下线程间是如何通信的，简单来说线程有两种通信方式，一种是基于共享内存的，一种是基于消息传递的。Java里面是基于内存共享来进行线程间的通信，golang里面的协程（类似于操作系统的线程，线程是CPU调度的最小单位，协程是在线程的基础上再细分出来的一个调度的最小单位）可以通过管道进行消息传递来实现协程间的通信。

# 线程同步机制

线程同步是一种机制，用于控制多个线程访问共享资源（如内存、文件、数据库等）的方式，以避免数据不一致或竞态条件的问题。在 Java 中，线程同步通常通过以下几种方式实现：

1. **互斥锁****（Mutexes）**：通过 `synchronized` 关键字或 `java.util.concurrent.locks.Lock` 接口的实现（如 `ReentrantLock`）来保证同一时间只有一个线程可以访问特定的代码块或资源。
2. **原子操作**：使用 `java.util.concurrent.atomic` 包中的原子类（如 `AtomicInteger`、`AtomicReference` 等）来执行不可中断的操作。
3. **volatile 关键字**：确保对变量的读写操作直接在主内存中进行，而不是在各个线程的缓存中，以此保证变量的一致性。
4. **final 关键字**：确保对象的引用在构造之后不会改变，保证对象初始化的安全性。

线程同步的目的是确保当一个线程正在使用某个资源时，其他线程不会同时修改这个资源，从而防止数据竞争和不一致。

# 线程通信

线程通信是指线程之间相互发送信号和交换数据的过程。线程通信通常用于以下场景：

1. **协调任务执行**：线程可能需要等待其他线程完成某些操作后才能继续执行。
2. **数据共享**：线程可能需要向其他线程提供数据或者从其他线程接收数据。

在 Java 中，线程通信通常通过以下几种方式实现：

1. **等待/通知机制**：通过 `Object` 类的 `wait()`、`notify()` 和 `notifyAll()` 方法实现。一个线程可以调用 `wait()` 方法暂停执行并等待其他线程通过 `notify()` 或 `notifyAll()` 方法唤醒它。
2. **条件变量**：通过 `java.util.concurrent.locks.Condition` 接口实现，与 `ReentrantLock` 结合使用，提供了更灵活的线程通信方式。
3. **CountDownLatch、CyclicBarrier、****Semaphore** 等同步器：提供更高级的线程通信和同步机制。

## Wait notify原理

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329791.png)

- Owner 线程发现条件不满足，调用 wait 方法，即可进入 WaitSet 变为 WAITING 状态
- BLOCKED 和 WAITING 的线程都处于阻塞状态，不占用 CPU 时间片
- BLOCKED 线程会在 Owner 线程释放锁时唤醒
- WAITING 线程会在 Owner 线程调用 notify 或 notifyAll 时唤醒，但唤醒后并不意味者立刻获得锁，仍需进入
- EntryList 重新竞争

## join原理

```Java
//是调用者轮询检查线程 alive 状态
t1.join();
等价于下面的代码
synchronized (t1) {
 // 调用者线程进入 t1 的 waitSet 等待, 直到 t1 运行结束
 while (t1.isAlive()) {
 t1.wait(0);
 }
}
```

> **注意** **join 体现的是【保护性暂停】模式，请参考之**

## Park unpark原理

```Java
// 暂停当前线程
LockSupport.park();
// 恢复某个线程的运行
LockSupport.unpark(暂停线程对象);
```

每个线程都有自己的一个 Parker 对象，由三部分组成 _counter ， _cond 和 _mutex 打个比喻

_counter 理解成订单，_cond 理解成停车场，_mutex是互斥锁。

把Park 理解成泊车，把unpark理解成出车。跟现实的司机很像，这里代入一下。

可以先Park 后unpark，也可以先unpark后Park 。

### 先Park 后unpark

执行Park ，司机在停车场停车休息，阻塞等待订单。

执行unpark，下了个订单，司机那边收到就开始工作。

### 先unpark后Park

执行unpark，先下个单，等司机来接。

执行Park ，开车不能玩手机，司机停车的时候发现有个订单，立马处理，不用阻塞等待。这里跟现实不一样，这里必须是司机停车的时候才能接单。

## 与 Object 的 wait & notify相比

- wait, notify 和 notifyAll 必须配合 Object Monitor 一起使用,而 park, unpark不必
- park & unpark是以线程为单位来【阻塞】和【唤醒】线程，而 notify 只能随机唤醒一个等待线程， notifyAll 是唤醒所有等待线程，就不那么【精确】
- park & unpark可以先 unpark, 而 wait & notify 不能先 notify

# 线程同步和线程通信的关系

线程同步和线程通信虽然密切相关，但它们的关注点不同。线程同步关注的是如何避免并发导致的问题，而线程通信关注的是线程之间如何协作完成任务。在并发编程中，这两者通常是相辅相成的。

# Java内存模型（JMM）

是一种抽象的模型，被定义出来屏蔽各种硬件和操作系统的内存访问差异。

JMM定义了线程和主内存之间的抽象关系：线程之间的共享变量存储在主内存（Main Memory）中，每个线程都有一个私有的 本地内存 （Local Memory），本地内存中存储了该线程以读/写共享变量的副本。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329444.png)

# 并发编程**的本质就是解决三大问题:原子性、可见性、有序性**。

原子性、有序性、可见性是并发编程中非常重要的基础概念，用于描述多线程环境下的内存访问行为，它们是 Java 内存模型（Java Memory Model, JMM）的基础。

1. **原子性（Atomicity）**：
   1. 原子性是指一个操作或者一系列操作要么全部执行并且在执行过程中不会被任何其他操作中断，要么就全部都不执行。
   2. 在多线程环境中，原子性确保了当多个线程尝试同时修改同一变量时，这些修改不会相互干扰。
   3. Java 提供了一些原子类（如 `AtomicInteger`、`AtomicLong` 等），它们利用底层硬件的原子指令来保证操作的原子性。

1. **可见性（Visibility）**：
   1. 可见性是指当一个线程修改了共享变量的值，其他线程能够立即看到这个修改。
   2. 在没有同步机制的情况下，一个线程对共享变量的修改可能对其他线程不可见，因为变量的值可能被缓存在寄存器或者线程私有内存中。
   3. Java 通过 `volatile` 关键字、`synchronized` 块以及 `Lock` 机制来保证可见性。

1. **有序性（Ordering）**：
   1. 有序性是指程序执行的顺序按照代码的先后顺序进行。
   2. 在多线程环境中，由于编译器优化、处理器乱序执行等原因，指令可能会以不同于编写代码时的顺序执行。
   3. JMM 规定了 happens-before 关系，确保在并发环境中程序的执行结果与按序执行时的结果一致。
   4. 使用 `synchronized` 和 `volatile` 可以禁止某些重排序，保证操作的有序性。

JMM 定义了这些概念来规范多线程程序的内存一致性行为，确保在不同的线程、处理器和编译器优化下，程序的行为符合预期。理解并正确使用这些概念对于编写正确、高效的并发程序至关重要。

# volatile

volatile关键字有两个作用，保证可见性和有序性，但是不保证原子性。

## 含义

`volatile`关键字用来修饰变量，告诉JVM编译器和处理器，这个变量可能会被不同的线程同时访问和修改。这意味着，任何线程对`volatile`变量的修改，都将立即反映到主内存中，而且其他线程可以从主内存中读取最新的值。

## 作用

1. 保证可见性：`volatile`变量的写操作会强制将数据写入主内存，读操作会从主内存中读取数据。这样，一旦某个线程修改了`volatile`变量，其他线程可以立即看到这个变化。
2. 禁止指令重排序：变量的写操作在执行时不能被编译器或处理器重排序到之前的任何时刻。这确保了在 `volatile` 变量写操作之前的所有操作都将在写操作之前完成，读操作也是如此。
3.  尽管 `volatile` 保证了可见性和禁止指令重排序，但它并不保证复合操作的原子性。例如，递增操作 `i++`（即 `i = i + 1`）不是一个原子操作，即使 `i` 被声明为 `volatile`，也不能保证线程安全。

```Java
1public class VolatileCounter {
2    private volatile int count = 0;
34    public void increment() {
5        count++; // 这个操作在多线程环境下不是原子的
6    }
7}
```

## 使用场景及原理

1. **使用场景**：
   1. `volatile` 适用于状态标记，例如，一个线程需要知道另一个线程是否已经初始化了某些资源或者是否正在执行特定的任务。

1. **示例**：
   1. ```Java
      public class Example {
          private volatile boolean running = true;
      
          public void start() {
              while (running) {
                  // 执行任务
              }
          }
      
          public void stop() {
              running = false;
          }
      }
      ```

   2.   在这个例子中，`running` 变量被声明为 `volatile`，以确保当调用 `stop()` 方法修改 `running` 为 `false` 时，`start()` 方法中的线程能够立即看到这个变化。

1. **内存****屏障**：
   1. 在读取 `volatile` 变量时，JVM 会插入一个内存屏障来防止指令重排序，确保在该屏障之前的所有读/写操作在该屏障之后的所有读/写操作之前执行。

 `volatile` 是一种比 `synchronized` 更轻量级的同步机制，但它的使用场景有限，主要用于保证变量的可见性。在需要更复杂的同步操作时，通常需要使用其他同步机制，如 `synchronized` 或 `java.util.concurrent` 包中的并发工具。

# Atomic包

原子操作。

# 锁

## Synchronized

### Monitor 被翻译为监视器或管程

每个 Java 对象都可以关联一个 Monitor 对象，如果使用 synchronized 给对象上锁（重量级）之后，该对象头的Mark Word 中就被设置指向 Monitor 对象的指针。

### 关联流程

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329589.png)

- 刚开始 Monitor 中 Owner 为 null
- 当 Thread-2 执行 synchronized(obj) 就会将 Monitor 的所有者 Owner 置为 Thread-2，Monitor中只能有一个 Owner
- 在 Thread-2 上锁的过程中，如果 Thread-3，Thread-4，Thread-5 也来执行 synchronized(obj)，就会进入EntryList BLOCKED
- Thread-2 执行完同步代码块的内容，然后唤醒 EntryList 中等待的线程来竞争锁，竞争的时是非公平的
- 图中 WaitSet 中的 Thread-0，Thread-1 是之前获得过锁，但条件不满足进入 WAITING 状态的线程

注意：

 synchronized 必须是进入同一个对象的 monitor 才有上述的效果

 不加 synchronized 的对象不会关联监视器，不遵从以上规则

```Java
static final Object lock = new Object();
static int counter = 0;
public static void main(String[] args) {
 synchronized (lock) {
 counter++;
     }
}
    Code:
     stack=2, locals=3, args_size=1
     0: getstatic #2 // <- lock引用 （synchronized开始）
     3: dup
     4: astore_1 // lock引用 -> slot 1
     5: monitorenter // 将 lock对象 MarkWord 置为 Monitor 指针
     6: getstatic #3 // <- i
     9: iconst_1 // 准备常数 1
     10: iadd // +1
     11: putstatic #3 // -> i
     14: aload_1 // <- lock引用
     15: monitorexit // 将 lock对象 MarkWord 重置, 唤醒 EntryList
     16: goto 24
     19: astore_2 // e -> slot 2
     20: aload_1 // <- lock引用
     21: monitorexit // 将 lock对象 MarkWord 重置, 唤醒 EntryList
     22: aload_2 // <- slot 2 (e)
     23: athrow // throw e
     24: return
     Exception table:
     from to target type
     6 16 19 any
     19 22 19 any
     LineNumberTable:
     line 8: 0
     line 9: 6
     line 10: 14
     line 11: 24
     LocalVariableTable:
     Start Length Slot Name Signature
     0 25 0 args [Ljava/lang/String;
     StackMapTable: number_of_entries = 2
     frame_type = 255 /* full_frame*/
     offset_delta = 19
     locals = [ class "[Ljava/lang/String;", class java/lang/Object ]
     stack = [ class java/lang/Throwable ]
    * frame_type = 250 /* chop */
    offset_delta = 4
```

锁住的是对象实例或类对象

### 对象头

对象头由以下三部分组成：

> 1，Mark Word
>
> 2，指向类的指针
>
> 3，数组长度（只有数组对象才有）

#### **对象标记**

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329327.png)

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329339.png)

#### **指向类的指针**

 该指针在32位JVM中的长度是32bit，在64位JVM中长度是64bit。

 Java对象的类数据保存在方法区。

#### **数组长度**

 只有数组对象保存了这部分数据。

 该数据在32位和64位JVM中长度都是32bit。

### 偏向锁

轻量级锁在没有竞争时（就自己这个线程），每次重入仍然需要执行 CAS 操作。

Java 6 中引入了偏向锁来做进一步优化：只有第一次使用 CAS 将线程 ID 设置到对象的 Mark Word 头，之后检查

这个线程 ID 是自己的就表示没有竞争，不用重新 CAS。以后只要不发生竞争，这个对象就归该线程所有。

```Java
static final Object obj = new Object();
public static void m1() {
 synchronized( obj ) {
 // 同步块 A
 m2();
 }
}
public static void m2() {
 synchronized( obj ) {
 // 同步块 B
 m3();
 }
}
public static void m3() {
 synchronized( obj ) {
 // 同步块 C
 }
}
```

#### 偏向状态

```Java
|--------------------------------------------------------------------|--------------------|
|                         Mark Word (64 bits)                        | State              |
|--------------------------------------------------------------------|--------------------|
| unused:25 | hashcode:31 | unused:1 | age:4 | biased_lock:0 | 01    | Normal             |
|--------------------------------------------------------------------|--------------------|
| thread:54 | epoch:2     | unused:1 | age:4 | biased_lock:1 | 01    | Biased             |
|--------------------------------------------------------------------|--------------------|
| ptr_to_lock_record:62                                      | 00    | Lightweight Locked |
|--------------------------------------------------------------------|--------------------|
| ptr_to_heavyweight_monitor:62                              | 10    | Heavyweight Locked |
|--------------------------------------------------------------------|--------------------|
|                                                            | 11    | Marked for GC      |
|--------------------------------------------------------------------|--------------------|
```

#### 撤销 - 调用对象 hashCode

调用了对象的 hashCode，但偏向锁的对象 MarkWord 中存储的是线程 id，如果调用 hashCode 会导致偏向锁被撤销

- 轻量级锁会在锁记录中记录 hashCode
- 重量级锁会在 Monitor 中记录 hashCode

在调用 hashCode 后使用偏向锁，记得去掉 -XX:-UseBiasedLocking

#### 撤销 - 其它线程使用对象

当有其它线程使用偏向锁对象时，会将偏向锁升级为轻量级锁

```Java
private static void test2() throws InterruptedException {
 Dog d = new Dog();
 Thread t1 = new Thread(() -> {
 synchronized (d) {
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 synchronized (TestBiased.class) {
 TestBiased.class.notify();
 }
 // 如果不用 wait/notify 使用 join 必须打开下面的注释
 // 因为：t1 线程不能结束，否则底层线程可能被 jvm 重用作为 t2 线程，底层线程 id 是一样的
 /*try {
 System.in.read();
 } catch (IOException e) {
 e.printStackTrace();
 }*/
 }, "t1");
 t1.start();
 Thread t2 = new Thread(() -> {
 synchronized (TestBiased.class) {
 try {
 TestBiased.class.wait();
 } catch (InterruptedException e) {
 e.printStackTrace();
 }
 }
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 synchronized (d) {
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 }, "t2");
 t2.start();
}
```

输出

```Java
[t1] - 00000000 00000000 00000000 00000000 00011111 01000001 00010000 00000101 
[t2] - 00000000 00000000 00000000 00000000 00011111 01000001 00010000 00000101 
[t2] - 00000000 00000000 00000000 00000000 00011111 10110101 11110000 01000000 
[t2] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
```

#### 撤销 - 调用 wait/notify

```Java
public static void main(String[] args) throws InterruptedException {
 Dog d = new Dog();
 Thread t1 = new Thread(() -> {
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 synchronized (d) {
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 try {
 d.wait();
 } catch (InterruptedException e) {
 e.printStackTrace();
 }
 log.debug(ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 }, "t1");
 t1.start();
 new Thread(() -> {
 try {
 Thread.sleep(6000);
 } catch (InterruptedException e) {
 e.printStackTrace();
 }
 synchronized (d) {
 log.debug("notify");
 d.notify();
 }
 }, "t2").start();
}
```

输出

```Java
[t1] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000101 
[t1] - 00000000 00000000 00000000 00000000 00011111 10110011 11111000 00000101 
[t2] - notify 
[t1] - 00000000 00000000 00000000 00000000 00011100 11010100 00001101 11001010 
```

#### 批量重偏向

如果对象虽然被多个线程访问，但没有竞争，这时偏向了线程 T1 的对象仍有机会重新偏向 T2，重偏向会重置对象

的 Thread ID

当撤销偏向锁阈值超过 20 次后，jvm 会这样觉得，我是不是偏向错了呢，于是会在给这些对象加锁时重新偏向至

加锁线程

```Java
private static void test3() throws InterruptedException {
 Vector<Dog> list = new Vector<>();
 Thread t1 = new Thread(() -> {
 for (int i = 0; i < 30; i++) {
 Dog d = new Dog();
 list.add(d);
 synchronized (d) {
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 }
 synchronized (list) {
 list.notify();
 } 
 }, "t1");
 t1.start();
 
 Thread t2 = new Thread(() -> {
 synchronized (list) {
 try {
 list.wait();
 } catch (InterruptedException e) {
 e.printStackTrace();
 }
 }
 log.debug("===============> ");
 for (int i = 0; i < 30; i++) {
 Dog d = list.get(i);
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 synchronized (d) {
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 }, "t2");
 t2.start();
}
```

输出

```Java
[t1] - 0 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 1 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 2 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 3 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 4 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 5 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 6 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 7 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 8 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 9 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 10 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 11 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 12 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 13 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 14 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 15 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 16 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 17 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 18 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - ===============> 
[t2] - 0 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 0 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 0 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 1 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 1 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 1 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 2 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 2 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 2 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 3 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 3 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 3 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 4 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 4 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 4 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 5 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 5 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 5 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 6 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 6 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 6 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 7 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 7 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 7 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 8 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 8 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 8 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 9 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 9 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 9 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 10 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 10 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 10 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 11 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 11 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 11 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 12 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 12 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 12 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 13 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 13 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 13 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 14 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 14 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 14 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 15 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 15 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 15 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 16 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 16 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 16 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 17 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 17 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 17 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 18 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 18 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 18 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
```

#### 批量撤销

当撤销偏向锁阈值超过 40 次后，jvm 会这样觉得，自己确实偏向错了，根本就不该偏向。于是整个类的所有对象

都会变为不可偏向的，新建的对象也是不可偏向的

```Java
static Thread t1,t2,t3;
private static void test4() throws InterruptedException {
 Vector<Dog> list = new Vector<>();
 int loopNumber = 39;
 t1 = new Thread(() -> {
 for (int i = 0; i < loopNumber; i++) {
 Dog d = new Dog();
 list.add(d);
 synchronized (d) {
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 }
 LockSupport.unpark(t2);
 }, "t1");
 t1.start();
 t2 = new Thread(() -> {
 LockSupport.park();
 log.debug("===============> ");
 for (int i = 0; i < loopNumber; i++) {
 Dog d = list.get(i);
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 synchronized (d) {
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 LockSupport.unpark(t3);
 }, "t2");
 t2.start();
 t3 = new Thread(() -> {
 LockSupport.park();
 log.debug("===============> ");
 for (int i = 0; i < loopNumber; i++) {
 Dog d = list.get(i);
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 synchronized (d) {
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
 }
 }, "t3");
 t3.start();
 t3.join();
 log.debug(ClassLayout.parseInstance(new Dog()).toPrintableSimple(true));
}
```

### 轻量级锁

轻量级锁的使用场景：如果一个对象虽然有多线程要加锁，但加锁的时间是错开的（也就是没有竞争），那么可以使用轻量级锁来优化。

轻量级锁对使用者是透明的，即语法仍然是 synchronized。

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329318.png)

- 创建锁记录（Lock Record）对象，每个线程都的栈帧都会包含一个锁记录的结构，内部可以存储锁定对象的Mark Word
- 让锁记录中 Object reference 指向锁对象，并尝试用 cas 替换 Object 的 Mark Word，将 Mark Word 的值存入锁记录
- 如果 cas 替换成功，对象头中存储了 锁记录地址和状态 00 ，表示由该线程给对象加锁
- 如果 cas 失败，有两种情况
  - 如果是其它线程已经持有了该 Object 的轻量级锁，这时表明有竞争，进入锁膨胀过程
  - 如果是自己执行了 synchronized 锁重入，那么再添加一条 Lock Record 作为重入的计数

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329419.png)

- 当退出 synchronized 代码块（解锁时）如果有取值为 null 的锁记录，表示有重入，这时重置锁记录，表示重入计数减一

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329587.png)

- 当退出 synchronized 代码块（解锁时）锁记录的值不为 null，这时使用 cas 将 Mark Word 的值恢复给对象头
  - 成功，则解锁成功
  - 失败，说明轻量级锁进行了锁膨胀或已经升级为重量级锁，进入重量级锁解锁流程

### 锁膨胀

如果在尝试加轻量级锁的过程中，CAS 操作无法成功，这时一种情况就是有其它线程为此对象加上了轻量级锁（有竞争），这时需要进行锁膨胀，将轻量级锁变为重量级锁。

```Java
static Object obj = new Object();
public static void method1() {
 synchronized( obj ) {
 // 同步块
     }
}
```

- 当 Thread-1 进行轻量级加锁时，Thread-0 已经对该对象加了轻量级锁

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329795.png)

- 这时 Thread-1 加轻量级锁CAS失败，进入锁膨胀流程
  - 即为 Object 对象申请 Monitor 锁，让 Object 指向重量级锁地址
  - 然后自己进入 Monitor 的 EntryList BLOCKED
  - ![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329812.png)
- 当 Thread-0 退出同步块解锁时，使用 cas 将 Mark Word 的值恢复给对象头，失败。这时会进入重量级解锁流程，即按照 Monitor 地址找到 Monitor 对象，设置 Owner 为 null，唤醒 EntryList 中 BLOCKED 线程

### 锁消除

锁消除是指JVM在编译过程中通过静态分析技术检测到一些不可能存在竞争条件的锁，从而将其消除的优化过程。当JVM确定某个锁对象不会发生竞争时，就可以安全地消除对该锁的获取和释放操作，从而减少了锁操作的开销。

来分析如下代码：

```Java
StringBuffer sBuffer = new StringBuffer();
sBuffer.append("a");
sBuffer.append("b");
sBuffer.append("c");
sBuffer.append("d");
```

此时由于`StringBuffer`对象是线程安全的，但是在单线程运行环境下，这些加锁解锁操作完全没有必要，因此编译器就会帮我们省去这些锁

注意：synchronized消除锁的策略是比较保守的，明显不会发生线程安全问题的代码才会消除锁，例如：

- 变量只涉及局部变量，没有全局变量
- 多个线程只对变量做读取操作，不涉及修改操作

```Java
@Fork(1)
@BenchmarkMode(Mode.AverageTime)
@Warmup(iterations=3)
@Measurement(iterations=5)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class MyBenchmark {
 static int x = 0;
 @Benchmark
 public void a() throws Exception {
 x++;
 }
 @Benchmark
 public void b() throws Exception {
 Object o = new Object();
 synchronized (o) {
 x++;
         }
     }
}
```

java -jar benchmarks.jar

```Java
Benchmark Mode Samples Score Score error Units 
c.i.MyBenchmark.a avgt 5 1.542 0.056 ns/op 
c.i.MyBenchmark.b avgt 5 1.518 0.091 ns/op 
```

java -XX:-EliminateLocks -jar benchmarks.jar

```Java
Benchmark Mode Samples Score Score error Units 
c.i.MyBenchmark.a avgt 5 1.507 0.108 ns/op 
c.i.MyBenchmark.b avgt 5 16.976 1.572 ns/op
```

#### 锁粗化

对相同对象多次加锁，导致线程发生多次重入，可以使用锁粗化方式来优化，这不同于之前讲的细分锁的粒度。

如果在同一段代码逻辑中，多次频繁的加锁解锁操作，编译器和JVM会帮助我们将其合并为一次加锁解锁操作。

### Synchronized 的四种锁状态

无锁：

偏向锁：偏向某个线程使用，如果有其他线程尝试获取偏向锁，则会撤销偏向模式，升级为轻量级锁。

轻量级锁：多个线程交替使用，轻量级锁使用CAS（Compare And Swap）操作来尝试获取锁。如果CAS操作成功，线程就获得了锁；如果失败，证明有多个线程同时使用，即发生竞争，达到次数升级重量级锁

重量级锁：重量级锁是 `synchronized` 的最终状态，当锁处于这个状态时，所有等待获取锁的线程都会被挂起，直到锁被释放。

## ReentrantLock

是类，基于AQS实现，具有原子性，有序性，可见性，可重入性。

公平锁

非公平锁

## Synchronized和ReentrantLock对比

## ReentrantReadWriteLock

## CAS：ABA问题，自旋问题，单个变量操作

CAS（Compare And Swap）是一种原子操作，用于实现多线程环境下的同步操作。CAS 操作包含三个操作数：内存位置（V）、旧的预期值（A）和新值（B）。当且仅当预期值 A 和内存位置 V 的值相同时，CAS 会将内存位置 V 的值更新为新值B。

## AQS

AbstractQueuedSynchronizer（AQS）是Java中用于实现锁和同步器的基础框架。它提供了一种队列同步器的实现方式，可以用于构建各种同步器，如ReentrantLock、Semaphore、CountDownLatch等。AQS的核心思想是使用一个FIFO的等待队列来管理线程的获取和释放锁的顺序，同时使用一个volatile变量来表示锁的状态。AQS的实现方式是通过继承来扩展，子类需要实现tryAcquire和tryRelease等方法来控制锁的获取和释放。AQS是Java并发编程中的重要概念，也是Java并发包中的核心组件之一。

# 并发集合(容器)

![image-20240715233123923](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152331977.png)

# 线程池：七大参数、拒绝策略

- Executor：执行线程的顶级接口。
- Executors：工厂类，用于创建不同类型的线程池。
- ExecutorService：管理任务提交和线程池的接口。
- ThreadPoolExecutor：可扩展的线程池类。
- ScheduledExecutorService：用于定时任务的线程池接口。

# 同步工具

## Semaphore

在Java中，`Semaphore`是一个同步辅助类，它提供了一种更为复杂的方式来控制同时访问某些资源的线程数量。`Semaphore`本质上是一个计数信号量，用来限制对某些资源的并发访问。

### Semaphore 原理

Semaphore 有点像一个停车场，permits 就好像停车位数量，当线程获得了 permits 就像是获得了停车位，然后

停车场显示空余车位减一

刚开始，permits（state）为 3，这时 5 个线程来获取资源

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329919.png)

假设其中 Thread-1，Thread-2，Thread-4 cas 竞争成功，而 Thread-0 和 Thread-3 竞争失败，进入 AQS 队列

park 阻塞

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329433.png)

这时 Thread-4 释放了 permits，状态如下

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329798.png)

接下来 Thread-0 竞争成功，permits 再次设置为 0，设置自己为 head 节点，断开原来的 head 节点，unpark 接

下来的 Thread-3 节点，但由于 permits 是 0，因此 Thread-3 在尝试不成功后再次进入 park 状态

![img](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407152329817.png)

### `Semaphore`的主要特点包括

1. **计数器**：`Semaphore`内部有一个计数器，表示同时允许访问资源的线程数量。
2. **获取（Acquire）**：线程调用`Semaphore`的`acquire()`方法来获取一个许可。如果计数器大于0，计数器减1，线程成功获取许可；如果计数器为0，则线程会被阻塞，直到其他线程释放许可。
3. **释放（Release）**：线程完成资源使用后，调用`release()`方法来释放一个许可，此时计数器加1，可能会唤醒等待的线程。
4. **公平性（Fairness）**：可以创建一个公平的`Semaphore`，它按照线程请求资源的顺序来分配许可，而非公平的`Semaphore`则可能允许线程饥饿。
5. **尝试获取（Try Acquire）**：`Semaphore`提供了`tryAcquire()`方法，允许线程尝试获取许可而不被阻塞。如果获取成功，返回`true`；如果失败（即没有可用的许可），则返回`false`。
   1. 

### 使用`Semaphore`的一个简单例子：

```Java
// 创建一个计数为1的Semaphore，表示一次只允许一个线程访问资源
Semaphore semaphore = new Semaphore(1);

// 线程尝试获取许可
semaphore.acquire();

// 线程使用资源
// ...

// 线程使用完资源后释放许可
semaphore.release();
```

`Semaphore`可以用于多种同步场景，比如限制数据库连接池的大小、控制线程池中的线程数量等。它比`synchronized`关键字和`ReentrantLock`提供了更多的灵活性。

## CountDownLatch

允许一个或多个线程等待一组操作在其他线程中完成。用来进行线程同步协作，等待所有线程完成倒计时。

其中构造参数用来初始化等待计数值，await() 用来等待计数归零，countDown() 用来让计数减一。

```Java
public static void main(String[] args) throws InterruptedException {
 CountDownLatch latch = new CountDownLatch(3);
 new Thread(() -> {
 log.debug("begin...");
 sleep(1);
 latch.countDown();
 log.debug("end...{}", latch.getCount());
 }).start();
 new Thread(() -> {
 log.debug("begin...");
 sleep(2);
 latch.countDown();
 log.debug("end...{}", latch.getCount());
 }).start();
 new Thread(() -> {
 log.debug("begin...");
 sleep(1.5);
 latch.countDown();
 log.debug("end...{}", latch.getCount());
 }).start();
 log.debug("waiting...");
 latch.await();
 log.debug("wait end...");
}
```

## CyclicBarrier 类

使一组线程到达某个点后继续执行。循环栅栏，用来进行线程协作，等待线程满足某个计数。构造时设置『计数个数』，每个线程执行到某个需要“同步”的时刻调用 await() 方法进行等待，当等待的线程数满足『计数个数』时，继续执行。

```Java
CyclicBarrier cb = new CyclicBarrier(2); // 个数为2时才会继续执行
new Thread(()->{
 System.out.println("线程1开始.."+new Date());
 try {
 cb.await(); // 当个数不足时，等待
 } catch (InterruptedException | BrokenBarrierException e) {
 e.printStackTrace();
 }
 System.out.println("线程1继续向下运行..."+new Date());
}).start();
new Thread(()->{
 System.out.println("线程2开始.."+new Date());
 try { Thread.sleep(2000); } catch (InterruptedException e) { }
 try {
 cb.await(); // 2 秒后，线程个数够2，继续运行
 } catch (InterruptedException | BrokenBarrierException e) {
 e.printStackTrace();
 }
 System.out.println("线程2继续向下运行..."+new Date());
}).start();
```

> 注意 CyclicBarrier 与 CountDownLatch 的主要区别在于 CyclicBarrier 是可以重用的 CyclicBarrier 可以被比
>
> 喻为『人满发车』

## Exchanger

 允许在并发线程之间交换数据。

## CompletableFuture

CompletableFuture是Java 8引入的一个异步编程工具类，用于处理异步任务的结果和执行流程。它提供了一种简洁而强大的方式来处理异步操作，包括任务的串行执行、并行执行、组合以及异常处理等。

## LockSupport

提供线程阻塞和唤醒操作的工具类。

在Java中，`park`方法属`java.util.concurrent.locks.LockSupport`工具类。`LockSupport`提供了一些静态方法，用于线程之间的线程阻塞和唤醒操作，`park`方法就是其中之一。

`park`方法的作用是阻塞当前线程，直到它被其他线程通过调用`LockSupport.unpark(Thread thread)`方法唤醒。这通常用于实现锁和其他同步器的框架，以及那些需要更细粒度控制线程阻塞和唤醒的高级并发应用程序。

`park`方法的用法非常简单，它没有参数，调用后当前线程就会挂起。以下是`park`方法的一个基本示例：

```Java
LockSupport.park();
```

这行代码会使当前线程进入等待状态，直到另一个线程调用`LockSupport.unpark(Thread thread)`，其中`thread`是当前线程的引用，来唤醒它。

`LockSupport`还提供了一些变体的`park`方法，允许你指定一个阻塞时间：

- `LockSupport.parkNanos(long nanos)`：阻塞当前线程，直到另一个线程唤醒它或者超过指定的纳秒时间。
- `LockSupport.parkUntil(long deadline)`：阻塞当前线程，直到另一个线程唤醒它或者当前时间超过了指定的截止时间。

使用`park`和`unpark`的方法可以在没有使用锁的情况下实现线程间的协作，这在某些情况下可以提高性能，因为它们避免了使用重量级的锁机制。然而，它们也要求开发者更仔细地管理线程的生命周期和状态，以避免常见的并发问题，如死锁。

下面是一个使用`park`和`unpark`的简单示例：

```Java
public class ParkUnparkExample {
    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            System.out.println("Thread is running and will park now.");
            LockSupport.park();
            System.out.println("Thread was unparked and is now running again.");
        });

        thread.start();

        // 稍等一下，确保线程已经进入park状态
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        // 唤醒线程
        LockSupport.unpark(thread);
    }
}
```

在这个例子中，新线程启动后会打印一条消息，然后调用`park`方法进入等待状态。主线程稍等一秒钟后调用`unpark`方法唤醒等待的线程，线程被唤醒后继续执行并打印另一条消息。

