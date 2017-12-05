/**
 * Created by yaozh on 2017/12/6.
 */
const http = require('http');
const url = require('url');
const Router = require('./Router');
const RouteParser = require('./RouteParser');
const Param = require('./Param');

class Boot
{
    constructor(options){

        this.server = http.createServer();
        this.server.timeout = options ? (options.timeout || 1000):1000;
        this.server.maxHeadersCount = options ? (options.maxHeadersCount || 551):551;
        this.addListeners();

        Object.defineProperty(this, 'filters', {
            value:[],
            configurable:false,
            enumerable:true,
            writable:false
        });
        //route parse
        this.parser = new RouteParser();
        //RESTful methods
        this.RESTmethods();
    }

    RESTmethods (){

        let _this = this;
        ['get', 'put', 'delete', 'post'].forEach(function(method){
            _this.parser.routes[method] = [];
            _this[method] = function(path, filter){
                _this.use(path, filter);
            };
        });
    }

    /**
     * 设置系统参数或者缓存一些配置数据。
     * @param key 可以是字符串或者其他对象
     * @param value
     */
    setParam(key, value){

        Param.setParam(key, value);
    }

    /**
     * 获取设置的参数或者缓存数据
     * @param key
     * @returns {*}
     */
    getParam(key){

        return Param.getParam(key);
    }

    /**
     * 设置页面渲染模板类型，如‘ejs’
     * @param name
     */
    setTemplate(name){

        Router.setTemplate(name);
    }

    /**
     * 设置模板文件的有效起始目录。
     * @param root
     */
    setTemplateRoot(root){

        Router.setTemplateRoot(root);
    }

    /**
     * 加入过滤器组件。如 use('/', new Filter());
     * @param path
     */
    use (path){

        let handle;
        if (typeof path === 'string'){
            handle = {
                path:this.parser.pathRegExp(path),
                stack:Array.prototype.slice.call(arguments, 1)
            };
        }else{ //只有一个参数，则是默认根路径下对应的过滤器
            handle = {
                path:this.parser.pathRegExp('/'),
                stack:Array.prototype.slice.call(arguments, 0)
            };
        }
        this.parser.routes.all.push(handle);
    }

    listen (port){
        this.server.listen(port);
        console.log('server start on port 3100...');
    }

    addListeners (){

        this.server.on('connect', function(request, socket, head){
            console.log('connect event emitted...');
        });

        this.server.on('connection', function(socket){
            console.log('connection event emitted...');
        });

        var _this = this;
        this.server.on('request', function(request, response){

            console.log(request.method + " " + request.url);
            //如果报文体有内容，则先解析，存放于rawBody中
            if ('transfer-encoding' in request.headers || 'content-length' in request.headers){

                var buffers = [];
                request.on('data', function(chunk){

                    buffers.push(chunk);
                });
                request.on('end', function(){

                    request.rawBody = Buffer.concat(buffers).toString();
                    _this.parser.parse(request, response);
                });
            }else{

                _this.parser.parse(request, response);
            }
        });

        this.server.on('close', function(){
            console.log('close event emitted...');
        });

        this.server.on('clientError', function(exception, socket){
            console.log('clientError event emitted...');
        });
    }
}

module.exports = Boot;