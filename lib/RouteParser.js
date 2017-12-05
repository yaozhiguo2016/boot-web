/**
 * Created by yaozh on 2017/12/6.
 */
const url = require('url');
const Router = require('./Router');

class RouteParser
{
    constructor(){
        this.routes = {'all':[]};
        this.strict = true;
    }

    parse(req, res){

        Router.route(req, res);//设置基础功能

        let pathname = url.parse(req.url).pathname;
        let method = req.method.toLowerCase(); //请求方法原本是大写
        //这里预先匹配出根路径下注册的所有过滤器
        let stacks = this.match('/',this.routes.all, req, res);
        let pro = this.match(pathname, this.routes.all, req, res);
        stacks = this.uniqueStack(stacks.concat(pro));

        if (this.routes.hasOwnProperty(method)){
            //console.log('11111111111');
            stacks.concat(this.match(pathname, this.routes[method], req, res));
        }
        if (stacks.length > 0){
            //console.log('22222222222:' + stacks.length);
            this.handle(req, res, stacks);
        }else {
            //console.log('33333333333');
            this.handle404(req, res);
        }
    }

    uniqueStack(elems){

        for (let i = 0; i < elems.length; ++i) {
            for (let j = i + 1; j < elems.length; ++j) {
                if (elems[i] === elems[j]) {
                    elems.splice(i--, 1);
                    break;
                }
            }
        }
        return elems;
    }

    match(pathname, routes, req, res){

        let stacks = [];
        for (let route of routes){

            let reg = route.path.regexp;
            let keys = route.path.keys;
            let matched = reg.exec(pathname);//返回一个数组，其中存放匹配的结果。如果未找到匹配，则返回值为 null
            //console.log(routes.length, pathname, matched);
            if (matched){

                let params = {};
                for (let i = 0, l = keys.length; i < l; i++){

                    let value = matched[i + 1];
                    if (value){

                        params[keys[i]] = value;
                    }
                }
                req.params = params;
                stacks = stacks.concat(route.stack);
            }
        }
        return stacks;
    }

    handle (req, res, stacks){

        let next = function(err){
            /*if (err){
             console.log('router parser error1');
             return _this.handle500(err, req, res, stacks);
             }*/
            let filter = stacks.shift();
            if (filter){
                //传入 next() 函数自身， 使中间件能够执行结束后递归
                try{
                    //console.log('router parser executed');
                    filter.execute(err, req, res, next);
                }catch(e){
                    //console.log('router parser error2');
                    console.log(e);
                    next(err);
                }
            }
        };
        next({});
    }

    pathRegExp (path){

        let keys = [];

        path = path.concat(this.strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/').replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g,
                function(_, slash, format, key, capture, optional, star){
                    keys.push(key);
                    slash = slash || '';
                    return '' + (optional ? '' : slash) +
                        '(?:' +
                        (optional ? slash : '') +
                        (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' +
                        (optional || '') +
                        (star ? '(/*)?' : '');

                }).replace(/([\/.])/g, '\\$1').replace(/\*/g, '(.*)');

        return {keys:keys, regexp:new RegExp('^' + path + '$')};
    }

    handle404 (req,res){

        res.writeHead(404, {'Content-Type':'text/plain'});
        res.end('404 not found');
    }
}

module.exports = RouteParser;