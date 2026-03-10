/**
 * build-wordmark.ts — Orchestrator: assemble CHIBA TAKUMI wordmark from modified glyphs
 *
 * Reads modified glyphs, applies kerning, assembles into final SVG paths,
 * and outputs to portfolio.ts data and SVG files.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { PathCommand } from "./utils/path-ops";
import {
  commandsToSVG,
  roundCommands,
  translateCommands,
} from "./utils/path-ops";

const SCRIPTS_DIR = import.meta.dir;
const CACHE_DIR = join(SCRIPTS_DIR, ".cache");
const WEB_DIR = join(SCRIPTS_DIR, "..");
const PUBLIC_DIR = join(WEB_DIR, "public", "brand");
const DATA_DIR = join(WEB_DIR, "src", "shared", "data");

interface GlyphData {
  char: string;
  commands: PathCommand[];
  advanceWidth: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  svgPath: string;
}

interface ModifiedGlyphs {
  primary: GlyphData[];
  secondary: GlyphData[];
  fontMetrics: { unitsPerEm: number; ascender: number; descender: number };
}

// ─── Kerning Table ──────────────────────────────────────────────────────────
// Pairs within CHIBA (primary, Medium)
const PRIMARY_KERNING: Record<string, number> = {
  "C-H": -18,
  "H-I": 0,
  "I-B": 0,
  "B-A": -24,
};

// Space between CHIBA and TAKUMI
const WORD_SPACE = 234; // S × φ² ≈ 234 UPM

// Pairs within TAKUMI (secondary, Light)
const SECONDARY_KERNING: Record<string, number> = {
  "T-A": -32,
  "A-K": -20,
  "K-U": -14,
  "U-M": -4,
  "M-I": -10,
};

// Padding around the wordmark
const PADDING = 48;

// ─── Helpers ────────────────────────────────────────────────────────────────

function assembleGroup(
  glyphs: GlyphData[],
  kerning: Record<string, number>,
  startX: number
): { paths: string[]; totalWidth: number; endX: number } {
  const paths: string[] = [];
  let cursorX = startX;

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];

    // Translate glyph to current cursor position
    // Font coords: y=0 is baseline, negative = above
    // We need to shift x by (cursorX - glyph left bearing)
    // Left bearing is the glyph's minX (leftmost point)
    const xOffset = cursorX;
    // Y stays in font coords for now — we'll flip when generating final SVG

    const translated = translateCommands(glyph.commands, xOffset, 0);
    const rounded = roundCommands(translated);
    paths.push(commandsToSVG(rounded));

    // Advance cursor
    cursorX += glyph.advanceWidth;

    // Apply kerning for the next pair
    if (i < glyphs.length - 1) {
      const pair = `${glyph.char}-${glyphs[i + 1].char}`;
      const kern = kerning[pair] || 0;
      cursorX += kern;
    }
  }

  return {
    paths,
    totalWidth: cursorX - startX,
    endX: cursorX,
  };
}

/** Transform from font coords (y-up) to SVG coords (y-down) */
function fontToSVG(d: string, capHeight: number, overshoot: number): string {
  // In font coords: baseline at y=0, cap at y=-710, below baseline is y>0
  // For SVG: we want cap at top (y=overshoot), baseline at bottom
  // Transform: svgY = -(fontY) + overshoot
  // But we can achieve this with a transform on the path

  // Parse and transform all Y coordinates
  // Actually, let's use a group transform in the final SVG
  // For the path data in portfolio.ts, we need transformed coordinates

  // Simple approach: regex replace Y coordinates
  // But this is error-prone. Better to work with commands.

  return d; // We'll handle transform at SVG assembly level
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const modifiedPath = join(CACHE_DIR, "modified-glyphs.json");
  const data: ModifiedGlyphs = JSON.parse(readFileSync(modifiedPath, "utf-8"));

  console.log("Assembling wordmark...\n");

  // ── Step 1: Assemble CHIBA group ──
  const primary = assembleGroup(
    data.primary,
    PRIMARY_KERNING,
    PADDING
  );
  console.log(
    `CHIBA: ${primary.paths.length} chars, width=${primary.totalWidth} UPM`
  );

  // ── Step 2: Add word space and assemble TAKUMI group ──
  const secondaryStartX = primary.endX + WORD_SPACE;
  const secondary = assembleGroup(
    data.secondary,
    SECONDARY_KERNING,
    secondaryStartX
  );
  console.log(
    `TAKUMI: ${secondary.paths.length} chars, width=${secondary.totalWidth} UPM`
  );

  // ── Step 3: Calculate viewBox ──
  const totalWidth = secondary.endX + PADDING;
  // Font Y range: from ~+16 (below baseline overshoot) to ~-726 (above cap overshoot)
  // SVG transform: flip Y so cap is at top
  // viewBox: we'll use a group transform to flip Y
  const overshoot = 20;
  const viewBoxHeight = 710 + overshoot * 2; // 750
  const viewBoxWidth = Math.round(totalWidth);

  console.log(`\nViewBox: 0 0 ${viewBoxWidth} ${viewBoxHeight}`);
  console.log(`Total width: ${viewBoxWidth} UPM`);

  // ── Step 4: Transform paths to SVG coordinates ──
  // Font Y → SVG Y: svgY = -(fontY) + overshoot
  // This means: font y=0 (baseline) → SVG y=overshoot (near bottom)
  //            font y=-710 (cap) → SVG y=710+overshoot (wait, that's wrong)
  // Let me recalculate:
  // We want: cap at SVG y = overshoot (near top)
  //          baseline at SVG y = 710 + overshoot (near bottom)
  // Transform: svgY = -(fontY) + overshoot
  //   font y=-710 → svgY = 710 + 20 = 730... that's near the bottom
  //   font y=0 → svgY = 0 + 20 = 20... that's near the top
  // That's UPSIDE DOWN because baseline should be near bottom!
  //
  // Correct transform: svgY = fontY + 710 + overshoot
  //   font y=-710 → svgY = 0 + 20 = 20 (cap near top ✓)
  //   font y=0 → svgY = 710 + 20 = 730 (baseline near bottom ✓)
  //   font y=16 → svgY = 726 + 20 = 746 (below baseline overshoot ✓)
  //   font y=-726 → svgY = -16 + 20 = 4 (above cap overshoot ✓)

  const yTransform = 710 + overshoot; // Add this to all font Y coords

  function transformPath(d: string): string {
    // Transform each command's Y coordinates
    // Parse the SVG path and adjust Y values
    return d; // We'll use group-level transform instead
  }

  // For portfolio.ts, we store paths with a group transform
  // For clean SVG files, we'll apply the transform directly to coordinates

  function transformCommands(cmds: PathCommand[]): PathCommand[] {
    return cmds.map((cmd) => {
      const out: PathCommand = { type: cmd.type };
      if (cmd.x !== undefined) out.x = cmd.x;
      if (cmd.y !== undefined) out.y = cmd.y + yTransform;
      if (cmd.x1 !== undefined) out.x1 = cmd.x1;
      if (cmd.y1 !== undefined) out.y1 = cmd.y1 + yTransform;
      if (cmd.x2 !== undefined) out.x2 = cmd.x2;
      if (cmd.y2 !== undefined) out.y2 = cmd.y2 + yTransform;
      return out;
    });
  }

  // Re-assemble with SVG Y coordinates
  const svgPrimary = assembleGroupSVG(
    data.primary,
    PRIMARY_KERNING,
    PADDING,
    yTransform
  );
  const svgSecondary = assembleGroupSVG(
    data.secondary,
    SECONDARY_KERNING,
    secondaryStartX,
    yTransform
  );

  // ── Step 5: Output ──

  // 5a. Portfolio data structure
  const wordmarkData = {
    full: "CHIBA TAKUMI",
    ariaLabel: "Chiba Takumi home",
    viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    width: viewBoxWidth,
    height: viewBoxHeight,
    strokeWidth: 2,
    primaryPaths: svgPrimary.paths,
    secondaryPaths: svgSecondary.paths,
  };

  console.log("\n── portfolio.ts wordmark data ──");
  console.log(`viewBox: "${wordmarkData.viewBox}"`);
  console.log(`primaryPaths: ${wordmarkData.primaryPaths.length} paths`);
  console.log(`secondaryPaths: ${wordmarkData.secondaryPaths.length} paths`);

  // Write wordmark data to cache for manual integration
  const wordmarkJsonPath = join(CACHE_DIR, "wordmark-data.json");
  writeFileSync(wordmarkJsonPath, JSON.stringify(wordmarkData, null, 2));
  console.log(`\nWordmark data → ${wordmarkJsonPath}`);

  // 5b. Generate standalone SVG file
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const svgContent = generateSVG(wordmarkData);
  const svgPath = join(PUBLIC_DIR, "logo-wordmark.svg");
  writeFileSync(svgPath, svgContent);
  console.log(`SVG → ${svgPath}`);

  // 5c. Generate lockup SVG
  const lockupContent = generateLockupSVG(wordmarkData);
  const lockupPath = join(PUBLIC_DIR, "logo-lockup.svg");
  writeFileSync(lockupPath, lockupContent);
  console.log(`Lockup SVG → ${lockupPath}`);

  // 5d. Generate preview HTML
  const previewContent = generatePreviewHTML(wordmarkData);
  const previewPath = join(CACHE_DIR, "preview.html");
  writeFileSync(previewPath, previewContent);
  console.log(`Preview → ${previewPath}`);

  console.log("\n✓ Build complete");
}

