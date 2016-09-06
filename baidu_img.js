const prompt = require('prompt');
const fs = require('fs');
const request = require('request');
const str_table = {
    '_z2C\\$q': ':',
    '_z&e3B': '.',
    'AzdH3F': '/'
}

const char_table = {
    'w': 'a',
    'k': 'b',
    'v': 'c',
    '1': 'd',
    'j': 'e',
    'u': 'f',
    '2': 'g',
    'i': 'h',
    't': 'i',
    '3': 'j',
    'h': 'k',
    's': 'l',
    '4': 'm',
    'g': 'n',
    '5': 'o',
    'r': 'p',
    'q': 'q',
    '6': 'r',
    'f': 's',
    'p': 't',
    '7': 'u',
    'e': 'v',
    'o': 'w',
    '8': '1',
    'd': '2',
    'n': '3',
    '9': '4',
    'c': '5',
    'm': '6',
    '0': '7',
    'b': '8',
    'l': '9',
    'a': '0'
}


function decodeUrl(url) {
    for (let k in str_table) {
        let p = new RegExp(k, 'g')
        url = url.replace(p, str_table[k])
    }

    url = url.split('').map((s)=> {
        if (s in char_table) {
            s = char_table[s]
        }
        return s
    }).join('')

    return url
    
}

function getSearchUrl(word, count) {
    return `http://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&fp=result&queryWord=${word}&cl=2&lm=-1&ie=utf-8&oe=utf-8&st=-1&ic=0&word=${word}&face=0&istype=2nc=1&pn=0&rn=${count}`
}

function getImgUrls(arr) {
    return arr.map((url)=> {
        console.log(url.objURL)
        if (url.objURL) {
            return decodeUrl(url.objURL)
        } else {
            return undefined
        }

    })
}

function download(uri, filename, callback) {
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}


prompt.start();
prompt.get(['keyword', 'count'], function (err, result) {
    console.log('Command-line input received:');
    console.log('  请输入你要下载的图片关键词：' + result.keyword);
    console.log('  请输入你要下载的图片的数目：' + result.count);


    let url = getSearchUrl(result.keyword, result.count)
    request(url, function(error, response, body){
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body)
            let urls = getImgUrls(body.data.slice(0,result.count))
            urls.forEach(function(v, k){
                download(v, `img/${k}.jpg`, function(){
                    console.log(k)
                })
            })
        }
    })

});





