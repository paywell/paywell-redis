'use strict';

//dependencies
const path = require('path');
const expect = require('chai').expect;
const faker = require('faker');
const redis = require(path.join(__dirname, '..'))();


describe('hash', function () {

  before(function () {
    redis.reset();
  });

  before(function () {
    redis.clear();
  });

  before(function () {
    redis.init();
  });

  describe('serialize & deserialize', function () {
    it('should be able to serialize dates to timestamp', function () {
      const today = new Date();
      const object = { today: today };
      const serialized = redis.hash.serialize(object);
      expect(serialized.today).to.be.equal(today.getTime());
    });
  });


  describe('save', function () {
    before(function () {
      redis.clear();
    });

    let _id;
    const object = redis.hash.deserialize(faker.helpers.userCard());

    it('should be able to able to save object to redis', function (done) {
      redis.hash.save(object, function (error, _object) {
        _id = _object._id;
        delete _object._id;
        expect(_object).to.be.eql(object);
        done(error, _object);
      });
    });

    it(
      'should be able to save object into using different collection',
      function (done) {
        redis.hash.save(object, { collection: 'users' }, function (
          error, _object) {
          _id = _object._id;
          expect(_id).to.contain('users');
          delete _object._id;
          expect(_object).to.be.eql(object);
          done(error, _object);
        });
      });

  });

  describe('get', function () {
    before(function () {
      redis.clear();
    });

    let _idx, _idy;
    let objectx = redis.hash.deserialize(faker.helpers.userCard());
    let objecty = redis.hash.deserialize(faker.helpers.userCard());

    before(function (done) {
      redis.hash.save(objectx, function (error,
        _object) {
        _idx = _object._id;
        done(error, _object);
      });
    });

    before(function (done) {
      redis.hash.save(objecty, function (error,
        _object) {
        _idy = _object._id;
        done(error, _object);
      });
    });

    it('should be able to fetch single object', function (done) {
      redis.hash.get(_idx, function (error, _object) {
        expect(_object._id).to.be.equal(_idx);
        delete _object._id;
        expect(_object).to.be.eql(objectx);
        done(error, _object);
      });
    });

    it('should be able to fetch multiple objects', function (done) {
      redis.hash.get([_idx, _idy], function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(2);
        done(error, objects);
      });
    });

    it('should be able to fetch multiple objects', function (done) {
      redis.hash.get(_idx, _idy, function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(2);
        done(error, objects);
      });
    });
  });

  describe('search', function () {
    before(function () {
      redis.clear();
    });

    let _idx, _idy;
    let objectx = faker.helpers.userCard();
    let objecty = faker.helpers.userCard();

    before(function (done) {
      redis.hash.save(objectx, function (error,
        _object) {
        _idx = _object._id;
        delete _object._id;
        objectx = _object;
        done(error, _object);
      });
    });

    before(function (done) {
      redis.hash.save(objectx, { collection: 'users' }, function (
        error, _object) {
        _idy = _object._id;
        delete _object._id;
        objecty = _object;
        done(error, _object);
      });
    });

    it('should be able to search saved objects', function (done) {
      redis.hash.search(objectx.username, function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(1);

        const _object = objects[0];
        delete _object._id;
        expect(_object).to.be.eql(objectx);
        done(error, objects);
      });
    });

    it('should be able to search a specific collection', function (done) {
      redis.hash.search({
        q: objectx.username,
        collection: 'users'
      }, function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(1);

        const _object = objects[0];
        delete _object._id;
        expect(_object).to.be.eql(objecty);
        done(error, objects);
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