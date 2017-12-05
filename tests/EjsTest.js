/**
 * Created by Stanley on 2016/12/21.
 */
const Filter = require('./../lib/Filter');

class EjsTest extends Filter
{
    constructor(options){
        super(options);
    }

    execute(err, req, res, next){

        let name = req.params.name;
        res.setCookie('userName', name);
        res.setCookie('testCookie', {name:'stanley'});

        console.log(req.query, req.cookies, req.session);
        res.render('index.ejs', {title:'Jackson'});
    }
}

module.exports = EjsTest;