/**
 * Created by yaozhiguo on 2016/12/22.
 * 解析文件上传。
 */
const Filter = require('../lib/Filter');
const util = require('util');
const querystring = require('querystring');
const xml2js = require('xml2js');
const formidable = require('formidable');

class BodyParser extends Filter
{
    execute (err, req, res, next){
        //默认的表单提交,请求头中的Content-Type字段值为application/x-www-form-urlencoded
        if(req.headers['content-type'] === 'application/x-www-form-urlencoded'){
            req.body = querystring.parse(req.rawBody);
            next(err);
        }else{

            let mimeType = this.mime(req);

            if (mimeType === 'application/json'){
                try{
                    req.body = JSON.parse(req.rawBody);
                }catch (e){
                    res.writeHead(400);
                    res.end('Invalid JSON format.');
                    err.jsonFormatError = 'Invalid Json Format';
                    //next(err);
                }
                next(err);
            }else if (mimeType === 'application/xml'){

                xml2js.parseString(req.rawBody, function(errMsg, xml) {
                    if (errMsg){
                        //异常内容，响应Bad request
                        res.writeHead(400);
                        res.end('Invalid XML');
                        err.xmlFormatError = 'Invalid XML';
                        next(err);
                    }else{
                        req.body = xml;
                        next(err);
                    }

                });
            }
            /**
             * 浏览器在遇到multipart/form-data表单提交时，构造的请求报文与普通表单完全不同。
             * 首先它的报头中最为特殊的如下所示：
             * Content-Type: multipart/form-data; boundary=AaB03x Content-Length:18231
             * 它代表本次提交的内容是由多部分构成的，其中
             * --boundary=AaB03x指定的是每部分内容的分界符，AaB03x是随机生成的一段字符串，
             *   报文体的内容将通过在它前面添加--进行分割，报文结束时在它前后都加上--表示结束。
             * --另外，Content-Length的值必须确保是报文体的长度。
             */
            else if (mimeType === 'multipart/form-data'){

                var form = new formidable.IncomingForm();
                form.parse(req, function(errMsg, fields, files){
                    if (errMsg){
                        err.formDataError = errMsg;
                        next(err);
                    }else{
                        req.body = fields;
                        req.files = files;
                        next(err);
                    }
                });
            }else {

                next(err);
            }
        }
    }

    /**
     * 需要注意的是，在Content-Type中可能还附带如下所示的编码信息：
     * Content-Type: application/json;charset=utf-8
     * @param req
     */
    mime (req){
        let str = req.headers['content-type'] || '';
        return str.split(';')[0];
    }
}

module.exports = BodyParser;