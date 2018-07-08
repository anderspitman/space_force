export const shipPrimitive = {
  type: 'Group',
  anchor: {
    x: 10,
    y: 10,
  },
  children: [
    {
      id: 'main-body',
      type: 'Triangle',
      width: 20,
      height: 20,
      position: {
        x: 2,
        y: 20,
      },
      vertices: {
        vertex1: { x: 0.5, y: 0 },
        vertex2: { x: 1, y: 1 },
        vertex3: { x: 0, y: 1 },
      },
      strokeColor: '%color',
    },
    {
      id: 'left-thruster',
      type: 'Triangle',
      width: 4,
      height: 4,
      position: {
        x: 15,
        y: 20,
      },
      vertices: {
        vertex1: { x: 0, y: 0 },
        vertex2: { x: 1, y: 0 },
        vertex3: { x: 0.5, y: 1 },
      },
      strokeColor: '#23fbff',
      visible: '%thrustersOn',
    },
    {
      id: 'right-thruster',
      type: 'Triangle',
      width: 4,
      height: 4,
      vertices: {
        vertex1: { x: 0, y: 0 },
        vertex2: { x: 1, y: 0 },
        vertex3: { x: 0.5, y: 1 },
      },
      strokeColor: '#23fbff',
      visible: '%thrustersOn',
    }
  ],
};

export const ship = {
  primitiveId: 'ship',
  create: function() {

    this.setAnchor({ x: 10, y: 10 })

    this.group = this.ctx.createGroup()

    this.tri = this.ctx.createTriangle()
      .setWidth(20)
      .setHeight(20)
      .setVertices({
        vertex1: { x: 0.5, y: 0 },
        vertex2: { x: 1, y: 1 },
        vertex3: { x: 0, y: 1 },
      })
    this.group.addChild(this.tri);

    this.leftThruster = this.ctx.createTriangle()
      .setWidth(4)
      .setHeight(4)
      .setPosition({ x: 2, y: 20 })
      .setVertices({
        vertex1: { x: 0, y: 0 },
        vertex2: { x: 1, y: 0 },
        vertex3: { x: 0.5, y: 1 },
      })
    this.group.addChild(this.leftThruster)

    this.rightThruster = this.ctx.createTriangle()
      .setWidth(4)
      .setHeight(4)
      .setPosition({ x: 15, y: 20 })
      .setVertices({
        vertex1: { x: 0, y: 0 },
        vertex2: { x: 1, y: 0 },
        vertex3: { x: 0.5, y: 1 },
      })
    this.group.addChild(this.rightThruster)


    return this.group;
  },
  render: function({ state }) {
    this.tri.setStrokeColor(state.color);
    this.setRotationDegrees({
      angleDegrees: state.rotationDegrees
    });

    const thrusterColor = '#23fbff';

    this.leftThruster.setStrokeColor(thrusterColor);
    this.leftThruster.setVisible(state.thrustersOn);

    this.rightThruster.setStrokeColor(thrusterColor);
    this.rightThruster.setVisible(state.thrustersOn);
  }
};

export const radarBuilding = { 
  primitiveId: 'radar-building',
  create: function() {

    const group = this.ctx.createGroup()
      .setPosition({ x: 0, y: 40 })

    this.building = this.ctx.createRectangle()
      .setWidth(40)
      .setHeight(20)
      .setFillColor('none')
    group.addChild(this.building);

    this.dish = this.ctx.createTriangle()
      .setPosition({ x: 30, y: -20 })
      .setWidth(30)
      .setHeight(30)
      .setVertices({
        vertex1: { x: 0, y: 0 },
        vertex2: { x: 1, y: 1 },
        vertex3: { x: 0.3, y: 0.7 },
      })
    group.addChild(this.dish);

    return group;
  },
  render: function({ state }) {
    this.setVisible(state.hasRadar);
    this.building.setStrokeColor(state.color);
    this.dish.setStrokeColor(state.color);
  }
};

export const planet = {
  primitiveId: 'planet',
  create: function() {
    const planet = this.ctx.createGroup()
    const circle = this.ctx.createCircle()
      .setRadius(100)
    planet.addChild(circle);

    this.teamIndicator = this.ctx.createRectangle()
      .setWidth(10)
      .setHeight(10)
      .setPosition({ x: -5, y: -5 })
    planet.addChild(this.teamIndicator);

    this.centerBuilding = this.ctx.createRectangle()
      .setWidth(40)
      .setHeight(40)
      .setPosition({ x: -20, y: -20 })
      .setFillColor('none')
    planet.addChild(this.centerBuilding);

    this.leftBuilding = this.ctx.createRectangle()
      .setWidth(40)
      .setHeight(80)
      .setPosition({ x: -70, y: -40 })
      .setFillColor('none')
    planet.addChild(this.leftBuilding);

    this.topBuilding = this.ctx.createRectangle()
      .setWidth(45)
      .setHeight(30)
      .setPosition({ x: 0, y: -70 })
      .setFillColor('none')
    planet.addChild(this.topBuilding)

    this.radar = this.ctx.createPrimitive({
      primitiveId: 'radar-building' });
    planet.addChild(this.radar);
    return planet;
  },
  render: function({ state }) {

    if (state.showBuilding) {
      this.leftBuilding.setVisible(true);
    }

    this.teamIndicator.setStrokeColor(state.color);
    this.teamIndicator.setFillColor(state.color);
    this.centerBuilding.setStrokeColor(state.color);
    this.leftBuilding.setStrokeColor(state.color);
    this.topBuilding.setStrokeColor(state.color);

    this.radar.render({ state });

    //planet.getChildById('radar');
  }
};
