struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var sceneSampler: sampler;
@group(0) @binding(1) var sceneTexture: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );

  let position = positions[i];
  var output: VOut;
  output.pos = vec4f(position, 0.0, 1.0);
  output.uv = vec2f((position.x + 1.0) * 0.5, 1.0 - (position.y + 1.0) * 0.5);
  return output;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let source = textureSample(sceneTexture, sceneSampler, in.uv).rgb;
  let col = clamp(pow(source, vec3f(0.92)), vec3f(0.0), vec3f(1.0));
  return vec4f(col, 1.0);
}
