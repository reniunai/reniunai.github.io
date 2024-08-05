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

## 4、初步检索

**1、_cat**

```
GET /_cat/nodes：查看所有节点
GET /_cat/health：查看 es 健康状况
GET /_cat/master：查看主节点
GET /_cat/indices：查看所有索引 show databases;
```



**2、索引一个文档（保存）**

保存一个数据，保存在哪个索引的哪个类型下，指定用哪个唯一标识PUT customer/external/1；在 customer 索引下的 external 类型下保存 1 号数据为

```
# # 在customer索引下的external类型下保存1号数据
PUT customer/external/1
```

httpclinet

```http
PUT http://59.110.106.16:9200/customer/external/1
Content-Type: application/json

{
  "name": "John Doe"
}
```



返回数据

```json
返回数据：
带有下划线开头的，称为元数据，反映了当前的基本信息。
{
  "_index": "customer", 表明该数据在哪个数据库下；
    "_type": "external", 表明该数据在哪个类型下；
    "_id": "1",  表明被保存数据的id；
    "_version": 1,  被保存数据的版本
    "result": "created", 这里是创建了一条数据，如果重新put一条数据，则该状态会变为updated，并且版本号也会发生变化。
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 1,
  "_primary_term": 1
}
```

> PUT 和 POST 都可以，
> POST 新增。如果不指定 id，会自动生成 id, 新增这个数据。指定 id 就会修改这个数据，并新增版本号
> PUT 可以新增可以修改。PUT 必须指定 id；由于 PUT 需要指定 id，我们一般都用来做修改操作，不指定 id 会报错。



**3、查询文档**

```
GET customer/external/1
```

httpclient

```http
### GET request with a header
GET http://59.110.106.16:9200/customer/external/1
Accept: application/json
```

返回数据：

```json
{
  "_index": "customer",
  "_type": "external",
  "_id": "1",
  "_version": 2,
  "_seq_no": 1, //并发控制字段，每次更新都会+1，用来做乐观锁
  "_primary_term": 1,//同上，主分片重新分配，如重启，就会变化
  "found": true,
  "_source": { //存储的信息
    "name": "John Doe"
  }
}
```

> 乐观锁用法：通过“`if_seq_no=1&if_primary_term=1`”，当序列号匹配的时候，才进行修改，否则不修改。

示例：

当seq_no=1&primary_term=1时，就修改

```http
###
PUT http://59.110.106.16:9200/customer/external/1?if_seq_no=1&if_primary_term=1
Content-Type: application/json

{
  "name": "John Doe"
}
```

修改成功，修改之后seq_no变成2

![image-20211011134234874](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954667.png)

再次发送上面的请求，修改失败，乐观锁是生效

![image-20211011134451525](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954673.png)



**4、更新文档**

```
POST customer/external/1/_update
{
   "doc":{
       "name": "John Doew"
   }
}

或者
POST customer/external/1
{

   "name": "John Doe2"
}

或者
PUT customer/external/1
{
   "name": "John Doe"
}
```

> * 注意带不带_update的语法不同
> * 带_update会跟原数据对比，跟原来一样就什么都不做,version不增加。 应用场景：对于大并发查询，偶尔更新，带update；对比更新呢，重新计算分配规则
> * post不带_update,不会检查原数据,直接更新。 应用场景：对于大并发更新，不带update

发送之后，与元素据对比，发现相同，不做任何操作

```http
POST http://59.110.106.16:9200/customer/external/1/_update
Content-Type: application/json

{
  "doc":{
    "name": "John"
  }
}
```



**5、删除文档&索引**

```
DELETE customer/external/1
DELETE customer
```

> 注：elasticsearch并没有提供删除类型的操作，只提供了删除索引和文档的操作。

删除id=1的数据

```http
DELETE http://59.110.106.16:9200/customer/external/1
```

![image-20211011140906175](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954684.png)

删除customer索引

```http
DELETE http://59.110.106.16:9200/customer
```

```json
响应
{
    "acknowledged": true
}
```



**6、ES的批量操作——bulk**

用Kibana之中的Dev Tools

示例1:

```http
POST customer/external/_bulk

{"index":{"_id":"1"}}
{"name": "John Doe" }

{"index":{"_id":"2"}}
{"name": "Jane Doe" }
```

