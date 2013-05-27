var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , _ = require('lodash');

var Canvas = require('canvas');
var Piece = require('./piece');

var PIECES_SPRITE_FILENAME  = 'pieces.png';
var DEFAULT_COVERS_FILENAME = 'def_covers.png';
var SELECT_COVERS_FILENAME  = 'sel_covers.png';
var LOCK_COVERS_FILENAME    = 'loc_covers.png';
var FRAME_FILENAME          = 'frame.png';

var DEFAULT_COVER_COLOR = 'rgba(255,255,255,0.3)';
var SELECT_COVER_COLOR  = 'rgba(0,0,0,0.5)';
var LOCK_COVER_COLOR    = 'rgba(255,0,0,0.5)';
var FRAME_COLOR         = 'rgb(255,255,255)';

var COVERS_MAP = [
  {x: 0, y: 0, l: 0, t: 0, r: 0, b: 0},
  {x: 1, y: 0, l: 1, t: 1, r: 1, b: 1},
  {x: 2, y: 0, l: 1, t: 0, r: 0, b: 0},
  {x: 3, y: 0, l: 0, t: 1, r: 0, b: 0},
  {x: 0, y: 1, l: 0, t: 0, r: 1, b: 0},
  {x: 1, y: 1, l: 0, t: 0, r: 0, b: 1},
  {x: 2, y: 1, l: 1, t: 1, r: 1, b: 0},
  {x: 3, y: 1, l: 0, t: 1, r: 1, b: 1},
  {x: 0, y: 2, l: 1, t: 1, r: 0, b: 1},
  {x: 1, y: 2, l: 1, t: 0, r: 1, b: 1},
  {x: 2, y: 2, l: 1, t: 1, r: 0, b: 0},
  {x: 3, y: 2, l: 0, t: 0, r: 1, b: 1},
  {x: 0, y: 3, l: 0, t: 1, r: 1, b: 0},
  {x: 1, y: 3, l: 1, t: 0, r: 0, b: 1},
  {x: 2, y: 3, l: 0, t: 1, r: 0, b: 1},
  {x: 3, y: 3, l: 1, t: 0, r: 1, b: 0}
];

function leftInnerCurve(ctx, step) {
  ctx.lineTo(step, step*2.5-1);
  ctx.quadraticCurveTo(step*2, step*2, step*2, step*3);
  ctx.quadraticCurveTo(step*2, step*4, step, step*3.5+1);
}

function leftOuterCurve(ctx, step) {
  ctx.lineTo(step, step*2.5+1);
  ctx.quadraticCurveTo(0, step*2, 0, step*3);
  ctx.quadraticCurveTo(0, step*4, step, step*3.5-1);
}

function bottomInnerCurve(ctx, step) {
  ctx.lineTo(step*2.5-1, step*5);
  ctx.quadraticCurveTo(step*2, step*4, step*3, step*4);
  ctx.quadraticCurveTo(step*4, step*4, step*3.5+1, step*5);
}

function bottomOuterCurve(ctx, step) {
  ctx.lineTo(step*2.5+1, step*5);
  ctx.quadraticCurveTo(step*2, step*6, step*3, step*6);
  ctx.quadraticCurveTo(step*4, step*6, step*3.5-1, step*5);
}

function rightInnerCurve(ctx, step) {
  ctx.lineTo(step*5, step*3.5+1);
  ctx.quadraticCurveTo(step*4, step*4, step*4, step*3);
  ctx.quadraticCurveTo(step*4, step*2, step*5, step*2.5-1);
}

function rightOuterCurve(ctx, step) {
  ctx.lineTo(step*5, step*3.5-1);
  ctx.quadraticCurveTo(step*6, step*4, step*6, step*3);
  ctx.quadraticCurveTo(step*6, step*2, step*5, step*2.5+1);
}

