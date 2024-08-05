---
# 这是文章的标题
title: 数据同步到Elasticsearch
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
  - Elasticsearch
# 一个页面可以有多个标签

tag:
  - elasticsearch
  - 数据同步

# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权


---

数据同步到Elasticsearch，同步写，异步写，中间件实现同步。

<!-- more -->

# 同步双写

在写入MySQL时同时写入ES，这是最简单的方式。

![image-20240716171141128](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407161711219.png)

优点：系统结构简单，不用引入新的组件，实时性高。

缺点：耦合度高，MYSQL写入失败或ES写入失败都需要考虑回滚，接口性能下降。

# 异步写

基于MQ来实现。

![image-20240716171151636](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407161711670.png)

优点：解耦，基于MQ消费确认机制保证数据。

缺点：基于MQ，有一定延时。

# 中间件-数据迁移工具

基于binlog日志，MySQL通过binlog订阅实现主从同步，canal也是这个原理，将client组件伪装成从库，来实现数据订阅。

![image-20240716171207081](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407161712118.png)

Canal 原理就是伪装成 MySQL 的从节点，从而订阅 master 节点的 Binlog 日志，主要流程为：

1. Canal 服务端向 MySQL 的 master 节点传输 dump 协议；
2. MySQL 的 master 节点接收到 dump 请求后推送 Binlog 日志给 Canal 服务端，解析 Binlog 对象（原始为 byte 流）转成 Json 格式；
3. Canal 客户端通过 TCP 协议或 MQ 形式监听 Canal 服务端，同步数据到 ES。

下面是 Cannel 执行的核心流程，其中 Binlog Parser 主要负责 Binlog 的提取、解析和推送，EventSink 负责数据的过滤 、路由和加工，仅作了解即可。

![图片](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407161725540.png)



# 定时任务扫描

如果对实时性要求不高的情况下，可以考虑用定时器来处理：

1. 数据库的相关表中增加一个字段为 timestamp 的字段，任何 CURD 操作都会导致该字段的时间发生变化；
2. 原来程序中的 CURD 操作不做任何变化；
3. 增加一个定时器程序，让该程序按一定的时间周期扫描指定的表，把该时间段内发生变化的数据提取出来；
4. 逐条写入到 ES 中。

![image-20240716171234652](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407161712686.png)

优点：

- 不改变原来代码，没有侵入性、没有硬编码；
- 没有业务强耦合，不改变原来程序的性能；
- Worker 代码编写简单不需要考虑增删改查。

缺点：

- 时效性较差，由于是采用定时器根据固定频率查询表来同步数据，尽管将同步周期设置到秒级，也还是会存在一定时间的延迟；
- 对数据库有一定的轮询压力，一种改进方法是将轮询放到压力不大的从库上。

> 经典方案：借助 Logstash 实现数据同步，其底层实现原理就是根据配置定期使用 SQL 查询新增的数据写入 ES 中，实现数据的增量同步。

# MySQL主从复制原理

![image-20240716173734159](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407161737205.png)

# 参考

[4种数据同步到Elasticsearch方案 - 古道轻风 - 博客园 (cnblogs.com)](https://www.cnblogs.com/88223100/p/Four-data-synchronization-schemes-to-Elasticsearch.html)