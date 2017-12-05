/**
 * Created by yaozh on 2017/12/6.
 */
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const Param = require('./Param');

class Router
{
    /**
     * 设置模板名，如'ejs'
     * @param name
     */
    static setTemplate(name){

        let effectiveName = name || 'ejs';
        Param.setParam('template', effectiveName);
        Router.template = require(effectiveName);
    }

    static setTemplateRoot(root){

        let effectiveRoot = root || '/view/tpls';
        Param.setParam('templateRoot', effectiveRoot);
        Router.VIEW_ROOT = effectiveRoot;
    }

    static route(reqest, response){
        response.sendFile = function (filePath) {

            fs.stat(filePath, function(err, stat){

                if (err){

                    console.log(err);
                    return;
                }
                let stream = fs.createReadStream(filePath);
                response.setHeader('Content-Type', mime.lookup(filePath)); //内容类型
                response.setHeader('Content-Length', stat.size); //内容大小
                response.setHeader('Content-Disposition', 'attachment;filename="' + path.basename(filePath) + '"'); //设为附件
                response.writeHead(200);
                stream.pipe(response);
            });
        };

        response.json = function(json){

            response.setHeader('Content-Type', 'application/json');
            response.writeBuffer(200);
            response.end(JSON.stringify(json));
        };

        response.redirect = function(url){

            response.setHeader('Location', url);
            response.writeHead(302);
            response.end('redirect to ' + url);
        };

        /**
         * 渲染视图，调用本方法之前不能调用writeHead.
         * @param view
         * @param data
         */
        response.render = function(viewName, data){

            let opts = {
                cache:true,
                root:Router.VIEW_ROOT,
                debug:false
            };
            let template = typeof Router.template === 'string' ? require(Router.template) : Router.template;
            template.renderFile(path.join(Router.VIEW_ROOT, viewName), data, opts, function(err, str){

                if (err){
                    console.log(err);
                    response.writeHead(500, {'Content-Type':'text/html;charset=utf-8'});
                    response.end('template file read error!');
                }else{
                    response.setHeader('Content-Type', 'text/html;charset=utf-8');
                    response.setHeader('Content-Language', 'en,zh');
                    response.writeHead(200);
                    response.end(str);
                }
            });
        };
    }
}

Router.template = 'ejs';
Router.VIEW_ROOT = './view/tpls';

module.exports = Router;