const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const AV = require('leancloud-storage')


const baseUrlQA = 'http://wufazhuce.com/question/'
const baseUrlOne = 'http://wufazhuce.com/one/'
const ArticleRange = [...Array(61).keys()].map(n=>+n+1350) // [1350...1410]

// leancloud init
const appId = 'yourappid';
const appKey = 'yourapkey';
AV.init({ appId, appKey });

async.eachOfSeries(ArticleRange, function(n, idx, callback) {
    console.log(n)
    getQA(baseUrlQA+n, callback)
    getOne(baseUrlOne+n, callback)


})

function getQA(url, callback) {
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
            saveQA(body)
    
        } else {
            callback(true)
        }
    }) 

}


function saveQA(html) {
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


function getOne(url, callback) {
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
            saveOne(body)
    
        } else {
            callback(true)
        }
    }) 

}


function saveOne(html) {
    let $ = cheerio.load(html) 
    const data = {
        img: $('.one-imagen img').attr('src'),
        author: $('.one-imagen-leyenda').text(),
        intro: $('.one-cita').text()
    }
    const One = AV.Object.extend('One');
    const one = new One();
    one.save(data).then(function(object) {
        console.log('LeanCloud Rocks!');
    })
}
