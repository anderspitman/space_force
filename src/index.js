//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Vector2, unitVectorForAngleDegrees } from './common/math';
import { Context } from '../lib/vektar/src/index';
import { Game } from './game';
import {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor,
  bulletDescriptor,
} from './common/primitives';
import { PhysicsEngine } from './common/physics';
import { Camera } from './camera';

let firstRun = true;

class StateService {

  constructor(websocketPort) {

    const self = this;

    this.timeLastMessage = timeNowSeconds();

    this._ready = new Promise(function(resolve, reject) {
      const hostname = window.location.hostname;
      const websocketPort = 8081;
      const websocketString = "ws://" + hostname + ":" + websocketPort;

      self._ws = new WebSocket(websocketString);
      self._ws.onopen = function() {
        self._ws.onmessage = function(message) {
          
          self.state = JSON.parse(message.data);
          self._ws.onmessage = self._onMessage.bind(self);

          resolve(self.state);
        }
      };
    });
  }

  getState() {
    return this.state;
  }

  whenReady() {
    return this._ready;
  }

  keyDown(keyCode) {
    this._ws.send(JSON.stringify({
      type: 'key-down',
      keyCode: keyCode
    }));
  }

  keyUp(keyCode) {
    this._ws.send(JSON.stringify({
      type: 'key-up',
      keyCode: keyCode
    }));
  }

  _onMessage(message) {
    const timeNow = timeNowSeconds();
    const elapsed = timeNow - this.timeLastMessage;
    this.timeLastMessage = timeNow;

    //console.log(elapsed);

    this.onStateChanged(JSON.parse(message.data));
  }
}


const stateService = new StateService();

stateService.whenReady().then(function(state) {
  main(state);
});

function main(initialState) {

  let state = initialState;

  stateService.onStateChanged = function(newState) {
    state = newState;
  };

  const game = new Game();

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
    stateService.keyUp(e.keyCode);
  });
  document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;

    //if (e.keyCode == KEY_SPACE) {
    //  fireBullet();
    //}

    stateService.keyDown(e.keyCode);
  });

  function step() {

    let rotation = 0.0;
    let thrust = 0.0;

    //const gp = gamepads[0];
    //if (gp) {
    //  rotation = -gp.axes[LEFT_ANALOG_X_INDEX] * rotationStep;
    //  thrust = -gp.axes[RIGHT_ANALOG_Y_INDEX] * FULL_THRUST;
    //  if (gp.buttons[5].pressed) {
    //    fireBullet();
    //  }
    //}
    //playerShip.rotationDegrees += rotation;
    //playerShip.thrustersOn = keys[KEY_UP] || Math.abs(thrust) > 0.001;
    //if (Math.abs(thrust) > 0.001) {
    //  shipPhysics.accelerateForward(thrust);
    //}

    const playerShip = state[0].instances[0];
    camera.setCenterPosition(playerShip.position);

    ctx.render({ scene: state });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function timeNowSeconds() {
  const time = performance.now() / 1000;
  return time;
}
