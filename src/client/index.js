//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { printObj, timeNowSeconds, fireBullet } from '../common/utils';
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
import { TimingStats } from '../common/timing_stats';

// TODO: store these in a common location or get from server at runtime
const SIM_STEP_TIME_MS = 10;
const FULL_THRUST_ACCELERATION = 300.0;
const bulletDelay = 0.1;

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

  const stateService = new StateService({
    host,
  });

  const pjfClient = new PojoFlowClient({
    host,
  });

  const gameData = {};

  const messageTimeStats = new TimingStats({
    numSamples: 100,
  });

  pjfClient.onUpdate(function(data) {
    messageTimeStats.addAutoPrint();
    gameData.playerIdMap = data.playerIdMap;
    gameData.state = data.state;
  });

  pjfClient.waitForFirstUpdate().then(function() {
    run(gameData, stateService);
  });
});

function run(gameData, stateService) {

  //const game = new Game();

  const physics = new PhysicsEngine({
    //sim_period_ms: SIM_STEP_TIME_MS,
    sim_period_ms: 16.66667,
  });

  const bulletBounds = physics.calculateBoundingArea(bulletDescriptor);
  const frameTimeStats = new TimingStats({
    numSamples: 100,
  });

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

  function step() {

    //frameTimeStats.addAutoPrint();
    const timeNow = timeNowSeconds();

    const state = gameData.state;
    const playerIdMap = gameData.playerIdMap;
    const playerId = playerIdMap[stateService.getPlayerId()];
    const players = state[0].instances;
    const player = players[playerId];
    const bullets = state[2].instances;

    let rotation = 0.0;
    let thrust = 0.0;

    // TODO: optimize this so it's not sending updates when nothing has changed
    if (keys[KEY_LEFT]) {
      stateService.setRotation(1.0);
      player.rotation = 1.0;
    }
    else if (keys[KEY_RIGHT]) {
      stateService.setRotation(-1.0);
      player.rotation = -1.0;
    }
    else {
      stateService.setRotation(0.0);
      player.rotation = 0.0;
    }

    if (keys[KEY_UP]) {
      stateService.setThrust(1.0);
      player.thrust = 1.0;

    }
    else {
      stateService.setThrust(0.0);
      player.thrust = 0.0;
    }

    if (keys[KEY_SPACE]) {
      stateService.setFiring(true);
      player.firing = true;
    }
    else {
      stateService.setFiring(false);
      player.firing = false;
    }

    const gp = gamepads[0];
    if (gp) {
      stateService.setRotation(-gp.axes[LEFT_ANALOG_X_INDEX]);
      player.rotation = -gp.axes[LEFT_ANALOG_X_INDEX];
      stateService.setThrust(-gp.axes[RIGHT_ANALOG_Y_INDEX]);
      player.thrust = -gp.axes[RIGHT_ANALOG_Y_INDEX];
      stateService.setFiring(gp.buttons[5].pressed);
      player.firing = gp.buttons[5].pressed;
    }

    player.thrustersOn = player.thrust > 0;
    if (player.thrustersOn) {
      physics.accelerateForward({
        object: player,
        acceleration: player.thrust * FULL_THRUST_ACCELERATION
      });
    }

    // TODO: implement client-side bullet prediction
    if (player.firing) {
      const bulletElapsed = timeNow - player.timeLastBullet;
      if (bulletElapsed > bulletDelay) {
        fireBullet(player, bullets, bulletBounds);
        player.timeLastBullet = timeNow;
      }
    }

    physics.tick({ state });

    camera.setCenterPosition(player.position);

    ctx.render({ scene: state });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
