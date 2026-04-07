/**
 * isshin REEL Canvas 2D Primitives
 *
 * Shared types and rendering functions extracted from compositions #38, #39.
 * Eliminates FillDef, TextDef, renderFill, drawText duplication.
 */

// ============================================================
// Types
// ============================================================

export type FillDef =
  | { type: "solid"; color: string }
  | { type: "hatch"; bg: string; line: string; spacing?: number; angle?: number }
  | { type: "dots"; bg: string; dot: string; r?: number; spacing?: number }
  | { type: "grad"; stops: [number, string][]; angle?: number };

export interface TextDef {
  label: string;        // supports \n for multi-line rendering
  color: string;
  size: number;
  weight?: number;
  align?: CanvasTextAlign;
  padX?: number;
  padY?: number;
  lineHeight?: number;  // multiplier of size; default 1.3
}

// ============================================================
// Color helpers
// ============================================================

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const ct = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(ar + (br - ar) * ct)},${Math.round(ag + (bg - ag) * ct)},${Math.round(ab + (bb - ab) * ct)})`;
}

// ============================================================
// roundRect — utility for card borders
// ============================================================

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// ============================================================
// renderFill — pure, no side effects outside ctx
// ============================================================

export function renderFill(
  ctx: CanvasRenderingContext2D,
  fill: FillDef,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (w < 1 || h < 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  switch (fill.type) {
    case "solid":
      ctx.fillStyle = fill.color;
      ctx.fillRect(x, y, w, h);
      break;

    case "hatch": {
      ctx.fillStyle = fill.bg;
      ctx.fillRect(x, y, w, h);
      const sp = fill.spacing ?? 7;
      const ang = ((fill.angle ?? 45) * Math.PI) / 180;
      const cos = Math.cos(ang),
        sin = Math.sin(ang);
      const diag = Math.sqrt(w * w + h * h);
      ctx.strokeStyle = fill.line;
      ctx.lineWidth = 1.5;
      for (let d = -diag; d < diag; d += sp) {
        ctx.beginPath();
        ctx.moveTo(
          x + w / 2 + cos * d - sin * diag,
          y + h / 2 + sin * d + cos * diag
        );
        ctx.lineTo(
          x + w / 2 + cos * d + sin * diag,
          y + h / 2 + sin * d - cos * diag
        );
        ctx.stroke();
      }
      break;
    }

    case "dots": {
      const dr = fill.r ?? 2,
        sp = fill.spacing ?? 12;
      ctx.fillStyle = fill.bg;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = fill.dot;
      for (let dx = sp / 2; dx < w + sp; dx += sp)
        for (let dy = sp / 2; dy < h + sp; dy += sp) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, dr, 0, Math.PI * 2);
          ctx.fill();
        }
      break;
    }

    case "grad": {
      const a = ((fill.angle ?? 0) * Math.PI) / 180;
      const len = w / 2;
      const g = ctx.createLinearGradient(
        x + w / 2 - Math.cos(a) * len,
        y + h / 2 - Math.sin(a) * len,
        x + w / 2 + Math.cos(a) * len,
        y + h / 2 + Math.sin(a) * len
      );
      for (const [p, c] of fill.stops) g.addColorStop(p, c);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      break;
    }
  }

  ctx.restore();
}

// ============================================================
// drawText — supports \n for multi-line
// ============================================================

export function drawText(
  ctx: CanvasRenderingContext2D,
  td: TextDef,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  alpha: number,
  fontFamily: string
): void {
  if (alpha < 0.001 || !td.label) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  // Clip to block
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.clip();

  const fontSize = td.size;
  const lineHeight = td.lineHeight ?? 1.3;
  const weight = td.weight ?? 400;
  const align = td.align ?? "center";
  const padX = td.padX ?? 0;
  const padY = td.padY ?? 0;

  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = td.color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  const lines = td.label.split("\n");
  const lineCount = lines.length;
  const totalHeight = (lineCount - 1) * fontSize * lineHeight;

  if (lineCount === 1) {
    // Single line: existing behavior
    const textY =
      align === "center"
        ? by + bh / 2 + padY
        : by + bh / 2 + padY - (fontSize / 2) * (lineCount - 1);
    ctx.fillText(lines[0], bx + bw / 2 + padX, textY);
  } else {
    // Multi-line: stack from vertical center
    const startY = by + bh / 2 - totalHeight / 2 + padY;
    for (let i = 0; i < lineCount; i++) {
      const lineY = startY + i * fontSize * lineHeight;
      const textX =
        align === "center" ? bx + bw / 2 + padX : bx + padX + 10;
      ctx.fillText(lines[i], textX, lineY);
    }
  }

  ctx.restore();
}
