//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Vector2, unitVectorForAngleDegrees } from '../common/math';
import { printObj, deepCopy } from '../common/utils';
import { Context } from '../../lib/vektar/src/index';
import { PojoFlowClient } from '../../lib/pojo_flow/src/client';
//import { Game } from './game';
import {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor,
  bulletDescriptor,
} from '../common/primitives';
import { PhysicsEngine } from '../common/physics';
import { Camera } from '../camera';
import { StateService } from './state_service';
import { timeNowSeconds } from '../common/utils';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_SPACE = 32;


fetch('config.json').then(function(response) {
  return response.json();
})
.then(function(config) {

  let firstRun = true;

  const host = config.host;
  //const host = '127.0.0.1';

  const stateService = new StateService({
    host,
  });

  const pjfClient = new PojoFlowClient({
    host,
  });

  const gameData = {};

  pjfClient.onUpdate(function(data) {
    gameData.playerIdMap = data.playerIdMap;
    gameData.state = data.state;
  });

  pjfClient.waitForFirstUpdate().then(function() {
    run(gameData, stateService);
  });
});

function run(gameData, stateService) {

  //const game = new Game();

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
  ctx.definePrimitive({ primitiveId: 'Bullet', descriptor: bulletDescriptor });

  ctx.setBackgroundColor('black');


  const camera = new Camera(ctx);

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
  });

  let timeLastStep = timeNowSeconds();

  function step() {

    const timeNow = timeNowSeconds();
    const elapsed = timeNow - timeLastStep;
    timeLastStep = timeNow;

    //console.log(elapsed);

    let rotation = 0.0;
    let thrust = 0.0;

    // TODO: optimize this so it's not sending updates when nothing has changed
    if (keys[KEY_LEFT]) {
      stateService.setRotation(1.0);
    }
    else if (keys[KEY_RIGHT]) {
      stateService.setRotation(-1.0);
    }
    else {
      stateService.setRotation(0.0);
    }

    if (keys[KEY_UP]) {
      stateService.setThrust(1.0);
    }
    else {
      stateService.setThrust(0.0);
    }

    if (keys[KEY_SPACE]) {
      stateService.setFiring(true);
    }
    else {
      stateService.setFiring(false);
    }

    const gp = gamepads[0];
    if (gp) {
      stateService.setRotation(-gp.axes[LEFT_ANALOG_X_INDEX]);
      stateService.setThrust(-gp.axes[RIGHT_ANALOG_Y_INDEX]);
      stateService.setFiring(gp.buttons[5].pressed);
    }

    const state = gameData.state;
    const playerIdMap = gameData.playerIdMap;
    const playerShip =
      state[0].instances[playerIdMap[stateService.getPlayerId()]];
    camera.setCenterPosition(playerShip.position);

    ctx.render({ scene: gameData.state });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
