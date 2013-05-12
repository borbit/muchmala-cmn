var util = require('util');
var path = require('path');
var uuid = require('node-uuid');
var async = require('async');
var e = require('../errors');
var _ = require('lodash');
var fs = require('fs');

var PIECES_KEY = 'pieces:%s';
var PUZZLE_KEY = 'puzzle:%s';
var PUZZLES_KEY = 'puzzles';

var SELECT_PIECES_KEY = 'select_pieces:%s';
var SELECT_USER_KEY = 'select_user:%s:%d';
var SELECT_TTL = 20000;

var LUA_SWAP = fs.readFileSync(path.join(__dirname, 'swap.lua'));

function puzzleKey(puzzleId) {
  return util.format(PUZZLE_KEY, puzzleId);
}
function piecesKey(puzzleId) {
  return util.format(PIECES_KEY, puzzleId);
}
function selectPiecesKey(puzzleId) {
  return util.format(SELECT_PIECES_KEY, puzzleId);
}
function selectUserKey(puzzleId, pieceIndex) {
  return util.format(SELECT_USER_KEY, puzzleId, pieceIndex);
}

function Puzzle(redis) {
  this.redis = redis;
}

var Proto = Puzzle.prototype;

Proto.addPuzzle = function(data, cb) {
  var id = uuid.v1();
  var time = Date.now();
  var self = this;
  
  async.parallel([
    function(cb) {
      self.redis.zadd([PUZZLES_KEY, time, id], cb);
    },
    function(cb) {
      self.redis.hmset(puzzleKey(id)
      , 'lenHor', data.lenHor
      , 'lenVer', data.lenVer
      , 'spriteSize', data.spriteSize
      , 'pieceSize', data.pieceSize
      , 'public', data.public
      , 'time', time
      , 'id', id
      , cb);
    },
    function(cb) {
      var key = piecesKey(id);
      var args = _.reduce(data.pieces, function(m, p) {
        return m.concat([p.value]);
      }, [key]);
      self.redis.rpush(args, cb);
    }
  ], function(err) {
    if (err) return cb(err);
    cb(null, id);
  });
};

Proto.getPuzzles = function(op, cb) {
  var self = this;
  async.waterfall([
    function(cb) {
      self.getIDs(op, cb);
    },
    function(ids, cb) {
      async.map(ids, function(id, cb) {
        self.getData(id, cb);
      }, cb);
    }
  ], function(err, list) {
    if (err) return cb(err);
    cb(null, list);
  });
};

Proto.getData = function(puzzleId, cb) {
  var key = puzzleKey(puzzleId);
  this.redis.hgetall(key, function(err, data) {
    if (err) return cb(err);
    cb(null, {
      'lenHor': +data.lenHor
    , 'lenVer': +data.lenVer
    , 'spriteSize': +data.spriteSize
    , 'pieceSize': +data.pieceSize
    , 'public': +data.public
    , 'time': +data.time
    , 'id': data.id
    });
  });
};

Proto.getPieces = function(puzzleId, cb) {
  var args = [piecesKey(puzzleId), 0, -1];
  this.redis.lrange(args, function(err, pieces) {
    if (err) return cb(err);
    cb(null, pieces.map(function(piece) {
      return +piece;
    }));
  });
};

Proto.getIDs = function(op, cb) {
  op = _.extend({start: 0, stop: -1}, op);
  var args = [PUZZLES_KEY, op.start, op.stop];
  this.redis.zrange(args, cb);
};

Proto.getFirstPuzzle = function(cb) {
  var self = this;
  var args = [PUZZLES_KEY, 0, 0];

  this.redis.zrange(args, function(err, range) {
    if (err) return cb(err);
    if (!range) return cb(null, null);
    self.getPuzzle(range[0], cb);
  });
};

Proto.getPuzzle = function(puzzleId, cb) {
  var self = this;
  var res;

  async.waterfall([
    function(cb) {
      self.getData(puzzleId, cb);
    },
    function(data, cb) {
      res = data;
      self.getPieces(puzzleId, cb);
    },
    function(pieces, cb) {
      res.pieces = pieces;
      self.getSelected(puzzleId, cb);
    },
    function(selected, cb) {
      res.selected = selected;
      cb();
    }
  ], function(err) {
    if (err) return cb(err);
    cb(null, res);
  });
};

Proto.selectPiece = function(puzzleId, pieceIndex, userId, cb) {
  var self = this;
  var suKey = selectUserKey(puzzleId, pieceIndex);
  var spKey = selectPiecesKey(puzzleId);

  async.waterfall([
    function(cb) {
      var args = [suKey, userId];
      self.redis.setnx(args, cb);
    },
    function(res, cb) {
      if (res === 0) return cb(new e.CannotSelect());
      var args = [suKey, SELECT_TTL];
      self.redis.pexpire(args, cb);
    },
    function(res, cb) {
      var now = Date.now();
      var args = [spKey, now, pieceIndex];
      self.redis.zadd(args, cb);
    }
  ], function(err) {
    if (err) return cb(err);
    cb(null, SELECT_TTL);
  });
};

Proto.releasePiece = function(puzzleId, pieceIndex, cb) {
  var self = this;
  var suKey = selectUserKey(puzzleId, pieceIndex);
  var spKey = selectPiecesKey(puzzleId);

  async.series([
    function(cb) {
      self.redis.del(suKey, cb);
    },
    function(cb) {
      var args = [spKey, pieceIndex];
      self.redis.zrem(args, cb);
    }
  ], function(err) {
    if (err) return cb(err);
    cb();
  });
};

Proto.isSelected = function(puzzleId, pieceIndex, userId, cb) {
  var suKey = selectUserKey(puzzleId, pieceIndex);
  this.redis.get(suKey, function(err, res) {
    if (err) return cb(err);
    cb(null, !!(res == userId));
  });
};

Proto.getSelected = function(puzzleId, cb) {
  var self = this;
  var now = Date.now();
  var spKey = selectPiecesKey(puzzleId);
  var args = [spKey, now - SELECT_TTL, now];
  var selected = {};

  this.redis.zrangebyscore(args, function(err, pieces) {
    if (err) return cb(err);
    if (!pieces.length)
      return cb(null, {});
    
    var args = _.map(pieces, function(index) {
      return selectUserKey(puzzleId, index);
    });

    self.redis.mget(args, function(err, userIds) {
      if (err) return cb(err);

      var len = pieces.length;
      for (var i = 0; i < len; i++) {
        selected[pieces[i]] = {};
        selected[pieces[i]]['userId'] = userIds[i];
      }

      async.forEach(pieces, function(index, cb) {
        var key = selectUserKey(puzzleId, index);

        self.redis.pttl(key, function(err, ttl) {
          if (err) return cb(err);
          selected[index]['ttl'] = ttl;
          cb();
        });
      }, function(err) {
        if (err) return cb(err);
        cb(null, selected);
      });
    });
  });
};

Proto.swapPieces = function(puzzleId, piece1Index, piece2Index, cb) {
  var key = piecesKey(puzzleId);

  this.redis.eval(LUA_SWAP, 3, key, piece1Index, piece2Index, function(err, pieces) {
    if (err) return cb(err);
    
    var res = {};
    var len = pieces.length;
    for (var i = 0; i < len; i += 2) {
      res[pieces[i]] = pieces[i+1];
    }
    cb(null, res);
  });
};

Proto.getCount = function(cb) {
  this.redis.zcard(PUZZLES_KEY, cb);
};

module.exports = Puzzle;