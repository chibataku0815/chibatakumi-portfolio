import type { Effect } from "../types";
import shaderCode from "./shader.wgsl?raw";

export interface AuroraConfig {
  horizonY: number;
  warmth: number;
  coolness: number;
  envelopeWidth: number;
  glowIntensity: number;
  brightness: number;
  animSpeed: number;
}

export const AURORA_DEFAULTS: AuroraConfig = {
  horizonY: 0.42,
  warmth: 1.2,
  coolness: 1.0,
  envelopeWidth: 0.45,
  glowIntensity: 1.0,
  brightness: 1.4,
  animSpeed: 0.15,
};

const UB_SIZE = 48;

export function createAurora(
  device: GPUDevice,
  width: number,
  height: number,
  userConfig?: Partial<AuroraConfig>,
): Effect<AuroraConfig> {
  let config = { ...AURORA_DEFAULTS, ...userConfig };
  let W = width, H = height;
  const cpu = new Float32Array(UB_SIZE / 4);

  const ub = device.createBuffer({ size: UB_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const sm = device.createShaderModule({ label: "aurora", code: shaderCode });
  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
  });
  const pipeline = device.createRenderPipeline({
    label: "aurora",
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: { module: sm, entryPoint: "vsMain" },
    fragment: { module: sm, entryPoint: "fsMain", targets: [{ format: "rgba16float" }] },
    primitive: { topology: "triangle-list" },
  });
  const bg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: ub } }] });

  return {
    render(encoder, outputView, time) {
      cpu[0] = W; cpu[1] = H; cpu[2] = time;
      cpu[3] = config.animSpeed; cpu[4] = config.horizonY;
      cpu[5] = config.warmth; cpu[6] = config.coolness;
      cpu[7] = config.envelopeWidth; cpu[8] = config.glowIntensity;
      cpu[9] = config.brightness; cpu[10] = time; cpu[11] = 0;
      device.queue.writeBuffer(ub, 0, cpu);
      const pass = encoder.beginRenderPass({
        colorAttachments: [{ view: outputView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }],
      });
      pass.setPipeline(pipeline); pass.setBindGroup(0, bg); pass.draw(3); pass.end();
    },
    resize(w, h) { W = w; H = h; },
    updateConfig(p) { config = { ...config, ...p }; },
    getConfig() { return { ...config }; },
    destroy() { ub.destroy(); },
  };
}
