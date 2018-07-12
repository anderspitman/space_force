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

module.exports = {
  DEGREES_TO_RADIANS,
  Vector2,
  unitVectorForAngleDegrees,
};
