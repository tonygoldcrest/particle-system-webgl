#version 300 es

in vec4 a_position;
uniform float point_size;

void main() {
  gl_Position = a_position;
  gl_PointSize = point_size;
}
