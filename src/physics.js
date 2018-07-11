import { Vector2 } from './math';

const DEGREES_TO_RADIANS = Math.PI / 180;

class PhysicsObject {
  static create(obj) {
    const physicsObj = new PhysicsObject({ id: PhysicsObject.nextId, obj });
    PhysicsObject.nextId++;
    return physicsObj;
  }

  constructor({ id, obj }) {
    this.id = id;
    this.obj = obj;
  }

  getId() {
    return this.id;
  }

  setBounds(value) {
    this.bounds = value;
    return this;
  }

  setMass(value) {
    this.mass = value;
    return this;
  }

  setPositioning(value) {
    this.positioning = value;
    return this;
  }

  accelerateForward(acceleration) {
    const adjustedRotation =
      this.obj.rotationDegrees + this.obj.initialRotationDegrees;
    const rotationRadians = adjustedRotation * DEGREES_TO_RADIANS;
    const rotationX = Math.cos(rotationRadians);
    const rotationY = Math.sin(rotationRadians);
    this.obj.velocity.x += rotationX * acceleration;
    this.obj.velocity.y += rotationY * acceleration;
  }
}
PhysicsObject.nextId = 0;

class PhysicsGroup {

  constructor() {
    this.objs = [];
  }

  add(obj) {
    this.objs.push(obj);
  }

  getMembers() {
    return this.objs;
  }
}

export class PhysicsEngine {

  constructor() {
    this.timeLastTick = timeNowSeconds();
    this.objs = [];
    this.collisionSets = [];
  }

  add(obj) {
    const physicsObj = PhysicsObject.create(obj);
    this.objs.push(physicsObj);
    return physicsObj;
  }

  createGroup() {
    return new PhysicsGroup();
  }

  collide(a, b, callback) {
    if (!(a instanceof PhysicsObject || a instanceof PhysicsGroup) ||
        !(b instanceof PhysicsObject || b instanceof PhysicsGroup)) {
      throw "Invalid type";
    }

    let setA = [a];
    if (a instanceof PhysicsGroup) {
      setA = a.getMembers();
    }

    let setB = [b];
    if (b instanceof PhysicsGroup) {
      setB = b.getMembers();
    }

    this.collisionSets.push({
      callback,
      a: setA,
      b: setB,
    });
  }

  tick() {
    const timeStartTick = timeNowSeconds();
    const timeElapsed = timeStartTick - this.timeLastTick;
    this.timeLastTick = timeStartTick;

    let gravityAcceleration = new Vector2({ x: 0, y: 0 });


    for (let physicsObj of this.objs) {
      
      const obj = physicsObj.obj;

      if (physicsObj.positioning === 'dynamic') {

        // TODO: this should maybe go after the gravity is applied
        obj.position.x += obj.velocity.x;
        obj.position.y += obj.velocity.y;

        // apply gravity
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

    this.checkCollisionSets();

    //const tickDuration = timeNowSeconds() - timeStartTick;
    //console.log(tickDuration);
    //console.log(timeElapsed);
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
        const aPos = new Vector2(a.obj.position);
        const bPos = new Vector2(b.obj.position);
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
  const multiplier = 0.01;
  let force = (mass1 * mass2) / (radius * radius); 
  
  // TODO: should be able to remove this once the ship isn't able to
  // reach the center of the planets. It was flying off
  if (force > 0.1) {
    force = 0.1;
  }
  return force;
}

function timeNowSeconds() {
  const time = performance.now() / 1000;
  return time;
}
