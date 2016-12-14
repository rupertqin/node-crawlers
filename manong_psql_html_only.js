// 只获取 html 信息，留作第二步处理
// use flag: --harmony_async_await
// node version >= 7.0
const request					=	require('request')
const async 					=	require('async')
const cheerio					= require('cheerio')
const _								=	require('lodash')
const querystring			= require('querystring')
const Promise					= require('bluebird')
const knex						= require('knex')
const pg							= require('pg')
const chalk						= require('chalk')

const helper					= require('./lib/helper')

const requestPromise	= Promise.promisify(request, {multiArgs: false}),
	BASEURL							= 'http://weekly.manong.io/issues/',
	ISSUES							= _.range(146,148),
	REQ_OPTS			= {
		timeout: 10 * 1000,
		headers: {
			'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`
		}
	}

class Crawler {
	constructor(db) {
		this.db				= db
		this.issue		= undefined
	}

	start() {
		async.eachOfSeries(ISSUES, (issue, idx, callback)=> {
			this.issue	= issue
			this.getList(callback)
		}, ()=> {
			console.log(chalk.green('\n:::::: ALL IS SAVED ::::::'))
		})
	}

	async getList(callback) {
		let options			= {url: BASEURL + this.issue}
		Object.assign(options, REQ_OPTS)

		const response	= await requestPromise(options)
		if (response.statusCode == 200) {
			const $ = cheerio.load(response.body)
			async.eachOfSeries($('h4').slice(0,4), (el, i, callback2)=> {
			// async.eachOfSeries($('h4'), (el, i, callback2)=> {
				let ATag				= $(el).find('a').first()
				let link				= querystring.parse( $(ATag).attr('href').split('?')[1] )
													.url

				// bad link attr
				if (!link) return callback2(null)

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
				console.log('link: ', link)
				this.getDetail(link, data, callback2)
			}, ()=> {
				console.log(chalk.green('LIST :: ' + options.url + ' :: IS SAVED\n'))
				callback(null)
			})
		} else {
			// 50x
			console.log(chalk.red('BAD LIST : ', response.request.href))
			// continue
			callback(null)
		}
	}

	async getDetail(link, data, callback2) {
		let options			= {url: link}
		Object.assign(options, REQ_OPTS)

		try {
			const response = await requestPromise(options)
			if (response && response.statusCode == 200) {
				data.html = response.body

				// get real url
				data.url  = helper.rmToutiaoParams(response.request.href)
				this.save(data, callback2)
			} else {
				// 40x
				this.saveBadLink(data, callback2)
			}
		} catch (err){
			if (err) {
				// 50x
				this.saveBadLink(data, callback2)
			}
		}
	}

	async saveBadLink(data, callback2) {
		try {
			await this.db('bad_articles').insert(data)
			console.log(chalk.red('BAD ARTICLES : ' + data.title + ' IS NOT SAVED'))
		} catch (err) {
			callback2(null)
		}
		callback2(null)
	}

	async save(data, callback2) {
		try {
			await this.db('articles').insert(data)
			console.log(data.title + ' saved');
		} catch (err) {
			callback2(null)
		}
		callback2(null)
	}

}




;(async ()=> {
	const db = knex({
		client: 'pg',
		connection: 'postgres://postgres@127.0.0.1:5432/dev_reading',
		pool: { min: 0, max: 7 },
		//   acquireConnectionTimeout: 6000
	});



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

	const crawler = new Crawler(db)
	crawler.start()

})()






