var fs = require('fs');
var path = require('path');
var async = require('async');

var db = require('./db');
var cutter = require('./cutter');
var mapper = require('./mapper');

function Builder(redisClient) {
  this.redisClient = redisClient;
}

Builder.prototype.buildPuzzle = function(op, cb) {
  var self = this;
  async.waterfall([
    function(cb) {
      self.loadImage(op.imagePath, cb);
    },
    function(image, cb) {
      self.processImage(image, op, cb);
    }
  ], cb);
};

Builder.prototype.processImage = function(image, op, cb) {
  var puzzle = new db.Puzzle(this.redisClient);
  var map = mapper.createMap(image.width, image.height, op.pieceSize);
  var dir, image;

  async.waterfall([
    function(cb) {
      puzzle.addPuzzle({
        pieceSize  : op.pieceSize
      , spriteSize : op.spriteSize
      , pieces     : map.pieces
      , lenHor     : map.lenHor
      , lenVer     : map.lenVer
      , public     : 0
      }, cb);
    },
    function(id, cb) {
      fs.mkdir(dir = path.join(op.dirPath, id), 0777, cb);
    },
    function(cb) {
      cutter.cutPuzzle({
        dir        : dir
      , image      : image
      , pieceSize  : op.pieceSize
      , spriteSize : op.spriteSize
      , pieces     : map.pieces
      , lenHor     : map.lenHor
      , lenVer     : map.lenVer
      }, cb);
    }
  ], cb);
};

Builder.prototype.buildCovers = function(op, cb) {
  var dir = path.join(op.dirPath, op.pieceSize+'');
  var self = this;
  async.series([
    function(cb) {
      fs.mkdir(dir, 0777, cb);
    },
    function(cb) {
      cutter.cutCovers({
        dir       : dir
      , pieceSize : op.pieceSize
      }, cb);
    }
  ], cb);
};

Builder.prototype.buildFrame = function(op, cb) {
  var dir = path.join(op.dirPath, op.pieceSize+'');
  var self = this;
  async.series([
    function(cb) {
      fs.mkdir(dir, 0777, cb);
    },
    function(cb) {
      cutter.cutFrame({
        dir       : dir
      , pieceSize : op.pieceSize
      }, cb);
    }
  ], cb);
};

Builder.prototype.loadImage = function(imagePath, cb) {
  var Canvas = require('canvas');
  var img = new Canvas.Image();
  img.onerror = cb;
  img.onload = function() {
    cb(null, img);
  };
  img.src = imagePath;
};

module.exports = Builder;