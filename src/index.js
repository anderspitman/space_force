//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Vector2, unitVectorForAngleDegrees } from './math';
import { Context } from '../lib/vektar/src/index';
import { Game } from './game';
import {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor,
  bulletDescriptor,
} from './primitives';
import { PhysicsEngine } from './physics';
import { Camera } from './camera';

const team1Color = 'blue';
const team2Color = 'yellow';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_SPACE = 32;

const game = new Game();

const boundingArea = {
  position: {
    x: 0,
    y: 0,
  },
  width: 10,
  height: 10,
};

const playerShip = {
  position: {
    x: 700,
    y: 700,
  },
  rotationDegrees: 0,
  scale: 1.0,
  color: team1Color,
  initialRotationDegrees: 90,
  velocity: {
    x: 0,
    y: 0,
  },
  thrustersOn: false,
  visible: true,
};

const planet1 = {
  position: {
    x: 200,
    y: 200,
  },
  rotationDegrees: 0,
  scale: 1.0,
  showBuilding: true,
  hasRadar: false,
  color: team1Color,
};

const planet2 = {
  position: {
    x: 500,
    y: 500,
  },
  rotationDegrees: 0,
  scale: 1.0,
  showBuilding: true,
  hasRadar: true,
  color: team2Color,
};

const bullets = [
  {
    position: {
      x: 10,
      y: 10,
    },
    velocity: {
      x: 3,
      y: 0,
    },
    rotationDegrees: 0,
  }
];

const scene = [
  {
    primitiveId: 'Ship',
    instances: [
      playerShip 
    ]
  },
  {
    primitiveId: 'Planet',
    instances: [
      planet1,
      planet2,
    ],
  },
  {
    primitiveId: 'Bullet',
    instances: bullets,
  },
  //{
  //  primitiveId: 'BoundingArea',
  //  instances: [
  //    boundingArea,
  //  ]
  //},
];

const worldWidth = 10000;
const worldHeight = 10000;

const ctx = new Context({
  domElementId: 'root',
  canvasSize: {
    width: worldWidth,
    height: worldHeight,
  }
});

ctx.definePrimitive({ primitiveId: 'Ship', descriptor: shipDescriptor });
ctx.definePrimitive({
  primitiveId: 'RadarBuilding',
  descriptor: planetDescriptor
});
ctx.definePrimitive({ primitiveId: 'Planet', descriptor: planetDescriptor });
ctx.definePrimitive({
  primitiveId: 'BoundingArea',
  descriptor: boundingAreaDescriptor 
});
ctx.definePrimitive({ primitiveId: 'Bullet', descriptor: bulletDescriptor });

ctx.setBackgroundColor('black');


const camera = new Camera(ctx);

const physics = new PhysicsEngine();

const shipBounds = physics.calculateBoundingArea(shipDescriptor);
const planetBounds = physics.calculateBoundingArea(planetDescriptor);
const bulletBounds = physics.calculateBoundingArea(bulletDescriptor);

physics.add(bullets[0])
  .setHasGravity(false)

const shipPhysics = physics.add(playerShip)
  .setBounds(shipBounds)
  .setMass(10)
  .setPositioning('dynamic')
  //.setHasGravity(false)

const planet1Physics = physics.add(planet1)
  .setBounds(planetBounds)
  .setMass(400)
  .setPositioning('static')

const planet2Physics = physics.add(planet2)
  .setBounds(planetBounds)
  .setMass(200)
  .setPositioning('static')

const planetsPhysics = physics.createGroup();
planetsPhysics.add(planet1Physics);
planetsPhysics.add(planet2Physics);

const bulletPhysics = physics.createGroup();

var gamepads = {};

function gamepadHandler(event, connecting) {
  var gamepad = event.gamepad;
  // Note:
  // gamepad === navigator.getGamepads()[gamepad.index]

  if (connecting) {
    gamepads[gamepad.index] = gamepad;
  } else {
    delete gamepads[gamepad.index];
  }
}

