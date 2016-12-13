// 只获取 html 信息，留作第二步处理
// use flag: --harmony_async_await 
// node version >= 7.0
const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const _ = require('lodash')
const querystring = require('querystring')
const Promise = require('bluebird')
const pg = require('pg')

const requestPromise = Promise.promisify(request, {multiArgs: false}),
	baseUrl = 'http://weekly.manong.io/issues/',
	issues = _.range(146,148),
	requestOptions = {
		timeout: 10 * 1000,
		headers: {
			'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36 115Browser/6.0.3`
		}
	}

class Crawler {
	constructor(db) {
		this.db = db
	}

	start() {
		async.eachOfSeries(issues, (issue, idx, callback)=> {
			this.issue = issue
			this.getList(callback)
		}, ()=> {
			console.log('All is saved!!!')
		})
	}

	async getList(callback) {
		let options = requestOptions
		options.url = baseUrl + this.issue
		var data = await requestPromise(options)
		if (data.statusCode == 200) {
			const $ = cheerio.load(data.body)
			async.eachOfSeries($('h4'), (el, i, callback2)=> {
				let ATag = $(el).find('a').first()
				let link = querystring.parse($(ATag).attr('href').split('?')[1]).url
				let description = $(el).next('p')
				if (description.length) {
					description = description.text().trim()
				}
				let obj = {
					title: $(ATag).text(),
					url: link,
					issue: this.issue,
					ps: description
				}
				console.log('link: ', link)
				this.getDetail(link, obj, callback2)
			}, ()=> {
				console.log('list ' + options.url + ' is saved!!!')
				callback(null)
			})
		} else {
			console.log('bad list href: ', data.request.href)
			// continue
			callback(null)
		}
	}

	async getDetail(link, obj, callback2) {
		let options = requestOptions
		options.url = link
		let data
		try {
			data = await requestPromise(options)
			if (data && data.statusCode == 200) {
				obj.html = data.body
				this.save(obj, callback2)
			} else {
				console.log('bad href: ', link)
				// continue
				callback2(null)
			}
		} catch (err){
			if (err) {
				console.log('bad href2: ', link)
				callback2(null)
			}
		}
	}

	async save(data, callback2) {
		try {
			await this.db('articles').insert(data)
			console.log(data.title + ' saved!');
		} catch (err) {
			callback2(null)
		}
		callback2(null)
	}

}




;(async ()=> {
	var knex = require('knex')({
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

	const crawler = new Crawler(knex)
	crawler.start()

})()






