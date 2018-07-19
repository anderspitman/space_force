const DEGREES_TO_RADIANS = Math.PI / 180;

class Vector2 {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.length = Math.sqrt(this.x*this.x + this.y*this.y);
  }

  add(other) {
    return new Vector2({
      x: this.x + other.x,
      y: this.y + other.y,
    });
  }

  subtract(other) {
    return new Vector2({
      x: this.x - other.x,
      y: this.y - other.y,
    });
  }

  disanceTo(other) {
    return other.subtract(this).getLength();
  }

  getLength() {
    return this.length;
  }

  normalized() {
    return new Vector2({
      x: this.x / this.getLength(),
      y: this.y / this.getLength(),
    });
  }

  scaledBy(factor) {
    return new Vector2({
      x: this.x * factor,
      y: this.y * factor,
    });
  }
}

function unitVectorForAngleDegrees(angle) {
  const rotationRadians = angle * DEGREES_TO_RADIANS;
  const rotationX = Math.cos(rotationRadians);
  const rotationY = Math.sin(rotationRadians);
  return new Vector2({ x: rotationX, y: rotationY });
}

function mean(array) {
  let sum = 0;
  for (let val of array) {
    sum += val;
  }
  return sum / array.length;
}

function basicStats(array) {
  let sum = 0;
  let min = Number.MAX_SAFE_INTEGER;
  let max = Number.MIN_SAFE_INTEGER;

  for (let val of array) {
    sum += val;

    if (val < min) {
      min = val;
    }
    if (val > max) {
      max = val;
    }
  }

  const mean = sum / array.length;

  return {
    min,
    max,
    mean,
  };
}

module.exports = {
  DEGREES_TO_RADIANS,
  Vector2,
  unitVectorForAngleDegrees,
  mean,
  basicStats,
};
