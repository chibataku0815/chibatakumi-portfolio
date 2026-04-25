// ============================================================
// motion-flowline-webgpu — Phase 8 host-side ribbon render
// Plan:     .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase8-plan.md §2 Stream B
// Handoff:  docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §9
// Pattern:  output/motion-dot-new-webgpu/src/render/metaball-pass.ts
//
// Responsibilities:
//   - Build the ribbon render pipeline consuming the agent + trail storage
//     buffers produced by Phase 7's compute pass.
//   - Own the RibbonParams uniform (32 B) and upload fresh values per frame.
//   - Emit a single triangle-strip draw of 128 vertices × nAgents instances
//     with premultiplied-alpha blending into an rgba16float target.
// ============================================================

import RIBBON_WGSL from "./ribbon.wgsl?raw";
import { PALETTE_WGSL, paletteGpuColor } from "webgpu-motion-art";
import type { RibbonConfig } from "./ribbon-config";

// ── Layout constants (exported for cross-stream alignment) ─────

/** RibbonParams uniform size in bytes (Integration Contract §2.x).
 *  Phase 10: 32 B → 48 B, added rimPulse at idx 7 and vec4f _pad at idx 8–11. */
export const RIBBON_PARAMS_BYTES = 48;
/** Number of f32 slots in RibbonParams. */
export const RIBBON_PARAMS_FLOATS = 12;
/** vertexCount = 2 * N_TRAIL. Hand off together with N_TRAIL to keep them aligned. */
export const RIBBON_VERTEX_COUNT = 128;

// ── Public API types ──────────────────────────────────────────

export type CreateRibbonPassOptions = {
  targetFormat: GPUTextureFormat; // "rgba16float" expected
  agentBuffer: GPUBuffer;
  trailBuffer: GPUBuffer;
  nAgents: number;
  nTrail: 64; // literal — enforces Contract C5
  config: RibbonConfig;
};

export type RibbonRenderFrame = {
  viewWidth: number;
  viewHeight: number;
  /** Audio trebleOnset — trail tip rim highlight. 0 disables the pulse. */
  rimPulse?: number;
};

export type RibbonPassHandle = {
  render(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    frame: RibbonRenderFrame,
  ): void;
  updateConfig(patch: Partial<RibbonConfig>): void;
  destroy(): void;
};

// ── Main factory ──────────────────────────────────────────────

export function createRibbonPass(
  device: GPUDevice,
  options: CreateRibbonPassOptions,
): RibbonPassHandle {
  const { targetFormat, agentBuffer, trailBuffer, nAgents, nTrail } = options;

  // ── Shader module (palette prelude + ribbon body) ─────────
  const module = device.createShaderModule({
    label: "flowline-ribbon-module",
    code: `${PALETTE_WGSL}\n\n${RIBBON_WGSL}`,
  });

  // ── Render pipeline ───────────────────────────────────────
  // N_TRAIL is referenced in the vertex stage to drive per-vertex strip
  // indexing; the fragment stage does not need the override. We intentionally
  // omit `stripIndexFormat` — WebGPU requires that field only for indexed
  // draws, and this pipeline issues a non-indexed draw.
  const pipeline = device.createRenderPipeline({
    label: "flowline-ribbon",
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs",
      constants: { N_TRAIL: nTrail },
    },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [
        {
          format: targetFormat,
          blend: {
            color: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    },
    primitive: {
      topology: "triangle-strip",
      cullMode: "none",
    },
  });

  // ── Params uniform buffer ─────────────────────────────────
  const paramsBuffer = device.createBuffer({
    label: "flowline-ribbon-params",
    size: RIBBON_PARAMS_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // ── Bind group (agents + trails + params) ─────────────────
  const bindGroup = device.createBindGroup({
    label: "flowline-ribbon-bg",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: agentBuffer } },
      { binding: 1, resource: { buffer: trailBuffer } },
      { binding: 2, resource: { buffer: paramsBuffer } },
    ],
  });

  // ── Mutable state ─────────────────────────────────────────
  const currentConfig: RibbonConfig = { ...options.config };
  const paramsData = new Float32Array(RIBBON_PARAMS_FLOATS);

  function render(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    frame: RibbonRenderFrame,
  ): void {
    const aspect = frame.viewWidth / Math.max(1, frame.viewHeight);

    // Pack uniform — layout matches WGSL RibbonParams struct (Contract §2.x rev Phase 10)
    paramsData[0] = currentConfig.maxWidth;
    paramsData[1] = currentConfig.minWidth;
    paramsData[2] = currentConfig.widthSpeedK;
    paramsData[3] = currentConfig.curvatureK;
    paramsData[4] = currentConfig.widthScale;
    paramsData[5] = currentConfig.alphaScale;
    paramsData[6] = aspect;
    paramsData[7] = frame.rimPulse ?? 0;
    paramsData[8]  = 0;
    paramsData[9]  = 0;
    paramsData[10] = 0;
    paramsData[11] = 0;

    device.queue.writeBuffer(paramsBuffer, 0, paramsData);

    const pass = encoder.beginRenderPass({
      label: "flowline-ribbon",
      colorAttachments: [
        {
          view: targetView,
          clearValue: paletteGpuColor("paper"),
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(RIBBON_VERTEX_COUNT, nAgents);
    pass.end();
  }

  function updateConfig(patch: Partial<RibbonConfig>): void {
    Object.assign(currentConfig, patch);
    // No immediate writeBuffer — render() always writes fresh uniform data.
  }

  function destroy(): void {
    paramsBuffer.destroy();
  }

  return { render, updateConfig, destroy };
}
