const querystring			= require('querystring')

module.exports = {
  validLink: function() {
     const pat = /[]/
  },

  rmToutiaoParams: function(url) {
    if (!url.includes('?')) return url
    const base = url.split('?')[0]
    var params = querystring.parse(url)
    for (let k in params) {
      if (params[k].includes('toutiao'))
        delete params[k]
    }
    if (Object.keys(params).length === 0)
      return base
    else
      return base + '?' + querystring.stringify(params)
  }
}
