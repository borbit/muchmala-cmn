var uuid = require('node-uuid');
var util = require('util');

var SIGN_KEY = 'sign:%s';

function signKey(hash) {
  return util.format(SIGN_KEY, hash);
}

function Sign(redis) {
  this.redis = redis;
}

var Proto = Sign.prototype;

Proto.getUserId = function(hash, cb) {
  var self = this;
  var key = signKey(hash);
  this.redis.get(key, function(err, userId) {
    if (err) return cb(err);
    if (!userId) return cb(null, null);
    cb(null, userId);
  });
};

Proto.createHash = function(userId, cb) {
  var self = this;
  var hash = uuid.v1();
  var key = signKey(hash);
  this.redis.set(key, userId, function(err) {
    if (err) return cb(err);
    self.redis.expire(key, 300, function(err) {
      if (err) return cb(err);
      cb(null, hash);
    });
  });
};

module.exports = Sign;