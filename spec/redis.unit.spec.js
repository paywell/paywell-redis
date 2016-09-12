'use strict';

//dependencies
var path = require('path');
var expect = require('chai').expect;
var faker = require('faker');
var redis = require(path.join(__dirname, '..', 'src', 'redis'));

describe.skip('redis', function () {

  before(function (done) {
    redis.clear(done);
  });

  before(function () {
    redis.reset();
  });

  describe('client', function () {

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

  });

  describe('hash', function () {

    before(function () {
      redis.clear();
    });

    before(function () {
      redis.init();
    });

    var _id;
    var object = faker.helpers.userCard();

    it('should be able to able to save object to redis', function (done) {
      redis.hset(object, function (error, _object) {
        _id = _object._id;
        delete _object._id;
        expect(_object).to.be.eql(object);
        done(error, _object);
      });
    });

    it('should be able to fetch save object', function (done) {
      redis.hget(_id, function (error, _object) {
        delete _object._id;
        expect(_object).to.be.eql(object);
        done(error, _object);
      });
    });

    it('should be able to fetch multiple objects', function (done) {
      redis.hmget([_id], function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(1);
        done(error, objects);
      });
    });

    it('should be able to search saved objects', function (done) {
      redis.hsearch(object.username, function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(1);

        var _object = objects[0];
        delete _object._id;
        expect(_object).to.be.eql(object);
        done(error, objects);
      });
    });

    after(function (done) {
      redis.clear(done);
    });

    after(function () {
      redis.reset();
    });

  });


  after(function (done) {
    redis.clear(done);
  });

  after(function () {
    redis.reset();
  });

});