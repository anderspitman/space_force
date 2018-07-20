const { Vector2, unitVectorForAngleDegrees } = require('../common/math');

function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let timeNowSeconds;

if (isBrowser()) {
  timeNowSeconds = function() {
    const time = performance.now() / 1000;
    return time;
  }
}
else {
  timeNowSeconds = function timeNowSeconds() {
    const time = Date.now() / 1000;
    return time;
  }
}

function isBrowser() {
  return !isNode();
}

function isNode() {
  return typeof exports === 'object' && typeof exports.nodeName !== 'string';
}

function fireBullet(player, bullets, bulletBounds) {
  const bulletBaseSpeed = 600;
  const angle =
    player.initialRotationDegrees + player.rotationDegrees;
  const unitVelocity = unitVectorForAngleDegrees(angle);
  const velocity = unitVelocity.scaledBy(bulletBaseSpeed)
    .add(player.velocity);

  const newBullet = {
    ownerId: player.id,
    // TODO: if you accidentally use a reference here it gets mutated by
    // the bullet code.
    position: {
      x: player.position.x,
      y: player.position.y,
    },
    velocity: {
      x: velocity.x,
      y: velocity.y,
    },
    rotationDegrees: angle,
    mass: 1,
    hasGravity: false,
    positioning: 'dynamic',
    bounds: bulletBounds,
    spawnTime: timeNowSeconds(),
  };

  bullets.push(newBullet);
}


module.exports = {
  printObj,
  deepCopy,
  timeNowSeconds,
  fireBullet,
};
