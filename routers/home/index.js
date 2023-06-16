const express = require('express');
const moment = require('moment');
const path = require('path');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render(path.join(__dirname, '../../views/index'),
        {
            title: 'index page',
            time: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    );
});

module.exports = router;
