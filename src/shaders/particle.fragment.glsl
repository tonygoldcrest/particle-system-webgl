#version 300 es

precision highp float;

out vec4 outColor;

uniform vec3 u_color;
uniform float u_opacity;

void main() {
  outColor = vec4(u_color.xyz, u_opacity);
}