语法格式: 两行一组，第一行为操作，第二行为数据

```
{ action: { metadata }}\n
{ request body}\n

{ action: { metadata }}\n
{ request body}\n
```

这里的批量操作，当发生某一条执行发生失败时，其他的数据仍然能够接着执行，也就是说彼此之间是独立的。

> bulk API 以此按顺序执行所有的 action（动作）。如果一个单个的动作因任何原因而失败，它将继续处理它后面剩余的动作。当 bulk API 返回时，它将提供每个动作的状态（与发送的顺序相同），所以您可以检查是否一个指定的动作是不是失败了。

返回数据

```json
#! Deprecation: [types removal] Specifying types in bulk requests is deprecated.
{
  "took" : 318,  花费了多少ms
  "errors" : false, 没有发生任何错误
  "items" : [ 每个数据的结果
    {
      "index" : { 保存
        "_index" : "customer", 索引
        "_type" : "external", 类型
        "_id" : "1", 文档
        "_version" : 1, 版本
        "result" : "created", 创建
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 0,
        "_primary_term" : 1,
        "status" : 201 新建完成
      }
    },
    {
      "index" : { 第二条记录
        "_index" : "customer",
        "_type" : "external",
        "_id" : "2",
        "_version" : 1,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 1,
        "_primary_term" : 1,
        "status" : 201
      }
    }
  ]
}
```

示例2：

```http
POST /_bulk

{"delete":{"_index":"website","_type":"blog","_id":"123"}}

{"create":{"_index":"website","_type":"blog","_id":"123"}}
{"title":"my first blog post"}

{"index":{"_index":"website","_type":"blog"}}
{"title":"my second blog post"}

{"update":{"_index":"website","_type":"blog","_id":"123"}}
{"doc":{"title":"my updated blog post"}}
```



**7、样本测试数据**

一份顾客银行账户信息的虚构的 JSON 文档样本。每个文档都有下列的 schema(模式):

```json
{
"account_number": 0,
"balance": 16623,
"firstname": "Bradshaw",
"lastname": "Mckenzie",
"age": 29,
"gender": "F",
"address": "244 Columbus Place",
"employer": "Euron",
"email": "bradshawmckenzie@euron.com",
"city": "Hobucken",
"state": "CO"
}
```

测试数据地址https://gitee.com/xlh_blog/common_content/blob/master/es%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE.json

```http
POST bank/account/_bulk

//上面的数据

//GET _cat/indices, 查看索引
//刚导入了1000条数据
yellow open bank                     dno5JY9tTrGHdsjIMkvQyA 1 1 1000 0 414.2kb 414.2kb
```



## 5、进阶检索

### **1、SearchAPI**

ES 支持两种基本方式检索：

* 一个是通过使用 REST request URI 发送搜索参数（uri+检索参数）
* 另一个是通过使用 REST request body 来发送它们（uri+请求体）

1）、信息检索

```
GET bank/_search     													检索 bank 下所有信息，包括 type 和 docs

GET bank/_search?q=*&sort=account_number:asc							请求参数方式检索
说明：
q=* # 查询所有
sort # 排序字段
asc #升序
```

返回内容：

![image-20211011143910397](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954670.png)

`took` – 花费多少ms搜索
`timed_out` – 是否超时
`_shards `– 多少分片被搜索了，以及多少成功/失败的搜索分片
`max_score` –文档相关性最高得分
`hits.total.value` - 多少匹配文档被找到
`hits.sort` - 结果的排序key（列），没有的话按照score排序
`hits._score` - 相关得分 (not applicable when using match_all)



uri+请求体行检索

```http
GET /bank/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "account_number": "asc" },
    { "balance":"desc"}
  ]
}
```

HTTP客户端工具（POSTMAN），get请求不能携带请求体，我们变为post也是一样的。我们POST一个JSON风格的查询请求体到_search API。

需要了解，一旦搜索的结果被返回Elasticsearch就完成了这次请求，并且不会维护任何服务端的资源或者结果的cursor（游标）

### 2、Query DSL

Elasticsearch提供了一个可以执行查询的Json风格的DSL(domain-specific language领域特定语言)。这个被称为Query DSL，该查询语言非常全面。



1、基本语法格式

