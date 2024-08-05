---
# 这是文章的标题
title: gin使用redis实现共同关注
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
  - gin使用redis实现共同关注
  - redis
# 此页面会在文章列表置顶
# sticky: false

# 此页面会出现在星标文章中
# star: false

# 你可以自定义页脚
# footer: 这是测试显示的页脚

# 你可以自定义版权信息
# copyright: 无版权


---

gin使用redis实现共同关注

<!-- more -->

可以使用mysql结合redis记录用户关注的关系，mysql和redis各存一份，之后可以使用set集合求交集，方便求得两个用户之间的共同关注，避免在mysql频繁查询。redis是键值数据库，键为业务前缀：userid，值为set集合，把该用户所关注的用户id加入set集合，set集合重复会加不进去，这样就简单实现了不可重复关注。



先定义错误提示

```go
//定义错误提示
var (
	ErrFollowRepeated    = errors.New("查询不到信息")
	ErrNotFollowRepeated = errors.New("不允许重复取消关注")
)
```

# dao层

## 关注

首先需要实现**关注**的方法，代码如下

```go
//关注的方法，key的格式：前缀+用户id
func FollowOn(userId int64, followId int64) error {
	//1.生成Key
	followkey := getRedisKey(KeyFollowSetPF + strconv.Itoa(int(userId)))

	//2.关注，把被关注的id加入该用户的set集合。
	_, err := client.SAdd(followkey, followId).Result()
	if err != nil {
		return err
	}
	return nil
}
```

## 取关

需要实现**取关**方法，代码如下

```go
func FollowOff(userId int64, followId int64) error {
	//1.生成Key
	followkey := getRedisKey(KeyFollowSetPF + strconv.Itoa(int(userId)))

	// 2.取关，删除set中元素
	_, err := client.SRem(followkey, followId).Result()
	if err != nil {
		return err
	}
	return nil
}

```

## 判断是否关注

判断是否关注

```go

func GetIsFollow(p *models.Follow) bool {
	//1.生成Key
	followkey := getRedisKey(KeyFollowSetPF + strconv.Itoa(int(p.UserID)))

	isMember, _ := client.SIsMember(followkey, p.FollowUserID).Result()

	return isMember
}
```

## 两用户求交集

两用户求交集

```go

// GetFollowCommons 获取共同关注，求交集
func GetFollowCommons(userId, commonId int64) *[]string {
	// 1. 生成Key
	followkey1 := getRedisKey(KeyFollowSetPF + strconv.Itoa(int(userId)))
	followkey2 := getRedisKey(KeyFollowSetPF + strconv.Itoa(int(commonId)))

	// 2. 使用Redis客户端执行SInter操作
	result, err := client.SInter(followkey1, followkey2).Result()
	if err != nil {
		// 3. 如果发生错误，返回nil
		return nil
	}
	// 5. 返回users切片
	return &result
}
```

# 业务层

## 关注

```go
var (
	ErrFollowRepeated = errors.New("重复关注")
)

// InsertFollow 关注
func InsertFollow(p *models.Follow) (err error) {

	//先查询一下是否已关注
	isFollow := redis.GetIsFollow(p)

	if isFollow {
		return ErrFollowRepeated
	}
	// 1. 保存到数据库
	err = mysql.InsertFollow(p)
	if err != nil {
		return err
	}
	// err = redis.CreatePost(p.ID, p.CommunityID)
	//2.redis中插入set数据
	//同时把数据放进redis，把关注用户的id，放入redis的set集合 sadd userId followerUserId
	if err := redis.FollowOn(p.UserID, p.FollowUserID); err != nil {

		return err
	}
	return
	// 3. 返回
}
```

## 取关

```go
// DeleteFollow 取消关注
func DeleteFollow(p *models.Follow) (err error) {

	// 1. 保存到数据库
	err = mysql.DeleteFollow(p)
	if err != nil {
		return err
	}
	//取关则删除数据
	//同时把数据放进redis，把关注用户的id，放入redis的set集合 sadd userId followerUserId
	redis.FollowOff(p.UserID, p.FollowUserID)
	return
	// 3. 返回
}
```

## 获取共同关注

```go
// GetFollowCommons 获取共同关注
func GetFollowCommons(userId, commonId int64) []*models.User {

	//3.redis中求set集合求交集
	result := redis.GetFollowCommons(userId, commonId)

	// 4. 解析结果，并转换为models.User类型的切片
    // 这里是分配了一个指针数组，并把这个指针数组返回。
	users := make([]*models.User, len(*result))
	for i, id := range *result {
		// 这里需要根据id查询对应的用户信息，并填充到users切片
		// 假设有一个函数getUserByID，可以查询到对应的用户信息
		idInt, err := strconv.ParseInt(id, 10, 64)
		if err != nil {
			break
		}
        
		user, err := mysql.GetUserById(idInt)
		if err != nil {
			break
		}
        //users[i]是指针，*users[i]是获取该地址的值。(*user)是因为其也是一个指针。
		(*users[i]).UserID = (*user).UserID
	}
	return users
}
```

