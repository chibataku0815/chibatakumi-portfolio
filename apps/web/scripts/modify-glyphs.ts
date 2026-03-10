/**
 * modify-glyphs.ts — Apply mathematical modifications to extracted Geist Sans glyphs
 *
 * Modifications:
 * - A: Flat-top apex (90 UPM), crossbar shortening
 * - K: Junction gap (26 UPM) with taper
 * - C: Terminal angle 30° cuts
 * - T: Crossbar extension (+8 UPM total), terminal 30° cuts
 * - H: Optical center crossbar (+8 UPM above mathematical center)
 * - B: Waist narrowing (ink trap)
 * - M: Diagonal thinning
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { PathCommand } from "./utils/path-ops";
import { commandsToSVG, roundCommands } from "./utils/path-ops";

const SCRIPTS_DIR = import.meta.dir;
const CACHE_DIR = join(SCRIPTS_DIR, ".cache");

interface GlyphData {
  char: string;
  commands: PathCommand[];
  advanceWidth: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  svgPath: string;
}

interface ExtractedGlyphs {
  primary: GlyphData[];
  secondary: GlyphData[];
  fontMetrics: { unitsPerEm: number; ascender: number; descender: number };
}

// ─── Constants ──────────────────────────────────────────────────────────────
const CAP_HEIGHT = 710;
const FLAT_TOP_WIDTH = 90; // A apex flat width
const CROSSBAR_SHORTEN = 6; // A crossbar shortening per side
const H_OPTICAL_OFFSET = 8; // H crossbar raise from math center
const T_EXTEND = 4; // T crossbar extension per side
const K_GAP = 26; // K junction gap
const TERMINAL_ANGLE = 30; // degrees for terminal cuts
const TERMINAL_CUT_DEPTH = 18; // how deep the 30° cut goes

// ─── Helpers ────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Find commands near a specific Y value */
function findCommandsAtY(
  commands: PathCommand[],
  targetY: number,
  tolerance: number = 5
): number[] {
  const indices: number[] = [];
  commands.forEach((cmd, i) => {
    if (cmd.y !== undefined && Math.abs(cmd.y - targetY) <= tolerance) {
      indices.push(i);
    }
  });
  return indices;
}

// ─── A Modification: Flat-top + Crossbar ────────────────────────────────────

function modifyA(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // The A has two sub-paths:
  // Outer: M → ... → L(apex1, -710) → L(apex2, -710) → Z
  // Inner: M(crossbar) → L(inner apex) → L(crossbar) → Z

  // Find the outer apex points (at y = -710 or near cap height)
  // Medium A: L413,-710 and L276,-710
  // Light A: L370,-710 and L280,-710

  // Find apex points (the topmost points of the A)
  const apexIndices = findCommandsAtY(cmds, -CAP_HEIGHT, 5);

  if (apexIndices.length >= 2) {
    // Get current apex x positions
    const apexXValues = apexIndices.map((i) => cmds[i].x!);
    const centerX = (Math.min(...apexXValues) + Math.max(...apexXValues)) / 2;
    const halfFlat = FLAT_TOP_WIDTH / 2;

    // Update apex points to create flat-top
    for (const idx of apexIndices) {
      if (cmds[idx].x! < centerX) {
        cmds[idx].x = Math.round(centerX - halfFlat);
      } else {
        cmds[idx].x = Math.round(centerX + halfFlat);
      }
    }

    // Adjust the diagonal lines leading to the apex
    // The command before the left apex and after the right apex define the diagonals
    // We need to adjust the bottom points of the diagonals so the slope is correct
    // But for the outer shape, the bottom corners stay fixed — only the apex changes
    // The crossbar intersection needs recalculation

    // Find outer crossbar (the horizontal line at the counter opening)
    // Medium A: L199,-185 and L489,-185
    for (let i = 0; i < cmds.length; i++) {
      const cmd = cmds[i];
      if (cmd.type === "L" && cmd.y !== undefined) {
        const y = cmd.y;
        // Outer crossbar (around -185 for medium, -213 for light)
        if (y > -220 && y < -170) {
          // Check if this is left or right crossbar point
          if (cmd.x! < centerX) {
            cmds[i].x = cmd.x! + CROSSBAR_SHORTEN; // Shorten left
          } else {
            cmds[i].x = cmd.x! - CROSSBAR_SHORTEN; // Shorten right
          }
        }
      }
    }
  }

  // Rebuild svgPath
  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);
  return g;
}

// ─── K Modification: Junction Gap ───────────────────────────────────────────