function assembleGroupSVG(
  glyphs: GlyphData[],
  kerning: Record<string, number>,
  startX: number,
  yOffset: number
): { paths: string[] } {
  const paths: string[] = [];
  let cursorX = startX;

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];

    // Translate and transform Y
    const translated = glyph.commands.map((cmd) => {
      const out: PathCommand = { type: cmd.type };
      if (cmd.x !== undefined) out.x = Math.round(cmd.x + cursorX);
      if (cmd.y !== undefined) out.y = Math.round(cmd.y + yOffset);
      if (cmd.x1 !== undefined) out.x1 = Math.round(cmd.x1 + cursorX);
      if (cmd.y1 !== undefined) out.y1 = Math.round(cmd.y1 + yOffset);
      if (cmd.x2 !== undefined) out.x2 = Math.round(cmd.x2 + cursorX);
      if (cmd.y2 !== undefined) out.y2 = Math.round(cmd.y2 + yOffset);
      return out;
    });

    paths.push(commandsToSVG(translated));

    cursorX += glyph.advanceWidth;
    if (i < glyphs.length - 1) {
      const pair = `${glyph.char}-${glyphs[i + 1].char}`;
      cursorX += kerning[pair] || 0;
    }
  }

  return { paths };
}

function generateSVG(data: {
  viewBox: string;
  primaryPaths: string[];
  secondaryPaths: string[];
}): string {
  const primaryPathEls = data.primaryPaths
    .map((d) => `    <path d="${d}"/>`)
    .join("\n");
  const secondaryPathEls = data.secondaryPaths
    .map((d) => `    <path d="${d}"/>`)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}" fill="none">
  <g fill="#F5F5F5">
