// use flag: --harmony_async_await 
// node version >= 7.0
const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
var read = require('node-readability')
const querystring = require('querystring')
const Promise = require('bluebird')
const MongoClient = require('mongodb').MongoClient

const requestPromise = Promise.promisify(request, {multiArgs: false})
const readPromise = Promise.promisify(read, {multiArgs: false})

const baseUrlQA = 'http://weekly.manong.io/issues/'
const mongoUrl = 'mongodb://localhost:27017/manong'
let   defaultHeaders = {
    'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`,
}

class Crawler {
    constructor(postCol) {
        this.postCol = postCol
    }

    start() {
        async.eachOfSeries([...Array(1+100).keys()].slice(55), (n, idx, callback)=> {
            setTimeout(()=> {
                this.getList(baseUrlQA + n, n, callback)
                console.log('Issue: ', n)
            }, 1000*2)
        }, ()=> {
            console.log('All is saved!!!')
        })
    }

    async getList(url, issueId, callback) {
        const self = this
        const options = {
            url: url,
            timeout: 5 * 1000,
            headers: defaultHeaders
        };
        
        var data = await requestPromise(options)
        if (data.statusCode == 200) {
            const $ = cheerio.load(data.body) 
            async.eachOfSeries($('h4'), async(el, i, callback2)=> {
                let ATag = $(el).find('a').first()
                let link = querystring.parse($(ATag).attr('href').split('?')[1]).url
                const isValid = await self.filterUrl(link)
                if (!isValid) 
                    return callback2(null)
                let obj = {
                    title: $(ATag).text(),
                    url: link,
                    issueId: issueId
                }
                console.log('link: ', link)
                await this.getDetail(obj, callback2)
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

    async filterUrl(url) {
        const pdf = /\.pdf/i
        const manongJob = /job\.manong\.io/i
        if (!!url.match(pdf) ) 
            return false
        if (!!url.match(manongJob) ) 
            return false
        if (await this.isExist(url)) {
            console.log(`${url} is exist.`)
            return false
        }
        return true
    }

    async isExist(url) {
        let arr = await this.postCol.find({url: url}).toArray()
        return arr.length !== 0
    }

    async getDetail(obj, callback2) {
        const options = {
            url: obj.url,
            timeout: 5 * 1000,
            headers: defaultHeaders
        }
        let data
        try {
            data = await requestPromise(options)
        } catch (err){
            if (err) {
                console.log('bad href2: ', obj.url)
                return callback2(null)
            }
        }

        if (data && data.statusCode == 200 &&
            // maybe just empty
            data.body.trim() !== '') {
            const article = await readPromise(data.body)
            if (!article) return callback2(null)
            obj.content = article.content
            this.save(obj, callback2)
            article.close();
        } else {
            console.log('bad href: ', obj.url)
            // continue
            callback2(null)
        }
    }

    async save(data, callback2) {
        try {
            await this.postCol.insert(data)
            console.log(data.title + ' saved!');           
        } catch (err){
            if (err) {
                console.log('bad href3: ', data.url)
            }
        }
        callback2(null)
    }

}

;(async ()=> {
var db = await MongoClient.connect(mongoUrl)
var postCol = db.collection('post');

const crawler = new Crawler(postCol)
crawler.start()
})()





