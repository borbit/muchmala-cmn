var EAR_T_VAL = 1  // 0001
  , EAR_L_VAL = 2  // 0010
  , EAR_B_VAL = 4  // 0100
  , EAR_R_VAL = 8; // 1000

var EAR_T_MASK = 1  // 0001
  , EAR_L_MASK = 2  // 0010
  , EAR_B_MASK = 4  // 0100
  , EAR_R_MASK = 8; // 1000

var SHAPE_MASK = 15; // 1111

function Piece(value) {
  this.value = value || 0;
}

Object.defineProperty(Piece.prototype, 't', {
  set: function(value) {
    if (value)
      this.value = this.value | EAR_T_VAL;
    else
      this.value = this.value & ~(1 << 0);
  },
  get: function() {
    return (this.value & EAR_T_MASK) == EAR_T_VAL;
  }
});

Object.defineProperty(Piece.prototype, 'l', {
  set: function(value) {
    if (value)
      this.value = this.value | EAR_L_VAL;
    else
      this.value = this.value & ~(1 << 1);
  },
  get: function() {
    return (this.value & EAR_L_MASK) == EAR_L_VAL;
  }
});

Object.defineProperty(Piece.prototype, 'b', {
  set: function(value) {
    if (value)
      this.value = this.value | EAR_B_VAL;
    else
      this.value = this.value & ~(1 << 2);
  },
  get: function() {
    return (this.value & EAR_B_MASK) == EAR_B_VAL;
  }
});

Object.defineProperty(Piece.prototype, 'r', {
  set: function(value) {
    if (value)
      this.value = this.value | EAR_R_VAL;
    else
      this.value = this.value & ~(1 << 3);
  },
  get: function() {
    return (this.value & EAR_R_MASK) == EAR_R_VAL;
  }
});

// origin
Object.defineProperty(Piece.prototype, 'o', {
  set: function(value) {
    this.value = this.value | value << 4;
  },
  get: function() {
    return Piece.getOrigin(this.value);
  }
});

// shape
Object.defineProperty(Piece.prototype, 's', {
  get: function() {
    return this.value & SHAPE_MASK;
  }
});

Piece.getOrigin = function(val) {
  return val >> 4;
};

Piece.calcStep = function(pieceSize) {
  return ~~(pieceSize / 6);
};

Piece.calcTileSize = function(pieceSize) {
  return ~~(pieceSize / 6) * 4;
};

Piece.calcLength = function(sideSize, tileSize) {
  return ~~((sideSize - tileSize / 2) / tileSize);
};

module.exports = Piece;