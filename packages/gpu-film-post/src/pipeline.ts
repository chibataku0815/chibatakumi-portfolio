import compositeShader from "./shaders/composite.wgsl?raw";
import { DEFAULT_CONFIG } from "./types";
import type { FilmPostConfig, FilmPostPipeline, FilmPostUniforms } from "./types";

// ── Internal resolved config (all values guaranteed present) ────────

interface ResolvedConfig {
  grainIntensity: number;
  grainSize: number;
  grainRadialMix: number;
  caAmount: number;
  bloomThreshold: number;
  bloomIntensity: number;
  bloomWarmth: number;
  vignetteStrength: number;
  vignetteWarmShift: number;
  leakIntensity: number;
  shadowLift: number;
  tonemapCompression: number;
}

// ── Helpers ─────────────────────────────────────────────────────────

function resolveConfig(user?: Partial<FilmPostConfig>): ResolvedConfig {
  return {
    grainIntensity: user?.grain?.intensity ?? DEFAULT_CONFIG.grainIntensity,
    grainSize: user?.grain?.size ?? DEFAULT_CONFIG.grainSize,
    grainRadialMix: user?.grain?.radialMix ?? DEFAULT_CONFIG.grainRadialMix,
    caAmount:
      user?.chromaticAberration?.amount ?? DEFAULT_CONFIG.caAmount,
    bloomThreshold: user?.bloom?.threshold ?? DEFAULT_CONFIG.bloomThreshold,
    bloomIntensity: user?.bloom?.intensity ?? DEFAULT_CONFIG.bloomIntensity,
    bloomWarmth: user?.bloom?.warmth ?? DEFAULT_CONFIG.bloomWarmth,
    vignetteStrength: user?.vignette?.strength ?? DEFAULT_CONFIG.vignetteStrength,
    vignetteWarmShift:
      user?.vignette?.warmShift ?? DEFAULT_CONFIG.vignetteWarmShift,
    leakIntensity: user?.lightLeak?.intensity ?? DEFAULT_CONFIG.leakIntensity,
    shadowLift: user?.tonemap?.shadowLift ?? DEFAULT_CONFIG.shadowLift,
    tonemapCompression:
      user?.tonemap?.compression ?? DEFAULT_CONFIG.tonemapCompression,
  };
}

function mergeConfig(
  base: ResolvedConfig,
  partial: Partial<FilmPostConfig>,
): ResolvedConfig {
  return {
    grainIntensity: partial.grain?.intensity ?? base.grainIntensity,
    grainSize: partial.grain?.size ?? base.grainSize,
    grainRadialMix: partial.grain?.radialMix ?? base.grainRadialMix,
    caAmount: partial.chromaticAberration?.amount ?? base.caAmount,
    bloomThreshold: partial.bloom?.threshold ?? base.bloomThreshold,
    bloomIntensity: partial.bloom?.intensity ?? base.bloomIntensity,
    bloomWarmth: partial.bloom?.warmth ?? base.bloomWarmth,
    vignetteStrength: partial.vignette?.strength ?? base.vignetteStrength,
    vignetteWarmShift: partial.vignette?.warmShift ?? base.vignetteWarmShift,
    leakIntensity: partial.lightLeak?.intensity ?? base.leakIntensity,
    shadowLift: partial.tonemap?.shadowLift ?? base.shadowLift,
    tonemapCompression:
      partial.tonemap?.compression ?? base.tonemapCompression,
  };
}

// ── Uniform buffer: 16 x f32 = 64 bytes ────────────────────────────
//
//  [0]  time
//  [1]  pulse
//  [2]  resolution.x
//  [3]  resolution.y
//  [4]  grainIntensity
//  [5]  grainSize
//  [6]  caAmount
//  [7]  bloomThreshold
//  [8]  bloomIntensity
//  [9]  bloomWarmth
//  [10] vignetteStrength
//  [11] vignetteWarmShift
//  [12] leakIntensity
//  [13] shadowLift
//  [14] tonemapCompression
//  [15] grainRadialMix

const UNIFORM_FLOATS = 16;
const UNIFORM_BYTES = UNIFORM_FLOATS * 4; // 64

// ── Factory ─────────────────────────────────────────────────────────

export function createFilmPostPipeline(
  device: GPUDevice,
  format: GPUTextureFormat,
  config?: Partial<FilmPostConfig>,
): FilmPostPipeline {
  // Shader module
  const shaderModule = device.createShaderModule({
    label: "film-post composite",
    code: compositeShader,
  });

  // Render pipeline (auto layout, fullscreen triangle)
  const renderPipeline = device.createRenderPipeline({
    label: "film-post pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // Uniform buffer (allocated once, reused every frame)
  const uniformBuffer = device.createBuffer({
    label: "film-post uniforms",
    size: UNIFORM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Sampler
  const sampler = device.createSampler({
    label: "film-post sampler",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  // Mutable state
  let cfg = resolveConfig(config);
  let width = 0;
  let height = 0;
  let lastSceneView: GPUTextureView | null = null;
  let bindGroup: GPUBindGroup | null = null;

  // Pre-allocated typed array for uniform writes
  const uniformData = new Float32Array(UNIFORM_FLOATS);

  // ── Methods ─────────────────────────────────────────────────────

  function render(
    encoder: GPUCommandEncoder,
    sceneTextureView: GPUTextureView,
    outputView: GPUTextureView,
    uniforms: FilmPostUniforms,
  ): void {
    // 1. Write uniforms
    uniformData[0] = uniforms.time;
    uniformData[1] = uniforms.pulse ?? 0;
    uniformData[2] = width;
    uniformData[3] = height;
    uniformData[4] = cfg.grainIntensity;
    uniformData[5] = cfg.grainSize;
    uniformData[6] = cfg.caAmount;
    uniformData[7] = cfg.bloomThreshold;
    uniformData[8] = cfg.bloomIntensity;
    uniformData[9] = cfg.bloomWarmth;
    uniformData[10] = cfg.vignetteStrength;
    uniformData[11] = cfg.vignetteWarmShift;
    uniformData[12] = cfg.leakIntensity;
    uniformData[13] = cfg.shadowLift;
    uniformData[14] = cfg.tonemapCompression;
    uniformData[15] = cfg.grainRadialMix;

    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // 2. Recreate bind group if scene texture changed
    if (sceneTextureView !== lastSceneView) {
      bindGroup = device.createBindGroup({
        label: "film-post bind group",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: sampler },
          { binding: 2, resource: sceneTextureView },
        ],
      });
      lastSceneView = sceneTextureView;
    }

    // 3. Render pass
    const pass = encoder.beginRenderPass({
      label: "film-post pass",
      colorAttachments: [
        {
          view: outputView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear" as const,
          storeOp: "store" as const,
        },
      ],
    });

    pass.setPipeline(renderPipeline);
    pass.setBindGroup(0, bindGroup!);
    pass.draw(3);
    pass.end();
  }

  function resize(w: number, h: number): void {
    width = w;
    height = h;
  }

  function updateConfig(partial: Partial<FilmPostConfig>): void {
    cfg = mergeConfig(cfg, partial);
  }

  function destroy(): void {
    uniformBuffer.destroy();
    bindGroup = null;
    lastSceneView = null;
  }

  return { render, resize, updateConfig, destroy };
}
