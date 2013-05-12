var User = require('./user');
var uuid = require('node-uuid');
var db = require('./db');
var _ = require('lodash');

function Users(redis) {
  this.db = new db.Users(redis);
}

Users.prototype.createUser = function(cb) {
  var db = this.db;
  var data = {
    id: uuid.v1()
  , pid: uuid.v1()
  };

  _.defaults(data, User.defaults);

  db.createUser(data, function(err) {
    if (err) return cb(err);
    cb(null, new User(data.id, data, db));
  });
};

Users.prototype.getUser = function(id, cb) {
  var db = this.db;
  db.getUser(id, function(err, data) {
    if (err) return cb(err);
    cb(null, data ? new User(data.id, data, db) : null);
  });
};

Users.prototype.getUsers = function(ids, cb) {
  var db = this.db;
  db.getUsers(ids, function(err, usersData) {
    if (err) return cb(err);

    var result = {};
    _.each(usersData, function(data, id) {
      result[id] = new User(id, data, db);
    });

    cb(null, result);
  });
};

Users.prototype.getUserByPid = function(pid, cb) {
  var db = this.db;
  db.getUserByPid(pid, function(err, data) {
    if (err) return cb(err);
    cb(null, data ? new User(data.id, data, db) : null);
  });
};

module.exports = Users;