```json
如果针对于某个字段，那么它的结构如下：
{
  QUERY_NAME:{   # 使用的功能
     FIELD_NAME:{  #  功能参数
       ARGUMENT:VALUE,
       ARGUMENT:VALUE,...
      }   
   }
}
```

```java
示例  使用时不要加#注释内容
GET bank/_search
{
  "query": {  #  查询的字段
    "match_all": {}
  },
  "from": 0,  # 从第几条文档开始查
  "size": 5,  # 查几条文档
  "_source":["balance"], # 返回的数据字段， 这里只查balance
  "sort": [
    {
      "account_number": {  # 返回结果按哪个列排序
        "order": "desc"  # 降序
      }
    }
  ]
}
```

query定义如何查询；

* match_all查询类型【代表查询所有的索引】，es中可以在query中组合非常多的查询类型完成复杂查询；
* 除了query参数之外，我们可也传递其他的参数以改变查询结果，如sort，size；
* from+size限定，完成分页功能；
* sort排序，多字段排序，会在前序字段相等时后续字段内部排序，否则以前序为准；



2、`query/match`匹配查询

> 如果是非字符串，会进行精确匹配。如果是字符串，会进行全文检索

- 基本类型（非字符串），精确控制: 查询account_number == 20的文档

```http
GET bank/_search
{
  "query": {
    "match": {
      "account_number": "20"
    }
  }
}
```

- 字符串，全文检索: 查询address中含有kings的文档

```http
GET bank/_search
{
  "query": {
    "match": {
      "address": "kings"
    }
  }
}
```

* 字符串，全文检索：最终查询出 address 中包含 mill 或者 road 或者 mill road 的所有记录，并给出相关性得分

```http
GET bank/_search
{
   "query": {
      "match": {
         "address": "mill road"
      }
   }
}
```

全文检索，最终会按照评分进行排序，会对检索条件进行分词匹配。



3、`query/match_phrase`【短语匹配】

将需要匹配的值当成一整个单词（不分词）进行检索

- `match`：拆分字符串进行检索。 包含mill 或 road 或 mill road
- `match_phrase`：不拆分字符串进行检索。 包含mill road
- `字段.keyword`：必须全匹配上才检索成功。 

```http
GET bank/_search
{
  "query": {
    "match_phrase": {
      "address": "mill road"   #  就是说不要匹配只有mill或只有road的，要匹配mill road一整个子串
      
      # "address.keyword": "990 Mill"  # 字段后面加上 .keyword, 必须完全匹配
      
    }
  }
}
```



4、`query/multi_math`【多字段匹配】

`state或者address中包含mill`，并且在查询过程中，会对于查询条件进行分词。

```http
GET bank/_search
{
  "query": {
    "multi_match": {  # 前面的match仅指定了一个字段。
      "query": "mill",
      "fields": [ # state和address有mill子串  不要求都有
        "state",
        "address"
      ]
    }
  }
}
```



5、`query/bool/must`复合查询

复合语句可以合并，任何其他查询语句，包括符合语句。这也就意味着，复合语句之间可以互相嵌套，可以表达非常复杂的逻辑。

* must：必须达到must所列举的所有条件
* must_not：必须不匹配must_not所列举的所有条件。
* should：应该满足should所列举的条件。满足条件最好，不满足也可以，满足得分更高

```http
GET bank/_search
{
  "query": {
    "bool": {
      "must": [   # gender必须是M， address必须包含mill
        {
          "match": {
            "gender": "M"
          }
        },
        {
          "match": {
            "address": "mill"
          }
        }
      ],
      "must_not": [   # age必须不等于18
        {
          "match": {
            "age": "18"
          }
        }
      ],
      "should": [    # lastname最好包含wallace
        {
          "match": {
            "lastname": "Wallace"
          }
        }
      ]
    }
  }
}
```



6、`query/filter`【结果过滤】

* 上面的must和should影响相关性得分，而must_not仅仅是一个filter ，不贡献得分

* must改为filter就使must不贡献得分

* 如果只有filter条件的话，我们会发现得分都是0

并不是所有的查询都需要产生分数，特别是哪些仅用于filtering过滤的文档。不参与评分更快, 为了不计算分数，elasticsearch会自动检查场景并且优化查询的执行。

