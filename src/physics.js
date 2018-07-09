import { Vector2 } from './math';

class PhysicsObject {
  constructor(obj) {
    this.obj = obj;
  }

  setMass(value) {
    this.mass = value;
    return this;
  }

  setPositioning(value) {
    this.positioning = value;
    return this;
  }
}

export class PhysicsEngine {

  constructor() {
    this.timeLastTick = timeNowSeconds();
    this.objs = [];
  }

  add(obj) {
    const physicsObj = new PhysicsObject(obj);
    this.objs.push(physicsObj);
    return physicsObj;
  }

  tick() {
    const timeStartTick = timeNowSeconds();
    const timeElapsed = timeStartTick - this.timeLastTick;
    this.timeLastTick = timeStartTick;

    let gravityAcceleration = new Vector2({ x: 0, y: 0 });


    for (let physicsObj of this.objs) {
      
      const obj = physicsObj.obj;

      if (physicsObj.positioning === 'dynamic') {
        for (let other of this.objs) {
          if (other.positioning === 'static') {
            const thisPos = new Vector2(obj.position);
            const otherPos = new Vector2(other.obj.position);
            const diff = otherPos.subtract(thisPos);
            const accelDir = diff.normalized();

            const accelForce = gravityForce({
              mass1: physicsObj.mass,
              mass2: other.mass,
              radius: diff.getLength()
            });

            const accel = accelDir.scaledBy(accelForce);
            gravityAcceleration = gravityAcceleration.add(accel);
          }
        }

        obj.velocity.x += gravityAcceleration.x;
        obj.velocity.y += gravityAcceleration.y;
      }

    }

    //const tickDuration = timeNowSeconds() - timeStartTick;
    //console.log(tickDuration);
    //console.log(timeElapsed);
  }

  calculateBoundingBox(descriptor) {
    const bbox =
      new BoundingBoxCalculator().calculateBoundingBox(descriptor);

    return bbox;
  }
}

class BoundingBoxCalculator {

  constructor() {
    this.xMin = 0;
    this.xMax = 0;
    this.yMin = 0;
    this.yMax = 0;
  }

  calculateBoundingBox(descriptor) {
    this.updateBoundingBox(descriptor);
    return {
      xMin: this.xMin,
      xMax: this.xMax,
      yMin: this.yMin,
      yMax: this.yMax,
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
  const multiplier = 0.01;
  let force = (mass1 * mass2) / (radius * radius); 
  if (force > 0.1) {
    force = 0.1;
  }
  return force;
}

function timeNowSeconds() {
  const time = performance.now() / 1000;
  return time;
}
