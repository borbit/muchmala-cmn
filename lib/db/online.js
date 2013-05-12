var LIST_KEY = 'online';

function Online(redis) {
  this.redis = redis;
}

var Proto = Online.prototype;

Proto.add = function(userId, cb) {
  var now = Date.now();
  var args = [LIST_KEY, now, userId];
  this.redis.zadd(args, function(err) {
    if (!cb) return;
    if (err) return cb(err);
    cb();
  });
};

Proto.rm = function(userId, cb) {
  var args = [LIST_KEY, userId];
  this.redis.zrem(args, function(err) {
    if (!cb) return;
    if (err) return cb(err);
    cb();
  });
};

Proto.count = function(cb) {
  var max = Date.now();
  var min = max - 60*60*1000;
  var args = [LIST_KEY, min, max];
  this.redis.zcount(args, function(err, count) {
    if (err) return cb(err);
    cb(null, count);
  });
};

Proto.list = function(cb) {
  var args = [LIST_KEY, 0, -1];
  this.redis.zrange(args, function(err, list) {
    if (err) return cb(err);
    cb(null, list);
  });
};

module.exports = Online;