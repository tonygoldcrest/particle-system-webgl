import { createShader, createProgram, normalize } from './helpers.js';
import { Particle, Vector2 } from './classes.js';

// particles 100k, length 10, size 2, opacity 7
// particles 1m, length 0, size 1, opacity 5
const particlesNum = 1000000;
const trailLength = 0;
const pointSize = 1;
const opacityReductionNumber = 2;

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2');

function setupGl() {
  const vertexShaderSource = document.querySelector('#vertex').textContent.trim();
  const fragmentShaderSource = document.querySelector('#fragment').textContent.trim();

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const opacityAttributeLocation = gl.getAttribLocation(program, "a_opacity");
  const positionBuffer = gl.createBuffer();
  const colorLocation = gl.getUniformLocation(program, "u_color");
  const pointSizeLocation = gl.getUniformLocation(program, "point_size");

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  gl.vertexAttribPointer(positionAttributeLocation, 2 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 0 /* offset */);
  gl.vertexAttribPointer(opacityAttributeLocation, 1 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 2 * Float32Array.BYTES_PER_ELEMENT /* offset */);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.enableVertexAttribArray(opacityAttributeLocation);

  // Enable particles transparency
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas, 2);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
  gl.uniform1f(pointSizeLocation, pointSize);
}

function main() {
  setupGl();

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const particles = [];
  let isMouseDown = false;
  let mouseDownPosition;
  let startTime = 0;
  const center = new Vector2(gl.canvas.width / 2, gl.canvas.height / 2);

  for (let i = 0; i < particlesNum; i++) {
    let r = Math.random() * 200;
    let phi = Math.random() * 2 * Math.PI;
    let x = r * Math.sin(phi);
    let y = r * Math.cos(phi);

    const particle = new Particle(new Vector2(x, y).add(center));
    particles.push(particle);
    const force = Vector2.subtract(particle.position, center).multiply(0.05);
    particle.addForce(force.x, force.y);
  }

  let canvasWidth = gl.canvas.width;
  let canvasHeight = gl.canvas.height;

  let particlesCoordinates = new Float32Array(3 * particles.length * (trailLength + 1));


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

    gl.clearColor(0.18, 0.21, 0.25, 1.0);

  function animate() {
    stats.begin();

    let deltaTime = (Date.now() - startTime) / 1000;

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < particles.length; i++) {
      let particle = particles[i];
      const normX = -1.0 + 2.0 * particle.position.x / canvasWidth;
      const normY = -1.0 + 2.0 * particle.position.y / canvasHeight;

      particlesCoordinates[(3 + 3*trailLength)*i] = normX;
      particlesCoordinates[(3 + 3*trailLength)*i + 1] = normY;
      particlesCoordinates[(3 + 3*trailLength)*i + 2] = 1.0 / opacityReductionNumber;

      for (let j = 0; j < particle.prevPoisitons.length; j++) {
        if (j % 3 == 2) {
          particlesCoordinates[(3 + 3 * trailLength) * i + 3 + j] = j / (opacityReductionNumber * particle.prevPoisitons.length);
        } else {
          particlesCoordinates[(3 + 3 * trailLength) * i + 3 + j] = particle.prevPoisitons[j];
        }
      }

      if (particle.position.x < 0 || particle.position.x > canvasWidth) {
        particle.velocity.x = -particle.velocity.x;
      }

      if (particle.position.y < 0 || particle.position.y > canvasHeight) {
        particle.velocity.y = -particle.velocity.y;
      }

      if (trailLength) {
        particle.prevPoisitons.push(normX);
        particle.prevPoisitons.push(normY);
        particle.prevPoisitons.push(0.1);

        if (particle.prevPoisitons.length > trailLength * 3) {
          particle.prevPoisitons.splice(0, 3);
        }
      }

      if (isMouseDown) {
        const length = Math.sqrt(Math.pow(mouseDownPosition.x - particle.position.x, 2) + Math.pow(mouseDownPosition.y - particle.position.y, 2));

        particle.addForce(
          deltaTime * 100 * (1 / length) * (mouseDownPosition.x - particle.position.x),
          deltaTime * 100 * (1 / length) * (mouseDownPosition.y - particle.position.y)
        );
      }

      particle.move();
    };


    gl.bufferData(gl.ARRAY_BUFFER, particlesCoordinates, gl.DYNAMIC_DRAW);

    gl.drawArrays(gl.POINTS, 0 /* offset */, particlesNum * (trailLength + 1) /* call shader times */);

    startTime = Date.now();

    stats.end();
    requestAnimationFrame(animate);
  }
}

main();
