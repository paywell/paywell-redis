'use strict';


/**
 * @module
 * @copyright paywell Team at byteskode <www.byteskode.com>
 * @description redis client factories
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com, lally.elias@byteskode.com>
 * @singleton
 * @public
 */


//dependencies
var redis = require('redis');
var _ = require('lodash');
var async = require('async');
var uuid = require('uuid');
var reds = require('reds');
var flat = require('flat').flatten;
var unflat = require('flat').unflatten;


/**
 * @name defaults
 * @description default redis client connection options
 * @type {Object}
 * @since 0.1.0
 * @public
 */
exports.defaults = {
  prefix: 'paywell',
  separator: ':',
  redis: {
    port: 6379,
    host: '127.0.0.1'
  }
};


/**
 * @object
 * @name reds
 * @description redis search utility
 * @since 0.1.0
 * @public
 */
exports.reds = reds;


/**
 * @object
 * @name indexes
 * @description map of all collection search indexes
 * @since 0.1.0
 * @private
 */
exports.indexes = {};


/**
 * @function
 * @name createClient
 * @description instantiate new redis client if not exists
 * @return {Object} an instance of redis client
 * @since 0.1.0
 * @public
 */
exports.createClient = function () {

  var options = _.merge({}, exports.defaults, exports.options);

  var socket = options.redis.socket;
  var port = !socket ? (options.redis.port || 6379) : null;
  var host = !socket ? (options.redis.host || '127.0.0.1') : null;
  var client =
    redis.createClient(socket || port, host, options.redis.options);

  if (options.redis.auth) {
    client.auth(options.redis.auth);
  }

  if (options.redis.db) {
    client.select(options.redis.db);
  }

  return client;
};


/**
 * @function
 * @name pubsub
 * @description instantiate redis pub-sub clients pair if not exists
 * @since 0.1.0
 * @public
 */
exports.pubsub = function () {
  //create publisher if not exists
  if (!exports.publisher) {
    exports.publisher = exports.createClient();
  }

  //create subscriber if not exist
  if (!exports.subscriber) {
    exports.subscriber = exports.createClient();
  }
};


/**
 * @function
 * @name init
 * @description initialize redis client and pubsub
 * @since 0.1.0
 * @public
 */
exports.init = function () {

  //initialize normal client
  if (!exports.client) {
    exports.client = exports.createClient();
  }


  //set reds client
  if (!reds.client) {
    reds.client = exports.client;
  }

  //initialize publisher and subscriber clients
  exports.pubsub();

};


/**
 * @function
 * @name info
 * @description collect redis server health information
 * @param  {Function} done a callback to invoke on success or failure
 * @return {Object}        server details
 * @since 0.1.0
 * @public
 */
exports.info = function (done) {
  //ensure connection
  exports.init();

  exports.client.info(function (error /*, info*/ ) {
    // jshint camelcase:false
    done(error, exports.client.server_info);
    // jshint camelcase:true
  });
};


/**
 * @function
 * @name key
 * @description prepare data storage key
 * @param  {String|String[]} key valid data store key
 * @since 0.1.0
 * @public
 */
exports.key = function (key) {
  //concatenate key is varargs
  key = [].concat(key);
  key = [exports.defaults.prefix].concat(key);

  //join key using separator
  key = key.join(exports.defaults.separator);

  return key;
};


/**
 * @function
 * @name indexKey
 * @description prepare collection index key
 * @param  {String} collection valid name of the collection
 * @since 0.1.0
 * @public
 */
exports.indexKey = function (collection) {
  collection = [].concat(collection).concat(['search']);
  var indexKey = exports.key(collection);
  return indexKey;
};


/**
 * @function
 * @name reset
 * @description quit and reset redis clients states
 * @since 0.1.0
 * @public
 */
exports.reset = function () {
  //clear subscriptions and listeners
  if (exports.subscriber) {
    exports.subscriber.unsubscribe();
    exports.subscriber.removeAllListeners();
  }

  //quit clients
  exports.client =
    exports.client ? exports.client.quit() : null;

  exports.publisher =
    exports.publisher ? exports.publisher.quit() : null;

  exports.subscriber =
    exports.subscriber ? exports.subscriber.quit() : null;

  //reset clients
  exports.client = null;
  exports.publisher = null;
  exports.subscriber = null;
  exports.reds.client = null;
  exports.indexes = {};
};


/**
 * @function
 * @name clear
 * @description clear all data saved and their key
 * @param {String|[String]} [keys] key pattern or collection of keys to removed
 * @param {Function} done a callback to invoke on success or failure
 * @since 0.1.0
 * @public
 */
exports.clear = function (keys, done) {

  //normalize arguments
  if (keys && _.isFunction(keys)) {
    done = keys;
    keys = undefined;
  }

  //TODO handle collection of keys passed

  //prepare clear all key regex
  keys = _.compact([exports.defaults.prefix, keys]);
  keys = [keys, '*'].join('');

  //ensure client
  exports.init();

  //clear data
  exports.client.keys(keys, function (error, rows) {
    //back-off in case there is error
    if (error) {
      done(error);
    } else {
      //initiate multi to run all commands atomically
      var _client = exports.client.multi();

      //queue commands
      _.forEach(rows, function (row) {
        _client.del(row);
      });

      //execute commands
      _client.exec(done);
    }
  });
};


//-----------------------------------------------------------------------------
// Hash Helpers
//-----------------------------------------------------------------------------


/**
 * @function
 * @name hset
 * @description store object into redis as hash
 * @param  {Object}   object object to be stored
 * @param  {Object}   [options] options to be used on storage
 * @param  {Function} done   a callback to invoke on success or failure
 * @return {Object}          created and persisted object with key added
 * @since 0.1.0
 * @public
 */
exports.hmset = exports.hset = function (object, options, done) {
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
  var flatObject = flat(object);

  //ensure client
  exports.init();

  //ensure index
  if (options.index) {
    //prepare collection search index
    var indexKey = exports.indexKey(options.collection);
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
  exports.client.hmset(flatObject._id, flatObject, function afterSave(error) {
    done(error, object);
  });

};


/**
 * @function
 * @name hget
 * @description get object from redis hash
 * @param  {String|[String]}   key    key used to store data
 * @param  {Function} done   a callback to invoke on success or failure
 * @return {Object}          persisted object with key added
 * @since 0.1.0
 * @public
 */
exports.hgetall = exports.hget = function (key, done) {

  //ensure client
  exports.init();

  //obtain hash from redis
  exports.client.hgetall(key, function afterFetch(error, object) {

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
 * @since 0.1.0
 * @public
 */
exports.hmgetall = exports.hmget = function (keys, done) {
  //normalize keys to array
  keys = [].concat(keys);

  //initiate multi command client
  var _client = exports.client.multi();

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
 * @name hsearch
 * @description search stored objects from redis
 * @param  {Object|String}   options    search options
 * @param  {String}   options.collection    searched collections. default to hash
 * @param  {String}   options.type    search operator(and / or). default to or
 * @param  {String}   options.q    search term. default to ''
 * @param  {Function} done   a callback to invoke on success or failure
 * @since 0.1.0
 * @public
 */
exports.hsearch = function (options, done) {
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
  var indexKey = exports.indexKey(options.collection);
  var search = exports.indexes[indexKey];

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


//TODO implement process shutdown hook