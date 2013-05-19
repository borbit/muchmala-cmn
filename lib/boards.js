var Board = require('leaderboard');
var async = require('async');

function Boards(redisClient, options) {
  // we don't pass leaderboard name
  this.board = new Board(null, options, redisClient);
}

var Proto = Boards.prototype;

function dailyKey() {
  var now = new Date();
  return 'daily:' + now.getYear() + ':'
                  + now.getMonth() + ':'
                  + now.getDate();
}

// shift user in every leaderboards
Proto.shiftUser = function(userId, scoreDelta, cb) {
  var self = this;
  async.parallel([
    function(cb) {
      self.board.incrIn('general', userId, scoreDelta, cb);
    },
    function(cb) {
      self.board.incrIn(dailyKey(), userId, scoreDelta, cb);
    }
  ], cb);
};

// get general leaderboard
Proto.getGeneral = function(cb) {
  this.board.listIn('general', cb);
};

// get daily leaderboard
Proto.getDaily = function(cb) {
  this.board.listIn(dailyKey(), cb);
};

// get user score data
Proto.getUserScores = function(userId, cb) {
  var self = this;
  async.series({
    general: function(cb) {
      self.getUserData('general', userId, cb)
    },
    daily: function(cb) {
      self.getUserData(dailyKey(), userId, cb)
    }
  }, cb);
};

// get user baord data
Proto.getUserData = function(name, userId, cb) {
  var self = this;
  async.parallel({
    score: function(cb) {
      // get user score in the leaderboard
      self.board.scoreIn(name, userId, cb); 
    },
    rank: function(cb) {
      // get user rank in the leaderboard
      self.board.rankIn(name, userId, cb); 
    }
  }, function(err, d) {
    if (err) return cb(err);
    // if user is not in the leaderboard yet
    if (d.rank <= 0) return cb(null, d);
    // get score user should gain to get higher rank
    self.getNextUser(name, d.rank, d.score, function(err, next) {
      if (err) return cb(err);
      d.next = next;
      cb(null, d);
    }); 
  });
};

Proto.getNextUser = function(name, rank, score, cb) {
  var self = this;
  this.board.atIn(name, rank-1, function(err, member) {
    if (err) return cb(err);
    if (member.score == score)
      return self.next(name, rank-1, score, cb)
    cb(null, member.score);
  });
};

Proto.boardExists = function(name) {
  return !!~['daily', 'general'].indexOf(name);
}; 

module.exports = Boards;