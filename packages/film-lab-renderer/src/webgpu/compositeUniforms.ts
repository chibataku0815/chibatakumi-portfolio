/**
 * compositeUniforms — TS packer for the composite.wgsl `Composite` struct.
 *
 * Phase 2 T2-3 + v1.0 parity (2026-04-19). Optical Finish "Set Y" extension
 * (2026-04-21) added a 5th vec4 `effects2` for Phase A-D mode toggles.
 * "Phase E" (2026-04-21) added a 6th vec4 `effects3` for Global Veiling +
 * Subject Softening (flat-light baseline uplift, default=0).
 *
 * Layout (6 vec4 × 4 floats = 24 floats = 96 bytes):
 *   0: (resolutionX, resolutionY, imageResX, imageResY)
 *   1: (bloomStrength, halationIntensity, vignette, grainIntensity)
 *   2: (grainSize, grainRadialMix, fitMode, time)
 *   3: (lensSoftness, aberrationEdgeSoften, diffusion, depthMistGain)
 *   4: (compositeMode, halationSpectralMix, bloomHueLock, mtfStrength)
 *   5: (globalVeiling, subjectSoftening, reserved, reserved)
 *
 * `depthMistGain` is a dev-only AI depth probe knob (0 = uniform mist,
 * 1 = full depth modulation). See `composite.frag.wgsl.ts` binding(7) uDepth.
 *
 * `effects2` toggles — individually addressable but bundled by `glowCharacter`
 * at the UI layer (Set Y split to Diffuse vs Physical characters). Defaults
 * fall through to 0 (Diffuse / legacy) when the caller omits them:
 *   compositeMode      0 = legacy screen-blend (Diffuse), 1 = energy-conserving (Physical)
 *   halationSpectralMix 0 = single-tier (Diffuse), 1 = core+edge spectral (Physical)
 *   bloomHueLock       0 = RGB blur (Diffuse), 1 = Oklch hue-preserving (Physical)
 *   mtfStrength        0 = no source softening (Diffuse), 1 = halation-mask MTF (Physical)
 *
 * `effects3` — Phase E flat-light baseline. default=0 keeps Set Y output
 * pixel-identical; opt-in at preset layer for flat-light scenes.
 *   globalVeiling     0..0.3  — diffusion-pyramid (threshold-free low-freq)
 *                                additively lifted into base, independent of
 *                                `diffusion` strength. Forces diffusion
 *                                pyramid build even when `diffusion == 0`.
 *   subjectSoftening  0..0.4  — 5-tap gaussian blur of uSource, mixed into
 *                                base weighted by near-depth mask. Highlight-
 *                                independent skin/subject softening.
 */

export const COMPOSITE_UNIFORM_FLOATS = 24;
export const COMPOSITE_UNIFORM_BYTES = COMPOSITE_UNIFORM_FLOATS * 4;
const ABERRATION_EDGE_SOFTEN_SCALE = 32;

export interface CompositeFrameState {
  resolutionX: number;
  resolutionY: number;
  imgResX: number;
  imgResY: number;
  fitMode: number;
  time: number;
  params: Record<string, number | string | boolean>;
}

export function packCompositeUniforms(
  state: CompositeFrameState,
  out: Float32Array = new Float32Array(COMPOSITE_UNIFORM_FLOATS),
): Float32Array {
  if (out.length !== COMPOSITE_UNIFORM_FLOATS) {
    throw new Error(
      `packCompositeUniforms: out length ${out.length} !== ${COMPOSITE_UNIFORM_FLOATS}`,
    );
  }
  const n = (key: string, fallback: number): number => {
    const v = state.params[key];
    return typeof v === "number" ? v : fallback;
  };
  const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
  out[0] = state.resolutionX;
  out[1] = state.resolutionY;
  out[2] = state.imgResX;
  out[3] = state.imgResY;
  out[4] = n("bloomStrength", 0);
  out[5] = n("halationIntensity", 0);
  out[6] = n("vignette", 0);
  out[7] = n("grainIntensity", 0);
  out[8] = n("grainSize", 0);
  out[9] = n("grainRadialMix", 1);
  out[10] = state.fitMode;
  out[11] = state.time;
  out[12] = n("lensSoftness", 0);
  out[13] = clamp01(n("rgbShift", 0) * ABERRATION_EDGE_SOFTEN_SCALE);
  out[14] = clamp01(n("diffusion", 0));
  // depthMistGain: 0..1 = modulated mist, >=1.5 = debug depth view.
  // Allow up to 2.0 so the debug branch in the shader can be selected.
  out[15] = Math.min(2, Math.max(0, n("depthMistGain", 0)));
  // effects2 — Set Y phase mode toggles. Default 0 (Diffuse / legacy).
  // `glowCharacter=1` at the UI layer flips all four to 1 (Physical).
  out[16] = clamp01(n("compositeMode", 0));
  out[17] = clamp01(n("halationSpectralMix", 0));
  out[18] = clamp01(n("bloomHueLock", 0));
  out[19] = clamp01(n("mtfStrength", 0));
  // effects3 — Phase E flat-light baseline. Default 0 = pixel-identical to Set Y.
  // Upper bounds widened for dev A/B visibility (clamp at shader side too).
  out[20] = Math.min(1, Math.max(0, n("globalVeiling", 0)));
  out[21] = Math.min(1, Math.max(0, n("subjectSoftening", 0)));
  out[22] = 0;
  out[23] = 0;
  return out;
}

/**
 * Parse a `#rrggbb` / `#rgb` hex string into linear-ish 0..1 components.
 * Matches the WebGL backend's `hexToVec3` so halation color upload produces
 * the same tint for a given preset string. Inputs are treated as sRGB
 * encoded, but the WebGL path also feeds them into the shader without an
 * sRGB→linear step, so parity is the safe choice here.
 */
export function hexToRgbTriple(hex: string): [number, number, number] {
  const raw = hex.replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = Number.parseInt(full.substring(0, 2), 16) / 255;
  const g = Number.parseInt(full.substring(2, 4), 16) / 255;
  const b = Number.parseInt(full.substring(4, 6), 16) / 255;
  return [
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0,
  ];
}
