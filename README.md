## 爬虫实例

**luowang**     
    爬取落网音乐,下载到本地  

**baidu_img**   
    根据关键词从百度下载图片

**one**         
    爬取 One 网站上的每日一图以及 One 问答,并且存储在 LeanCloud 云后台 

**sujin**       
    爬取素锦网站上的好文章,并且存储在 LeanCloud 云后台  

**douban_book** 
    爬取豆瓣图书 Top250  

**lagou**       
    从拉勾网爬取较大量的职位信息以及存储至 NoSql 类型数据库中  

**zhihu**       
    从知乎网爬取特定ID的精华回答，并且存储在 LeanCloud 云后台。 

**manong**      
    从 manong.io 网爬取文章列表，用 readability 模块解析文章，得到 title、content 信息，存到 LeanCloud 云后台 ———— 由于 manong.io 里的文章是从别的网站文章的收集，只是一个 url 列表， 所以用到了 readability 这个模块，可以提取出相当干净的有用文字， 但也不是100％成功， 不过放心，正确率高达 99.5% 以上， 不过对于比如 “知乎专栏” 这样的 Ajax 请求页面是没有作用的。

**manong_psql_html_only**  
    从 manong.io 网爬取文章列表，不用 readability 模块， 存在本地 pg 数据库中，留作下一步处理

## 关于

看了这个项目[wuchangfeng/Crawler](https://github.com/wuchangfeng/Crawler/)，是用 python 写的，自己熟悉 node，就想用 node 写看看

python 和 node 写爬虫最大的不同是一个天生是同步另一个是异步，这次用 node 模拟了同步代码的写法，因为有些网站有防爬策略，异步就很快。

代码多是这样的两轮循环，都不算复杂,

```js
async.eachOfSeries(arr, function(item, idx, callback) {
    async.eachOfSeries(arr2, function(item2, idx2, callback2) {

    })
})
```
**manong_psql_html_only** 去掉了 `async.eachOfSeries`， 全部用 async/await


