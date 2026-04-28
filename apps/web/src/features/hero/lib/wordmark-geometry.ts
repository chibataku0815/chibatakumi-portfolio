import type { Font, Glyph } from "opentype.js";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

export type WordmarkBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type WordmarkLayerName = "primary" | "secondary";

export type WordmarkGlyphAdjustment = {
  /** Restrict this adjustment to one word layer. Omit to apply to both. */
  layer?: WordmarkLayerName;
  /** Single character this adjustment targets, e.g. "I" or "K". */
  char: string;
  /** Zero-based occurrence of `char` within the selected layer. Omit for all occurrences. */
  occurrence?: number;
  /** Optical width multiplier around the glyph's visual center. */
  scaleX?: number;
  /** Optical height multiplier around the glyph's visual center. */
  scaleY?: number;
  /** Additional x-shear in degrees. Positive values lean the glyph further right. */
  skewXDeg?: number;
  /** Post-transform x nudge measured in ems. */
  translateXEm?: number;
  /** Post-transform y nudge measured in ems. */
  translateYEm?: number;
  /** Cursor advance multiplier after drawing this glyph. */
  advanceScale?: number;
  /** Additional cursor advance measured in ems. */
  advanceEm?: number;
};

export type WordmarkLetterformSystem = {
  /**
   * Explicit inter-word gap. When omitted, the font's authored space glyph
   * plus tracking preserves normal text setting. Setting this is the fastest
   * way to make CHIBA TAKUMI behave like a lockup instead of prose.
   */
  wordGapEm?: number;
  /** Minimal custom-letterform layer, applied before the final centering pass. */
  glyphAdjustments?: WordmarkGlyphAdjustment[];
};

export type WordmarkGlyph = {
  id: string;
  layer: WordmarkLayerName;
  char: string;
  occurrence: number;
  shapeGeoms: THREE.ShapeGeometry[];
  edgeGeoms: THREE.EdgesGeometry[];
  bounds: WordmarkBounds;
};

export type WordmarkLayer = {
  shapeGeoms: THREE.ShapeGeometry[];
  edgeGeoms: THREE.EdgesGeometry[];
  glyphs: WordmarkGlyph[];
  bounds: WordmarkBounds;
};

export type WordmarkLayers = {
  primary: WordmarkLayer;
  secondary: WordmarkLayer;
  combinedBounds: WordmarkBounds;
};

export type BuildWordmarkInput = {
  font: Font;
  /** e.g. "CHIBA" — rendered with the primary stage treatment */
  primary: string;
  /** e.g. "TAKUMI" — rendered with the secondary stage treatment */
  secondary: string;
  /** Font size in font-em units (passed to opentype.Font.getPath). 700–900 reads well at hero scale. */
  fontSize: number;
  /**
   * Additional letter-spacing as a fraction of fontSize.
   * 0 = default, 0.10 = wide (luxury fashion), -0.02 = tight (display italic).
   * Applied between every glyph (and before the first character of secondary,
   * which means the CHIBA→TAKUMI gap also widens with tracking).
   */
  tracking?: number;
  /**
   * Per-pair kerning overrides keyed by 2-character pair (e.g., "TA", "MI").
   * Values are in font-em units (same unit as font.getKerningValue's return).
   * If a pair is present, it bypasses the font's authored kerning for that pair.
   * Stream 1 implements the lookup; Phase 0 plumbs the type through.
   */
  kerningOverrides?: Record<string, number>;
  /**
   * Data-driven custom letterform layer. This is intentionally smaller than a
   * browser type editor: it only captures the high-value optical moves needed
   * to turn a font setting into a logotype candidate.
   */
  letterformSystem?: WordmarkLetterformSystem;
};

function buildShapeGeomsFromPathData(d: string): THREE.ShapeGeometry[] {
  if (!d) return [];
  // Wrap path data in a minimal SVG document so SVGLoader can parse it.
  // SVGLoader.createShapes handles nonzero/evenodd fill rules and produces
  // Shapes with proper holes — we don't need custom point-in-polygon detection.
  const svgDoc = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" /></svg>`;
  const data = new SVGLoader().parse(svgDoc);
  const out: THREE.ShapeGeometry[] = [];
  for (const shapePath of data.paths) {
    const shapes = SVGLoader.createShapes(shapePath);
    if (shapes.length === 0) continue;
    const geom = new THREE.ShapeGeometry(shapes);
    // SVG y-down → Three.js y-up. ⚠ Inverts triangle winding (CCW → CW).
    // Every consumer's mesh material MUST use side: THREE.DoubleSide
    // or the geometry renders blank (backface culled) with no error.
    geom.scale(1, -1, 1);
    out.push(geom);
  }
  return out;
}

