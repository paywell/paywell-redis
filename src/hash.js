'use strict';


/**
 * @module
 * @copyright paywell Team at byteskode <www.byteskode.com>
 * @description redis hash utilities
 * @since 0.2.0
 * @author lally elias<lallyelias87@gmail.com, lally.elias@byteskode.com>
 * @singleton
 * @public
 */


//dependencies
const _ = require('lodash');
const async = require('async');
const uuid = require('uuid');
const reds = require('reds');
const flat = require('flat').flatten;
const unflat = require('flat').unflatten;


/**
 * @object
 * @name reds
 * @description redis search utility
 * @since 0.2.0
 * @public
 */
exports.reds = reds;


/**
 * @object
 * @name indexes
 * @description map of all collection search indexes
 * @since 0.2.0
 * @private
 */
exports.indexes = {};


/**
 * @function
 * @name client
 * @description obtain current active redis client
 * @return {Object} redis client
 * @since 0.2.0
 * @private
 */
exports.client = function () {
  //obtain current redis client
  const _client = exports.redis.client();

  //set reds client
  if (!reds.client) {
    reds.client = _client;
  }

  return _client;
};


/**
 * @function
 * @name key
 * @description prepare storage key
 * @return {Object} redis client
 * @since 0.2.0
 * @private
 */
exports.key = function (...args) {
  const _key = exports.redis.key(args);
  return _key;
};


/**
 * @function
 * @name indexKey
 * @description prepare collection index key
 * @param  {String} collection valid name of the collection
 * @since 0.2.0
 * @public
 */
exports.indexKey = function (collection) {
  collection = [].concat(collection).concat(['search']);
  const indexKey = exports.key(collection);
  return indexKey;
};


/**
 * @function
 * @name save
 * @description store object into redis as hash
 * @param  {Object}   object object to be stored
 * @param  {Object}   [options] options to be used on storage
 * @param  {Function} done   a callback to invoke on success or failure
 * @return {Object}          created and persisted object with key added
 * @since 0.2.0
 * @public
 */
exports.save = exports.create = function (object, options, done) {
  //TODO run all operations atomically

  //normalize arguments
  if (arguments.length === 2) {
    done = options;
    options = {};
  }

  //merge with default options
  options = _.merge({}, {
    index: true,
    collection: 'hash',
    ignore: ['_id']
  }, options);

  //ensure _id is ignored on indexing
  options.ignore = _.uniq(['_id'].concat(options.ignore));


  //TODO validate key to ensure it start with required prefix
  //obtain key from the object to be saved
  //or generate one
  object._id = object._id || exports.key([options.collection, uuid.v1()]);

  //flat the object
  const flatObject = flat(object);

  //ensure client
  exports.client();

  //ensure index
  if (options.index) {
    //prepare collection search index
    const indexKey = exports.indexKey(options.collection);
    exports.indexes[indexKey] =
      exports.indexes[indexKey] || exports.reds.createSearch(indexKey);

    //TODO remove existing index before update
    //TODO make use of traverse to allow deep indexing

    //index flat object
    _.forEach(flatObject, function (value, key) {
      //ignore object key and ignored fields from indexes
      key = _.last(key.split('.'));
      if (!_.has(options.ignore, key)) {
        //ensure indexes
        value = String(value);
        exports.indexes[indexKey].index(value, flatObject._id);
      }
    });
  }


  //save the object and flush indexes
  exports.client().hmset(flatObject._id, flatObject, function afterSave(error) {
    done(error, object);
  });

};


/**
 * @function
 * @name get
 * @description get object from redis hash
 * @param  {String|[String]}   key    key used to store data
 * @param  {Function} done   a callback to invoke on success or failure
 * @return {Object}          persisted object with key added
 * @since 0.2.0
 * @public
 */
exports.get = function (key, done) {

  //ensure client
  exports.client();

  //obtain hash from redis
  exports.client().hgetall(key, function afterFetch(error, object) {

    //unflat hash
    if (!error) {
      object = unflat(object);
    }

    done(error, object);
  });

};


/**
 * @function
 * @name hmget
 * @description get multiple objects from redis
 * @param  {[String]}   keys    collection of keys in redis
 * @param  {Function} done   a callback to invoke on success or failure
 * @since 0.2.0
 * @public
 */
exports.hmgetall = exports.hmget = function (keys, done) {
  //normalize keys to array
  keys = [].concat(keys);

  //initiate multi command client
  const _client = exports.client().multi();

  //prepare multiple hgetall
  _.forEach(keys, function (key) {
    _client.hgetall(key);
  });

  //execute batch / multi commands
  _client.exec(function (error, objects) {

    //unflat objects
    if (!error) {
      objects = _.map(objects, function (object) {
        return unflat(object); //unflatten object from redis
      });
    }

    done(error, objects);
  });
};


/**
 * @function
 * @name search
 * @description search stored objects from redis
 * @param  {Object|String}   options    search options
 * @param  {String}   options.collection    searched collections. default to hash
 * @param  {String}   options.type    search operator(and / or). default to or
 * @param  {String}   options.q    search term. default to ''
 * @param  {Function} done   a callback to invoke on success or failure
 * @since 0.2.0
 * @public
 */
exports.search = function (options, done) {
  //normalize options
  if (_.isString(options)) {
    options = {
      q: options
    };
  }

  //merge options
  options = _.merge({}, {
    type: 'or', //default search operator
    collection: 'hash', //default collection
    q: '' //search term
  }, options);

  //obtain search index
  const indexKey = exports.indexKey(options.collection);
  const search = exports.indexes[indexKey];

  //perform search if search index exists
  if (search) {
    async.waterfall([
      function find(next) {
        //issue search query using reds
        search.query(options.q).type(options.type).end(next);
      },
      function onSearchEnd(keys, next) {
        exports.hmget(keys, next); // get all objects from redis
      }
    ], function onFinish(error, results) {
      done(error, results);
    });
  }

  //no search index exists return empty results
  else {
    done(null, []);
  }
};