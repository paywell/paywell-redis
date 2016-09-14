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
const traverse = require('traverse');
const uuid = require('uuid');
const reds = require('reds');
const flat = require('flat').flatten;
const unflat = require('flat').unflatten;


/**
 * @function
 * @name parse
 * @description traverse js object and try convert values to their respective
 *              js type i.e numbers etc
 * @param  {Object} object valid js plain object
 * @return {Object}        object with all nodes converted to their respective
 *                                js types
 *
 * @since 0.3.0
 * @private
 */
exports.parse = function (object) {

  //ensure object
  object = _.merge({}, object);

  //traverse object and apply parser
  traverse(object).forEach(function (value) {

    //parse number strings to js numbers
    const isNumber = !isNaN(value);
    if (isNumber) {
      value = Number(value);
      //update current field
      this.update(value);
    }

  });

  return object;
};

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
  const _key = exports.redis.key([].concat(...args));
  return _key;
};


/**
 * @function
 * @name multi
 * @description create new instance of redis multi object
 * @return {Object} redis client
 * @since 0.2.0
 * @private
 */
exports.multi = function () {
  const client = exports.client();
  const multi = client.multi();
  return multi;
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

  //ensure object
  object = _.merge({}, object);

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
    //parse object
    object = exports.parse(object);
    done(error, object);
  });

};


/**
 * @function
 * @name get
 * @description get objects from redis
 * @param  {String|[String]}   keys    a single or collection of existing keys
 * @param  {Function} done   a callback to invoke on success or failure
 * @return {Object|[Object]} single or collection of existing hash
 * @since 0.2.0
 * @public
 */
exports.get = function (...keys) {

  //normalize keys to array
  keys = [].concat(...keys);

  //compact and ensure unique keys
  keys = _.uniq(_.compact(keys));

  //obtain callback
  const done = _.last(keys);

  //obtain keys
  keys = _.initial(keys);

  //initiate multi command client
  const _client = exports.multi();

  //prepare multiple hgetall
  _.forEach(keys, function (key) {
    _client.hgetall(key);
  });

  //execute batch / multi commands
  _client.exec(function (error, objects) {

    //unflat objects
    if (!error) {

      //unflatten objects
      objects = _.map(objects, function (object) {

        //unflatten object from redis
        object = unflat(object);
        //parse object
        object = exports.parse(object);

        return object;
      });

      //ensure single or multi objects
      objects = keys.length === 1 ? _.first(objects) : objects;
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
  if (search && !_.isEmpty(options.q)) {
    async.waterfall([
      function find(next) {
        //issue search query using reds
        search.query(options.q).type(options.type).end(next);
      },
      function onSearchEnd(keys, next) {
        exports.get(keys, next); // get all objects from redis
      },
      function normalizeResults(results, next) {
        results = [].concat(results);
        next(null, results);
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