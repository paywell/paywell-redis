'use strict';

process.env.NODE_ENV = 'test';

//dependencies
const path = require('path');
const redis = require(path.join(__dirname, '..', 'src', 'redis'));


after(function (done) {
  redis.clear(done);
});


after(function () {
  redis.reset();
});