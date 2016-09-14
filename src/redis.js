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
const path = require('path');
const redis = require('redis');
const _ = require('lodash');
const uuid = require('uuid');
const noop = function () {};


//import and extend redis with hash utilities
const hash = require(path.join(__dirname, 'hash'));
hash.redis = exports;
exports.hash = hash;


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

  //exports pub/sub clients
  return { publisher: exports.publisher, subscriber: exports.subscriber };
};


/**
 * @function
 * @name init
 * @description initialize redis client and pubsub
 * @return {Object} redis client
 * @since 0.1.0
 * @public
 */
exports.init = exports.client = function () {

  //initialize normal client
  if (!exports._client) {
    exports._client = exports.createClient();
  }

  //initialize publisher and subscriber clients
  exports.pubsub();

  //return a normal redis client
  return exports._client;

};


/**
 * @function
 * @name multi
 * @description initialize redis multi command object
 * @return {Object} redis multi command object
 * @since 0.3.0
 * @see {@link https://github.com/NodeRedis/node_redis#clientmulticommands}
 * @public
 */
exports.multi = function () {
  //ensure clients
  const client = exports.init();

  //obtain client
  const multi = client.multi();

  return multi;
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

  exports.client().info(function (error /*, info*/ ) {
    // jshint camelcase:false
    done(error, exports._client.server_info);
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
exports.key = function (...args) {

  //concatenate key is varargs
  let key = [].concat(...args);

  //ensure key
  if (key.length === 0) {
    key = key.concat(uuid.v1());
  }

  key = [exports.defaults.prefix].concat(key);

  //join key using separator
  key = key.join(exports.defaults.separator);

  return key;
};


/**
 * @function
 * @name reset
 * @description quit and reset redis clients states
 * @since 0.1.0
 * @public
 */
exports.reset = exports.quit = function () {
  //clear subscriptions and listeners
  if (exports.subscriber) {
    exports.subscriber.unsubscribe();
    exports.subscriber.removeAllListeners();
  }

  //quit clients
  exports._client =
    exports._client ? exports._client.quit() : null;

  exports.publisher =
    exports.publisher ? exports.publisher.quit() : null;

  exports.subscriber =
    exports.subscriber ? exports.subscriber.quit() : null;

  //reset clients
  exports._client = null;
  exports.publisher = null;
  exports.subscriber = null;

  //reset settings
  exports.defaults = _.merge({}, defaults);
};


/**
 * @function
 * @name clear
 * @description clear all data saved and their key
 * @param {String} [pattern] pattern of keys to be removed
 * @param {Function} done a callback to invoke on success or failure
 * @since 0.1.0
 * @public
 */
exports.clear = function (pattern, done) {

  //TODO clear hash search index

  //normalize arguments
  if (pattern && _.isFunction(pattern)) {
    done = pattern;
    pattern = undefined;
  }

  //ensure callback
  if (!done) {
    done = noop;
  }

  //prepare clear all key regex
  pattern = _.compact([exports.defaults.prefix, pattern]);
  if (pattern.length > 1) {
    pattern = pattern.join(exports.defaults.separator);
  }
  pattern = [pattern].concat(['*']).join('');

  //ensure client
  exports.init();

  //clear data
  exports.client().keys(pattern, function (error, keys) {
    //back-off in case there is error
    if (error) {
      done(error);
    } else {
      //initiate multi to run all commands atomically
      var _client = exports.multi();

      //queue commands
      _.forEach(keys, function (key) {
        _client.del(key);
      });

      //execute commands
      _client.exec(done);
    }
  });
};