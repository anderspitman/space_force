const { timeNowSeconds } = require('../common/utils');

const WEBSOCKET_STATE_OPEN = 1;

class StateService {

  constructor(options = {}) {

    let host;
    if (options.host !== undefined) {
      host = options.host;
    }
    else {
      host = window.location.hostname;
    }

    this.timeLastMessage = timeNowSeconds();

    const self = this;

    this._ready = new Promise(function(resolve, reject) {
      const websocketPort = 8081;
      const websocketString = "ws://" + host + ":" + websocketPort;

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

    if (rotation !== this._prevRotation) {
      this._send({
        type: 'set-rotation',
        rotation
      });
    }

    this._prevRotation = rotation;
  }

  setThrust(thrust) {

    if (thrust !== this._prevThrust) {
      this._send({
        type: 'set-thrust',
        thrust, 
      });
    }

    this._prevThrust = thrust;
  }

  setFiring(firing) {

    if (firing !== this._prevFiring) {
      this._send({
        type: 'set-firing',
        firing, 
      });
    }

    this._prevFiring = firing;
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

module.exports = {
  StateService,
};
