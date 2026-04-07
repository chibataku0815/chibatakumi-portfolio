/**
 * MOOOGRAPH Geometric — Configuration
 *
 * Recreation of MOOOGRAPH geometric motion graphics.
 * Canvas 2D composition with halftone blobs + geometric shape figures.
 *
 * Timeline (@ 30fps, 300 frames = 10s):
 *   f0-30:    Blob phase (halftone blobs morph in)
 *   f60-120:  Figure entry (geometric shapes enter with stagger)
 *   f140-220: Hold (all elements visible, subtle morph continues)
 *   f225-265: Exit (shapes fly out, blobs shrink)
 *   f265-300: Empty (background only, tail hold)
 */

// ── Color palette ──
export const PALETTE = {
  yellow: "#FFE500",
  blue: "#6B8CFF",
  lavender: "#D4A0D4",
  black: "#1A1A1A",
  white: "#F5F5F0",
  background: "#E8E6E0",
  dots: "#888888",
  blobBase: "#DDD9D3",
} as const;

// ── Shape type definitions ──
export type ShapeType =
  | "rect"
  | "circle"
  | "image"
  | "path"
  | "arch"
  | "triangle"
  | "bar"
  | "star";

export interface ShapeDef {
  id: string;
  type: ShapeType;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enterFrame: number;
  exitFrame: number;
  enterEasing: string; // key into EASINGS map
  exitEasing: string;
  // For image type
  imageKey?: string;
  imageSrc?: string;
  // For path type
  pathD?: string;
  // Geometry
  radius?: number;
  cornerRadius?: number;
  rotation?: number;
  // Slide-in animation (offset from final position at t=0 of enter phase)
  enterOffsetX?: number; // negative = from left, positive = from right
  enterOffsetY?: number; // negative = from top, positive = from bottom
  exitOffsetX?: number;
  exitOffsetY?: number;
  // Scale control: start scale at enter (default 0 = grow from nothing)
  scaleFrom?: number; // 1 = no scale animation (slide only), 0 = scale 0→1
  // Minimum alpha during enter (default 0)
  enterAlphaMin?: number; // recommended ≥ 0.12
}

// ── Recraft image sources (staticFile paths) ──
export const IMAGE_SOURCES: Record<string, string> = {
  "5b": "recraft/mooograph/5b-blue-rect.png",
  "5n": "recraft/mooograph/5n-blue-circle.png",
  "5f": "recraft/mooograph/5f-wave.svg",
};

