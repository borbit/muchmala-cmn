var _ = require('lodash');
var Piece = require('./piece');

function createPiece(x, y, lh) {
  var piece = new Piece();

  piece.t = ~~(Math.random() * 2);
  piece.b = ~~(Math.random() * 2);
  piece.l = ~~(Math.random() * 2);
  piece.r = ~~(Math.random() * 2);
  piece.o = y * lh + x;

  return piece;
}

function createMap(width, height, pieceSize) {
  var tileSize = Piece.calcTileSize(pieceSize);
  var lh = Piece.calcLength(width, tileSize);
  var lv = Piece.calcLength(height, tileSize);
  var piece, grid = [];

  for (var y = 0; y < lv; y++) {
  for (var x = 0; x < lh; x++) {
    piece = createPiece(x, y, lh);

    if (grid[y-1] && grid[y-1][x])
      piece.t = (grid[y-1][x].b == 1) ? 0 : 1;
    if (grid[y] && grid[y][x-1])
      piece.l = (grid[y][x-1].r == 1) ? 0 : 1;

    grid[y] || (grid[y] = []);
    grid[y][x] = piece;
  }}

  var map = [];

  _.each(grid, function(row) {
  _.each(row, function(piece) {
    map.push(piece);
  });
  });

  var pieces = shuffleMap(map);

  return {
    pieces: pieces
  , lenHor: lh
  , lenVer: lv
  };
}

function shuffleMap(map, index) {
  var res = [];
  var index = {};

  map = _.map(map, function(piece) {
    if (piece instanceof Piece) return piece;
    return new Piece(piece);
  });
  _.each(map, function(piece) {
    index[piece.s] || (index[piece.s] = [])
    index[piece.s].push(piece);
  });
  _.each(index, _.shuffle);
  _.each(map, function(piece) {
    piece = index[piece.s].pop();
    res.push(piece.value);
  });

  return res;
}

exports.createMap = createMap;
exports.shuffleMap = shuffleMap;