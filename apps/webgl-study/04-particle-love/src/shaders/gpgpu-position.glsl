// GPUComputationRenderer auto-injects:
//   uniform sampler2D texturePosition;
//   uniform sampler2D textureVelocity;
//   #define resolution vec2(SIZE, SIZE)

uniform float uDeltaTime;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec3 vel = texture2D(textureVelocity, uv).xyz;

  // Phase A: position += velocity * dt
  pos.xyz += vel * uDeltaTime;

  gl_FragColor = pos;
}
