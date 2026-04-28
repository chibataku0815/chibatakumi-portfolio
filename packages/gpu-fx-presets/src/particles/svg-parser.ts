import type { CubicPathDef } from "./helpers";

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const CMD_RE = /([MmCcSsLlZz])/;

/** Split d attribute into [command, ...numbers] groups */
function tokenize(d: string): { cmd: string; args: number[] }[] {
  // Insert separator before every command letter so we can split cleanly
  const parts = d
    .replace(/([MmCcSsLlZz])/g, "\x00$1")
    .split("\x00")
    .filter(Boolean);

  const groups: { cmd: string; args: number[] }[] = [];

  for (const part of parts) {
    const cmd = part[0];
    const rest = part.slice(1).trim();
    const args = rest.length === 0 ? [] : parseNumbers(rest);
    groups.push({ cmd, args });
  }

  return groups;
}

/**
 * Parse a raw number string that uses spaces, commas, or implicit separators
 * (e.g. "10-5 20-3" -> [10, -5, 20, -3]).
 */
function parseNumbers(s: string): number[] {
  const nums: number[] = [];
  // Match: optional sign, digits with optional decimal, or decimal without leading digit
  const re = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    nums.push(Number(m[0]));
  }
  return nums;
}

// ---------------------------------------------------------------------------
// Core parser (no normalization)
// ---------------------------------------------------------------------------

interface RawPoint {
  x: number;
  y: number;
}

interface RawCubic {
  p0: RawPoint;
  p1: RawPoint;
  p2: RawPoint;
  p3: RawPoint;
}