function mergeAdjustment(
  target: WordmarkGlyphAdjustment,
  source: WordmarkGlyphAdjustment,
): WordmarkGlyphAdjustment {
  return {
    char: target.char,
    layer: target.layer,
    occurrence: target.occurrence,
    scaleX: (target.scaleX ?? 1) * (source.scaleX ?? 1),
    scaleY: (target.scaleY ?? 1) * (source.scaleY ?? 1),
    skewXDeg: (target.skewXDeg ?? 0) + (source.skewXDeg ?? 0),
    translateXEm: (target.translateXEm ?? 0) + (source.translateXEm ?? 0),
    translateYEm: (target.translateYEm ?? 0) + (source.translateYEm ?? 0),
    advanceScale: (target.advanceScale ?? 1) * (source.advanceScale ?? 1),
    advanceEm: (target.advanceEm ?? 0) + (source.advanceEm ?? 0),
  };
}

function resolveGlyphAdjustment(
  system: WordmarkLetterformSystem | undefined,
  layer: WordmarkLayerName,
  char: string,
  occurrence: number,
): WordmarkGlyphAdjustment | undefined {
  const matches = system?.glyphAdjustments?.filter(
    (a) =>
      a.char === char &&
      (a.layer === undefined || a.layer === layer) &&
      (a.occurrence === undefined || a.occurrence === occurrence),
  );
  if (!matches || matches.length === 0) return undefined;
  return matches.reduce(
    (acc, item) => mergeAdjustment(acc, item),
    { char, layer, occurrence },
  );
}

function applyGlyphAdjustment(
  geoms: THREE.ShapeGeometry[],
  adjustment: WordmarkGlyphAdjustment | undefined,
  fontSize: number,
): void {
  if (!adjustment || geoms.length === 0) return;

  const bounds = recomputeBounds(geoms);
  const anchorX = bounds.centerX;
  const anchorY = bounds.centerY;
  const translateX = (adjustment.translateXEm ?? 0) * fontSize;
  const translateY = (adjustment.translateYEm ?? 0) * fontSize;
  const skewX = Math.tan(THREE.MathUtils.degToRad(adjustment.skewXDeg ?? 0));

  const toOrigin = new THREE.Matrix4().makeTranslation(-anchorX, -anchorY, 0);
  const scale = new THREE.Matrix4().makeScale(
    adjustment.scaleX ?? 1,
    adjustment.scaleY ?? 1,
    1,
  );
  const skew = new THREE.Matrix4().set(
    1, skewX, 0, 0,
    0, 1,     0, 0,
    0, 0,     1, 0,
    0, 0,     0, 1,
  );
  const back = new THREE.Matrix4().makeTranslation(
    anchorX + translateX,
    anchorY + translateY,
    0,
  );
  const matrix = back.multiply(skew).multiply(scale).multiply(toOrigin);

  for (const geom of geoms) {
    geom.applyMatrix4(matrix);
  }
}

function expandFromGeom(
  geom: THREE.BufferGeometry,
  min: THREE.Vector3,
  max: THREE.Vector3,
): void {
  geom.computeBoundingBox();
  const b = geom.boundingBox;
  if (!b) return;
  min.min(b.min);
  max.max(b.max);
}

function recomputeBounds(geoms: THREE.BufferGeometry[]): WordmarkBounds {
  const min = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const max = new THREE.Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );
  for (const g of geoms) expandFromGeom(g, min, max);
  if (
    !Number.isFinite(min.x) ||
    !Number.isFinite(min.y) ||
    !Number.isFinite(max.x) ||
    !Number.isFinite(max.y)
  ) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }
  return {
    minX: min.x,
    minY: min.y,
    maxX: max.x,
    maxY: max.y,
    width: max.x - min.x,
    height: max.y - min.y,
    centerX: (min.x + max.x) / 2,
    centerY: (min.y + max.y) / 2,
  };
}

function buildGlyphRun({
  font,
  text,
  startX,
  fontSize,
  trackingPx,
  layer,
  kerningOverrides,
  letterformSystem,
}: {
  font: Font;
  text: string;
  startX: number;
  fontSize: number;
  trackingPx: number;
  layer: WordmarkLayerName;
  kerningOverrides?: Record<string, number>;
  letterformSystem?: WordmarkLetterformSystem;
}): { glyphs: WordmarkGlyph[]; advance: number } {
  const scale = fontSize / font.unitsPerEm;
  const glyphs: WordmarkGlyph[] = [];
  const occurrences = new Map<string, number>();
  let cursor = startX;
  let prevGlyph: Glyph | null = null;
  let prevChar = "";

  for (const char of text) {
    const glyph = font.charToGlyph(char);
    if (prevGlyph) {
      const pair = prevChar + char;
      const authoredKerning = font.getKerningValue(prevGlyph, glyph);
      const override = kerningOverrides?.[pair];
      const kerningUnits = override !== undefined ? override : authoredKerning;
      cursor += kerningUnits * scale + trackingPx;
    }

    const occurrence = occurrences.get(char) ?? 0;
    occurrences.set(char, occurrence + 1);
    const adjustment = resolveGlyphAdjustment(
      letterformSystem,
      layer,
      char,
      occurrence,
    );
    const path = glyph.getPath(cursor, 0, fontSize);
    const shapeGeoms = buildShapeGeomsFromPathData(path.toPathData(2));
    applyGlyphAdjustment(shapeGeoms, adjustment, fontSize);

    glyphs.push({
      id: `${layer}-${char}-${occurrence}`,
      layer,
      char,
      occurrence,
      shapeGeoms,
      edgeGeoms: [],
      bounds: recomputeBounds(shapeGeoms),
    });

    const advance = (glyph.advanceWidth ?? 0) * scale;
    cursor +=
      advance * (adjustment?.advanceScale ?? 1) +
      (adjustment?.advanceEm ?? 0) * fontSize;
    prevGlyph = glyph;
    prevChar = char;
  }

  return { glyphs, advance: cursor - startX };
}

