// 只获取 html 信息，留作第二步处理
// use flag: --harmony_async_await
// node version >= 7
// a postgres server is needed

const request         = require('request')
const cheerio         = require('cheerio')
const querystring     = require('querystring')
const Promise         = require('bluebird')
const chalk           = require('chalk')
const knex            = require('knex')
const pg              = require('pg')

const helper					= require('./lib/helper')

const requestPromise	= Promise.promisify(request, {multiArgs: false}),
  BASEURL							= 'http://weekly.manong.io/issues/',
  REQ_OPTS			= {
    timeout: 10 * 1000,
    headers: {
      'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`
    }
  }

const db = knex({
  client: 'pg',
  connection: 'postgres://postgres@127.0.0.1:5432/dev_reading',
  pool: { min: 0, max: 7 },
  //   acquireConnectionTimeout: 6000
});

class Manong {
  constructor(db = db, issues, perPage = Infinity) {
    this.db				= db
    this.ISSUES		= issues
    this.issue		= undefined
    this.perPage	= perPage
  }

  async start() {
    for (let issue of this.ISSUES) {
      this.issue	= issue
      try {
        await this.getList()
        console.log(chalk.green(`ISSUE :: ${issue}  :: IS SAVED \n`))
      } catch (err) {
        console.log(chalk.red(`BAD ISSUE : ${issue}`))
      }
    }
    console.log(chalk.green(':::::: ALL IS SAVED ::::::'))

  }

  async getList() {
    return new Promise(async (resolve, reject)=> {
      let options			= {url: BASEURL + this.issue}
      Object.assign(options, REQ_OPTS)

      const response	= await requestPromise(options)

      // 40x
      if (response.statusCode !== 200) {
        return reject(true)
      }

      const $ = cheerio.load(response.body);

      // support test
      const h4 = $('h4').slice(0, this.perPage)

      for (let el of Array.from(h4)) {
        let ATag				= $(el).find('a').first()
        let link				= querystring.parse( $(ATag).attr('href').split('?')[1] )
                          .url

        // bad link attr
        if (!link) continue;

        let description = $(el).next('p')
        if (description.length) {
          description = description.text().trim()
        }
        let data = {
          title: $(ATag).text(),
          url: link,
          issue: this.issue,
          ps: description
        }
        await this.getDetail(link, data)
      }
      resolve(true)
    })
  }

  async getDetail(link, data) {
    return new Promise(async (resolve, reject)=> {
      let options			= {url: link}
      Object.assign(options, REQ_OPTS)

      let response

      try {
        response = await requestPromise(options)
      } catch (err){
        if (err) {
          // 50x
          this.saveBadLink(data)
          return reject(true)
        }
      }

      // 40x
      if (!response || response.statusCode !== 200) {
        this.saveBadLink(data)
        return reject(true)
      }
      data.html = response.body

      // get real url
      data.url  = helper.rmToutiaoParams(response.request.href)
      this.save(data)
      resolve(true)
    })
  }

  async saveBadLink(data) {
    try {
      await this.db('bad_articles').insert(data)
      console.log(chalk.red('BAD ARTICLES : ' + data.title + ' IS NOT SAVED'))
    } catch (err) {
      if (err) console.log(err)
    }
  }

  async save(data) {
    try {
      await this.db('articles').insert(data)
      console.log(data.title + ' saved');
    } catch (err) {
      if (err) console.log(err)
    }
  }

}
module.exports = Manong

  // await knex('articles').insert({title: 'Slaughterhouse Five'})


  // knex.schema.createTableIfNotExists('articles', function(table) {
  //     table.increments('id').primary();
  //     table.string('url');
  //     table.string('title');
  //     table.string('ps');
  //     table.integer('issue');
  //     table.text('html');
  //     table.timestamps();
  // })
  // .then(function() {
  //   console.log('done')
  // })





