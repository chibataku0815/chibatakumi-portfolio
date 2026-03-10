/**
 * extract-glyphs.ts — Extract glyph paths from Geist Sans font files using opentype.js
 */
import opentype from "opentype.js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { PathCommand } from "./utils/path-ops";

const SCRIPTS_DIR = import.meta.dir;
const CACHE_DIR = join(SCRIPTS_DIR, ".cache");
const FONTS_DIR = join(SCRIPTS_DIR, "fonts");

// Characters needed
const PRIMARY_CHARS = ["C", "H", "I", "B", "A"]; // CHIBA — Medium
const SECONDARY_CHARS = ["T", "A", "K", "U", "M", "I"]; // TAKUMI — Light

const FONT_SIZE = 1000; // UPM normalization

interface GlyphData {
  char: string;
  commands: PathCommand[];
  advanceWidth: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  svgPath: string;
}

interface ExtractedGlyphs {
  primary: GlyphData[]; // CHIBA (Medium)
  secondary: GlyphData[]; // TAKUMI (Light)
  fontMetrics: {
    unitsPerEm: number;
    ascender: number;
    descender: number;
  };
}

function extractGlyph(font: opentype.Font, char: string): GlyphData {
  const glyph = font.charToGlyph(char);
  const path = glyph.getPath(0, 0, FONT_SIZE);
  const commands: PathCommand[] = path.commands.map((cmd: any) => {
    const out: PathCommand = { type: cmd.type };
    if (cmd.x !== undefined) out.x = cmd.x;
    if (cmd.y !== undefined) out.y = cmd.y;
    if (cmd.x1 !== undefined) out.x1 = cmd.x1;
    if (cmd.y1 !== undefined) out.y1 = cmd.y1;
    if (cmd.x2 !== undefined) out.x2 = cmd.x2;
    if (cmd.y2 !== undefined) out.y2 = cmd.y2;
    return out;
  });

  const bb = glyph.getBoundingBox();
  const scale = FONT_SIZE / font.unitsPerEm;

  return {
    char,
    commands,
    advanceWidth: Math.round((glyph.advanceWidth || 0) * scale),
    bounds: {
      minX: Math.round(bb.x1 * scale),
      minY: Math.round(bb.y1 * scale),
      maxX: Math.round(bb.x2 * scale),
      maxY: Math.round(bb.y2 * scale),
    },
    svgPath: path.toSVG ? (path as any).toSVG(2) : "",
  };
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });

  // Load fonts
  const mediumPath = join(FONTS_DIR, "Geist-Medium.otf");
  const lightPath = join(FONTS_DIR, "Geist-Light.otf");

  console.log("Loading Geist-Medium.otf...");
  const mediumFont = opentype.loadSync(mediumPath);
  console.log("Loading Geist-Light.otf...");
  const lightFont = opentype.loadSync(lightPath);

  console.log(
    `Font metrics — UPM: ${mediumFont.unitsPerEm}, ascender: ${mediumFont.ascender}, descender: ${mediumFont.descender}`
  );

  // Extract CHIBA from Medium
  const primary = PRIMARY_CHARS.map((char) => {
    const glyph = extractGlyph(mediumFont, char);
    console.log(
      `  ${char} (Medium): width=${glyph.advanceWidth}, commands=${glyph.commands.length}`
    );
    return glyph;
  });

  // Extract TAKUMI from Medium (same weight as CHIBA)
  const secondary = SECONDARY_CHARS.map((char) => {
    const glyph = extractGlyph(mediumFont, char);
    console.log(
      `  ${char} (Medium): width=${glyph.advanceWidth}, commands=${glyph.commands.length}`
    );
    return glyph;
  });

  const result: ExtractedGlyphs = {
    primary,
    secondary,
    fontMetrics: {
      unitsPerEm: mediumFont.unitsPerEm,
      ascender: mediumFont.ascender,
      descender: mediumFont.descender,
    },
  };

  const outPath = join(CACHE_DIR, "raw-glyphs.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWritten to ${outPath}`);
}

main().catch(console.error);
