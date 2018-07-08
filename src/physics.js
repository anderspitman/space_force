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
