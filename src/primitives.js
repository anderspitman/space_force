export const bulletDescriptor = {
  type: 'Rectangle',
  position: '%position',
  rotationDegrees: '%rotationDegrees',
  width: 2,
  height: 1,
  strokeColor: 'white',
  fillColor: 'white',
};

export const boundingAreaDescriptor = {
  type: 'Group',
  position: '%position',
  anchor: '%anchor',
  rotationDegrees: '%rotationDegrees',
  children: [
    //{
    //  type: 'Rectangle',
    //  width: '%width',
    //  height: '%height',
    //  strokeColor: 'red',
    //  fillColor: 'none',
    //},
    {
      type: 'Circle',
      position: '%circlePosition',
      radius: '%radius',
      strokeColor: 'red',
      fillColor: 'none',
    }
  ]
};

export const shipDescriptor = {
  type: 'Group',
  position: '%position',
  rotationDegrees: '%rotationDegrees',
  visible: '%visible',
  children: [
    //{
    //  id: 'center-marker',
    //  type: 'Circle',
    //  radius: 5,
    //  strokeColor: 'red',
    //  fillColor: 'red',
    //},
    {
      id: 'main-body',
      type: 'Triangle',
      width: 20,
      height: 20,
      vertices: {
        vertex1: { x: 0, y: 10 },
        vertex2: { x: 10, y: -10 },
        vertex3: { x: -10, y: -10 },
      },
      strokeColor: '%color',
      fillColor: 'none',
    },
    {
      id: 'left-thruster',
      type: 'Triangle',
      position: {
        x: -5,
        y: -10,
      },
      vertices: {
        vertex1: { x: -2, y: 0 },
        vertex2: { x: 2, y: 0 },
        vertex3: { x: 0, y: -4 },
      },
      strokeColor: '#23fbff',
      fillColor: 'none',
      visible: '%thrustersOn',
    },
    {
      id: 'right-thruster',
      type: 'Triangle',
      position: {
        x: 5,
        y: -10,
      },
      vertices: {
        vertex1: { x: -2, y: 0 },
        vertex2: { x: 2, y: 0 },
        vertex3: { x: 0, y: -4 },
      },
      strokeColor: '#23fbff',
      fillColor: 'none',
      visible: '%thrustersOn',
    }
  ],
};

export const planetDescriptor = {
  type: 'Group',
  position: '%position',
  children: [
    {
      id: 'main-circle',
      type: 'Circle',
      radius: 100,
    },
    {
      id: 'team-indicator',
      type: 'Rectangle',
      width: 10,
      height: 10,
      position: {
        x: -5,
        y: 5,
      },
      fillColor: '%color',
    },
    {
      id: 'center-building',
      type: 'Rectangle',
      width: 40,
      height: 40,
      position: {
        x: -20,
        y: 20,
      },
      strokeColor: '%color',
      fillColor: 'none',
    },
    {
      id: 'left-building',
      type: 'Rectangle',
      width: 40,
      height: 80,
      position: {
        x: -70,
        y: 40,
      },
      strokeColor: '%color',
      fillColor: 'none',
    },
    {
      id: 'top-building',
      type: 'Rectangle',
      width: 45,
      height: 30,
      position: {
        x: 0,
        y: 70,
      },
      strokeColor: '%color',
      fillColor: 'none',
    },
    {
      id: 'radar-building',
      visible: '%hasRadar',
      type: 'Group',
      position: {
        x: 0,
        y: -40,
      },
      children: [
        {
          id: 'building',
          type: 'Rectangle',
          width: 40,
          height: 20,
          strokeColor: '%color',
          fillColor: 'none',
        },
        {
          id: 'dish',
          type: 'Triangle',
          width: 30,
          height: 30,
          position: {
            x: 30,
            y: 20,
          },
          vertices: {
            vertex1: { x: 0, y: 0 },
            vertex2: { x: 30, y: -30 },
            vertex3: { x: 10, y: -20 },
          },
          strokeColor: '%color',
          fillColor: 'none',
        },
      ]
    }
  ],
};
