/**
 * Created by yaozhiguo on 2016/12/22.
 * 访问权限的控制，需要传入一个验证用户合法性的方法，如果回调传入true，则正常访问。
 */
const Filter = require('./../lib/Filter');

class BaseAuth extends Filter
{
    constructor(options){
        super(options);

        //default check auth method
        let defaultCheck = (user, pass, callback)=>{

            if (user === 'admin' && pass === 'admin'){
                callback(true);
            }else{
                callback(false);
            }
        };

        this.useCheckMethod = options ? (options.checkMethod || defaultCheck): defaultCheck;
    }

    execute (err, req, res, next){
        let auth = req.headers['authorization'] || '';
        let parts = auth.split(' ');
        let method = parts[0] || '';
        let encoded = parts[1] || '';
        let decoded = new Buffer(encoded, 'base64').toString('utf-8').split(":");
        let user = decoded[0];
        let pass = decoded[1];

        this.useCheckMethod(user, pass, (tag)=>{
            if (tag){
                next(err);
            }else{
                res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
                res.writeHead(401);
                res.end();
            }
        });
    }
}

module.exports = BaseAuth;
