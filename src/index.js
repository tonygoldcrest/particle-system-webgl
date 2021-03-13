import { createShader, createProgram, resizeCanvasToDisplaySize, hexToRgb } from './helpers.js';
import { Particle, Vector2 } from './classes.js';

let particlesCoordinates;
let particleProgram;
let positionBuffer;
let triangleProgram;
let particlePositionAttributeLocation;
let trianglePositionAttributeLocation;
let pointSizeLocation, particleColorLocation, particleOpacityLocation;

const config = {
  particlesNum: 50000,
  bounceX: true,
  bounceY: true,
  squared: true,
  enableMotionBlur: true,
  particleSize: 2,
  spawnRadius: 200,
  particleOpacity: 0.5,
  'GPU Performance': 50000,
  particleColor: '#ecf0f1'
};

let particlesNum = config.particlesNum;

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: config.enableMotionBlur });

function createParticles(number) {
  Module.ccall(
    'createParticles',
    null,
    ['number', 'number', 'number', 'number', 'number'],
    [number, gl.canvas.width / 2, gl.canvas.height / 2, config.spawnRadius, 0.01]
  );

  particlesCoordinates = new Float32Array(2 * number);
  particlesNum = number;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setupDatGui() {
  const gui = new dat.GUI();

  gui.add(config, 'GPU Performance', {
    UltraLow: 1000,
    Low: 10000,
    Medium: 50000,
    High: 100000,
    VeryHigh: 500000,
    Ultra: 1000000,
    Nightmare: 5000000
  }).onFinishChange(newValue => {
    config.particlesNum = newValue;

    createParticles(newValue);
  });
  gui.add(config, 'particlesNum', 1, 1000000).step(1).onFinishChange((newValue) => {
    createParticles(newValue);
  }).listen();
  gui.add(config, 'particleSize', 1, 100).step(1).onFinishChange((newValue) => {
    gl.uniform1f(pointSizeLocation, newValue);
  });
  gui.add(config, 'enableMotionBlur');
  gui.add(config, 'squared');
  gui.add(config, 'bounceX');
  gui.add(config, 'bounceY');

  const colors = gui.addFolder('Colors');
  gui.addColor(config, 'particleColor').onChange((newValue) => {
    const particleColorRgb = hexToRgb(newValue);
    gl.uniform3f(particleColorLocation, particleColorRgb.r, particleColorRgb.g, particleColorRgb.b);
  });
  gui.add(config, 'particleOpacity', 0, 1).step(0.01).onFinishChange((newValue) => {
    gl.uniform1f(particleOpacityLocation, newValue);
  }).listen();
  colors.open();
}

function setupGl() {
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Enable particles transparency
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  resizeCanvasToDisplaySize(gl.canvas, 2);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

}

function setupParticleProgram() {
  const particleVertexShaderSource = document.querySelector('#vertex-particle').textContent.trim();
  const particleFragmentShaderSource = document.querySelector('#fragment-particle').textContent.trim();

  const particleVertexShader = createShader(gl, gl.VERTEX_SHADER, particleVertexShaderSource);
  const particleFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, particleFragmentShaderSource);

  particleProgram = createProgram(gl, particleVertexShader, particleFragmentShader);

  pointSizeLocation = gl.getUniformLocation(particleProgram, "point_size");
  particleOpacityLocation = gl.getUniformLocation(particleProgram, "u_opacity");
  particleColorLocation = gl.getUniformLocation(particleProgram, "u_color");

  particlePositionAttributeLocation = gl.getAttribLocation(particleProgram, "a_position");

  gl.enableVertexAttribArray(particlePositionAttributeLocation);

  gl.vertexAttribPointer(particlePositionAttributeLocation, 2 /* size */, gl.FLOAT /* type */, false /* normalize */, 2 * Float32Array.BYTES_PER_ELEMENT /* stride */, 0 /* offset */);

  gl.useProgram(particleProgram);

  gl.uniform1f(pointSizeLocation, config.particleSize);
  gl.uniform1f(particleOpacityLocation, config.particleOpacity);

  const particleColorRgb = hexToRgb(config.particleColor);
  gl.uniform3f(particleColorLocation, particleColorRgb.r, particleColorRgb.g, particleColorRgb.b);
}

function setupTriangleProgram() {
  const triangleVertexShaderSource = document.querySelector('#vertex-triangle').textContent.trim();
  const triangleFragmentShaderSource = document.querySelector('#fragment-triangle').textContent.trim();

  const triangleVertexShader = createShader(gl, gl.VERTEX_SHADER, triangleVertexShaderSource);
  const triangleFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, triangleFragmentShaderSource);

  triangleProgram = createProgram(gl, triangleVertexShader, triangleFragmentShader);

  trianglePositionAttributeLocation = gl.getAttribLocation(triangleProgram, "a_position");

  gl.enableVertexAttribArray(trianglePositionAttributeLocation);
}

