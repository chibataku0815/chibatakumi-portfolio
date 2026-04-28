/// <reference path="./env.d.ts" />

import {
  createFilmPostPipeline,
  type FilmPostConfig,
  type FilmPostPipeline,
} from "gpu-film-post";
import passthroughShader from "./passthrough.wgsl?raw";

export type MotionFilmPostConfig = FilmPostConfig;

export interface MotionFilmPostPass {
  render(
    encoder: GPUCommandEncoder,
    sceneTextureView: GPUTextureView,
    outputView: GPUTextureView,
    time: number,
    width: number,
    height: number,
  ): void;
  updateConfig(config: Partial<MotionFilmPostConfig>): void;
  destroy(): void;
}

export const motionFilmDefaults: MotionFilmPostConfig = {
  grain: { intensity: 0.12, size: 0.6, radialMix: 0.35 },
  chromaticAberration: { amount: 0.0012 },
  bloom: { threshold: 0.55, intensity: 0.65, warmth: 0.0 },
  vignette: { strength: 0.6, warmShift: 0.0 },
  lightLeak: { intensity: 0.0 },
  tonemap: { shadowLift: 0.0, compression: 0.0 },
};

export const motionFilmPassthroughDefaults: MotionFilmPostConfig = {
  grain: { intensity: 0.0, size: 0.6, radialMix: 0.0 },
  chromaticAberration: { amount: 0.0 },
  bloom: { threshold: 1.0, intensity: 0.0, warmth: 0.0 },
  vignette: { strength: 0.0, warmShift: 0.0 },
  lightLeak: { intensity: 0.0 },
  tonemap: { shadowLift: 0.0, compression: 0.0 },
};

function createGammaPassthroughPass(
  device: GPUDevice,
  format: GPUTextureFormat,
): MotionFilmPostPass {
  const shaderModule = device.createShaderModule({
    label: "film-post gamma passthrough",
    code: passthroughShader,
  });

  const pipeline = device.createRenderPipeline({
    label: "film-post gamma passthrough",
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

  const sampler = device.createSampler({
    label: "film-post gamma passthrough",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  let bindGroup: GPUBindGroup | null = null;
  let lastSceneView: GPUTextureView | null = null;

  return {
    render(
      encoder: GPUCommandEncoder,
      sceneTextureView: GPUTextureView,
      outputView: GPUTextureView,
    ): void {
      if (sceneTextureView !== lastSceneView) {
        bindGroup = device.createBindGroup({
          label: "film-post gamma passthrough",
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: sceneTextureView },
          ],
        });
        lastSceneView = sceneTextureView;
      }

      const pass = encoder.beginRenderPass({
        label: "film-post gamma passthrough",
        colorAttachments: [{
          view: outputView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        }],
      });

      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup!);
      pass.draw(3);
      pass.end();
    },
    updateConfig(): void {
      // Raw mode has no runtime config surface.
    },
    destroy(): void {
      bindGroup = null;
      lastSceneView = null;
    },
  };
}

function mergeConfig(
  base: MotionFilmPostConfig,
  override?: Partial<MotionFilmPostConfig>,
): MotionFilmPostConfig {
  return {
    grain: { ...base.grain, ...override?.grain },
    chromaticAberration: {
      ...base.chromaticAberration,
      ...override?.chromaticAberration,
    },
    bloom: { ...base.bloom, ...override?.bloom },
    vignette: { ...base.vignette, ...override?.vignette },
    lightLeak: { ...base.lightLeak, ...override?.lightLeak },
    tonemap: { ...base.tonemap, ...override?.tonemap },
  };
}

export function createFilmPostPass(
  device: GPUDevice,
  format: GPUTextureFormat,
  config?: Partial<MotionFilmPostConfig>,
): MotionFilmPostPass {
  const pipeline: FilmPostPipeline = createFilmPostPipeline(
    device,
    format,
    mergeConfig(motionFilmDefaults, config),
  );

  let width = -1;
  let height = -1;

  return {
    render(
      encoder: GPUCommandEncoder,
      sceneTextureView: GPUTextureView,
      outputView: GPUTextureView,
      time: number,
      nextWidth: number,
      nextHeight: number,
    ): void {
      if (width !== nextWidth || height !== nextHeight) {
        width = nextWidth;
        height = nextHeight;
        pipeline.resize(width, height);
      }

      pipeline.render(encoder, sceneTextureView, outputView, { time });
    },
    updateConfig(nextConfig: Partial<MotionFilmPostConfig>): void {
      pipeline.updateConfig(nextConfig);
    },
    destroy(): void {
      pipeline.destroy();
    },
  };
}

export function createPassthroughFilmPostPass(
  device: GPUDevice,
  format: GPUTextureFormat,
): MotionFilmPostPass {
  return createGammaPassthroughPass(device, format);
}
