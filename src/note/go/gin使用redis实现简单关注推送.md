---
# 这是文章的标题
title: gin使用redis实现简单关注推送
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
  - gin使用redis
  - redis
  - 关注推送
# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权


---

go-简单使用redis，gin使用redis实现简单关注推送

<!-- more -->

# Feed流

当我们关注了用户后，这个用户发了动态，那么我们应该把这些数据推送给用户，这个需求，其实我们又把他叫做Feed流，关注推送也叫做Feed流，直译为投喂。为用户持续的提供“沉浸式”的体验，通过无限下拉刷新获取新的信息。

对于传统的模式的内容解锁：我们是需要用户去通过搜索引擎或者是其他的方式去解锁想要看的内容

![image-20240721000935042](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407210009090.png)



对于新型的Feed流的的效果：不需要我们用户再去推送信息，而是系统分析用户到底想要什么，然后直接把内容推送给用户，从而使用户能够更加的节约时间，不用主动去寻找。

![image-20240721000951669](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407210009705.png)

Feed流产品有两种常见模式：
Timeline：不做内容筛选，简单的按照内容发布时间排序，常用于好友或关注。例如朋友圈

* 优点：信息全面，不会有缺失。并且实现也相对简单
* 缺点：信息噪音较多，用户不一定感兴趣，内容获取效率低

智能排序：利用智能算法屏蔽掉违规的、用户不感兴趣的内容。推送用户感兴趣信息来吸引用户

* 优点：投喂用户感兴趣信息，用户粘度很高，容易沉迷
* 缺点：如果算法不精准，可能起到反作用
  这里是关注后推送，是基于关注的好友来做Feed流，因此采用Timeline的模式。该模式的实现方案有三种：

我们本次针对好友的操作，采用的就是Timeline的方式，只需要拿到我们关注用户的信息，然后按照时间排序即可

，因此采用Timeline的模式。该模式的实现方案有三种：

* 拉模式
* 推模式
* 推拉结合

**拉模式**：也叫做读扩散

该模式的核心含义就是：当张三和李四和王五发了消息后，都会保存在自己的邮箱中，假设赵六要读取信息，那么他会从读取他自己的收件箱，此时系统会从他关注的人群中，把他关注人的信息全部都进行拉取，然后在进行排序

优点：比较节约空间，因为赵六在读信息时，并没有重复读取，而且读取完之后可以把他的收件箱进行清楚。

缺点：比较延迟，当用户读取数据时才去关注的人里边去读取数据，假设用户关注了大量的用户，那么此时就会拉取海量的内容，对服务器压力巨大。



**推模式**：也叫做写扩散。

推模式是没有写邮箱的，当张三写了一个内容，此时会主动的把张三写的内容发送到他的粉丝收件箱中去，假设此时李四再来读取，就不用再去临时拉取了

优点：时效快，不用临时拉取

缺点：内存压力大，假设一个大V写信息，很多人关注他， 就会写很多分数据到粉丝那边去





**推拉结合模式**：也叫做读写混合，兼具推和拉两种模式的优点。

推拉模式是一个折中的方案，站在发件人这一段，如果是个普通的人，那么我们采用写扩散的方式，直接把数据写入到他的粉丝中去，因为普通的人他的粉丝关注量比较小，所以这样做没有压力，如果是大V，那么他是直接将数据先写入到一份到发件箱里边去，然后再直接写一份到活跃粉丝收件箱里边去，现在站在收件人这端来看，如果是活跃粉丝，那么大V和普通的人发的都会直接写入到自己收件箱里边来，而如果是普通的粉丝，由于他们上线不是很频繁，所以等他们上线时，再从发件箱里边去拉信息。

# 传统分页与在feed流中的分页

Feed流中的数据会不断更新，所以数据的角标也在变化，因此不能采用传统的分页模式。

传统了分页在feed流是不适用的，因为我们的数据会随时发生变化

