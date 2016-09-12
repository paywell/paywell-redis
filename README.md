paywell-redis
===============

[![Build Status](https://travis-ci.org/paywell/paywell-redis.svg?branch=master)](https://travis-ci.org/paywell/paywell-redis)
[![Dependency Status](https://img.shields.io/david/paywell/paywell-redis.svg?style=flat)](https://david-dm.org/paywell/paywell-redis)
[![npm version](https://badge.fury.io/js/paywell-redis.svg)](https://badge.fury.io/js/paywell-redis)

redis client factory and utilities

## Requirements
- [Redis 2.8.0+](http://redis.io/)
- [NodeJS 6.5.0+](https://nodejs.org/en/)

## Installation
```sh
$ npm install --save paywell-redis
```

## Usage

```javascript
//initialize redis with default options
const redis = require('paywell-redis')([options]);

//obtain normal redis client
const client = redis.client();

//obtain pub/sub clients
const { publisher, subscriber } = redis.pubsub();

//clear users data
redis.clear('users*', function(error, response){
    ...
});

//clear all data
redis.clear(function(error, response){
    ...
});

//reset and quit all clients
redis.quit();
```

## Options
- `prefix:String` - redis key prefix. default to `paywell`
- `separator:String` - redis key separator. default to `:`
- `redis:Object` - [redis](https://github.com/NodeRedis/node_redis#rediscreateclient) connections options.

To initialize `redis` with custom options use

```js
const redis = require('paywell-redis')({
    prefix:'q',
    separator:'-',
    redis: {
    port: 6379,
    host: '127.0.0.1'
  }
});

...

```

## API

### `createClient([options:Object]):Object`
Create a new instance of redis client

```js
const redis = require('paywell-redis')();
const client = redis.createClient([options]);

...

```

### `pubsub():{publisher, subscriber}`
Obtain existing or create new instances of publisher and subscriber redis clients

```js
const redis = require('paywell-redis')();
const { publisher, subscriber } = redis.pubsub();

...

```

### `info(done:Function):Object`
Obtain informations of the current redis server.

```js
const redis = require('paywell-redis')();
redis.info(function(error, info){
    ...
});

```

### `key(...args):String`
Build redis storage key using `prefix` and `separator` options

```js
const redis = require('paywell-redis')();

//generate random key
const key = redis.key();
expect(key).to.exist;
expect(key.split(':')).to.have.length(2);

const key = redis.key('ab');
expect(key).to.be.equal('paywell:ab');

const key = redis.key(['users', 'ab']);
expect(key).to.be.equal('paywell:users:ab');

const key = redis.key('users', 'likes', 'vegetables');
expect(key).to.be.equal('paywell:users:likes:vegetables');

...

```

### `clear(pattern:String,[done:Function]):Array[String>`
clear data using specified pattern. if pattern not provided all data will be deleted

```js
const redis = require('paywell-redis')();

//clear all data
redis.clear(function(error, responses){
    ...
});

//clear all key 'users*'
redis.clear('users',function(error, responses){
    ...
});

...

```

### `reset()`
Reset current state of redis

```js
const redis = require('paywell-redis')();
redis.reset();

...

```

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```

* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence

The MIT License (MIT)

Copyright (c) 2016 byteskode, paywell, lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 