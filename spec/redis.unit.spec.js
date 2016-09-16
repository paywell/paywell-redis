'use strict';

//dependencies
const path = require('path');
const expect = require('chai').expect;
const redis = require(path.join(__dirname, '..'))();

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

    expect(redis.client).to.exist;
    expect(redis.client).to.be.a.function;

    expect(redis.pubsub).to.exist;
    expect(redis.pubsub).to.be.a.function;

    expect(redis._client).to.not.exist;
    expect(redis.publisher).to.not.exist;
    expect(redis.subscriber).to.not.exist;

  });

  describe('init & client & pubsub client', function () {
    before(function () {
      redis.reset();
    });

    it('should return same redis instances once initialized', function () {
      expect(redis.client()._id)
        .to.be.equal(redis.client()._id);

      expect(redis.pubsub().publisher._id)
        .to.be.equal(redis.pubsub().publisher._id);

      expect(redis.pubsub().subscriber._id)
        .to.be.equal(redis.pubsub().subscriber._id);
    });

    it('should return same redis instances once initialized', function () {
      //require redis
      const rediz = require(path.join(__dirname, '..'))();

      expect(rediz.client()._id)
        .to.be.equal(redis.client()._id);

      expect(rediz.pubsub().publisher._id)
        .to.be.equal(redis.pubsub().publisher._id);

      expect(rediz.pubsub().subscriber._id)
        .to.be.equal(redis.pubsub().subscriber._id);
    });

    after(function () {
      redis.reset();
    });

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

  it('should be able to initialize multi object', function () {
    const multi = redis.multi();
    expect(multi).to.exist;
    expect(multi.exec).to.exist;
    expect(multi.exec).to.be.a.function;
  });

  it('should be able to generate a key', function () {
    const key = redis.key();
    expect(key).to.exist;
    expect(key.split(':')).to.have.length(2);
  });

  it('should be able to create redis key', function () {
    const key1 = redis.key('ab');
    expect(key1).to.be.equal('paywell:ab');

    const key2 = redis.key(['users', 'ab']);
    expect(key2).to.be.equal('paywell:users:ab');

    const key3 = redis.key('users', 'likes', 'vegetables');
    expect(key3).to.be.equal('paywell:users:likes:vegetables');
  });

  it('should be able to create a new instance of redis client', function () {
    const client = redis.createClient();
    expect(client).to.exist;
  });

  it('should be able to instantiate redis client', function () {
    const client = redis.client();
    expect(client).to.exist;
  });

  it('should be able to instantiate pub/sub redis clients', function () {
    const { publisher, subscriber } = redis.pubsub();
    expect(publisher).to.exist;
    expect(subscriber).to.exist;
  });

  it('should be able to connect to redis', function () {
    redis.init();

    expect(redis._client).to.exist;
    expect(redis._client).to.not.be.null;

    expect(redis.publisher).to.exist;
    expect(redis.publisher).to.not.be.null;

    expect(redis.subscriber).to.exist;
    expect(redis.subscriber).to.not.be.null;

  });

  it('should be able to reset it state', function () {
    redis.reset();

    expect(redis._client).to.be.null;
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


  describe('clear', function () {
    beforeEach(function (done) {
      redis.clear(done);
    });

    it('should be able to clear all data', function (done) {
      const key = redis.key();
      redis.client().set(key, 1, function (error) {
        if (error) {
          done(error);
        } else {
          redis.clear(function (error, response) {
            expect(error).to.not.exist;
            expect(response).to.have.length(1);
            expect(response).to.contain.members([1]);
            done(error, response);
          });
        }
      });
    });

    it('should be able to clear data with given patterns', function (
      done) {
      const key = redis.key('users');
      redis.client().set(key, 1, function (error) {
        if (error) {
          done(error);
        } else {
          redis.clear('users', function (error, response) {
            expect(error).to.not.exist;
            expect(response).to.have.length(1);
            expect(response).to.contain.members([1]);
            done(error, response);
          });
        }
      });
    });
  });


  after(function (done) {
    redis.clear(done);
  });

  after(function () {
    redis.reset();
  });

});