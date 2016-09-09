const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const AV = require('leancloud-storage')


const baseUrlQA = 'https://book.douban.com/top250?start='
let myConfig = {
    appId: 'your appid',
    appKey: 'your appkey'
}
try {
    let locConf = require('./config')
    Object.assign(myConfig, locConf)
} catch(err) {
    console.error(err)
}

class Crawler {
    constructor() {

    }

    start() {
        // leancloud init
        AV.init({ 
            appId: myConfig.appId, 
            appKey: myConfig.appKey 
        })
        async.eachOfSeries([...Array(10).keys()], (n, idx, callback)=> {
            setTimeout(()=> {
                this.getList(baseUrlQA + n*25, callback)
            }, 1000*2)
        }, ()=> {
            console.log('All is saved!!!')
        })
    }

    getList(url, callback) {
        const options = {
            url: url,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        request(options, (error, response, body)=> {
            console.log(response.request.href)
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(body) 
                async.eachOfSeries($('.article .indent > table'), (el, i, callback2)=> {
                    const link = $(el).find('.nbg').attr('href')
                    let data = {
                        name: $(el).find('.pl2 a').text(),
                        author: $(el).find('p.pl').text(),
                        rating: $(el).find('.rating_nums').text(),
                        comment: $(el).find('.star .pl').text(),
                        cover: $(el).find('img').attr('src'),
                        link: link
                    }
                    setTimeout(()=> {
                        this.getDetail(link, data, callback2)
                    }, 1000*2)
                }, ()=> {
                    console.log('list ' + url + ' is saved!!!')
                    callback(null)
                })
            } else {
                console.log('========= bad href: ', response.request.href)
                // continue
                callback(null)
            }
        }) 
    }

    getDetail(url, data, callback2) {
        const options = {
            url: url,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        request(options, (error, response, body)=> {
            console.log(response.request.href)
            if (!error && response.statusCode == 200) {
                callback2(null)
                const $ = cheerio.load(body) 
                data.intro = $('.intro').text()
            } else {
                console.log('========= bad href: ', response.request.href)
                // continue
                callback2(null)
            }
            // save data anyway
            this.save(data)
        })
    }

    save(data) {
        const DoubanBook = AV.Object.extend('DoubanBook');
        const doubanBook = new DoubanBook();
        doubanBook.save(data).then(function(object) {
            console.log(data.name + ' saved!');
        })
    }

}


const crawler = new Crawler()
crawler.start()



