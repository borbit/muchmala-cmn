var util = require('util');
var _ = require('lodash');

var USER_KEY = 'user:%s';
var USER_PID_KEY = 'user_pid:%s';

function userKey(id) {
  return util.format(USER_KEY, id);
}

function userPidKey(pid) {
  return util.format(USER_PID_KEY, pid);
}

function Users(redis) {
  this.redis = redis;
}

var Proto = Users.prototype;

Proto.createUser = function(data, cb) {
  var redis = this.redis;
  var key = userKey(data.id);
  // set user data
  redis.set(key, JSON.stringify(data), function(err) {
    if (err) return cb(err); 
    // set binding pid => id
    var key = userPidKey(data.pid); 
    redis.set(key, data.id, function(err) {
      if (err) return cb(err);
      cb(null);
    });
  });
};

Proto.getUser = function(id, cb) {
  var key = userKey(id);
  this.redis.get(key, function(err, user) {
    if (err) return cb(err);
    if (!id) return cb(null, null);
    cb(null, JSON.parse(user));
  });
};

Proto.getUserByPid = function(pid, cb) {
  var redis = this.redis;
  var key = userPidKey(pid);
  // get user id by pid
  redis.get(key, function(err, id) {
    if (err) return cb(err);
    if (!id) return cb(null, null);
    // get user by id
    var key = userKey(id);
    redis.get(key, function(err, user) {
      if (err) return cb(err);
      if (!id) return cb(null, null);
      cb(null, JSON.parse(user));
    });
  });
};

Proto.getUsers = function(ids, cb) {
  var keys = _.map(ids, function(id) {
    return userKey(id);
  });
  this.redis.mget(keys, function(err, users) {
    if (err) return cb(err);
    var result = {};
    for (var i = ids.length; i--;) {
      if (users[i]) {
        result[ids[i]] = JSON.parse(users[i]);
      }
    }
    cb(null, result);
  });
};

Proto.updateUser = function(id, data, cb) {
  var key = userKey(id);
  var data = JSON.stringify(data);
  this.redis.set(key, data, function(err) {
    if (err && !cb) throw err;
    if (err) return cb(err);
    cb && cb();
  });
};

module.exports = Users;