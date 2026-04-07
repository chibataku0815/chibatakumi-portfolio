/**
 * Isshin Reel Intro — Composition #38
 *
 * Recreation of isshin REEL 2024 opening (0-15s): animated 3-row block-grid card.
 *
 * Key technique: ALL transitions are MORPHING (position/size interpolation).
 * No cross-dissolve. Blocks slide, resize, and rearrange.
 *
 * Phases (@ 50fps):
 *   0-80   Bar: collapsed card (thin horizontal bar with colored segments)
 *   80-158 Expand: bar height morphs into 3-row card
 *   158-225 Card#1: self-intro (映像制作 / isshin / NR7-24)
 *   225-312 Morph: blocks slide/resize to Card#2 layout + bg color shift
 *   312-750 Card#2: music credit (音楽 / Lolica Tonica / French Kiss)
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  expOut,
  cubicOut,
  progress,
  lerp,
  sr,
} from "../../lib/canvas-primitives";
import {
  type FillDef,
  type TextDef,
  lerpColor,
  roundRect,
  renderFill,
  drawText,
} from "../../lib/isshin-primitives";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
import { config } from "./config";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Morph block definition — each block has TWO states (card1 & card2)
// ---------------------------------------------------------------------------
interface MorphBlock {
  row: 0 | 1 | 2;
  // Card 1 state
  x1: number;
  w1: number;
  fill1: FillDef;
  text1?: TextDef;
  // Card 2 state
  x2: number;
  w2: number;
  fill2: FillDef;
  text2?: TextDef;
}

// ---------------------------------------------------------------------------
// Block definitions — paired slots that MORPH between card1 <-> card2
//
// x/w are fractions of cardW (0..1).
// During morph (f225-312), each block lerps x/w.
// Fill: solid->solid = lerpColor, otherwise snap at 40%.
// Blocks with w=0 in one state grow from / shrink to nothing.
// ---------------------------------------------------------------------------
const CW = config.cardW; // 1200

const BLOCKS: MorphBlock[] = [
  // ======================= ROW 0 =======================
  // Reference Card1: [dark red "映像制作"] [teal hatch] [gray] [grad] [white "isshin"]
  // Reference Card2: [dark red "音楽"] [red accent] [white "Lolica Tonica"] [red block]

  // Slot r0a: 映像制作 (dark red) -> 音楽 (dark red)
  {
    row: 0,
    x1: 0 / CW,
    w1: 300 / CW,
    fill1: { type: "solid", color: "#D97966" },
    text1: {
      label: "映像制作",
      color: "#FFFFFF",
      size: 28,
      weight: 700,
      align: "left" as CanvasTextAlign,
      padX: 20,
    },
    x2: 0 / CW,
    w2: 220 / CW,
    fill2: { type: "solid", color: "#D97966" },
    text2: {
      label: "音楽",
      color: "#FFFFFF",
      size: 28,
      weight: 700,
      align: "left" as CanvasTextAlign,
      padX: 20,
    },
  },

  // Slot r0b: teal hatch -> red accent strip
  {
    row: 0,
    x1: 300 / CW,
    w1: 80 / CW,
    fill1: { type: "hatch", bg: "#3CB8AD", line: "#2A9A90", spacing: 6, angle: 45 },
    x2: 220 / CW,
    w2: 30 / CW,
    fill2: { type: "solid", color: "#D73C4B" },
  },

  // Slot r0c: gray block -> shrinks to 0
  {
    row: 0,
    x1: 380 / CW,
    w1: 60 / CW,
    fill1: { type: "solid", color: "#959595" },
    x2: 250 / CW,
    w2: 0,
    fill2: { type: "solid", color: "#959595" },
  },

  // Slot r0d: gradient teal->gold -> shrinks to 0
  {
    row: 0,
    x1: 440 / CW,
    w1: 60 / CW,
    fill1: {
      type: "grad",
      stops: [
        [0, "#3CB8AD"],
        [1, "#DDB070"],
      ],
    },
    x2: 250 / CW,
    w2: 0,
    fill2: {
      type: "grad",
      stops: [
        [0, "#3CB8AD"],
        [1, "#DDB070"],
      ],
    },
  },

  // Slot r0e: "isshin" on white -> "Lolica Tonica" on white
  {
    row: 0,
    x1: 500 / CW,
    w1: 700 / CW,
    fill1: { type: "solid", color: "#F0EDE8" },
    text1: {
      label: "isshin",
      color: "#D97966",
      size: 42,
      weight: 700,
      align: "right" as CanvasTextAlign,
      padX: -30,
    },
    x2: 250 / CW,
    w2: 620 / CW,
    fill2: { type: "solid", color: "#F0EDE8" },
    text2: {
      label: "Lolica Tonica",
      color: "#3A3A3A",
      size: 36,
      weight: 500,
      align: "left" as CanvasTextAlign,
      padX: 30,
    },
  },

  // Slot r0f: grows from 0 -> red block (card2 only)
  {
    row: 0,
    x1: 1200 / CW,
    w1: 0,
    fill1: { type: "solid", color: "#D73C4B" },
    x2: 870 / CW,
    w2: 330 / CW,
    fill2: { type: "solid", color: "#D73C4B" },
  },

  // ======================= ROW 1 =======================
  // Reference Card1: [dark #2A2A2A] [hatch] [dots] [dark #3A3A3A] [gradient NR7-24]
  // Reference Card2: [red] ["French Kiss" dark] [grad] [cream] ["from Acid Future" grad] [hatch]

  // Slot r1a: dark -> red
  {
    row: 1,
    x1: 0 / CW,
    w1: 130 / CW,
    fill1: { type: "solid", color: "#2A2A2A" },
    x2: 0 / CW,
    w2: 130 / CW,
    fill2: { type: "solid", color: "#D73C4B" },
  },

  // Slot r1b: hatch -> "French Kiss" on dark
  {
    row: 1,
    x1: 130 / CW,
    w1: 90 / CW,
    fill1: { type: "hatch", bg: "#777777", line: "#444444", spacing: 5, angle: -45 },
    x2: 130 / CW,
    w2: 270 / CW,
    fill2: { type: "solid", color: "#3A3A3A" },
    text2: {
      label: "French Kiss",
      color: "#3CB8AD",
      size: 26,
      weight: 500,
      align: "left" as CanvasTextAlign,
      padX: 16,
    },
  },

  // Slot r1c: dots -> gradient
  {
    row: 1,
    x1: 220 / CW,
    w1: 100 / CW,
    fill1: { type: "dots", bg: "#DDDDDD", dot: "#3CB8AD", r: 2, spacing: 10 },
    x2: 400 / CW,
    w2: 200 / CW,
    fill2: {
      type: "grad",
      stops: [
        [0, "#3A3A3A"],
        [1, "#C0C0C0"],
      ],
    },
  },

  // Slot r1d: small dark -> cream
  {
    row: 1,
    x1: 320 / CW,
    w1: 60 / CW,
    fill1: { type: "solid", color: "#3A3A3A" },
    x2: 600 / CW,
    w2: 130 / CW,
    fill2: { type: "solid", color: "#F0EDE8" },
  },

  // Slot r1e: warm gradient "NR7-24" -> "from Acid Future" teal gradient
  {
    row: 1,
    x1: 380 / CW,
    w1: 820 / CW,
    fill1: {
      type: "grad",
      stops: [
        [0, "#F4A460"],
        [0.5, "#FF69B4"],
        [1, "#DA70D6"],
      ],
    },
    text1: {
      label: "NR7-24",
      color: "rgba(255,255,255,0.85)",
      size: 64,
      weight: 700,
      align: "center" as CanvasTextAlign,
    },
    x2: 730 / CW,
    w2: 180 / CW,
    fill2: {
      type: "grad",
      stops: [
        [0, "#3CB8AD"],
        [1, "#F5F0E8"],
      ],
    },
    text2: {
      label: "from\nAcid Future",
      color: "#3A3A3A",
      size: 14,
      weight: 400,
      align: "center" as CanvasTextAlign,
      lineHeight: 1.3,
    },
  },

  // Slot r1f: grows from 0 -> hatch (card2 only)
  {
    row: 1,
    x1: 1200 / CW,
    w1: 0,
    fill1: { type: "hatch", bg: "#F0EDE8", line: "#AAAAAA", spacing: 6, angle: 45 },
    x2: 910 / CW,
    w2: 290 / CW,
    fill2: { type: "hatch", bg: "#F0EDE8", line: "#AAAAAA", spacing: 6, angle: 45 },
  },

  // ======================= ROW 2 =======================
  // Reference Card1: [dark gradient] [dots dark/teal] [gradient silver->pink]
  // Reference Card2: [gray] [teal block] [gradient cream->silver]

  // Slot r2a: dark gradient -> light gray
  {
    row: 2,
    x1: 0 / CW,
    w1: 200 / CW,
    fill1: {
      type: "grad",
      stops: [
        [0, "#3A3A3A"],
        [1, "#1A1A1A"],
      ],
    },
    x2: 0 / CW,
    w2: 260 / CW,
    fill2: { type: "solid", color: "#CCCCCC" },
  },

  // Slot r2b: teal dots on dark -> teal solid
  {
    row: 2,
    x1: 200 / CW,
    w1: 170 / CW,
    fill1: { type: "dots", bg: "#2A2A2A", dot: "#00CED1", r: 3, spacing: 14 },
    x2: 260 / CW,
    w2: 140 / CW,
    fill2: { type: "solid", color: "#3CB8AD" },
  },

  // Slot r2c: warm gradient (silver->pink->purple) -> cream->silver gradient
  {
    row: 2,
    x1: 370 / CW,
    w1: 830 / CW,
    fill1: {
      type: "grad",
      stops: [
        [0, "#C0C0C0"],
        [0.4, "#FFB6D9"],
        [1, "#DA70D6"],
      ],
    },
    text1: {
      label: "NR7-24",
      color: "#FFFFFF",
      size: 32,
      weight: 700,
      align: "right" as CanvasTextAlign,
      padX: -30,
    },
    x2: 400 / CW,
    w2: 800 / CW,
    fill2: {
      type: "grad",
      stops: [
        [0, "#F0EDE8"],
        [1, "#C0C0C0"],
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Grain (multiply mode, block-based, deterministic seeded PRNG)
// ---------------------------------------------------------------------------
function drawGrain(
  ctx: CanvasRenderingContext2D,
  frame: number,
  size: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 35 / 255;
  for (let py = 0; py < H; py += size) {
    for (let px = 0; px < W; px += size) {
      ctx.fillStyle =
        sr(py * 0xffff + px + frame * 23) < 0.5 ? "#fff" : "#000";
      ctx.fillRect(px, py, size, size);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Morph fill — solid->solid uses lerpColor, anything else snaps at 40%
// ---------------------------------------------------------------------------
function morphFill(fill1: FillDef, fill2: FillDef, morphT: number): FillDef {
  if (fill1.type === "solid" && fill2.type === "solid") {
    return {
      type: "solid",
      color: lerpColor(fill1.color, fill2.color, morphT),
    };
  }
  return morphT < 0.4 ? fill1 : fill2;
}

// ---------------------------------------------------------------------------
// Draw all morphing blocks
// ---------------------------------------------------------------------------
function drawMorphBlocks(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  morphT: number,
  textAlpha: number,
  frame: number,
): void {
  const effectiveGap = Math.min(config.rowGap, cardH * 0.15);
  const numRows = config.numRows;
  const rowH = (cardH - effectiveGap * (numRows - 1)) / numRows;

  for (let i = 0; i < BLOCKS.length; i++) {
    const b = BLOCKS[i];

    // Interpolate position and width
    const x = lerp(b.x1, b.x2, morphT);
    const w = lerp(b.w1, b.w2, morphT);

    if (w < 0.001) continue; // block not visible

    const bx = cardX + x * cardW;
    const bw = w * cardW;
    const by = cardY + b.row * (rowH + effectiveGap);
    const bh = rowH;

    if (bh < 1 || bw < 1) continue;

    // Fill: solid->solid = lerpColor, otherwise snap at 40%
    const fill = morphFill(b.fill1, b.fill2, morphT);
    renderFill(ctx, fill, bx, by, bw, bh);

    // Text rendering with clipping
    if (bh > 40 && textAlpha > 0.01) {
      // Card1 text: disappears fast (by morphT 0.15)
      const t1 = b.text1;
      if (t1 && morphT < 0.2) {
        const tA = textAlpha * Math.max(0, 1 - morphT * 7);

        // Text stagger during expansion
        const staggerT =
          frame < config.barEnd
            ? 0
            : progress(
                frame,
                config.textStaggerStart + i * config.textStaggerDelay,
                10,
                cubicOut,
              );
        const finalA = tA * staggerT;

        if (finalA > 0.01) {
          drawText(ctx, t1, bx, by, bw, bh, finalA, fontFamily);
        }
      }

      // Card2 text: slides in from 60% onward
      const t2 = b.text2;
      if (t2 && morphT > 0.55) {
        const slideT = Math.min(1, (morphT - 0.55) / 0.35);
        const easedSlide = 1 - Math.pow(1 - slideT, 3); // cubicOut
        const tA = textAlpha * easedSlide;
        if (tA > 0.01) {
          // Offset text horizontally for slide-in effect
          const slideOffset = (1 - easedSlide) * bw * 0.3;
          drawText(ctx, t2, bx + slideOffset, by, bw, bh, tA, fontFamily);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main draw
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // ---- Background color morph (coral -> teal) ----
  // BG shifts LATER than blocks — starts at 50% of morph, rapid over 30%
  const morphDur = config.transitionEnd - config.transitionStart;
  const bgStart = config.transitionStart + morphDur * 0.5;
  const bgT = progress(frame, bgStart, morphDur * 0.3, expOut);
  ctx.fillStyle = lerpColor(config.bgCoral, config.bgTeal, bgT);
  ctx.fillRect(0, 0, W, H);

  // ---- Card height morph (bar -> full) ----
  const expandDuration = config.expandEnd - config.barEnd;
  let cardH: number = config.barH;
  if (frame >= config.barEnd && frame < config.expandEnd) {
    const expandT = progress(frame, config.barEnd, expandDuration, expOut);
    cardH = lerp(config.barH, config.cardH, expandT);
  } else if (frame >= config.expandEnd) {
    cardH = config.cardH;
  }

  // ---- Card position (centered) ----
  const cardX = (W - config.cardW) / 2;
  const cardY = (H - cardH) / 2;

  // ---- Card background + border ----
  roundRect(ctx, cardX, cardY, config.cardW, cardH, config.borderRadius);
  ctx.fillStyle = config.cardBg;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Clip to card ----
  ctx.save();
  roundRect(ctx, cardX, cardY, config.cardW, cardH, config.borderRadius);
  ctx.clip();

  // ---- Text visibility (height-based gate: hidden when card is short) ----
  const textAlpha = Math.max(0, Math.min(1, (cardH - 60) / 80));

  // ---- Block morph progress (0 = card1, 1 = card2) ----
  // expOut: 90% done in first 20% -> rapid shuffle then slow settle
  const morphT = progress(
    frame,
    config.transitionStart,
    config.transitionEnd - config.transitionStart,
    expOut,
  );

  // ---- Draw morphing blocks ----
  drawMorphBlocks(
    ctx,
    cardX,
    cardY,
    config.cardW,
    cardH,
    morphT,
    textAlpha,
    frame,
  );

  ctx.restore(); // unclip

  // ---- Grain overlay ----
  drawGrain(ctx, frame, 4);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const IsshinReelIntro: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
