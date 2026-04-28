import gridBlockShader from "./grid-block.wgsl?raw";
import {
  BLOCK_STATE_DURATIONS,
  type BlockInstance,
  type DiscreteGridSnapshot,
} from "../scene/discrete-grid-scene";
import { MAX_RENDER_BLOCKS } from "../scene/typography/hero-token";

const PARAM_FLOATS = 24;
const PARAM_BYTES = PARAM_FLOATS * 4;
const BLOCK_FLOATS = 20;
const MAX_BLOCKS = MAX_RENDER_BLOCKS;
const BLOCK_BYTES = BLOCK_FLOATS * 4;

const BACKGROUND_RGB: [number, number, number] = [0.82, 0.82, 0.82];
const DARK_RGB: [number, number, number] = [0.102, 0.102, 0.102];
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function getStatePhase(block: BlockInstance): number {
  if (!block.visible || block.state === "idle") {
    return 0;
  }

  const duration = BLOCK_STATE_DURATIONS[block.state] ?? 1;
  return clamp01(block.stateAge / duration);
}

function getMassBias(block: BlockInstance): number {
  return Math.max(0.45, Math.min(1, 1 - (block.stackIndex / 6) * 0.55));
}

export interface GridBlockPass {
  render(
    encoder: GPUCommandEncoder,
    outputView: GPUTextureView,
    snapshot: DiscreteGridSnapshot,
    reactive?: Partial<GridReactiveState>,
    textAlpha?: number,
  ): void;
  destroy(): void;
}

export interface GridReactiveState {
  readonly bass: number;
  readonly mid: number;
  readonly treble: number;
  readonly energy: number;
  readonly intensity: number;
  readonly bassOnset: number;
  readonly midOnset: number;
  readonly trebleOnset: number;
  readonly globalOnset: number;
}

interface AnimatedBlockPose {
  readonly opacity: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly insetMul: number;
  readonly accent: number;
  readonly renderOffsetX: number;
  readonly renderOffsetY: number;
}