${primaryPathEls}
  </g>
  <g fill="#C4C4C4">
${secondaryPathEls}
  </g>
</svg>
`;
}

function generateLockupSVG(data: {
  viewBox: string;
  width: number;
  height: number;
  primaryPaths: string[];
  secondaryPaths: string[];
}): string {
  // Lockup: TC monogram + wordmark stacked vertically
  const symbolSize = 108;
  const gap = 32;
  const totalHeight = symbolSize + gap + data.height;
  const totalWidth = Math.max(data.width, symbolSize);
  const symbolX = (totalWidth - symbolSize) / 2;
  const wordmarkX = (totalWidth - data.width) / 2;
  const wordmarkY = symbolSize + gap;

  const [, , vbW, vbH] = data.viewBox.split(" ").map(Number);

  const primaryPathEls = data.primaryPaths
    .map((d) => `      <path d="${d}"/>`)
    .join("\n");
  const secondaryPathEls = data.secondaryPaths
    .map((d) => `      <path d="${d}"/>`)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" fill="none">
  <!-- Symbol -->
  <g transform="translate(${symbolX}, 0)">
    <rect width="${symbolSize}" height="${symbolSize}" rx="18" fill="#0B0B0B" stroke="#242424" stroke-width="1"/>
    <path d="M16 16H92V26H26V82H92V92H16Z M38 16H92V26H72V92H60V26H38Z" transform="scale(${symbolSize / 108})" fill="#F5F5F5" stroke="#F5F5F5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Wordmark -->
  <g transform="translate(${wordmarkX}, ${wordmarkY})">
    <svg viewBox="${data.viewBox}" width="${data.width}" height="${data.height}">
      <g fill="#F5F5F5">
${primaryPathEls}
      </g>
      <g fill="#C4C4C4">
${secondaryPathEls}
      </g>
    </svg>
  </g>
</svg>
`;
}

