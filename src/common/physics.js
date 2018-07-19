const { Vector2, unitVectorForAngleDegrees } = require('./math');

const rotationStepDegPerSec = 360.0;

class PhysicsEngine {

  constructor({ sim_period_ms }) {
    this.collisionSets = [];
    this._sim_period_secs = sim_period_ms / 1000.0;
  }

  accelerateForward({ object, acceleration }) {

    const obj = object;

    if (obj.velocity === undefined || obj.rotationDegrees === undefined ||
        obj.initialRotationDegrees === undefined) {
      throw "object doesn't have necessary attributes for acceleration";
    }

    const adjustedRotation =
      obj.rotationDegrees + obj.initialRotationDegrees;
    const unitVelocity = unitVectorForAngleDegrees(adjustedRotation);
    obj.velocity.x += unitVelocity.x * acceleration * this._sim_period_secs;
    obj.velocity.y += unitVelocity.y * acceleration * this._sim_period_secs;
  }

  collide(a, b, callback) {
    let setA = [a];
    if (Array.isArray(a)) {
      setA = a;
    }

    let setB = [b];
    if (Array.isArray(b)) {
      setB = b;
    }

    this.collisionSets.push({
      callback,
      a: setA,
      b: setB,
    });
  }

  tick({ state }) {

    // TODO: This transformation feels like a hack. Maybe figure out a better
    // way to express the relationships between object types that makes sense
    // for rendering and physics. Maybe a single flat array like this is best
    // for both.
    let objects = [];
    for (let objectType of state) {
      objects = objects.concat(objectType.instances);
    }

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];

      if (obj.positioning === 'dynamic') {
        // TODO: this should maybe go after the gravity is applied
        obj.position.x += obj.velocity.x * this._sim_period_secs;
        obj.position.y += obj.velocity.y * this._sim_period_secs;
        //obj.position.x += obj.velocity.x;
        //obj.position.y += obj.velocity.y;

        if (obj.hasGravity) {

          let gravityAcceleration = new Vector2({ x: 0, y: 0 });

          for (let other of objects) {
            if (other.positioning === 'static') {
              const thisPos = new Vector2(obj.position);
              const otherPos = new Vector2(other.position);
              const diff = otherPos.subtract(thisPos);
              const accelDir = diff.normalized();

              const accelForce = gravityForce({
                mass1: obj.mass,
                mass2: other.mass,
                radius: diff.getLength()
              });

              if (obj.id === 0 && other.id === 1000) {
                console.log(accelForce);
              }

              const accel = accelDir.scaledBy(accelForce);
              gravityAcceleration = gravityAcceleration.add(accel);
            }
          }

          obj.velocity.x += gravityAcceleration.x * this._sim_period_secs;
          obj.velocity.y += gravityAcceleration.y * this._sim_period_secs;
        }
      }

      if (obj.rotationDegrees !== undefined && obj.rotation !== undefined) {
        obj.rotationDegrees +=
          obj.rotation * rotationStepDegPerSec * this._sim_period_secs;
      }
    }

    this.checkCollisionSets();
  }

  calculateBoundingArea(descriptor) {
    const bbox =
      new BoundingBoxCalculator().calculateBoundingArea(descriptor);

    return bbox;
  }

  checkCollisionSets() {
    for (let set of this.collisionSets) {
      this.checkCollisionSet(set);
    }
  }

  checkCollisionSet(set) {
    for (let a of set.a) {
      for (let b of set.b) {
        const aPos = new Vector2(a.position);
        const bPos = new Vector2(b.position);
        const distance = aPos.disanceTo(bPos);
        const collisionDistance = a.bounds.radius + b.bounds.radius;

        if (distance < collisionDistance) {
          set.callback(a, b);
        }
      }
    }
  }

  checkGravity() {
  }
}

class BoundingBoxCalculator {

  constructor() {
    this.xMin = 0;
    this.xMax = 0;
    this.yMin = 0;
    this.yMax = 0;
  }

  calculateBoundingArea(descriptor) {
    this.updateBoundingBox(descriptor);
    const radius = Math.max(
      Math.abs(this.xMin), Math.abs(this.xMax), Math.abs(this.yMin),
      Math.abs(this.yMax));

    return {
      xMin: this.xMin,
      xMax: this.xMax,
      yMin: this.yMin,
      yMax: this.yMax,
      radius 
    };
  }

  updateBoundingBox(descriptor) {

    let xTrans = 0;
    let yTrans = 0;
    if (descriptor.position !== undefined &&
        typeof descriptor.position !== 'string') {
      xTrans = descriptor.position.x;
      yTrans = descriptor.position.y;
    }

    switch (descriptor.type) {
      case 'Group':

        for (let childDescriptor of descriptor.children) {
          const child = this.updateBoundingBox(childDescriptor);
        }

        break;
      case 'Triangle':

        for (let key in descriptor.vertices) {
          const vertex = descriptor.vertices[key];
          const x = vertex.x + xTrans;
          const y = vertex.y + yTrans;

          if (x < this.xMin) {
            this.xMin = x;
          }
          if (x > this.xMax) {
            this.xMax = x;
          }
          if (y < this.yMin) {
            this.yMin = y;
          }
          if (y > this.yMax) {
            this.yMax = y;
          }
        }

        break;
      case 'Circle':

        const centerX = xTrans;
        const centerY = yTrans;
        const radius = descriptor.radius;
        const leftPoint = centerX - radius;
        const rightPoint = centerX + radius;
        const topPoint = centerY + radius;
        const bottomPoint = centerY - radius;

        if (leftPoint < this.xMin) {
          this.xMin = leftPoint;
        }
        if (rightPoint > this.xMax) {
          this.xMax = rightPoint;
        }
        if (bottomPoint < this.yMin) {
          this.yMin = bottomPoint;
        }
        if (topPoint > this.yMax) {
          this.yMax = topPoint;
        }

        break;
      case 'Rectangle':
        break;
      default:
        throw "Invalid type " + type;
        break;
    }
  }
}

function gravityForce({ mass1, mass2, radius }) {
  let force = (mass1 * mass2) / (radius * radius); 
  
  // TODO: should be able to remove this once the ship isn't able to
  // reach the center of the planets. It was flying off
  //if (force > 0.1) {
  //  force = 0.1;
  //}
  return force;
}

module.exports = {
  PhysicsEngine
};