假设在t1 时刻，我们去读取第一页，此时page = 1 ，size = 5 ，那么我们拿到的就是10~6 这几条记录，假设现在t2时候又发布了一条记录，此时t3 时刻，我们来读取第二页，读取第二页传入的参数是page=2 ，size=5 ，那么此时读取到的第二页实际上是从6 开始，然后是6~2 ，那么我们就读取到了重复的数据，所以feed流的分页，不能采用原始方案来做。

![image-20240721031244857](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407210312912.png)

# Feed流的滚动分页

我们需要记录每次操作的最后一条，然后从这个位置开始去读取数据

举个例子：我们从t1时刻开始，拿第一页数据，拿到了10~6，然后记录下当前最后一次拿取的记录，就是6，t2时刻发布了新的记录，此时这个11放到最顶上，但是不会影响我们之前记录的6，此时t3时刻来拿第二页，第二页这个时候拿数据，还是从6后一点的5去拿，就拿到了5-1的记录。我们这个地方可以采用sortedSet来做，可以进行范围查询，并且还可以记录当前获取数据时间戳最小值，就可以实现滚动分页了

![image-20240721031348904](https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407210313957.png)

# 好友关注-实现分页查询收邮箱

需求：在个人主页的“关注”卡片中，查询并展示推送的Blog信息：

具体操作如下：

1、每次查询完成后，我们要分析出查询出数据的最小时间戳，这个值会作为下一次查询的条件

2、我们需要找到与上一次查询相同的查询个数作为偏移量，下次查询时，跳过这些查询过的数据，拿到我们需要的数据

综上：我们的请求参数中就需要携带 lastId：上一次查询的最小时间戳 和偏移量这两个参数。

这两个参数第一次会由前端来指定，以后的查询就根据后台结果作为条件，再次传递到后台。





timeline：时间线，按时间浏览。

推模式：推送到粉丝的信箱。

拉模式：当点入主页时，才从该博主的信息拉取。

如果粉丝量很多，退模式





流程：

创建帖子的同时，获取该作者的粉丝，往粉丝的信箱推送，粉丝点击**我的关注**时，去信箱中取。

所以有   **获取该作者粉丝**，**往信箱进行发送**，**从信箱中取消息**，三个函数。

# dao层

## // 往信箱进行发送

```go
// 往信箱进行发送
func SendFeed(data []*int64, postId int64) error {
	//一次发送，减少rrt次数
	pipeline := client.TxPipeline()
	for _, v := range data {
		//1.生成Key
		key := getRedisKey(KeySendFeedSetPF + strconv.Itoa(int(*v)))
		// 2. 使用Redis客户端执行SInter操作
		//key:postId,2000-0-0
		pipeline.ZAdd(key, redis.Z{
			Score:  float64(time.Now().Unix()), // 时间戳
			Member: postId,                     //帖子ID
		})
	}
	_, err := pipeline.Exec()
	return err
}
```

## // 从信箱中取消息

```go
// 从信箱中取消息
//函数解释：
//userId int64,用户信箱
//lastIdStr,最后查询的帖子id
//offSetStr，偏移量
//(idData []int64,返回查询到的结果 
//newOffSet int64,新的偏移量 
//minTime float64,本次查询的最小时间戳，作用和lastIdStr一样
func SelectMail(userId int64, lastIdStr, offSetStr string) (idData []int64, newOffSet int64, minTime float64, err error) {

	//1.查询该用户收件箱 ZREVRANGEBYSCORE key Max Min LIMIT offset count

	// ZREVRANGE 按分数从大到小的顺序查询指定数量的元素
	// lastId, err := strconv.ParseInt(lastIdStr, 10, 64)
	// if err != nil {
	// 	return nil, err
	// }
	offSet, err := strconv.ParseInt(offSetStr, 10, 64)
	if err != nil {
		return nil, 0, 0, err
	}
    //ZRevRangeByScoreWithScores
    //
	cmd := client.ZRevRangeByScoreWithScores(getRedisKey(KeySendFeedSetPF+strconv.Itoa(int(userId))), redis.ZRangeBy{
		Min:    "0",
		Max:    lastIdStr,
		Offset: offSet,
		Count:  3,
	})
	minTime = 0
	idData = make([]int64, 0, len(cmd.Val()))
	for _, v := range cmd.Val() {
		idInt64, err := strconv.ParseInt(v.Member.(string), 10, 64)
		if err != nil {
			// 处理错误
			continue // 或者返回错误，或者执行其他逻辑
		}
		idData = append(idData, idInt64)
		// 4.2.获取分数(时间戳）
		time := v.Score
        //如果有重复，需要计算偏移量，处理分数相同的情况
		if time == minTime {
			newOffSet++
		} else {
            //如果分数没有重复，偏移量就是1
			minTime = time
			newOffSet = 1
		}
	}

	return
}

```



