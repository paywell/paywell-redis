'use strict';

process.env.NODE_ENV = 'test';

//dependencies
var async = require('async');
var redis = require('redis');
var redis = redis.createClient();


/**
 * @description clean up a database
 */
function cleanup(done) {
  redis
    .keys('q*', function (error, rows) {
      if (error) {
        done(error);
      } else {
        async.each(rows, function (row, next) {
          redis.del(row, next);
        }, done);
      }
    });
}

//clean database
after(function (done) {
  async.parallel([cleanup], function (error) {
    if (error && error.message !== 'ns not found') {
      done(error);
    } else {
      done(null);
    }
  });
});