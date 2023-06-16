module.exports = function (app) {
    // 路由页面
    app.use('/', require('./home/index')); // 路由页面
    app.use('/printer', require('./home/printer')); // 路由页面
};
