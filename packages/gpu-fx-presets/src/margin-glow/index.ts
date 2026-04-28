import type { Effect } from "../types";
import shaderCode from "./shader.wgsl?raw";

export interface MarginGlowConfig {
  pillarWidth: number;
  pillarHeight: number;
  bottomRadius: number;
  pillarX: number;
  pillarY: number;
  edgeSoftness: number;
  haloIntensity: number;
  pinkIntensity: number;
  yellowGreenIntensity: number;
  whiteCoreIntensity: number;
  brightness: number;
  motionAmount: number;
  motionSpeed: number;
  twistAmount: number;
  wobbleAmount: number;
  wobbleFrequency: number;
  twistCycles: number;
  wobbleHarmonic: number;
  // --- high-level color controls ---
  hueShift: number;
  saturation: number;
  warmth: number;
  bgBrightness: number;
}

export interface MarginGlowPreset {
  name: string;
  label: string;
  config: Partial<MarginGlowConfig>;
}

export const MARGIN_GLOW_DEFAULTS: MarginGlowConfig = {
  pillarWidth: 0.25,
  pillarHeight: 0.70,
  bottomRadius: 0.165,
  pillarX: 0.50,
  pillarY: 0.535,
  edgeSoftness: 0.095,
  haloIntensity: 0.56,
  pinkIntensity: 0.78,
  yellowGreenIntensity: 0.86,
  whiteCoreIntensity: 1.18,
  brightness: 0.98,
  motionAmount: 0.0,
  motionSpeed: 0.12,
  twistAmount: 0.0,
  wobbleAmount: 0.0,
  wobbleFrequency: 1.6,
  twistCycles: 0.0,
  wobbleHarmonic: 0.0,
  hueShift: 0.0,
  saturation: 1.0,
  warmth: 0.0,
  bgBrightness: 0.835,
};

export const MARGIN_GLOW_PRESETS: MarginGlowPreset[] = [
  {
    name: "poster-still",
    label: "Poster Still",
    config: { ...MARGIN_GLOW_DEFAULTS },
  },
  {
    name: "soft-drift",
    label: "Soft Drift",
    config: {
      motionAmount: 0.018,
      motionSpeed: 0.18,
      wobbleAmount: 0.014,
      wobbleFrequency: 1.75,
      haloIntensity: 0.62,
      pinkIntensity: 0.82,
    },
  },
  {
    name: "twisted-ribbon",
    label: "Twisted Ribbon",
    config: {
      motionAmount: 0.03,
      motionSpeed: 0.24,
      twistAmount: 0.18,
      wobbleAmount: 0.022,
      wobbleFrequency: 2.2,
      haloIntensity: 0.7,
      brightness: 1.02,
    },
  },
  {
    name: "cool-mint",
    label: "Cool Mint",
    config: {
      hueShift: 2.4,
      saturation: 0.85,
      warmth: -0.6,
      bgBrightness: 0.87,
    },
  },
  {
    name: "sunset-warm",
    label: "Sunset Warm",
    config: {
      hueShift: -0.3,
      saturation: 1.3,
      warmth: 0.8,
      bgBrightness: 0.85,
    },
  },
  {
    name: "deep-violet",
    label: "Deep Violet",
    config: {
      hueShift: 1.2,
      saturation: 1.1,
      warmth: -0.3,
      bgBrightness: 0.83,
      haloIntensity: 0.65,
    },
  },
];

// 30 floats = 120 bytes → struct alignment (vec2f = 8) rounds to 120
const UB_SIZE = 120;

export function createMarginGlow(
  device: GPUDevice,
  width: number,
  height: number,
  userConfig?: Partial<MarginGlowConfig>,
): Effect<MarginGlowConfig> {
  let config = { ...MARGIN_GLOW_DEFAULTS, ...userConfig };
  let W = width;
  let H = height;
  const cpu = new Float32Array(UB_SIZE / 4);

  const ub = device.createBuffer({
    size: UB_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const sm = device.createShaderModule({ label: "margin-glow", code: shaderCode });
  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
  });
  const pipeline = device.createRenderPipeline({
    label: "margin-glow",
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: { module: sm, entryPoint: "vsMain" },
    fragment: { module: sm, entryPoint: "fsMain", targets: [{ format: "rgba16float" }] },
    primitive: { topology: "triangle-list" },
  });
  const bg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: ub } }] });

  return {
    render(encoder, outputView, time) {
      cpu[0] = W;
      cpu[1] = H;
      cpu[2] = time;
      cpu[3] = config.motionSpeed;
      cpu[4] = config.pillarWidth;
      cpu[5] = config.pillarHeight;
      cpu[6] = config.bottomRadius;
      cpu[7] = config.pillarX;
      cpu[8] = config.pillarY;
      cpu[9] = config.edgeSoftness;
      cpu[10] = config.haloIntensity;
      cpu[11] = config.pinkIntensity;
      cpu[12] = config.yellowGreenIntensity;
      cpu[13] = config.whiteCoreIntensity;
      cpu[14] = config.brightness;
      cpu[15] = config.motionAmount;
      cpu[16] = config.twistAmount;
      cpu[17] = config.wobbleAmount;
      cpu[18] = config.wobbleFrequency;
      cpu[19] = config.twistCycles;
      cpu[20] = config.wobbleHarmonic;
      cpu[21] = time * 0.173; // ditherSeed
      cpu[22] = config.hueShift;
      cpu[23] = config.saturation;
      cpu[24] = config.warmth;
      cpu[25] = config.bgBrightness;
      cpu[26] = 0; // _pad0
      cpu[27] = 0; // _pad1
      cpu[28] = 0; // _pad2
      cpu[29] = 0; // struct alignment pad

      device.queue.writeBuffer(ub, 0, cpu);

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: outputView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.draw(3);
      pass.end();
    },
    resize(w, h) {
      W = w;
      H = h;
    },
    updateConfig(partial) {
      config = { ...config, ...partial };
    },
    getConfig() {
      return { ...config };
    },
    destroy() {
      ub.destroy();
    },
  };
}
