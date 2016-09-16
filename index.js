'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const exit = require('exit-hook');
const redis = require(path.join(__dirname, 'src', 'redis'));

exports = module.exports = function (options) {
  //merge options
  redis.defaults = _.merge({}, redis.defaults, options);

  //initialize
  redis.init();

  //listen for exit and shutdown safely
  exit(function () {
    redis.quit();
  });

  //export
  return redis;
};