function generatePreviewHTML(data: {
  viewBox: string;
  width: number;
  height: number;
  primaryPaths: string[];
  secondaryPaths: string[];
}): string {
  const sizes = [14, 18, 36, 72, 144];

  const primaryPathEls = data.primaryPaths
    .map((d) => `<path d="${d}"/>`)
    .join("");
  const secondaryPathEls = data.secondaryPaths
    .map((d) => `<path d="${d}"/>`)
    .join("");

  const svgTemplate = (height: number) => {
    const width = Math.round(
      (data.width / data.height) * height
    );
    return `<svg viewBox="${data.viewBox}" width="${width}" height="${height}" fill="none">
      <g fill="var(--text-base)">${primaryPathEls}</g>
      <g fill="var(--text-base-80)">${secondaryPathEls}</g>
    </svg>`;
  };

  const previews = sizes
    .map(
      (s) => `
    <div style="margin: 24px 0;">
      <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${s}px height</div>
      ${svgTemplate(s)}
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CHIBA TAKUMI Wordmark Preview</title>
  <style>
    :root {
      --text-base: #F5F5F5;
      --text-base-80: rgba(245, 245, 245, 0.8);
    }
    body {
      background: #050505;
      color: #F5F5F5;
      font-family: system-ui;
      padding: 48px;
    }
    h1 { font-size: 14px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; color: #888; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; }
    .section { border: 1px solid #222; border-radius: 8px; padding: 24px; }
    .section-title { font-size: 11px; color: #666; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>CHIBA TAKUMI — Logotype Preview</h1>

  <div class="section" style="margin-top: 24px;">
    <div class="section-title">Size Variants</div>
    ${previews}
  </div>

  <div class="grid">
    <div class="section">
      <div class="section-title">Dark Background</div>
      <div style="padding: 24px;">
        ${svgTemplate(48)}
      </div>
    </div>
    <div class="section" style="background: #F5F5F5;">
      <div class="section-title" style="color: #999;">Light Background</div>
      <div style="padding: 24px;">
        <svg viewBox="${data.viewBox}" width="${Math.round((data.width / data.height) * 48)}" height="48" fill="none">
          <g fill="#0A0A0A">${primaryPathEls}</g>
          <g fill="rgba(10,10,10,0.8)">${secondaryPathEls}</g>
        </svg>
      </div>
    </div>
  </div>
</body>
</html>`;
}

main();
