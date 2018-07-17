const WebSocket = require('ws');
const math = require('../common/math');
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
    position: {
      x: Math.random() * 700,
      y: Math.random() * 700,
    },
    rotationDegrees: 0,
    rotation: 0,
    scale: 1.0,
    color: colors[nextPlayerId],
    initialRotationDegrees: 90,
    velocity: {
      x: 0,
      y: 0,
    },
    thrustersOn: false,
    visible: true,
    timeLastBullet: 0,
    bounds: shipBounds,
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
  };

  const planets = [
    planet1,
    planet2,
  ];

  const bullets = [
    {
      position: {
        x: 10,
        y: 10,
      },
      velocity: {
        x: 3,
        y: 0,
      },
      rotationDegrees: 0,
    }
  ];

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
  bullets[0].bounds = physics.calculateBoundingArea(bulletDescriptor);

  physics.add(bullets[0])
    .setHasGravity(false)

  const shipPhysics = physics.add(players[0])
    .setBounds(players[0].bounds)
    .setMass(10)
    .setPositioning('dynamic')

  const planet1Physics = physics.add(planet1)
    .setBounds(planet1.bounds)
    .setMass(400)
    .setPositioning('static')

  const planet2Physics = physics.add(planet2)
    .setBounds(planet2.bounds)
    .setMass(200)
    .setPositioning('static')

  const planetsPhysics = physics.createGroup();
  planetsPhysics.add(planet1Physics);
  planetsPhysics.add(planet2Physics);

  const bulletPhysics = physics.createGroup();
  
  physics.collide(players, planets, function(ship, planet) {
    //console.log("ship hit planet");
    ship.position.x = 800;
    ship.position.y = 800;
    ship.velocity.x = 0;
    ship.velocity.y = 0;
    ship.rotationDegrees = 0;
  });

  //physics.collide(bulletPhysics, planetsPhysics, function(ship, planet) {
  //  //console.log("bullet hit planet");
  //});
  
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
          fireBullet(i);
          player.timeLastBullet = timeNow;
        }
      }
    });

    // run physics every 10ms, but only send updates every 100
    physics.tick();

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state));
      }
    });

  // TODO: decouple simulation time from movement speed of objects
  }, 16.667);

  function fireBullet(playerId) {
    const bulletSpeed = 5;
    const angle =
      players[playerId].initialRotationDegrees +
      players[playerId].rotationDegrees;
    const unitVelocity = math.unitVectorForAngleDegrees(angle);
    const velocity = unitVelocity.scaledBy(bulletSpeed)
      .add(players[playerId].velocity);

    const newBullet = {
      position: {
        x: players[playerId].position.x,
        y: players[playerId].position.y,
      },
      velocity: {
        x: velocity.x,
        y: velocity.y,
      },
      rotationDegrees: angle,
    };

    const phys = physics.add(newBullet)
      .setMass(1)
      .setHasGravity(false)
      .setPositioning('dynamic')
      .setBounds(bullets[0].bounds)

    bullets.push(newBullet);
    bulletPhysics.add(phys);
  }
}

function timeNowSeconds() {
  const time = Date.now() / 1000;
  return time;
}
