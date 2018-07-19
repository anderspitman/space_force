const WebSocket = require('ws');
const { Vector2, unitVectorForAngleDegrees } = require('../common/math');
const { PhysicsEngine } = require('../common/physics');
const {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor,
  bulletDescriptor,
} = require('../common/primitives');
const { PojoFlowServer } = require('../../lib/pojo_flow/src/server');
const { printObj, timeNowSeconds } = require('../common/utils');
const { TimingStats } = require('../common/timing_stats');

const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_SPACE = 32;

const SIM_PERIOD_MS = 16.66667;
//const SIM_PERIOD_MS = 50;

const physics = new PhysicsEngine({
  sim_period_ms: SIM_PERIOD_MS,
});
const shipBounds = physics.calculateBoundingArea(shipDescriptor);
const planetBounds = physics.calculateBoundingArea(planetDescriptor);
const bulletBounds = physics.calculateBoundingArea(bulletDescriptor);

const pjfServer = new PojoFlowServer();

pjfServer.onNewClient(function() {
  //console.log("New client");
});

const wss = new WebSocket.Server({
  port: 8081,
  //clientTracking: true,
});

let firstPlayer = true;

let nextPlayerId = 0;
const playerConnections = {};

const bulletLifeSeconds = 2;

// colors from colorbrewer2.org
const colors = [
  '#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628',
  '#f781bf'
];

const gameData = {
  playerIdMap: {},
  state: {},
};

const players = [];

wss.on('connection', function connection(ws, req) {


  const playerId = nextPlayerId;
  nextPlayerId++;

  console.log("new player " + playerId);

  // add new player
  playerConnections[playerId] = ws;
  const initPlayerMessage = {
    type: 'playerId',
    playerId,
  };

  players.push({
    id: playerId,
    position: {
      x: Math.random() * 700,
      y: Math.random() * 700,
    },
    health: 100,
    rotationDegrees: 0,
    rotation: 0,
    scale: 1.0,
    color: playerId >= colors.length ? colors[0] : colors[playerId],
    initialRotationDegrees: 90,
    thrust: 0,
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
    //hasGravity: false,
    mass: 10,
    firing: false,
  });

  const playerIndex = players.length - 1;
  gameData.playerIdMap[playerId] = playerIndex;

  ws.on('message', function incoming(message) {

    const data = JSON.parse(message);

    switch (data.type) {
      case 'set-rotation':
        players[gameData.playerIdMap[data.playerId]].rotation = data.rotation;
        break;
      case 'set-thrust':
        players[gameData.playerIdMap[data.playerId]].thrust = data.thrust;
        break;
      case 'set-firing':
        players[gameData.playerIdMap[data.playerId]].firing = data.firing;
        break;
      default:
        throw "Invalid command";
        break;
    }
  });

  ws.on('close', function() {

    console.log("remove player " + playerId);

    players.splice(playerIndex, 1);

    gameData.playerIdMap = {};

    players.forEach(function(player, i) {
      gameData.playerIdMap[player.id] = i;
    });
  });

  ws.send(JSON.stringify(initPlayerMessage));

  if (firstPlayer) {
    firstPlayer = false;
    init();
  }
});

function init() {

  const planet1 = {
    id: 1000,
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
    mass: 1500000,
    bounds: planetBounds,
  };

  const planet2 = {
    id: 1001,
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
    mass: 1000000,
    bounds: planetBounds,
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

  gameData.state = state;

  physics.collide(players, planets, function(player, planet) {
    respawnPlayer(player);
  });

  physics.collide(bullets, planets, function(player, planet) {
  });

  physics.collide(bullets, players, function(bullet, player) {

    if (bullet.ownerId === player.id) {
      return;
    }

    player.health -= 10;

    console.log("Player " + player.id + " health: " + player.health);

    if (player.health <= 0) {
      //const index = players.indexOf(player);
      //players.splice(index, 1);
      respawnPlayer(player);
    }

    const bulletIndex = bullets.indexOf(bullet);
    bullets.splice(bulletIndex, 1);
  });
  
  const FULL_THRUST_ACCELERATION = 600.0;
  const bulletDelay = 0.1;

  let timeLastMessage = 0;

  const timeStats = new TimingStats({
    numSamples: 10,
  });

  setInterval(function() {

    const timeNow = timeNowSeconds();

    //timeStats.addAutoPrint();

    //if (players[0] !== undefined) {
    //  console.log(players[0].velocity);
    //}

    players.forEach(function(player, i) {

      player.thrustersOn = player.thrust > 0;
      if (player.thrustersOn) {
        physics.accelerateForward({
          object: player,
          acceleration: player.thrust * FULL_THRUST_ACCELERATION
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

    pjfServer.update(gameData);

    checkBulletLifetimes();

  }, SIM_PERIOD_MS);

  function fireBullet(player) {
    const bulletBaseSpeed = 600;
    const angle =
      player.initialRotationDegrees + player.rotationDegrees;
    const unitVelocity = unitVectorForAngleDegrees(angle);
    const velocity = unitVelocity.scaledBy(bulletBaseSpeed)
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
      spawnTime: timeNowSeconds(),
    };

    bullets.push(newBullet);
  }

  function checkBulletLifetimes() {
    const timeNow = timeNowSeconds();

    const removeList = [];

    bullets.forEach(function(bullet, i) {
      const beenAliveFor = timeNow - bullet.spawnTime;

      if (beenAliveFor > bulletLifeSeconds) {
        removeList.push(i);
      }
    });

    for (let i of removeList) {
      bullets.splice(i, 1);
    }
  }
}

function respawnPlayer(player) {
  player.health = 100;
  player.position.x = Math.random() * 800;
  player.position.y = Math.random() * 800;
  player.velocity.x = 0;
  player.velocity.y = 0;
  player.rotationDegrees = 0;
}