function lineToCubic(a: RawPoint, b: RawPoint): RawCubic {
  return {
    p0: a,
    p1: { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
    p2: { x: a.x + (2 * (b.x - a.x)) / 3, y: a.y + (2 * (b.y - a.y)) / 3 },
    p3: b,
  };
}

function parseRaw(d: string): RawCubic[] {
  const groups = tokenize(d);
  if (groups.length === 0) return [];

  const cubics: RawCubic[] = [];
  let cur: RawPoint = { x: 0, y: 0 };
  let moveStart: RawPoint = { x: 0, y: 0 };
  let lastControl: RawPoint | null = null; // last C/S control point (p2)
  let prevCmd = "";

  for (const { cmd, args } of groups) {
    switch (cmd) {
      // -- MoveTo --
      case "M": {
        if (args.length >= 2) {
          cur = { x: args[0], y: args[1] };
          moveStart = { ...cur };
        }
        // Implicit lineTo for subsequent pairs
        for (let i = 2; i + 1 < args.length; i += 2) {
          const next: RawPoint = { x: args[i], y: args[i + 1] };
          cubics.push(lineToCubic(cur, next));
          cur = next;
        }
        lastControl = null;
        break;
      }
      case "m": {
        if (args.length >= 2) {
          cur = { x: cur.x + args[0], y: cur.y + args[1] };
          moveStart = { ...cur };
        }
        for (let i = 2; i + 1 < args.length; i += 2) {
          const next: RawPoint = { x: cur.x + args[i], y: cur.y + args[i + 1] };
          cubics.push(lineToCubic(cur, next));
          cur = next;
        }
        lastControl = null;
        break;
      }

      // -- Cubic Bezier --
      case "C": {
        for (let i = 0; i + 5 < args.length; i += 6) {
          const c: RawCubic = {
            p0: { ...cur },
            p1: { x: args[i], y: args[i + 1] },
            p2: { x: args[i + 2], y: args[i + 3] },
            p3: { x: args[i + 4], y: args[i + 5] },
          };
          cubics.push(c);
          lastControl = c.p2;
          cur = c.p3;
        }
        break;
      }
      case "c": {
        for (let i = 0; i + 5 < args.length; i += 6) {
          const c: RawCubic = {
            p0: { ...cur },
            p1: { x: cur.x + args[i], y: cur.y + args[i + 1] },
            p2: { x: cur.x + args[i + 2], y: cur.y + args[i + 3] },
            p3: { x: cur.x + args[i + 4], y: cur.y + args[i + 5] },
          };
          cubics.push(c);
          lastControl = c.p2;
          cur = c.p3;
        }
        break;
      }

      // -- Smooth Cubic --
      case "S": {
        for (let i = 0; i + 3 < args.length; i += 4) {
          const reflected =
            lastControl && (prevCmd === "C" || prevCmd === "c" || prevCmd === "S" || prevCmd === "s")
              ? { x: 2 * cur.x - lastControl.x, y: 2 * cur.y - lastControl.y }
              : { ...cur };
          const c: RawCubic = {
            p0: { ...cur },
            p1: reflected,
            p2: { x: args[i], y: args[i + 1] },
            p3: { x: args[i + 2], y: args[i + 3] },
          };
          cubics.push(c);
          lastControl = c.p2;
          cur = c.p3;
        }
        break;
      }
      case "s": {
        for (let i = 0; i + 3 < args.length; i += 4) {
          const reflected =
            lastControl && (prevCmd === "C" || prevCmd === "c" || prevCmd === "S" || prevCmd === "s")
              ? { x: 2 * cur.x - lastControl.x, y: 2 * cur.y - lastControl.y }
              : { ...cur };
          const c: RawCubic = {
            p0: { ...cur },
            p1: reflected,
            p2: { x: cur.x + args[i], y: cur.y + args[i + 1] },
            p3: { x: cur.x + args[i + 2], y: cur.y + args[i + 3] },
          };
          cubics.push(c);
          lastControl = c.p2;
          cur = c.p3;
        }
        break;
      }

      // -- LineTo --
      case "L": {
        for (let i = 0; i + 1 < args.length; i += 2) {
          const next: RawPoint = { x: args[i], y: args[i + 1] };
          cubics.push(lineToCubic(cur, next));
          cur = next;
        }
        lastControl = null;
        break;
      }
      case "l": {
        for (let i = 0; i + 1 < args.length; i += 2) {
          const next: RawPoint = { x: cur.x + args[i], y: cur.y + args[i + 1] };
          cubics.push(lineToCubic(cur, next));
          cur = next;
        }
        lastControl = null;
        break;
      }

      // -- ClosePath --
      case "Z":
      case "z": {
        if (cur.x !== moveStart.x || cur.y !== moveStart.y) {
          cubics.push(lineToCubic(cur, moveStart));
          cur = { ...moveStart };
        }
        lastControl = null;
        break;
      }
    }

    prevCmd = cmd;
  }

  return cubics;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalize(
  cubics: RawCubic[],
  viewBox?: { width: number; height: number },
): CubicPathDef[] {
  if (cubics.length === 0) return [];

  let w: number;
  let h: number;
  let ox: number;
  let oy: number;

  if (viewBox) {
    w = viewBox.width;
    h = viewBox.height;
    ox = 0;
    oy = 0;
  } else {
    // Compute bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const c of cubics) {
      for (const p of [c.p0, c.p1, c.p2, c.p3]) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }

    ox = minX;
    oy = minY;
    w = maxX - minX || 1; // avoid division by zero
    h = maxY - minY || 1;
  }

  const n = (p: RawPoint): readonly [number, number] =>
    [(p.x - ox) / w, (p.y - oy) / h] as const;

  return cubics.map(
    (c): CubicPathDef => ({
      p0: n(c.p0),
      p1: n(c.p1),
      p2: n(c.p2),
      p3: n(c.p3),
    }),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Parse SVG path `d` attribute into cubic Bezier segments */
export function parseSvgPath(
  d: string,
  viewBox?: { width: number; height: number },
): CubicPathDef[] {
  if (!d || !d.trim()) return [];
  const raw = parseRaw(d);
  return normalize(raw, viewBox);
}

/** Parse full SVG string, extracting all <path> elements */
export function parseSvgFile(
  svg: string,
): { paths: CubicPathDef[][]; viewBox: { width: number; height: number } } {
  // Extract viewBox
  let viewBox = { width: 100, height: 100 }; // fallback
  const vbMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (vbMatch) {
    const parts = parseNumbers(vbMatch[1]);
    if (parts.length >= 4) {
      viewBox = { width: parts[2], height: parts[3] };
    }
  }

  // Extract all <path d="..."> occurrences
  const paths: CubicPathDef[][] = [];
  const pathRe = /<path[^>]*\bd\s*=\s*["']([^"']+)["'][^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(svg)) !== null) {
    const segments = parseSvgPath(m[1], viewBox);
    if (segments.length > 0) {
      paths.push(segments);
    }
  }

  return { paths, viewBox };
}
