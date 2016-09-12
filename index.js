'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const redis = require(path.join(__dirname, 'src', 'redis'));

exports = module.exports = function (options) {
  //merge options
  redis.defaults = _.merge({}, redis.defaults, options);

  //initialize
  redis.init();

  //export
  return redis;
};