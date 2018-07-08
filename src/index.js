//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Context } from '../lib/vektar/src/index';
import { Game } from './game';
import { shipPrimitive, ship, radarBuilding, planet } from './primitives';
import { PhysicsEngine } from './physics';
import { Camera } from './camera';

const team1Color = 'blue';
const team2Color = 'yellow';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;

const DEGREES_TO_RADIANS = Math.PI / 180;

const game = new Game();

const playerShip = {
  x: 1200,
  y: 1200,
  rotationDegrees: 0,
  scale: 1.0,
  color: team1Color,
  initialRotationDegrees: -90,
  velocity: {
    x: 0,
    y: 0,
  },
  thrustersOn: false,
};

const player2Ship = {
  x: 1100,
  y: 1100,
  rotationDegrees: 0,
  scale: 1.0,
  color: team1Color,
  initialRotationDegrees: -90,
  velocity: {
    x: 0,
    y: 0,
  },
  thrustersOn: false,
};

const planet1 = {
  x: 1000,
  y: 1000,
  rotationDegrees: 0,
  scale: 1.0,
  showBuilding: true,
  hasRadar: false,
  color: team1Color,
};

const planet2 = {
  x: 1300,
  y: 1300,
  rotationDegrees: 0,
  scale: 1.0,
  showBuilding: true,
  hasRadar: true,
  color: team2Color,
};

const scene = [
  //{
  //  primitiveId: 'Ship',
  //  instances: [
  //    player2Ship
  //  ]
  //},
  {
    //primitiveId: ship.primitiveId,
    primitiveId: 'Ship',
    instances: [
      playerShip 
    ]
  },
  {
    primitiveId: planet.primitiveId,
    instances: [
      planet1,
      planet2,
    ],
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

ctx.registerPrimitive(ship);
ctx.definePrimitive({ primitiveId: 'Ship', descriptor: shipPrimitive });
ctx.registerPrimitive(radarBuilding);
ctx.registerPrimitive(planet);
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
  .setMass(100)
  .setPositioning('static')

physics.add(planet2)
  .setMass(200)
  .setPositioning('static')

console.log(physics.objs);

function step() {
  //ctx.setViewportPosition({ x: cameraX, y: cameraY });
  //cameraX += 1;
  //cameraY += 1;
  //
  const rotationStep = 5.0;
  const thrustAcceleration = 0.1;

  if (keys[KEY_LEFT]) {
    playerShip.rotationDegrees -= rotationStep;
  }
  else if (keys[KEY_RIGHT]) {
    playerShip.rotationDegrees += rotationStep;
  }
  playerShip.thrustersOn = keys[KEY_UP];

  // movement
  const adjustedRotation =
    playerShip.rotationDegrees + playerShip.initialRotationDegrees;
  const rotationRadians = adjustedRotation * DEGREES_TO_RADIANS;
  const rotationX = Math.cos(rotationRadians);
  const rotationY = Math.sin(rotationRadians);
  //console.log(rotationRadians);
  //console.log(x, y);

  if (playerShip.thrustersOn) {
    playerShip.velocity.x += rotationX * thrustAcceleration;
    playerShip.velocity.y += rotationY * thrustAcceleration;
  }

  playerShip.x += playerShip.velocity.x;
  playerShip.y += playerShip.velocity.y;

  camera.setCenterPosition({ x: playerShip.x, y: playerShip.y });

  physics.tick();

  ctx.render({ scene });
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
