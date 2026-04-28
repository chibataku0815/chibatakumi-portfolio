//#region src/metaball-types.ts
var e = 8, t = 32, n = "// prism-caustic.wgsl — Chromatic dispersion along curved caustic lines\n// Model: curved line in warped UV → perpendicular distance → spectral bands\n\nstruct Uniforms {\n  resolution:   vec2f,  //  0\n  time:         f32,    //  8\n  speed:        f32,    // 12\n  warpStrength: f32,    // 16\n  warpScale:    f32,    // 20\n  bandWidth:    f32,    // 24  (width of spectral spread)\n  brightness:   f32,    // 28\n};\n// 32 bytes\n\n@group(0) @binding(0) var<uniform> u: Uniforms;\n\n// ── Noise ─────────────────────────────────────────────────────\n\nfn hash21(p: vec2f) -> f32 {\n  let q = fract(p * vec2f(123.34, 456.21));\n  let d = dot(q, q + 45.32);\n  return fract(q.x * q.y + d);\n}\n\nfn noise2(p: vec2f) -> f32 {\n  let i = floor(p);\n  let f = fract(p);\n  let w = f * f * (3.0 - 2.0 * f);\n  return mix(\n    mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), w.x),\n    mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), w.x),\n    w.y\n  );\n}\n\nfn fbm(p: vec2f, oct: i32) -> f32 {\n  var v = 0.0; var a = 0.5; var freq = 1.0; var pos = p;\n  for (var i = 0; i < oct; i++) {\n    v += noise2(pos * freq) * a;\n    freq *= 2.03; a *= 0.5; pos += vec2f(1.7, 9.2);\n  }\n  return v;\n}\n\n// ── Spectrum ──────────────────────────────────────────────────\n// Sharp, saturated bands with dark gaps between them\n\nfn spectrum(t: f32) -> vec3f {\n  let tt = clamp(t, 0.0, 1.0);\n\n  // Each channel is a narrow bump → distinct color bands with gaps\n  let r = exp(-pow((tt - 0.1) / 0.08, 2.0))\n        + exp(-pow((tt - 0.92) / 0.06, 2.0)) * 0.3;  // red + violet edge\n  let orange = exp(-pow((tt - 0.22) / 0.06, 2.0));\n  let yellow = exp(-pow((tt - 0.33) / 0.05, 2.0));\n  let g = exp(-pow((tt - 0.45) / 0.07, 2.0));\n  let cyan = exp(-pow((tt - 0.55) / 0.05, 2.0));\n  let b = exp(-pow((tt - 0.68) / 0.08, 2.0));\n  let violet = exp(-pow((tt - 0.82) / 0.07, 2.0));\n\n  return vec3f(\n    r + orange * 0.9 + yellow * 0.9,\n    orange * 0.5 + yellow * 0.9 + g + cyan * 0.7,\n    cyan * 0.5 + b + violet * 0.8\n  );\n}\n\n// ── UV warp (fabric undulation) ───────────────────────────────\n\nfn warpUV(p: vec2f, t: f32) -> vec2f {\n  let s = u.warpStrength;\n  let sc = u.warpScale;\n\n  var dx = sin(p.y * sc * 0.8 + t * 0.4) * 0.25\n         + sin(p.x * sc * 0.5 - t * 0.3) * 0.15\n         + fbm(p * sc * 0.35 + vec2f(t * 0.12, 0.0), 3) * 0.6;\n\n  var dy = cos(p.x * sc * 0.7 + t * 0.35) * 0.2\n         + sin(p.y * sc * 0.6 + t * 0.25) * 0.15\n         + fbm(p * sc * 0.35 + vec2f(0.0, t * 0.1), 3) * 0.5;\n\n  return p + vec2f(dx, dy) * s;\n}\n\n// ── Distance from a caustic line ──────────────────────────────\n// Each \"line\" is defined by a parametric curve; we find closest distance\n\nfn causticDist(p: vec2f, lineY: f32, curvature: f32, t: f32) -> f32 {\n  // The line is roughly horizontal at y=lineY, with curvature bending it\n  // In warped space, this creates a sweeping arc\n  let curveOffset = curvature * (p.x * p.x) + sin(p.x * 2.0 + t * 0.5) * 0.03;\n  return p.y - lineY - curveOffset;\n}\n\n// ── Vertex ────────────────────────────────────────────────────\n\n@vertex\nfn vsMain(@builtin(vertex_index) vid: u32) -> @builtin(position) vec4f {\n  var pos = array<vec2f, 3>(\n    vec2f(-1.0, -3.0), vec2f(-1.0, 1.0), vec2f(3.0, 1.0)\n  );\n  return vec4f(pos[vid], 0.0, 1.0);\n}\n\n// ── Fragment ──────────────────────────────────────────────────\n\n@fragment\nfn fsMain(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {\n  let uv = fragCoord.xy / u.resolution;\n  let aspect = u.resolution.x / u.resolution.y;\n  let p = vec2f((uv.x - 0.5) * aspect, uv.y - 0.5);\n  let t = u.time * u.speed;\n\n  // Warp UV — this creates the carpet-like undulation\n  let wp = warpUV(p, t);\n\n  var color = vec3f(0.0);\n  let bw = u.bandWidth;\n\n  // 2-3 caustic lines at different Y positions\n  for (var i = 0; i < 3; i++) {\n    let fi = f32(i);\n    let lineY = -0.15 + fi * 0.12 + sin(t * 0.2 + fi * 2.0) * 0.05;\n    let curvature = 0.3 + fi * 0.15;\n\n    // Signed distance from the caustic line (in warped space)\n    let sd = causticDist(wp, lineY, curvature, t + fi * 1.3);\n\n    // Map signed distance → spectral position\n    // Positive side = red→orange→yellow, negative side = green→blue→violet\n    let spectralPos = clamp(sd / bw + 0.5, 0.0, 1.0);\n\n    // Intensity: strongest near the line, falls off sharply\n    let intensity = exp(-sd * sd / (bw * bw * 0.5));\n\n    // White core right on the line\n    let core = exp(-sd * sd / (bw * bw * 0.02));\n\n    // Spectral color for this distance\n    let bandColor = spectrum(spectralPos);\n\n    color += bandColor * intensity * u.brightness * (0.5 + fi * 0.1);\n    color += vec3f(0.95, 0.92, 0.88) * core * u.brightness * 0.8;\n  }\n\n  // Ensure deep blacks where there's no light\n  // (no ambient, no fill light — pure black background)\n\n  // Very subtle grain\n  let grain = (hash21(floor(fragCoord.xy * 0.9 + vec2f(t * 40.0, t * 17.0))) - 0.5) * 0.01;\n  color += grain;\n\n  return vec4f(max(color, vec3f(0.0)), 1.0);\n}\n", r = {
	speed: .5,
	warpStrength: .35,
	warpScale: 1.8,
	bandWidth: .12,
	brightness: 1.8
}, i = 32;
function a(e, t, a, o) {
	let s = {
		...r,
		...o
	}, c = t, l = a, u = new Float32Array(i / 4), d = e.createBuffer({
		size: i,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	}), f = e.createShaderModule({
		label: "prism-caustic",
		code: n
	}), p = e.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: { type: "uniform" }
	}] }), m = e.createRenderPipeline({
		label: "prism-caustic",
		layout: e.createPipelineLayout({ bindGroupLayouts: [p] }),
		vertex: {
			module: f,
			entryPoint: "vsMain"
		},
		fragment: {
			module: f,
			entryPoint: "fsMain",
			targets: [{ format: "rgba16float" }]
		},
		primitive: { topology: "triangle-list" }
	}), h = e.createBindGroup({
		layout: p,
		entries: [{
			binding: 0,
			resource: { buffer: d }
		}]
	});
	return {
		render(t, n, r) {
			u[0] = c, u[1] = l, u[2] = r, u[3] = s.speed, u[4] = s.warpStrength, u[5] = s.warpScale, u[6] = s.bandWidth, u[7] = s.brightness, e.queue.writeBuffer(d, 0, u);
			let i = t.beginRenderPass({ colorAttachments: [{
				view: n,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				},
				loadOp: "clear",
				storeOp: "store"
			}] });
			i.setPipeline(m), i.setBindGroup(0, h), i.draw(3), i.end();
		},
		resize(e, t) {
			c = e, l = t;
		},
		updateConfig(e) {
			s = {
				...s,
				...e
			};
		},
		getConfig() {
			return { ...s };
		},
		destroy() {
			d.destroy();
		}
	};
}
//#endregion
//#region src/aurora/shader.wgsl?raw
var o = "// aurora.wgsl — iOS aurora gradient wallpaper reproduction\n// 2-layer composition: vertical color ramp × egg-shaped luminous body\n// All color mixing in Oklab; triangular dither for anti-banding\n\nstruct AuroraUniforms {\n  resolution:    vec2f,   //  0..7\n  time:          f32,     //  8..11\n  animSpeed:     f32,     // 12..15\n  horizonY:      f32,     // 16..19\n  warmth:        f32,     // 20..23\n  coolness:      f32,     // 24..27\n  envelopeWidth: f32,     // 28..31\n  glowIntensity: f32,     // 32..35\n  brightness:    f32,     // 36..39\n  ditherSeed:    f32,     // 40..43\n  _pad:          f32,     // 44..47\n};\n\n@group(0) @binding(0) var<uniform> u: AuroraUniforms;\n\n// ── Oklab conversions ─────────────────────────────────────────\n\nfn linearSrgbToOklab(c: vec3f) -> vec3f {\n  let l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;\n  let m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;\n  let s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;\n  let l_ = pow(max(l, 0.0), 1.0 / 3.0);\n  let m_ = pow(max(m, 0.0), 1.0 / 3.0);\n  let s_ = pow(max(s, 0.0), 1.0 / 3.0);\n  return vec3f(\n    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,\n    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,\n    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,\n  );\n}\n\nfn oklabToLinearSrgb(c: vec3f) -> vec3f {\n  let l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;\n  let m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;\n  let s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;\n  let l = l_ * l_ * l_;\n  let m = m_ * m_ * m_;\n  let s = s_ * s_ * s_;\n  return vec3f(\n     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,\n    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,\n    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,\n  );\n}\n\nfn srgbToLinear(c: vec3f) -> vec3f {\n  return vec3f(\n    select(pow((c.r + 0.055) / 1.055, 2.4), c.r / 12.92, c.r <= 0.04045),\n    select(pow((c.g + 0.055) / 1.055, 2.4), c.g / 12.92, c.g <= 0.04045),\n    select(pow((c.b + 0.055) / 1.055, 2.4), c.b / 12.92, c.b <= 0.04045),\n  );\n}\n\n// ── Triangular dither ─────────────────────────────────────────\n\nfn hash2d(p: vec2f) -> f32 {\n  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);\n}\n\nfn hashTriangular(uv: vec2f, seed: f32) -> f32 {\n  let r0 = hash2d(uv + vec2f(seed, 0.0));\n  let r1 = hash2d(uv + vec2f(0.0, seed + 71.37));\n  return r0 + r1 - 1.0;\n}\n\n// ── Vertical color ramp (8 hardcoded stops) ───────────────────\n// y=0 top, y=1 bottom.\n// Orange/amber at top → blue at bottom. No white/cyan band.\n\nfn verticalRamp(y: f32) -> vec3f {\n  // 8 stops: 3 warm → 2 transition → 3 cool\n  // Transition uses saturated intermediates (golden → teal) to avoid muddy brown\n  var pos = array<f32, 8>(\n    0.00, 0.12, 0.28, 0.40, 0.48, 0.60, 0.78, 1.00\n  );\n  var col = array<vec3f, 8>(\n    vec3f(0.450, 0.175, 0.040),  // warm orange (top)\n    vec3f(0.900, 0.440, 0.070),  // vivid orange\n    vec3f(0.920, 0.600, 0.160),  // bright amber\n    vec3f(0.850, 0.720, 0.300),  // bright golden (warm edge of transition)\n    vec3f(0.120, 0.450, 0.750),  // teal-blue (cool edge of transition)\n    vec3f(0.040, 0.260, 0.780),  // vivid blue\n    vec3f(0.012, 0.055, 0.280),  // deep blue\n    vec3f(0.005, 0.012, 0.080),  // dark navy (bottom)\n  );\n\n  var lo = 0;\n  for (var i = 1; i < 8; i++) {\n    if (pos[i] <= y) { lo = i; }\n  }\n  let hi = min(lo + 1, 7);\n  let segT = saturate((y - pos[lo]) / max(pos[hi] - pos[lo], 1e-6));\n\n  let linLo = srgbToLinear(col[lo]);\n  let linHi = srgbToLinear(col[hi]);\n  let labLo = linearSrgbToOklab(linLo);\n  let labHi = linearSrgbToOklab(linHi);\n  return oklabToLinearSrgb(mix(labLo, labHi, segT));\n}\n\n// ── Egg-shaped luminous body ──────────────────────────────────\n// The shape is like a vertical egg/teardrop:\n//   - Wide at the top (warm orange fills most of the upper screen)\n//   - Narrows continuously toward the bottom (blue column)\n// Aspect-ratio aware: works in normalized pixel coordinates.\n\nfn bodyMask(px: vec2f, aTime: f32) -> f32 {\n  let aspect = u.resolution.x / u.resolution.y;\n\n  // Work in aspect-corrected coordinates centered at (0.5, 0)\n  // x: [-0.5..0.5] scaled by aspect, y: [0..1]\n  let cx = (px.x - 0.5) * aspect;\n  let cy = px.y;\n\n  // Half-width of the body at each y level\n  // Wide at top, narrow at bottom — smooth curve\n  let topWidth = u.envelopeWidth * aspect * 0.9;\n  let botWidth = u.envelopeWidth * aspect * 0.18;\n  // Use a power curve for the taper: more gradual at top, faster narrowing below\n  let t = pow(saturate(cy), 1.8);\n  let halfW = mix(topWidth, botWidth, t);\n\n  // Gaussian-like soft edge (no hard boundary)\n  let norm = abs(cx) / max(halfW, 0.001);\n  // Softer at top (power ~2 = gaussian), sharper at bottom (power ~3.5)\n  let power = mix(2.0, 3.5, t);\n  return exp(-pow(norm, power));\n}\n\n// ── Vertex (fullscreen triangle) ──────────────────────────────\n\nstruct VsOut {\n  @builtin(position) pos: vec4f,\n  @location(0) uv: vec2f,\n};\n\n@vertex\nfn vsMain(@builtin(vertex_index) vid: u32) -> VsOut {\n  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;\n  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;\n  var out: VsOut;\n  out.pos = vec4f(x, y, 0.0, 1.0);\n  out.uv = vec2f((x + 1.0) * 0.5, (1.0 - y) * 0.5);\n  return out;\n}\n\n// ── Fragment ──────────────────────────────────────────────────\n\n@fragment\nfn fsMain(in: VsOut) -> @location(0) vec4f {\n  let uv = in.uv;\n  let aTime = u.time * u.animSpeed;\n\n  // Color ramp (orange top → blue bottom)\n  var baseColor = verticalRamp(uv.y);\n\n  // Warmth/coolness modulation on Oklab lightness\n  var lab = linearSrgbToOklab(baseColor);\n  let warmCool = select(u.coolness, u.warmth, uv.y < u.horizonY);\n  lab.x *= warmCool;\n  baseColor = oklabToLinearSrgb(lab);\n\n  // Egg-shaped body mask (wide top, narrow bottom)\n  let mask = bodyMask(uv, aTime);\n\n  // Simple composite: black outside, color inside\n  var color = baseColor * mask * u.brightness;\n\n  // Clamp negatives\n  color = max(color, vec3f(0.0));\n\n  // Anti-banding dither\n  let dither = hashTriangular(in.pos.xy, u.ditherSeed) * (0.5 / 255.0);\n  color += vec3f(dither);\n\n  return vec4f(color, 1.0);\n}\n", s = {
	horizonY: .42,
	warmth: 1.2,
	coolness: 1,
	envelopeWidth: .45,
	glowIntensity: 1,
	brightness: 1.4,
	animSpeed: .15
}, c = 48;
function l(e, t, n, r) {
	let i = {
		...s,
		...r
	}, a = t, l = n, u = new Float32Array(c / 4), d = e.createBuffer({
		size: c,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	}), f = e.createShaderModule({
		label: "aurora",
		code: o
	}), p = e.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: { type: "uniform" }
	}] }), m = e.createRenderPipeline({
		label: "aurora",
		layout: e.createPipelineLayout({ bindGroupLayouts: [p] }),
		vertex: {
			module: f,
			entryPoint: "vsMain"
		},
		fragment: {
			module: f,
			entryPoint: "fsMain",
			targets: [{ format: "rgba16float" }]
		},
		primitive: { topology: "triangle-list" }
	}), h = e.createBindGroup({
		layout: p,
		entries: [{
			binding: 0,
			resource: { buffer: d }
		}]
	});
	return {
		render(t, n, r) {
			u[0] = a, u[1] = l, u[2] = r, u[3] = i.animSpeed, u[4] = i.horizonY, u[5] = i.warmth, u[6] = i.coolness, u[7] = i.envelopeWidth, u[8] = i.glowIntensity, u[9] = i.brightness, u[10] = r, u[11] = 0, e.queue.writeBuffer(d, 0, u);
			let o = t.beginRenderPass({ colorAttachments: [{
				view: n,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				},
				loadOp: "clear",
				storeOp: "store"
			}] });
			o.setPipeline(m), o.setBindGroup(0, h), o.draw(3), o.end();
		},
		resize(e, t) {
			a = e, l = t;
		},
		updateConfig(e) {
			i = {
				...i,
				...e
			};
		},
		getConfig() {
			return { ...i };
		},
		destroy() {
			d.destroy();
		}
	};
}
//#endregion
//#region src/spectrum-fan/shader.wgsl?raw
var u = "// spectrum-fan.wgsl — Smooth parallelogram fan with visible light spectrum\n// SDF-based soft edges, gaussian glow, dithering for poster-grade quality\n\nstruct Uniforms {\n  resolution:     vec2f,\n  time:           f32,\n  shapeCount:     f32,\n  fanAngle:       f32,\n  fanRotation:    f32,\n  pivotX:         f32,\n  pivotY:         f32,\n  shapeWidth:     f32,\n  shapeHeight:    f32,\n  opacity:        f32,\n  brightness:     f32,\n  bgColor:        vec4f,\n  skewAngle:      f32,\n  separation:     f32,\n  hueShift:       f32,\n  saturation:     f32,\n  warmth:         f32,\n  bgBrightness:   f32,\n  glowIntensity:  f32,\n  _pad:           vec3f,\n};\n\n@group(0) @binding(0) var<uniform> u: Uniforms;\n\nfn rot2(angle: f32) -> mat2x2f {\n  let c = cos(angle);\n  let s = sin(angle);\n  return mat2x2f(c, s, -s, c);\n}\n\nfn sdBox(p: vec2f, halfSize: vec2f) -> f32 {\n  let d = abs(p) - halfSize;\n  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);\n}\n\nfn sdParallelogram(p: vec2f, center: vec2f, angle: f32, halfSize: vec2f, skew: f32) -> f32 {\n  var q = p - center;\n  q = rot2(-angle) * q;\n  q.x -= q.y * tan(skew);\n  return sdBox(q, halfSize);\n}\n\n// CIE 1931 approximate spectrum — Wyman/Sloan/Shirley 2013 Gaussian fit\nfn gaussBump(x: f32, mu: f32, sigmaL: f32, sigmaR: f32) -> f32 {\n  let sigma = select(sigmaR, sigmaL, x < mu);\n  let dx = (x - mu) / sigma;\n  return exp(-0.5 * dx * dx);\n}\n\nfn spectrumSmooth(t: f32) -> vec3f {\n  let wl = mix(380.0, 700.0, t);\n  let x =  1.056 * gaussBump(wl, 599.8, 37.9, 31.0)\n         + 0.362 * gaussBump(wl, 442.0, 16.0, 26.7)\n         - 0.065 * gaussBump(wl, 501.1, 20.4, 26.2);\n  let y =  0.821 * gaussBump(wl, 568.8, 46.9, 40.5)\n         + 0.286 * gaussBump(wl, 530.9, 16.3, 31.1);\n  let z =  1.217 * gaussBump(wl, 437.0, 11.8, 36.0)\n         + 0.681 * gaussBump(wl, 459.0, 26.0, 13.8);\n  let r =  3.2404542 * x - 1.5371385 * y - 0.4985314 * z;\n  let g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;\n  let b =  0.0556434 * x - 0.2040259 * y + 1.0572252 * z;\n  return max(vec3f(r, g, b), vec3f(0.0));\n}\n\nfn hash2d(p: vec2f) -> f32 {\n  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);\n}\n\nfn triangularDither(p: vec2f) -> f32 {\n  let r0 = hash2d(p);\n  let r1 = hash2d(p + vec2f(71.37, 0.0));\n  return r0 + r1 - 1.0;\n}\n\nfn linearSrgbToOklab(c: vec3f) -> vec3f {\n  let l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;\n  let m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;\n  let s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;\n  let l_ = pow(max(l, 0.0), 1.0 / 3.0);\n  let m_ = pow(max(m, 0.0), 1.0 / 3.0);\n  let s_ = pow(max(s, 0.0), 1.0 / 3.0);\n  return vec3f(\n    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,\n    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,\n    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,\n  );\n}\n\nfn oklabToLinearSrgb(c: vec3f) -> vec3f {\n  let l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;\n  let m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;\n  let s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;\n  let l = l_ * l_ * l_;\n  let m = m_ * m_ * m_;\n  let s = s_ * s_ * s_;\n  return vec3f(\n     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,\n    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,\n    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,\n  );\n}\n\nfn colorTransform(linearColor: vec3f, hueShift: f32, sat: f32, warm: f32) -> vec3f {\n  var lab = linearSrgbToOklab(linearColor);\n  let cosH = cos(hueShift);\n  let sinH = sin(hueShift);\n  let a = lab.y * cosH - lab.z * sinH;\n  let b = lab.y * sinH + lab.z * cosH;\n  lab.y = a * sat;\n  lab.z = b * sat;\n  lab.y += warm * 0.03;\n  lab.z -= warm * 0.015;\n  return max(oklabToLinearSrgb(lab), vec3f(0.0));\n}\n\nstruct VsOut {\n  @builtin(position) pos: vec4f,\n  @location(0) uv: vec2f,\n};\n\n@vertex\nfn vsMain(@builtin(vertex_index) vid: u32) -> VsOut {\n  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;\n  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;\n  var out: VsOut;\n  out.pos = vec4f(x, y, 0.0, 1.0);\n  out.uv = vec2f((x + 1.0) * 0.5, (1.0 - y) * 0.5);\n  return out;\n}\n\n@fragment\nfn fsMain(in: VsOut) -> @location(0) vec4f {\n  let uv = in.uv;\n  let aspect = u.resolution.x / u.resolution.y;\n  let p = vec2f((uv.x - u.pivotX) * aspect, uv.y - u.pivotY);\n\n  let N = i32(u.shapeCount);\n  let halfSize = vec2f(u.shapeWidth, u.shapeHeight);\n\n  // Wide feather — bokeh-like soft focus effect\n  let feather = max(u.shapeWidth * 3.0, 0.015);\n  // Glow radius — color bleeds well beyond shape\n  let glowRadius = max(u.shapeWidth * 8.0, 0.05);\n  // Atmosphere — very wide subtle color tinting\n  let atmosRadius = max(u.shapeWidth * 20.0, 0.12);\n  // Shadow offset\n  let shadowOff = vec2f(0.006 * aspect, 0.008);\n\n  var transmittance = vec3f(1.0);\n  var glowAccum = vec3f(0.0);\n\n  for (var i = 0; i < N; i++) {\n    let fi = f32(i);\n    let fN = f32(N);\n    let t = fi / max(fN - 1.0, 1.0);\n\n    let angle = u.fanRotation + (t - 0.5) * u.fanAngle;\n    let dir = vec2f(cos(angle), sin(angle));\n    let cascadeDist = u.separation + t * u.separation * 1.5;\n    let center = dir * cascadeDist;\n\n    let dist = sdParallelogram(p, center, angle, halfSize, u.skewAngle);\n\n    // Soft shape mask — very wide feather for dreamy look\n    let shapeMask = 1.0 - smoothstep(-feather, feather, dist);\n\n    // Glow masks for color bleed\n    let glowMask = exp(-max(dist, 0.0) * max(dist, 0.0) / (glowRadius * glowRadius));\n    let atmosMask = exp(-max(dist, 0.0) * max(dist, 0.0) / (atmosRadius * atmosRadius));\n\n    let rawSpectral = spectrumSmooth(t) * u.brightness;\n    let spectralColor = colorTransform(rawSpectral, u.hueShift, u.saturation, u.warmth);\n\n    // Per-shape opacity falloff — top shapes (high t) fade toward gray\n    let shapeOpacity = u.opacity * (1.0 - t * 0.35);\n\n    // Shadow — offset dark tint behind shape\n    let shadowDist = sdParallelogram(p + shadowOff, center, angle, halfSize, u.skewAngle);\n    let shadowMask = (1.0 - smoothstep(-feather * 0.5, feather * 1.5, shadowDist)) * 0.12;\n    transmittance *= mix(vec3f(1.0), vec3f(0.35), shadowMask);\n\n    // Combined transmittance mask — shape + glow bleed into light background\n    let combinedMask = shapeMask\n                     + glowMask * u.glowIntensity * 0.4\n                     + atmosMask * u.glowIntensity * 0.08;\n    let filterAlpha = clamp(combinedMask * shapeOpacity, 0.0, 1.0);\n    let filterTransmit = mix(vec3f(1.0), spectralColor, filterAlpha);\n    transmittance *= filterTransmit;\n\n    // Additive glow — only visible on dark backgrounds\n    glowAccum += spectralColor * glowMask * u.glowIntensity * 0.2;\n    glowAccum += spectralColor * atmosMask * u.glowIntensity * 0.04;\n  }\n\n  let bg = u.bgColor.rgb;\n  // Adaptive compositing: transmittance for light bg, additive glow for dark bg\n  let additiveMix = clamp(1.0 - u.bgBrightness * 1.5, 0.0, 1.0);\n  var color = bg * transmittance + glowAccum * additiveMix;\n\n  // Triangular dither to eliminate banding\n  color += vec3f(triangularDither(in.pos.xy) * (0.5 / 255.0));\n  color = max(color, vec3f(0.0));\n\n  return vec4f(color, 1.0);\n}\n", d = {
	shapeCount: 12,
	fanAngle: 1,
	fanRotation: 2.4,
	pivotX: .85,
	pivotY: .9,
	shapeWidth: .028,
	shapeHeight: .5,
	opacity: .75,
	brightness: 1.5,
	skewAngle: .35,
	separation: .16,
	glowIntensity: .6,
	hueShift: 0,
	saturation: 1,
	warmth: .3,
	bgBrightness: .82
}, f = [
	{
		name: "acrylic-light",
		label: "Acrylic Light",
		config: {}
	},
	{
		name: "dark-prism",
		label: "Dark Prism",
		config: {
			bgBrightness: .06,
			warmth: 0,
			brightness: 2,
			glowIntensity: .7,
			opacity: .6
		}
	},
	{
		name: "moonlight",
		label: "Moonlight",
		config: {
			bgBrightness: .05,
			hueShift: 1.5,
			saturation: .8,
			warmth: -.7,
			brightness: 1.8,
			glowIntensity: .6
		}
	},
	{
		name: "golden-hour",
		label: "Golden Hour",
		config: {
			bgBrightness: .78,
			hueShift: -.4,
			saturation: 1.4,
			warmth: .8,
			brightness: 1.6,
			glowIntensity: .5
		}
	},
	{
		name: "neon-night",
		label: "Neon Night",
		config: {
			bgBrightness: .03,
			saturation: 1.6,
			brightness: 2.2,
			glowIntensity: .8,
			warmth: 0
		}
	}
];
function p(e, t) {
	let n = e;
	return [
		Math.max(0, n + t * .03),
		Math.max(0, n),
		Math.max(0, n - t * .02),
		1
	];
}
var m = 112;
function h(e, t, n, r) {
	let i = {
		...d,
		...r
	}, a = t, o = n, s = new Float32Array(28), c = e.createBuffer({
		size: m,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	}), l = e.createShaderModule({
		label: "spectrum-fan",
		code: u
	}), f = e.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: { type: "uniform" }
	}] }), h = e.createRenderPipeline({
		label: "spectrum-fan",
		layout: e.createPipelineLayout({ bindGroupLayouts: [f] }),
		vertex: {
			module: l,
			entryPoint: "vsMain"
		},
		fragment: {
			module: l,
			entryPoint: "fsMain",
			targets: [{ format: "rgba16float" }]
		},
		primitive: { topology: "triangle-list" }
	}), g = e.createBindGroup({
		layout: f,
		entries: [{
			binding: 0,
			resource: { buffer: c }
		}]
	});
	return {
		render(t, n, r) {
			let l = p(i.bgBrightness, i.warmth);
			s[0] = a, s[1] = o, s[2] = r, s[3] = i.shapeCount, s[4] = i.fanAngle, s[5] = i.fanRotation, s[6] = i.pivotX, s[7] = i.pivotY, s[8] = i.shapeWidth, s[9] = i.shapeHeight, s[10] = i.opacity, s[11] = i.brightness, s[12] = l[0], s[13] = l[1], s[14] = l[2], s[15] = l[3], s[16] = i.skewAngle, s[17] = i.separation, s[18] = i.hueShift, s[19] = i.saturation, s[20] = i.warmth, s[21] = i.bgBrightness, s[22] = i.glowIntensity, s[23] = 0, s[24] = 0, s[25] = 0, s[26] = 0, s[27] = 0, e.queue.writeBuffer(c, 0, s);
			let u = t.beginRenderPass({ colorAttachments: [{
				view: n,
				clearValue: {
					r: l[0],
					g: l[1],
					b: l[2],
					a: 1
				},
				loadOp: "clear",
				storeOp: "store"
			}] });
			u.setPipeline(h), u.setBindGroup(0, g), u.draw(3), u.end();
		},
		resize(e, t) {
			a = e, o = t;
		},
		updateConfig(e) {
			i = {
				...i,
				...e
			};
		},
		getConfig() {
			return { ...i };
		},
		destroy() {
			c.destroy();
		}
	};
}
//#endregion
//#region src/margin-glow/shader.wgsl?raw
var g = "struct MarginGlowUniforms {\n  resolution:          vec2f,\n  time:                f32,\n  motionSpeed:         f32,\n  pillarWidth:         f32,\n  pillarHeight:        f32,\n  bottomRadius:        f32,\n  pillarX:             f32,\n  pillarY:             f32,\n  edgeSoftness:        f32,\n  haloIntensity:       f32,\n  pinkIntensity:       f32,\n  yellowGreenIntensity:f32,\n  whiteCoreIntensity:  f32,\n  brightness:          f32,\n  motionAmount:        f32,\n  twistAmount:         f32,\n  wobbleAmount:        f32,\n  wobbleFrequency:     f32,\n  twistCycles:         f32,\n  wobbleHarmonic:      f32,\n  ditherSeed:          f32,\n  // --- high-level color controls ---\n  hueShift:            f32,\n  saturation:          f32,\n  warmth:              f32,\n  bgBrightness:        f32,\n  _pad0:               f32,\n  _pad1:               f32,\n  _pad2:               f32,\n};\n\n@group(0) @binding(0) var<uniform> u: MarginGlowUniforms;\n\nstruct VsOut {\n  @builtin(position) pos: vec4f,\n  @location(0) uv: vec2f,\n};\n\nfn clamp01(x: f32) -> f32 {\n  return clamp(x, 0.0, 1.0);\n}\n\nfn srgbToLinear(c: vec3f) -> vec3f {\n  return vec3f(\n    select(pow((c.r + 0.055) / 1.055, 2.4), c.r / 12.92, c.r <= 0.04045),\n    select(pow((c.g + 0.055) / 1.055, 2.4), c.g / 12.92, c.g <= 0.04045),\n    select(pow((c.b + 0.055) / 1.055, 2.4), c.b / 12.92, c.b <= 0.04045),\n  );\n}\n\nfn linearSrgbToOklab(c: vec3f) -> vec3f {\n  let l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;\n  let m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;\n  let s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;\n  let l_ = pow(max(l, 0.0), 1.0 / 3.0);\n  let m_ = pow(max(m, 0.0), 1.0 / 3.0);\n  let s_ = pow(max(s, 0.0), 1.0 / 3.0);\n  return vec3f(\n    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,\n    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,\n    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,\n  );\n}\n\nfn oklabToLinearSrgb(c: vec3f) -> vec3f {\n  let l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;\n  let m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;\n  let s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;\n  let l = l_ * l_ * l_;\n  let m = m_ * m_ * m_;\n  let s = s_ * s_ * s_;\n  return vec3f(\n     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,\n    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,\n    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,\n  );\n}\n\nfn oklabMix(a: vec3f, b: vec3f, t: f32) -> vec3f {\n  return oklabToLinearSrgb(mix(linearSrgbToOklab(a), linearSrgbToOklab(b), t));\n}\n\n// Apply hue rotation + saturation + warmth in Oklab space\nfn colorTransform(linearColor: vec3f, hueShift: f32, sat: f32, warm: f32) -> vec3f {\n  var lab = linearSrgbToOklab(linearColor);\n  // Hue rotation: rotate a,b channels\n  let cosH = cos(hueShift);\n  let sinH = sin(hueShift);\n  let a = lab.y * cosH - lab.z * sinH;\n  let b = lab.y * sinH + lab.z * cosH;\n  // Saturation: scale chroma\n  lab.y = a * sat;\n  lab.z = b * sat;\n  // Warmth: shift a-axis (positive = warmer/redder, negative = cooler/bluer)\n  lab.y += warm * 0.03;\n  lab.z -= warm * 0.015;\n  return max(oklabToLinearSrgb(lab), vec3f(0.0));\n}\n\nfn hash2d(p: vec2f) -> f32 {\n  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);\n}\n\nfn triangularDither(p: vec2f, seed: f32) -> f32 {\n  let r0 = hash2d(p + vec2f(seed, 0.0));\n  let r1 = hash2d(p + vec2f(0.0, seed + 71.37));\n  return r0 + r1 - 1.0;\n}\n\nfn softBoxMask(xAbs: f32, halfWidth: f32, feather: f32) -> f32 {\n  return 1.0 - smoothstep(halfWidth, halfWidth + feather, xAbs);\n}\n\nfn ellipseMask(p: vec2f, radius: vec2f, feather: f32) -> f32 {\n  let q = p / radius;\n  let dist = length(q);\n  let edge = feather / max(min(radius.x, radius.y), 1e-4);\n  return 1.0 - smoothstep(1.0, 1.0 + edge, dist);\n}\n\nfn gaussian2d(p: vec2f, radius: vec2f) -> f32 {\n  let q = p / radius;\n  return exp(-dot(q, q));\n}\n\n@vertex\nfn vsMain(@builtin(vertex_index) vid: u32) -> VsOut {\n  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;\n  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;\n  var out: VsOut;\n  out.pos = vec4f(x, y, 0.0, 1.0);\n  out.uv = vec2f((x + 1.0) * 0.5, (1.0 - y) * 0.5);\n  return out;\n}\n\n@fragment\nfn fsMain(in: VsOut) -> @location(0) vec4f {\n  let uv = in.uv;\n  let aspect = u.resolution.x / max(u.resolution.y, 1.0);\n\n  let driftPhase = u.time * u.motionSpeed;\n  let driftX = sin(driftPhase * 0.83) * 0.010 * u.motionAmount;\n  let driftY = cos(driftPhase * 0.61) * 0.012 * u.motionAmount;\n\n  let centerX = u.pillarX + driftX;\n  let centerY = u.pillarY + driftY;\n  let halfWidth = max(u.pillarWidth * 0.5 * aspect, 1e-4);\n  let bodyFeather = max(u.edgeSoftness * aspect, 1e-4);\n  let topY = centerY - u.pillarHeight * 0.5;\n  let bottomY = centerY + u.pillarHeight * 0.5;\n  let localY = clamp01((uv.y - topY) / max(bottomY - topY, 1e-4));\n  let bendWave = sin((localY * u.wobbleFrequency * 6.28318) + driftPhase * 0.75)\n               + u.wobbleHarmonic * sin((localY * u.wobbleFrequency * 2.0 * 6.28318) + driftPhase * 1.2);\n  let wobbleOffset = bendWave * u.wobbleAmount * (0.35 + 0.65 * smoothstep(0.0, 0.9, localY));\n  let twistBase = select(\n    (localY - 0.5) * 2.0,\n    sin(localY * u.twistCycles * 6.28318),\n    u.twistCycles > 0.0\n  );\n  let twistOffset = twistBase * u.twistAmount * halfWidth * 0.9;\n\n  let x = (uv.x - centerX) * aspect - wobbleOffset * aspect - twistOffset;\n  let xAbs = abs(x);\n  let topGate = smoothstep(topY - 0.11, topY + 0.08, uv.y);\n  let bottomGate = 1.0 - smoothstep(bottomY - 0.06, bottomY + 0.04, uv.y);\n  let bodyMask = softBoxMask(xAbs, halfWidth, bodyFeather) * topGate * bottomGate;\n\n  let bulbCenter = vec2f(centerX + wobbleOffset * 0.45, bottomY - u.bottomRadius);\n  let bulbMask = ellipseMask(\n    vec2f((uv.x - bulbCenter.x) * aspect, uv.y - bulbCenter.y),\n    vec2f(halfWidth * 1.10, u.bottomRadius),\n    max(u.edgeSoftness * 0.9, 0.01),\n  );\n\n  let innerMask = max(bodyMask, bulbMask);\n\n  let haloBody = softBoxMask(xAbs, halfWidth * 1.9, bodyFeather * 3.2) * smoothstep(topY - 0.18, topY + 0.05, uv.y) * (1.0 - smoothstep(bottomY - 0.10, bottomY + 0.10, uv.y));\n  let haloBulb = ellipseMask(\n    vec2f((uv.x - bulbCenter.x) * aspect, uv.y - bulbCenter.y),\n    vec2f(halfWidth * 1.9, u.bottomRadius * 1.55),\n    max(u.edgeSoftness * 2.0, 0.02),\n  );\n  let haloMask = max(haloBody, haloBulb);\n\n  // Base colors — hardcoded defaults, transformed by high-level controls\n  let hs = u.hueShift;\n  let sat = u.saturation;\n  let warm = u.warmth;\n\n  let bg = srgbToLinear(vec3f(u.bgBrightness, u.bgBrightness, u.bgBrightness));\n  let pink = colorTransform(srgbToLinear(vec3f(0.94, 0.80, 0.87)), hs, sat, warm);\n  let peach = colorTransform(srgbToLinear(vec3f(0.98, 0.92, 0.84)), hs, sat, warm);\n  let yellow = colorTransform(srgbToLinear(vec3f(0.97, 0.95, 0.76)), hs, sat, warm);\n  let lime = colorTransform(srgbToLinear(vec3f(0.90, 0.94, 0.73)), hs, sat, warm);\n  let white = vec3f(1.0, 1.0, 1.0);\n\n  let pinkCloud = gaussian2d(\n    vec2f((uv.x - (centerX + wobbleOffset * 0.25)) * aspect, uv.y - (topY + 0.14)),\n    vec2f(halfWidth * 1.6, u.pillarHeight * 0.20),\n  ) * (0.35 + 0.65 * topGate);\n\n  let warmCloud = gaussian2d(\n    vec2f((uv.x - (centerX - 0.005 + wobbleOffset * 0.2)) * aspect, uv.y - (topY + u.pillarHeight * 0.40)),\n    vec2f(halfWidth * 1.32, u.pillarHeight * 0.19),\n  );\n\n  let bandLine = (uv.y - (topY + u.pillarHeight * 0.53)) - ((uv.x - centerX) * 0.82) - wobbleOffset * 0.4;\n  let diagonalBand = exp(-pow(abs(bandLine) / 0.11, 2.0)) *\n    exp(-pow(abs((uv.x - centerX) * aspect) / (halfWidth * 1.65), 2.0)) *\n    smoothstep(topY + 0.12, topY + u.pillarHeight * 0.54, uv.y) *\n    (1.0 - smoothstep(bottomY - 0.05, bottomY + 0.04, uv.y));\n\n  let limeEdge = gaussian2d(\n    vec2f((uv.x - (centerX - halfWidth / aspect * 0.65)) * aspect, uv.y - (bottomY - 0.18)),\n    vec2f(halfWidth * 0.80, 0.12),\n  );\n\n  let whiteColumn = smoothstep(0.42, 0.96, localY) * bodyMask;\n  let whiteBulb = bulbMask * (0.68 + 0.32 * smoothstep(bottomY - u.bottomRadius * 1.6, bottomY - u.bottomRadius * 0.4, uv.y));\n  let whiteCore = max(whiteColumn * 0.85, whiteBulb);\n\n  var color = bg;\n\n  let topMix = oklabMix(peach, pink, clamp01(0.78 * pinkCloud));\n  let midMix = oklabMix(peach, yellow, clamp01(0.75 * warmCloud + 0.55 * diagonalBand));\n  let limeMix = oklabMix(yellow, lime, clamp01(0.75 * limeEdge + 0.45 * diagonalBand));\n\n  color += haloMask * u.haloIntensity * srgbToLinear(vec3f(0.042, 0.042, 0.040));\n  color += topMix * pinkCloud * u.pinkIntensity * 0.88;\n  color += midMix * warmCloud * 0.34;\n  color += limeMix * diagonalBand * u.yellowGreenIntensity * 0.96;\n  color += lime * limeEdge * u.yellowGreenIntensity * 0.16;\n  color = oklabMix(color, white, clamp01(whiteCore * u.whiteCoreIntensity * 0.92));\n  color += innerMask * srgbToLinear(vec3f(0.012, 0.011, 0.008)) * 0.12;\n\n  color = bg + (color - bg) * u.brightness;\n  color += vec3f(triangularDither(in.pos.xy, u.ditherSeed) * (0.5 / 255.0));\n  color = max(color, vec3f(0.0));\n\n  return vec4f(color, 1.0);\n}\n", _ = {
	pillarWidth: .25,
	pillarHeight: .7,
	bottomRadius: .165,
	pillarX: .5,
	pillarY: .535,
	edgeSoftness: .095,
	haloIntensity: .56,
	pinkIntensity: .78,
	yellowGreenIntensity: .86,
	whiteCoreIntensity: 1.18,
	brightness: .98,
	motionAmount: 0,
	motionSpeed: .12,
	twistAmount: 0,
	wobbleAmount: 0,
	wobbleFrequency: 1.6,
	twistCycles: 0,
	wobbleHarmonic: 0,
	hueShift: 0,
	saturation: 1,
	warmth: 0,
	bgBrightness: .835
}, v = [
	{
		name: "poster-still",
		label: "Poster Still",
		config: { ..._ }
	},
	{
		name: "soft-drift",
		label: "Soft Drift",
		config: {
			motionAmount: .018,
			motionSpeed: .18,
			wobbleAmount: .014,
			wobbleFrequency: 1.75,
			haloIntensity: .62,
			pinkIntensity: .82
		}
	},
	{
		name: "twisted-ribbon",
		label: "Twisted Ribbon",
		config: {
			motionAmount: .03,
			motionSpeed: .24,
			twistAmount: .18,
			wobbleAmount: .022,
			wobbleFrequency: 2.2,
			haloIntensity: .7,
			brightness: 1.02
		}
	},
	{
		name: "cool-mint",
		label: "Cool Mint",
		config: {
			hueShift: 2.4,
			saturation: .85,
			warmth: -.6,
			bgBrightness: .87
		}
	},
	{
		name: "sunset-warm",
		label: "Sunset Warm",
		config: {
			hueShift: -.3,
			saturation: 1.3,
			warmth: .8,
			bgBrightness: .85
		}
	},
	{
		name: "deep-violet",
		label: "Deep Violet",
		config: {
			hueShift: 1.2,
			saturation: 1.1,
			warmth: -.3,
			bgBrightness: .83,
			haloIntensity: .65
		}
	}
], y = 120;
function b(e, t, n, r) {
	let i = {
		..._,
		...r
	}, a = t, o = n, s = new Float32Array(y / 4), c = e.createBuffer({
		size: y,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	}), l = e.createShaderModule({
		label: "margin-glow",
		code: g
	}), u = e.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		buffer: { type: "uniform" }
	}] }), d = e.createRenderPipeline({
		label: "margin-glow",
		layout: e.createPipelineLayout({ bindGroupLayouts: [u] }),
		vertex: {
			module: l,
			entryPoint: "vsMain"
		},
		fragment: {
			module: l,
			entryPoint: "fsMain",
			targets: [{ format: "rgba16float" }]
		},
		primitive: { topology: "triangle-list" }
	}), f = e.createBindGroup({
		layout: u,
		entries: [{
			binding: 0,
			resource: { buffer: c }
		}]
	});
	return {
		render(t, n, r) {
			s[0] = a, s[1] = o, s[2] = r, s[3] = i.motionSpeed, s[4] = i.pillarWidth, s[5] = i.pillarHeight, s[6] = i.bottomRadius, s[7] = i.pillarX, s[8] = i.pillarY, s[9] = i.edgeSoftness, s[10] = i.haloIntensity, s[11] = i.pinkIntensity, s[12] = i.yellowGreenIntensity, s[13] = i.whiteCoreIntensity, s[14] = i.brightness, s[15] = i.motionAmount, s[16] = i.twistAmount, s[17] = i.wobbleAmount, s[18] = i.wobbleFrequency, s[19] = i.twistCycles, s[20] = i.wobbleHarmonic, s[21] = r * .173, s[22] = i.hueShift, s[23] = i.saturation, s[24] = i.warmth, s[25] = i.bgBrightness, s[26] = 0, s[27] = 0, s[28] = 0, s[29] = 0, e.queue.writeBuffer(c, 0, s);
			let l = t.beginRenderPass({ colorAttachments: [{
				view: n,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				},
				loadOp: "clear",
				storeOp: "store"
			}] });
			l.setPipeline(d), l.setBindGroup(0, f), l.draw(3), l.end();
		},
		resize(e, t) {
			a = e, o = t;
		},
		updateConfig(e) {
			i = {
				...i,
				...e
			};
		},
		getConfig() {
			return { ...i };
		},
		destroy() {
			c.destroy();
		}
	};
}
//#endregion
//#region src/metaball-sdf/shader.wgsl?raw
var x = "struct Params {\n  resolution: vec2f,\n  time: f32,\n  count: u32,\n  bgColor: vec4f,\n  threshold: f32,\n  softness: f32,\n  maskBlend: f32,\n  rimIntensity: f32,\n}\n\nstruct Particle {\n  pos: vec2f,\n  vel: vec2f,\n  radius: f32,\n  phase: f32,\n  colorIdx: f32,\n  life: f32,\n}\n\n@group(0) @binding(0) var<uniform> u: Params;\n@group(0) @binding(1) var<storage, read> particles: array<Particle>;\n@group(0) @binding(2) var maskTex: texture_2d<f32>;\n@group(0) @binding(3) var maskSamp: sampler;\n\nstruct VOut {\n  @builtin(position) pos: vec4f,\n  @location(0) uv: vec2f,\n}\n\nconst DARK_COLOR = vec3f(0.102, 0.102, 0.102);\nconst WHITE_COLOR = vec3f(1.0, 1.0, 1.0);\n\n@vertex\nfn vs(@builtin(vertex_index) i: u32) -> VOut {\n  var p = array<vec2f, 3>(\n    vec2f(-1.0, -1.0),\n    vec2f(3.0, -1.0),\n    vec2f(-1.0, 3.0),\n  );\n  var o: VOut;\n  let q = p[i];\n  o.pos = vec4f(q, 0.0, 1.0);\n  o.uv = vec2f((q.x + 1.0) * 0.5, 1.0 - (q.y + 1.0) * 0.5);\n  return o;\n}\n\n@fragment\nfn fs(in: VOut) -> @location(0) vec4f {\n  let fragCoord = in.uv * u.resolution;\n  let scale = min(u.resolution.x, u.resolution.y);\n\n  var field: f32 = 0.0;\n  var weightedColor = vec3f(0.0);\n  let cutoffFactor = 200.0;\n\n  for (var i = 0u; i < u.count; i++) {\n    let p = particles[i];\n    let pixelPos = p.pos * u.resolution;\n    let breathe = sin(u.time * 1.5 + p.phase * 6.28318) * 0.08 + 1.0;\n    let pixelRadius = p.radius * scale * breathe;\n    let diff = fragCoord - pixelPos;\n    let distSq = dot(diff, diff);\n    let radiusSq = pixelRadius * pixelRadius;\n\n    if (distSq > radiusSq * cutoffFactor) {\n      continue;\n    }\n\n    let influence = radiusSq / max(distSq, 0.001);\n    let color = mix(DARK_COLOR, WHITE_COLOR, p.colorIdx);\n    field += influence;\n    weightedColor += color * influence;\n  }\n\n  let surfaceColor = weightedColor / max(field, 0.001);\n  let alpha = smoothstep(u.threshold - u.softness, u.threshold + u.softness, field);\n\n  let fieldNorm = clamp((field - u.threshold) / (u.threshold * 2.0), 0.0, 1.0);\n  let rimGlow = (1.0 - smoothstep(0.0, 0.7, 1.0 - fieldNorm)) * u.rimIntensity;\n  let edgeDark = smoothstep(0.0, 0.3, 1.0 - fieldNorm) * 0.25;\n  let litColor = surfaceColor * (1.0 + rimGlow) * (1.0 - edgeDark);\n  let metaballResult = mix(u.bgColor.rgb, litColor, alpha);\n\n  // Text fill: solid text fades in over metaballs (maskBlend 0→1)\n  // Correct for screen aspect ratio — mask texture is square\n  let aspect = u.resolution.x / u.resolution.y;\n  let rawUV = (in.uv - vec2f(0.15)) / vec2f(0.70);\n  let maskUV = vec2f((rawUV.x - 0.5) * aspect + 0.5, rawUV.y);\n  let textShape = textureSample(maskTex, maskSamp, maskUV).r;\n  let solidText = mix(u.bgColor.rgb, DARK_COLOR, textShape);\n  let result = mix(metaballResult, solidText, u.maskBlend);\n\n  return vec4f(result, 1.0);\n}\n", S = {
	bgColor: [
		.82,
		.82,
		.82,
		1
	],
	threshold: 1,
	softness: .015,
	rimIntensity: .15
}, C = 48;
function w(e, t, n, r) {
	let i = {
		...S,
		...r
	}, a = t, o = n, s = null, c = e.createBuffer({
		label: "metaball-sdf params",
		size: C,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	}), l = new ArrayBuffer(C), u = new Float32Array(l), d = new Uint32Array(l), f = e.createShaderModule({
		label: "metaball-sdf",
		code: x
	}), p = e.createRenderPipeline({
		label: "metaball-sdf",
		layout: "auto",
		vertex: {
			module: f,
			entryPoint: "vs"
		},
		fragment: {
			module: f,
			entryPoint: "fs",
			targets: [{ format: "rgba16float" }]
		},
		primitive: { topology: "triangle-list" }
	}), m = e.createTexture({
		label: "metaball-sdf default-mask",
		size: [1, 1],
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
	});
	e.queue.writeTexture({ texture: m }, new Uint8Array([
		255,
		255,
		255,
		255
	]), { bytesPerRow: 4 }, [1, 1]);
	let h = e.createSampler({
		label: "metaball-sdf mask-sampler",
		magFilter: "linear",
		minFilter: "linear"
	}), g = null, _ = null, v = null;
	function y(t, n) {
		let r = n ?? m;
		return (!v || g !== t || _ !== r) && (v = e.createBindGroup({
			label: "metaball-sdf bind group",
			layout: p.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: c }
				},
				{
					binding: 1,
					resource: { buffer: t }
				},
				{
					binding: 2,
					resource: r.createView()
				},
				{
					binding: 3,
					resource: h
				}
			]
		}), g = t, _ = r), v;
	}
	return {
		render(t, n, r, f) {
			let m = s === null ? 0 : Math.max(0, r - s);
			s = r, f.update(t, r, m), u[0] = a, u[1] = o, u[2] = r, d[3] = f.count, u[4] = i.bgColor[0], u[5] = i.bgColor[1], u[6] = i.bgColor[2], u[7] = i.bgColor[3], u[8] = i.threshold, u[9] = i.softness, u[10] = f.maskBlend ?? 0, u[11] = i.rimIntensity, e.queue.writeBuffer(c, 0, l);
			let h = t.beginRenderPass({ colorAttachments: [{
				view: n,
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				},
				loadOp: "clear",
				storeOp: "store"
			}] });
			h.setPipeline(p), h.setBindGroup(0, y(f.particleBuffer, f.maskTexture)), h.draw(3), h.end();
		},
		resize(e, t) {
			a = e, o = t;
		},
		updateConfig(e) {
			i = {
				...i,
				...e
			};
		},
		getConfig() {
			return {
				bgColor: [...i.bgColor],
				threshold: i.threshold,
				softness: i.softness,
				rimIntensity: i.rimIntensity
			};
		},
		destroy() {
			c.destroy(), m.destroy();
		}
	};
}
//#endregion
//#region src/metaball-scene.ts
function T(e, t, n, r, i) {
	let a = r(e), o = w(e, t, n, i);
	return {
		render(e, t, n) {
			o.render(e, t, n, a);
		},
		resize(e, t) {
			o.resize(e, t);
		},
		updateConfig(e) {
			o.updateConfig(e);
		},
		getConfig() {
			return o.getConfig();
		},
		destroy() {
			a.destroy(), o.destroy();
		}
	};
}
//#endregion
//#region src/particles/helpers.ts
function E(e, t, n) {
	return e.createBuffer({
		label: t,
		size: n * 32,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
	});
}
function D(e) {
	return new Float32Array(e * 8);
}
function O(e, t = e.length) {
	let n = Math.min(t, e.length), r = new Float32Array(n * 2), i = new Float32Array(n * 2), a = new Float32Array(n);
	for (let t = 0; t < n; t++) {
		let n = e[t];
		r[t * 2] = n.x, r[t * 2 + 1] = n.y, i[t * 2] = n.vx, i[t * 2 + 1] = n.vy, a[t] = n.radius;
	}
	return {
		positions: r,
		velocities: i,
		radii: a,
		count: n
	};
}
function ee(e, t = e.count) {
	let n = Math.min(t, e.count), r = 0, i = 0, a = 0, o = 0, s = 0;
	for (let t = 0; t < n; t++) {
		let n = e.positions[t * 2], c = e.positions[t * 2 + 1], l = e.velocities[t * 2], u = e.velocities[t * 2 + 1];
		r += n, i += c, a += l, o += u, s += Math.hypot(l, u);
	}
	let c = Math.max(n, 1);
	return {
		centerX: r / c,
		centerY: i / c,
		centerVx: a / c,
		centerVy: o / c,
		avgSpeed: s / c,
		count: n
	};
}
function te(e, t, n) {
	let r = t * 2.399963229728653, i = .0025 + t % 5 * .0017;
	e.x = n.centerX + Math.cos(r) * i, e.y = n.centerY + Math.sin(r) * i * .8, e.vx = Math.cos(r) * 1e-4, e.vy = Math.sin(r) * 1e-4;
}
function ne(e, t, n) {
	let r = ee(t, e.length), i = Math.min(t.count, e.length), a = n?.maxSpeed ?? Infinity;
	for (let n = 0; n < i; n++) {
		let r = e[n];
		if (r.x = t.positions[n * 2], r.y = t.positions[n * 2 + 1], r.vx = t.velocities[n * 2], r.vy = t.velocities[n * 2 + 1], r.radius = t.radii[n], Number.isFinite(a)) {
			let e = Math.hypot(r.vx, r.vy);
			if (e > a) {
				let t = a / (e || 1);
				r.vx *= t, r.vy *= t;
			}
		}
	}
	for (let t = i; t < e.length; t++) {
		let i = e[t];
		if (n?.fillMissing ? n.fillMissing(i, t, r) : te(i, t, r), Number.isFinite(a)) {
			let e = Math.hypot(i.vx, i.vy);
			if (e > a) {
				let t = a / (e || 1);
				i.vx *= t, i.vy *= t;
			}
		}
	}
	return r;
}
function k(e, t, n, r, i, a, o, s = 0, c = 0, l = 1) {
	let u = t * 8;
	e[u + 0] = n, e[u + 1] = r, e[u + 2] = s, e[u + 3] = c, e[u + 4] = i, e[u + 5] = a, e[u + 6] = o, e[u + 7] = l;
}
function A(e, t, n) {
	return Math.min(Math.max(e, t), n);
}
function j(e) {
	let t = A(e, 0, 1);
	return t * t * t * (t * (t * 6 - 15) + 10);
}
function M(e) {
	let t = Math.floor(e), n = e - t, r = n * n * (3 - 2 * n), i = Math.sin(t * 127.1) * 43758.5453 % 1;
	return i + r * (Math.sin((t + 1) * 127.1) * 43758.5453 % 1 - i);
}
function re(e, t, n, r, i, a, o, s, c) {
	let l = 1 - c, u = l * l, d = u * l, f = c * c, p = f * c;
	return [d * e + 3 * u * c * n + 3 * l * f * i + p * o, d * t + 3 * u * c * r + 3 * l * f * a + p * s];
}
function ie(e, t) {
	return re(e.p0[0], e.p0[1], e.p1[0], e.p1[1], e.p2[0], e.p2[1], e.p3[0], e.p3[1], t);
}
function ae(e, t) {
	let n = .003, [r, i] = ie(e, Math.max(0, t - n)), [a, o] = ie(e, Math.min(1, t + n)), s = a - r, c = o - i, l = Math.sqrt(s * s + c * c) || 1;
	return [s / l, c / l];
}
function oe(e, t) {
	let n = .005, [r, i] = ae(e, Math.max(0, t - n)), [a, o] = ae(e, Math.min(1, t + n)), s = a - r, c = o - i;
	return Math.sqrt(s * s + c * c) / (2 * n);
}
//#endregion
//#region src/particles/chain.ts
var se = 2, N = 12, P = se * N, ce = .035, le = 15e-5, ue = 3e-5, de = -3e-6, fe = .994, pe = .008, me = .08, he = 125, ge = .15, _e = .08, ve = .004, ye = .006, be = Math.PI * 2;
function xe(e) {
	return e - Math.floor(e);
}
function Se(e) {
	return xe(Math.sin(e * 127.1 + 311.7) * 43758.5453123);
}
function Ce(e, t, n) {
	let r = t / se * Math.PI + n * Math.PI + e / he * be, i = .5 + Math.cos(r) * ge, a = .5 + Math.sin(r) * _e;
	return [A(i, .12, .88), A(a, .14, .86)];
}
function we() {
	let e = [];
	for (let t = 0; t < se; t++) {
		let [n, r] = Ce(0, t, 0), [i, a] = Ce(0, t, 1);
		for (let o = 0; o < N; o++) {
			let s = o / (N - 1), c = o === 0 || o === N - 1, l = t * N + o, u = .025 * Math.sin(Math.PI * s), d = .75 + Se(l + 5.1) * .5, f = c && l < Math.floor(P * me) + 2;
			e.push({
				x: n + (i - n) * s,
				y: r + (a - r) * s + u,
				vx: 0,
				vy: 0,
				radius: pe * d,
				phase: Se(l + 15.3),
				isWhite: f,
				isAnchor: c
			});
		}
	}
	return e;
}
function Te(e) {
	let t = E(e, "chain-particles", P), n = D(P), r = we(), i = null, a = null, o = 0;
	function s() {
		r = we();
	}
	function c(e, t) {
		let n = A(t * 60, .75, 1.5), s = a ? 1 + a.bass * 3 : 1, c = i ? 1 - i.blend : 1, l = i ? i.blend : 0, u = .0015;
		for (let t = 0; t < se; t++) {
			let d = t * N, [f, p] = Ce(e, t, 0), [m, h] = Ce(e, t, 1), g = r[d], _ = r[d + N - 1];
			if (i && l > 0) g.x = f * c + i.x * l, g.y = p * c + i.y * l, _.x = m * c + i.x * l, _.y = h * c + i.y * l;
			else if (o > 0) {
				let e = 1 - o / 20, t = e * e * (3 - 2 * e);
				g.x += (f - g.x) * t * .2, g.y += (p - g.y) * t * .2, _.x += (m - _.x) * t * .2, _.y += (h - _.y) * t * .2;
			} else g.x = f, g.y = p, _.x = m, _.y = h;
			g.vx = 0, g.vy = 0, _.vx = 0, _.vy = 0;
			let v = a ? 1 + a.mid * 3 : 1, y = a ? 1 + a.bass * 50 : 1, b = a ? fe - a.energy * .008 : fe;
			a && ve * (1 + a.energy * 2);
			for (let e = 1; e < N - 1; e++) {
				let t = r[d + e], o = r[d + e - 1], f = r[d + e + 1], p = o.x - t.x, m = o.y - t.y, h = Math.sqrt(p * p + m * m) || .001, g = h - ce, _ = le * v, x = p / h * g * _ * n * c, S = m / h * g * _ * n * c;
				p = f.x - t.x, m = f.y - t.y, h = Math.sqrt(p * p + m * m) || .001, g = h - ce, x += p / h * g * _ * n * c, S += m / h * g * _ * n * c;
				let C = (o.x + f.x) * .5, w = (o.y + f.y) * .5;
				x += (C - t.x) * ue * n * c, S += (w - t.y) * ue * n * c, S -= de * y * n * c, i && l > 0 && (x += (i.x - t.x) * u * l * n, S += (i.y - t.y) * u * l * n), t.vx = (t.vx + x) * b, t.vy = (t.vy + S) * b, a?.bassOnset && a.bassOnset > .3 && (t.vy += a.bassOnset * ye * c), a?.midOnset && a.midOnset > .4 && (t.vx += (Math.random() - .5) * a.midOnset * ye * .5 * c);
				let T = Math.sqrt(t.vx * t.vx + t.vy * t.vy);
				if (T > ve * s) {
					let e = ve * s / T;
					t.vx *= e, t.vy *= e;
				}
				t.x = A(t.x + t.vx * s * n, .05, .95), t.y = A(t.y + t.vy * s * n, .07, .93);
			}
		}
		o > 0 && o--;
	}
	function l(i) {
		let o = a?.intensity, s = o == null ? P : Math.max(1, Math.min(P, Math.ceil(P * (.3 + o * .7))));
		for (let e = 0; e < P; e++) {
			let t = r[e], a = 1 + Math.sin(i * .55 + t.phase * be) * .04, o = 1 + Math.sin(i * .28 + t.phase * be * 2.3) * .025;
			k(n, e, t.x, t.y, e < s ? t.radius * a * o : .001, t.phase, +!!t.isWhite, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	return s(), l(0), {
		particleBuffer: t,
		get count() {
			return P;
		},
		update(e, t, n) {
			c(t, n), l(t);
		},
		reset() {
			s(), l(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			let e = new Float32Array(P * 2), t = new Float32Array(P * 2), n = new Float32Array(P);
			for (let i = 0; i < P; i++) {
				let a = r[i];
				e[i * 2] = a.x, e[i * 2 + 1] = a.y, t[i * 2] = a.vx, t[i * 2 + 1] = a.vy, n[i] = a.radius;
			}
			return {
				positions: e,
				velocities: t,
				radii: n,
				count: P
			};
		},
		importState(e) {
			let t = Math.min(e.count, P), n = 0, i = 0, a = 0;
			for (let o = 0; o < t; o++) r[o].x = e.positions[o * 2], r[o].y = e.positions[o * 2 + 1], r[o].vx = e.velocities[o * 2], r[o].vy = e.velocities[o * 2 + 1], n += r[o].x, i += r[o].y, a += Math.hypot(r[o].vx, r[o].vy);
			if (n = t > 0 ? n / t : .5, i = t > 0 ? i / t : .5, t < P) for (let e = t; e < P; e++) {
				let a = e * 2.399963229728653 % be, o = .003 + (e - t) % 4 * .002;
				r[e].x = n + Math.cos(a) * o, r[e].y = i + Math.sin(a) * o, r[e].vx = Math.cos(a) * 8e-5, r[e].vy = Math.sin(a) * 8e-5;
			}
			if (a / Math.max(t, 1) < 3e-4) for (let e = 0; e < P; e++) {
				if (r[e].isAnchor) continue;
				let t = e % N / (N - 1) - .5, a = r[e].x - n, o = r[e].y - i, s = Math.hypot(a, o) > .0015 ? Math.atan2(o, a) : r[e].phase * be + t * .8, c = 8e-5 + Math.abs(t) * 4e-5;
				r[e].vx += Math.cos(s) * c, r[e].vy += Math.sin(s) * c + t * 5e-5;
			}
			o = 20, l(0);
		},
		setAttractor(e) {
			i = e;
		},
		setAudioReactive(e) {
			a = e;
		}
	};
}
//#endregion
//#region src/particles/converge.ts
var Ee = 50, De = .5, Oe = .5, ke = 4e-4, Ae = .985, je = .02, Me = .007, Ne = Math.PI * 2;
function Pe(e) {
	return e - Math.floor(e);
}
function Fe(e) {
	return Pe(Math.sin(e * 127.1 + 311.7) * 43758.5453123);
}
function Ie(e) {
	let t = E(e, "converge-particles", Ee), n = D(Ee), r = [], i = 0;
	function a(e) {
		let t = A(e * 60, .75, 1.5);
		for (let e = 0; e < i; e++) {
			let n = r[e], i = De - n.x, a = Oe - n.y;
			n.vx += i * ke * t, n.vy += a * ke * t, n.vx *= Ae, n.vy *= Ae, n.x += n.vx * t, n.y += n.vy * t;
		}
	}
	function o(a) {
		for (let e = 0; e < i; e++) {
			let t = r[e], i = 1 + Math.sin(a * .5 + t.phase * Ne) * .03;
			k(n, e, t.x, t.y, t.radius * i, t.phase, +!!t.isWhite, t.vx, t.vy);
		}
		for (let e = i; e < Ee; e++) k(n, e, -1, -1, 0, 0, 0);
		e.queue.writeBuffer(t, 0, n);
	}
	return o(0), {
		particleBuffer: t,
		get count() {
			return i;
		},
		update(e, t, n) {
			a(n), o(t);
		},
		reset() {
			r = [], i = 0, o(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			let e = new Float32Array(i * 2), t = new Float32Array(i * 2), n = new Float32Array(i);
			for (let a = 0; a < i; a++) {
				let i = r[a];
				e[a * 2] = i.x, e[a * 2 + 1] = i.y, t[a * 2] = i.vx, t[a * 2 + 1] = i.vy, n[a] = i.radius;
			}
			return {
				positions: e,
				velocities: t,
				radii: n,
				count: i
			};
		},
		importState(e) {
			i = Math.min(e.count, Ee), r = [];
			for (let t = 0; t < i; t++) r.push({
				x: e.positions[t * 2],
				y: e.positions[t * 2 + 1],
				vx: e.velocities[t * 2],
				vy: e.velocities[t * 2 + 1],
				radius: e.radii?.[t] ?? Me,
				phase: Fe(t + 7.3),
				isWhite: t < Math.floor(i * .1)
			});
			o(0);
		},
		isConverged() {
			if (i === 0) return !1;
			for (let e = 0; e < i; e++) {
				let t = r[e], n = t.x - De, i = t.y - Oe;
				if (n * n + i * i > je * je) return !1;
			}
			return !0;
		}
	};
}
//#endregion
//#region src/particles/svg-parser.ts
function Le(e) {
	let t = e.replace(/([MmCcSsLlZz])/g, "\0$1").split("\0").filter(Boolean), n = [];
	for (let e of t) {
		let t = e[0], r = e.slice(1).trim(), i = r.length === 0 ? [] : Re(r);
		n.push({
			cmd: t,
			args: i
		});
	}
	return n;
}
function Re(e) {
	let t = [], n = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g, r;
	for (; (r = n.exec(e)) !== null;) t.push(Number(r[0]));
	return t;
}
function ze(e, t) {
	return {
		p0: e,
		p1: {
			x: e.x + (t.x - e.x) / 3,
			y: e.y + (t.y - e.y) / 3
		},
		p2: {
			x: e.x + 2 * (t.x - e.x) / 3,
			y: e.y + 2 * (t.y - e.y) / 3
		},
		p3: t
	};
}
function Be(e) {
	let t = Le(e);
	if (t.length === 0) return [];
	let n = [], r = {
		x: 0,
		y: 0
	}, i = {
		x: 0,
		y: 0
	}, a = null, o = "";
	for (let { cmd: e, args: s } of t) {
		switch (e) {
			case "M":
				s.length >= 2 && (r = {
					x: s[0],
					y: s[1]
				}, i = { ...r });
				for (let e = 2; e + 1 < s.length; e += 2) {
					let t = {
						x: s[e],
						y: s[e + 1]
					};
					n.push(ze(r, t)), r = t;
				}
				a = null;
				break;
			case "m":
				s.length >= 2 && (r = {
					x: r.x + s[0],
					y: r.y + s[1]
				}, i = { ...r });
				for (let e = 2; e + 1 < s.length; e += 2) {
					let t = {
						x: r.x + s[e],
						y: r.y + s[e + 1]
					};
					n.push(ze(r, t)), r = t;
				}
				a = null;
				break;
			case "C":
				for (let e = 0; e + 5 < s.length; e += 6) {
					let t = {
						p0: { ...r },
						p1: {
							x: s[e],
							y: s[e + 1]
						},
						p2: {
							x: s[e + 2],
							y: s[e + 3]
						},
						p3: {
							x: s[e + 4],
							y: s[e + 5]
						}
					};
					n.push(t), a = t.p2, r = t.p3;
				}
				break;
			case "c":
				for (let e = 0; e + 5 < s.length; e += 6) {
					let t = {
						p0: { ...r },
						p1: {
							x: r.x + s[e],
							y: r.y + s[e + 1]
						},
						p2: {
							x: r.x + s[e + 2],
							y: r.y + s[e + 3]
						},
						p3: {
							x: r.x + s[e + 4],
							y: r.y + s[e + 5]
						}
					};
					n.push(t), a = t.p2, r = t.p3;
				}
				break;
			case "S":
				for (let e = 0; e + 3 < s.length; e += 4) {
					let t = a && (o === "C" || o === "c" || o === "S" || o === "s") ? {
						x: 2 * r.x - a.x,
						y: 2 * r.y - a.y
					} : { ...r }, i = {
						p0: { ...r },
						p1: t,
						p2: {
							x: s[e],
							y: s[e + 1]
						},
						p3: {
							x: s[e + 2],
							y: s[e + 3]
						}
					};
					n.push(i), a = i.p2, r = i.p3;
				}
				break;
			case "s":
				for (let e = 0; e + 3 < s.length; e += 4) {
					let t = a && (o === "C" || o === "c" || o === "S" || o === "s") ? {
						x: 2 * r.x - a.x,
						y: 2 * r.y - a.y
					} : { ...r }, i = {
						p0: { ...r },
						p1: t,
						p2: {
							x: r.x + s[e],
							y: r.y + s[e + 1]
						},
						p3: {
							x: r.x + s[e + 2],
							y: r.y + s[e + 3]
						}
					};
					n.push(i), a = i.p2, r = i.p3;
				}
				break;
			case "L":
				for (let e = 0; e + 1 < s.length; e += 2) {
					let t = {
						x: s[e],
						y: s[e + 1]
					};
					n.push(ze(r, t)), r = t;
				}
				a = null;
				break;
			case "l":
				for (let e = 0; e + 1 < s.length; e += 2) {
					let t = {
						x: r.x + s[e],
						y: r.y + s[e + 1]
					};
					n.push(ze(r, t)), r = t;
				}
				a = null;
				break;
			case "Z":
			case "z":
				(r.x !== i.x || r.y !== i.y) && (n.push(ze(r, i)), r = { ...i }), a = null;
				break;
		}
		o = e;
	}
	return n;
}
function Ve(e, t) {
	if (e.length === 0) return [];
	let n, r, i, a;
	if (t) n = t.width, r = t.height, i = 0, a = 0;
	else {
		let t = Infinity, o = Infinity, s = -Infinity, c = -Infinity;
		for (let n of e) for (let e of [
			n.p0,
			n.p1,
			n.p2,
			n.p3
		]) e.x < t && (t = e.x), e.y < o && (o = e.y), e.x > s && (s = e.x), e.y > c && (c = e.y);
		i = t, a = o, n = s - t || 1, r = c - o || 1;
	}
	let o = (e) => [(e.x - i) / n, (e.y - a) / r];
	return e.map((e) => ({
		p0: o(e.p0),
		p1: o(e.p1),
		p2: o(e.p2),
		p3: o(e.p3)
	}));
}
function He(e, t) {
	return !e || !e.trim() ? [] : Ve(Be(e), t);
}
function Ue(e) {
	let t = {
		width: 100,
		height: 100
	}, n = e.match(/viewBox\s*=\s*["']([^"']+)["']/);
	if (n) {
		let e = Re(n[1]);
		e.length >= 4 && (t = {
			width: e[2],
			height: e[3]
		});
	}
	let r = [], i = /<path[^>]*\bd\s*=\s*["']([^"']+)["'][^>]*\/?>/gi, a;
	for (; (a = i.exec(e)) !== null;) {
		let e = He(a[1], t);
		e.length > 0 && r.push(e);
	}
	return {
		paths: r,
		viewBox: t
	};
}
//#endregion
//#region src/particles/path-flow.ts
var We = 18;
function Ge(e) {
	return (e.speedScale ?? 1) === 1 && (e.lateralScale ?? 1) === 1 && (e.radiusScale ?? 1) === 1;
}
function Ke(e, t) {
	let { segments: n, particleCount: r = 50, baseSpeed: i = .025, baseRadius: a = .005, largeRadius: o = .015, lateralSpread: s = .035, whiteRatio: c = .12, sizeDistribution: l = [
		.65,
		.25,
		.1
	] } = t, u = E(e, "path-flow-particles", r), d = D(r), f = [], p = new Uint32Array(n.length), [m, h] = l;
	for (let e = 0; e < r; e++) {
		let t = Math.random(), n;
		n = t < m ? a * (.7 + Math.random() * .6) : t < m + h ? a + (o - a) * .5 * (.8 + Math.random() * .4) : o * (.8 + Math.random() * .4);
		let l = i * (.7 + Math.random() * .6), u = (Math.random() - .5) * 2 * s;
		f.push({
			t: e / r,
			segmentIdx: 0,
			baseSpeed: l,
			lateralOffset: u,
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			radius: n,
			phase: Math.random(),
			colorIdx: +(e < r * c),
			origSpeed: l,
			origLateral: u,
			origRadius: n
		});
	}
	function g(e, t, n) {
		let r = e.next;
		if (r.length === 0) return n;
		if (r.length === 1) return r[0];
		let i = e.routing ?? "lateral";
		if (i === "random") return r[Math.floor(Math.random() * r.length)];
		if (i === "round-robin") {
			let e = p[n] % r.length;
			return p[n]++, r[e];
		}
		return t.lateralOffset < 0 ? r[0] : r[r.length - 1];
	}
	let _ = null, v = null, y = 0;
	function b() {
		let e = v?.intensity;
		if (typeof e != "number" || !Number.isFinite(e)) return r;
		let t = .3 + e * .7;
		return Math.max(1, Math.min(r, Math.ceil(r * t)));
	}
	function x() {
		let t = b();
		for (let e = 0; e < r; e++) {
			let n = f[e], r = e < t ? n.radius : .001;
			k(d, e, n.x, n.y, r, n.phase, n.colorIdx, n.vx, n.vy);
		}
		e.queue.writeBuffer(u, 0, d);
	}
	function S(e, t) {
		let i = 1 - (_ ? A(_.blend, 0, 1) : 0), a = v ? 1 + v.bass * 3 * i : 1, o = v ? 1 + v.energy * 4 * i : 1, s = v ? 1 + v.mid * 2 * i : 1;
		for (let i = 0; i < r; i++) {
			let r = f[i], c = n[r.segmentIdx], l = 1 + oe(c.path, r.t) * 3 * o, u = .6 + M(r.t * 5 + e * .2 + r.phase * 10) * .8 * o, d = c.speedScale ?? 1, p = r.baseSpeed * l * u * d * a;
			if (v?.bassOnset && v.bassOnset > .3 && (p *= 1 + v.bassOnset * 3), r.t += p * t, r.t >= 1) {
				let e = r.t - 1, t = g(c, r, r.segmentIdx), i = n[t];
				Ge(i) ? (r.baseSpeed = r.origSpeed, r.lateralOffset = r.origLateral, r.radius = r.origRadius) : (r.lateralOffset = r.origLateral * (i.lateralScale ?? 1), r.baseSpeed = r.origSpeed * (i.speedScale ?? 1), r.radius = r.origRadius * (i.radiusScale ?? 1)), r.segmentIdx = t, r.t = Math.min(e, .999);
			}
			let m = n[r.segmentIdx], h = Math.min(r.t, .999), [b, x] = ie(m.path, h), [S, C] = ae(m.path, h), w = -C, T = S, E = (r.lateralOffset + Math.sin(e * .2 + r.phase * 6.28) * .004) * s, D = b + w * E, O = x + T * E;
			if (!_ && y === 0) r.x = D, r.y = O, r.vx = 0, r.vy = 0;
			else {
				let e = _ ? A(_.blend, 0, 1) : 0, n = y > 0 ? j(1 - y / We) : 0, i = _ ? .00135 + e * .0012 : 8e-4 + n * .0032, a = _ ? .972 : .94 + n * .03, o = _ ? D * (1 - e) + _.x * e : D, s = _ ? O * (1 - e) + _.y * e : O;
				r.vx = (r.vx + (o - r.x) * i * A(t * 60, .75, 1.5)) * a, r.vy = (r.vy + (s - r.y) * i * A(t * 60, .75, 1.5)) * a, r.x = A(r.x + r.vx * A(t * 60, .75, 1.5), .02, .98), r.y = A(r.y + r.vy * A(t * 60, .75, 1.5), .02, .98);
			}
		}
		y > 0 && y--, x();
	}
	function C() {
		for (let e = 0; e < r; e++) f[e].t = e / r, f[e].segmentIdx = 0, f[e].baseSpeed = f[e].origSpeed, f[e].lateralOffset = f[e].origLateral, f[e].radius = f[e].origRadius, f[e].vx = 0, f[e].vy = 0, f[e].x = 0, f[e].y = 0;
	}
	return C(), S(0, 0), {
		particleBuffer: u,
		get count() {
			return r;
		},
		update(e, t, n) {
			S(t, n);
		},
		reset() {
			_ = null, y = 0, C(), S(0, 0);
		},
		destroy() {
			u.destroy();
		},
		exportState() {
			return O(f);
		},
		importState(e) {
			ne(f, e, { maxSpeed: .0032 }), y = We, x();
		},
		setAttractor(e) {
			let t = _ !== null;
			_ = e, !e && t && (y = Math.max(y, We));
		},
		setAudioReactive(e) {
			v = e;
		}
	};
}
function qe(e, t, n) {
	let r = He(t, n?.viewBox), i = r.map((e, t) => ({
		path: e,
		next: [t + 1 < r.length ? t + 1 : 0]
	}));
	return Ke(e, {
		...n,
		segments: i
	});
}
//#endregion
//#region src/particles/presets.ts
var Je = {
	segments: [
		{
			path: {
				p0: [.02, .35],
				p1: [.15, .55],
				p2: [.28, .6],
				p3: [.38, .5]
			},
			next: [1]
		},
		{
			path: {
				p0: [.38, .5],
				p1: [.48, .4],
				p2: [.58, .3],
				p3: [.65, .42]
			},
			next: [2]
		},
		{
			path: {
				p0: [.65, .42],
				p1: [.72, .54],
				p2: [.85, .58],
				p3: [.98, .48]
			},
			next: [0]
		}
	],
	particleCount: 50,
	baseSpeed: .02,
	baseRadius: .005,
	largeRadius: .016,
	lateralSpread: .035,
	whiteRatio: .12
}, Ye = {
	segments: [
		{
			path: {
				p0: [.05, .5],
				p1: [.18, .58],
				p2: [.32, .42],
				p3: [.42, .48]
			},
			next: [1, 2],
			routing: "lateral"
		},
		{
			path: {
				p0: [.42, .48],
				p1: [.55, .38],
				p2: [.75, .25],
				p3: [.92, .28]
			},
			next: [0],
			speedScale: 1.2,
			lateralScale: .6,
			radiusScale: .85
		},
		{
			path: {
				p0: [.42, .48],
				p1: [.55, .58],
				p2: [.72, .68],
				p3: [.88, .72]
			},
			next: [0],
			speedScale: 1.2,
			lateralScale: .6,
			radiusScale: .85
		}
	],
	particleCount: 55,
	baseSpeed: .035,
	baseRadius: .005,
	largeRadius: .014,
	lateralSpread: .035,
	whiteRatio: .12
};
//#endregion
//#region src/particles/delta.ts
function Xe(e) {
	return Ke(e, Ye);
}
//#endregion
//#region src/particles/firefly.ts
var F = 35, Ze = .006, Qe = .012, $e = .8, et = 1.2, tt = .18, nt = .003, rt = 25e-6, it = 12e-6, at = .995, ot = 6e-4, st = 45, ct = 3, lt = .1, ut = .003, dt = Math.PI * 2, ft = .1, pt = .9, mt = .12, ht = .88, gt = .0015, _t = 18, vt = 5e-5, yt = .004;
function bt(e) {
	return e - Math.floor(e);
}
function xt(e) {
	return bt(Math.sin(e * 127.1 + 311.7) * 43758.5453123);
}
function St(e) {
	let t = (1 + Math.sqrt(5)) / 2, n = e * dt / (t * t), r = .06 + Math.sqrt(e / F) * .24, i = .5 + Math.cos(n) * r, a = .5 + Math.sin(n) * r * .85, o = $e + xt(e + 7.3) * (et - $e), s = .8 + xt(e + 17.1) * .45;
	return {
		x: A(i, ft, pt),
		y: A(a, mt, ht),
		vx: 0,
		vy: 0,
		phase: xt(e + 27.9) * dt,
		naturalFreq: o,
		baseRadius: Ze * s,
		phaseOffset: xt(e + 37.4),
		isWhite: e >= F - Math.floor(F * lt)
	};
}
function Ct(e) {
	let t = E(e, "firefly-particles", F), n = D(F), r = Array.from({ length: F }, (e, t) => St(t)), i = 0, a = null, o = null, s = 0, c = .5, l = .5;
	function u() {
		for (let e = 0; e < F; e++) r[e] = St(e);
		i = 0;
	}
	function d(e, t) {
		let n = A(t * 60, .75, 1.5), u = a ? 1 + a.bass * 3 : 1, d = o ? 1 - o.blend : 1, f = o ? o.blend : 0, p = (a ? 1 + a.bass * 2 : 1) * d, m = (a ? 1 + a.energy * 8 : 1) * d, h = a ? ot * (1 + a.energy * 5) : ot, g = a && a.energy > .6 ? st * .2 : st;
		if (e - i > g) {
			i = e;
			let t = a ? 1 + a.energy * 2 : 1;
			for (let n = 0; n < F; n++) r[n].phase += (xt(n + e * 13.7) * 2 - 1) * ct * t * d;
		}
		let _ = new Float64Array(F);
		for (let e = 0; e < F; e++) {
			let t = r[e], n = 0;
			for (let i = 0; i < F; i++) {
				if (e === i) continue;
				let a = r[i], o = a.x - t.x, s = a.y - t.y;
				o * o + s * s > tt * tt || (n += Math.sin(a.phase - t.phase));
			}
			_[e] = t.naturalFreq * dt + n * nt * p;
		}
		for (let t = 0; t < F; t++) {
			let i = r[t];
			i.phase += _[t] * n * (1 / 60);
			let p = xt(t + e * .37) * dt;
			if (i.vx += Math.cos(p) * rt * m * n, i.vy += Math.sin(p) * rt * m * n, i.x < ft ? i.vx += (ft - i.x) * it : i.x > pt && (i.vx -= (i.x - pt) * it), i.y < mt ? i.vy += (mt - i.y) * it : i.y > ht && (i.vy -= (i.y - ht) * it), o && f > 0 && (i.vx += (o.x - i.x) * gt * f, i.vy += (o.y - i.y) * gt * f), s > 0) {
				let e = s / _t, t = i.x - c, n = i.y - l, r = Math.hypot(t, n) || 1, a = vt * e;
				i.vx += t / r * a, i.vy += n / r * a;
			}
			if (i.vx *= at, i.vy *= at, a?.bassOnset && a.bassOnset > .3) {
				let e = a.bassOnset * ut * d;
				i.vx += (Math.random() - .5) * e, i.vy += (Math.random() - .5) * e;
			}
			a?.globalOnset && a.globalOnset > .5 && (i.phase += (Math.random() - .5) * .3 * a.globalOnset);
			let g = Math.sqrt(i.vx * i.vx + i.vy * i.vy);
			if (g > h) {
				let e = h / g;
				i.vx *= e, i.vy *= e;
			}
			i.x = A(i.x + i.vx * u * n, .05, .95), i.y = A(i.y + i.vy * u * n, .07, .93);
		}
		s > 0 && s--;
	}
	function f(i) {
		let o = a?.intensity, s = o == null ? F : Math.max(1, Math.min(F, Math.ceil(F * (.3 + o * .7))));
		for (let e = 0; e < F; e++) {
			let t = r[e], a = .5 + .5 * Math.sin(t.phase), o = 1 + Math.sin(i * .4 + t.phaseOffset * dt) * .03, c = e < s ? (t.baseRadius + Qe * a) * o : .001;
			k(n, e, t.x, t.y, c, t.phaseOffset, +!!t.isWhite, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	function p() {
		let e = new Float32Array(F * 2), t = new Float32Array(F * 2), n = new Float32Array(F);
		for (let i = 0; i < F; i++) {
			let a = r[i];
			e[i * 2] = a.x, e[i * 2 + 1] = a.y, t[i * 2] = a.vx, t[i * 2 + 1] = a.vy, n[i] = a.baseRadius;
		}
		return {
			positions: e,
			velocities: t,
			radii: n,
			count: F
		};
	}
	function m(e) {
		for (let e = 0; e < F; e++) r[e] = St(e);
		let t = Math.min(e.count, F), n = 0, a = 0, o = 0;
		for (let i = 0; i < t; i++) {
			let t = r[i];
			t.x = e.positions[i * 2], t.y = e.positions[i * 2 + 1], t.vx = A(e.velocities[i * 2], -yt, yt), t.vy = A(e.velocities[i * 2 + 1], -yt, yt), e.radii[i] > 0 && (t.baseRadius = e.radii[i]), n += t.x, a += t.y, o += Math.hypot(t.vx, t.vy);
		}
		n = t > 0 ? n / t : .5, a = t > 0 ? a / t : .5;
		for (let e = t; e < F; e++) {
			let i = r[e], o = (e - t + 1) * 2.399963229728653, s = .01 + (e - t) % 5 * .005;
			i.x = A(n + Math.cos(o) * s, .05, .95), i.y = A(a + Math.sin(o) * s, .07, .93), i.vx = Math.cos(o) * 5e-5, i.vy = Math.sin(o) * 5e-5;
		}
		if (o / Math.max(t, 1) < 25e-5) for (let e = 0; e < F; e++) {
			let t = r[e], i = t.x - n, o = t.y - a, s = Math.hypot(i, o) > .001 ? Math.atan2(o, i) : t.phaseOffset * dt, c = vt + e % 5 * 8e-6;
			t.vx += Math.cos(s) * c, t.vy += Math.sin(s) * c;
		}
		i = 0, c = n, l = a, s = _t, f(0);
	}
	return u(), f(0), {
		particleBuffer: t,
		get count() {
			return F;
		},
		update(e, t, n) {
			d(t, n), f(t);
		},
		reset() {
			u(), o = null, s = 0, f(0);
		},
		destroy() {
			t.destroy();
		},
		exportState: p,
		importState: m,
		setAttractor(e) {
			o = e;
		},
		setAudioReactive(e) {
			a = e;
		}
	};
}
//#endregion
//#region src/particles/flock.ts
var I = 40, wt = 3, Tt = .008, Et = .1, Dt = .14, Ot = .04, kt = 24e-6, At = 1e-5, jt = 7e-6, Mt = 2e-5, Nt = .995, Pt = .0028, Ft = .08, It = .92, Lt = .1, Rt = .9, zt = .004, Bt = Math.PI * 2;
function Vt(e) {
	return e - Math.floor(e);
}
function Ht(e) {
	return Vt(Math.sin(e * 127.1 + 311.7) * 43758.5453123);
}
function Ut(e) {
	return Ht(e) * 2 - 1;
}
function Wt(e) {
	let t = e % wt, n = t / wt * Bt + .45, r = .14 + t * .015, i = .5 + Math.cos(n) * r, a = .5 + Math.sin(n) * r * .55, o = Ht(e + 1.3) * Bt, s = .01 + Ht(e + 11.2) * .04, c = n + Math.PI * .5 + Ut(e + 21.5) * .2, l = Tt * (.78 + Ht(e + 31.8) * .55), u = 7e-4 + Ht(e + 41.4) * 45e-5;
	return {
		x: i + Math.cos(o) * s,
		y: a + Math.sin(o) * s * .8,
		vx: Math.cos(c) * u,
		vy: Math.sin(c) * u,
		radius: l,
		phase: Ht(e + 51.7),
		isWhite: e < Math.floor(I * Et)
	};
}
function Gt(e) {
	let t = E(e, "flock-particles", I), n = D(I), r = Array.from({ length: I }, (e, t) => Wt(t)), i = null, a = null;
	function o() {
		for (let e = 0; e < I; e++) r[e] = Wt(e);
	}
	function s(e) {
		let t = A(e * 60, .75, 1.5), n = a ? 1 + a.bass * 3 : 1, o = i ? 1 - i.blend : 1, s = i ? i.blend : 0, c = .0015, l = a ? 1 + a.bass * 2 : 1, u = a ? Nt - a.energy * .006 : Nt;
		for (let e = 0; e < I; e++) {
			let d = r[e], f = 0, p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0;
			for (let t = 0; t < I; t++) {
				if (e === t) continue;
				let n = r[t], i = n.x - d.x, a = n.y - d.y, o = i * i + a * a;
				if (!(o > Dt * Dt || o < 1e-7) && (v++, m += n.vx, h += n.vy, g += n.x, _ += n.y, o < Ot * Ot)) {
					let e = Math.max(Math.sqrt(o), .002);
					f -= i / (e * e), p -= a / (e * e);
				}
			}
			let y = f * kt * l * o, b = p * kt * l * o;
			if (v > 0) {
				let e = 1 / v;
				y += (m * e - d.vx) * At * o, b += (h * e - d.vy) * At * o, y += (g * e - d.x) * jt * o, b += (_ * e - d.y) * jt * o;
			}
			if (d.x < Ft ? y += (Ft - d.x) * Mt * o : d.x > It && (y -= (d.x - It) * Mt * o), d.y < Lt ? b += (Lt - d.y) * Mt * o : d.y > Rt && (b -= (d.y - Rt) * Mt * o), i && s > 0 && (y += (i.x - d.x) * c * s, b += (i.y - d.y) * c * s), d.vx = (d.vx + y * t) * u, d.vy = (d.vy + b * t) * u, a?.bassOnset && a.bassOnset > .3) {
				let e = a.bassOnset * zt * o;
				d.vx += (Math.random() - .5) * e, d.vy += (Math.random() - .5) * e;
			}
			let x = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
			if (x > Pt * n) {
				let e = Pt * n / x;
				d.vx *= e, d.vy *= e;
			}
		}
		for (let e = 0; e < I; e++) {
			let i = r[e];
			i.x = A(i.x + i.vx * n * t, .04, .96), i.y = A(i.y + i.vy * n * t, .06, .94);
		}
	}
	function c(i) {
		let o = a?.intensity, s = o == null ? I : Math.max(1, Math.min(I, Math.ceil(I * (.3 + o * .7))));
		for (let e = 0; e < I; e++) {
			let t = r[e], a = 1 + Math.sin(i * .7 + t.phase * Bt) * .05;
			k(n, e, t.x, t.y, e < s ? t.radius * a : .001, t.phase, +!!t.isWhite, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	return o(), c(0), {
		particleBuffer: t,
		get count() {
			return I;
		},
		update(e, t, n) {
			s(n), c(t);
		},
		reset() {
			o(), c(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			let e = new Float32Array(I * 2), t = new Float32Array(I * 2), n = new Float32Array(I);
			for (let i = 0; i < I; i++) {
				let a = r[i];
				e[i * 2] = a.x, e[i * 2 + 1] = a.y, t[i * 2] = a.vx, t[i * 2 + 1] = a.vy, n[i] = a.radius;
			}
			return {
				positions: e,
				velocities: t,
				radii: n,
				count: I
			};
		},
		importState(e) {
			let t = Math.min(e.count, I), n = 0, i = 0, a = 0;
			for (let o = 0; o < t; o++) r[o].x = e.positions[o * 2], r[o].y = e.positions[o * 2 + 1], r[o].vx = e.velocities[o * 2], r[o].vy = e.velocities[o * 2 + 1], n += r[o].x, i += r[o].y, a += Math.hypot(r[o].vx, r[o].vy);
			if (n = t > 0 ? n / t : .5, i = t > 0 ? i / t : .5, t < I) for (let e = t; e < I; e++) {
				let t = e * 2.399 % (Math.PI * 2), a = .003 + e % 5 * .002;
				r[e].x = n + Math.cos(t) * a, r[e].y = i + Math.sin(t) * a, r[e].vx = Math.cos(t) * 14e-5, r[e].vy = Math.sin(t) * 14e-5;
			}
			if (a / Math.max(t, 1) < 35e-5) for (let e = 0; e < I; e++) {
				let t = r[e].x - n, a = r[e].y - i, o = Math.hypot(t, a) > .0015 ? Math.atan2(a, t) : r[e].phase * Bt + e % wt * (Bt / wt), s = Math.cos(o), c = Math.sin(o), l = 12e-5 + e % wt * 3e-5, u = .42;
				r[e].vx += s * l - c * l * u, r[e].vy += c * l + s * l * u;
			}
			c(0);
		},
		setAttractor(e) {
			i = e;
		},
		setAudioReactive(e) {
			a = e;
		}
	};
}
//#endregion
//#region src/particles/grid-fluid.ts
function Kt(e, t) {
	let n = Math.sin(e * 127.1 + t * 311.7) * 43758.5453, r = Math.sin(e * 269.5 + t * 183.3) * 43758.5453;
	return [(n - Math.floor(n)) * 2 - 1, (r - Math.floor(r)) * 2 - 1];
}
function qt(e, t) {
	let n = Math.floor(e), r = Math.floor(t), i = e - n, a = t - r, o = i * i * i * (i * (i * 6 - 15) + 10), s = a * a * a * (a * (a * 6 - 15) + 10), [c, l] = Kt(n, r), [u, d] = Kt(n + 1, r), [f, p] = Kt(n, r + 1), [m, h] = Kt(n + 1, r + 1), g = c * i + l * a, _ = u * (i - 1) + d * a, v = f * i + p * (a - 1), y = m * (i - 1) + h * (a - 1), b = g + o * (_ - g);
	return b + s * (v + o * (y - v) - b);
}
var L = 24, R = 14, Jt = .003, Yt = .032, Xt = .1, Zt = 1.8, Qt = .15, $t = Math.PI * .12, en = .06, tn = 18, nn = .002, rn = 5, an = 5;
function on(e) {
	let t = L * R, n = E(e, "grid-fluid-particles", t), r = D(t), i = [], a = en, o = 1 - en, s = en, c = 1 - en, l = (o - a) / (L - 1), u = (c - s) / (R - 1), d = Math.cos($t), f = Math.sin($t), p = Math.floor(t * Xt), m = /* @__PURE__ */ new Set(), h = Array.from({ length: R }, (e, t) => t * an % R), g = Array.from({ length: R }, (e, t) => {
		let n = (t * 11 + 3) % L;
		return Array.from({ length: L }, (e, t) => (n + t * rn) % L);
	}), _ = Array.from({ length: R }, () => Array(L).fill(0));
	for (let e = 0; e < R; e++) {
		let t = g[e];
		for (let n = 0; n < L; n++) _[e][t[n]] = n;
	}
	if (p > 0) {
		let e = Math.max(Math.floor(t / p), 1);
		for (let n = 0; n < p; n++) m.add((n * e + Math.floor(e / 2)) % t);
	}
	for (let e = 0; e < R; e++) for (let t = 0; t < L; t++) {
		let n = e * L + t, r = a + t * l, o = s + e * u;
		i.push({
			x: r,
			y: o,
			vx: 0,
			vy: 0,
			radius: Jt,
			phase: (t / L + e / R) * .5,
			colorIdx: +!!m.has(n),
			baseX: r,
			baseY: o
		});
	}
	function v(e, t, n = 1, r = 1, a = 1) {
		let o = i[t], s = e * Qt * n * d, c = e * Qt * n * f, l = o.baseX * Zt * r + s, u = o.baseY * Zt * r + c, p = A((qt(l, u) + qt(l * 2.1 + 5.3, u * 2.1 + 3.7) * .4 + .3) / 1.3, 0, 1), m = Jt + (Yt * a - Jt) * p * p;
		return {
			x: o.baseX,
			y: o.baseY,
			radius: m
		};
	}
	function y() {
		let a = S?.intensity, o = typeof a == "number" && Number.isFinite(a) ? Math.max(1, Math.min(t, Math.ceil(t * (.3 + a * .7)))) : t, s = Math.floor(o / R), c = o - s * R, l = Array(R).fill(s);
		for (let e = 0; e < c; e++) l[h[e % R]]++;
		for (let e = 0; e < t; e++) {
			let t = i[e], n = Math.floor(e / L), a = e % L, o = _[n][a] < l[n] ? t.radius : .001;
			k(r, e, t.x, t.y, o, t.phase, t.colorIdx, t.vx, t.vy);
		}
		e.queue.writeBuffer(n, 0, r);
	}
	function b(e) {
		let n = S ? 1 + S.bass * 3 : 1, r = S ? 1 + S.energy * 2 : 1, a = S ? 1 + S.mid * 3 : 1;
		for (let o = 0; o < t; o++) {
			let t = i[o], s = v(e, o, n, r, a);
			t.x = s.x, t.y = s.y, t.radius = s.radius, S?.bassOnset && S.bassOnset > .3 && (t.radius *= 1 + S.bassOnset * .5), t.vx = 0, t.vy = 0;
		}
		y();
	}
	let x = null, S = null, C = 0;
	function w(e, n) {
		let r = A(n * 60, .75, 1.5), a = x ? A(x.blend, 0, 1) : 0, o = C > 0 ? j(1 - C / tn) : 0, s = x ? .0012 + a * .001 : 7e-4 + o * .0027, c = x ? .97 : .944 + o * .03, l = x ? .01 : .03 + o * .03, u = 1 - a, d = S ? 1 + S.bass * 3 * u : 1, f = S ? 1 + S.energy * 2 * u : 1, p = S ? 1 + S.mid * 3 * u : 1;
		for (let n = 0; n < t; n++) {
			let t = i[n], o = v(e, n, d, f, p), m = x ? o.x * (1 - a) + x.x * a : o.x, h = x ? o.y * (1 - a) + x.y * a : o.y, g = m - t.x, _ = h - t.y;
			if (t.vx = (t.vx + g * s * r) * c, t.vy = (t.vy + _ * s * r) * c, S?.bassOnset && S.bassOnset > .3) {
				let e = S.bassOnset * nn * u;
				t.vx += (Math.random() - .5) * e, t.vy += (Math.random() - .5) * e;
			}
			t.x = A(t.x + t.vx * r, .04, .96), t.y = A(t.y + t.vy * r, .06, .94), t.radius += (o.radius - t.radius) * l;
		}
		C > 0 && C--, y();
	}
	return b(0), {
		particleBuffer: n,
		get count() {
			return t;
		},
		update(e, t, n) {
			if (!x && C === 0) {
				b(t);
				return;
			}
			w(t, n);
		},
		reset() {
			x = null, C = 0, b(0);
		},
		destroy() {
			n.destroy();
		},
		exportState() {
			return O(i);
		},
		importState(e) {
			ne(i, e, { maxSpeed: .0035 }), C = tn, y();
		},
		setAttractor(e) {
			let t = x !== null;
			x = e, !e && t && (C = Math.max(C, tn));
		},
		setAudioReactive(e) {
			S = e;
		}
	};
}
//#endregion
//#region src/particles/helix.ts
var z = 30, sn = z / 2, cn = .5, ln = .5, un = .082, dn = .6, fn = 3, pn = .08, mn = .01, hn = .0018, gn = .0028, _n = 4, vn = Math.PI * 2, yn = 18;
function bn(e) {
	let t = null;
	function n(e, n) {
		let r = t ? 1 + t.bass * 3 : 1, i = t ? 1 + t.energy * 4 : 1, a = t ? 1 + t.mid * 1.5 : 1, o = n * pn * r, s = e.t * fn * vn + o + e.helixIndex * Math.PI, c = j(1 - Math.abs(e.t - .5) * 2), l = Math.sin(n * .85 + e.t * 4.5 + e.helixIndex * 1.7) * hn * i, u = t?.bassOnset && t.bassOnset > .3 ? t.bassOnset * .03 : 0;
		return {
			x: cn + Math.cos(s) * (un * a + u),
			y: ln + (e.t - .5) * dn + Math.sin(n * .32 + e.t * 6) * .008,
			radius: mn + l + c * gn + u * .3
		};
	}
	let r = E(e, "helix-particles", z), i = D(z), a = [];
	for (let e = 0; e < 2; e++) for (let t = 0; t < sn; t++) {
		let r = sn === 1 ? 0 : t / (sn - 1), i = r + e * .5, o = n({
			x: cn,
			y: ln,
			vx: 0,
			vy: 0,
			radius: mn,
			phase: i,
			colorIdx: +(e === 1 && t < _n),
			helixIndex: e,
			t: r
		}, 0);
		a.push({
			x: o.x,
			y: o.y,
			vx: 0,
			vy: 0,
			radius: o.radius,
			phase: i,
			colorIdx: +(e === 1 && t < _n),
			helixIndex: e,
			t: r
		});
	}
	function o() {
		let n = t?.intensity, o = a.length, s = n == null ? o : Math.max(1, Math.ceil(o * (.3 + n * .7)));
		for (let e = 0; e < z; e++) {
			let t = a[e];
			k(i, e, t.x, t.y, e < s ? t.radius : .001, t.phase, t.colorIdx, t.vx, t.vy);
		}
		e.queue.writeBuffer(r, 0, i);
	}
	function s(e) {
		for (let t = 0; t < z; t++) {
			let r = a[t], i = n(r, e);
			r.x = i.x, r.y = i.y, r.radius = i.radius, r.vx = 0, r.vy = 0;
		}
		o();
	}
	let c = null, l = 0;
	function u(e, t) {
		let r = A(t * 60, .75, 1.5), i = c ? A(c.blend, 0, 1) : 0, s = l > 0 ? j(1 - l / yn) : 0, u = c ? .0011 + i * .0011 : 7e-4 + s * .0027, d = c ? .968 : .942 + s * .03, f = c ? .01 : .03 + s * .03;
		for (let t = 0; t < z; t++) {
			let o = a[t], s = n(o, e), l = c ? s.x * (1 - i) + c.x * i : s.x, p = c ? s.y * (1 - i) + c.y * i : s.y, m = l - o.x, h = p - o.y;
			o.vx = (o.vx + m * u * r) * d, o.vy = (o.vy + h * u * r) * d, o.x = A(o.x + o.vx * r, .03, .97), o.y = A(o.y + o.vy * r, .03, .97), o.radius += (s.radius - o.radius) * f;
		}
		l > 0 && l--, o();
	}
	return s(0), {
		particleBuffer: r,
		get count() {
			return z;
		},
		update(e, t, n) {
			if (!c && l === 0) {
				s(t);
				return;
			}
			u(t, n);
		},
		reset() {
			c = null, l = 0, s(0);
		},
		destroy() {
			r.destroy();
		},
		exportState() {
			return O(a);
		},
		importState(e) {
			ne(a, e, { maxSpeed: .003 }), l = yn, o();
		},
		setAudioReactive(e) {
			t = e;
		},
		setAttractor(e) {
			let t = c !== null;
			c = e, !e && t && (l = Math.max(l, yn));
		}
	};
}
//#endregion
//#region src/particles/magnet.ts
var B = 60, xn = 1, Sn = .007, Cn = .1, wn = 4e-6, Tn = 2e-6, En = .035, Dn = .994, On = .012, kn = B + 1, An = .0015, jn = 18, Mn = 5e-5, Nn = .004, Pn = .004, Fn = .001;
function In(e) {
	let t = E(e, "magnet-particles", kn), n = D(kn), r = [], i = [], a = null, o = null, s = 0, c = .5, l = .5;
	for (let e = 0; e < B; e++) {
		let t = Math.random(), n;
		n = t < .7 ? Sn * (.6 + Math.random() * .8) : t < .92 ? Sn * (1.2 + Math.random() * .8) : Sn * (2 + Math.random() * .8);
		let i = Math.random() * Math.PI * 2, a = .08 + Math.random() * .18;
		r.push({
			x: .5 + Math.cos(i) * a,
			y: .5 + Math.sin(i) * a,
			vx: 0,
			vy: 0,
			radius: n,
			phase: Math.random(),
			isWhite: e < B * Cn
		});
	}
	for (let e = 0; e < xn; e++) i.push({
		orbitCx: .5,
		orbitCy: .5,
		orbitRx: .03,
		orbitRy: .02,
		speedMul: 1,
		angleOffset: 0
	});
	function u(e, t) {
		let n = t * On * e.speedMul + e.angleOffset;
		return [e.orbitCx + Math.cos(n) * e.orbitRx, e.orbitCy + Math.sin(n) * e.orbitRy];
	}
	function d(e, t) {
		let n = i.map((t) => u(t, e)), d = a ? 1 - a.blend : 1, f = a ? a.blend : 0, p = o ? 1 + o.bass * 3 : 1, m = o ? 1 + o.bass * 50 : 1, h = o ? 1 + o.mid * 3 : 1, g = o ? Dn - o.energy * .004 : Dn;
		for (let e = 0; e < B; e++) {
			let t = r[e], i = 0, u = 0;
			for (let [e, r] of n) {
				let n = e - t.x, a = r - t.y, o = Math.sqrt(n * n + a * a), s = Math.max(o, .01), c = wn * m * d / (s * s);
				i += n / s * c, u += a / s * c;
			}
			for (let n = 0; n < B; n++) {
				if (e === n) continue;
				let a = t.x - r[n].x, o = t.y - r[n].y, s = Math.sqrt(a * a + o * o);
				if (s < En && s > .001) {
					let e = Tn * h * d / (s * s);
					i += a / s * e, u += o / s * e;
				}
			}
			if (a && f > 0 && (i += (a.x - t.x) * An * f, u += (a.y - t.y) * An * f), s > 0) {
				let e = s / jn, n = t.x - c, r = t.y - l, a = Math.hypot(n, r) || 1, o = Mn * e;
				i += n / a * o, u += r / a * o;
			}
			if (t.vx = (t.vx + i) * g, t.vy = (t.vy + u) * g, o?.bassOnset && o.bassOnset > .3) {
				let e = t.x - .5, n = t.y - .5, r = Math.hypot(e, n) || .01, i = o.bassOnset * Pn * d;
				t.vx += e / r * i, t.vy += n / r * i;
			}
			let _ = Math.hypot(t.vx, t.vy), v = Nn * p;
			if (_ > v) {
				let e = v / _;
				t.vx *= e, t.vy *= e;
			}
			t.x += t.vx * p, t.y += t.vy * p;
		}
		s > 0 && s--;
	}
	function f(i) {
		let a = o?.intensity, s = a == null ? B : Math.max(1, Math.min(B, Math.ceil(B * A(.3 + a * .7, .3, 1))));
		for (let e = 0; e < B; e++) {
			let t = r[e], a = 1 + Math.sin(i * 1.2 + t.phase * 6.28) * .06;
			k(n, e, t.x, t.y, e < s ? t.radius * a : Fn, t.phase, +!!t.isWhite, t.vx, t.vy);
		}
		k(n, B, .5, .5, .05, 0, 0), e.queue.writeBuffer(t, 0, n);
	}
	function p() {
		let e = new Float32Array(kn * 2), t = new Float32Array(kn * 2), n = new Float32Array(kn);
		for (let i = 0; i < B; i++) {
			let a = r[i];
			e[i * 2] = a.x, e[i * 2 + 1] = a.y, t[i * 2] = a.vx, t[i * 2 + 1] = a.vy, n[i] = a.radius;
		}
		return e[B * 2] = .5, e[B * 2 + 1] = .5, t[B * 2] = 0, t[B * 2 + 1] = 0, n[B] = .05, {
			positions: e,
			velocities: t,
			radii: n,
			count: kn
		};
	}
	function m(e) {
		let t = Math.min(e.count, B), n = 0, i = 0, a = 0, o = 0;
		for (let s = 0; s < t; s++) {
			let t = r[s];
			t.x = e.positions[s * 2], t.y = e.positions[s * 2 + 1], t.vx = A(e.velocities[s * 2], -Nn, Nn), t.vy = A(e.velocities[s * 2 + 1], -Nn, Nn), e.radii[s] > 0 && (t.radius = e.radii[s]), n += t.x, i += t.y, a += t.radius, o += Math.hypot(t.vx, t.vy);
		}
		n = t > 0 ? n / t : .5, i = t > 0 ? i / t : .5, a = t > 0 ? a / t : Sn;
		for (let o = t; o < B; o++) {
			let s = r[o], c = (o - t + 1) * 2.399963229728653, l = .01 + (o - t) % 5 * .005;
			s.x = A(n + Math.cos(c) * l, .05, .95), s.y = A(i + Math.sin(c) * l, .05, .95), s.vx = Math.cos(c) * 8e-5, s.vy = Math.sin(c) * 8e-5, e.radii[o] > 0 || (s.radius = a);
		}
		if (o / Math.max(t, 1) < 3e-4) for (let e = 0; e < B; e++) {
			let t = r[e], a = t.x - n, o = t.y - i, s = Math.hypot(a, o) > .001 ? Math.atan2(o, a) : t.phase * Math.PI * 2 + e * .11, c = Mn + e % 7 * 8e-6;
			t.vx += Math.cos(s) * c, t.vy += Math.sin(s) * c;
		}
		c = n, l = i, s = jn, f(0);
	}
	function h() {
		for (let e = 0; e < B; e++) {
			let t = Math.random() * Math.PI * 2, n = .08 + Math.random() * .18;
			r[e].x = .5 + Math.cos(t) * n, r[e].y = .5 + Math.sin(t) * n, r[e].vx = 0, r[e].vy = 0;
		}
		f(0);
	}
	return f(0), {
		particleBuffer: t,
		get count() {
			return kn;
		},
		update(e, t, n) {
			d(t, n), f(t);
		},
		reset() {
			h(), a = null, s = 0;
		},
		destroy() {
			t.destroy();
		},
		exportState: p,
		importState: m,
		setAttractor(e) {
			a = e;
		},
		setAudioReactive(e) {
			o = e;
		}
	};
}
//#endregion
//#region src/particles/mitosis.ts
var Ln = 40, V = 2, Rn = 2.5, zn = V + Rn + 3, Bn = 3, Vn = 4, Hn = .035, Un = .72, Wn = 5e-6, Gn = .07, Kn = .993, qn = .0015, Jn = 18, Yn = 6e-5, Xn = .004, Zn = .004, Qn = .001;
function $n(e) {
	return e * e * (3 - 2 * e);
}
function er(e, t) {
	if (e < V) return {
		growthMul: 1 + t * (.6 - $n(e / V) * .15),
		separationMul: 1
	};
	if (e < V + Rn) {
		let n = $n((e - V) / Rn);
		return {
			growthMul: 1 + t * (.34 - n * .14),
			separationMul: 1 + t * (.18 + n * .18)
		};
	}
	return {
		growthMul: 1 + t * .18,
		separationMul: 1 + t * .42
	};
}
function tr(e) {
	let t = E(e, "mitosis-particles", Ln), n = D(Ln), r = [], i = 0, a = 0, o = 0, s = !1, c = 1, l = null, u = null, d = 0, f = .5, p = .5;
	function m() {
		r = [{
			x: .5,
			y: .5,
			vx: 0,
			vy: 0,
			radius: Hn,
			phase: 0,
			splitAngle: Math.random() * Math.PI * 2,
			generation: 0
		}], a = 0, i = 0, o = 0, s = !1;
	}
	function h(e) {
		return Hn * Un ** +e;
	}
	function g(e) {
		let t = l ? 1 - l.blend : 1, n = l ? l.blend : 0, i = u ? 1 + u.bass * 3 : 1, a = u ? 1 + u.energy * 4 : 1, o = u ? Kn - u.energy * .005 : Kn;
		for (let e = 0; e < r.length; e++) {
			let s = r[e], c = 0, m = 0;
			for (let n = 0; n < r.length; n++) {
				if (e === n) continue;
				let i = r[n], o = s.x - i.x, l = s.y - i.y, u = Math.sqrt(o * o + l * l);
				if (u < Gn && u > .001) {
					let e = Wn * a * t / (u * u);
					c += o / u * e, m += l / u * e;
				}
			}
			if (s.x < .08 && (c += 1e-5 * t), s.x > .92 && (c -= 1e-5 * t), s.y < .08 && (m += 1e-5 * t), s.y > .92 && (m -= 1e-5 * t), l && n > 0 && (c += (l.x - s.x) * qn * n, m += (l.y - s.y) * qn * n), d > 0) {
				let e = d / Jn, t = s.x - f, n = s.y - p, r = Math.hypot(t, n) || 1, i = Yn * e;
				c += t / r * i, m += n / r * i;
			}
			if (s.vx = (s.vx + c) * o, s.vy = (s.vy + m) * o, u?.bassOnset && u.bassOnset > .3) {
				let e = s.x - .5, n = s.y - .5, r = Math.hypot(e, n) || .01, i = u.bassOnset * Zn * t;
				s.vx += e / r * i, s.vy += n / r * i;
			}
			let h = Math.hypot(s.vx, s.vy), g = Xn * i;
			if (h > g) {
				let e = g / h;
				s.vx *= e, s.vy *= e;
			}
			s.x += s.vx * i, s.y += s.vy * i;
		}
		d > 0 && d--;
	}
	function _(a) {
		let o = i, s = er(o, u?.bass ?? 0), l = u?.intensity, d = l == null ? c : Math.max(1, Math.min(c, Math.ceil(c * A(.3 + l * .7, .3, 1)))), f = 0;
		for (let e = 0; e < r.length; e++) {
			let t = r[e], i = 1 + Math.sin(a * 1.2 + t.phase * 6.28) * .06, c = 0, l = 1;
			if (o < V) l = 1 + $n(o / V) * .4;
			else if (o < V + Rn) {
				let e = $n((o - V) / Rn);
				c = e * t.radius * 3, l = 1.4 - e * .4;
			} else c = t.radius * 3;
			c *= s.separationMul;
			let u = t.radius * l * i * s.growthMul, p = Math.cos(t.splitAngle) * c * .5, m = Math.sin(t.splitAngle) * c * .5;
			k(n, f, t.x + p, t.y + m, f < d ? u : Qn, t.phase, 0), f++, k(n, f, t.x - p, t.y - m, f < d ? u : Qn, t.phase + .5, 0), f++;
		}
		for (let e = f; e < Ln; e++) k(n, e, -1, -1, 0, 0, 0, 0, 0, 0);
		c = f, e.queue.writeBuffer(t, 0, n);
	}
	function v() {
		let e = i, t = 0, n = new Float32Array(Ln * 2), a = new Float32Array(Ln * 2), o = new Float32Array(Ln);
		for (let i = 0; i < r.length; i++) {
			let s = r[i], c = 0, l = 1;
			if (e < V) l = 1 + $n(e / V) * .4;
			else if (e < V + Rn) {
				let t = $n((e - V) / Rn);
				c = t * s.radius * 3, l = 1.4 - t * .4;
			} else c = s.radius * 3;
			let u = s.radius * l, d = Math.cos(s.splitAngle) * c * .5, f = Math.sin(s.splitAngle) * c * .5;
			n[t * 2] = s.x + d, n[t * 2 + 1] = s.y + f, a[t * 2] = s.vx, a[t * 2 + 1] = s.vy, o[t] = u, t++, n[t * 2] = s.x - d, n[t * 2 + 1] = s.y - f, a[t * 2] = s.vx, a[t * 2 + 1] = s.vy, o[t] = u, t++;
		}
		return {
			positions: n,
			velocities: a,
			radii: o,
			count: t
		};
	}
	function y(e) {
		let t = Math.max(1, Math.min(Math.ceil(e.count / 2), Ln / 2)), n = [], l = 0, u = 0, m = 0;
		for (let r = 0; r < t; r++) {
			let t = Math.min(r * 2, Math.max(e.count - 1, 0)), i = Math.min(t + 1, Math.max(e.count - 1, 0)), a = e.positions[t * 2] ?? .5, o = e.positions[t * 2 + 1] ?? .5, s = e.positions[i * 2] ?? a, c = e.positions[i * 2 + 1] ?? o, d = e.velocities[t * 2] ?? 0, f = e.velocities[t * 2 + 1] ?? 0, p = e.velocities[i * 2] ?? d, h = e.velocities[i * 2 + 1] ?? f, g = e.radii[t] ?? Hn, _ = e.radii[i] ?? g, v = (a + s) * .5, y = (o + c) * .5, b = (d + p) * .5, x = (f + h) * .5, S = Math.max(.008, (g + _) * .5), C = Math.hypot(b, x);
			n.push({
				x: v,
				y,
				vx: A(b, -Xn, Xn),
				vy: A(x, -Xn, Xn),
				radius: S,
				phase: Math.random(),
				splitAngle: C > 1e-4 ? Math.atan2(x, b) : Math.random() * Math.PI * 2,
				generation: 0
			}), l += v, u += y, m += C;
		}
		if (r = n, a = 0, i = 0, o = 0, s = !1, c = t * 2, l = t > 0 ? l / t : .5, u = t > 0 ? u / t : .5, m / Math.max(t, 1) < 25e-5) for (let e of r) {
			let t = e.x - l, n = e.y - u, r = Math.hypot(t, n) > .001 ? Math.atan2(n, t) : e.splitAngle, i = Yn * 1.5;
			e.vx += Math.cos(r) * i, e.vy += Math.sin(r) * i;
		}
		f = l, p = u, d = Jn, _(0);
	}
	function b() {
		let e = [], t = h(a + 1);
		for (let n of r) {
			let r = n.splitAngle, i = n.radius * 1.2;
			e.push({
				x: n.x + Math.cos(r) * i,
				y: n.y + Math.sin(r) * i,
				vx: Math.cos(r) * 3e-4,
				vy: Math.sin(r) * 3e-4,
				radius: t,
				phase: Math.random(),
				splitAngle: Math.random() * Math.PI * 2,
				generation: a + 1
			}), e.push({
				x: n.x - Math.cos(r) * i,
				y: n.y - Math.sin(r) * i,
				vx: -Math.cos(r) * 3e-4,
				vy: -Math.sin(r) * 3e-4,
				radius: t,
				phase: Math.random(),
				splitAngle: Math.random() * Math.PI * 2,
				generation: a + 1
			});
		}
		r = e, a++, i = 0;
	}
	return m(), _(0), {
		particleBuffer: t,
		get count() {
			return c || 1;
		},
		update(e, t, n) {
			if (s) {
				o += n, o >= Bn && m(), _(t);
				return;
			}
			i += n, g(n), i >= zn && (a >= Vn ? (s = !0, o = 0) : b()), _(t);
		},
		reset() {
			m(), l = null, d = 0, _(0);
		},
		destroy() {
			t.destroy();
		},
		exportState: v,
		importState: y,
		setAttractor(e) {
			l = e;
		},
		setAudioReactive(e) {
			u = e;
		}
	};
}
//#endregion
//#region src/particles/molecular.ts
var H = 25, nr = .04, rr = 8e-6, ir = .12, ar = .993, or = .008, sr = .1, cr = .003, lr = 10, ur = 8e-4, dr = 25e-6, fr = .1, pr = .9, mr = .12, hr = .88, gr = .005, _r = Math.PI * 2;
function vr(e) {
	return e - Math.floor(e);
}
function yr(e) {
	return vr(Math.sin(e * 127.1 + 311.7) * 43758.5453123);
}
function br(e) {
	let t = (1 + Math.sqrt(5)) / 2, n = e * _r / (t * t), r = .04 + Math.sqrt(e / H) * .16, i = .82 + yr(e + 13.3) * .42;
	return {
		x: .5 + Math.cos(n) * r,
		y: .5 + Math.sin(n) * r * .85,
		vx: 0,
		vy: 0,
		radius: or * i,
		phase: yr(e + 23.7),
		isWhite: e >= H - Math.floor(H * sr)
	};
}
function xr(e) {
	let t = E(e, "molecular-particles", H), n = D(H), r = Array.from({ length: H }, (e, t) => br(t)), i = 0, a = null, o = null;
	function s() {
		for (let e = 0; e < H; e++) r[e] = br(e);
		i = 0;
	}
	function c(e, t) {
		let n = A(t * 60, .75, 1.5), s = o ? 1 + o.bass * 3 : 1, c = a ? 1 - a.blend : 1, l = a ? a.blend : 0, u = .0015, d = o ? 1 + o.energy * 4 : 1, f = o ? 1 + o.bass * 2 : 1, p = o ? ar - o.energy * .008 : ar;
		if (o && cr * (1 + o.energy * 2), o && o.energy > .1) for (let t = 0; t < H; t++) {
			let n = yr(t + e * 17.3 + o.bass * 5) * _r, i = ur * o.energy * 3 * c;
			r[t].vx += Math.cos(n) * i, r[t].vy += Math.sin(n) * i;
		}
		if (c > .5 && e - i > lr) {
			i = e;
			for (let t = 0; t < H; t++) {
				let n = yr(t + e * 7.3) * _r;
				r[t].vx += Math.cos(n) * ur * d * c, r[t].vy += Math.sin(n) * ur * d * c;
			}
		}
		for (let e = 0; e < H; e++) for (let t = e + 1; t < H; t++) {
			let i = r[e], a = r[t], o = a.x - i.x, s = a.y - i.y, l = o * o + s * s;
			if (l > ir * ir || l < 1e-5) continue;
			let u = 1 / Math.sqrt(l), d = nr * u, p = d * d * d * d * d * d, m = p * p, h = 24 * rr * f * u * (2 * m - p) * c, g = o * u * h * n, _ = s * u * h * n;
			i.vx += g, i.vy += _, a.vx -= g, a.vy -= _;
		}
		for (let e = 0; e < H; e++) {
			let t = r[e];
			if (t.x < fr ? t.vx += (fr - t.x) * dr * c : t.x > pr && (t.vx -= (t.x - pr) * dr * c), t.y < mr ? t.vy += (mr - t.y) * dr * c : t.y > hr && (t.vy -= (t.y - hr) * dr * c), a && l > 0 && (t.vx += (a.x - t.x) * u * l * n, t.vy += (a.y - t.y) * u * l * n), t.vx *= p, t.vy *= p, o?.bassOnset && o.bassOnset > .3) {
				let e = Math.atan2(t.y - .5, t.x - .5), n = o.bassOnset * gr * c;
				t.vx += Math.cos(e) * n, t.vy += Math.sin(e) * n;
			}
			let i = Math.sqrt(t.vx * t.vx + t.vy * t.vy);
			if (i > cr * s) {
				let e = cr * s / i;
				t.vx *= e, t.vy *= e;
			}
			t.x = A(t.x + t.vx * s * n, .05, .95), t.y = A(t.y + t.vy * s * n, .07, .93);
		}
	}
	function l(i) {
		let a = o?.intensity, s = a == null ? H : Math.max(1, Math.min(H, Math.ceil(H * (.3 + a * .7))));
		for (let e = 0; e < H; e++) {
			let t = r[e], a = 1 + Math.sin(i * .6 + t.phase * _r) * .04, o = 1 + Math.sin(i * .23 + t.phase * _r * 1.7) * .02;
			k(n, e, t.x, t.y, e < s ? t.radius * a * o : .001, t.phase, +!!t.isWhite, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	return s(), l(0), {
		particleBuffer: t,
		get count() {
			return H;
		},
		update(e, t, n) {
			c(t, n), l(t);
		},
		reset() {
			s(), l(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			let e = new Float32Array(H * 2), t = new Float32Array(H * 2), n = new Float32Array(H);
			for (let i = 0; i < H; i++) {
				let a = r[i];
				e[i * 2] = a.x, e[i * 2 + 1] = a.y, t[i * 2] = a.vx, t[i * 2 + 1] = a.vy, n[i] = a.radius;
			}
			return {
				positions: e,
				velocities: t,
				radii: n,
				count: H
			};
		},
		importState(e) {
			let t = Math.min(e.count, H), n = 0, i = 0, a = 0;
			for (let o = 0; o < t; o++) r[o].x = e.positions[o * 2], r[o].y = e.positions[o * 2 + 1], r[o].vx = e.velocities[o * 2], r[o].vy = e.velocities[o * 2 + 1], n += r[o].x, i += r[o].y, a += Math.hypot(r[o].vx, r[o].vy);
			if (n = t > 0 ? n / t : .5, i = t > 0 ? i / t : .5, t < H) for (let e = t; e < H; e++) {
				let a = e * 2.399963229728653 % _r, o = .002 + (e - t) % 4 * .0015;
				r[e].x = n + Math.cos(a) * o, r[e].y = i + Math.sin(a) * o, r[e].vx = Math.cos(a) * 6e-5, r[e].vy = Math.sin(a) * 6e-5;
			}
			if (a / Math.max(t, 1) < 25e-5) for (let e = 0; e < H; e++) {
				let t = r[e].x - n, a = r[e].y - i, o = Math.hypot(t, a) > .001 ? Math.atan2(a, t) : r[e].phase * _r + yr(e + 71.4) * .6, s = 6e-5 + yr(e + 31.4) * 4e-5;
				r[e].vx += Math.cos(o) * s, r[e].vy += Math.sin(o) * s;
			}
			l(0);
		},
		setAttractor(e) {
			a = e;
		},
		setAudioReactive(e) {
			o = e;
		}
	};
}
//#endregion
//#region src/particles/orbit.ts
var U = 28, Sr = 18, W = .5, G = .5, Cr = .003;
function wr(e) {
	if (e < 5) {
		let t = e;
		return {
			x: W,
			y: G,
			vx: 0,
			vy: 0,
			radius: .025,
			phase: t / 5,
			colorIdx: 0,
			orbitGroup: 0,
			orbitRadius: .08,
			orbitSpeed: .3,
			angleBase: t / 5 * Math.PI * 2,
			wobbleX: 0,
			wobbleY: 0,
			radiusBase: .025,
			radiusAmp: .008
		};
	}
	if (e < 13) {
		let t = e - 5;
		return {
			x: W,
			y: G,
			vx: 0,
			vy: 0,
			radius: .012,
			phase: t / 8,
			colorIdx: 0,
			orbitGroup: 1,
			orbitRadius: .17,
			orbitSpeed: -.2,
			angleBase: t / 8 * Math.PI * 2,
			wobbleX: Math.sin(t) * .02,
			wobbleY: Math.cos(t) * .017,
			radiusBase: .012,
			radiusAmp: .004
		};
	}
	if (e < 16) {
		let t = e - 13;
		return {
			x: W,
			y: G,
			vx: 0,
			vy: 0,
			radius: .015,
			phase: t / 3,
			colorIdx: 1,
			orbitGroup: 2,
			orbitRadius: .12,
			orbitSpeed: .5,
			angleBase: t / 3 * Math.PI * 2,
			wobbleX: 0,
			wobbleY: 0,
			radiusBase: .015,
			radiusAmp: .005
		};
	}
	let t = e - 16;
	return {
		x: W,
		y: G,
		vx: 0,
		vy: 0,
		radius: .004,
		phase: t / 12,
		colorIdx: 0,
		orbitGroup: 3,
		orbitRadius: .24,
		orbitSpeed: .08,
		angleBase: t / 12 * Math.PI * 2,
		wobbleX: 0,
		wobbleY: 0,
		radiusBase: .004,
		radiusAmp: .002
	};
}
function Tr(e, t) {
	if (e.orbitGroup === 0) {
		let n = e.angleBase + t * e.orbitSpeed;
		return {
			x: W + Math.cos(n) * e.orbitRadius,
			y: G + Math.sin(n) * e.orbitRadius,
			radius: e.radiusBase + Math.sin(t * .8 + e.angleBase * 1.5) * e.radiusAmp
		};
	}
	if (e.orbitGroup === 1) {
		let n = e.angleBase + t * e.orbitSpeed;
		return {
			x: W + Math.cos(n) * e.orbitRadius + Math.sin(t * .5 + e.angleBase) * e.wobbleX,
			y: G + Math.sin(n) * e.orbitRadius + Math.cos(t * .7 + e.angleBase) * e.wobbleY,
			radius: e.radiusBase + Math.sin(t * 1.2 + e.angleBase * .9) * e.radiusAmp
		};
	}
	if (e.orbitGroup === 2) {
		let n = e.angleBase + t * e.orbitSpeed;
		return {
			x: W + Math.cos(n) * e.orbitRadius,
			y: G + Math.sin(n) * e.orbitRadius,
			radius: e.radiusBase + Math.sin(t + e.angleBase * 2) * e.radiusAmp
		};
	}
	let n = e.angleBase + t * e.orbitSpeed;
	return {
		x: W + Math.cos(n) * (e.orbitRadius + Math.sin(t * .15 + e.angleBase * .5) * .055),
		y: G + Math.sin(n) * (e.orbitRadius + Math.sin(t * .15 + e.angleBase * .5) * .055),
		radius: e.radiusBase + Math.sin(t * .4 + e.angleBase * 1.3) * e.radiusAmp
	};
}
function Er(e) {
	let t = E(e, "orbit-particles", U), n = D(U), r = Array.from({ length: U }, (e, t) => wr(t)), i = null, a = null, o = 0;
	function s() {
		let e = a?.intensity;
		if (typeof e != "number" || !Number.isFinite(e)) return U;
		let t = .3 + e * .7;
		return Math.max(1, Math.min(U, Math.ceil(U * t)));
	}
	function c() {
		let i = s();
		for (let e = 0; e < U; e++) {
			let t = r[e], a = e < i ? t.radius : .001;
			k(n, e, t.x, t.y, a, t.phase, t.colorIdx, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	function l(e) {
		for (let t = 0; t < U; t++) {
			let n = r[t], i = Tr(n, e);
			n.x = i.x, n.y = i.y, n.radius = i.radius, n.vx = 0, n.vy = 0;
		}
		c();
	}
	function u(e, t) {
		let n = A(t * 60, .75, 1.5), s = i ? A(i.blend, 0, 1) : 0, l = o > 0 ? j(1 - o / Sr) : 0, u = i ? .00125 + s * .0012 : 75e-5 + l * .0035, d = i ? .02 : .025 + l * .03, f = i ? .972 : .944 + l * .03, p = i ? 3e-5 * s : 0, m = i ? 1 - A(i.blend, 0, 1) : 1, h = a ? 1 + a.bass * 3 * m : 1, g = a ? 1 + a.energy * 2 * m : 1, _ = a ? 1 + a.mid * 4 * m : 1;
		for (let t = 0; t < U; t++) {
			let o = r[t], c = Tr(o, e * g);
			a && m > 0 && (c.x = W + (c.x - W) * _, c.y = G + (c.y - G) * _);
			let v = i ? c.x * (1 - s) + i.x * s : c.x, y = i ? c.y * (1 - s) + i.y * s : c.y, b = v - o.x, x = y - o.y, S = -x * p, C = b * p;
			if (o.vx = (o.vx + (b * u + S) * n) * f, o.vy = (o.vy + (x * u + C) * n) * f, a?.bassOnset && a.bassOnset > .3) {
				let e = o.x - W, t = o.y - G, n = Math.hypot(e, t) || .01, r = a.bassOnset * Cr * m;
				o.vx += e / n * r, o.vy += t / n * r;
			}
			let w = Math.hypot(o.vx, o.vy), T = (i ? .0026 : .0022 + l * 4e-4) * h;
			if (w > T) {
				let e = T / (w || 1);
				o.vx *= e, o.vy *= e;
			}
			o.x = A(o.x + o.vx * n * h, .03, .97), o.y = A(o.y + o.vy * n * h, .03, .97), o.radius += (c.radius - o.radius) * d;
		}
		o > 0 && o--, c();
	}
	return l(0), {
		particleBuffer: t,
		get count() {
			return U;
		},
		update(e, t, n) {
			if (!i && o === 0) {
				l(t);
				return;
			}
			u(t, n);
		},
		reset() {
			i = null, o = 0, l(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			return O(r);
		},
		importState(e) {
			ne(r, e, { maxSpeed: .0032 }), o = Sr, c();
		},
		setAttractor(e) {
			let t = i !== null;
			i = e, !e && t && (o = Math.max(o, Sr));
		},
		setAudioReactive(e) {
			a = e;
		}
	};
}
//#endregion
//#region src/particles/pendulum.ts
var K = 17, Dr = .5, Or = .15, kr = .15, Ar = .012, jr = .004, Mr = 60, Nr = 51, Pr = 5, Fr = 11, Ir = Math.PI * 2, Lr = 18;
function Rr(e) {
	let t = E(e, "pendulum-particles", K), n = D(K), r = [], i = 1 - 2 * kr;
	for (let e = 0; e < K; e++) r.push({
		x: kr + e / (K - 1) * i,
		y: Dr,
		vx: 0,
		vy: 0,
		radius: Ar,
		phase: e / K,
		colorIdx: +(e === Pr || e === Fr),
		xBase: kr + e / (K - 1) * i,
		period: Mr / (Nr + e)
	});
	function a(e, t) {
		let n = r[t], i = l ? 1 + l.energy * 2 : 1, a = l ? 1 + l.bass * 3 : 1, o = l ? 1 + l.energy * 2 : 1, s = Ir * e * i / n.period, c = Math.sin(s), u = l?.bassOnset && l.bassOnset > .3 ? l.bassOnset * .08 : 0;
		return {
			x: n.xBase,
			y: Dr + Or * a * c + u,
			radius: Ar + jr * o * Math.abs(c)
		};
	}
	function o() {
		let i = l?.intensity, a = r.length, o = i == null ? a : Math.max(1, Math.ceil(a * (.3 + i * .7)));
		for (let e = 0; e < K; e++) {
			let t = r[e];
			k(n, e, t.x, t.y, e < o ? t.radius : .001, t.phase, t.colorIdx, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	function s(e) {
		for (let t = 0; t < K; t++) {
			let n = r[t], i = a(e, t);
			n.x = i.x, n.y = i.y, n.radius = i.radius, n.vx = 0, n.vy = 0;
		}
		o();
	}
	let c = null, l = null, u = 0;
	function d(e, t) {
		let n = A(t * 60, .75, 1.5), i = c ? A(c.blend, 0, 1) : 0, s = u > 0 ? j(1 - u / Lr) : 0, l = c ? .0011 + i * .0011 : 7e-4 + s * .0027, d = c ? .968 : .942 + s * .03, f = c ? .01 : .03 + s * .03;
		for (let t = 0; t < K; t++) {
			let o = r[t], s = a(e, t), u = c ? s.x * (1 - i) + c.x * i : s.x, p = c ? s.y * (1 - i) + c.y * i : s.y, m = u - o.x, h = p - o.y;
			o.vx = (o.vx + m * l * n) * d, o.vy = (o.vy + h * l * n) * d, o.x = A(o.x + o.vx * n, .05, .95), o.y = A(o.y + o.vy * n, .07, .93), o.radius += (s.radius - o.radius) * f;
		}
		u > 0 && u--, o();
	}
	return s(0), {
		particleBuffer: t,
		get count() {
			return K;
		},
		update(e, t, n) {
			if (!c && u === 0) {
				s(t);
				return;
			}
			d(t, n);
		},
		reset() {
			c = null, u = 0, s(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			return O(r);
		},
		importState(e) {
			ne(r, e, { maxSpeed: .003 }), u = Lr, o();
		},
		setAudioReactive(e) {
			l = e;
		},
		setAttractor(e) {
			let t = c !== null;
			c = e, !e && t && (u = Math.max(u, Lr));
		}
	};
}
//#endregion
//#region src/particles/phase-transition.ts
var zr = 8, Br = 6, q = zr * Br, Vr = 60, Hr = .0078, Ur = .1, Wr = 1e-4, Gr = 3e-5, Kr = 2e-6, qr = .03, Jr = .993, Yr = .0028, Xr = .12, Zr = .14, J = .05, Qr = 2e-5, $r = .005, ei = Math.PI * 2, ti = .0015, ni = 18, ri = 6e-5, ii = .004;
function ai(e) {
	return e - Math.floor(e);
}
function oi(e) {
	let t = (e % Vr + Vr) % Vr;
	return t < 15 ? .3 * j(t / 15) : t < 25 ? .3 + .7 * j((t - 15) / 10) : t < 40 ? 1 : t < 55 ? 1 - j((t - 40) / 15) : 0;
}
function si(e) {
	return ai(M(e * 13.37 + .5) + .5);
}
function ci(e) {
	let t = E(e, "phase-transition-particles", q), n = D(q), r = [], i = new Float32Array(q), a = new Float32Array(q), o = Xr, s = 1 - Xr, c = Zr, l = 1 - Zr, u = (s - o) / (zr - 1), d = (l - c) / (Br - 1), f = Math.max(1, Math.floor(q * Ur)), p = /* @__PURE__ */ new Set(), m = q / f;
	for (let e = 0; e < f; e++) p.add(Math.min(q - 1, Math.floor(e * m + m * .5)));
	let h = 0;
	for (let e = 0; e < Br; e++) for (let t = 0; t < zr; t++) {
		let n = o + t * u, i = c + e * d, a = si(h), s = (e / (Br - 1) + t / (zr - 1)) * .5 + a * .25, l = Hr * (.92 + a * .08);
		r.push({
			x: n,
			y: i,
			vx: 0,
			vy: 0,
			homeX: n,
			homeY: i,
			radius: l,
			phase: s,
			colorIdx: +!!p.has(h),
			seed: a
		}), h++;
	}
	let g = null, _ = null, v = 0, y = .5, b = .5;
	function x() {
		for (let e of r) e.x = e.homeX, e.y = e.homeY, e.vx = 0, e.vy = 0;
	}
	function S(i, a) {
		let o = g?.intensity, s = o == null ? q : Math.max(1, Math.min(q, Math.ceil(q * (.3 + o * .7))));
		for (let e = 0; e < q; e++) {
			let t = r[e], o = 1 + Math.sin(i * .65 + t.phase * ei) * .03, c = 1 - a * .05;
			k(n, e, t.x, t.y, e < s ? t.radius * o * c : .001, t.phase, t.colorIdx, t.vx, t.vy, 1);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	function C() {
		let e = new Float32Array(q * 2), t = new Float32Array(q * 2), n = new Float32Array(q);
		for (let i = 0; i < q; i++) {
			let a = r[i];
			e[i * 2] = a.x, e[i * 2 + 1] = a.y, t[i * 2] = a.vx, t[i * 2 + 1] = a.vy, n[i] = a.radius;
		}
		return {
			positions: e,
			velocities: t,
			radii: n,
			count: q
		};
	}
	function w(e) {
		let t = Math.min(e.count, q), n = 0, i = 0, a = 0, o = 0;
		for (let s = 0; s < t; s++) {
			let t = r[s];
			t.x = e.positions[s * 2], t.y = e.positions[s * 2 + 1], t.vx = A(e.velocities[s * 2], -ii, ii), t.vy = A(e.velocities[s * 2 + 1], -ii, ii), e.radii[s] > 0 && (t.radius = e.radii[s]), n += t.x, i += t.y, a += t.radius, o += Math.hypot(t.vx, t.vy);
		}
		n = t > 0 ? n / t : .5, i = t > 0 ? i / t : .5, a = t > 0 ? a / t : Hr;
		for (let o = t; o < q; o++) {
			let s = r[o], c = (o - t + 1) * 2.399963229728653, l = .01 + (o - t) % 5 * .005;
			s.x = A(n + Math.cos(c) * l, .05, .95), s.y = A(i + Math.sin(c) * l, .05, .95), s.vx = Math.cos(c) * 6e-5, s.vy = Math.sin(c) * 6e-5, e.radii[o] > 0 || (s.radius = a);
		}
		if (o / Math.max(t, 1) < 25e-5) for (let e = 0; e < q; e++) {
			let t = r[e], a = t.x - n, o = t.y - i, s = Math.hypot(a, o) > .001 ? Math.atan2(o, a) : t.seed * ei, c = ri + e % 7 * 1e-5;
			t.vx += Math.cos(s) * c, t.vy += Math.sin(s) * c;
		}
		y = n, b = i, v = ni, S(0, Math.max(1, t));
	}
	function T(e, t) {
		i.fill(0), a.fill(0);
		let n = oi(e), o = g ? A(n + g.energy * .6, 0, 1) : n, s = g ? 1 + g.energy * 10 : 1, c = g ? Jr - g.energy * .008 : Jr;
		g && Yr * (1 + g.energy * 3);
		let l = 1 - o, u = _ ? 1 - _.blend : 1, d = _ ? _.blend : 0, f = A(t * 60, .5, 1.8), p = g ? 1 + g.bass * 3 : 1, m = Kr * (.45 + o * .85) * u, h = qr * qr;
		for (let e = 0; e < q; e++) {
			let t = r[e];
			for (let n = e + 1; n < q; n++) {
				let o = r[n], s = t.x - o.x, c = t.y - o.y, l = s * s + c * c;
				if (l >= h || l < 1e-8) continue;
				let u = Math.sqrt(l), d = 1 - u / qr, f = m * d * d / l, p = s / u * f, g = c / u * f;
				i[e] += p, a[e] += g, i[n] -= p, a[n] -= g;
			}
		}
		for (let t = 0; t < q; t++) {
			let n = r[t];
			i[t] += (n.homeX - n.x) * Wr * l * l * u, a[t] += (n.homeY - n.y) * Wr * l * l * u;
			let m = e * .35 + n.phase * 11 + n.seed * 37, h = ai(M(m) + M(m * 1.7 + 9.1) * .25) * ei, x = Gr * s * o * o * (.4 + ai(M(m * 1.3 + 4.7) + .5) * .6);
			if (i[t] += Math.cos(h) * x * u, a[t] += Math.sin(h) * x * u, n.x < J ? i[t] += (J - n.x) * Qr * u : n.x > 1 - J && (i[t] -= (n.x - (1 - J)) * Qr * u), n.y < J ? a[t] += (J - n.y) * Qr * u : n.y > 1 - J && (a[t] -= (n.y - (1 - J)) * Qr * u), _ && d > 0 && (i[t] += (_.x - n.x) * ti * d, a[t] += (_.y - n.y) * ti * d), v > 0) {
				let e = v / ni, r = n.x - y, o = n.y - b, s = Math.hypot(r, o) || 1, c = ri * e;
				i[t] += r / s * c, a[t] += o / s * c;
			}
			if (n.vx = (n.vx + i[t] * f) * c, n.vy = (n.vy + a[t] * f) * c, g?.bassOnset && g.bassOnset > .3) {
				let e = g.bassOnset * $r * u;
				n.vx += (Math.random() - .5) * e, n.vy += (Math.random() - .5) * e;
			}
			let S = n.vx * n.vx + n.vy * n.vy, C = Yr * p;
			if (S > C * C) {
				let e = C / Math.sqrt(S);
				n.vx *= e, n.vy *= e;
			}
			n.x += n.vx * p * f, n.y += n.vy * p * f;
		}
		v > 0 && v--, S(e, o);
	}
	return x(), S(0, oi(0)), {
		particleBuffer: t,
		get count() {
			return q;
		},
		update(e, t, n) {
			T(t, n);
		},
		reset() {
			x(), v = 0, _ = null, S(0, oi(0));
		},
		destroy() {
			t.destroy();
		},
		exportState: C,
		importState: w,
		setAttractor(e) {
			_ = e;
		},
		setAudioReactive(e) {
			g = e;
		}
	};
}
//#endregion
//#region src/particles/ripple.ts
var li = [
	{
		r: .12,
		count: 8
	},
	{
		r: .22,
		count: 14
	},
	{
		r: .32,
		count: 20
	}
], Y = li.reduce((e, t) => e + t.count, 0), ui = .5, di = .5, fi = .65, pi = .6, mi = .005, hi = .02, gi = .18, _i = .12, vi = 1.5, yi = .1, bi = Math.PI * 2, xi = 18;
function Si(e) {
	let t = E(e, "ripple-particles", Y), n = D(Y), r = [], i = 0;
	for (let e of li) for (let t = 0; t < e.count; t++) {
		let n = t / e.count * bi, a = ui + Math.cos(n) * e.r, o = di + Math.sin(n) * e.r;
		r.push({
			x: a,
			y: o,
			vx: 0,
			vy: 0,
			radius: mi,
			phase: i / Y,
			colorIdx: +(i < Y * yi),
			baseX: a,
			baseY: o
		}), i++;
	}
	function a(e, t, n, r, i) {
		let a = e - n, o = t - r, s = Math.sqrt(a * a + o * o), c = Math.exp(-s * vi), l = u ? 1 + u.bass * 3 : 1, d = u ? 1 + u.energy * 2 : 1;
		return hi * l * Math.sin(bi * (s / gi - i * _i * d)) * c;
	}
	function o(e, t) {
		let n = r[t], i = a(n.baseX, n.baseY, ui, di, e), o = a(n.baseX, n.baseY, fi, pi, e), s = u?.bassOnset && u.bassOnset > .3 ? u.bassOnset * .015 : 0;
		return {
			x: n.baseX,
			y: n.baseY,
			radius: Math.max(mi * .3, mi + i + o + s)
		};
	}
	function s() {
		let i = u?.intensity, a = r.length, o = i == null ? a : Math.max(1, Math.ceil(a * (.3 + i * .7)));
		for (let e = 0; e < Y; e++) {
			let t = r[e];
			k(n, e, t.x, t.y, e < o ? t.radius : .001, t.phase, t.colorIdx, t.vx, t.vy);
		}
		e.queue.writeBuffer(t, 0, n);
	}
	function c(e) {
		for (let t = 0; t < Y; t++) {
			let n = r[t], i = o(e, t);
			n.x = i.x, n.y = i.y, n.radius = i.radius, n.vx = 0, n.vy = 0;
		}
		s();
	}
	let l = null, u = null, d = 0;
	function f(e, t) {
		let n = A(t * 60, .75, 1.5), i = l ? A(l.blend, 0, 1) : 0, a = d > 0 ? j(1 - d / xi) : 0, c = l ? .0011 + i * .0011 : 7e-4 + a * .0027, u = l ? .97 : .944 + a * .03, f = l ? .01 : .03 + a * .03;
		for (let t = 0; t < Y; t++) {
			let a = r[t], s = o(e, t), d = l ? s.x * (1 - i) + l.x * i : s.x, p = l ? s.y * (1 - i) + l.y * i : s.y, m = d - a.x, h = p - a.y;
			a.vx = (a.vx + m * c * n) * u, a.vy = (a.vy + h * c * n) * u, a.x = A(a.x + a.vx * n, .03, .97), a.y = A(a.y + a.vy * n, .03, .97), a.radius += (s.radius - a.radius) * f;
		}
		d > 0 && d--, s();
	}
	return c(0), {
		particleBuffer: t,
		get count() {
			return Y;
		},
		update(e, t, n) {
			if (!l && d === 0) {
				c(t);
				return;
			}
			f(t, n);
		},
		reset() {
			l = null, d = 0, c(0);
		},
		destroy() {
			t.destroy();
		},
		exportState() {
			return O(r);
		},
		importState(e) {
			ne(r, e, { maxSpeed: .0035 }), d = xi, s();
		},
		setAudioReactive(e) {
			u = e;
		},
		setAttractor(e) {
			let t = l !== null;
			l = e, !e && t && (d = Math.max(d, xi));
		}
	};
}
//#endregion
//#region src/particles/river.ts
function Ci(e) {
	return Ke(e, Je);
}
//#endregion
//#region src/particles/text-sampler.ts
function wi(e, t) {
	if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(e, t);
	let n = document.createElement("canvas");
	return n.width = e, n.height = t, n;
}
var X = 512, Ti = 512, Ei = 4, Di = 128, Oi = .15, ki = 1 - Oi * 2;
function Ai(e, t, n = 160) {
	let r = wi(X, Ti).getContext("2d");
	r.clearRect(0, 0, X, Ti), r.fillStyle = "#fff", r.fillRect(0, 0, X, Ti), r.font = `900 ${n}px "Helvetica Neue", "Arial Black", system-ui, sans-serif`, r.textBaseline = "middle", r.textAlign = "center";
	try {
		r.letterSpacing = "8px";
	} catch {}
	r.fillStyle = "#000", r.fillText(e, X / 2, Ti / 2);
	let i = r.getImageData(0, 0, X, Ti).data, a = [];
	for (let e = 0; e < Ti; e += Ei) for (let t = 0; t < X; t += Ei) i[(e * X + t) * 4] < Di && a.push({
		x: Oi + t / X * ki,
		y: Oi + e / Ti * ki
	});
	if (a.length === 0) {
		console.warn("[text-sampler] FALLBACK: no text pixels found!");
		let e = [];
		for (let n = 0; n < t; n++) e.push({
			x: Oi + n / t * ki,
			y: .5
		});
		return e;
	}
	let o = [], s = Math.max(1, Math.floor(a.length / t));
	for (let e = 0; e < t; e++) {
		let t = Math.min(e * s, a.length - 1);
		o.push(a[t]);
	}
	return o;
}
function ji(e, t, n = 160) {
	let r = 1024, i = r / X, a = n * i, o = wi(r, r).getContext("2d");
	o.fillStyle = "#000", o.fillRect(0, 0, r, r), o.save(), o.shadowColor = "#fff", o.shadowBlur = 4 * i, o.shadowOffsetX = 0, o.shadowOffsetY = 0, o.font = `900 ${a}px "Helvetica Neue", "Arial Black", system-ui, sans-serif`, o.textBaseline = "middle", o.textAlign = "center";
	try {
		o.letterSpacing = `${8 * i}px`;
	} catch {}
	o.fillStyle = "#fff", o.fillText(t, r / 2, r / 2), o.restore(), o.font = `900 ${a}px "Helvetica Neue", "Arial Black", system-ui, sans-serif`, o.textBaseline = "middle", o.textAlign = "center";
	try {
		o.letterSpacing = `${8 * i}px`;
	} catch {}
	o.fillStyle = "#fff", o.fillText(t, r / 2, r / 2);
	let s = o.getImageData(0, 0, r, r), c = e.createTexture({
		label: "text-mask",
		size: [r, r],
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
	});
	return e.queue.writeTexture({ texture: c }, s.data, {
		bytesPerRow: r * 4,
		rowsPerImage: r
	}, [r, r]), c;
}
//#endregion
//#region src/particles/text-attractor.ts
var Z = 30, Q = 150, Mi = .01, Ni = 3e-4, Pi = 3e-5, Fi = 15e-7, Ii = .015, Li = .991, Ri = .0035, $ = .05, zi = 2e-5, Bi = Math.PI * 2, Vi = .0015, Hi = 18, Ui = 6e-5, Wi = .004, Gi = .005, Ki = -2, qi = 6, Ji = 10, Yi = 13;
function Xi(e) {
	let t = /* @__PURE__ */ new Set(), n = Math.max(1, Math.floor(e / 5));
	for (let r = 1; r <= 4; r++) t.add(Math.min(r * n, e - 1));
	return t;
}
function Zi(e) {
	return e - Math.floor(e);
}
function Qi(e) {
	return Zi(M(e * 13.37 + .5) + .5);
}
function $i(e, t) {
	let n = t?.text ?? "hello", r = t?.fontSize ?? 160, i = E(e, "text-attractor-particles", Q), a = D(Q), o = [], s = new Float32Array(Q), c = new Float32Array(Q), l = ji(e, n, r), u = Z, d = Z, f = 0, p = 0, m = null, h = null, g = 0, _ = .5, v = .5;
	function y() {
		let e = Ai(n, Q, r), t = Xi(Z);
		for (; o.length < Q;) o.push({
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			homeX: 0,
			homeY: 0,
			radius: 0,
			targetRadius: 0,
			phase: 0,
			colorIdx: 0,
			seed: 0
		});
		for (let n = 0; n < Q; n++) {
			let r = Qi(n), i = n / Q + r * .25, a = Mi * (.92 + r * .08), s = o[n];
			s.x = .1 + Zi(M(n * 7.13 + 1)) * .8, s.y = .1 + Zi(M(n * 11.31 + 2)) * .8, s.vx = 0, s.vy = 0, s.homeX = e[n].x, s.homeY = e[n].y, s.targetRadius = a, s.radius = n < Z ? a : 0, s.phase = i, s.colorIdx = n < Z && t.has(n) ? 1 : 0, s.seed = r;
		}
		u = Z, f = 0, p = 0;
	}
	function b(t) {
		n = t, l.destroy(), l = ji(e, n, r);
		let i = Ai(n, Q, r);
		for (let e = 0; e < Q; e++) o[e].homeX = i[e].x, o[e].homeY = i[e].y;
		u = Z, f = 0, p = 0;
		for (let e = 0; e < Q; e++) {
			let t = o[e];
			t.x = .1 + Zi(M(e * 7.13 + f + 1)) * .8, t.y = .1 + Zi(M(e * 11.31 + f + 2)) * .8, t.vx = 0, t.vy = 0, t.radius = e < Z ? t.targetRadius : 0;
		}
		x(0, u);
	}
	function x(t, n) {
		let r = h?.intensity, s = r == null ? n : Math.max(1, Math.min(n, Math.ceil(n * A(.3 + r * .7, .3, 1))));
		d = s;
		for (let e = 0; e < n; e++) {
			let n = o[e], r = 1 + Math.sin(t * .35 + n.phase * Bi) * .015;
			e < s ? k(a, e, n.x, n.y, n.radius * r, n.phase, n.colorIdx, n.vx, n.vy, 1) : k(a, e, Ki, Ki, n.radius * r, n.phase, n.colorIdx, n.vx, n.vy, 1);
		}
		e.queue.writeBuffer(i, 0, a.buffer, 0, n * 8 * 4);
	}
	function S(e, t) {
		f += t;
		let n = f < qi ? 1 - j(f / qi) : 0, r = 1 - n, i = m ? 1 - m.blend : 1, a = m ? m.blend : 0, l = h ? 1 + h.bass * 3 : 1, d = h ? 1 + h.energy * 6 : 1, y = h ? 1 + h.mid * 2 : 1, b = h ? Li - h.energy * .006 : Li, S = h ? Ri * (1 + h.energy * 2) : Ri;
		p = f < Ji ? 0 : f < Yi ? j((f - Ji) / (Yi - Ji)) : 1, s.fill(0), c.fill(0);
		let C = A(t * 60, .5, 1.8), w = Fi * (.3 + n * .7) * i, T = Ii * Ii;
		for (let e = 0; e < u; e++) {
			let t = o[e];
			for (let n = e + 1; n < u; n++) {
				let r = o[n], i = t.x - r.x, a = t.y - r.y, l = i * i + a * a;
				if (l >= T || l < 1e-8) continue;
				let u = Math.sqrt(l), d = 1 - u / Ii, f = w * d * d / l, p = i / u * f, m = a / u * f;
				s[e] += p, c[e] += m, s[n] -= p, c[n] -= m;
			}
		}
		for (let e = 0; e < u; e++) {
			let t = o[e];
			s[e] += (t.homeX - t.x) * Ni * y * r * r * i, c[e] += (t.homeY - t.y) * Ni * y * r * r * i;
			let u = f * .35 + t.phase * 11 + t.seed * 37, p = Zi(M(u) + M(u * 1.7 + 9.1) * .25) * Bi, x = Pi * d * n * n * (.4 + Zi(M(u * 1.3 + 4.7) + .5) * .6) * i;
			if (s[e] += Math.cos(p) * x, c[e] += Math.sin(p) * x, t.x < $ ? s[e] += ($ - t.x) * zi * i : t.x > 1 - $ && (s[e] -= (t.x - (1 - $)) * zi * i), t.y < $ ? c[e] += ($ - t.y) * zi * i : t.y > 1 - $ && (c[e] -= (t.y - (1 - $)) * zi * i), m && a > 0 && (s[e] += (m.x - t.x) * Vi * a, c[e] += (m.y - t.y) * Vi * a), g > 0) {
				let n = g / Hi, r = t.x - _, i = t.y - v, a = Math.hypot(r, i) || 1, o = Ui * n;
				s[e] += r / a * o, c[e] += i / a * o;
			}
			if (t.vx = (t.vx + s[e] * C) * b, t.vy = (t.vy + c[e] * C) * b, h?.bassOnset && h.bassOnset > .3) {
				let e = t.x - t.homeX, n = t.y - t.homeY, r = Math.hypot(e, n) || .01, a = h.bassOnset * Gi * i;
				t.vx += e / r * a, t.vy += n / r * a;
			}
			let w = t.vx * t.vx + t.vy * t.vy;
			if (w > S * S) {
				let e = S / Math.sqrt(w);
				t.vx *= e, t.vy *= e;
			}
			t.x += t.vx * l * C, t.y += t.vy * l * C;
		}
		g > 0 && g--, x(f, u);
	}
	function C() {
		let e = new Float32Array(u * 2), t = new Float32Array(u * 2), n = new Float32Array(u);
		for (let r = 0; r < u; r++) {
			let i = o[r];
			e[r * 2] = i.x, e[r * 2 + 1] = i.y, t[r * 2] = i.vx, t[r * 2 + 1] = i.vy, n[r] = i.radius;
		}
		return {
			positions: e,
			velocities: t,
			radii: n,
			count: u
		};
	}
	function w(e) {
		let t = Math.max(1, Math.min(e.count, Q)), n = 0, r = 0, i = 0, a = 0;
		for (let s = 0; s < t; s++) {
			let t = o[s];
			t.x = e.positions[s * 2], t.y = e.positions[s * 2 + 1], t.vx = A(e.velocities[s * 2], -Wi, Wi), t.vy = A(e.velocities[s * 2 + 1], -Wi, Wi), e.radii[s] > 0 && (t.radius = e.radii[s], t.targetRadius = e.radii[s]), n += t.x, r += t.y, i += t.radius, a += Math.hypot(t.vx, t.vy);
		}
		n = t > 0 ? n / t : .5, r = t > 0 ? r / t : .5, i = t > 0 ? i / t : Mi;
		for (let a = t; a < Q; a++) {
			let s = o[a], c = (a - t + 1) * 2.399963229728653, l = .01 + (a - t) % 5 * .005;
			s.x = A(n + Math.cos(c) * l, .08, .92), s.y = A(r + Math.sin(c) * l, .08, .92), s.vx = Math.cos(c) * 5e-5, s.vy = Math.sin(c) * 5e-5, e.radii[a] > 0 || (s.radius = i, s.targetRadius = i);
		}
		if (a / Math.max(t, 1) < 25e-5) for (let e = 0; e < t; e++) {
			let t = o[e], i = t.x - n, a = t.y - r, s = Math.hypot(i, a) > .001 ? Math.atan2(a, i) : t.phase * Bi, c = Ui + e % 7 * 1e-5;
			t.vx += Math.cos(s) * c, t.vy += Math.sin(s) * c;
		}
		u = t, f = 0, p = 0, _ = n, v = r, g = Hi, x(0, u);
	}
	return y(), x(0, u), {
		particleBuffer: i,
		get count() {
			return d;
		},
		update(e, t, n) {
			S(t, n);
		},
		reset() {
			y(), g = 0, m = null, x(0, u);
		},
		destroy() {
			i.destroy(), l.destroy();
		},
		exportState: C,
		importState: w,
		get maskTexture() {
			return l;
		},
		get maskBlend() {
			return p;
		},
		setAttractor(e) {
			m = e;
		},
		setAudioReactive(e) {
			h = e;
		},
		setText: b
	};
}
//#endregion
export { s as AURORA_DEFAULTS, Ye as DELTA_PRESET, _ as MARGIN_GLOW_DEFAULTS, v as MARGIN_GLOW_PRESETS, t as METABALL_PARTICLE_BYTES, e as METABALL_PARTICLE_FLOATS, S as METABALL_SDF_DEFAULTS, r as PRISM_CAUSTIC_DEFAULTS, Je as RIVER_PRESET, d as SPECTRUM_FAN_DEFAULTS, f as SPECTRUM_FAN_PRESETS, l as createAurora, Te as createChainParticles, Ie as createConvergeParticles, Xe as createDeltaParticles, Ct as createFireflyParticles, Gt as createFlockParticles, on as createGridFluidParticles, bn as createHelixParticles, In as createMagnetParticles, b as createMarginGlow, T as createMetaballEffect, w as createMetaballSDF, tr as createMitosisParticles, xr as createMolecularParticles, Er as createOrbitParticles, Ke as createPathFlowParticles, Rr as createPendulumParticles, ci as createPhaseTransitionParticles, a as createPrismCaustic, Si as createRippleParticles, Ci as createRiverParticles, h as createSpectrumFan, qe as createSvgFlowParticles, $i as createTextAttractorParticles, Ue as parseSvgFile, He as parseSvgPath };
