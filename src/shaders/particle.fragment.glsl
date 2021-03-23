#version 300 es

precision highp float;

in vec4 vParticlePosition;

out vec4 outColor;

uniform vec3 uColor;
uniform float uOpacity;
uniform sampler2D uImage;
uniform float uReadFromTexture;
uniform vec3 uCoefficients;

void main() {
  vec3 texturePixelIfExists = texture(uImage, (vParticlePosition.xy * vec2(1, -1) + 1.0) / 2.0).rgb * uReadFromTexture + vec3(-1, -1, -1) * (uReadFromTexture - 1.0);
  outColor = vec4(texturePixelIfExists * uColor * uCoefficients, uOpacity);
}
