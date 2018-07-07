//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Context } from '../lib/vektar/src/index';
import { Game } from './game';
import { ship, radarBuilding, planet } from './primitives';

const team1Color = 'blue';
const team2Color = 'yellow';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;

const DEGREES_TO_RADIANS = Math.PI / 180;

class Camera {
  constructor(vektarContext) {
    this.ctx = vektarContext;
  }

  setCenterPosition({ x, y }) {
    const centerX = x - this.ctx.getWidth() / 2;
    const centerY = y - this.ctx.getHeight() / 2;

    this.ctx.setViewportPosition({ x: centerX, y: centerY });
  }
}

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
  }
};

const scene = [
  {
    primitiveId: 'ship',
    instances: [
      playerShip 
    ]
  },
  {
    primitiveId: 'planet',
    instances: [
      {
        x: 1000,
        y: 1000,
        rotationDegrees: 0,
        scale: 1.0,
        showBuilding: true,
        hasRadar: false,
        color: team1Color,
      },
      {
        x: 1300,
        y: 1300,
        rotationDegrees: 0,
        scale: 1.0,
        showBuilding: true,
        hasRadar: true,
        color: team2Color,
      },
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
ctx.registerPrimitive(radarBuilding);
ctx.registerPrimitive(planet);

ctx.setBackgroundColor('black');

//let cameraX = worldWidth / 2;
//let cameraY = worldHeight / 2;

//ctx.render({ scene });

// handle keyboard input
const keys = {};
document.addEventListener('keyup', function(e) {
  keys[e.keyCode] = false;
});
document.addEventListener('keydown', function(e) {
  keys[e.keyCode] = true;
});

const camera = new Camera(ctx);

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

  ctx.render({ scene });
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
