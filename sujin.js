const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const AV = require('leancloud-storage')

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
        this.baseUrl = 'http://isujin.com/page/'
        this.pageRange = [...Array(14).keys()].slice(1)
    }

    start() {
        // leancloud init
        AV.init({ 
            appId: myConfig.appId, 
            appKey: myConfig.appKey 
        })
        async.eachOfSeries(this.pageRange, (n, idx, callback)=> {
            this.getList(this.baseUrl + n, callback)
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
                async.eachOfSeries($('.post'), (el, i, callback2)=> {
                    const link = $(el).find('>a').attr('href')
                    let data = {
                        title: $(el).find('.else h3').text(),
                        cover: $(el).find('>a img').attr('src'),
                        link: link
                    }
                    this.getDetail(link, data, callback2)
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
                data.content = $('.content').text()
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
        const Sujin = AV.Object.extend('Sujin');
        const sujin = new Sujin();
        sujin.save(data).then(function(object) {
            console.log(data.title + ' saved!');
        })
    }

}


const crawler = new Crawler()
crawler.start()