```http
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": {"address": "mill" } }
      ],
      "filter": {  # query.bool.filter
        "range": {
          "balance": {  # 哪个字段
            "gte": "10000",
            "lte": "20000"
          }
        }
      }
    }
  }
}

这里先是查询所有匹配address包含mill的文档，然后再根据10000<=balance<=20000进行过滤查询结果
```



7、`query/term`

和 match 一样。匹配某个属性的值。全文检索字段用 match，其他非 text 字段匹配用 term。

比如：年龄为23岁，用term， address为mill road就用match

```http
GET bank/_search
{
   "query": {
      "bool": {
         "must": [
            {"term": {
               "age": {
                  "value": "28"
               }
            }},
            {"match": {
               "address": "990 Mill Road"
            }}
         ]
      }
   }
}
```



8、`aggregations`（执行聚合）

​	聚合提供了从数据中分组和提取数据的能力。最简单的聚合方法大致等于 SQL GROUP BY 和 SQL 聚合函数。在 Elasticsearch 中，`有执行搜索返回 hits（命中结果），并且同时返回聚合结果`，把一个响应中的所有 hits（命中结果）分隔开的能力。这是非常强大且有效的，您可以执行查询和多个聚合，并且在一次使用中得到各自的（任何一个的）返回结果，使用一次简洁和简化的 API 来避免网络往返。



例：搜索 address 中包含 mill 的所有人的年龄分布以及平均年龄，但不显示这些人的详情。

```http
GET bank/_search
{
  "query": { # 查询出包含mill的
    "match": {
      "address": "Mill"
    }
  },
  "aggs": { #基于查询聚合
    "ageAgg": {  # 聚合的名字，随便起
      "terms": { # 看值的可能性分布
        "field": "age",
        "size": 10
      }
    },
    "ageAvg": { 
      "avg": { # 看age值的平均
        "field": "age"
      }
    },
    "balanceAvg": {
      "avg": { # 看balance的平均
        "field": "balance"
      }
    }
  },
  "size": 0  # 不看详情
}
```

查询结果：

```json
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 4, // 命中4条
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "ageAgg" : { // 第一个聚合的结果
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : 38,  # age为38的有2条
          "doc_count" : 2
        },
        {
          "key" : 28,
          "doc_count" : 1
        },
        {
          "key" : 32,
          "doc_count" : 1
        }
      ]
    },
    "ageAvg" : { // 第二个聚合的结果
      "value" : 34.0  # balance字段的平均值是34
    },
    "balanceAvg" : {
      "value" : 25208.0
    }
  }
}
```



例：按照年龄聚合，并且求这些年龄段的这些人的平均薪资

`aggs/aggName/aggs/aggName`子聚合

> 写到一个聚合里是基于上个聚合进行子聚合。
>
> 下面求每个age分布的平均balance

```http
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "ageAgg": {
      "terms": { # 看分布
        "field": "age",
        "size": 100
      },
      "aggs": { # 与terms并列
        "ageAvg": { #平均
          "avg": {
            "field": "balance"
          }
        }
      }
    }
  },
  "size": 0
}
```



例：复杂子聚合：查出所有年龄分布，并且这些**年龄段**中M的平均薪资和F的平均薪资以及这个年龄段的总体平均薪资

```http
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "ageAgg": {
      "terms": {  #  看age分布
        "field": "age",
        "size": 100
      },
      "aggs": { # 子聚合
        "genderAgg": {
          "terms": { # 看gender分布
            "field": "gender.keyword" # 注意这里，文本字段应该用.keyword
          },
          "aggs": { # 子聚合
            "balanceAvg": {
              "avg": { # 男性的平均
                "field": "balance"
              }
            }
          }
        },
        "ageBalanceAvg": {
          "avg": { #age分布的平均（男女）
            "field": "balance"
          }
        }
      }
    }
  },
  "size": 0
}
```

### 3、Mapping字段映射

1、字段类型

![image-20211012145448490](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954677.png)

> - `text` ⽤于全⽂索引，搜索时会自动使用分词器进⾏分词再匹配
> - `keyword` 不分词，搜索时需要匹配完整的值

![image-20211012145516034](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954708.png)

![image-20211012145531890](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954291.png)



