/**
 * Created by yaozhiguo on 2016/12/22.
 * 静态资源访问管理
 */
const util = require('util');
const fs = require('fs');
const url = require('url');
const path = require('path');
const zlib = require("zlib");
const Filter = require('../lib/Filter');
const mime = require('../utils/mime');

class Static extends Filter
{
    constructor(options){

        super(options);

        let opts = options || {};
        this.fileFormat = opts.fileFormat || /^(gif|png|jpg|js|css)$/ig ;
        this.fileMaxAge = opts.fileMaxAge || 60*60*24*365;
        this.compressFileFormat = opts.compressFileFormat || /css|js|html/ig;
        this.welcomePage = opts.welcomePage || 'index.html';
        this.rootDir = opts.rootDir || 'public';
    }

    execute (err, request, response, next){

        let pathname = url.parse(request.url).pathname;
        if (pathname.slice(-1) === '/'){
            pathname = pathname + this.welcomePage;
        }

        let realPath = path.join(this.rootDir, path.normalize(pathname.replace(/\.\./g, "")));
        console.log('static test real path:'+realPath);

        let _this = this;

        let pathHandler = function(realPath){

            fs.stat(realPath, function (errMsg, stats) {

                if (errMsg){

                    /*response.writeHead(404, {'Content-Type': 'text/plain'});
                     response.write("This request URL " + pathname + " was not found on this server.");
                     response.end();*/
                    err.fileNotFoundError = errMsg;
                    //console.log(errMsg);
                    next(err);

                }else {

                    if (stats.isDirectory()){
                        //console.log('1Static execute, realpath:', realPath);
                        realPath = path.join(realPath, "/", _this.welcomePage);
                        pathHandler(realPath);

                    }else{
                        //console.log('2Static execute, realpath:', realPath);
                        let ext = path.extname(realPath);
                        ext = ext ? ext.slice(1) : 'unknown';
                        let contentType = mime[ext] || "text/plain";
                        response.setHeader('Content-Type', contentType);

                        let lastModified = stats.mtime.toUTCString();
                        let ifModifiedSince = "If-Modified-Since".toLowerCase();
                        response.setHeader("Last-Modified", lastModified);

                        if (ext.match(_this.fileFormat)) {

                            let expires = new Date();
                            expires.setTime(expires.getTime() + _this.fileMaxAge * 1000);
                            response.setHeader("Expires", expires.toUTCString());
                            response.setHeader("Cache-Control", "max-age=" + _this.fileMaxAge);
                        }

                        if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {

                            response.writeHead(304, "Not Modified");
                            response.end();
                            //next(err);

                        }else{

                            let compressHandle = function (raw, statusCode, reasonPhrase) {
                                let stream = raw;
                                let acceptEncoding = request.headers['accept-encoding'] || "";
                                let matched = ext.match(_this.compressFileFormat);

                                if (matched && acceptEncoding.match(/\bgzip\b/)) {
                                    response.setHeader("Content-Encoding", "gzip");
                                    stream = raw.pipe(zlib.createGzip());
                                } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
                                    response.setHeader("Content-Encoding", "deflate");
                                    stream = raw.pipe(zlib.createDeflate());
                                }
                                response.writeHead(statusCode, reasonPhrase);
                                stream.pipe(response);
                                //next(err);
                            };

                            if (request.headers["range"]) {
                                let range = Static.parseRange(request.headers["range"], stats.size);
                                if (range) {

                                    response.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stats.size);
                                    response.setHeader("Content-Length", (range.end - range.start + 1));
                                    let raw = fs.createReadStream(realPath, {"start": range.start, "end": range.end});
                                    compressHandle(raw, 206, 'Partial Content');
                                } else {

                                    response.removeHeader("Content-Length");
                                    response.writeHead(416);
                                    response.end();
                                    //next(err);
                                }
                            } else {

                                let raw = fs.createReadStream(realPath);
                                compressHandle(raw, 200, 'OK');
                            }
                        }
                    }
                }
            });
        };

        pathHandler(realPath);
    }

    static parseRange (str, size) {

        if (str.indexOf(",") != -1) {
            return;
        }

        let range = str.split("-"),
            start = parseInt(range[0], 10),
            end = parseInt(range[1], 10);

        // Case: -100
        if (isNaN(start)) {
            start = size - end;
            end = size - 1;
            // Case: 100-
        } else if (isNaN(end)) {
            end = size - 1;
        }

        // Invalid
        if (isNaN(start) || isNaN(end) || start > end || end > size) {
            return;
        }

        return {start: start, end: end};
    }
}

module.exports = Static;