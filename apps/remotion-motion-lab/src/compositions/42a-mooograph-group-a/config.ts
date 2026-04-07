/**
 * MOOOGRAPH Group A — Configuration
 *
 * Group A = f380 left cluster (recording frame) = f66 (Remotion 30fps)
 * 4 shapes: 5a (yellow star), 5b (blue rect), 5c (lavender arch), 5d (yellow triangle)
 *
 * Coordinates measured from 30fps 1920×1080 converted reference video.
 * These are initial estimates — refine via overlay comparison.
 */
import type { ShapeDef } from "../42-mooograph-geometric/config";

export const PALETTE = {
  yellow: "#FFE500",
  blue: "#6B8CFF",
  lavender: "#D4A0D4",
  background: "#E8E6E0",
} as const;

export const config = {
  totalFrames: 300,
  fps: 30,
  enterDuration: 14,
  exitDuration: 18,
} as const;

/**
 * Image sources for Recraft-generated assets.
 * 5b uses the blue rect PNG.
 */
export const IMAGE_SOURCES: Record<string, string> = {
  "5b": "recraft/mooograph/5b-blue-rect.png",
};

/**
 * Group A shapes — measured from reference f140 (hold phase).
 *
 * enterOffset: displacement at t=0 of enter phase (lerps to 0).
 * scaleFrom: scale at t=0 (default 0 = grow from nothing).
 * enterAlphaMin: minimum opacity during enter (≥0.12 per calibration rule).
 */
export const GROUP_A_SHAPES: ShapeDef[] = [
  {
    id: "5a",
    type: "star",
    color: PALETTE.yellow,
    x: 365,
    y: 305,
    w: 140,
    h: 170,
    enterFrame: 66,
    exitFrame: 240,
    enterEasing: "expoOut",
    exitEasing: "cubicIn",
    enterOffsetX: -500,
    enterOffsetY: 0,
    scaleFrom: 0,
    enterAlphaMin: 0.12,
  },
  {
    id: "5b",
    type: "image",
    color: PALETTE.blue,
    imageKey: "5b",
    x: 335,
    y: 240,
    w: 185,
    h: 320,
    enterFrame: 66,
    exitFrame: 240,
    enterEasing: "expoOut",
    exitEasing: "cubicIn",
    enterOffsetX: -400,
    enterOffsetY: -200,
    scaleFrom: 1, // image: no scale, slide only
    enterAlphaMin: 0.12,
  },
  {
    id: "5c",
    type: "arch",
    color: PALETTE.lavender,
    x: 480,
    y: 360,
    w: 280,
    h: 420,
    enterFrame: 66,
    exitFrame: 240,
    enterEasing: "quintOut",
    exitEasing: "sineIn",
    enterOffsetX: 0,
    enterOffsetY: 500,
    scaleFrom: 1, // no scale, slide only
    enterAlphaMin: 0.12,
  },
  {
    id: "5d",
    type: "triangle",
    color: PALETTE.yellow,
    x: 340,
    y: 575,
    w: 135,
    h: 120,
    enterFrame: 68,
    exitFrame: 240,
    enterEasing: "backOut",
    exitEasing: "cubicIn",
    enterOffsetX: 0,
    enterOffsetY: 250,
    scaleFrom: 0, // pop from nothing
    enterAlphaMin: 0.12,
  },
];
