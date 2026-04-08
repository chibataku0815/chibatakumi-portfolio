import type {
  MotifMotionVariant,
  PatternMethod,
  PatternSceneSpec,
} from "./lib/patterns";

type SceneSpec = {
  title: string;
  note: string;
  method: PatternMethod;
  motionVariant: MotifMotionVariant;
  background: string;
  layout: PatternSceneSpec;
};

export const sceneFrames = 90;

export const scenes: readonly SceneSpec[] = [
  {
    title: "Motion Tile",
    note: "grid repeat with independent motif scaling and row phase offset",
    method: "motion-tile",
    motionVariant: "pulse",
    background: "#f6dcdc",
    layout: {
      method: "motion-tile",
      tileWidth: 276,
      tileHeight: 252,
      motifScale: 0.9,
      rowOffset: 0.48,
      startX: -24,
      startY: -12,
      rotationJitterDeg: 5,
    },
  },
  {
    title: "Repetile",
    note: "checker mirror layout for more varied reflection without new art",
    method: "repetile",
    motionVariant: "sway",
    background: "#f7d6dd",
    layout: {
      method: "repetile",
      tileWidth: 248,
      tileHeight: 238,
      motifScale: 0.83,
      startX: -12,
      startY: 10,
      mirrorMode: "checker",
      rotationJitterDeg: 4,
    },
  },
  {
    title: "CC HexTile",
    note: "hex packing gives a denser loop and supports kaleidoscopic alternation",
    method: "hex-tile",
    motionVariant: "spin",
    background: "#f5d8db",
    layout: {
      method: "hex-tile",
      tileWidth: 296,
      tileHeight: 222,
      motifScale: 0.88,
      startX: -62,
      startY: -34,
      mirrorMode: "alternate-columns",
      rotationJitterDeg: 8,
    },
  },
] as const;

export const config = {
  id: "AETipLoopingPatternBackground",
  fps: 30,
  width: 1080,
  height: 1080,
  totalFrames: sceneFrames * scenes.length,
  motifBaseSize: 168,
  paperSpeckCount: 220,
  bloomCloudCount: 12,
  labelColor: "#506aa8",
  titleColor: "#2d4373",
  noteColor: "rgba(45,67,115,0.74)",
  cardBackground: "rgba(255,255,255,0.38)",
  cardBorder: "rgba(45,67,115,0.08)",
  cardShadow: "0 20px 54px rgba(141, 106, 126, 0.12)",
} as const;
