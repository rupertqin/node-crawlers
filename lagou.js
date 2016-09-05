const http = require('http')
const Url = require('url')
const request = require('request')
const querystring = require('querystring')
const MongoClient = require('mongodb').MongoClient
const async = require('async')

const mongoUrl = 'mongodb://localhost:27017/node-crawler'
let DB


let count = 0,
    positions = ['HTML5', 'Android', 'Python', 'PHP','.NET', 'C#', 'C++', 
        'C', 'VB', 'Perl', 'Ruby', 'Hadoop', 'Node.js', 'Go',
        'ASP', 'Shell', '自然语言处理', '搜索推荐', '精准推荐','技术经理', '架构师', '测试', '技术总监',
        'IOS', 'JavaScript', '网络工程师', 'UI', 'UE', '数据分析', 'MongoDB', 'MySql', 'SQLServer', 'Oracle',
        '运维工程师', 'WEB安全', '网络安全','数据挖掘', 'Java','爬虫工程师'],
    cities = ['上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '厦门', '长沙', '苏州', '天津',
         '重庆', '合肥', '济南', '大连', '珠海', '宁波', '中山'],
    hangye = ['教育','文化娱乐','移动互联网','游戏','O2O','硬件','社交网络','旅游', 
        '医疗健康','生活服务','信息安全',' 数据服务','广告营销','分类信息','电子商务','金融','企业服务',]
    mapData = [];

    for (var k = 0; k < hangye.length; k++) {
        for (var j = 0; j < cities.length; j++) {
            for (var i = 0; i < positions.length; i++) {
                mapData.push(hangye[k], cities[j], positions[i])
            }
        }
    }

class Crawler {
    constructor() {
        this.collection = []
    }

    insertData(db, data, callback) {
        var collection = db.collection('lagou');

        data['_id'] = data['positionId']
        data['updateTime'] = Date.now()
        collection.insert(data)
            .then(function(data) {
                console.log('MongoDB ==========: ', data)
                const count = collection.find({}).toArray(function(err, docs) {
                    console.log('docs.length ==========: ', docs.length)
                })
            })
    }

    getData(url, callback) {
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
                // console.log('===== body: ' , body);
                let req;
                try {
                    req = JSON.parse(body)

                } catch(e) {
                    if (e) return false;

                }
                // console.log('===== data: ' , req);
                // 如果 pageNo == 0 表示后面没有页数了，不用继续往后面请求了
                if (req['content']['pageNo'] == 0) {
                    return callback({flag: true})
                }

                if (('content' in req)) {
                    let list_con = req['content']['positionResult']['result']
                    if (list_con.length >= 0) {
                        list_con = list_con.map((i)=> {
                            return {
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
                            }
                        })
                        this.insertData(DB, list_con)
                    }

                    callback(null, req)
                } else {
                    console.log('数据错误：',req)
                    callback({flag: true})
                }
            }
        });

        
    }

    start() {
        const self = this

        async.eachOfSeries(mapData, function(item, idx, callbackOutter) {
            console.log(arguments)

            async.eachOfSeries([...Array(30).keys()], function(item, page, callback) {
                setTimeout(()=> {
                    const options = {
                        hy: item[0],
                        px: 'default',
                        city: item[1],
                        needAddtionalResult: false,
                        first: false, 
                        pn: page, 
                        kd: item[2],
                    }
                    console.log('当前抓取页面是：', 'http://www.lagou.com/jobs/positionAjax.json?' + querystring.stringify(options))
                    self.getData('http://www.lagou.com/jobs/positionAjax.json?' + querystring.stringify(options), callback)
                }, 10*1000)

            }, function(err) {
                if (err && err.flag)
                    callbackOutter()
                else
                    callbackOutter(err)
            })

        }, function(err) {
            if (err)
                return console.error(err);
            console.log('30 pages done!  ', err)
        })
    }

}

const crawler = new Crawler()

MongoClient.connect(mongoUrl, function(err, db) {
    console.log("Connected succesfully to server");

    DB = db
    crawler.start()
})





