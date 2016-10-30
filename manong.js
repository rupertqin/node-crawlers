// use flag: --harmony_async_await 
// node version >= 7.0
const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const AV = require('leancloud-storage')
var read = require('node-readability')
const querystring = require('querystring')
const Promise = require('bluebird')

const requestPromise = Promise.promisify(request, {multiArgs: false})
const readPromise = Promise.promisify(read, {multiArgs: false})

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

    async getList(url, callback) {
        const options = {
            url: url,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        
        var data = await requestPromise(options)
        if (data.statusCode == 200) {
            const $ = cheerio.load(data.body) 
            async.eachOfSeries($('h4'), (el, i, callback2)=> {
                let ATag = $(el).find('a').first()
                let link = querystring.parse($(ATag).attr('href').split('?')[1]).url
                // link = decodeURIComponent(link)
                let obj = {
                    title: $(ATag).text(),
                    link: link,
                }
                console.log('link: ', link)
                this.getDetail(link, obj, callback2)
            }, ()=> {
                console.log('list ' + url + ' is saved!!!')
                callback(null)
            })
        } else {
            console.log('bad href: ', data.request.href)
            // continue
            callback(null)
        }
    }

    async getDetail(url, obj, callback2) {
        const options = {
            url: url,
            timeout: 5 * 1000,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        let data
        try {
            data = await requestPromise(options)
            if (data && data.statusCode == 200) {
                const article = await readPromise(data.body)
                if (!article) return callback2(null)
                this.save({
                    url: url,
                    title: article.title,
                    content: article.content
                }, callback2)
                article.close();
            } else {
                console.log('bad href: ', url)
                // continue
                callback2(null)
            }
        } catch (err){
            if (err) {
                console.log('bad href2: ', url)
                callback2(null)
            }
        }
        
    }

    // requestPromise(options) {
    //     return new Promise(function(resolve, reject) {
    //         request(options, function(error, response, body) {
    //             resolve({error, response, body})
    //         })
    //     })
    // }

    // readPromise(body) {
    //     return new Promise(function(resolve, reject) {
    //         read(body, function(err, article, meta) {
    //             resolve({err, article, meta})
    //         })
    //     })
    // }

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



