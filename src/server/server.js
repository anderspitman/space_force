const WebSocket = require('ws');
const math = require('../common/math');
const { PhysicsEngine } = require('../common/physics');
const {
  shipDescriptor,
  planetDescriptor,
  boundingAreaDescriptor,
  bulletDescriptor,
} = require('../common/primitives');

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_SPACE = 32;

const keys = {};

const wss = new WebSocket.Server({
  port: 8081,
  //clientTracking: true,
});

let gWs;

let firstPlayer = true;

wss.on('connection', function connection(ws, req) {

  ws.on('message', function incoming(message) {

    const data = JSON.parse(message);

    switch (data.type) {
      case 'key-down':
        keys[data.keyCode] = true;
        console.log(keys);
        break;
      case 'key-up':
        keys[data.keyCode] = false;
        console.log(keys);
        break;
      default:
        console.log("sending scene update");
        ws.send(JSON.stringify(scene));
        break;
    }
  });

  if (firstPlayer) {
    init();
  }
});

function init() {

  firstPlayer = false;

  const team1Color = 'blue';
  const team2Color = 'yellow';

  const playerShip = {
    position: {
      x: 700,
      y: 700,
    },
    rotationDegrees: 0,
    scale: 1.0,
    color: team1Color,
    initialRotationDegrees: 90,
    velocity: {
      x: 0,
      y: 0,
    },
    thrustersOn: false,
    visible: true,
  };

  const planet1 = {
    position: {
      x: 200,
      y: 200,
    },
    rotationDegrees: 0,
    scale: 1.0,
    showBuilding: true,
    hasRadar: false,
    color: team1Color,
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
    color: team2Color,
  };

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

  const scene = [
    {
      primitiveId: 'Ship',
      instances: [
        playerShip 
      ]
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

  const physics = new PhysicsEngine();

  playerShip.bounds = physics.calculateBoundingArea(shipDescriptor);
  // TODO: remove this duplication
  planet1.bounds = physics.calculateBoundingArea(planetDescriptor);
  planet2.bounds = physics.calculateBoundingArea(planetDescriptor);
  bullets[0].bounds = physics.calculateBoundingArea(bulletDescriptor);

  physics.add(bullets[0])
    .setHasGravity(false)

  const shipPhysics = physics.add(playerShip)
    .setBounds(playerShip.bounds)
    .setMass(10)
    .setPositioning('dynamic')
    //.setHasGravity(false)

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
  
  physics.collide(shipPhysics, planetsPhysics, function(ship, planet) {
    //console.log("ship hit planet");
    //ship.obj.position.x = 700;
    //ship.obj.position.y = 700;
    //ship.obj.velocity.x = 0;
    //ship.obj.velocity.y = 0;
    //ship.obj.rotationDegrees = 0;
  });

  physics.collide(bulletPhysics, planetsPhysics, function(ship, planet) {
    //console.log("bullet hit planet");
  });
  
  const rotationStep = 5.0;
  const FULL_THRUST = 0.1;
  const bulletDelay = 0.1;

  let timeLastMessage = 0;
  let timeLastBullet = 0;

  setInterval(function() {

    const timeNow = timeNowSeconds();
    const elapsed = timeNow - timeLastMessage;
    timeLastMessage = timeNow;

    //console.log(elapsed);

    if (keys[KEY_LEFT]) {
      playerShip.rotationDegrees += rotationStep;
    }
    else if (keys[KEY_RIGHT]) {
      playerShip.rotationDegrees -= rotationStep;
    }

    if (keys[KEY_SPACE]) {
      const bulletElapsed = timeNow - timeLastBullet;
      if (bulletElapsed > bulletDelay) {
        fireBullet();
        timeLastBullet = timeNow;
      }
    }

    playerShip.thrustersOn = keys[KEY_UP];

    if (playerShip.thrustersOn) {
      shipPhysics.accelerateForward(FULL_THRUST);
    }

    // run physics every 10ms, but only send updates every 100
    physics.tick();

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(scene));
      }
    });

  // TODO: decouple simulation time from movement speed of objects
  }, 16.667);

  function fireBullet() {
    const bulletSpeed = 5;
    const angle =
      playerShip.initialRotationDegrees + playerShip.rotationDegrees;
    const unitVelocity = math.unitVectorForAngleDegrees(angle);
    const velocity = unitVelocity.scaledBy(bulletSpeed);

    const newBullet = {
      position: {
        x: playerShip.position.x,
        y: playerShip.position.y,
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
