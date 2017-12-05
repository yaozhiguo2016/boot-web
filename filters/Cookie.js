/**
 * Created by yaozhiguo on 2016/12/22.
 */

const Filter = require('./../lib/Filter');

class Cookie extends Filter
{
    execute (err, req, res, next){

        let cookie = req.headers.cookie;
        let cookies = {};
        if (cookie){
            let list = cookie.split(';');
            for (let v of list){
                let pair = v.split('=');
                cookies[pair[0].trim()] = pair[1];
            }
        }

        req.cookies = cookies;
        //console.log('cookies:');
        //console.log(req.cookies);

        res.setCookie = function(name, value, options){
            let cookies = res.getHeader('Set-Cookie');
            let cookie = Cookie.serialize(name, value, options);
            if (cookies){
                cookies = Array.isArray(cookies) ? cookies.concat(cookie) : [cookies, cookie];
            }else{
                cookies = cookie;
            }
            res.setHeader('Set-Cookie', cookies);
        };
        next(err);
    }

    static serialize (name, value, options){
        if (typeof value == "object"){
            value = JSON.stringify(value);
            //console.log(value);
        }
        let pairs = [name + '=' + value];
        let opt = options || {};
        if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
        if (opt.domain) pairs.push('Domain=' + opt.domain);
        if (opt.path) pairs.push('Path=' + opt.path);
        if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
        if (opt.httpOnly) pairs.push('HttpOnly');
        if (opt.secure) pairs.push('Secure');

        return pairs.join(';');
    }
}

module.exports = Cookie;
