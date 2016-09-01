const http = require('http')
const Url = require('url')
const request = require('request')
const querystring = require('querystring')
const MongoClient = require('mongodb').MongoClient
const mongoUrl = 'mongodb://localhost:27017/node-crawler'
let DB


let count = 0,
    positions = ['HTML5', 'Android', 'Python', 'PHP','.NET', 'C#', 'C++', 
        'C', 'VB', 'Perl', 'Ruby', 'Hadoop', 'Node.js', 'Go',
        'ASP', 'Shell', '自然语言处理', '搜索推荐', '精准推荐','技术经理', '架构师', '测试', '技术总监',
        'IOS', 'JavaScript', '网络工程师', 'UI', 'UE', '数据分析', 'MongoDB', 'MySql', 'SQLServer', 'Oracle',
        '运维工程师', 'WEB安全', '网络安全','数据挖掘', 'Java','爬虫工程师'],
    cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '厦门', '长沙', '苏州', '天津',
         '重庆', '合肥', '济南', '大连', '珠海', '宁波', '中山'],
    hangye = ['教育','文化娱乐','移动互联网','游戏','O2O','硬件','社交网络','旅游', 
        '医疗健康','生活服务','信息安全',' 数据服务','广告营销','分类信息','电子商务','金融','企业服务',]


class Crawler {
    constructor() {
        this.collection = []
        // this.db = mongoose.model('lagou', LagouSchema)
    }

    insertData(db, data, callback) {
        var collection = db.collection('lagou');
        // Insert some documents
        // collection.insertMany([
        //     {a : 1}, {a : 2}, {a : 3}
        // ], function(err, result) {

        //     console.log("Inserted 3 documents into the collection");
        //     callback(result)
        // });
        // 
        
        // console.log('data:    =====: ' ,data)

        data['_id'] = data['positionId']
        data['updateTime'] = Date.now()
        collection.insertMany([data])
    }

    getData(url) {
        var options = {
            url: url,
            headers: {
                'Host': 'www.lagou.com',
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
                'Connection': 'keep-alive'
            }
        };
        request(options, (error, response, body)=> {
            if (!error && response.statusCode == 200) {
                console.log('===== body: ' , body);
                let req;
                try {
                    req = JSON.parse(body)

                } catch(e) {
                    if (e) return false;

                }
                console.log('===== data: ' , req);
                // 如果 pageNo == 0 表示后面没有页数了，不用继续往后面请求了
                if (req['content']['pageNo'] == 0) return

                if (('content' in req)) {
                    const list_con = req['content']['positionResult']['result']
                    if (list_con.length >= 0) {
                        for (let i of list_con){
                            // 构建存储字段
                            this.insertData(DB, {
                                "companyShortName": i['companyShortName'],
                                "salary":i['salary'],
                                "city": i['city'],
                                "education": i['education'],
                                "positionName": i['positionName'],
                                "workYear": i['workYear'],
                                "companySize": i['companySize'],
                                "financeStage": i['financeStage'],
                                "industryField": i['industryField'],
                                "positionId":i['positionId']
                            })
                        }
                    }

                } else {
                    console.log('数据错误：',req)
                }
            }
        });

        
    }

    start() {
        const self = this
        for (let i=0;i<hangye.length;i++) {
            console.log('当前行业是：', hangye[i])
            for (let k=0;k<cities.length;k++) {
                console.log('当前城市是：', cities[k])
                for (let pNum=0;pNum<positions.length;pNum++) {
                    console.log('当前职位是：', positions[pNum])
                    for (let page=0;page<31;page++) {
                        setTimeout(()=> {
                            console.log('当前抓取页面是：', page)
                            const options = {
                                hy: hangye[i],
                                px: 'default',
                                city: cities[k],
                                needAddtionalResult: false,
                                first: false, 
                                pn: page, 
                                kd: positions[pNum],
                            }
                            self.getData('http://www.lagou.com/jobs/positionAjax.json?' + querystring.stringify(options))
                        }, 10*1000 * (page+1) * (i+1) * (k+1))
                                          
                    }
                }
            }
        }
    }

}

const crawler = new Crawler()

MongoClient.connect(mongoUrl, function(err, db) {
    console.log("Connected succesfully to server");

    
    DB = db
    crawler.start()

    // crawler.getData(`http://www.lagou.com/jobs/positionAjax.json?hy=教育&px=default&city=北京&needAddtionalResult=false`, 1, 'HTML5')

    // crawler.insertData(db, function() {
    //     db.close();
    // })

})

