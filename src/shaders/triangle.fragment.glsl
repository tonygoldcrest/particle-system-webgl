#version 300 es

precision highp float;

out vec4 outColor;

uniform vec3 u_background;

void main() {
  outColor = vec4(u_background.xyz, .1);
}
