// Source-frame renderer for the corona-loop finish demo — the canvas2d analogue
// of the lab's base render. The dot field is scattered ONCE (cached); each frame
// only re-shades it from the swept lobe direction. A blurred additive pass
// approximates the lab's two-pass bloom (the live demo can't shell out to
// ImageMagick); the WebGPU layer then adds grain + chromatic aberration on top.
// This deliberately does NOT claim pixel-parity with the lab still — same look,
// live in-browser.
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

const channels = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const DIM = channels(CORONA_PALETTE.dim);
const BRIGHT = channels(CORONA_PALETTE.bright);
const mix = (amount: number): string => {
  const t = Math.max(0, Math.min(1, amount));
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

export const drawCoronaLoopSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / CORONA_VIEWBOX;
  const direction = coronaDirectionAngle(frame, CORONA_ORBIT);
  const dots = field().map((d) => {
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

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = CORONA_PALETTE.background;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // bloom approximation: brightest dots, enlarged + blurred + additively blended.
  ctx.save();
  ctx.filter = `blur(${0.012 * CORONA_VIEWBOX}px)`;
  ctx.globalCompositeOperation = "lighter";
  dots.forEach(({ d, brightness, alpha }) => {
    if (brightness < 0.55) return;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius * 3.2, 0, 2 * Math.PI);
    ctx.fillStyle = mix(brightness);
    ctx.globalAlpha = alpha * 0.5 * brightness;
    ctx.fill();
  });
  ctx.restore();

  // sharp pass: every dot at its true size and opacity.
  ctx.globalCompositeOperation = "source-over";
  dots.forEach(({ d, brightness, alpha }) => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
    ctx.fillStyle = mix(brightness);
    ctx.globalAlpha = alpha;
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
