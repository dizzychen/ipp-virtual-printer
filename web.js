/**
 * web
 */
const express = require('express');
const bp = require('body-parser');
const path = require('path');
const pck = require('./pck.js');
const proxy = require('express-http-proxy');
const helmet = require('helmet');

const { logger, syslogger, use } = require('./core/log');

// 路由页面配置
function webServer(port) {
    const app = express();
    app.locals.packinfo = pck;
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hjs');
    // 去掉response header里面的x-powered-by标头
    app.use(helmet());
    app.disable('x-powered-by');
    app.use(bp.json());
    app.use(bp.urlencoded({ extended: true }));

    const simplestPckinfo = {
        name: app.locals.packinfo.name,
        version: app.locals.packinfo.version,
        scripts: app.locals.packinfo.scripts,
        description: app.locals.packinfo.description,
    };
    app.locals.syslogger = syslogger;
    app.locals.logger = logger;
    use(app);
    logger.info(`Web Server Info:\n ${JSON.stringify(simplestPckinfo)}`);

    app.use('/', proxy(`localhost:${port}`, {
        filter: (req) => {
            logger.debug('req.url: ', req.url);
            const match = req.method === 'POST' && req.header('content-type') == 'application/ipp';
            logger.debug('filter: %s %s %s match=%s', req.method, req.url, req.query, match);
            logger.debug('headers:', req.headers);

            return match;
        },
        parseReqBody: false,
    }));

    // 导入路由
    require('./routers/index.js')(app);

    // catch 404 and forward to error handler
    app.use((req, res, next) => {
        res.status(404).send("Not Found.<br/>" + req.app.get('env'));
    });

    // error handler
    app.use((err, req, res, next) => {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

    return app;
}

module.exports = webServer;