function main() {
  setupDatGui();
  setupGl();
  setupParticleProgram();

  if (config.enableMotionBlur) {
    setupTriangleProgram();
  }

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  let isMouseDown = false;
  let isForceApplied = false;
  let mouseDownPosition = new Vector2(gl.canvas.width / 2, gl.canvas.height / 2);
  let forceCenter = new Vector2(0, 0);
  let isPaused = false;

  let startTime = 0;

  createParticles(particlesNum);

  let canvasWidth = gl.canvas.width;
  let canvasHeight = gl.canvas.height;

  requestAnimationFrame(animate);

  canvas.addEventListener('mousedown', function (evt) {
    isMouseDown = true;
    mouseDownPosition = new Vector2(gl.canvas.width * (evt.x / canvas.clientWidth), gl.canvas.height - gl.canvas.height * (evt.y / canvas.clientHeight));
    forceCenter = mouseDownPosition;
    isForceApplied = true;
  });

  canvas.addEventListener('mousemove', function (evt) {
    mouseDownPosition = new Vector2(gl.canvas.width * (evt.x / canvas.clientWidth), gl.canvas.height - gl.canvas.height * (evt.y / canvas.clientHeight));

    if (isMouseDown) {
      forceCenter = mouseDownPosition;
    }
  });

  document.addEventListener('mouseup', function (evt) {
    isMouseDown = false;
    isForceApplied = false;
  });

  document.addEventListener('keydown', function (evt) {
    if (document.activeElement.getAttribute('type') === 'text') {
      return;
    }

    if (evt.key === 'c') {
      if (!isForceApplied) {
        forceCenter = new Vector2(gl.canvas.width / 2, gl.canvas.height / 2);
        isForceApplied = true;
      }
    } else if (evt.key === 'X') {
      Module.ccall(
        'explosion',
        null,
        ['number', 'number', 'number'],
        [mouseDownPosition.x, mouseDownPosition.y, 5]
      );
    } else if (evt.key === 'x') {
      Module.ccall(
        'explosion',
        null,
        ['number', 'number', 'number'],
        [gl.canvas.width / 2, gl.canvas.height / 2, 5]
      );
    } else if (evt.key === 'r') {
      Module.ccall(
        'respawn',
        null,
        ['number', 'number', 'number', 'number'],
        [gl.canvas.width / 2, gl.canvas.height / 2, config.spawnRadius, 0.01]
      );
    } else if (evt.key === 'e') {
      Module.ccall(
        'spawnEmpty',
        null,
        ['number', 'number', 'number', 'number', 'number'],
        [gl.canvas.width / 2, gl.canvas.height / 2, config.spawnRadius, 10, 5]
      );
    } else if (evt.key === 's') {
      Module.ccall(
        'stop',
        null,
        null,
        null
      );
    } else if (evt.key === 'p') {
      isPaused = !isPaused;

      if (!isPaused) {
        requestAnimationFrame(animate);
      }
    } else if (evt.key === 'd') {
      Module.ccall(
        'deleteHeavyParticles',
        null,
        null,
        null
      );
    } else if (parseInt(evt.key)) {
      Module.ccall(
        'createHeavyParticles',
        null,
        ['number', 'number', 'number'],
        [parseInt(evt.key), gl.canvas.width, gl.canvas.height]
      );
    }
  });

  document.addEventListener('keyup', function (evt) {
    if (document.activeElement.getAttribute('type') === 'text') {
      return;
    }

    if (evt.key === 'c') {
      isForceApplied = false;
    }
  });

  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const triangles = new Float32Array(
      [
        -1, -1,
        -1, 1,
        1, 1,
        1, 1,
        1, -1,
        -1, -1
      ]
  );

  function animate() {
    stats.begin();
    let deltaTime = (Date.now() - startTime) / 1000;

    if (config.enableMotionBlur) {
      gl.useProgram(triangleProgram);

      gl.vertexAttribPointer(
        trianglePositionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

      gl.bufferData(gl.ARRAY_BUFFER, triangles , gl.STATIC_DRAW);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.useProgram(particleProgram);
    } else {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    ccallArrays(
      'calcCoordinates',
      'array',
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [canvasWidth, canvasHeight, config.particleSize, isForceApplied ? 1 : 0, forceCenter.x, forceCenter.y, deltaTime, config.bounceX ? 1 : 0, config.bounceY ? 1 : 0, config.squared ? 1 : 0],
      { heapOut: "HEAPF32", returnArraySize: particlesNum * 2, resultArray: particlesCoordinates }
    );

    if (config.enableMotionBlur) {
      gl.vertexAttribPointer(particlePositionAttributeLocation, 2 /* size */, gl.FLOAT /* type */, false /* normalize */, 2 * Float32Array.BYTES_PER_ELEMENT /* stride */, 0 /* offset */);
    }

    gl.bufferData(gl.ARRAY_BUFFER, particlesCoordinates, gl.DYNAMIC_DRAW);

    gl.drawArrays(gl.POINTS, 0 /* offset */, particlesNum /* call shader times */);

    startTime = Date.now();

    stats.end();

    if (!isPaused) {
      requestAnimationFrame(animate);
    }
  }
}

main();
