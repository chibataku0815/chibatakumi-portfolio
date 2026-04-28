//#region src/camera.ts
var e = (e) => e;
function t(e = {}) {
	return {
		focalLength: e.focalLength ?? 50,
		position: {
			x: 0,
			y: 0,
			z: e.z ?? 200
		},
		panX: e.panX ?? 0,
		panY: e.panY ?? 0
	};
}
function n(e = {}) {
	return {
		...t(e),
		orbitAngle: e.orbitAngle ?? 0,
		orbitRadius: e.orbitRadius ?? 0,
		pivotY: e.pivotY ?? 0
	};
}
function r(e, t, n) {
	return e + (t - e) * n;
}
function i(t, n, i, a = e) {
	let o = a(i);
	return {
		focalLength: r(t.focalLength, n.focalLength, o),
		position: {
			x: r(t.position.x, n.position.x, o),
			y: r(t.position.y, n.position.y, o),
			z: r(t.position.z, n.position.z, o)
		},
		panX: r(t.panX, n.panX, o),
		panY: r(t.panY, n.panY, o)
	};
}
function a(t, n, a, o = e) {
	let s = i(t, n, a, o), c = o(a);
	return {
		...s,
		orbitAngle: r(t.orbitAngle, n.orbitAngle, c),
		orbitRadius: r(t.orbitRadius, n.orbitRadius, c),
		pivotY: r(t.pivotY, n.pivotY, c)
	};
}
function o(e, t) {
	return {
		...e,
		position: {
			...e.position,
			z: e.position.z + t
		}
	};
}
function s(e, t, n) {
	return {
		...e,
		panX: e.panX + t,
		panY: e.panY + n
	};
}
function c(e, t, n) {
	return {
		...e,
		position: {
			x: e.position.x + t,
			y: e.position.y + n,
			z: e.position.z
		}
	};
}
function l(e, t) {
	return {
		...e,
		orbitAngle: e.orbitAngle + t
	};
}
//#endregion
//#region src/projection.ts
function u(e, t, n, r, i) {
	let a = r + n - i, o = a > 0 ? r / a : 0;
	return {
		screenX: e * o,
		screenY: t * o,
		scale: o
	};
}
function d(e, t, n, r) {
	let i = r.focalLength + n - r.position.z, a = i > 0 ? r.focalLength / i : 0;
	return {
		screenX: r.panX + (e - r.panX) * a,
		screenY: r.panY + (t - r.panY) * a,
		scale: a
	};
}
function f(e, t, n, r) {
	let i = Math.cos(-r.orbitAngle), a = Math.sin(-r.orbitAngle), o = e - r.panX, s = n - r.position.z, c = o * i - s * a, l = o * a + s * i, u = t - r.pivotY, d = r.focalLength + l, f = d > 0 ? r.focalLength / d : 0;
	return {
		screenX: r.panX + c * f,
		screenY: r.pivotY + u * f,
		scale: f,
		camRelZ: l
	};
}
function p(e, t, n) {
	return {
		x: e * n.width,
		y: t * n.height
	};
}
function ee(e, t, n) {
	return {
		x: n.width > 0 ? e / n.width : 0,
		y: n.height > 0 ? t / n.height : 0
	};
}
function m(e, t) {
	return [...e].sort((e, n) => t(n) - t(e));
}
//#endregion
//#region src/box-rig.ts
var h = 640, g = 1e-4, _ = [
	"back",
	"left",
	"bottom",
	"top",
	"right",
	"front"
], v = new Map(_.map((e, t) => [e, t]));
function y(e) {
	return e * Math.PI / 180;
}
function b(e, t) {
	let n = Math.cos(t), r = Math.sin(t);
	return {
		x: e.x * n + e.z * r,
		y: e.y,
		z: -e.x * r + e.z * n
	};
}
function x(e, t) {
	let n = Math.cos(t), r = Math.sin(t);
	return {
		x: e.x,
		y: e.y * n - e.z * r,
		z: e.y * r + e.z * n
	};
}
function S(e, t, n) {
	return x(b(e, t), n);
}
function C(e, t, n) {
	let r = n + t.position.z + e.z, i = r > 0 ? n / r : 0;
	return {
		x: t.position.x + e.x * i,
		y: t.position.y + e.y * i,
		depth: t.position.z + e.z,
		scale: i
	};
}
function w(e) {
	if (e.length === 0) return 0;
	let t = 0;
	for (let n = 0; n < e.length; n++) t += e[n];
	return t / e.length;
}
function T(e, t) {
	let n = t.width * .5, r = t.height * .5, i = t.depth * .5;
	switch (e) {
		case "front": return {
			normal: {
				x: 0,
				y: 0,
				z: -1
			},
			points: [
				{
					x: -n,
					y: -r,
					z: -i
				},
				{
					x: n,
					y: -r,
					z: -i
				},
				{
					x: n,
					y: r,
					z: -i
				},
				{
					x: -n,
					y: r,
					z: -i
				}
			]
		};
		case "back": return {
			normal: {
				x: 0,
				y: 0,
				z: 1
			},
			points: [
				{
					x: n,
					y: -r,
					z: i
				},
				{
					x: -n,
					y: -r,
					z: i
				},
				{
					x: -n,
					y: r,
					z: i
				},
				{
					x: n,
					y: r,
					z: i
				}
			]
		};
		case "right": return {
			normal: {
				x: 1,
				y: 0,
				z: 0
			},
			points: [
				{
					x: n,
					y: -r,
					z: -i
				},
				{
					x: n,
					y: -r,
					z: i
				},
				{
					x: n,
					y: r,
					z: i
				},
				{
					x: n,
					y: r,
					z: -i
				}
			]
		};
		case "left": return {
			normal: {
				x: -1,
				y: 0,
				z: 0
			},
			points: [
				{
					x: -n,
					y: -r,
					z: i
				},
				{
					x: -n,
					y: -r,
					z: -i
				},
				{
					x: -n,
					y: r,
					z: -i
				},
				{
					x: -n,
					y: r,
					z: i
				}
			]
		};
		case "top": return {
			normal: {
				x: 0,
				y: -1,
				z: 0
			},
			points: [
				{
					x: -n,
					y: -r,
					z: i
				},
				{
					x: n,
					y: -r,
					z: i
				},
				{
					x: n,
					y: -r,
					z: -i
				},
				{
					x: -n,
					y: -r,
					z: -i
				}
			]
		};
		case "bottom": return {
			normal: {
				x: 0,
				y: 1,
				z: 0
			},
			points: [
				{
					x: -n,
					y: r,
					z: -i
				},
				{
					x: n,
					y: r,
					z: -i
				},
				{
					x: n,
					y: r,
					z: i
				},
				{
					x: -n,
					y: r,
					z: i
				}
			]
		};
	}
}
function E(e) {
	return {
		dimensions: { ...e.dimensions },
		pose: { ...e.pose },
		faces: { ...e.faces }
	};
}
function D(e, t = 640) {
	let n = y(e.pose.yaw ?? 0), r = y(e.pose.pitch ?? 0), i = [];
	for (let a of _) {
		let o = e.faces[a];
		if (o === void 0) continue;
		let s = T(a, e.dimensions), c = S(s.normal, n, r);
		if (c.z >= -1e-4) continue;
		let l = s.points.map((i) => C(S(i, n, r), e.pose, t));
		i.push({
			faceId: a,
			payload: o,
			quad: {
				topLeft: {
					x: l[0].x,
					y: l[0].y
				},
				topRight: {
					x: l[1].x,
					y: l[1].y
				},
				bottomRight: {
					x: l[2].x,
					y: l[2].y
				},
				bottomLeft: {
					x: l[3].x,
					y: l[3].y
				}
			},
			averageDepth: w(l.map((e) => e.depth)),
			normal: c
		});
	}
	return i.sort((e, t) => {
		let n = t.averageDepth - e.averageDepth;
		return Math.abs(n) > 1e-4 ? n : (v.get(e.faceId) ?? 0) - (v.get(t.faceId) ?? 0);
	}), i.map((e, t) => ({
		...e,
		drawOrder: t
	}));
}
function O(e, t) {
	return {
		sourceRect: {
			left: t.left,
			top: t.top,
			width: t.width,
			height: t.height
		},
		targetQuad: {
			topLeft: { ...e.quad.topLeft },
			topRight: { ...e.quad.topRight },
			bottomRight: { ...e.quad.bottomRight },
			bottomLeft: { ...e.quad.bottomLeft }
		}
	};
}
//#endregion
//#region src/perspective-warp.ts
function k(e) {
	return e < 0 ? 0 : e > 1 ? 1 : e;
}
function A(e, t, n) {
	return e + (t - e) * n;
}
function j(e, t, n) {
	return {
		x: A(e.x, t.x, n),
		y: A(e.y, t.y, n)
	};
}
function M(e, t) {
	return {
		localLeft: -e * .5,
		localTop: -t * .5,
		width: e,
		height: t
	};
}
function N(e, t, n = {}) {
	return {
		scaleX: 1,
		scaleY: 1,
		rotation: 0,
		opacity: 1,
		originX: 0,
		originY: 0,
		z: 0,
		...n,
		x: e,
		y: t
	};
}
function P(e, t, n) {
	let r = k(t), i = k(n);
	return j(j(e.topLeft, e.topRight, r), j(e.bottomLeft, e.bottomRight, r), i);
}
function F(e, t, n) {
	return {
		topLeft: j(e.topLeft, t.topLeft, n),
		topRight: j(e.topRight, t.topRight, n),
		bottomRight: j(e.bottomRight, t.bottomRight, n),
		bottomLeft: j(e.bottomLeft, t.bottomLeft, n)
	};
}
function I(e, t, n) {
	return {
		topLeft: {
			x: e.topLeft.x + t,
			y: e.topLeft.y + n
		},
		topRight: {
			x: e.topRight.x + t,
			y: e.topRight.y + n
		},
		bottomRight: {
			x: e.bottomRight.x + t,
			y: e.bottomRight.y + n
		},
		bottomLeft: {
			x: e.bottomLeft.x + t,
			y: e.bottomLeft.y + n
		}
	};
}
function L(e, t) {
	let n = e.left + e.width, r = e.top + e.height;
	return {
		topLeft: {
			x: t.topLeft.x - e.left,
			y: t.topLeft.y - e.top
		},
		topRight: {
			x: t.topRight.x - n,
			y: t.topRight.y - e.top
		},
		bottomRight: {
			x: t.bottomRight.x - n,
			y: t.bottomRight.y - r
		},
		bottomLeft: {
			x: t.bottomLeft.x - e.left,
			y: t.bottomLeft.y - r
		}
	};
}
function R(e, t, n) {
	let r = n.left / e.width, i = n.top / e.height, a = (n.left + n.width) / e.width, o = (n.top + n.height) / e.height;
	return {
		topLeft: P(t, r, i),
		topRight: P(t, a, i),
		bottomRight: P(t, a, o),
		bottomLeft: P(t, r, o)
	};
}
function z(e) {
	let { planeRect: t, targetQuad: n, children: r } = e;
	return r.map((e) => {
		let r = e.localRect, i = {
			left: t.left + r.left,
			top: t.top + r.top,
			width: r.width,
			height: r.height
		}, a = M(r.width, r.height), o = N(i.left + i.width * .5, i.top + i.height * .5, e.surface?.baseTransform ?? {}), s = R(t, n, r), c = L(i, s);
		return {
			surface: {
				...e.surface ?? {},
				rect: {
					width: r.width,
					height: r.height
				},
				geometry: a,
				baseTransform: o
			},
			resolvedTransform: {
				...o,
				perspectiveCorners: c
			},
			sourceRect: i,
			targetQuad: s
		};
	});
}
//#endregion
//#region src/layer.ts
function B(e) {
	return {
		id: e.id,
		depth: e.depth,
		content: e.content,
		opacity: e.opacity ?? 1,
		parallaxScale: e.parallaxScale ?? 1
	};
}
function V(e) {
	return [...e].sort((e, t) => t.depth - e.depth);
}
function H(e, t, n) {
	return V(e).map((e, n) => {
		let r = Math.max(e.depth - t.position.z, .001), i = t.focalLength / r, a = e.parallaxScale, o = (1 - i) * a, s = {
			x: t.panX * o,
			y: t.panY * o
		};
		return {
			...e,
			screenOffset: s,
			depthScale: i,
			drawOrder: n
		};
	});
}
//#endregion
//#region src/compositor.ts
var U = "\nstruct Uniforms {\n  opacity: f32,\n  rimIntensity: f32,\n  rimFalloff: f32,\n  rimColorR: f32,\n  rimColorG: f32,\n  rimColorB: f32,\n  _pad0: f32,\n  _pad1: f32,\n}\n\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\n@group(0) @binding(1) var texSampler: sampler;\n@group(0) @binding(2) var tex: texture_2d<f32>;\n\nstruct VOut {\n  @builtin(position) position: vec4f,\n  @location(0) uv: vec2f,\n}\n\n@vertex\nfn vs(@location(0) pos: vec2f, @location(1) uv: vec2f) -> VOut {\n  var out: VOut;\n  out.position = vec4f(pos, 0.0, 1.0);\n  out.uv = uv;\n  return out;\n}\n\n@fragment\nfn fs(in: VOut) -> @location(0) vec4f {\n  let color = textureSample(tex, texSampler, in.uv);\n  let edgeX = 1.0 - pow(abs(in.uv.x - 0.5) * 2.0, uniforms.rimFalloff);\n  let edgeY = 1.0 - pow(abs(in.uv.y - 0.5) * 2.0, uniforms.rimFalloff);\n  let edgeFactor = 1.0 - edgeX * edgeY;\n  let dissolve = 1.0 - edgeFactor * uniforms.rimIntensity;\n  let finalColor = color.rgb * dissolve;\n  return vec4f(finalColor, color.a * uniforms.opacity * dissolve);\n}\n", W = { maxLayers: 8 }, G = 4, K = 6, q = G * K;
function J(e, t, n) {
	let r = e.topLeft, i = e.topRight, a = e.bottomRight, o = e.bottomLeft, s = n;
	t[s++] = r.x, t[s++] = r.y, t[s++] = 0, t[s++] = 0, t[s++] = i.x, t[s++] = i.y, t[s++] = 1, t[s++] = 0, t[s++] = a.x, t[s++] = a.y, t[s++] = 1, t[s++] = 1, t[s++] = r.x, t[s++] = r.y, t[s++] = 0, t[s++] = 0, t[s++] = a.x, t[s++] = a.y, t[s++] = 1, t[s++] = 1, t[s++] = o.x, t[s++] = o.y, t[s++] = 0, t[s++] = 1;
}
function Y(e, t, n, r) {
	let i = {
		...W,
		...r
	}, a = e.createShaderModule({
		label: "compositor-2.5d",
		code: U
	}), o = e.createRenderPipeline({
		label: "compositor-2.5d",
		layout: "auto",
		vertex: {
			module: a,
			entryPoint: "vs",
			buffers: [{
				arrayStride: G * 4,
				attributes: [{
					shaderLocation: 0,
					offset: 0,
					format: "float32x2"
				}, {
					shaderLocation: 1,
					offset: 8,
					format: "float32x2"
				}]
			}]
		},
		fragment: {
			module: a,
			entryPoint: "fs",
			targets: [{
				format: "rgba16float",
				blend: {
					color: {
						srcFactor: "src-alpha",
						dstFactor: "one-minus-src-alpha",
						operation: "add"
					},
					alpha: {
						srcFactor: "one",
						dstFactor: "one-minus-src-alpha",
						operation: "add"
					}
				}
			}]
		},
		primitive: { topology: "triangle-list" }
	}), s = e.createSampler({
		label: "compositor-2.5d sampler",
		magFilter: "linear",
		minFilter: "linear"
	}), c = q * 4, l = [];
	for (let t = 0; t < i.maxLayers; t++) l.push({
		vertexBuffer: e.createBuffer({
			label: `compositor-2.5d vertices-${t}`,
			size: c,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		}),
		uniformBuffer: e.createBuffer({
			label: `compositor-2.5d uniforms-${t}`,
			size: 32,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		})
	});
	let u = new Float32Array(q), d = new Float32Array(8);
	function f(t, n) {
		return e.createBindGroup({
			label: "compositor-2.5d bind",
			layout: o.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: { buffer: t.uniformBuffer }
				},
				{
					binding: 1,
					resource: s
				},
				{
					binding: 2,
					resource: n.createView()
				}
			]
		});
	}
	return {
		render(t, n, r) {
			if (r.length === 0) return;
			let a = [...r].sort((e, t) => t.depth - e.depth), s = Math.min(a.length, i.maxLayers), c = [];
			for (let t = 0; t < s; t++) {
				let n = a[t], r = l[t];
				J(n.quad, u, 0), e.queue.writeBuffer(r.vertexBuffer, 0, u), d[0] = n.opacity, d[1] = n.rim?.intensity ?? 0, d[2] = n.rim?.falloff ?? 3, d[3] = n.rim?.color?.[0] ?? 1, d[4] = n.rim?.color?.[1] ?? 1, d[5] = n.rim?.color?.[2] ?? 1, e.queue.writeBuffer(r.uniformBuffer, 0, d), c.push(f(r, n.texture));
			}
			let p = t.beginRenderPass({ colorAttachments: [{
				view: n,
				loadOp: "load",
				storeOp: "store"
			}] });
			p.setPipeline(o);
			for (let e = 0; e < s; e++) p.setVertexBuffer(0, l[e].vertexBuffer), p.setBindGroup(0, c[e]), p.draw(K);
			p.end();
		},
		resize(e, t) {},
		destroy() {
			for (let e of l) e.vertexBuffer.destroy(), e.uniformBuffer.destroy();
		}
	};
}
//#endregion
//#region src/presets.ts
var X = {
	camera: {
		focalLength: 50,
		z: 200
	},
	layers: [
		{
			role: "background",
			depth: 500,
			opacity: 1,
			parallaxScale: .2
		},
		{
			role: "subject",
			depth: 200,
			opacity: 1,
			parallaxScale: 1
		},
		{
			role: "foreground",
			depth: 100,
			opacity: .85,
			parallaxScale: 1.4
		}
	],
	description: "Standard 3-layer 50mm composition."
}, Z = [
	{
		name: "postcard-classic",
		label: "Postcard Classic",
		config: {
			camera: {
				focalLength: 50,
				z: 200
			},
			layers: [
				{
					role: "background",
					depth: 500,
					opacity: 1,
					parallaxScale: .2
				},
				{
					role: "midground",
					depth: 300,
					opacity: 1,
					parallaxScale: .6
				},
				{
					role: "subject",
					depth: 200,
					opacity: 1,
					parallaxScale: 1
				},
				{
					role: "foreground",
					depth: 100,
					opacity: .85,
					parallaxScale: 1.4
				}
			],
			animation: {
				durationSeconds: 8,
				loop: !0,
				keyframes: [
					{
						t: 0,
						camera: {
							panX: -8,
							panY: -2
						}
					},
					{
						t: .5,
						camera: {
							panX: 8,
							panY: 2
						}
					},
					{
						t: 1,
						camera: {
							panX: -8,
							panY: -2
						}
					}
				]
			},
			description: "Gentle lateral drift — the Moving Postcard signature look."
		}
	},
	{
		name: "perspective-floor",
		label: "Perspective Floor",
		config: {
			camera: {
				focalLength: 35,
				z: 180,
				panY: 30
			},
			layers: [
				{
					role: "sky",
					depth: 800,
					opacity: 1,
					parallaxScale: .1
				},
				{
					role: "background",
					depth: 450,
					opacity: 1,
					parallaxScale: .3
				},
				{
					role: "subject",
					depth: 200,
					opacity: 1,
					parallaxScale: 1
				},
				{
					role: "floor",
					depth: 150,
					opacity: 1,
					parallaxScale: 1.2
				},
				{
					role: "foreground",
					depth: 60,
					opacity: .7,
					parallaxScale: 1.8
				}
			],
			animation: {
				durationSeconds: 12,
				loop: !0,
				keyframes: [
					{
						t: 0,
						camera: { panY: 30 }
					},
					{
						t: .5,
						camera: { panY: 20 }
					},
					{
						t: 1,
						camera: { panY: 30 }
					}
				]
			},
			description: "Wide-angle floor perspective with vertical breathing motion."
		}
	},
	{
		name: "dolly-reveal",
		label: "Dolly Reveal",
		config: {
			camera: {
				focalLength: 85,
				z: 350
			},
			layers: [
				{
					role: "background",
					depth: 600,
					opacity: 1,
					parallaxScale: .15
				},
				{
					role: "midground",
					depth: 400,
					opacity: 1,
					parallaxScale: .5
				},
				{
					role: "subject",
					depth: 250,
					opacity: 1,
					parallaxScale: 1
				},
				{
					role: "foreground",
					depth: 120,
					opacity: .9,
					parallaxScale: 1.5
				},
				{
					role: "atmosphere",
					depth: 60,
					opacity: .3,
					parallaxScale: 2
				}
			],
			animation: {
				durationSeconds: 6,
				loop: !1,
				keyframes: [{
					t: 0,
					camera: {
						focalLength: 85,
						z: 350
					}
				}, {
					t: 1,
					camera: {
						focalLength: 50,
						z: 200
					}
				}]
			},
			description: "Telephoto pull-back to standard — cinematic dolly reveal with focal length shift."
		}
	},
	{
		name: "window-parallax",
		label: "Window Parallax",
		config: {
			camera: {
				focalLength: 50,
				z: 160
			},
			layers: [
				{
					role: "exterior",
					depth: 500,
					opacity: 1,
					parallaxScale: .15
				},
				{
					role: "midground",
					depth: 300,
					opacity: 1,
					parallaxScale: .5
				},
				{
					role: "subject",
					depth: 180,
					opacity: 1,
					parallaxScale: 1
				},
				{
					role: "windowframe",
					depth: 40,
					opacity: 1,
					parallaxScale: 2.2
				}
			],
			animation: {
				durationSeconds: 10,
				loop: !0,
				keyframes: [
					{
						t: 0,
						camera: {
							panX: -6,
							panY: -3
						}
					},
					{
						t: .25,
						camera: {
							panX: 4,
							panY: -5
						}
					},
					{
						t: .5,
						camera: {
							panX: 6,
							panY: 3
						}
					},
					{
						t: .75,
						camera: {
							panX: -4,
							panY: 5
						}
					},
					{
						t: 1,
						camera: {
							panX: -6,
							panY: -3
						}
					}
				]
			},
			description: "Window-frame framing with orbital-style pan path — peering through glass."
		}
	},
	{
		name: "macro-still",
		label: "Macro Still",
		config: {
			camera: {
				focalLength: 135,
				z: 120
			},
			layers: [
				{
					role: "background",
					depth: 250,
					opacity: .7,
					parallaxScale: .2
				},
				{
					role: "subject",
					depth: 160,
					opacity: 1,
					parallaxScale: 1
				},
				{
					role: "foreground",
					depth: 100,
					opacity: .5,
					parallaxScale: 1.8
				}
			],
			animation: {
				durationSeconds: 16,
				loop: !0,
				keyframes: [
					{
						t: 0,
						camera: {
							panX: -3,
							panY: -1
						}
					},
					{
						t: .5,
						camera: {
							panX: 3,
							panY: 1
						}
					},
					{
						t: 1,
						camera: {
							panX: -3,
							panY: -1
						}
					}
				]
			},
			description: "Telephoto macro with razor-thin depth — barely perceptible drift."
		}
	}
];
function Q(e) {
	return Z.find((t) => t.name === e);
}
function $(e) {
	return t(e.camera);
}
function te(e, t) {
	let n = [];
	for (let r = 0; r < e.layers.length; r++) {
		let i = e.layers[r], a = t(i.role, r);
		a !== void 0 && n.push({
			id: i.role,
			depth: i.depth,
			opacity: i.opacity,
			parallaxScale: i.parallaxScale,
			content: a
		});
	}
	return n;
}
function ne(e, n) {
	if (!e.animation || e.animation.keyframes.length === 0) return $(e);
	let { durationSeconds: r, keyframes: a, loop: o } = e.animation, s;
	if (s = o ? (n % r + r) % r / r : Math.max(0, Math.min(1, n / r)), s <= a[0].t) return t({
		...e.camera,
		...a[0].camera
	});
	let c = a[a.length - 1];
	if (s >= c.t) return t({
		...e.camera,
		...c.camera
	});
	let l = a[0], u = a[1];
	for (let e = 1; e < a.length; e++) if (a[e].t >= s) {
		l = a[e - 1], u = a[e];
		break;
	}
	let d = (s - l.t) / (u.t - l.t);
	return i(t({
		...e.camera,
		...l.camera
	}), t({
		...e.camera,
		...u.camera
	}), d, u.easing);
}
//#endregion
export { h as DEFAULT_FOCAL_LENGTH, _ as FACE_ORDER, Z as SCENE_PRESETS, X as SCENE_PRESET_DEFAULTS, g as VISIBILITY_EPSILON, E as buildBoxRig, L as buildPerspectiveCorners, z as buildPerspectivePlaneGroup, $ as buildPresetCamera, te as buildPresetLayers, O as compileBoxRigFaceToPlaneInput, t as createCamera, Y as createCompositor, B as createLayer, n as createOrbitalCamera, o as dolly, ne as evaluatePresetAnimation, Q as findPreset, F as interpolateQuad, i as mixCamera, a as mixOrbitalCamera, p as normalizedToViewport, l as orbit, s as pan, u as projectPoint, f as projectPointOrbital, d as projectPointWithCamera, D as resolveBoxRigFaces, R as resolveChildQuad, H as resolveLayersWithCamera, P as sampleQuad, m as sortByDepth, V as sortLayersByDepth, I as translateQuad, c as truck, ee as viewportToNormalized };