function getAnimatedPose(block: BlockInstance): AnimatedBlockPose {
  if (!block.visible) {
    return { opacity: 0, scaleX: 1, scaleY: 1, insetMul: 1, accent: 0, renderOffsetX: 0, renderOffsetY: 0 };
  }

  const phase = getStatePhase(block);

  if (block.state === "ticker_scroll") {
    const stageDuration = block.tickerStageDuration > 0 ? block.tickerStageDuration : 1.60;
    const effectiveAge = block.stateAge - block.tickerStartDelay;
    const localPhase = effectiveAge <= 0
      ? 0
      : clamp01(effectiveAge / stageDuration);
    const renderOffsetX = lerp(block.tickerStartOffset, block.tickerEndOffset, localPhase);
    const renderOffsetY = lerp(block.tickerStartOffsetY, block.tickerEndOffsetY, localPhase);
    const glow = localPhase > 0.7 ? (localPhase - 0.7) / 0.3 * 0.25 : 0;
    return {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      insetMul: 1,
      accent: glow,
      renderOffsetX,
      renderOffsetY,
    };
  }

  if (block.state === "ticker_strike") {
    const p = phase;
    const pulse = Math.sin(p * Math.PI);
    return {
      opacity: 1,
      scaleX: 1 + pulse * 0.12,
      scaleY: 1 - pulse * 0.04,
      insetMul: 1 - pulse * 0.08,
      accent: pulse * 0.28,
      renderOffsetX: block.renderOffsetX,
      renderOffsetY: block.renderOffsetY,
    };
  }

  if (block.state === "blink") {
    if (phase < 0.28) {
      return { opacity: 1, scaleX: 1, scaleY: 1, insetMul: 1, accent: 0.04, renderOffsetX: 0, renderOffsetY: 0 };
    }
    if (phase < 0.55) {
      return { opacity: 0, scaleX: 1, scaleY: 1, insetMul: 1, accent: 0, renderOffsetX: 0, renderOffsetY: 0 };
    }
    const returnPhase = (phase - 0.55) / 0.45;
    return {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      insetMul: 1,
      accent: lerp(0.14, 0.03, returnPhase),
      renderOffsetX: 0,
      renderOffsetY: 0,
    };
  }

  if (block.state === "duplicate_spawn") {
    if (phase < 0.14) {
      return {
        opacity: 1,
        scaleX: 0.76,
        scaleY: 0.84,
        insetMul: 1.05,
        accent: 0.15,
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    if (phase < 0.40) {
      const t = (phase - 0.14) / 0.26;
      return {
        opacity: 1,
        scaleX: lerp(0.78, 1.0, t),
        scaleY: lerp(0.86, 0.997, t),
        insetMul: lerp(1.05, 1.004, t),
        accent: lerp(0.15, 0.03, t),
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    return { opacity: 1, scaleX: 1.0, scaleY: 0.997, insetMul: 1.004, accent: 0.01, renderOffsetX: 0, renderOffsetY: 0 };
  }

  if (block.state === "snap_move") {
    if (phase < 0.14) {
      return {
        opacity: 1,
        scaleX: 1.2,
        scaleY: 0.8,
        insetMul: 0.94,
        accent: 0.23,
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    if (phase < 0.40) {
      const t = (phase - 0.14) / 0.26;
      return {
        opacity: 1,
        scaleX: lerp(1.2, 1.0, t),
        scaleY: lerp(0.8, 0.996, t),
        insetMul: lerp(0.94, 1.002, t),
        accent: lerp(0.23, 0.03, t),
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    return { opacity: 1, scaleX: 1.0, scaleY: 0.996, insetMul: 1.002, accent: 0.01, renderOffsetX: 0, renderOffsetY: 0 };
  }

  if (block.state === "stack_settle") {
    if (phase < 0.16) {
      return {
        opacity: 1,
        scaleX: 1.08,
        scaleY: 0.86,
        insetMul: 0.95,
        accent: 0.18,
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    if (phase < 0.42) {
      const t = (phase - 0.16) / 0.26;
      return {
        opacity: 1,
        scaleX: lerp(1.08, 1.0, t),
        scaleY: lerp(0.86, 0.996, t),
        insetMul: lerp(0.95, 1.002, t),
        accent: lerp(0.18, 0.03, t),
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    return { opacity: 1, scaleX: 1.0, scaleY: 0.996, insetMul: 1.002, accent: 0.01, renderOffsetX: 0, renderOffsetY: 0 };
  }

  if (block.state === "screen_expand") {
    if (phase < 0.14) {
      return {
        opacity: 1,
        scaleX: 1.01,
        scaleY: 1.01,
        insetMul: 0.74,
        accent: 0.26,
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    if (phase < 0.48) {
      const t = (phase - 0.14) / 0.34;
      return {
        opacity: 1,
        scaleX: lerp(1.01, 1.03, t),
        scaleY: lerp(1.01, 1.03, t),
        insetMul: lerp(0.74, 0.86, t),
        accent: lerp(0.26, 0.14, t),
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    const t = (phase - 0.48) / 0.52;
    return {
      opacity: 1,
      scaleX: lerp(1.03, 1.0, t),
      scaleY: lerp(1.03, 1.0, t),
      insetMul: lerp(0.86, 1.0, t),
      accent: lerp(0.14, 0.02, t),
      renderOffsetX: 0,
      renderOffsetY: 0,
    };
  }

  if (block.state === "screen_slam") {
    if (phase < 0.18) {
      return {
        opacity: 1,
        scaleX: 1.04,
        scaleY: 1.04,
        insetMul: 0.66,
        accent: 0.32,
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    if (phase < 0.46) {
      const t = (phase - 0.18) / 0.28;
      return {
        opacity: 1,
        scaleX: lerp(1.04, 1.01, t),
        scaleY: lerp(1.04, 1.01, t),
        insetMul: lerp(0.66, 0.84, t),
        accent: lerp(0.32, 0.15, t),
        renderOffsetX: 0,
        renderOffsetY: 0,
      };
    }
    const t = (phase - 0.46) / 0.54;
    return {
      opacity: 1,
      scaleX: lerp(1.01, 1.0, t),
      scaleY: lerp(1.01, 1.0, t),
      insetMul: lerp(0.84, 1.0, t),
      accent: lerp(0.15, 0.02, t),
      renderOffsetX: 0,
      renderOffsetY: 0,
    };
  }

  return { opacity: 1, scaleX: 1, scaleY: 1, insetMul: 1, accent: 0, renderOffsetX: 0, renderOffsetY: 0 };
}

function getReactiveValue(value?: number): number {
  return clamp01(value ?? 0);
}

interface EffectiveGridMetrics {
  readonly originX: number;
  readonly originY: number;
  readonly cellSize: number;
  readonly lineWeight: number;
  readonly cornerRadius: number;
}

function getEffectiveGridMetrics(snapshot: DiscreteGridSnapshot): EffectiveGridMetrics {
  const { grid } = snapshot;
  const zoomScale = Math.max(0.01, snapshot.presentationZoomScale);
  const baseGridWidth = grid.cols * grid.cellSize;
  const baseGridHeight = grid.rows * grid.cellSize;
  const gridCenterX = grid.originX + baseGridWidth * 0.5;
  const gridCenterY = grid.originY + baseGridHeight * 0.5;
  const cellSize = grid.cellSize * zoomScale;
  const gridWidth = grid.cols * cellSize;
  const gridHeight = grid.rows * cellSize;

  return {
    originX: Math.round(gridCenterX - gridWidth * 0.5),
    originY: Math.round(gridCenterY - gridHeight * 0.5),
    cellSize,
    lineWeight: grid.lineWeight * zoomScale,
    cornerRadius: grid.cornerRadius * zoomScale,
  };
}

export function createGridBlockPass(
  device: GPUDevice,
  format: GPUTextureFormat,
): GridBlockPass {
  const shaderModule = device.createShaderModule({
    label: "grid-block-shader",
    code: gridBlockShader,
  });

  const pipeline = device.createRenderPipeline({
    label: "grid-block-pipeline",
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

  const paramsBuffer = device.createBuffer({
    label: "grid-block-params",
    size: PARAM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const blockBuffer = device.createBuffer({
    label: "grid-block-storage",
    size: MAX_BLOCKS * BLOCK_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    label: "grid-block-bind-group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: paramsBuffer } },
      { binding: 1, resource: { buffer: blockBuffer } },
    ],
  });

  const paramsData = new Float32Array(PARAM_FLOATS);
  const blockData = new Float32Array(MAX_BLOCKS * BLOCK_FLOATS);

  return {
    render(encoder, outputView, snapshot, reactive, textAlpha = 1) {
      if (snapshot.blocks.length > MAX_BLOCKS) {
        throw new Error(`Block count ${snapshot.blocks.length} exceeds max ${MAX_BLOCKS}.`);
      }

      const { grid } = snapshot;
      const effectiveGrid = getEffectiveGridMetrics(snapshot);
      const reactiveBg = getReactiveValue(reactive?.bass);
      const reactivePunch = getReactiveValue(reactive?.bassOnset);
      const reactiveEdge = getReactiveValue(reactive?.trebleOnset);
      // グリッド線は舞台として静的。音で動かさない。
      const gridAlpha = 0.082;
      const majorAlpha = 0.14;
      // bassOnset → blockInset : キックで文字ブロックが一瞬圧縮される（打撃）
      const blockInset = effectiveGrid.cellSize * (0.14 - reactivePunch * 0.14);
      // trebleOnset → accentBoost : 高域アタックで文字の輪郭が一瞬研がれる（閃光）
      const accentBoost = reactiveEdge * 2.20;
      // pulse は静的。baseline 値で常時一定の硬さを保つ。
      const pulse = 0.08;
      // bass → backgroundLift : ベースで空気が重くなり、画面が沈み込む（呼吸）
      const backgroundLift = reactiveBg * 2.50;

      paramsData[0] = grid.width;
      paramsData[1] = grid.height;
      paramsData[2] = effectiveGrid.originX;
      paramsData[3] = effectiveGrid.originY;
      paramsData[4] = effectiveGrid.cellSize;
      paramsData[5] = effectiveGrid.lineWeight;
      paramsData[6] = grid.cols;
      paramsData[7] = grid.rows;
      paramsData[8] = snapshot.blocks.length;
      paramsData[9] = effectiveGrid.cornerRadius;
      paramsData[10] = grid.majorEvery;
      paramsData[11] = gridAlpha;
      paramsData[12] = majorAlpha;
      paramsData[13] = blockInset;
      paramsData[14] = accentBoost;
      paramsData[15] = pulse;
      paramsData[16] = backgroundLift;
      paramsData[17] = clamp01(textAlpha);
      paramsData[18] = snapshot.time;
      paramsData[19] = snapshot.strikePhase;
      paramsData[20] = snapshot.strikeFlag;
      paramsData[21] = snapshot.flickerIntensity;
      paramsData[22] = snapshot.glowMix;
      paramsData[23] = 0;

      blockData.fill(0);
      snapshot.blocks.forEach((block, index) => {
        const offset = index * BLOCK_FLOATS;
        const pose = getAnimatedPose(block);
        const statePhase = getStatePhase(block);
        const massBias = block.visible ? getMassBias(block) : 0;

        blockData[offset + 0] = block.cellX;
        blockData[offset + 1] = block.cellY;
        blockData[offset + 2] = block.stackIndex;
        blockData[offset + 3] = block.visible ? 1 : 0;

        const toneIdx = block.tone === "white"
          ? 1
          : block.tone === "spark"
            ? 2
            : block.tone === "glow"
              ? 3
              : 0;

        blockData[offset + 4] = toneIdx === 1 ? 1 : 0;
        blockData[offset + 5] = statePhase;
        blockData[offset + 6] = pose.opacity;
        blockData[offset + 7] = pose.accent;

        blockData[offset + 8] = pose.scaleX;
        blockData[offset + 9] = pose.scaleY;
        blockData[offset + 10] = pose.insetMul;
        blockData[offset + 11] = massBias;

        blockData[offset + 12] = DARK_RGB[0];
        blockData[offset + 13] = DARK_RGB[1];
        blockData[offset + 14] = DARK_RGB[2];
        blockData[offset + 15] = pose.renderOffsetX;

        blockData[offset + 16] = pose.renderOffsetY;
        blockData[offset + 17] = toneIdx;
        blockData[offset + 18] = block.strikeAmp;
        blockData[offset + 19] = 0;
      });

      device.queue.writeBuffer(paramsBuffer, 0, paramsData);
      device.queue.writeBuffer(blockBuffer, 0, blockData.subarray(0, snapshot.blocks.length * BLOCK_FLOATS));

      const pass = encoder.beginRenderPass({
        label: "grid-block-pass",
        colorAttachments: [{
          view: outputView,
          clearValue: {
            r: BACKGROUND_RGB[0] - backgroundLift * 0.035,
            g: BACKGROUND_RGB[1] - backgroundLift * 0.03,
            b: BACKGROUND_RGB[2] - backgroundLift * 0.015,
            a: 1,
          },
          loadOp: "clear",
          storeOp: "store",
        }],
      });

      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
    },
    destroy() {
      paramsBuffer.destroy();
      blockBuffer.destroy();
    },
  };
}