// ── Shape definitions ──
export const SHAPES: ShapeDef[] = [
  // --- Recraft image-based shapes ---
  {
    id: "5b",
    type: "image",
    color: PALETTE.blue,
    x: 320,
    y: 200,
    w: 400,
    h: 520,
    enterFrame: 66,
    exitFrame: 235,
    enterEasing: "expoOut",
    exitEasing: "cubicIn",
    imageKey: "5b",
    imageSrc: "recraft/mooograph/5b-blue-rect.png",
  },
  {
    id: "5n",
    type: "image",
    color: PALETTE.blue,
    x: 1200,
    y: 280,
    w: 360,
    h: 360,
    enterFrame: 113,
    exitFrame: 227,
    enterEasing: "backOut",
    exitEasing: "cubicIn",
    imageKey: "5n",
    imageSrc: "recraft/mooograph/5n-blue-circle.png",
  },
  {
    id: "5f",
    type: "image",
    color: PALETTE.black,
    x: 500,
    y: 150,
    w: 920,
    h: 525,
    enterFrame: 70,
    exitFrame: 235,
    enterEasing: "quintOut",
    exitEasing: "cubicIn",
    imageKey: "5f",
    imageSrc: "recraft/mooograph/5f-wave.svg",
  },

  // --- Procedural geometric shapes ---
  {
    id: "yellow-rect-1",
    type: "rect",
    color: PALETTE.yellow,
    x: 140,
    y: 120,
    w: 180,
    h: 240,
    enterFrame: 72,
    exitFrame: 240,
    enterEasing: "expoOut",
    exitEasing: "quintIn",
    cornerRadius: 12,
  },
  {
    id: "yellow-circle-1",
    type: "circle",
    color: PALETTE.yellow,
    x: 1500,
    y: 650,
    w: 200,
    h: 200,
    enterFrame: 80,
    exitFrame: 238,
    enterEasing: "backOut",
    exitEasing: "cubicIn",
    radius: 100,
  },
  {
    id: "lavender-arch-1",
    type: "arch",
    color: PALETTE.lavender,
    x: 600,
    y: 100,
    w: 220,
    h: 320,
    enterFrame: 76,
    exitFrame: 242,
    enterEasing: "quintOut",
    exitEasing: "sineIn",
  },
  {
    id: "blue-bar-1",
    type: "bar",
    color: PALETTE.blue,
    x: 100,
    y: 800,
    w: 500,
    h: 40,
    enterFrame: 84,
    exitFrame: 244,
    enterEasing: "expoOut",
    exitEasing: "quintIn",
    cornerRadius: 20,
  },
  {
    id: "black-triangle-1",
    type: "triangle",
    color: PALETTE.black,
    x: 1600,
    y: 150,
    w: 160,
    h: 180,
    enterFrame: 90,
    exitFrame: 230,
    enterEasing: "backOut",
    exitEasing: "cubicIn",
    rotation: 15,
  },
  {
    id: "white-rect-2",
    type: "rect",
    color: PALETTE.white,
    x: 1100,
    y: 700,
    w: 280,
    h: 180,
    enterFrame: 95,
    exitFrame: 236,
    enterEasing: "quintOut",
    exitEasing: "sineIn",
    cornerRadius: 8,
  },
  {
    id: "yellow-star-1",
    type: "star",
    color: PALETTE.yellow,
    x: 960,
    y: 180,
    w: 120,
    h: 120,
    enterFrame: 100,
    exitFrame: 232,
    enterEasing: "elasticOut",
    exitEasing: "cubicIn",
  },
  {
    id: "lavender-circle-2",
    type: "circle",
    color: PALETTE.lavender,
    x: 350,
    y: 600,
    w: 140,
    h: 140,
    enterFrame: 88,
    exitFrame: 245,
    enterEasing: "backOut",
    exitEasing: "sineIn",
    radius: 70,
  },
  {
    id: "blue-rect-3",
    type: "rect",
    color: PALETTE.blue,
    x: 1400,
    y: 500,
    w: 240,
    h: 160,
    enterFrame: 105,
    exitFrame: 234,
    enterEasing: "expoOut",
    exitEasing: "quintIn",
    cornerRadius: 6,
  },
];

// ── Blob configuration ──
export const BLOB_CONFIG = {
  dotSpacing: 8,
  dotRadius: 1.5,
  baseColor: PALETTE.blobBase,
  dotColor: PALETTE.dots,
} as const;

export const BLOBS = [
  {
    cx: 960,
    cy: 400,
    baseRadius: 250,
    seed: 42,
    enterFrame: 3,
    exitFrame: 258,
  },
  {
    cx: 500,
    cy: 600,
    baseRadius: 180,
    seed: 137,
    enterFrame: 6,
    exitFrame: 255,
  },
  {
    cx: 1400,
    cy: 350,
    baseRadius: 200,
    seed: 256,
    enterFrame: 6,
    exitFrame: 255,
  },
  {
    cx: 1100,
    cy: 700,
    baseRadius: 160,
    seed: 389,
    enterFrame: 9,
    exitFrame: 252,
  },
] as const;

// ── Timeline constants ──
export const config = {
  totalFrames: 300, // 10s at 30fps
  fps: 30,

  // Entrance animation duration (frames)
  enterDuration: 20,
  // Exit animation duration (frames)
  exitDuration: 18,

  // Grain
  grainSize: 2,
  grainAlpha: 10, // out of 255, subtle

  // Blob morph speed (radians per frame)
  blobMorphRate: 0.04,
} as const;
