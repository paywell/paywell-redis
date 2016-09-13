'use strict';

//dependencies
const path = require('path');
const expect = require('chai').expect;
const faker = require('faker');
const redis = require(path.join(__dirname, '..'))();


describe('hash', function () {

  before(function () {
    redis.clear();
  });

  before(function () {
    redis.init();
  });

  let _id;
  const object = faker.helpers.userCard();

  it('should be able to able to save object to redis', function (done) {
    redis.hash.save(object, function (error, _object) {
      _id = _object._id;
      delete _object._id;
      expect(_object).to.be.eql(object);
      done(error, _object);
    });
  });

  it('should be able to fetch save object', function (done) {
    redis.hash.get(_id, function (error, _object) {
      delete _object._id;
      expect(_object).to.be.eql(object);
      done(error, _object);
    });
  });

  it('should be able to fetch multiple objects', function (done) {
    redis.hash.hmget([_id], function (error, objects) {
      expect(error).to.not.exist;
      expect(objects).to.have.have.length(1);
      done(error, objects);
    });
  });

  it('should be able to search saved objects', function (done) {
    redis.hash.search(object.username, function (error, objects) {
      expect(error).to.not.exist;
      expect(objects).to.have.have.length(1);

      const _object = objects[0];
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