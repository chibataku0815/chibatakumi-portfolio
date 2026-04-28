import type { Effect } from "../types";
import shaderCode from "./shader.wgsl?raw";

export interface SpectrumFanConfig {
  shapeCount: number;
  fanAngle: number;
  fanRotation: number;
  pivotX: number;
  pivotY: number;
  shapeWidth: number;
  shapeHeight: number;
  opacity: number;
  brightness: number;
  skewAngle: number;
  separation: number;
  glowIntensity: number;
  hueShift: number;
  saturation: number;
  warmth: number;
  bgBrightness: number;
}

export const SPECTRUM_FAN_DEFAULTS: SpectrumFanConfig = {
  shapeCount: 12,
  fanAngle: 1.0,
  fanRotation: 2.4,
  pivotX: 0.85,
  pivotY: 0.90,
  shapeWidth: 0.028,
  shapeHeight: 0.50,
  opacity: 0.75,
  brightness: 1.5,
  skewAngle: 0.35,
  separation: 0.16,
  glowIntensity: 0.6,
  hueShift: 0.0,
  saturation: 1.0,
  warmth: 0.3,
  bgBrightness: 0.82,
};

export interface SpectrumFanPreset {
  name: string;
  label: string;
  config: Partial<SpectrumFanConfig>;
}

export const SPECTRUM_FAN_PRESETS: SpectrumFanPreset[] = [
  {
    name: "acrylic-light",
    label: "Acrylic Light",
    config: {},
  },
  {
    name: "dark-prism",
    label: "Dark Prism",
    config: {
      bgBrightness: 0.06,
      warmth: 0.0,
      brightness: 2.0,
      glowIntensity: 0.7,
      opacity: 0.6,
    },
  },
  {
    name: "moonlight",
    label: "Moonlight",
    config: {
      bgBrightness: 0.05,
      hueShift: 1.5,
      saturation: 0.8,
      warmth: -0.7,
      brightness: 1.8,
      glowIntensity: 0.6,
    },
  },
  {
    name: "golden-hour",
    label: "Golden Hour",
    config: {
      bgBrightness: 0.78,
      hueShift: -0.4,
      saturation: 1.4,
      warmth: 0.8,
      brightness: 1.6,
      glowIntensity: 0.5,
    },
  },
  {
    name: "neon-night",
    label: "Neon Night",
    config: {
      bgBrightness: 0.03,
      saturation: 1.6,
      brightness: 2.2,
      glowIntensity: 0.8,
      warmth: 0.0,
    },
  },
];

function computeBgLinear(bgBrightness: number, warmth: number): [number, number, number, number] {
  const base = bgBrightness;
  return [
    Math.max(0, base + warmth * 0.03),
    Math.max(0, base),
    Math.max(0, base - warmth * 0.02),
    1.0,
  ];
}

const UB_SIZE = 112;

export function createSpectrumFan(
  device: GPUDevice,
  width: number,
  height: number,
  userConfig?: Partial<SpectrumFanConfig>,
): Effect<SpectrumFanConfig> {
  let config = { ...SPECTRUM_FAN_DEFAULTS, ...userConfig };
  let W = width, H = height;
  const cpu = new Float32Array(28);

  const ub = device.createBuffer({ size: UB_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const sm = device.createShaderModule({ label: "spectrum-fan", code: shaderCode });
  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
  });
  const pipeline = device.createRenderPipeline({
    label: "spectrum-fan",
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: { module: sm, entryPoint: "vsMain" },
    fragment: { module: sm, entryPoint: "fsMain", targets: [{ format: "rgba16float" }] },
    primitive: { topology: "triangle-list" },
  });
  const bg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: ub } }] });

  return {
    render(encoder, outputView, time) {
      const bgColor = computeBgLinear(config.bgBrightness, config.warmth);

      cpu[0] = W; cpu[1] = H; cpu[2] = time;
      cpu[3] = config.shapeCount;
      cpu[4] = config.fanAngle;
      cpu[5] = config.fanRotation;
      cpu[6] = config.pivotX;
      cpu[7] = config.pivotY;
      cpu[8] = config.shapeWidth;
      cpu[9] = config.shapeHeight;
      cpu[10] = config.opacity;
      cpu[11] = config.brightness;
      cpu[12] = bgColor[0];
      cpu[13] = bgColor[1];
      cpu[14] = bgColor[2];
      cpu[15] = bgColor[3];
      cpu[16] = config.skewAngle;
      cpu[17] = config.separation;
      cpu[18] = config.hueShift;
      cpu[19] = config.saturation;
      cpu[20] = config.warmth;
      cpu[21] = config.bgBrightness;
      cpu[22] = config.glowIntensity;
      cpu[23] = 0; cpu[24] = 0; cpu[25] = 0; cpu[26] = 0; cpu[27] = 0;
      device.queue.writeBuffer(ub, 0, cpu);

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: outputView,
          clearValue: { r: bgColor[0], g: bgColor[1], b: bgColor[2], a: 1 },
          loadOp: "clear",
          storeOp: "store",
        }],
      });
      pass.setPipeline(pipeline); pass.setBindGroup(0, bg); pass.draw(3); pass.end();
    },
    resize(w, h) { W = w; H = h; },
    updateConfig(p) { config = { ...config, ...p }; },
    getConfig() { return { ...config }; },
    destroy() { ub.destroy(); },
  };
}
