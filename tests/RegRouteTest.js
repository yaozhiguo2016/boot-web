/**
 * Created by yaozhiguo on 2016/12/22.
 */
const Filter = require('./../lib/Filter');

class RegRouteTest extends Filter
{
    execute(err, req, res, next){

        let name = req.params.up;
        res.write('user photo:' + name);
        res.end();
    }
}

module.exports = RegRouteTest;