2、Mapping（映射）
Mapping 是用来定义一个文档（document），以及它所包含的属性（field）是如何存储和索引的。比如，使用 mapping 来定义：

- 哪些字符串属性应该被看做全文本属性（full text fields）；
- 哪些属性包含数字，日期或地理位置；
- 文档中的所有属性是否都能被索引（all 配置）；
- 日期的格式；
- 自定义映射规则来执行动态添加属性；
- 查看mapping信息：`GET bank/_mapping`



3、新版本改变

ElasticSearch7-去掉type概念

* 关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的。elasticsearch是基于Lucene开发的搜索引擎，而ES中不同type下名称相同的filed最终在Lucene中的处理方式是一样的。
  * 两个不同type下的两个user_name，在ES同一个索引下其实被认为是同一个filed，你必须在两个不同的type中定义相同的filed映射。否则，不同type中的相同字段名称就会在处理中出现冲突的情况，导致Lucene处理效率下降。
  * 去掉type就是为了提高ES处理数据的效率。

Elasticsearch 7.x URL中的type参数为可选。比如，索引一个文档不再要求提供文档类型。

Elasticsearch 8.x 不再支持URL中的type参数。

解决：
 1）将索引从多类型迁移到单类型，每种类型文档一个独立索引

 2）将已存在的索引下的类型数据，全部迁移到指定位置即可。详见数据迁移



4、对映射的操作

1）创建索引并指定映射

```json
PUT /my_index
{
  "mappings": {
    "properties": {
      "age": {
        "type": "integer"
      },
      "email": {
        "type": "keyword" # 指定为keyword
      },
      "name": {
        "type": "text" # 全文检索。保存时候分词，检索时候进行分词匹配
      }
    }
  }
}
```



2）添加新的字段映射

```json
PUT /my_index/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false # 字段不能被检索。检索
    }
  }
}
```



3)更新映射

对于已经存在的映射字段，我们不能更新。更新必须创建新的索引进行数据迁移



4）数据迁移

先创建new_twitter的正确映射，然后使用如下方式进行数据迁移。

```json
6.0以后写法
POST reindex
{
  "source":{
      "index":"twitter"
   },
  "dest":{
      "index":"new_twitters"
   }
}


老版本写法
POST reindex
{
  "source":{
      "index":"twitter",
      "twitter":"twitter"
   },
  "dest":{
      "index":"new_twitters"
   }
}
```



示例：把bank/account下的文档迁移到newbank下

* 创建newbank索引

  ```json
  PUT /newbank
  {
    "mappings": {
      "properties": {
        "account_number": {
          "type": "long"
        },
        "address": {
          "type": "text"
        },
        "age": {
          "type": "integer"
        },
        "balance": {
          "type": "long"
        },
        "city": {
          "type": "keyword"
        },
        "email": {
          "type": "keyword"
        },
        "employer": {
          "type": "keyword"
        },
        "firstname": {
          "type": "text"
        },
        "gender": {
          "type": "keyword"
        },
        "lastname": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "state": {
          "type": "keyword"
        }
      }
    }
  }
  ```

* 数据迁移

  ```json
  POST _reindex
  {
    "source": {
      "index": "bank",
      "type": "account"
    },
    "dest": {
      "index": "newbank"
    }
  }
  ```

* 查看newbank中的数据

  ```json
  GET /newbank/_search
  
  输出
    "hits" : {
      "total" : {
        "value" : 1000,
        "relation" : "eq"
      },
      "max_score" : 1.0,
      "hits" : [
        {
          "_index" : "newbank",
          "_type" : "_doc", # 没有了类型
  ```



### 4、分词

* 一个tokenizer（分词器）接收一个字符流，将之分割为独立的tokens（词元，通常是独立的单词），然后输出tokens流。

* 例如：whitespace tokenizer遇到空白字符时分割文本。它会将文本"Quick brown fox!"分割为[Quick,brown,fox!]

* 该tokenizer（分词器）还负责记录各个terms(词条)的顺序或position位置（用于phrase短语和word proximity词近邻查询），以及term（词条）所代表的原始word（单词）的start（起始）和end（结束）的character offsets（字符串偏移量）（用于高亮显示搜索的内容）。

* elasticsearch提供了很多内置的分词器（标准分词器），可以用来构建custom analyzers（自定义分词器）