function topInnerCurve(ctx, step) {
  ctx.lineTo(step*3.5+1, step);
  ctx.quadraticCurveTo(step*4, step*2, step*3, step*2);
  ctx.quadraticCurveTo(step*2, step*2, step*2.5-1, step);
}

function topOuterCurve(ctx, step) {
  ctx.lineTo(step*3.5-1, step);
  ctx.quadraticCurveTo(step*4, 0, step*3, 0);
  ctx.quadraticCurveTo(step*2, 0, step*2.5+1, step);
}

function drawPiecePath(ctx, step, piece) {
  ctx.beginPath();
  ctx.moveTo(step, step);
  piece.l ? leftOuterCurve(ctx, step) : leftInnerCurve(ctx, step);

  ctx.lineTo(step, step*5);
  piece.b ? bottomOuterCurve(ctx, step) : bottomInnerCurve(ctx, step);

  ctx.lineTo(step*5, step*5);
  piece.r ? rightOuterCurve(ctx, step) : rightInnerCurve(ctx, step);

  ctx.lineTo(step*5, step);
  piece.t ? topOuterCurve(ctx, step) : topInnerCurve(ctx, step);
  ctx.lineTo(step, step);
}

function cutPuzzle(op, cb) {
  var step = Piece.calcStep(op.pieceSize);
  var rows = Math.ceil(op.lenVer / op.spriteSize);
  var cols = Math.ceil(op.lenHor / op.spriteSize);
    
  async.forEachSeries(_.range(rows), function(row, cb) {
  async.forEachSeries(_.range(cols), function(col, cb) {
    
    var hPiecesCountLeft = op.lenHor - col * op.spriteSize;
    var vPiecesCountLeft = op.lenVer - row * op.spriteSize;

    var spriteW = (hPiecesCountLeft >= op.spriteSize ? op.spriteSize : hPiecesCountLeft) * op.pieceSize;
    var spriteH = (vPiecesCountLeft >= op.spriteSize ? op.spriteSize : vPiecesCountLeft) * op.pieceSize;

    var spriteCanvas = new Canvas(spriteW, spriteH);
    var spriteCtx = spriteCanvas.getContext('2d');
    
    _.each(op.pieces, function(p, i) {
      var piece = new Piece(p);
      var x = ~~(i % op.lenHor);
      var y = ~~(i / op.lenHor);
      
      if(x >= op.spriteSize * col && x <= op.spriteSize * col + op.spriteSize &&
         y >= op.spriteSize * row && y <= op.spriteSize * row + op.spriteSize) {

        var pieceCanvas = new Canvas(op.pieceSize, op.pieceSize);
        var pieceCtx = pieceCanvas.getContext('2d');

        var sx = x * (op.pieceSize - step*2);
        var sy = y * (op.pieceSize - step*2);

        drawPiecePath(pieceCtx, step, piece);
        
        pieceCtx.clip();
        pieceCtx.drawImage(op.image, sx, sy, op.pieceSize, op.pieceSize,
          0, 0, op.pieceSize, op.pieceSize);

        var dx = (x - col * op.spriteSize) * op.pieceSize;
        var dy = (y - row * op.spriteSize) * op.pieceSize;

        spriteCtx.drawImage(pieceCanvas, 0, 0, op.pieceSize, op.pieceSize,
          dx, dy, op.pieceSize, op.pieceSize);
      }
    });

    fs.writeFile(path.join(op.dir, col + '_' + row + '_' + PIECES_SPRITE_FILENAME),
      spriteCanvas.toBuffer(), cb);

  }, cb);
  }, cb);
}

