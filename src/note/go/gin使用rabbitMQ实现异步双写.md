---
# 这是文章的标题
title: gin使用rabbitMQ实现异步双写
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
  - gin使用rabbitMQ实现异步双写
  - rabbitMQ
# 一个页面可以有多个标签

tag:
  - rabbitMQ

# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权
---

gin使用rabbitMQ实现异步双写

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



# gin中创建es

```go
package es

import (
	"bluebell/setting"
	"fmt"

	"github.com/elastic/go-elasticsearch/v8"
)

var Esdb *elasticsearch.TypedClient

// Init 初始化ES连接
func Init(cfg *setting.ESConfig) (err error) {

	// 创建客户端连接
	Esdb, err = elasticsearch.NewTypedClient(elasticsearch.Config{
		Addresses: cfg.Adders,
	})
	if err != nil {
		fmt.Printf("elasticsearch.NewTypedClient failed, err:%v\n", err)
		return
	}
	fmt.Printf("init es succss, Esdb:%v\n", Esdb)
	return
}

// ES连接没有关闭方法
// func Close() {
// 	_ = esdb.()
// }

```



# 数据同步方案

有同步，有异步，有中间件。这里讨论的都是增量同步，如果要全量同步，可以使用logstash-input-jdbc`，`go-mysql-elasticsearch`，`elasticsearch-jdbc等插件，实现对mysql的数据导入到es中。

# 同步

最为简单，在发表帖子时，直接写入es当中。

```go
//同步写es
// CreatePostHandler 创建帖子的处理函数
func CreatePostHandler(c *gin.Context) {
	// 1. 获取参数及参数的校验
	//c.ShouldBindJSON()  // validator --> binding tag
	p := new(models.Post)
	if err := c.ShouldBindJSON(p); err != nil {
		zap.L().Debug("c.ShouldBindJSON(p) error", zap.Any("err", err))
		zap.L().Error("create post with invalid param")
		ResponseError(c, CodeInvalidParam)
		return
	}
	// 从 c 取到当前发请求的用户的ID
	userID, err := getCurrentUserID(c)
	if err != nil {
		ResponseError(c, CodeNeedLogin)
		return
	}
	p.AuthorID = userID
	// 2. 创建帖子
	if err := logic.CreatePost(p); err != nil {
		zap.L().Error("logic.CreatePost(p) failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}
         //es直接同步
    	//  根据id取出帖子数据（查数据库）
	data, err := logic.GetPostById(p.ID)
	if err != nil {
		zap.L().Error("logic.GetPostById(pid) failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}

	// 3.获取该用户的粉丝集合，从mysql获取，或者从redis中获取都可以，然后推送粉丝
	data, err := logic.SelectFans(p.AuthorID)
	if err != nil {
		zap.L().Error("logic.SelectFans(p); failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}
	// 4. 根据粉丝集合，进行推送
	if err := logic.SendFeed(data, p.ID); err != nil {
		zap.L().Error("logic.SendFeed() failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}

	// 5. 返回响应
	ResponseSuccess(c, nil)
}

```



# 异步

