/**
 * path-ops.ts — SVG path manipulation utilities for glyph modification
 */

export interface PathCommand {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

/** Round all numeric values in path commands to integers */
export function roundCommands(commands: PathCommand[]): PathCommand[] {
  return commands.map((cmd) => {
    const rounded: PathCommand = { type: cmd.type };
    if (cmd.x !== undefined) rounded.x = Math.round(cmd.x);
    if (cmd.y !== undefined) rounded.y = Math.round(cmd.y);
    if (cmd.x1 !== undefined) rounded.x1 = Math.round(cmd.x1);
    if (cmd.y1 !== undefined) rounded.y1 = Math.round(cmd.y1);
    if (cmd.x2 !== undefined) rounded.x2 = Math.round(cmd.x2);
    if (cmd.y2 !== undefined) rounded.y2 = Math.round(cmd.y2);
    return rounded;
  });
}

/** Convert path commands to SVG d string */
export function commandsToSVG(commands: PathCommand[]): string {
  return commands
    .map((cmd) => {
      switch (cmd.type) {
        case "M":
        case "L":
          return `${cmd.type}${cmd.x} ${cmd.y}`;
        case "C":
          return `C${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
        case "Q":
          return `Q${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
        case "Z":
          return "Z";
        default:
          return "";
      }
    })
    .join("");
}

/** Translate all commands by (dx, dy) */
export function translateCommands(
  commands: PathCommand[],
  dx: number,
  dy: number
): PathCommand[] {
  return commands.map((cmd) => {
    const out: PathCommand = { type: cmd.type };
    if (cmd.x !== undefined) out.x = cmd.x + dx;
    if (cmd.y !== undefined) out.y = cmd.y + dy;
    if (cmd.x1 !== undefined) out.x1 = cmd.x1 + dx;
    if (cmd.y1 !== undefined) out.y1 = cmd.y1 + dy;
    if (cmd.x2 !== undefined) out.x2 = cmd.x2 + dx;
    if (cmd.y2 !== undefined) out.y2 = cmd.y2 + dy;
    return out;
  });
}

/** Scale all commands uniformly */
export function scaleCommands(
  commands: PathCommand[],
  sx: number,
  sy: number
): PathCommand[] {
  return commands.map((cmd) => {
    const out: PathCommand = { type: cmd.type };
    if (cmd.x !== undefined) out.x = cmd.x * sx;
    if (cmd.y !== undefined) out.y = cmd.y * sy;
    if (cmd.x1 !== undefined) out.x1 = cmd.x1 * sx;
    if (cmd.y1 !== undefined) out.y1 = cmd.y1 * sy;
    if (cmd.x2 !== undefined) out.x2 = cmd.x2 * sx;
    if (cmd.y2 !== undefined) out.y2 = cmd.y2 * sy;
    return out;
  });
}

/** Get bounding box of path commands */
export function getBounds(commands: PathCommand[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const cmd of commands) {
    for (const key of ["x", "y", "x1", "y1", "x2", "y2"] as const) {
      const val = cmd[key];
      if (val === undefined) continue;
      if (key === "x" || key === "x1" || key === "x2") {
        minX = Math.min(minX, val);
        maxX = Math.max(maxX, val);
      } else {
        minY = Math.min(minY, val);
        maxY = Math.max(maxY, val);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/** Flip Y axis (font coords y-up → SVG y-down) around capHeight */
export function flipY(
  commands: PathCommand[],
  capHeight: number
): PathCommand[] {
  return commands.map((cmd) => {
    const out: PathCommand = { type: cmd.type };
    if (cmd.x !== undefined) out.x = cmd.x;
    if (cmd.y !== undefined) out.y = capHeight - cmd.y;
    if (cmd.x1 !== undefined) out.x1 = cmd.x1;
    if (cmd.y1 !== undefined) out.y1 = capHeight - cmd.y1;
    if (cmd.x2 !== undefined) out.x2 = cmd.x2;
    if (cmd.y2 !== undefined) out.y2 = capHeight - cmd.y2;
    return out;
  });
}