示例：

```json
POST _analyze
{
  "analyzer": "standard",
  "text": "Quick brown fox!"
}
```

分词结果：

![image-20211012154808341](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954361.png)



**1、安装ik分词器**

所有的语言分词，默认使用的都是“Standard Analyzer”，但是这些分词器针对于中文的分词，并不友好。为此需要安装中文的分词器。

下载地址：https://github.com/medcl/elasticsearch-analysis-ik/releases

在前面安装的elasticsearch时，我们已经将elasticsearch容器的“/usr/share/elasticsearch/plugins”目录，映射到宿主机的“ /mydata/elasticsearch/plugins”目录下，所以比较方便的做法就是下载“/elasticsearch-analysis-ik-7.4.2.zip”文件，然后解压到该文件夹下即可。安装完毕后，需要重启elasticsearch容器。


**2、测试分词器**

1、ik_smart

```json
POST _analyze
{
  "analyzer": "ik_smart",
  "text": "我是中国人"
}
```

返回结果

```json
{
  "tokens" : [
    {
      "token" : "我",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "CN_CHAR",
      "position" : 0
    },
    {
      "token" : "是",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "CN_CHAR",
      "position" : 1
    },
    {
      "token" : "中国人",
      "start_offset" : 2,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 2
    }
  ]
}
```

2、ik_max_word

```json
POST _analyze
{
  "analyzer": "ik_max_word",
  "text": "我是中国人"
}
```

返回结果

```json
{
  "tokens" : [
    {
      "token" : "我",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "CN_CHAR",
      "position" : 0
    },
    {
      "token" : "是",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "CN_CHAR",
      "position" : 1
    },
    {
      "token" : "中国人",
      "start_offset" : 2,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 2
    },
    {
      "token" : "中国",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "CN_WORD",
      "position" : 3
    },
    {
      "token" : "国人",
      "start_offset" : 3,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 4
    }
  ]
}
```



**3、自定义词库**

先安装nginx

1）随便启动一个 nginx 实例，只是为了复制出配置

```shell
docker run -p 80:80 --name nginx -d nginx:1.10
```

2)将容器内的配置文件拷贝到当前目录

```shell
docker container cp nginx:/etc/nginx .
```

3）修改文件名称：mv nginx conf 把这个 conf 移动到/mydata/nginx 下

4）终止原容器：docker stop nginx

5）执行命令删除原容器：docker rm $ContainerId

6）创建新的 nginx；执行以下命令

```she
docker run -p 80:80 --name nginx \
-v /mydata/nginx/html:/usr/share/nginx/html \
-v /mydata/nginx/logs:/var/log/nginx \
-v /mydata/nginx/conf:/etc/nginx \
-d nginx:1.10
```

7)给 nginx 的 html 下面放的所有资源可以直接访问；

8)在nginx/html/中创建一个es文件夹，在里面新建文件fenci.txt，用作分词表，写入：尚硅谷

![image-20211012192408901](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954484.png)

9）访问，由于访问nginx中资源，都在html文件夹下查找，所以直接访问/es/fenci.txt即可（乱码先不用管，访问到了即可）

![image-20211012192537189](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407231954706.png)

10）修改/usr/share/elasticsearch/plugins/ik/config中的IKAnalyzer.cfg.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
	<comment>IK Analyzer 扩展配置</comment>
	<!--用户可以在这里配置自己的扩展字典 -->
	<entry key="ext_dict"></entry>
	 <!--用户可以在这里配置自己的扩展停止词字典-->
	<entry key="ext_stopwords"></entry>
	<!--用户可以在这里配置远程扩展字典 -->
	<entry key="remote_ext_dict">http://192.168.56.10/es/fenci.txt</entry> 
	<!--用户可以在这里配置远程扩展停止词字典-->
	<!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>
