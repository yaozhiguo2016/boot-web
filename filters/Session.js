/**
 * Created by yaozhiguo on 2016/12/22.
 * 会话管理
 */

const Filter = require('./../lib/Filter');
const uuid = require('./../utils/uuid');
const Cookie = require('./Cookie');
const crypto = require('crypto');

class Session extends Filter
{
    constructor(options){
        super(options);

        const expire = 20 * 60 * 1000;//默认会话有效期20min
        this.secret = options ? (options.secret || 'secret') : 'secret';
        this.expire = options ? (options.expire || expire) : expire;

        Object.defineProperties(this, {
            'sessions':{
                value:{},
                configurable:false,
                writable:false
            },
            'key':{
                value:'session_id'
            }
        });
    }

    execute(err, req, res, next){

        let session_id = req.cookies[this.key];//这个id是加过签名的
        if (!session_id || session_id == undefined){
            req.session = this.generate();
        }else{
            //对这个id解签名，监测是否匹配发送时的id，不匹配则说明签名被伪造，需重新生成session
            let realId = this.unsign(session_id);
            if (!realId){
                req.session = this.generate();
            }else{
                let session = this.sessions[realId];
                if (session){
                    let current = new Date();
                    if (session.cookie.expire > current.getTime()){  //未超时，更新session的过期时间

                        session.cookie.expire = current.getTime() + this.expire;
                        req.session = session;
                    }else { //超时，删除session

                        delete this.sessions[realId];
                        req.session = this.generate();
                    }
                }else{ //如果 session 过期或口令不对，重新生成session

                    req.session = this.generate();
                }
            }
        }

        let _this = this;
        let writeHead = res.writeHead;
        res.writeHead = function(){ //override writeHead method

            let cookies = res.getHeader('Set-Cookie');
            let session = Cookie.serialize(_this.key, _this.sign(req.session.id));
            if (cookies){
                cookies = Array.isArray(cookies) ? cookies.concat(session) : [cookies, session];
            }else{
                cookies = session;
            }
            res.setHeader('Set-Cookie', cookies);
            return writeHead.apply(this, arguments); //call the base writeHead()
        };

        //console.log('session:');
        //console.log(req.session);
        next(err);
    }

    generate(){
        let session = {};
        let current = new Date();
        session.id = uuid();
        session.cookie = {
            expire:current.getTime() + this.expire
        };
        this.sessions[session.id] = session;
        return session;
    }

    /**
     * 给既定的数值加签名
     * @param value
     * @returns {string}
     */
    sign (value){
        return value + '.' + crypto.createHmac('sha256', this.secret).
            update(value).digest('base64').replace(/\=+$/, '');
    }

    /**
     * 给既定参数值解签名
     * @param value
     * @returns {*}
     */
    unsign (value){

        let str = value.slice(0, value.lastIndexOf('.'));
        return this.sign(str, this.secret) == value ? str : false;
    }
}

module.exports = Session;