function defaultWordGapPx(
  font: Font,
  fontSize: number,
  trackingPx: number,
): number {
  const scale = fontSize / font.unitsPerEm;
  const space = font.charToGlyph(" ");
  return (space.advanceWidth ?? 0) * scale + trackingPx;
}

function flattenShapes(glyphs: WordmarkGlyph[]): THREE.ShapeGeometry[] {
  return glyphs.flatMap((glyph) => glyph.shapeGeoms);
}

function flattenEdges(glyphs: WordmarkGlyph[]): THREE.EdgesGeometry[] {
  return glyphs.flatMap((glyph) => glyph.edgeGeoms);
}

function finalizeLayer(glyphs: WordmarkGlyph[]): WordmarkLayer {
  for (const glyph of glyphs) {
    glyph.bounds = recomputeBounds(glyph.shapeGeoms);
    glyph.edgeGeoms = glyph.shapeGeoms.map((g) => new THREE.EdgesGeometry(g));
  }
  const shapeGeoms = flattenShapes(glyphs);
  return {
    shapeGeoms,
    edgeGeoms: flattenEdges(glyphs),
    glyphs,
    bounds: recomputeBounds(shapeGeoms),
  };
}

/**
 * Build R3F-ready Three.js geometries for a two-layer wordmark from an opentype.js
 * font, generating glyph paths at runtime with optional brand-convention tracking.
 *
 * Pipeline:
 *   font + text + tracking → per-glyph getPath at cursor-accumulated x positions
 *   → SVG d-string → SVGLoader.parse → SVGLoader.createShapes (handles holes)
 *   → THREE.ShapeGeometry → Y-flip scale(1,-1,1)
 *   → uniform translate so combined bbox is centered at origin
 *   → THREE.EdgesGeometry built post-transform (wireframe co-located with mesh).
 *
 * ⚠ CRITICAL: scale(1, -1, 1) inverts triangle winding. Default THREE.FrontSide
 * culls every face → BLANK render with no error. Every consuming material MUST
 * set side: THREE.DoubleSide. lineBasicMaterial for EdgesGeometry is unaffected.
 */
export function buildWordmarkLayers(
  input: BuildWordmarkInput,
): WordmarkLayers {
  const { font, primary, secondary, fontSize } = input;
  const trackingPx = (input.tracking ?? 0) * fontSize;
  const kerningOverrides = input.kerningOverrides;

  const primaryRun = buildGlyphRun({
    font,
    text: primary,
    startX: 0,
    fontSize,
    trackingPx,
    kerningOverrides,
    layer: "primary",
    letterformSystem: input.letterformSystem,
  });
  const wordGap =
    input.letterformSystem?.wordGapEm !== undefined
      ? input.letterformSystem.wordGapEm * fontSize
      : defaultWordGapPx(font, fontSize, trackingPx);
  const secondaryRun = buildGlyphRun({
    font,
    text: secondary,
    startX: primaryRun.advance + wordGap,
    fontSize,
    trackingPx,
    kerningOverrides,
    layer: "secondary",
    letterformSystem: input.letterformSystem,
  });
  const primaryShapes = flattenShapes(primaryRun.glyphs);
  const secondaryShapes = flattenShapes(secondaryRun.glyphs);

  // Pass 1: combined bounds across both layers (post Y-flip, pre-translate).
  const min = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const max = new THREE.Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );
  for (const g of primaryShapes) expandFromGeom(g, min, max);
  for (const g of secondaryShapes) expandFromGeom(g, min, max);

  const combinedCenterX = (min.x + max.x) / 2;
  const combinedCenterY = (min.y + max.y) / 2;

  // Pass 2: uniform translate so combined bbox is centered at world origin.
  const allShapes = [...primaryShapes, ...secondaryShapes];
  for (const g of allShapes) {
    g.translate(-combinedCenterX, -combinedCenterY, 0);
  }

  // Pass 3: edges from translated shape geometries.
  const primaryLayer = finalizeLayer(primaryRun.glyphs);
  const secondaryLayer = finalizeLayer(secondaryRun.glyphs);
  return {
    primary: primaryLayer,
    secondary: secondaryLayer,
    combinedBounds: recomputeBounds(allShapes),
  };
}