```

11）重启es,验证分词效果

```json
POST _analyze
{
  "analyzer": "ik_max_word",
  "text": "尚硅谷不错"
}
```

分词效果

```json
{
  "tokens" : [
    {
      "token" : "尚硅谷",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "CN_WORD",
      "position" : 0
    },
    {
      "token" : "硅谷",
      "start_offset" : 1,
      "end_offset" : 3,
      "type" : "CN_WORD",
      "position" : 1
    },
    {
      "token" : "不错",
      "start_offset" : 3,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 2
    }
  ]
}
```







# go-elasticsearch

[开始使用 |Elasticsearch Go 客户端 ](https://www.elastic.co/guide/en/elasticsearch/client/go-api/current/getting-started-go.html)

使用第三方组件步骤

创建客户端，

使用客户端操作相应API

# 创建客户端

go提供了2种两种客户端，一种是低级api，一种是全类型API，下面提供了示例全是基于全类型的。具体的可以查看上方给出的官网。

![image-20240724174725467](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407241747556.png)

```go
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
	return
}

```

看到该客户端有API

![image-20240724174902053](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407241749128.png)



# 创建索引

```go
typedClient.Indices.Create("my_index").Do(context.TODO())
```



# 增加文档

```go
document := struct {
    Name string `json:"name"`
}{
    "go-elasticsearch",
}
typedClient.Index("my_index").
		Id("1").
		Request(document).
		Do(context.TODO())
```



# 查询文档

```go
typedClient.Get("my_index", "id").Do(context.TODO())
```



# 更新文档

```go
typedClient.Update("my_index", "id").
	Request(&update.Request{
        Doc: json.RawMessage(`{ language: "Go" }`),
    }).Do(context.TODO())
```



# 删除文档

```go
typedClient.Delete("my_index", "id").Do(context.TODO())
```



# 删除索引

```go
typedClient.Indices.Delete("my_index").Do(context.TODO())
```



# 简单实现帖子全文检索

## 定义实体

```go
type Post struct {
	ID          int64     `json:"id,string" db:"post_id"`                            // 帖子id
	AuthorID    int64     `json:"author_id" db:"author_id"`                          // 作者id
	CommunityID int64     `json:"community_id" db:"community_id" binding:"required"` // 社区id
	Status      int32     `json:"status" db:"status"`                                // 帖子状态
	Title       string    `json:"title" db:"title" binding:"required"`               // 帖子标题
	Content     string    `json:"content" db:"content" binding:"required"`           // 帖子内容
	CreateTime  time.Time `json:"create_time" db:"create_time"`                      // 帖子创建时间
}
```



## 创建索引

```go
// createIndex 创建索引
func createIndex(client *elasticsearch.TypedClient) {
	resp, err := client.Indices.
		Create("post").
		Do(context.Background())
	if err != nil {
		fmt.Printf("create index failed, err:%v\n", err)
		return
	}
	fmt.Printf("index:%#v\n", resp.Index)
}
```



## 增加文档

```go
// indexDocument 索引文档
func indexDocument(client *elasticsearch.TypedClient,post Post) {
	// 定义 document 结构体对象
	//Post{
    //  ID: 1,             // 帖子id
    //    AuthorID:          // 作者id
    //    CommunityID:       // 社区id
    //    Status:            // 帖子状态
    //    Title:             // 帖子标题
    //    Content:           // 帖子内容
    //    CreateTime:        //帖子创建时间
	//		}

	// 添加文档
	resp, err := client.Index("post").
		Id(strconv.FormatInt(post.ID, 10)).
		Document(post).
		Do(context.Background())
	if err != nil {
		fmt.Printf("indexing document failed, err:%v\n", err)
		return
	}
	fmt.Printf("result:%#v\n", resp.Result)
}

```



## 动态搜索文档

```go
import (
	"context"
	"fmt"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
)

// searchDocument 指定条件搜索文档
func searchDocument(client *elasticsearch.TypedClient,str string) data []string {
	// 搜索content中包含的文档
	resp, err := client.Search().
		Index("post").
		Query(&types.Query{
			MatchPhrase: map[string]types.MatchPhraseQuery{
				"content": {Query: str},
			},
		}).
		Do(context.Background())
	if err != nil {
		fmt.Printf("search document failed, err:%v\n", err)
		return
	}
	//fmt.Printf("total: %d\n", resp.Hits.Total.Value)
	//// 遍历所有结果
	for _, hit := range resp.Hits.Hits {
		fmt.Printf("%s\n", hit.Source_)
        // 这里假设hit.Source_是字符串类型，如果实际类型不同，需要做相应的转换
		data = append(data, fmt.Sprintf("%v", hit.Source_))
	}
    return
}

```

