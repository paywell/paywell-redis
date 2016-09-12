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
const redis = require('redis');
const _ = require('lodash');


//defaults settings
const defaults = {
  prefix: 'paywell',
  separator: ':',
  redis: {
    port: 6379,
    host: '127.0.0.1'
  }
};


/**
 * @name defaults
 * @description default redis client connection options
 * @type {Object}
 * @since 0.1.0
 * @public
 */
exports.defaults = _.merge({}, defaults);


/**
 * @function
 * @name createClient
 * @description instantiate new redis client if not exists
 * @return {Object} an instance of redis client
 * @since 0.1.0
 * @public
 */
exports.createClient = function (options) {

  options = _.merge({}, exports.defaults, options);

  const socket = options.redis.socket;
  const port = !socket ? (options.redis.port || 6379) : null;
  const host = !socket ? (options.redis.host || '127.0.0.1') : null;
  const client =
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

  //reset settings
  exports.defaults = _.merge({}, defaults);
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

//TODO implement process shutdown hook