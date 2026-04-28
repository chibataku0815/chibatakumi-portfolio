import type { Effect } from "../types";
import shaderCode from "./shader.wgsl?raw";

export interface PrismCausticConfig {
  speed: number;
  warpStrength: number;
  warpScale: number;
  bandWidth: number;
  brightness: number;
}

export const PRISM_CAUSTIC_DEFAULTS: PrismCausticConfig = {
  speed: 0.5,
  warpStrength: 0.35,
  warpScale: 1.8,
  bandWidth: 0.12,
  brightness: 1.8,
};

const UB_SIZE = 32;

export function createPrismCaustic(
  device: GPUDevice,
  width: number,
  height: number,
  userConfig?: Partial<PrismCausticConfig>,
): Effect<PrismCausticConfig> {
  let config = { ...PRISM_CAUSTIC_DEFAULTS, ...userConfig };
  let W = width, H = height;
  const cpu = new Float32Array(UB_SIZE / 4);

  const ub = device.createBuffer({ size: UB_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const sm = device.createShaderModule({ label: "prism-caustic", code: shaderCode });
  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
  });
  const pipeline = device.createRenderPipeline({
    label: "prism-caustic",
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: { module: sm, entryPoint: "vsMain" },
    fragment: { module: sm, entryPoint: "fsMain", targets: [{ format: "rgba16float" }] },
    primitive: { topology: "triangle-list" },
  });
  const bg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: ub } }] });

  return {
    render(encoder, outputView, time) {
      cpu[0] = W; cpu[1] = H; cpu[2] = time;
      cpu[3] = config.speed; cpu[4] = config.warpStrength;
      cpu[5] = config.warpScale; cpu[6] = config.bandWidth; cpu[7] = config.brightness;
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
