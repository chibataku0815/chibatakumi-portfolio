// Composite shader source for MotionStage. A single fullscreen-triangle
// vertex stage drives either a single-texture blit (when one participant
// is active) or a two-texture cross-fade (during a 0.5s setActive blend).
//
// Kept inline as a TS string literal to avoid the `?raw` import dance —
// the file is small and motion-core is bundle-tracked anyway.

export const COMPOSITE_WGSL = /* wgsl */ `
struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) idx: u32) -> VsOut {
  // Fullscreen triangle (covers [-1,1]^2 with 1 extra triangle area).
  let xs = array<f32, 3>(-1.0, 3.0, -1.0);
  let ys = array<f32, 3>(-1.0, -1.0, 3.0);
  let us = array<f32, 3>(0.0, 2.0, 0.0);
  let vs_ = array<f32, 3>(1.0, 1.0, -1.0);
  var out: VsOut;
  out.pos = vec4f(xs[idx], ys[idx], 0.0, 1.0);
  out.uv = vec2f(us[idx], vs_[idx]);
  return out;
}

struct CompositeUniforms {
  blend: f32,    // 0.0 = pure A, 1.0 = pure B
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var texA: texture_2d<f32>;
@group(0) @binding(2) var texB: texture_2d<f32>;
@group(0) @binding(3) var<uniform> u: CompositeUniforms;

@fragment
fn fs(in: VsOut) -> @location(0) vec4f {
  let a = textureSample(texA, samp, in.uv);
  let b = textureSample(texB, samp, in.uv);
  return mix(a, b, u.blend);
}
`;
