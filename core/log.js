const log4js = require('log4js');
const logconfig = require('../log4js_config');

log4js.configure({
    appenders: {
        sys: logconfig.sys,
        app: logconfig.app,
        console: logconfig.console,
    },
    categories: {
        default: { appenders: ['app', 'console'], level: 'debug' },
        sys: { appenders: ['sys', 'console'], level: 'debug' },
    },
});

const defaultlogger = log4js.getLogger();
const syslogger = log4js.getLogger('sys');

module.exports.logger = defaultlogger;
module.exports.syslogger = syslogger;

module.exports.use = function(app) {
    app.use(log4js.connectLogger(syslogger, { level: 'auto' }));
};
