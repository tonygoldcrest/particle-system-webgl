#version 300 es

in vec4 aPosition;
uniform float uPointSize;
out vec4 vParticlePosition;

void main() {
  gl_Position = aPosition;
  gl_PointSize = uPointSize;
  vParticlePosition = aPosition;
}
