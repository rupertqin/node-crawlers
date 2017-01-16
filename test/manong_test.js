const assert          = require('assert');
const knex						= require('knex')
const pg							= require('pg')
const Manong          = require('../manong_psql_html_only')
const CONF            = require('../config')

describe('Manong', function() {
  describe('#number', function() {
    it('database rows should increase more than 5', async function() {
      const connect = knex({
        client: 'pg',
        connection: CONF.PG_STR,
        pool: { min: 0, max: 7 },
        //   acquireConnectionTimeout: 6000
      });
      let articles    = await connect.select().from('articles')
      const orinLen   = articles.length
      const manong    = new Manong(connect, [143,144], 4)
      await manong.start()
      articles = await connect.select().from('articles')
      assert.ok(articles.length > orinLen + 5, 'big than')
      // assert.isAbove(articles.length, orinLen + 5)
    });
  });
});

