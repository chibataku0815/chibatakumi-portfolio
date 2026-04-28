//#region src/shaders/composite.wgsl?raw
var e = "// ============================================================\n// gpu-film-post — composite.wgsl\n// Single-pass film post-processing: 6 effects in one draw call.\n// Fullscreen triangle (no vertex buffer).\n// ============================================================\n\n// ── Uniform buffer (64 bytes, 16-aligned) ────────────────────\nstruct Uniforms {\n  time:               f32,   //  0\n  pulse:              f32,   //  4\n  resolution:         vec2f, //  8\n  grainIntensity:     f32,   // 16\n  grainSize:          f32,   // 20\n  caAmount:           f32,   // 24\n  bloomThreshold:     f32,   // 28\n  bloomIntensity:     f32,   // 32\n  bloomWarmth:        f32,   // 36\n  vignetteStrength:   f32,   // 40\n  vignetteWarmShift:  f32,   // 44\n  leakIntensity:      f32,   // 48\n  shadowLift:         f32,   // 52\n  tonemapCompression: f32,   // 56\n  grainRadialMix:     f32,   // 60\n}\n\n// ── Bindings ─────────────────────────────────────────────────\n@group(0) @binding(0) var<uniform> u: Uniforms;\n@group(0) @binding(1) var sceneSampler: sampler;\n@group(0) @binding(2) var sceneTexture: texture_2d<f32>;\n\n// ── Vertex IO ────────────────────────────────────────────────\nstruct VOut {\n  @builtin(position) pos: vec4f,\n  @location(0)       uv:  vec2f,\n}\n\n// ── Helpers: fract (WGSL has no built-in) ────────────────────\nfn fract1(x: f32) -> f32 { return x - floor(x); }\nfn fract2(v: vec2f) -> vec2f { return v - floor(v); }\n\n// ── Grain: per-pixel deterministic hash ──────────────────────\nfn grainPixelHash(p: vec2f, seed: f32) -> f32 {\n  let s = dot(p + seed, vec2f(12.9898, 78.233));\n  return fract1(sin(s) * 43758.5453);\n}\n\n// ── Grain: lattice hash for clump noise ──────────────────────\nfn valueNoiseHash(p: vec2f) -> f32 {\n  let h = dot(p, vec2f(12.9898, 78.233));\n  return fract1(sin(h) * 43758.5453);\n}\n\nfn grainClumpNoise(p: vec2f, clumpScale: f32) -> f32 {\n  let sp = p / clumpScale;\n  let i  = floor(sp);\n  let f  = fract2(sp);\n  let sm = f * f * (3.0 - 2.0 * f);  // smoothstep\n  let a  = valueNoiseHash(i);\n  let b  = valueNoiseHash(i + vec2f(1.0, 0.0));\n  let c  = valueNoiseHash(i + vec2f(0.0, 1.0));\n  let d  = valueNoiseHash(i + vec2f(1.0, 1.0));\n  return mix(mix(a, b, sm.x), mix(c, d, sm.x), sm.y);\n}\n\n// ── Bloom helpers ────────────────────────────────────────────\nfn glowShoulder(energy: vec3f) -> vec3f {\n  return vec3f(1.0) - exp(-max(energy, vec3f(0.0)));\n}\n\nfn glowHeadroom(baseRgb: vec3f, floorValue: f32) -> vec3f {\n  let luma = dot(baseRgb, vec3f(0.2126, 0.7152, 0.0722));\n  let head = mix(floorValue, 1.0, sqrt(clamp(1.0 - luma, 0.0, 1.0)));\n  return vec3f(head);\n}\n\n// ── 8 compass directions for bloom taps ──────────────────────\nconst BLOOM_OFFSETS = array<vec2f, 8>(\n  vec2f( 1.0,  0.0),\n  vec2f(-1.0,  0.0),\n  vec2f( 0.0,  1.0),\n  vec2f( 0.0, -1.0),\n  vec2f( 0.707,  0.707),\n  vec2f(-0.707,  0.707),\n  vec2f( 0.707, -0.707),\n  vec2f(-0.707, -0.707),\n);\n\n// ── Bloom: single ring accumulator (9 taps: center + 8) ─────\nfn bloomRing(\n  uv: vec2f,\n  radiusPx: f32,\n  threshold: f32,\n) -> vec3f {\n  let texel = vec2f(1.0) / u.resolution;\n  let radius = radiusPx * texel;\n\n  // Center tap\n  let sc = textureSample(sceneTexture, sceneSampler, uv);\n  let bc = max(sc.r, max(sc.g, sc.b));\n  var accum = sc.rgb * max(bc - threshold, 0.0) / max(bc, 0.001);\n\n  // 8 compass taps — no branching around textureSample\n  let s0 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[0] * radius);\n  let b0 = max(s0.r, max(s0.g, s0.b));\n  accum += s0.rgb * max(b0 - threshold, 0.0) / max(b0, 0.001);\n\n  let s1 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[1] * radius);\n  let b1 = max(s1.r, max(s1.g, s1.b));\n  accum += s1.rgb * max(b1 - threshold, 0.0) / max(b1, 0.001);\n\n  let s2 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[2] * radius);\n  let b2 = max(s2.r, max(s2.g, s2.b));\n  accum += s2.rgb * max(b2 - threshold, 0.0) / max(b2, 0.001);\n\n  let s3 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[3] * radius);\n  let b3 = max(s3.r, max(s3.g, s3.b));\n  accum += s3.rgb * max(b3 - threshold, 0.0) / max(b3, 0.001);\n\n  let s4 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[4] * radius);\n  let b4 = max(s4.r, max(s4.g, s4.b));\n  accum += s4.rgb * max(b4 - threshold, 0.0) / max(b4, 0.001);\n\n  let s5 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[5] * radius);\n  let b5 = max(s5.r, max(s5.g, s5.b));\n  accum += s5.rgb * max(b5 - threshold, 0.0) / max(b5, 0.001);\n\n  let s6 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[6] * radius);\n  let b6 = max(s6.r, max(s6.g, s6.b));\n  accum += s6.rgb * max(b6 - threshold, 0.0) / max(b6, 0.001);\n\n  let s7 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[7] * radius);\n  let b7 = max(s7.r, max(s7.g, s7.b));\n  accum += s7.rgb * max(b7 - threshold, 0.0) / max(b7, 0.001);\n\n  return accum / 9.0;\n}\n\n// =============================================================\n// Vertex shader — fullscreen triangle (3 verts, no buffer)\n// =============================================================\n@vertex\nfn vs(@builtin(vertex_index) i: u32) -> VOut {\n  var p = array<vec2f, 3>(\n    vec2f(-1.0, -1.0),\n    vec2f( 3.0, -1.0),\n    vec2f(-1.0,  3.0),\n  );\n  var o: VOut;\n  let q = p[i];\n  o.pos = vec4f(q, 0.0, 1.0);\n  o.uv  = vec2f((q.x + 1.0) * 0.5, 1.0 - (q.y + 1.0) * 0.5);\n  return o;\n}\n\n// =============================================================\n// Fragment shader — 6 effects in order\n// =============================================================\n@fragment\nfn fs(in: VOut) -> @location(0) vec4f {\n  let uv  = in.uv;\n  let cuv = uv - 0.5;                                  // centered UV [-0.5, 0.5]\n  let aspect = u.resolution.x / u.resolution.y;\n\n  // ── 1. Radial Chromatic Aberration (3 texture reads) ───────\n  let caDelta  = cuv * vec2f(aspect, 1.0);\n  let caRadial = clamp(length(caDelta) * 2.0, 0.0, 1.0);\n  let caWeight = pow(caRadial, 1.65);\n  let caAmt    = (u.caAmount + u.pulse * 0.012) * caWeight;\n  let caDir    = normalize(caDelta + vec2f(1e-5));      // NaN guard\n\n  var col: vec3f;\n  col.r = textureSample(sceneTexture, sceneSampler, uv + caDir * caAmt).r;\n  col.g = textureSample(sceneTexture, sceneSampler, uv).g;\n  col.b = textureSample(sceneTexture, sceneSampler, uv - caDir * caAmt).b;\n\n  // ── 2. Threshold Bloom (18 texture reads: 2 rings × 9) ────\n  //   Narrow ring: sharp white glow\n  let narrowBloom = bloomRing(uv, 8.0, u.bloomThreshold);\n  //   Wide ring: warm halation\n  let wideRaw     = bloomRing(uv, 35.0, u.bloomThreshold);\n  let warmTint    = vec3f(1.0, 0.85, 0.65);\n  let wideBloom   = wideRaw * mix(vec3f(1.0), warmTint, u.bloomWarmth);\n\n  let bloomEnergy = (narrowBloom + wideBloom) * u.bloomIntensity;\n  let glow        = glowShoulder(bloomEnergy) * glowHeadroom(col, 0.82);\n  // Screen blend\n  col = vec3f(1.0) - (vec3f(1.0) - col) * (vec3f(1.0) - glow);\n\n  // ── 3. Vignette (0 texture reads) ─────────────────────────\n  let vigBase = dot(cuv, cuv);\n  let vig     = 1.0 - pow(vigBase, 1.3) * u.vignetteStrength;\n  col *= vig;\n  // Warm shift at darkened edges (film edge color cast)\n  col = mix(col, col * vec3f(1.05, 0.95, 0.85),\n            (1.0 - vig) * u.vignetteWarmShift);\n\n  // ── 4. Light Leak (0 texture reads) ───────────────────────\n  // Left edge — amber\n  let leak1 = exp(-pow((cuv.x + 0.5) * 2.5, 2.0) * 4.0)\n            * (sin(u.time * 0.17) * 0.3 + 0.7) * 0.06;\n  // Right-top — deep orange\n  let leak2 = exp(-pow(length(cuv - vec2f(0.4, 0.3)) * 2.0, 2.0) * 3.0)\n            * max(sin(u.time * 0.41), 0.0) * 0.08;\n  // Drifting — gold\n  let leak3 = exp(-pow((cuv.x - sin(u.time * 0.28) * 0.55) * 1.1, 2.0) * 3.5)\n            * 0.10;\n\n  col += vec3f(0.95, 0.55, 0.20) * leak1 * u.leakIntensity;\n  col += vec3f(0.90, 0.40, 0.15) * leak2 * u.leakIntensity;\n  col += vec3f(0.95, 0.60, 0.25) * leak3 * u.leakIntensity;\n\n  // ── 5. Film Grain — Independent per-channel color noise ────\n  // Reference: noise_gradient.html — fully independent RGB noise with\n  // luminance-dependent amplitude (stronger in darks, weaker in highlights).\n  let pixelCoord = floor(in.uv * u.resolution);\n  let timeSeed   = floor(u.time * 24.0);                // 24fps temporal update\n\n  // Fully independent per-channel noise (NOT luma+chroma decomposition)\n  let nR = grainPixelHash(pixelCoord, timeSeed * 1.7) * 2.0 - 1.0;\n  let nG = grainPixelHash(pixelCoord, timeSeed * 2.3 + 500.0) * 2.0 - 1.0;\n  let nB = grainPixelHash(pixelCoord, timeSeed * 3.1 + 1000.0) * 2.0 - 1.0;\n\n  // Clump modulation — larger grain clusters for film-like texture\n  let clumpScale = mix(80.0, 20.0, u.grainSize);\n  let clump      = grainClumpNoise(pixelCoord, clumpScale);\n  let densityMod = mix(1.0, 0.3 + clump * 1.4, u.grainSize * 0.7);\n\n  // Luminance-dependent amplitude: darks get more grain, highlights less\n  let luma     = dot(col, vec3f(0.299, 0.587, 0.114));\n  let grainAmp = mix(1.4, 0.6, clamp(luma, 0.0, 1.0));  // 1.4× in shadows, 0.6× in highlights\n\n  // Radial mask\n  let grainCentre = cuv * vec2f(aspect, 1.0);\n  let grainDist   = length(grainCentre) / length(vec2f(aspect, 1.0) * 0.5);\n  let grainRadial = pow(clamp(grainDist, 0.0, 1.0), 1.65);\n  let grainMask   = mix(1.0, grainRadial, u.grainRadialMix);\n\n  let w = u.grainIntensity * grainMask * densityMod * grainAmp;\n  col.r += nR * w;\n  col.g += nG * w;\n  col.b += nB * w;\n\n  // ── 6. Tonemap (0 texture reads) ──────────────────────────\n  // Shadow warm lift — film D-min: blacks are never true black\n  col += vec3f(u.shadowLift,\n               u.shadowLift * 0.67,\n               u.shadowLift * 0.33);\n  // Reinhard compression\n  col = col / (vec3f(1.0) + col * u.tonemapCompression);\n  // Gamma\n  col = pow(col, vec3f(0.92));\n\n  // ── Final clamp ───────────────────────────────────────────\n  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);\n}\n", t = {
	grainIntensity: .1,
	grainSize: .3,
	grainRadialMix: .6,
	caAmount: .003,
	bloomThreshold: .65,
	bloomIntensity: .45,
	bloomWarmth: .25,
	vignetteStrength: .85,
	vignetteWarmShift: .3,
	leakIntensity: .25,
	shadowLift: .012,
	tonemapCompression: .35
};
//#endregion
//#region src/pipeline.ts
function n(e) {
	return {
		grainIntensity: e?.grain?.intensity ?? t.grainIntensity,
		grainSize: e?.grain?.size ?? t.grainSize,
		grainRadialMix: e?.grain?.radialMix ?? t.grainRadialMix,
		caAmount: e?.chromaticAberration?.amount ?? t.caAmount,
		bloomThreshold: e?.bloom?.threshold ?? t.bloomThreshold,
		bloomIntensity: e?.bloom?.intensity ?? t.bloomIntensity,
		bloomWarmth: e?.bloom?.warmth ?? t.bloomWarmth,
		vignetteStrength: e?.vignette?.strength ?? t.vignetteStrength,
		vignetteWarmShift: e?.vignette?.warmShift ?? t.vignetteWarmShift,
		leakIntensity: e?.lightLeak?.intensity ?? t.leakIntensity,
		shadowLift: e?.tonemap?.shadowLift ?? t.shadowLift,
		tonemapCompression: e?.tonemap?.compression ?? t.tonemapCompression
	};
}
function r(e, t) {
	return {
		grainIntensity: t.grain?.intensity ?? e.grainIntensity,
		grainSize: t.grain?.size ?? e.grainSize,
		grainRadialMix: t.grain?.radialMix ?? e.grainRadialMix,
		caAmount: t.chromaticAberration?.amount ?? e.caAmount,
		bloomThreshold: t.bloom?.threshold ?? e.bloomThreshold,
		bloomIntensity: t.bloom?.intensity ?? e.bloomIntensity,
		bloomWarmth: t.bloom?.warmth ?? e.bloomWarmth,
		vignetteStrength: t.vignette?.strength ?? e.vignetteStrength,
		vignetteWarmShift: t.vignette?.warmShift ?? e.vignetteWarmShift,
		leakIntensity: t.lightLeak?.intensity ?? e.leakIntensity,
		shadowLift: t.tonemap?.shadowLift ?? e.shadowLift,
		tonemapCompression: t.tonemap?.compression ?? e.tonemapCompression
	};
}
var i = 16, a = i * 4;
function o(t, o, s) {
	let c = t.createShaderModule({
		label: "film-post composite",
		code: e
	}), l = t.createRenderPipeline({
		label: "film-post pipeline",
		layout: "auto",
		vertex: {
			module: c,
			entryPoint: "vs"
		},
		fragment: {
			module: c,
			entryPoint: "fs",
			targets: [{ format: o }]
		},
		primitive: { topology: "triangle-list" }
	}), u = t.createBuffer({
		label: "film-post uniforms",
		size: a,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	}), d = t.createSampler({
		label: "film-post sampler",
		magFilter: "linear",
		minFilter: "linear",
		addressModeU: "clamp-to-edge",
		addressModeV: "clamp-to-edge"
	}), f = n(s), p = 0, m = 0, h = null, g = null, _ = new Float32Array(i);
	function v(e, n, r, i) {
		_[0] = i.time, _[1] = i.pulse ?? 0, _[2] = p, _[3] = m, _[4] = f.grainIntensity, _[5] = f.grainSize, _[6] = f.caAmount, _[7] = f.bloomThreshold, _[8] = f.bloomIntensity, _[9] = f.bloomWarmth, _[10] = f.vignetteStrength, _[11] = f.vignetteWarmShift, _[12] = f.leakIntensity, _[13] = f.shadowLift, _[14] = f.tonemapCompression, _[15] = f.grainRadialMix, t.queue.writeBuffer(u, 0, _), n !== h && (g = t.createBindGroup({
			label: "film-post bind group",
			layout: l.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: u }
				},
				{
					binding: 1,
					resource: d
				},
				{
					binding: 2,
					resource: n
				}
			]
		}), h = n);
		let a = e.beginRenderPass({
			label: "film-post pass",
			colorAttachments: [{
				view: r,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				},
				loadOp: "clear",
				storeOp: "store"
			}]
		});
		a.setPipeline(l), a.setBindGroup(0, g), a.draw(3), a.end();
	}
	function y(e, t) {
		p = e, m = t;
	}
	function b(e) {
		f = r(f, e);
	}
	function x() {
		u.destroy(), g = null, h = null;
	}
	return {
		render: v,
		resize: y,
		updateConfig: b,
		destroy: x
	};
}
//#endregion
export { o as createFilmPostPipeline };
