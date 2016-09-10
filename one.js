const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const AV = require('leancloud-storage')


const baseUrlQA = 'http://wufazhuce.com/question/'
const baseUrlOne = 'http://wufazhuce.com/one/'
const ArticleRange = [...Array(61).keys()].map(n=>+n+1350) // [1350...1410]
const appId = 'your appid'
const appKey = 'your appkey'


class Crawler {
    constructor() {

    }

    start() {
        // leancloud init
        AV.init({ appId, appKey });
        async.eachOfSeries(ArticleRange, (n, idx, callback)=> {
            this.getQA(baseUrlQA+n, callback)
        })
        async.eachOfSeries(ArticleRange, (n, idx, callback)=> {
            this.getOne(baseUrlOne+n, callback)
        })
    }

    getQA(url, callback) {
        const options = {
            url: url,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        request(options, (error, response, body)=> {
            console.log(response.request.href)
            if (!error && response.statusCode == 200) {
                callback(null)
                this.saveQA(body)
            } else {
                console.log('========= bad href: ', response.request.href)
                callback(true)
            }
        }) 
    }

    saveQA(html) {
        let $ = cheerio.load(html) 
        const data = {
            question: $('.one-cuestion h4').first().text(),
            detail: $('.one-cuestion .cuestion-contenido').eq(0).text(),
            answer: $('.one-cuestion .cuestion-contenido').eq(1).text()
        }
        const OneQA = AV.Object.extend('OneQA');
        const oneQA = new OneQA();
        oneQA.save(data).then(function(object) {
            console.log('LeanCloud Rocks!');
        })
    }

    getOne(url, callback) {
        const options = {
            url: url,
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
            }
        };
        request(options, (error, response, body)=> {
            console.log(response.request.href)
            if (!error && response.statusCode == 200) {
                this.saveOne(body)
            } else {
                console.log('========= bad href: ', response.request.href)
            }
            callback(null)
        }) 

    }

    saveOne(html) {
        let $ = cheerio.load(html) 
        const data = {
            img: $('.one-imagen img').attr('src'),
            author: $('.one-imagen-leyenda').text(),
            intro: $('.one-cita').text()
        }
        const One = AV.Object.extend('One');
        const one = new One();
        one.save(data).then(function(object) {
            console.log('one saved!');
        })
    }
}


const crawler = new Crawler()
crawler.start()
