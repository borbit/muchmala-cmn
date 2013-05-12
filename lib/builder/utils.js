module.exports = {
  calcStep: function(pieceSize) {
    return ~~(pieceSize / 6);
  },
  calcTileSize: function(pieceSize) {
    return ~~(pieceSize / 6) * 4;
  },
  calcLength: function(sideSize, tileSize) {
    return ~~((sideSize - tileSize / 2) / tileSize);
  }
};