var _ = require('lodash');

function User(id, data, db) {
  this.id = id;
  this.db = db;
  this.data = data || {};

  _.defaults(this.data, User.DEFAULTS);
}

User.MAX_NAME_LENGTH = 20;
User.DEFAULTS = {
  email: ''
, name: ''
};

User.prototype.set = function(key, value) {
  if (key in this.data) {
    this.data[key] = value;
  }
};

User.prototype.update = function(cb) {
  this.db.updateUser(this.id, this.data, cb);
};

module.exports = User;