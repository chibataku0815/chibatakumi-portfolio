struct U {
  mvp:   mat4x4<f32>,
  color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var tex:  texture_2d<f32>;

struct VOut {
  @builtin(position) pos: vec4<f32>,
  @location(0)       uv:  vec2<f32>,
};

@vertex
fn vs(@location(0) p: vec2<f32>, @location(1) uv: vec2<f32>) -> VOut {
  var o: VOut;
  o.pos = u.mvp * vec4<f32>(p, 0.0, 1.0);
  o.uv  = uv;
  return o;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4<f32> {
  let s = textureSample(tex, samp, in.uv);
  return vec4<f32>(s.rgb * u.color.rgb, s.a * u.color.a);
}
