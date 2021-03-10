import { createShader, createProgram, resizeCanvasToDisplaySize } from './helpers.js';
import { Particle, Vector2 } from './classes.js';

let particleProgram;
let positionBuffer;
let triangleProgram;
let particlePositionAttributeLocation, particleOpacityAttributeLocation;
let trianglePositionAttributeLocation;

// particles 100k, length 10, size 2, opacity 7
// particles 1m, length 0, size 1, opacity 5
const particlesNum = 1000000;
const pointSize = 1;
const opacityReductionNumber = 2;
const enableMotionBlur = true;

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: enableMotionBlur });

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

  const pointSizeLocation = gl.getUniformLocation(particleProgram, "point_size");

  particlePositionAttributeLocation = gl.getAttribLocation(particleProgram, "a_position");
  particleOpacityAttributeLocation = gl.getAttribLocation(particleProgram, "a_opacity");

  gl.enableVertexAttribArray(particlePositionAttributeLocation);
  gl.enableVertexAttribArray(particleOpacityAttributeLocation);

  gl.vertexAttribPointer(particlePositionAttributeLocation, 2 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 0 /* offset */);
  gl.vertexAttribPointer(particleOpacityAttributeLocation, 1 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 2 * Float32Array.BYTES_PER_ELEMENT /* offset */);


  gl.useProgram(particleProgram);

  gl.uniform1f(pointSizeLocation, pointSize);
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
  setupGl();
  setupParticleProgram();

  if (enableMotionBlur) {
    setupTriangleProgram();
  }

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  let isMouseDown = false;
  let mouseDownPosition = new Vector2(0, 0);
  let startTime = 0;

  Module.ccall(
    'createParticles',// name of C function
    null,// return type
    ['number', 'number', 'number'],// argument types
    [particlesNum, gl.canvas.width / 2, gl.canvas.height / 2]// arguments
  );

  let canvasWidth = gl.canvas.width;
  let canvasHeight = gl.canvas.height;

  let particlesCoordinates = new Float32Array(3 * particlesNum);

  requestAnimationFrame(animate);

  canvas.addEventListener('mousedown', function (evt) {
    isMouseDown = true;
    mouseDownPosition = new Vector2(gl.canvas.width * (evt.x / canvas.clientWidth), gl.canvas.height - gl.canvas.height * (evt.y / canvas.clientHeight));
  });

  canvas.addEventListener('mousemove', function (evt) {
    mouseDownPosition = new Vector2(gl.canvas.width * (evt.x / canvas.clientWidth), gl.canvas.height - gl.canvas.height * (evt.y / canvas.clientHeight));
  });

  document.addEventListener('mouseup', function (evt) {
    isMouseDown = false;
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

    if (enableMotionBlur) {
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
      'calcCoordinates',// name of C function
      'array',// return type
      ['number', 'number', 'number', 'number', 'number', 'number', 'number'],// argument types
      [canvasWidth, canvasHeight, opacityReductionNumber, isMouseDown ? 1 : 0, mouseDownPosition.x, mouseDownPosition.y, deltaTime],// arguments,
      { heapOut: "HEAPF32", returnArraySize: particlesNum*3, resultArray: particlesCoordinates }
    );

    if (enableMotionBlur) {
      gl.vertexAttribPointer(particlePositionAttributeLocation, 2 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 0 /* offset */);
      gl.vertexAttribPointer(particleOpacityAttributeLocation, 1 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 2 * Float32Array.BYTES_PER_ELEMENT /* offset */);
    }

    gl.bufferData(gl.ARRAY_BUFFER, particlesCoordinates, gl.DYNAMIC_DRAW);

    gl.drawArrays(gl.POINTS, 0 /* offset */, particlesNum /* call shader times */);

    startTime = Date.now();

    stats.end();
    requestAnimationFrame(animate);
  }
}

main();
