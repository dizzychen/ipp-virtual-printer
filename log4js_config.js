const config = {
    sys: {
        type: 'dateFile',
        filename: './logs/sys',
        pattern: 'yyyyMMdd.log',
        alwaysIncludePattern: true,
    },
    app: {
        type: 'dateFile',
        filename: './logs/app',
        pattern: 'yyyyMMdd.log',
        alwaysIncludePattern: true,
    },
    console: {
        type: 'console',
    },
};

module.exports = config;
