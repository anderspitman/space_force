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

const DEGREES_TO_RADIANS = Math.PI / 180;

const game = new Game();

const boundingArea = {
  position: {
    x: 0,
    y: 0,
  },
  width: 10,
  height: 10,
};

const planetBound = {
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
      planetBound
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

physics.add(playerShip)
  .setMass(10)
  .setPositioning('dynamic')

physics.add(planet1)
  .setMass(400)
  .setPositioning('static')

physics.add(planet2)
  .setMass(200)
  .setPositioning('static')

const bbox = physics.calculateBoundingArea(shipDescriptor);
const bboxPlanet  = physics.calculateBoundingArea(planetDescriptor);
console.log(bbox);
console.log(bboxPlanet);

planetBound.width = bboxPlanet.xMax - bboxPlanet.xMin;
planetBound.height = bboxPlanet.yMax - bboxPlanet.yMin;
planetBound.radius = bboxPlanet.radius;
planetBound.circlePosition = {
  x: bboxPlanet.xMax,
  y: bboxPlanet.yMin,
};
planetBound.position.x = planet1.position.x + bboxPlanet.xMin;
planetBound.position.y = planet1.position.y + bboxPlanet.yMax;
planetBound.rotationDegrees = planet1.rotationDegrees;
planetBound.anchor = {
  x: -bboxPlanet.xMin,
  y: bboxPlanet.yMax,
};

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

window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);

const LEFT_ANALOG_X_INDEX = 0;
const RIGHT_ANALOG_Y_INDEX = 3;

function step() {

  const rotationStep = 5.0;
  const thrustAcceleration = 0.1;

  let rotation = 0.0;
  let thrust = 0.0;

  const gp = gamepads[0];

  if (gp) {
    rotation = gp.axes[LEFT_ANALOG_X_INDEX] * rotationStep;
    thrust = -gp.axes[RIGHT_ANALOG_Y_INDEX] * thrustAcceleration;
  }

  playerShip.rotationDegrees += rotation;

  if (keys[KEY_LEFT]) {
    playerShip.rotationDegrees += rotationStep;
  }
  else if (keys[KEY_RIGHT]) {
    playerShip.rotationDegrees -= rotationStep;
  }

  playerShip.thrustersOn = keys[KEY_UP] || Math.abs(thrust) > 0.001;

  // movement
  const adjustedRotation =
    playerShip.rotationDegrees + playerShip.initialRotationDegrees;
  const rotationRadians = adjustedRotation * DEGREES_TO_RADIANS;
  const rotationX = Math.cos(rotationRadians);
  const rotationY = Math.sin(rotationRadians);

  if (playerShip.thrustersOn) {
    playerShip.velocity.x += rotationX * thrustAcceleration;
    playerShip.velocity.y += rotationY * thrustAcceleration;
  }

  if (Math.abs(thrust) > 0.001) {
    playerShip.velocity.x += rotationX * thrust;
    playerShip.velocity.y += rotationY * thrust;
  }

  playerShip.position.x += playerShip.velocity.x;
  playerShip.position.y += playerShip.velocity.y;

  boundingArea.width = bbox.xMax - bbox.xMin;
  boundingArea.height = bbox.yMax - bbox.yMin;
  boundingArea.radius = bbox.radius;
  boundingArea.circlePosition = {
    x: bbox.xMax,
    y: bbox.yMin,
  };
  boundingArea.position.x = playerShip.position.x + bbox.xMin;
  boundingArea.position.y = playerShip.position.y + bbox.yMax;
  boundingArea.rotationDegrees = playerShip.rotationDegrees;
  boundingArea.anchor = {
    x: -bbox.xMin,
    y: bbox.yMax,
  };

  const shipPos = new Vector2(playerShip.position);
  const planetPos = new Vector2(planet1.position);

  const distance = shipPos.disanceTo(planetPos);

  if (distance < bbox.radius + bboxPlanet.radius) {
    console.log("colliding");
    playerShip.position.x = 0;
    playerShip.position.y = 0;
    playerShip.velocity.x = 0;
    playerShip.velocity.y = 0;
  }


  camera.setCenterPosition(playerShip.position);
  //camera.setCenterPosition({ x: 0, y: 0 });

  physics.tick();

  ctx.render({ scene });
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
