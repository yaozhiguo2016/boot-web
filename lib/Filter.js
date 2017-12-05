/**
 * Created by yaozh on 2017/12/6.
 * 过滤器基类。作为一个基础的过滤类，request请求流经本类，经过处理之后，再传入下一个Filter中。
 */
class Filter
{
    constructor(options){
        this.options = options;
    }

    execute(err, req, res, next){

    }
}

module.exports = Filter;