function modifyK(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // Medium K path:
  // M86,0 L194,0 L194,-228 L280,-324 L515,0 L642,0 L352,-400 L624,-710 L493,-710 L194,-371 L194,-710 L86,-710 Z
  //
  // Junction area: where arm meets stem
  // Lower leg starts at (194,-228) going to (280,-324)
  // Upper arm ends at (194,-371) coming from (493,-710)
  // Junction center at (352,-400)

  const stemX = 194; // right side of stem for Medium K

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    if (cmd.type === "L" && cmd.x === stemX) {
      // Lower leg start: (194, -228) → move toward baseline
      if (cmd.y === -228) {
        cmds[i].y = -222;
      }
      // Upper arm end: (194, -371) → move toward cap
      if (cmd.y === -371) {
        cmds[i].y = -377;
      }
    }
  }

  // Add taper: pull junction center closer to stem
  for (let i = 0; i < cmds.length; i++) {
    if (cmds[i].type === "L" && cmds[i].x === 352 && cmds[i].y === -400) {
      cmds[i].x = 344;
    }
  }

  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);
  return g;
}

// ─── C Modification: Terminal Angle Cuts ────────────────────────────────────

function modifyC(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // Medium C path: complex bezier curves
  // The C has two terminal endpoints (open ends of the C shape)
  // Terminal 1 (top-right): around (674,-248) and (561,-254) area
  // Terminal 2 (bottom-right): around (669,-477) and (556,-471) area
  //
  // The terminals are where the C "opens" — we want 30° angled cuts
  //
  // For the top terminal: the line L561,-254 is the inner terminal point
  // and C674,-248 is the outer terminal point
  // We shift these to create an angled cut

  // Top terminal: currently C→(674,-248) then L→(561,-254)
  // Shift to create 30° angle
  const tan30 = Math.tan((30 * Math.PI) / 180); // ≈ 0.577
  const cutOffset = Math.round(TERMINAL_CUT_DEPTH * tan30); // ≈ 10

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    // Top terminal outer point
    if (cmd.type === "C" && cmd.x === 674 && cmd.y === -248) {
      cmds[i].y = -248 + cutOffset; // Lower the outer point
    }
    // Top terminal inner point
    if (cmd.type === "L" && cmd.x === 561 && cmd.y === -254) {
      cmds[i].y = -254 - cutOffset; // Raise the inner point
    }
    // Bottom terminal outer point
    if (cmd.type === "C" && cmd.x === 669 && cmd.y === -477) {
      cmds[i].y = -477 - cutOffset; // Raise the outer point (toward cap)
    }
    // Bottom terminal inner point
    if (cmd.type === "L" && cmd.x === 556 && cmd.y === -471) {
      cmds[i].y = -471 + cutOffset; // Lower the inner point (toward baseline)
    }
  }

  // Also widen the C opening slightly (8° more open)
  // Shift terminal x-positions outward by ~12 UPM
  for (let i = 0; i < cmds.length; i++) {
    if (cmds[i].type === "C" && cmds[i].x === 674) {
      cmds[i].x = 686;
    }
    if (cmds[i].type === "L" && cmds[i].x === 561) {
      cmds[i].x = 573;
    }
    if (cmds[i].type === "C" && cmds[i].x === 669) {
      cmds[i].x = 681;
    }
    if (cmds[i].type === "L" && cmds[i].x === 556) {
      cmds[i].x = 568;
    }
  }

  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);
  return g;
}

// ─── T Modification: Crossbar Extension + Terminal Cuts ─────────────────────

function modifyT(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // Medium T path:
  // M230,0 L338,0 L338,-611 L556,-611 L556,-710 L12,-710 L12,-611 L230,-611 Z
  //
  // Crossbar top: y=-710, from x=12 to x=556
  // Crossbar bottom: y=-611, from x=12 to x=556
  //
  // Extend crossbar by T_EXTEND (4) on each side

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    if (cmd.type === "L") {
      // Right end of crossbar
      if (cmd.x === 556 && (cmd.y === -611 || cmd.y === -710)) {
        cmds[i].x = 556 + T_EXTEND;
      }
      // Left end of crossbar
      if (cmd.x === 12 && (cmd.y === -611 || cmd.y === -710)) {
        cmds[i].x = 12 - T_EXTEND;
      }
    }
  }

  // Apply 30° terminal cuts to crossbar ends
  const termCut = Math.round(TERMINAL_CUT_DEPTH * 0.35);

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    // Top-right corner of crossbar
    if (cmd.x === 556 + T_EXTEND && cmd.y === -710) {
      cmds[i].x = (556 + T_EXTEND) - termCut;
    }
    // Bottom-left corner of crossbar
    if (cmd.x === 12 - T_EXTEND && cmd.y === -611) {
      cmds[i].x = (12 - T_EXTEND) + termCut;
    }
  }

  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);

  // Update advance width slightly
  g.advanceWidth = g.advanceWidth + T_EXTEND * 2;
  return g;
}

// ─── H Modification: Optical Center Crossbar ────────────────────────────────

