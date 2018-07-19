//import { Context } from 'vektar';
// TODO: Currently expecting vektar to be available locally to speed
// development
import { Vector2, unitVectorForAngleDegrees } from '../common/math';
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

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_SPACE = 32;

const WEBSOCKET_STATE_OPEN = 1;

let firstRun = true;

class StateService {

  constructor() {

    this.timeLastMessage = timeNowSeconds();

    const self = this;

    this._ready = new Promise(function(resolve, reject) {
      const hostname = window.location.hostname;
      const websocketPort = 8081;
      const websocketString = "ws://" + hostname + ":" + websocketPort;

      self._ws = new WebSocket(websocketString);
      self._ws.onopen = function() {

        self._ws.onmessage = function(message) {
          
          const payload = JSON.parse(message.data);

          if (self._playerId !== undefined) {
            console.log("Player ID: " + self._playerId);
            self.state = payload;
            self._ws.onmessage = self._onMessage.bind(self);

            resolve(self.state);
          }
          else {
            if (payload.type === 'playerId') {
              self._playerId = payload.playerId;
            }
          }
        }
      };
    });
  }

  getPlayerId() {
    return this._playerId;
  }

  getState() {
    return this.state;
  }

  whenReady() {
    return this._ready;
  }

  setRotation(rotation) {
    this._send({
      type: 'set-rotation',
      rotation
    });
  }

  setThrust(thrust) {
    this._send({
      type: 'set-thrust',
      thrust, 
    });
  }

  setFiring(firing) {
    this._send({
      type: 'set-firing',
      firing, 
    });
  }

  _send(message) {

    if (this._ws.readyState === WEBSOCKET_STATE_OPEN) {
      message.playerId = this._playerId;
      //console.log(message);
      this._ws.send(JSON.stringify(message));
    }
  }

  _onMessage(message) {
    const timeNow = timeNowSeconds();
    const elapsed = timeNow - this.timeLastMessage;
    this.timeLastMessage = timeNow;

    //console.log(elapsed);

    //this.onStateChanged(JSON.parse(message.data));
  }
}


const stateService = new StateService();

const pjfClient = new PojoFlowClient();

let state;

pjfClient.onUpdate(function(data) {
  state = data;
  //console.log(state);
});

pjfClient.waitForFirstUpdate().then(function() {
  main();
});

function main() {

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

    const playerShip = state[0].instances[stateService.getPlayerId()];
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
