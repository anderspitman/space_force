const WebSocket = require('ws');
const { Vector2, unitVectorForAngleDegrees } = require('../common/math');
const { PhysicsEngine } = require('../common/physics');
const {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor,
  bulletDescriptor,
} = require('../common/primitives');

const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_SPACE = 32;

const physics = new PhysicsEngine();
const shipBounds = physics.calculateBoundingArea(shipDescriptor);
const planetBounds = physics.calculateBoundingArea(planetDescriptor);
const bulletBounds = physics.calculateBoundingArea(bulletDescriptor);

const wss = new WebSocket.Server({
  port: 8081,
  //clientTracking: true,
});

let firstPlayer = true;

let nextPlayerId = 0;
const playerConnections = {};

const colors = [
  'blue',
  'orange',
  'yellow',
  'red',
  'green',
];

const players = [];

wss.on('connection', function connection(ws, req) {

  // add new player
  playerConnections[nextPlayerId] = ws;
  const initPlayerMessage = {
    type: 'playerId',
    playerId: nextPlayerId,
  };

  players.push({
    id: nextPlayerId,
    position: {
      x: Math.random() * 700,
      y: Math.random() * 700,
    },
    health: 100,
    rotationDegrees: 0,
    rotation: 0,
    scale: 1.0,
    color: colors[nextPlayerId],
    initialRotationDegrees: 90,
    thrustersOn: false,
    visible: true,
    timeLastBullet: 0,
    bounds: shipBounds,
    // physics
    velocity: {
      x: 0,
      y: 0,
    },
    positioning: 'dynamic',
    hasGravity: true,
    mass: 10,
  });

  nextPlayerId++;

  ws.on('message', function incoming(message) {

    const data = JSON.parse(message);

    switch (data.type) {
      case 'set-rotation':
        players[data.playerId].rotation = data.rotation;
        break;
      case 'set-thrusters-on':
        players[data.playerId].thrustersOn = data.thrustersOn;
        break;
      case 'set-firing':
        players[data.playerId].firing = data.firing;
        break;
      default:
        console.log("sending state update");
        ws.send(JSON.stringify(state));
        break;
    }
  });

  ws.on('close', function() {
    // TODO: delete from list
  });

  ws.send(JSON.stringify(initPlayerMessage));

  if (firstPlayer) {
    firstPlayer = false;
    init();
  }
});

function init() {

  const planet1 = {
    position: {
      x: 200,
      y: 200,
    },
    rotationDegrees: 0,
    scale: 1.0,
    showBuilding: true,
    hasRadar: false,
    color: colors[0],
    positioning: 'static',
    mass: 200,
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
    color: colors[2],
    positioning: 'static',
    mass: 400,
  };

  const planets = [
    planet1,
    planet2,
  ];

  const bullets = [];

  const state = [
    {
      primitiveId: 'Ship',
      instances: players,
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
  ];

  // TODO: remove this duplication
  planet1.bounds = planetBounds;
  planet2.bounds = planetBounds;

  physics.collide(players, planets, function(ship, planet) {
    //console.log("ship hit planet");
    //ship.position.x = 800;
    //ship.position.y = 800;
    //ship.velocity.x = 0;
    //ship.velocity.y = 0;
    //ship.rotationDegrees = 0;
  });

  physics.collide(bullets, planets, function(ship, planet) {
    //console.log("bullet hit planet");
  });

  physics.collide(bullets, players, function(bullet, player) {

    if (bullet.ownerId === player.id) {
      return;
    }

    player.health -= 10;

    if (player.health <= 0) {
      //const index = players.indexOf(player);
      //players.splice(index, 1);
      player.health = 100;
      player.position.x = 800;
      player.position.y = 800;
      player.velocity.x = 0;
      player.velocity.y = 0;
      player.rotationDegrees = 0;
    }

    //const bulletIndex = bullets.indexOf(bullet);
    //bullets.splice(bulletIndex, 1);
  });
  
  //const rotationStep = 5.0;
  const FULL_THRUST = 0.1;
  const bulletDelay = 0.1;

  let timeLastMessage = 0;

  setInterval(function() {

    const timeNow = timeNowSeconds();
    const elapsed = timeNow - timeLastMessage;
    timeLastMessage = timeNow;

    //console.log(elapsed);

        // TODO: handle per player
    players.forEach(function(player, i) {

      if (player.thrustersOn) {
        physics.accelerateForward({
          object: player,
          acceleration: FULL_THRUST
        });
      }

      if (player.firing) {
        const bulletElapsed = timeNow - player.timeLastBullet;
        if (bulletElapsed > bulletDelay) {
          fireBullet(player);
          player.timeLastBullet = timeNow;
        }
      }
    });

    // run physics every 10ms, but only send updates every 100
    physics.tick({ state });

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state));
      }
    });

  // TODO: decouple simulation time from movement speed of objects
  }, 16.667);

  function fireBullet(player) {
    const bulletSpeed = 5;
    const angle =
      player.initialRotationDegrees + player.rotationDegrees;
    const unitVelocity = unitVectorForAngleDegrees(angle);
    const velocity = unitVelocity.scaledBy(bulletSpeed)
      .add(player.velocity);

    const newBullet = {
      ownerId: player.id,
      // TODO: if you accidentally use a reference here it gets mutated by
      // the bullet code.
      position: {
        x: player.position.x,
        y: player.position.y,
      },
      velocity: {
        x: velocity.x,
        y: velocity.y,
      },
      rotationDegrees: angle,
      mass: 1,
      hasGravity: false,
      positioning: 'dynamic',
      bounds: bulletBounds,
    };

    bullets.push(newBullet);
  }
}

function timeNowSeconds() {
  const time = Date.now() / 1000;
  return time;
}
