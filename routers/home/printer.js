const express = require('express');
const moment = require('moment');
const path = require('path');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render(path.join(__dirname, '../../views/printer'),
    {
      title: 'virtual printer',
      name: 'ipp virtual printer'
    }
  );
});

module.exports = router;