window.addEventListener("gamepadconnected", function(e) {
  gamepadHandler(e, true);
}, false);
window.addEventListener("gamepaddisconnected", function(e) {
  gamepadHandler(e, false);
}, false);

const LEFT_ANALOG_X_INDEX = 0;
const RIGHT_ANALOG_Y_INDEX = 3;

// handle keyboard input
const keys = {};
document.addEventListener('keyup', function(e) {
  keys[e.keyCode] = false;
});
document.addEventListener('keydown', function(e) {
  keys[e.keyCode] = true;

  if (e.keyCode == KEY_SPACE) {
    fireBullet();
  }
});

physics.collide(shipPhysics, planetsPhysics, function(ship, planet) {
  //console.log("ship hit planet");
  ship.obj.position.x = 700;
  ship.obj.position.y = 700;
  ship.obj.velocity.x = 0;
  ship.obj.velocity.y = 0;
  ship.obj.rotationDegrees = 0;
});

physics.collide(bulletPhysics, planetsPhysics, function(ship, planet) {
  //console.log("bullet hit planet");
});

function fireBullet() {
  const bulletSpeed = 5;
  const angle =
    playerShip.initialRotationDegrees + playerShip.rotationDegrees;
  const unitVelocity = unitVectorForAngleDegrees(angle);
  const velocity = unitVelocity.scaledBy(bulletSpeed);

  const newBullet = {
    position: {
      x: playerShip.position.x,
      y: playerShip.position.y,
    },
    velocity: {
      x: velocity.x,
      y: velocity.y,
    },
    rotationDegrees: angle,
  };

  const phys = physics.add(newBullet)
    .setMass(1)
    .setHasGravity(false)
    .setPositioning('dynamic')
    .setBounds(bulletBounds)

  bullets.push(newBullet);
  bulletPhysics.add(phys);
}

function step() {

  const rotationStep = 5.0;
  const FULL_THRUST = 0.1;

  let rotation = 0.0;
  let thrust = 0.0;

  const gp = gamepads[0];

  if (gp) {
    rotation = -gp.axes[LEFT_ANALOG_X_INDEX] * rotationStep;
    thrust = -gp.axes[RIGHT_ANALOG_Y_INDEX] * FULL_THRUST;

    if (gp.buttons[5].pressed) {
      fireBullet();
    }
  }

  playerShip.rotationDegrees += rotation;

  if (keys[KEY_LEFT]) {
    playerShip.rotationDegrees += rotationStep;
  }
  else if (keys[KEY_RIGHT]) {
    playerShip.rotationDegrees -= rotationStep;
  }

  playerShip.thrustersOn = keys[KEY_UP] || Math.abs(thrust) > 0.001;

  if (playerShip.thrustersOn) {
    shipPhysics.accelerateForward(FULL_THRUST);
  }

  if (Math.abs(thrust) > 0.001) {
    shipPhysics.accelerateForward(thrust);
  }

  camera.setCenterPosition(playerShip.position);

  physics.tick();

  const shipPos = new Vector2(playerShip.position);
  const planetPos = new Vector2(planet1.position);
  const distance = shipPos.disanceTo(planetPos);

  boundingArea.width = shipBounds.xMax - shipBounds.xMin;
  boundingArea.height = shipBounds.yMax - shipBounds.yMin;
  boundingArea.radius = shipBounds.radius;
  boundingArea.circlePosition = {
    x: shipBounds.xMax,
    y: shipBounds.yMin,
  };
  boundingArea.position.x = playerShip.position.x + shipBounds.xMin;
  boundingArea.position.y = playerShip.position.y + shipBounds.yMax;
  boundingArea.rotationDegrees = playerShip.rotationDegrees;
  boundingArea.anchor = {
    x: -shipBounds.xMin,
    y: shipBounds.yMax,
  };

  ctx.render({ scene });
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
