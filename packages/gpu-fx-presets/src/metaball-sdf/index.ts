import type { MetaballParticleSource } from "../metaball-types";
import shaderCode from "./shader.wgsl?raw";

export interface MetaballSDFConfig {
  bgColor: [number, number, number, number];
  threshold: number;
  softness: number;
  rimIntensity: number;
}

export interface MetaballSDF {
  render(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
    time: number,
    source: MetaballParticleSource,
  ): void;
  resize(width: number, height: number): void;
  updateConfig(config: Partial<MetaballSDFConfig>): void;
  getConfig(): MetaballSDFConfig;
  destroy(): void;
}

export const METABALL_SDF_DEFAULTS: MetaballSDFConfig = {
  bgColor: [0.82, 0.82, 0.82, 1.0],
  threshold: 1.0,
  softness: 0.015,
  rimIntensity: 0.15,
};

const PARAMS_FLOATS = 12;
const PARAMS_BYTES = PARAMS_FLOATS * 4;

export function createMetaballSDF(
  device: GPUDevice,
  width: number,
  height: number,
  userConfig?: Partial<MetaballSDFConfig>,
): MetaballSDF {
  let config = { ...METABALL_SDF_DEFAULTS, ...userConfig };
  let W = width;
  let H = height;
  let lastTime: number | null = null;

  const paramsBuffer = device.createBuffer({
    label: "metaball-sdf params",
    size: PARAMS_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const paramsBytes = new ArrayBuffer(PARAMS_BYTES);
  const paramsF32 = new Float32Array(paramsBytes);
  const paramsU32 = new Uint32Array(paramsBytes);

  const shaderModule = device.createShaderModule({
    label: "metaball-sdf",
    code: shaderCode,
  });
  const pipeline = device.createRenderPipeline({
    label: "metaball-sdf",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [{ format: "rgba16float" }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // Default 1x1 white mask (no clipping for scenes without mask)
  const defaultMask = device.createTexture({
    label: "metaball-sdf default-mask",
    size: [1, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture: defaultMask },
    new Uint8Array([255, 255, 255, 255]),
    { bytesPerRow: 4 },
    [1, 1],
  );
  const maskSampler = device.createSampler({
    label: "metaball-sdf mask-sampler",
    magFilter: "linear",
    minFilter: "linear",
  });

  let cachedParticleBuffer: GPUBuffer | null = null;
  let cachedMaskTexture: GPUTexture | null = null;
  let bindGroup: GPUBindGroup | null = null;

  function getBindGroup(
    particleBuffer: GPUBuffer,
    maskTexture?: GPUTexture,
  ): GPUBindGroup {
    const mask = maskTexture ?? defaultMask;
    if (!bindGroup || cachedParticleBuffer !== particleBuffer || cachedMaskTexture !== mask) {
      bindGroup = device.createBindGroup({
        label: "metaball-sdf bind group",
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: paramsBuffer } },
          { binding: 1, resource: { buffer: particleBuffer } },
          { binding: 2, resource: mask.createView() },
          { binding: 3, resource: maskSampler },
        ],
      });
      cachedParticleBuffer = particleBuffer;
      cachedMaskTexture = mask;
    }
    return bindGroup;
  }

  return {
    render(encoder, outputView, time, source) {
      const dt = lastTime === null ? 0 : Math.max(0, time - lastTime);
      lastTime = time;

      source.update(encoder, time, dt);

      paramsF32[0] = W;
      paramsF32[1] = H;
      paramsF32[2] = time;
      paramsU32[3] = source.count;
      paramsF32[4] = config.bgColor[0];
      paramsF32[5] = config.bgColor[1];
      paramsF32[6] = config.bgColor[2];
      paramsF32[7] = config.bgColor[3];
      paramsF32[8] = config.threshold;
      paramsF32[9] = config.softness;
      paramsF32[10] = source.maskBlend ?? 0.0;
      paramsF32[11] = config.rimIntensity;
      device.queue.writeBuffer(paramsBuffer, 0, paramsBytes);

      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: outputView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, getBindGroup(source.particleBuffer, source.maskTexture));
      pass.draw(3);
      pass.end();
    },
    resize(width, height) {
      W = width;
      H = height;
    },
    updateConfig(nextConfig) {
      config = { ...config, ...nextConfig };
    },
    getConfig() {
      return {
        bgColor: [...config.bgColor] as [number, number, number, number],
        threshold: config.threshold,
        softness: config.softness,
        rimIntensity: config.rimIntensity,
      };
    },
    destroy() {
      paramsBuffer.destroy();
      defaultMask.destroy();
    },
  };
}
