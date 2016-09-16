'use strict';

process.env.NODE_ENV = 'test';

//dependencies
const path = require('path');
const redis = require(path.join(__dirname, '..'))();

before(function (done) {
  redis.clear(done);
});


before(function () {
  redis.reset();
});


after(function (done) {
  redis.clear(done);
});


after(function () {
  redis.reset();
});