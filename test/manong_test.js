const assert = require('chai').assert;

const Manong          = require('../manong_psql_html_only')
const knex						= require('knex')
const pg							= require('pg')
const _								=	require('lodash')

console.log(Manong)

describe('Manong', function() {
  describe('#number', function() {
    it('database rows should increase more than 5', async function() {
      const connect = knex({
        client: 'pg',
        connection: 'postgres://postgres@127.0.0.1:5432/dev_reading',
        pool: { min: 0, max: 7 },
        //   acquireConnectionTimeout: 6000
      });
      let articles = await connect.select().from('articles')
      const orinLen = articles.length
      const manong = new Manong(connect, _.range(143,145), 4)
      await manong.start()
      articles = await connect.select().from('articles')
      assert.isAbove(articles.length, orinLen + 5)
    });
  });
});

