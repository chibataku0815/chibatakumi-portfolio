/**
 * compositor.ts — WebGPU textured quad renderer for 2.5D compositions.
 *
 * Draws N layers as perspective-warped textured quads using painter's algorithm.
 * Each layer = 2 triangles (6 vertices) built from Quad corners.
 *
 * Convention: follows gpu-fx-presets factory pattern (createXxx → object with render/resize/destroy).
 */

import type { Quad } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompositorConfig {
  readonly maxLayers: number;
}

export interface RimConfig {
  readonly intensity: number;  // 0=none, 0.1-0.3=subtle
  readonly falloff: number;    // 2-6, higher = more edge-focused
  readonly color: readonly [number, number, number]; // RGB [0-1]
}

export interface CompositorLayer {
  readonly texture: GPUTexture;
  readonly quad: Quad;
  readonly opacity: number;
  readonly depth: number;
  readonly rim?: RimConfig;
}

export interface Compositor {
  render(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
    layers: CompositorLayer[],
  ): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Shader
// ---------------------------------------------------------------------------

const SHADER_CODE = /* wgsl */ `
struct Uniforms {
  opacity: f32,
  rimIntensity: f32,
  rimFalloff: f32,
  rimColorR: f32,
  rimColorG: f32,
  rimColorB: f32,
  _pad0: f32,
  _pad1: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2) var tex: texture_2d<f32>;

struct VOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@location(0) pos: vec2f, @location(1) uv: vec2f) -> VOut {
  var out: VOut;
  out.position = vec4f(pos, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let color = textureSample(tex, texSampler, in.uv);
  let edgeX = 1.0 - pow(abs(in.uv.x - 0.5) * 2.0, uniforms.rimFalloff);
  let edgeY = 1.0 - pow(abs(in.uv.y - 0.5) * 2.0, uniforms.rimFalloff);
  let edgeFactor = 1.0 - edgeX * edgeY;
  let dissolve = 1.0 - edgeFactor * uniforms.rimIntensity;
  let finalColor = color.rgb * dissolve;
  return vec4f(finalColor, color.a * uniforms.opacity * dissolve);
}
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPOSITOR_DEFAULTS: CompositorConfig = { maxLayers: 8 };
const FLOATS_PER_VERTEX = 4; // x, y, u, v
const VERTICES_PER_QUAD = 6; // 2 triangles
const QUAD_FLOATS = FLOATS_PER_VERTEX * VERTICES_PER_QUAD; // 24

/** Build 6 vertices (2 triangles) from Quad corners. Positions already in NDC. */
function quadToVertices(quad: Quad, out: Float32Array, offset: number): void {
  const tl = quad.topLeft;
  const tr = quad.topRight;
  const br = quad.bottomRight;
  const bl = quad.bottomLeft;

  // Triangle 1: TL → TR → BR
  let o = offset;
  out[o++] = tl.x; out[o++] = tl.y; out[o++] = 0; out[o++] = 0;
  out[o++] = tr.x; out[o++] = tr.y; out[o++] = 1; out[o++] = 0;
  out[o++] = br.x; out[o++] = br.y; out[o++] = 1; out[o++] = 1;

  // Triangle 2: TL → BR → BL
  out[o++] = tl.x; out[o++] = tl.y; out[o++] = 0; out[o++] = 0;
  out[o++] = br.x; out[o++] = br.y; out[o++] = 1; out[o++] = 1;
  out[o++] = bl.x; out[o++] = bl.y; out[o++] = 0; out[o++] = 1;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCompositor(
  device: GPUDevice,
  width: number,
  height: number,
  userConfig?: Partial<CompositorConfig>,
): Compositor {
  const config = { ...COMPOSITOR_DEFAULTS, ...userConfig };
  let _w = width;
  let _h = height;

  // --- Shader & Pipeline ---
  const shaderModule = device.createShaderModule({
    label: "compositor-2.5d",
    code: SHADER_CODE,
  });

  const pipeline = device.createRenderPipeline({
    label: "compositor-2.5d",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: FLOATS_PER_VERTEX * 4, // 16 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" as GPUVertexFormat },  // pos
            { shaderLocation: 1, offset: 8, format: "float32x2" as GPUVertexFormat },  // uv
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [
        {
          format: "rgba16float" as GPUTextureFormat,
          blend: {
            color: {
              srcFactor: "src-alpha" as GPUBlendFactor,
              dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
              operation: "add" as GPUBlendOperation,
            },
            alpha: {
              srcFactor: "one" as GPUBlendFactor,
              dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
              operation: "add" as GPUBlendOperation,
            },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  });

  // --- Shared resources ---
  const sampler = device.createSampler({
    label: "compositor-2.5d sampler",
    magFilter: "linear",
    minFilter: "linear",
  });

  // Per-layer buffers: each layer gets its own vertex + uniform buffer
  // so that device.queue.writeBuffer() for different layers don't
  // overwrite each other before the render pass executes.
  const UNIFORM_SIZE = 32; // 8 f32
  const VERTEX_SIZE = QUAD_FLOATS * 4; // bytes

  interface LayerSlot {
    vertexBuffer: GPUBuffer;
    uniformBuffer: GPUBuffer;
  }

  const slots: LayerSlot[] = [];
  for (let i = 0; i < config.maxLayers; i++) {
    slots.push({
      vertexBuffer: device.createBuffer({
        label: `compositor-2.5d vertices-${i}`,
        size: VERTEX_SIZE,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      }),
      uniformBuffer: device.createBuffer({
        label: `compositor-2.5d uniforms-${i}`,
        size: UNIFORM_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
    });
  }
  const vertexData = new Float32Array(QUAD_FLOATS);
  const uniformData = new Float32Array(8);

  function makeBindGroup(slot: LayerSlot, texture: GPUTexture): GPUBindGroup {
    return device.createBindGroup({
      label: "compositor-2.5d bind",
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: slot.uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: texture.createView() },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // Public interface
  // ---------------------------------------------------------------------------

  return {
    render(encoder, outputView, layers) {
      if (layers.length === 0) return;

      // Sort back-to-front (descending depth = painter's algorithm)
      const sorted = [...layers].sort((a, b) => b.depth - a.depth);
      const count = Math.min(sorted.length, config.maxLayers);

      // Upload all per-layer data BEFORE recording the render pass.
      // Each layer writes to its own buffers so writes don't clobber.
      const bindGroups: GPUBindGroup[] = [];
      for (let i = 0; i < count; i++) {
        const layer = sorted[i];
        const slot = slots[i];

        quadToVertices(layer.quad, vertexData, 0);
        device.queue.writeBuffer(slot.vertexBuffer, 0, vertexData);

        uniformData[0] = layer.opacity;
        uniformData[1] = layer.rim?.intensity ?? 0;
        uniformData[2] = layer.rim?.falloff ?? 3;
        uniformData[3] = layer.rim?.color?.[0] ?? 1;
        uniformData[4] = layer.rim?.color?.[1] ?? 1;
        uniformData[5] = layer.rim?.color?.[2] ?? 1;
        device.queue.writeBuffer(slot.uniformBuffer, 0, uniformData);

        bindGroups.push(makeBindGroup(slot, layer.texture));
      }

      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: outputView,
            loadOp: "load" as GPULoadOp,
            storeOp: "store" as GPUStoreOp,
          },
        ],
      });
      pass.setPipeline(pipeline);

      for (let i = 0; i < count; i++) {
        pass.setVertexBuffer(0, slots[i].vertexBuffer);
        pass.setBindGroup(0, bindGroups[i]);
        pass.draw(VERTICES_PER_QUAD);
      }

      pass.end();
    },

    resize(w, h) {
      _w = w;
      _h = h;
    },

    destroy() {
      for (const slot of slots) {
        slot.vertexBuffer.destroy();
        slot.uniformBuffer.destroy();
      }
    },
  };
}
