---
# 这是文章的标题
title: B+树，索引，回表
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
  - B+树，索引，回表
# 一个页面可以有多个标签

tag:
  - B+树
  - 索引
  - 回表

# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权


---

go-简单使用elasticsearch

<!-- more -->

go-es客户端：github.com/elastic/go-elasticsearch/v8

执行以下命令安装v8版本的 go 客户端。

```Bash
go get github.com/elastic/go-elasticsearch/v8@latest
```

导入依赖。

```Go
import "github.com/elastic/go-elasticsearch/v8"
```

可以根据实际需求导入不同的客户端版本，也支持在一个项目中导入不同的客户端版本。

```Go
import (
  elasticsearch7 "github.com/elastic/go-elasticsearch/v7"  elasticsearch8 "github.com/elastic/go-elasticsearch/v8")

// ...
es7, _ := elasticsearch7.NewDefaultClient()
es8, _ := elasticsearch8.NewDefaultClient()
```

## 连接 ES

指定要连接 ES 的相关配置，并创建客户端连接。

```Go
// ES 配置
cfg := elasticsearch.Config{
        Addresses: []string{
                "http://localhost:9200",
        },
}

// 创建客户端连接
client, err := elasticsearch.NewTypedClient(cfg)
if err != nil {
        fmt.Printf("elasticsearch.NewTypedClient failed, err:%v\n", err)
        return}
```

创建索引：

```Go
// createIndex 创建索引
func createIndex(client *elasticsearch.TypedClient) {
    resp, err := client.Indices.Create("my-review-1").Do(context.Background())
    if err != nil {
        fmt.Printf("create index failed, err:%v\n", err)
        return
    }
    fmt.Printf("index:%#v\n", resp.Index)
}
```

