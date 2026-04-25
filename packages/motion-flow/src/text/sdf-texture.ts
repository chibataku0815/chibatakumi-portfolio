// ============================================================
// motion-flowline-webgpu — Phase 11 SDF texture wrapper
//
// Allocates an r32float GPUTexture sized to the generated SDF, uploads the
// Float32Array via queue.writeTexture, and exposes a matching linear sampler
// so compute + render bind groups can share one canonical handle.
//
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase11-onward-handoff.md §6.2
// ============================================================

import type { GeneratedSdf } from "./sdf-generator";

export type FlowlineSdfTexture = {
  readonly texture: GPUTexture;
  readonly view: GPUTextureView;
  readonly sampler: GPUSampler;
  readonly width: number;
  readonly height: number;
  destroy(): void;
};

/**
 * Upload a generated SDF to GPU memory as an r32float texture.
 *
 * r32float is mandated by memory feedback_sdf_precision_r32float — uint8
 * quantization introduces visible stair-stepping on trail contours that the
 * downstream ribbon render cannot hide.
 *
 * Sampler is linear + clamp-to-edge so agents near the glyph bounds read a
 * smooth extrapolated distance instead of wrapping.
 */
export function createFlowlineSdfTexture(
  device: GPUDevice,
  sdf: GeneratedSdf,
): FlowlineSdfTexture {
  const { data, width, height } = sdf;

  const texture = device.createTexture({
    label: "flowline-sdf",
    size: { width, height, depthOrArrayLayers: 1 },
    format: "r32float",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST,
  });

  // bytesPerRow must be a multiple of 256 in WebGPU — r32float = 4 B/px so
  // `width` must satisfy width * 4 % 256 === 0. 1024 × 4 = 4096 ≡ 0 (mod 256),
  // matching §6.2 canvas size. Fail fast if future glyph registrations break
  // this contract rather than silently producing a wrong upload.
  const bytesPerRow = width * 4;
  if (bytesPerRow % 256 !== 0) {
    throw new Error(
      `SDF width ${width} yields bytesPerRow ${bytesPerRow}, not a multiple of 256. ` +
        `Adjust glyph-registry.SDF_TEXTURE_WIDTH.`,
    );
  }

  device.queue.writeTexture(
    { texture },
    data.buffer,
    { offset: data.byteOffset, bytesPerRow, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  );

  const view = texture.createView({ label: "flowline-sdf-view" });

  const sampler = device.createSampler({
    label: "flowline-sdf-sampler",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  return {
    texture,
    view,
    sampler,
    width,
    height,
    destroy() {
      texture.destroy();
    },
  };
}
