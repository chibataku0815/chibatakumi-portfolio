/**
 * build-italic-wordmark.ts
 *
 * Bake the /experiments/wordmark "Jost candidate" (Jost-800-HevyItalic) into
 * static SVG paths for production Hero use. Runtime opentype.js + Three.js is
 * avoided in Hero by pre-computing path data here.
 *
 * Brand parameters mirror candidates.ts → Jost row:
 *   font:     /fonts/Jost-800-HevyItalic.otf
 *   fontSize: 700
 *   tracking: 0.00 em
 *   kerning:  { MI: 15 }   (vertical-stroke collision relief)
 *
 * Outputs:
 *   .cache/wordmark-italic-data.json   — paste-ready data for portfolio.ts
 *   public/brand/logo-wordmark-italic.svg — standalone SVG
 *
 * Run:  bun run apps/web/scripts/build-italic-wordmark.ts
 */

import opentype from "opentype.js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SCRIPTS_DIR = import.meta.dir;
const CACHE_DIR = join(SCRIPTS_DIR, ".cache");
const WEB_DIR = join(SCRIPTS_DIR, "..");
const FONT_PATH = join(WEB_DIR, "public", "fonts", "Jost-800-HevyItalic.otf");
const PUBLIC_DIR = join(WEB_DIR, "public", "brand");

// Brand spec — must match candidates.ts (Jost row)
const PRIMARY_TEXT = "CHIBA";
const SECONDARY_TEXT = "TAKUMI";
const FONT_SIZE = 700;
const TRACKING_EM = 0.0;
const KERNING_OVERRIDES_PRIMARY: Record<string, number> = {};
const KERNING_OVERRIDES_SECONDARY: Record<string, number> = { MI: 15 };
const PADDING = 32;

interface GlyphPlacement {
  char: string;
  cursorX: number;
}

