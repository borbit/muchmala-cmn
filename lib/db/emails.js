var util = require('util');

var EMAIL_KEY = 'email:%s';

function emailKey(email) {
  return util.format(EMAIL_KEY, email);
}

function Emails(redis) {
  this.redis = redis;
}

var Proto = Emails.prototype;

Proto.getUserId = function(email, cb) {
  var self = this;
  var key = emailKey(email);
  this.redis.get(key, function(err, userId) {
    if (err) return cb(err);
    if (!userId) return cb(null, null);
    cb(null, userId);
  });
};

Proto.addEmail = function(email, userId, cb) {
  var key = emailKey(email);
  this.redis.set(key, userId, function(err) {
    if (err && !cb) throw err;
    if (err) return cb(err);
    cb && cb();
  });
};

module.exports = Emails;