## // Selectfans 查询用户的粉丝

```go
// Selectfans 查询用户的粉丝，返回
func Selectfans(id int64) (fans []*int64, err error) {
	sqlStr :=
		`select user_id from follow where follow_user_id = ? group by user_id`
	fans = make([]*int64, 0, 2) // 不要写成make([]*models.Post, 2)
	err = db.Select(&fans, sqlStr, id)
	return
}

```



# 业务层

## // 从信箱中取消息

```go
// 从信箱中取消息
func SelctMail(userId int64, lastIdStr, offSetStr string) (idData []int64, newOffSet int64, minTime float64, err error) {
	//1.查询该用户收件箱 ZREVRANGEBYSCORE key Max Min LIMIT offset count
	return redis.SelectMail(userId, lastIdStr, offSetStr)

}
```



## // SelectFans 根据ID查询粉丝

```go
// SelectFans 根据ID查询粉丝
func SelectFans(id int64) ([]*int64, error) {
	return mysql.Selectfans(id)
}
```



# 控制层

## // CreatePostHandler 创建帖子的处理函数

```go
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
	// 2.  从 c 取到当前发请求的用户的ID
	userID, err := getCurrentUserID(c)
	if err != nil {
		ResponseError(c, CodeNeedLogin)
		return
	}
	p.AuthorID = userID
	// 3. 创建帖子
	if err := logic.CreatePost(p); err != nil {
		zap.L().Error("logic.CreatePost(p) failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}

	// 4. 获取该用户的粉丝集合，从mysql获取，或者从redis中获取都可以，然后推送粉丝
	data, err := logic.SelectFans(p.AuthorID)
	if err != nil {
		zap.L().Error("logic.SelectFans(p); failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}
	// 5. 根据粉丝集合，进行推送
	if err := logic.SendFeed(data, p.ID); err != nil {
		zap.L().Error("logic.SendFeed() failed", zap.Error(err))
		ResponseError(c, CodeServerBusy)
		return
	}

	// 6. 返回响应
	ResponseSuccess(c, nil)
}
```



## // 查询分页数据

```go
// 查询分页数据
func GetPostFollowHandler(c *gin.Context) {

	//1.获取当前用户id
	userId, err := getCurrentUserID(c)
	if err != nil {
		ResponseError(c, CodeNeedLogin)
		return
	}
	//v1.GET("/post/of/follow/:lastid/:offset", controller.GetPostFollowHandler)
	lastIdStr := c.Param("lastid")
	offSetStr := c.Param("offset")
	// 2.查询该用户收件箱 ZREVRANGEBYSCORE key Max Min LIMIT offset count
	idData, newOffSet, minTime, err := logic.SelctMail(userId, lastIdStr, offSetStr)
	if err != nil {
		ResponseError(c, CodeInvalidParam)
		return
	}

	//3.根据id查询post
	data, err := logic.GetFollowPostListByIds(&idData, newOffSet, int64(minTime))
	if err != nil {
		ResponseError(c, CodeInvalidParam)
		return
	}
	// 6.封装并返回
	ResponseSuccess(c, data)
}
```