function cutCovers(op, cb) {
  var coversCanvas = new Canvas(op.pieceSize*4, op.pieceSize*4);
  var coversCtx = coversCanvas.getContext('2d');
  var step = Piece.calcStep(op.pieceSize);
    
  COVERS_MAP.forEach(function(cover) {
    var coverCanvas = new Canvas(op.pieceSize, op.pieceSize);
    var coverCtx = coverCanvas.getContext('2d');
    var dx = cover.x * op.pieceSize;
    var dy = cover.y * op.pieceSize;
    
    drawPiecePath(coverCtx, step, cover);
    coverCtx.fillStyle = op.color;
    coverCtx.fill();

    coversCtx.drawImage(coverCanvas, 0, 0, op.pieceSize, op.pieceSize,
      dx, dy, op.pieceSize, op.pieceSize);
  }); 

  fs.writeFile(op.filePath, coversCanvas.toBuffer(), cb);
}

function cutFrame(op, cb) {
  var step = Piece.calcStep(op.pieceSize);
  
  var fSize = step + 3;
  var fLength = step * 4;
  var fWidth = fSize + step;
  
  var frameCanvas = new Canvas(fLength+fWidth*2, fWidth*4);
  var frameCtx = frameCanvas.getContext('2d');
  
  var iTileCanvas = new Canvas(op.pieceSize, op.pieceSize);
  var iTileCtx = iTileCanvas.getContext('2d');
  drawPiecePath(iTileCtx, step, {l: 0, t: 0, r: 0, b: 0});
  iTileCtx.fillStyle = op.color;
  iTileCtx.fill();
  
  var oTileCanvas = new Canvas(op.pieceSize, op.pieceSize);
  var oTileCtx = oTileCanvas.getContext('2d');
  drawPiecePath(oTileCtx, step, {l: 1, t: 1, r: 1, b: 1});
  oTileCtx.fillStyle = op.color;
  oTileCtx.fill();
  
  frameCtx.drawImage(oTileCanvas, step, 0, fLength, fWidth,
    0, 0, fLength, fWidth);
  frameCtx.drawImage(oTileCanvas, step, op.pieceSize - fWidth, fLength, fWidth,
    0, fWidth, fLength, fWidth);
  frameCtx.drawImage(iTileCanvas, step, 0, fLength, fWidth,
    0, fWidth * 2, fLength, fWidth);
  frameCtx.drawImage(iTileCanvas, step, op.pieceSize - fWidth, fLength, fWidth,
    0, fWidth * 3, fLength, fWidth);
    
  frameCtx.drawImage(oTileCanvas, 0, step, fWidth, fLength,
    fLength, 0, fWidth, fLength);
  frameCtx.drawImage(oTileCanvas, op.pieceSize - fWidth, step, fWidth, fLength,
    fLength + fWidth, 0, fWidth, fLength);
  frameCtx.drawImage(iTileCanvas, 0, step, fWidth, fLength,
    fLength, fLength, fWidth, fLength);
  frameCtx.drawImage(iTileCanvas, op.pieceSize - fWidth, step, fWidth, fLength,
    fLength + fWidth, fLength, fWidth, fLength);

  fs.writeFile(op.filePath, frameCanvas.toBuffer(), cb);
}

exports.cutPuzzle = cutPuzzle;
exports.cutCovers = function(op, cb) {
  async.parallel([
    function(cb) {
      cutCovers({
        color: DEFAULT_COVER_COLOR
      , filePath: path.join(op.dir, DEFAULT_COVERS_FILENAME)
      , pieceSize: op.pieceSize
      }, cb);
    },
    function(cb) {
      cutCovers({
        color: SELECT_COVER_COLOR
      , filePath: path.join(op.dir, SELECT_COVERS_FILENAME)
      , pieceSize: op.pieceSize
      }, cb);
    },
    function(cb) {
      cutCovers({
        color: LOCK_COVER_COLOR
      , filePath: path.join(op.dir, LOCK_COVERS_FILENAME)
      , pieceSize: op.pieceSize
      }, cb);
    },
  ], cb);
};

exports.cutFrame = function(op, cb) {
  cutFrame({
    color: FRAME_COLOR
  , filePath: path.join(op.dir, FRAME_FILENAME)
  , pieceSize: op.pieceSize
  }, cb);
};