/**
 * Kinetic Typography -- Composition #18
 *
 * Motion technique: Characters scatter from random positions/rotations/scales
 * and assemble into the final word with staggered expoOut easing.
 *
 * Style: Editorial — warm white paper, near-black ink, Playfair Display serif,
 * paper-grain texture, red accent rule, editorial annotations.
 *
 * Phases:
 *   0 .. assemblyEnd  Staggered character assembly (scattered -> final)
 *   assemblyEnd .. 119  Hold assembled word + accent line reveal
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  sr,
  lerp,
  drawDust,
  drawVignette,
} from "../../lib/canvas-primitives";
import { expoOut } from "../../lib/canvas-easing";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { config } from "./config";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Paper-texture grain buffer (1/4 resolution for performance)
// ---------------------------------------------------------------------------
const GRAIN_W = 480;
const GRAIN_H = 270;

// ---------------------------------------------------------------------------
// Pre-compute scattered state for each character (deterministic via sr)
// ---------------------------------------------------------------------------
interface CharState {
  ch: string;
  scatterX: number;
  scatterY: number;
  scatterRot: number; // degrees
  scatterScale: number;
}

function buildScatter(word: string, seed: number): CharState[] {
  const result: CharState[] = [];
  let idx = 0;
  for (const ch of word) {
    // Scatter position: random offset from center within scatterRadius
    const angle = sr(seed + idx * 7 + 1) * Math.PI * 2;
    const radius = sr(seed + idx * 7 + 2) * config.scatterRadius;
    const scatterX = W / 2 + Math.cos(angle) * radius;
    const scatterY = H * 0.45 + Math.sin(angle) * radius;
    const scatterRot = (sr(seed + idx * 7 + 3) - 0.5) * 60; // +/-30 degrees
    const scatterScale = 0.5 + sr(seed + idx * 7 + 4) * 0.8; // 0.5 .. 1.3

    result.push({ ch, scatterX, scatterY, scatterRot, scatterScale });
    idx++;
  }
  return result;
}

const scatterData = buildScatter(config.word, config.seed);

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background (warm white paper) ---
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, W, H);

  // --- Paper-texture grain (multiply blend on light bg) ---
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let y = 0; y < GRAIN_H; y++) {
    for (let x = 0; x < GRAIN_W; x++) {
      const noise = sr(frame * 130000 + y * GRAIN_W + x);
      if (noise > 0.5) {
        // Warm grain: #f0ece4 with alpha ~ config.texture.grain/255
        ctx.fillStyle = `rgba(240,236,228,${config.texture.grain / 255})`;
        ctx.fillRect(x * 4, y * 4, 4, 4);
      }
    }
  }
  ctx.restore();

  // --- Dust particles (dark for visibility on light bg) ---
  drawDust(ctx, frame, 4, "rgba(26,26,26,0.05)");

  // --- Vignette (very subtle) ---
  drawVignette(ctx, config.texture.vignette);

  // --- Compute final positions using measureText ---
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${fontFamily}, serif`;
  ctx.textBaseline = "middle";

  // Measure total word width and each character width
  const totalWidth = ctx.measureText(config.word).width;
  const startX = (W - totalWidth) / 2;

  const finalPositions: Array<{ x: number; y: number }> = [];
  let curX = startX;
  for (const ch of config.word) {
    const charW = ctx.measureText(ch).width;
    finalPositions.push({ x: curX, y: H * 0.45 });
    curX += charW;
  }

  // --- Draw each character ---
  for (let i = 0; i < scatterData.length; i++) {
    const { ch, scatterX, scatterY, scatterRot, scatterScale } =
      scatterData[i];
    if (ch === " ") continue;

    const final = finalPositions[i];

    // Staggered progress: each char starts config.staggerDelay frames after previous
    const charStart = i * config.staggerDelay;
    const rawT = Math.max(
      0,
      Math.min(1, (frame - charStart) / config.assemblyDuration),
    );
    const p = expoOut(rawT);

    // Alpha: 0 -> 1 over first 30% of each char's animation
    const alpha = rawT <= 0 ? 0 : Math.min(1, p * 3);
    if (alpha < 0.001) continue;

    // Interpolate position, rotation, scale
    const charW = ctx.measureText(ch).width;
    const x = lerp(scatterX, final.x + charW / 2, p);
    const y = lerp(scatterY, final.y, p);
    const rot = lerp(scatterRot, 0, p);
    const scale = lerp(scatterScale, 1.0, p);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.font = `${config.fontWeight} ${config.fontSize}px ${fontFamily}, serif`;
    ctx.fillStyle = config.color;
    ctx.textAlign = "center";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  // --- Red accent line (horizontal rule under text) ---
  const accentStart = 30;
  if (frame >= accentStart) {
    const accentT = Math.max(
      0,
      Math.min(1, (frame - accentStart) / 20),
    );
    const accentP = expoOut(accentT);
    const lineWidth = 180 * accentP;
    const lineY = H * 0.62;

    ctx.save();
    ctx.fillStyle = config.accentColor;
    ctx.fillRect(W / 2 - lineWidth / 2, lineY, lineWidth, 2);
    ctx.restore();
  }

  // --- Editorial annotations (always visible) ---
  ctx.save();
  ctx.font = "400 11px Inter, sans-serif";
  ctx.fillStyle = config.secondaryColor;
  ctx.textBaseline = "alphabetic";

  // Bottom-left: VOL.01
  ctx.textAlign = "left";
  ctx.fillText("VOL.01", 60, H - 40);

  // Bottom-right: P.018
  ctx.textAlign = "right";
  ctx.fillText("P.018", W - 60, H - 40);
  ctx.restore();
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const KineticTypography: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