interface LayoutResult {
  placements: GlyphPlacement[];
  endX: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

function expandBBox(
  bbox: LayoutResult["bbox"],
  gb: { x1: number; y1: number; x2: number; y2: number },
) {
  bbox.minX = Math.min(bbox.minX, gb.x1);
  bbox.minY = Math.min(bbox.minY, gb.y1);
  bbox.maxX = Math.max(bbox.maxX, gb.x2);
  bbox.maxY = Math.max(bbox.maxY, gb.y2);
}

function layoutRun(
  font: opentype.Font,
  text: string,
  startX: number,
  fontSize: number,
  trackingPx: number,
  kerningOverrides: Record<string, number>,
): LayoutResult {
  const scale = fontSize / font.unitsPerEm;
  const placements: GlyphPlacement[] = [];
  const bbox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  let cursor = startX;
  let prevGlyph: opentype.Glyph | null = null;
  let prevChar = "";

  for (const char of text) {
    const glyph = font.charToGlyph(char);

    if (prevGlyph) {
      const pair = prevChar + char;
      const authoredKerning = font.getKerningValue(prevGlyph, glyph);
      const override = kerningOverrides[pair];
      const kerningUnits = override !== undefined ? override : authoredKerning;
      cursor += kerningUnits * scale + trackingPx;
    }

    placements.push({ char, cursorX: cursor });

    const path = glyph.getPath(cursor, 0, fontSize);
    expandBBox(bbox, path.getBoundingBox());

    cursor += (glyph.advanceWidth ?? 0) * scale;
    prevGlyph = glyph;
    prevChar = char;
  }

  return { placements, endX: cursor, bbox };
}

function renderPlacements(
  font: opentype.Font,
  placements: GlyphPlacement[],
  fontSize: number,
  xShift: number,
  yShift: number,
): string[] {
  return placements.map(({ char, cursorX }) => {
    const glyph = font.charToGlyph(char);
    const path = glyph.getPath(cursorX + xShift, yShift, fontSize);
    return path.toPathData(2);
  });
}

function spaceAdvance(
  font: opentype.Font,
  fontSize: number,
  trackingPx: number,
): number {
  const scale = fontSize / font.unitsPerEm;
  const space = font.charToGlyph(" ");
  return (space.advanceWidth ?? 0) * scale + trackingPx;
}

function generateStandaloneSVG(
  viewBox: string,
  primaryPaths: string[],
  secondaryPaths: string[],
): string {
  const primaryEls = primaryPaths
    .map((d) => `    <path d="${d}"/>`)
    .join("\n");
  const secondaryEls = secondaryPaths
    .map((d) => `    <path d="${d}"/>`)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">
  <g>
${primaryEls}
  </g>
  <g opacity="0.6">
${secondaryEls}
  </g>
</svg>
`;
}

function main() {
  console.log("Loading Jost-800-HevyItalic.otf...");
  const buffer = readFileSync(FONT_PATH);
  const ab = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  const font = opentype.parse(ab);
  console.log(
    `  unitsPerEm=${font.unitsPerEm}, ascender=${font.ascender}, descender=${font.descender}`,
  );

  const trackingPx = TRACKING_EM * FONT_SIZE;

  // ── Pass 1 — layout ────────────────────────────────────────────────────────
  console.log("\nPass 1 — layout");

  const primary = layoutRun(
    font,
    PRIMARY_TEXT,
    0,
    FONT_SIZE,
    trackingPx,
    KERNING_OVERRIDES_PRIMARY,
  );
  console.log(`  CHIBA: endX=${primary.endX.toFixed(1)}`);

  const wordGap = spaceAdvance(font, FONT_SIZE, trackingPx);
  const secondaryStartX = primary.endX + wordGap;
  console.log(`  word gap=${wordGap.toFixed(1)} (space.advance + tracking)`);

  const secondary = layoutRun(
    font,
    SECONDARY_TEXT,
    secondaryStartX,
    FONT_SIZE,
    trackingPx,
    KERNING_OVERRIDES_SECONDARY,
  );
  console.log(`  TAKUMI: endX=${secondary.endX.toFixed(1)}`);

  // Combine bboxes
  const combinedBBox = {
    minX: Math.min(primary.bbox.minX, secondary.bbox.minX),
    minY: Math.min(primary.bbox.minY, secondary.bbox.minY),
    maxX: Math.max(primary.bbox.maxX, secondary.bbox.maxX),
    maxY: Math.max(primary.bbox.maxY, secondary.bbox.maxY),
  };

  console.log(
    `  combined bbox: x=[${combinedBBox.minX.toFixed(1)}, ${combinedBBox.maxX.toFixed(1)}] y=[${combinedBBox.minY.toFixed(1)}, ${combinedBBox.maxY.toFixed(1)}]`,
  );

  // ── Pass 2 — render with translation ──────────────────────────────────────
  console.log("\nPass 2 — render with translation");

  const xShift = -combinedBBox.minX + PADDING;
  const yShift = -combinedBBox.minY + PADDING;
  const viewBoxWidth = Math.round(
    combinedBBox.maxX - combinedBBox.minX + PADDING * 2,
  );
  const viewBoxHeight = Math.round(
    combinedBBox.maxY - combinedBBox.minY + PADDING * 2,
  );
  console.log(`  xShift=${xShift.toFixed(1)} yShift=${yShift.toFixed(1)}`);
  console.log(`  viewBox: 0 0 ${viewBoxWidth} ${viewBoxHeight}`);

  const primaryPaths = renderPlacements(
    font,
    primary.placements,
    FONT_SIZE,
    xShift,
    yShift,
  );
  const secondaryPaths = renderPlacements(
    font,
    secondary.placements,
    FONT_SIZE,
    xShift,
    yShift,
  );

  // ── Output ────────────────────────────────────────────────────────────────
  const wordmarkData = {
    full: `${PRIMARY_TEXT} ${SECONDARY_TEXT}`,
    ariaLabel: "Chiba Takumi home",
    viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    width: viewBoxWidth,
    height: viewBoxHeight,
    strokeWidth: 2,
    primaryPaths,
    secondaryPaths,
  };

  mkdirSync(CACHE_DIR, { recursive: true });
  const cacheJson = join(CACHE_DIR, "wordmark-italic-data.json");
  writeFileSync(cacheJson, JSON.stringify(wordmarkData, null, 2));
  console.log(`\n.cache JSON → ${cacheJson}`);

  mkdirSync(PUBLIC_DIR, { recursive: true });
  const svgPath = join(PUBLIC_DIR, "logo-wordmark-italic.svg");
  writeFileSync(
    svgPath,
    generateStandaloneSVG(
      wordmarkData.viewBox,
      wordmarkData.primaryPaths,
      wordmarkData.secondaryPaths,
    ),
  );
  console.log(`SVG → ${svgPath}`);

  console.log(
    `\n✓ ${primaryPaths.length} primary + ${secondaryPaths.length} secondary paths`,
  );
}

main();