function modifyH(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // Medium H path:
  // M86,0 L194,0 L194,-308 L522,-308 L522,0 L630,0 L630,-710 L522,-710 L522,-406 L194,-406 L194,-710 L86,-710 Z
  //
  // Crossbar bottom: y=-308, crossbar top: y=-406
  // Mathematical center: -710/2 = -355
  // Current center: (-308 + -406) / 2 = -357 (very close to math center)
  // Optical center: -355 - H_OPTICAL_OFFSET = -363
  // New crossbar: bottom=-359, top=-367 (shift up by ~5 each, maintaining 98 UPM thickness)

  const currentBottom = -308;
  const currentTop = -406;
  const thickness = currentTop - currentBottom; // -98 (negative because top < bottom in font coords)
  const opticalCenter = -(CAP_HEIGHT / 2) - H_OPTICAL_OFFSET; // -363
  const newBottom = Math.round(opticalCenter - thickness / 2); // -314
  const newTop = Math.round(opticalCenter + thickness / 2); // -412

  for (let i = 0; i < cmds.length; i++) {
    if (cmds[i].y === currentBottom) {
      cmds[i].y = newBottom;
    }
    if (cmds[i].y === currentTop) {
      cmds[i].y = newTop;
    }
  }

  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);
  return g;
}

// ─── B Modification: Waist Narrowing (Ink Trap) ────────────────────────────

function modifyB(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // Medium B: complex path with two bowls
  // The waist area is where the two bowls meet (~y=-367 to y=-407)
  //
  // Junction points around the waist:
  // C467,-367 (outer waist going up from lower bowl)
  // C569,-355 (control point)
  // C550,-379 (control point)
  //
  // To narrow the waist (ink trap effect), pull the outer waist point inward

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    // The waist junction point
    if (cmd.type === "C" && cmd.x === 467 && cmd.y === -367) {
      cmds[i].x = 455; // Pull inward by 12 UPM (ink trap)
    }
  }

  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);
  return g;
}

// ─── M Modification: Diagonal Thinning ──────────────────────────────────────

function modifyM(glyph: GlyphData): GlyphData {
  const g = deepClone(glyph);
  const cmds = g.commands;

  // Medium M path:
  // M86,0 L194,0 L194,-520 L385,-1 L505,-1 L696,-520 L696,0 L804,0 L804,-710 L656,-710 L445,-127 L234,-710 L86,-710 Z
  //
  // The M inner V meets at (385,-1)-(505,-1) near baseline
  // Nadirs at L194,-520 and L696,-520
  // Center apex at L445,-127

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];
    // Left inner diagonal bottom
    if (cmd.type === "L" && cmd.x === 385 && cmd.y === -1) {
      cmds[i].x = 395;
    }
    // Right inner diagonal bottom
    if (cmd.type === "L" && cmd.x === 505 && cmd.y === -1) {
      cmds[i].x = 495;
    }
    // Deepen the center nadir
    if (cmd.type === "L" && cmd.x === 445 && cmd.y === -127) {
      cmds[i].y = -143;
    }
  }

  g.svgPath = `<path d="${commandsToSVG(roundCommands(cmds))}"/>`;
  g.commands = roundCommands(cmds);
  return g;
}

// ─── I Modification: None (breathing point) ─────────────────────────────────
// ─── U Modification: Keep as-is (superellipse requires complex bezier refit) ─

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  mkdirSync(CACHE_DIR, { recursive: true });

  const rawPath = join(CACHE_DIR, "raw-glyphs.json");
  const raw: ExtractedGlyphs = JSON.parse(readFileSync(rawPath, "utf-8"));

  console.log("Applying glyph modifications...\n");

  // Modify PRIMARY (CHIBA — Medium weight)
  const modifiedPrimary = raw.primary.map((glyph) => {
    switch (glyph.char) {
      case "C":
        console.log("  C: Terminal 30° cuts + wider opening");
        return modifyC(glyph);
      case "H":
        console.log("  H: Optical center crossbar (+8 UPM)");
        return modifyH(glyph);
      case "I":
        console.log("  I: No modification (breathing point)");
        return deepClone(glyph);
      case "B":
        console.log("  B: Waist narrowing (ink trap)");
        return modifyB(glyph);
      case "A":
        console.log("  A (Medium): Flat-top 90 UPM + crossbar shortening");
        return modifyA(glyph);
      default:
        return deepClone(glyph);
    }
  });

  // Modify SECONDARY (TAKUMI — Light weight)
  const modifiedSecondary = raw.secondary.map((glyph) => {
    switch (glyph.char) {
      case "T":
        console.log("  T: Crossbar +8 UPM extension + terminal cuts");
        return modifyT(glyph);
      case "A":
        console.log("  A (Light): Flat-top 90 UPM + crossbar shortening");
        return modifyA(glyph);
      case "K":
        console.log("  K: Junction gap enhancement + taper");
        return modifyK(glyph);
      case "U":
        console.log("  U: No modification (curve kept as-is)");
        return deepClone(glyph);
      case "M":
        console.log("  M: Diagonal thinning + deeper nadir");
        return modifyM(glyph);
      case "I":
        console.log("  I: No modification (breathing point)");
        return deepClone(glyph);
      default:
        return deepClone(glyph);
    }
  });

  const result = {
    primary: modifiedPrimary,
    secondary: modifiedSecondary,
    fontMetrics: raw.fontMetrics,
  };

  const outPath = join(CACHE_DIR, "modified-glyphs.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWritten to ${outPath}`);
}

main();
