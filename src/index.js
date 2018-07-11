//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Vector2 } from './math';
import { Context } from '../lib/vektar/src/index';
import { Game } from './game';
import {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor
} from './primitives';
import { PhysicsEngine } from './physics';
import { Camera } from './camera';

const team1Color = 'blue';
const team2Color = 'yellow';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;

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
    x: 0,
    y: 0,
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
    primitiveId: 'BoundingArea',
    instances: [
      boundingArea,
    ]
  },
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

ctx.setBackgroundColor('black');

// handle keyboard input
const keys = {};
document.addEventListener('keyup', function(e) {
  keys[e.keyCode] = false;
});
document.addEventListener('keydown', function(e) {
  keys[e.keyCode] = true;
});

const camera = new Camera(ctx);

const physics = new PhysicsEngine();

const shipBounds = physics.calculateBoundingArea(shipDescriptor);
const planetBounds = physics.calculateBoundingArea(planetDescriptor);

const shipPhysics = physics.add(playerShip)
  .setBounds(shipBounds)
  .setMass(10)
  .setPositioning('dynamic')

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

physics.collide(shipPhysics, planetsPhysics, function(ship, planet) {
});

function step() {

  const rotationStep = 5.0;
  const FULL_THRUST = 0.1;

  let rotation = 0.0;
  let thrust = 0.0;

  const gp = gamepads[0];

  if (gp) {
    rotation = gp.axes[LEFT_ANALOG_X_INDEX] * rotationStep;
    thrust = -gp.axes[RIGHT_ANALOG_Y_INDEX] * FULL_THRUST;
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
