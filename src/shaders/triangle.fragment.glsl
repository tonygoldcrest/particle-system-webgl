#version 300 es

precision highp float;

out vec4 outColor;

uniform vec3 uBackground;

void main() {
  outColor = vec4(uBackground.xyz, .1);
}
