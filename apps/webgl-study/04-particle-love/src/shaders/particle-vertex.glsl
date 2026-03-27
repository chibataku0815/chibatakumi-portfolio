uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float uPointSize;
uniform vec2 uResolution;

attribute vec2 aParticlesUv;

varying float vSpeed;

void main() {
  vec4 posData = texture2D(uPositionTexture, aParticlesUv);
  vec3 pos = posData.xyz;

  // Pass speed to fragment for color mapping
  vec3 vel = texture2D(uVelocityTexture, aParticlesUv).xyz;
  vSpeed = clamp(length(vel) * 20.0, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  gl_PointSize = uPointSize * uResolution.y;
  gl_PointSize *= (1.0 / -mvPosition.z);
  // Clamp to prevent overly large particles
  gl_PointSize = min(gl_PointSize, 8.0);

  gl_Position = projectionMatrix * mvPosition;
}
