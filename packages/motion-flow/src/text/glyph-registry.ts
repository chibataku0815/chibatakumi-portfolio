// ============================================================
// motion-flowline-webgpu — Phase 11 glyph registry
//
// Single fixed hero string for Phase 11. A richer registry and runtime glyph
// swap live behind Phase Q4 (`@life/hero-glyphs`); everything shader-side
// hard-codes the world-space extent declared here.
//
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase11-onward-handoff.md §6.2
// ============================================================

import { generateGlyphSdf, type GeneratedSdf } from "./sdf-generator";
import {
  createFlowlineSdfTexture,
  type FlowlineSdfTexture,
} from "./sdf-texture";

export const HERO_TEXT = "FLOWLINE" as const;

/** Canvas + output SDF texture width (px). Must satisfy width * 4 % 256 == 0. */
export const SDF_TEXTURE_WIDTH = 1024;
/** Canvas + output SDF texture height (px). */
export const SDF_TEXTURE_HEIGHT = 256;

/**
 * World-space width the SDF maps to. The compute shader places the glyph at
 * (0.5, 0.5) in the unit-square agent field, so x-extent centred around the
 * middle with width 0.6 puts the glyph body between ~0.20 and ~0.80 — solidly
 * in the central band where the hero reading lives.
 */
export const GLYPH_WORLD_WIDTH = 0.6;
/** Derived world height preserving the texture aspect. */
export const GLYPH_WORLD_HEIGHT =
  GLYPH_WORLD_WIDTH * (SDF_TEXTURE_HEIGHT / SDF_TEXTURE_WIDTH);

/** Centre of the glyph in agent unit-square coordinates. */
export const GLYPH_CENTER_X = 0.5;
export const GLYPH_CENTER_Y = 0.5;

/**
 * Font stack. system-ui covers macOS (SF Pro), Windows (Segoe UI), Linux. A
 * Helvetica Neue fallback lands on something geometric-sans when Canvas 2D
 * cannot resolve system-ui at extreme weights.
 */
export const HERO_FONT_STACK = `"Helvetica Neue", system-ui, sans-serif`;
export const HERO_FONT_WEIGHT = 900;

/**
 * Create and upload the default hero SDF. Caller owns the returned texture
 * handle and is responsible for invoking `destroy()` on teardown.
 */
export function createHeroSdf(device: GPUDevice): {
  readonly sdf: GeneratedSdf;
  readonly texture: FlowlineSdfTexture;
} {
  const sdf = generateGlyphSdf({
    outputWidth: SDF_TEXTURE_WIDTH,
    outputHeight: SDF_TEXTURE_HEIGHT,
    text: HERO_TEXT,
    fontStack: HERO_FONT_STACK,
    fontWeight: HERO_FONT_WEIGHT,
    worldWidth: GLYPH_WORLD_WIDTH,
  });
  const texture = createFlowlineSdfTexture(device, sdf);
  return { sdf, texture };
}

/**
 * Uniform-friendly description of the glyph's world-space placement. Packed
 * into the FlowlineParams uniform so the compute shader can sample the SDF
 * without extra bind slots.
 */
export type GlyphPlacement = {
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
};

export const HERO_PLACEMENT: GlyphPlacement = {
  centerX: GLYPH_CENTER_X,
  centerY: GLYPH_CENTER_Y,
  width: GLYPH_WORLD_WIDTH,
  height: GLYPH_WORLD_HEIGHT,
};
