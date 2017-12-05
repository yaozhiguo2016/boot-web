/**
 * Created by yaozhiguo on 2016/12/22.
 * 从一个http请求的url中解析出请求参数，放置于request对象的query中。
 */
const Filter = require('./../lib/Filter');
const url = require('url');

class QueryString extends Filter
{
    execute(err, req, res, next){
        let query = url.parse(req.url, true).query;
        req.query = query;
        //console.log('[QueryString] request object:');
        //console.log(req.query);
        next(err);
    }
}

module.exports = QueryString;