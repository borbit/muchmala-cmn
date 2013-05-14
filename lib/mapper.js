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

  var map = [];
  var index = {};
  var piece, key;

  for (var y = 0; y < lv; y++) {
  for (var x = 0; x < lh; x++) {
    piece = createPiece(x, y, lh);

    if (map[y-1] && map[y-1][x])
      piece.t = (map[y-1][x].b == 1) ? 0 : 1;
    if (map[y] && map[y][x-1])
      piece.l = (map[y][x-1].r == 1) ? 0 : 1;

    map[y] || (map[y] = []);
    map[y][x] = piece;

    index[piece.s] || (index[piece.s] = [])
    index[piece.s].push(map[y][x]);
  }}

  var pieces = shuffle(map, index);

  return {
    pieces: pieces
  , lenHor: lh
  , lenVer: lv
  };
}

function shuffle(map, index) {
  var res = [];
  _.each(index, _.shuffle);
  _.each(map, function(row, y) {
  _.each(row, function(piece, x) {
    piece = index[piece.s].pop();
    res.push(piece);
  });
  });

  return res;
}

exports.map = createMap;