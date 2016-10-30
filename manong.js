// use flag: --harmony_async_await
const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const AV = require('leancloud-storage')
var read = require('node-readability')
const querystring = require('querystring')

const baseUrlQA = 'http://weekly.manong.io/issues/'
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
        async.eachOfSeries([...Array(2+122).keys()].slice(1+121), (n, idx, callback)=> {
            setTimeout(()=> {
                this.getList(baseUrlQA + n, callback)
            }, 1000*2)
        }, ()=> {
            console.log('All is saved!!!')
        })
    }

    getRealUrl(url) {

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
                async.eachOfSeries($('h4'), (el, i, callback2)=> {
                    let ATag = $(el).find('a').first()
                    let link = querystring.parse($(ATag).attr('href').split('?')[1]).url
                    // link = decodeURIComponent(link)
                    let data = {
                        title: $(ATag).text(),
                        link: link,
                    }
                    console.log('link: ', link)
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
            timeout: 5 * 1000,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        request(options, (error, response, body)=> {
            // console.log(response.request.href)
            if (!error && response.statusCode == 200) {
                read(body, (err, article, meta)=> {
                    if (!article) return callback2(null)
                    let data = {}
                    data.url = url
                    data.title = article.title
                    data.content = article.content
                    this.save(data, callback2)
                    article.close();
                })
            } else {
                if (response) {
                    console.log('========= bad href: ', response.request.href)
                }
                // continue
                callback2(null)
            }
        })
    }

    save(data, callback2) {
        const MaNong = AV.Object.extend('MaNong2');
        const maNong = new MaNong();
        maNong.save(data).then(function(object) {
            callback2(null)
            console.log(data.title + ' saved!');
        })
    }

}


const crawler = new Crawler()
crawler.start()



