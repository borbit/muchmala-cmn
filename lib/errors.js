var util = require('util');

function ErrorBase() {
  this.name = '';
  this.message = '';
  this.data = null;
}

util.inherits(ErrorBase, Error);

ErrorBase.prototype.toJSON = function() {
  var json = {
    name: this.name
  , message: this.message
  };

  if (this.data) {
    json.data = this.data;
  }

  return json;
};

exports.AuthenticationFailed = function() {
  this.name = 'AuthenticationFailed';
  this.message = 'Authentication failed';
};

exports.CannotSelect = function() {
  this.name = 'CannotSelect';
  this.message = 'Cannot select';
};

exports.CannotRelease = function() {
  this.name = 'CannotRelease';
  this.message = 'Cannot release';
};

exports.CannotSwap = function() {
  this.name = 'CannotSwap';
  this.message = 'Cannot swap';
};

exports.BadRequest = function(m) {
  this.name = 'BadRequest';
  this.message = m;
};

exports.NoPuzzle = function() {
  this.name = 'NoPuzzle';
  this.message = 'No puzzle';
};

util.inherits(exports.AuthenticationFailed, ErrorBase);
util.inherits(exports.CannotSelect, ErrorBase);
util.inherits(exports.CannotRelease, ErrorBase);
util.inherits(exports.CannotSwap, ErrorBase);
util.inherits(exports.BadRequest, ErrorBase);
util.inherits(exports.NoPuzzle, ErrorBase);