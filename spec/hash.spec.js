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


  describe('save', function () {
    before(function () {
      redis.clear();
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

    before(function (done) {
      redis.hash.save(faker.helpers.userCard(), function (error,
        _object) {
        _idx = _object._id;
        done(error, _object);
      });
    });

    before(function (done) {
      redis.hash.save(faker.helpers.userCard(), function (error,
        _object) {
        _idy = _object._id;
        done(error, _object);
      });
    });

    it('should be able to fetch single object', function (done) {
      redis.hash.get(_idx, function (error, _object) {
        expect(_object._id).to.be.equal(_idx);
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
    const object = faker.helpers.userCard();
    const objectx = faker.helpers.userCard();

    before(function (done) {
      redis.hash.save(object, function (error,
        _object) {
        _idx = _object._id;
        done(error, _object);
      });
    });

    before(function (done) {
      redis.hash.save(objectx, { collection: 'users' }, function (
        error, _object) {
        _idy = _object._id;
        done(error, _object);
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

    it('should be able to search a specific collection', function (done) {
      redis.hash.search({
        q: objectx.username,
        collection: 'users'
      }, function (error, objects) {
        expect(error).to.not.exist;
        expect(objects).to.have.have.length(1);

        const _object = objects[0];
        delete _object._id;
        expect(_object).to.be.eql(objectx);
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