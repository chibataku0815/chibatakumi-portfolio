// Source-frame renderer for the corona-loop finish demo — the canvas2d analogue
// of the lab's base render. The dot field is scattered ONCE (cached); each frame
// only re-shades it from the swept lobe direction.
//
// Bloom matches the lab mp4's two-pass ImageMagick bloom in CHARACTER (not pixels):
// a continuous, smoothstep-weighted glow at two blur scales (tight + wide),
// composited additively over the sharp dots. There is deliberately NO brightness
// threshold — every lit dot contributes a little, the bright lobe a lot — so the
// glow flows smoothly as the lobe sweeps instead of popping dot-by-dot. The
// gains/scales were tuned against frames extracted from the approved mp4
// (motion-grammar-lab scripts/corona-bloom-proxy.ts), so the live look tracks the
// deliverable. The WebGPU layer then adds grain + chromatic aberration on top.
//
// Shared by the live demo (CoronaLoopFinishDemo) so the GPU pipeline consumes
// exactly the pixels this painter produces.
import {
  generateCoronaField,
  coronaDirectionAngle,
  coronaBrightness,
  coronaAlpha,
  CORONA_VIEWBOX,
  type CoronaFieldDot,
} from "../verbs/corona-loop";
import {
  CORONA_SPEC,
  CORONA_ORBIT,
  CORONA_PALETTE,
} from "../verbs/corona-loop.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain and CA scale with the frame. */
export const FINISH_RENDER_SIZE = 720;

/** Grain stream identity — the article's own; no deliverable-parity claim. */
export const FINISH_STREAM_NAMESPACE = "journal-corona-loop";

// Bloom tuning — verified against extracted mp4 frames (see the proxy script).
// Sigma fractions come from the lab's ImageMagick blur radii (0x14 / 0x46 at a
// 1600px finish): 14/1600 and 46/1600 of the frame.
const BLOOM_FLOOR = 0.06; // brightness where a dot starts to glow (matches IM black-threshold)
const BLOOM_KNEE = 0.4; // brightness where it reaches full glow weight
const BLOOM_DOT_SCALE = 2.5; // enlarge dots in the bloom layer so they merge into a field
const BLOOM_TIGHT_SIGMA_FRAC = 0.00875;
const BLOOM_WIDE_SIGMA_FRAC = 0.02875;
const BLOOM_TIGHT_GAIN = 0.45;
const BLOOM_WIDE_GAIN = 0.35;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const smoothstep = (lo: number, hi: number, x: number): number => {
  const t = clamp01((x - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

const channels = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const DIM = channels(CORONA_PALETTE.dim);
const BRIGHT = channels(CORONA_PALETTE.bright);
const mix = (amount: number): string => {
  const t = clamp01(amount);
  const r = Math.round(DIM[0] + (BRIGHT[0] - DIM[0]) * t);
  const g = Math.round(DIM[1] + (BRIGHT[1] - DIM[1]) * t);
  const b = Math.round(DIM[2] + (BRIGHT[2] - DIM[2]) * t);
  return `rgb(${r},${g},${b})`;
};

// scatter once — geometry is fixed for the whole loop.
let cachedField: CoronaFieldDot[] | null = null;
const field = (): CoronaFieldDot[] => {
  cachedField ??= generateCoronaField(CORONA_SPEC);
  return cachedField;
};

// offscreen bloom layer — built per frame, reused across frames. Rendered at half
// resolution (bloom is low-frequency, so the upscale is invisible) to keep two
// blur passes per frame cheap; jank would itself be a motion divergence.
const BLOOM_LAYER_DIVISOR = 2;
let bloomCanvas: HTMLCanvasElement | null = null;
const bloomLayer = (layerSize: number): HTMLCanvasElement => {
  bloomCanvas ??= document.createElement("canvas");
  if (bloomCanvas.width !== layerSize) {
    bloomCanvas.width = layerSize;
    bloomCanvas.height = layerSize;
  }
  return bloomCanvas;
};

interface ShadedDot {
  readonly d: CoronaFieldDot;
  readonly brightness: number;
  readonly alpha: number;
}

export const drawCoronaLoopSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / CORONA_VIEWBOX;
  const direction = coronaDirectionAngle(frame, CORONA_ORBIT);
  const dots: ShadedDot[] = field().map((d) => {
    const brightness = coronaBrightness(
      d.azimuthDeg,
      direction,
      CORONA_SPEC.directionStrength,
      d.radial,
    );
    return {
      d,
      brightness,
      alpha: coronaAlpha(brightness, CORONA_SPEC.dimLevel, CORONA_SPEC.brightLevel),
    };
  });

  // background + sharp dots (every dot at its true size and opacity).
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = CORONA_PALETTE.background;
  ctx.fillRect(0, 0, size, size);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  dots.forEach(({ d, brightness, alpha }) => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
    ctx.fillStyle = mix(brightness);
    ctx.globalAlpha = alpha;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // bloom layer: enlarged dots, continuous smoothstep weight (NO threshold),
  // accumulated additively so dense regions glow brighter. Drawn at half size;
  // blur (below) is applied in full-frame space on the upscaled draw.
  const layerSize = Math.round(size / BLOOM_LAYER_DIVISOR);
  const layerScale = layerSize / CORONA_VIEWBOX;
  const layer = bloomLayer(layerSize);
  const bctx = layer.getContext("2d");
  if (bctx) {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, layerSize, layerSize);
    bctx.globalCompositeOperation = "lighter";
    bctx.setTransform(layerScale, 0, 0, layerScale, 0, 0);
    dots.forEach(({ d, brightness, alpha }) => {
      const weight = smoothstep(BLOOM_FLOOR, BLOOM_KNEE, brightness);
      if (weight <= 0) return;
      bctx.beginPath();
      bctx.arc(d.x, d.y, d.radius * BLOOM_DOT_SCALE, 0, 2 * Math.PI);
      bctx.fillStyle = mix(brightness);
      bctx.globalAlpha = alpha * weight;
      bctx.fill();
    });
    bctx.globalAlpha = 1;
    bctx.globalCompositeOperation = "source-over";
    bctx.setTransform(1, 0, 0, 1, 0, 0);

    // composite the bloom over the sharp frame, additively, at two blur scales
    // (blur radii are in full-frame px; drawImage upscales the half-size layer).
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = `blur(${(BLOOM_TIGHT_SIGMA_FRAC * size).toFixed(2)}px)`;
    ctx.globalAlpha = BLOOM_TIGHT_GAIN;
    ctx.drawImage(layer, 0, 0, size, size);
    ctx.filter = `blur(${(BLOOM_WIDE_SIGMA_FRAC * size).toFixed(2)}px)`;
    ctx.globalAlpha = BLOOM_WIDE_GAIN;
    ctx.drawImage(layer, 0, 0, size, size);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
};
