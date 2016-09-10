const fs = require('fs');
const path = require('path');
const async = require('async')
const cheerio = require('cheerio')
const request = require('request');
const colors = require("colors")

const opts = {
    baseUrl: 'http://www.luoo.net/music/',
    range: [...Array(854).keys()].slice(1) // [1..853]
}

class Crawler {
    constructor() {

    }

    start() {
        this.checkImgPath('/luowang')
        async.eachOfSeries(opts.range, (n, idx, callback)=> {
            this.getSongList(opts.baseUrl+n, n, callback)
                .then((songInfo)=> {
                    console.log(colors.green(`\nvol.${n} ${songInfo.title}'s downloading is started!`))    
                    async.eachOfSeries(songInfo.songs, (s, i, callback2)=> {
                        this.downloadSong(n, s, i+1, songInfo.dir, callback2)
                    }, ()=> {
                        console.log(colors.green(`vol.${n} ${songInfo.title} is downloaded!`))                        
                        callback(null)
                    })
                })
        }, ()=> {
            console.log(colors.magenta('All is downloaded!!!'))
        })
    }

    checkImgPath(p) {
        try {
            fs.accessSync(path.join(__dirname, p) , fs.F_OK);
            // Do something
        } catch (e) {
            fs.mkdirSync(path.join(__dirname, p))
            // It isn't accessible
        }
    }

    getSongList(url, n) {
        const self = this
        return new Promise(function(resolve, reject){
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(body) 
                    const title = $('.vol-title').text()
                    const dir = `/luowang/vol.${n} ${title}`
                    const songs = $('.track-wrapper').map(function(i, el) {
                        return $(el).find('.trackname').text() + '-' + $(el).find('.artist').text()
                    })
                    self.checkImgPath(dir)
                    resolve({title,songs,dir})
                }
            })
        })
        
    }

    downloadSong(radio, title, num, dir, callback2) {
        // vol.2 and below is different
        num = radio > 2 && num < 10 ? '0' + num : num
        const uri = `http://luoo-mp3.kssws.ks-cdn.com/low/luoo/radio${radio}/${num}.mp3`

        request(uri)
            .pipe(fs.createWriteStream(path.join(__dirname, dir, title+'.mp3')))
            .on('error', function(err) {
                callback2(null)
            })
            .on('close', ()=> {
                console.log(title, ' is downloaded!')
                callback2(null)
            })
    }
}

const crawler = new Crawler()
crawler.start()







