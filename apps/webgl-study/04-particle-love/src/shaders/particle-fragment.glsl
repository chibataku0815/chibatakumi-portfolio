uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vSpeed;

void main() {
  // Circular mask
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Soft edge
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

  // Speed-based color interpolation (slow = colorA, fast = colorB)
  vec3 color = mix(uColorA, uColorB, vSpeed);

  // Speed-based brightness
  float brightness = 0.6 + vSpeed * 0.4;

  gl_FragColor = vec4(color * brightness, alpha * 0.5);
}
