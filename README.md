# boot-web
A mini web server with nodejs.

# example:
<pre><code>

    const Boot = require('../lib/Boot');
    const Router = require('../lib/Router');
    const BaseAuth = require('../filters/BaseAuth');
    const QueryString = require('../filters/QueryString');
    const Cookie = require('../filters/Cookie');
    const Session = require('../filters/Session');
    const Static = require('../filters/Static');
    const BodyParser = require('../filters/BodyParser');
    
    const EjsTest = require('./EjsTest');
    const RegRouteTest = require('./RegRouteTest');
    
    
    let web = new Boot();
    
    // webServer.setTemplate('ejs');
    // webServer.setTemplateRoot(path.join(__dirname, 'view/tpls'));
    
    web.use(new BaseAuth());
    web.use(new QueryString());
    web.use(new Cookie());
    web.use(new Session());
    web.use(new Static());
    web.use(new BodyParser());
    
    //app.use('/users/:name', new RouteTest());
    web.use('/photo/:up', new RegRouteTest());
    web.get('/test/', new EjsTest());
    
    web.listen(3015);
</pre></code>

visit http://localhost:3015 to see the static index page.

http://localhost:3015/photo/yzg to test the regular expression route match

http://localhost:3015/test/ to test the ejs template file rendering
