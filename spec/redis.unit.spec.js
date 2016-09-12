'use strict';

//dependencies
var path = require('path');
var expect = require('chai').expect;
var redis = require(path.join(__dirname, '..'))();

describe('redis', function () {

  before(function (done) {
    redis.clear(done);
  });

  before(function () {
    redis.reset();
  });

  it('should be exported', function () {

    expect(redis).to.exist;

    expect(redis.init).to.exist;
    expect(redis.init).to.be.a.function;

    expect(redis.pubsub).to.exist;
    expect(redis.pubsub).to.be.a.function;

    expect(redis.client).to.not.exist;
    expect(redis.publisher).to.not.exist;
    expect(redis.subscriber).to.not.exist;

  });


  describe('options', function () {
    beforeEach(function () {
      redis.reset();
    });

    it('should have default options', function () {
      expect(redis.defaults).to.exist;
      expect(redis.defaults).to.be.an.Object;
      expect(redis.defaults).to.be.eql({
        prefix: 'paywell',
        separator: ':',
        redis: {
          port: 6379,
          host: '127.0.0.1'
        }
      });
    });

    it('should be able to set key prefix options', function () {

      redis.defaults.prefix = 'q';

      expect(redis.defaults).to.exist;
      expect(redis.defaults).to.be.an.Object;
      expect(redis.defaults).to.be.eql({
        prefix: 'q',
        separator: ':',
        redis: {
          port: 6379,
          host: '127.0.0.1'
        }
      });

    });

    it('should be able to set key separator options', function () {

      redis.defaults.separator = '-';

      expect(redis.defaults).to.exist;
      expect(redis.defaults).to.be.an.Object;
      expect(redis.defaults).to.be.eql({
        prefix: 'paywell',
        separator: '-',
        redis: {
          port: 6379,
          host: '127.0.0.1'
        }
      });

    });

    after(function () {
      redis.reset();
    });

  });

  it('should be able to create a new instance of redis client', function () {
    const client = redis.createClient();
    expect(client).to.exist;
  });

  it('should be able to connect to redis', function () {
    redis.init();

    expect(redis.client).to.exist;
    expect(redis.client).to.not.be.null;

    expect(redis.publisher).to.exist;
    expect(redis.publisher).to.not.be.null;

    expect(redis.subscriber).to.exist;
    expect(redis.subscriber).to.not.be.null;

  });

  it('should be able to reset it state', function () {
    redis.reset();

    expect(redis.client).to.be.null;
    expect(redis.publisher).to.be.null;
    expect(redis.subscriber).to.be.null;

  });

  it('should be able to obtain redis server info', function (done) {
    redis.info(function (error, info) {
      expect(error).to.not.exist;
      expect(info).to.exist;
      done(error, info);
    });
  });


  after(function (done) {
    redis.clear(done);
  });

  after(function () {
    redis.reset();
  });

});