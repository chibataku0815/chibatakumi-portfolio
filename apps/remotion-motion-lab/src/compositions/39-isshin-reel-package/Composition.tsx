/**
 * Isshin Reel Package — Composition #39 (v2 rewrite)
 *
 * 15-25.5s (10.5s, 525 frames @ 50fps) of isshin REEL 2024.
 * Canvas 2D only, pixel-precision layout from reference frames.
 *
 * Visual groups:
 *   - Title: "isshin REEL 2024" (large, upper-center-left)
 *   - Warning+Caution bar: single wide dark horizontal bar
 *   - Right info cluster: text-only specs, phone, age rating
 *   - Barcode: bottom center
 *   - Grain: multiply blend overlay
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  expOut,
  progress,
  sr,
  lerp,
} from "../../lib/canvas-primitives";
import { cubicOut, expoOut } from "../../lib/canvas-easing";
import { lerpColor } from "../../lib/isshin-primitives";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
import { config } from "./config";

const { fontFamily } = loadFont();

// ============================================================
// Dispersal helper: returns {alpha, dx, dy, scale} for exit animation
// ============================================================
interface DispersalState {
  alpha: number;
  dx: number;
  dy: number;
  scale: number;
}

function getDispersal(
  frame: number,
  staggerIndex: number,
  dirX: number,
  dirY: number
): DispersalState {
  const start = config.dispersalStart + staggerIndex * config.dispersalStagger;
  const p = progress(frame, start, config.dispersalDuration, cubicOut);
  if (p <= 0) return { alpha: 1, dx: 0, dy: 0, scale: 1 };
  const fly = config.dispersalFlyDistance;
  return {
    alpha: Math.max(0, 1 - p * 1.3), // fade out faster than movement
    dx: dirX * fly * p,
    dy: dirY * fly * p,
    scale: lerp(1, config.dispersalScale, p),
  };
}

// ============================================================
// Background
// ============================================================
function drawBg(ctx: CanvasRenderingContext2D, frame: number): void {
  const tIn = progress(frame, config.bgMorphStart, config.bgMorphDuration, expOut);
  const tOut = progress(frame, config.bgExitStart, config.bgExitDuration, expOut);
  // Morph: teal → lime (entry), then lime → teal (exit)
  const limeAmount = Math.min(tIn, 1 - tOut);
  ctx.fillStyle = lerpColor(config.bgTeal, config.bgLime, limeAmount);
  ctx.fillRect(0, 0, W, H);
}

// ============================================================
// Title: "isshin REEL 2024"
// ============================================================
function drawTitle(ctx: CanvasRenderingContext2D, frame: number): void {
  const { title } = config;
  const entry = progress(frame, title.entryStart, title.entryDuration, cubicOut);
  if (entry <= 0) return;

  const disp = getDispersal(frame, 0, 0, -1); // fly up
  if (disp.alpha < 0.001) return;

  const alpha = entry * disp.alpha;
  const offsetY = lerp(-250, 0, entry) + disp.dy;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Apply scale from dispersal (scale from center of title block)
  const cx = title.x + 200;
  const cy = title.y + 230 + offsetY;
  ctx.translate(cx + disp.dx, cy);
  ctx.scale(disp.scale, disp.scale);
  ctx.translate(-cx, -cy);

  const lines = ["isshin", "REEL", "2024"];
  ctx.font = `${title.weight} ${title.fontSize}px ${fontFamily}`;
  ctx.fillStyle = title.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let i = 0; i < lines.length; i++) {
    const ly = title.y + offsetY + i * title.fontSize * title.lineHeight;
    ctx.fillText(lines[i], title.x, ly);
  }

  ctx.restore();
}

// ============================================================
// Warning + Caution bar (merged, custom draw)
// ============================================================
function drawWarningBar(ctx: CanvasRenderingContext2D, frame: number): void {
  const { warningBar: wb } = config;
  const entry = progress(frame, wb.entryStart, wb.entryDuration, cubicOut);
  if (entry <= 0) return;

  const disp = getDispersal(frame, 1, -1, 0); // fly left
  if (disp.alpha < 0.001) return;

  const alpha = entry * disp.alpha;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Apply dispersal transform
  const cx = wb.x + wb.w / 2 + disp.dx;
  const cy = wb.y + wb.h / 2 + disp.dy;
  ctx.translate(cx, cy);
  ctx.scale(disp.scale, disp.scale);
  ctx.translate(-cx, -cy);

  const x = wb.x + disp.dx;
  const y = wb.y + disp.dy;
  const { w, h } = wb;
  const divY = y + h * wb.dividerY; // y-position of divider

  // ── Top section: solid black + warning text ──
  ctx.fillStyle = wb.bgColor;
  ctx.fillRect(x, y, w, divY - y);

  // Warning header
  ctx.fillStyle = wb.textColor;
  ctx.font = `700 ${wb.headerSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("⚠ 警告（けいこく）", x + w / 2, y + 14);

  // Warning body text
  ctx.font = `400 ${wb.bodySize}px ${fontFamily}`;
  const bodyY = y + 46;
  ctx.fillText(
    "必ずお読みください。お前様の場合は、お殿様の方がお読みください。",
    x + w / 2,
    bodyY
  );
  ctx.font = `400 ${wb.bodySize - 1}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.fillText(
    "●猥褻な映像があります。場嶋の危険がありますので、100歳未満のお前様には絶対に見せないでください。",
    x + 12,
    bodyY + 22
  );

  // ── Divider line ──
  ctx.strokeStyle = wb.textColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, divY);
  ctx.lineTo(x + w, divY);
  ctx.stroke();

  // ── Bottom section: black + hatch overlay + caution text ──
  const bottomH = y + h - divY;
  ctx.fillStyle = wb.bgColor;
  ctx.fillRect(x, divY, w, bottomH);

  // Hatch pattern overlay (subtle diagonal lines)
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, divY, w, bottomH);
  ctx.clip();
  ctx.strokeStyle = "rgba(100,100,100,0.25)";
  ctx.lineWidth = 0.8;
  const spacing = wb.hatchSpacing;
  const diagLen = w + bottomH;
  for (let d = -diagLen; d < diagLen; d += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + d, divY);
    ctx.lineTo(x + d + bottomH, divY + bottomH);
    ctx.stroke();
  }
  ctx.restore();

  // Caution header
  ctx.fillStyle = wb.textColor;
  ctx.font = `700 ${wb.headerSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillText("⚠ 注意（ちゅうい）", x + w / 2, divY + 16);

  // Caution body text
  ctx.font = `400 ${wb.bodySize - 1}px ${fontFamily}`;
  ctx.textAlign = "left";
  const cautionBodyY = divY + 46;
  ctx.fillText(
    "●映像を相談している方は肺は力なりだよ。お茶だからあいみょん。",
    x + 12,
    cautionBodyY
  );
  ctx.fillText(
    "●モバイルデータの再生に係る通信量に関しましてマリオカートは対象外です。",
    x + 12,
    cautionBodyY + 18
  );

  // Small recycling mark at bottom right
  ctx.font = `400 14px ${fontFamily}`;
  ctx.textAlign = "right";
  ctx.fillText("♻", x + w - 10, y + h - 16);

  ctx.restore();
}

// ============================================================
// Right info cluster (text only on lime background)
// ============================================================
function drawRightInfo(ctx: CanvasRenderingContext2D, frame: number): void {
  const { rightInfo: ri } = config;
  const entry = progress(frame, ri.entryStart, ri.entryDuration, cubicOut);
  if (entry <= 0) return;

  const disp = getDispersal(frame, 2, 1, 0); // fly right
  if (disp.alpha < 0.001) return;

  const alpha = entry * disp.alpha;
  const offsetX = lerp(200, 0, entry) + disp.dx;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Apply dispersal scale
  if (disp.scale !== 1) {
    const cx = ri.x + ri.w / 2 + offsetX;
    const cy = ri.y + ri.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(disp.scale, disp.scale);
    ctx.translate(-cx, -cy);
  }

  ctx.fillStyle = ri.textColor;

  const baseX = ri.x + offsetX;
  let curY = ri.y;

  // ── Header: いっしん お客様相談室電話窓口 ──
  ctx.font = `400 ${ri.headerSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("いっしん お客様相談窓口（相談室）", baseX, curY);
  curY += 24;

  // ── Material specs ──
  ctx.font = `400 ${ri.bodySize}px ${fontFamily}`;
  ctx.fillText("材質表示", baseX, curY);
  curY += 18;
  ctx.fillText("品名　isshinパッケージ", baseX + 10, curY);
  curY += 16;
  ctx.fillText("PP, ABS, 紙", baseX + 10, curY);
  curY += 24;

  // ── Phone/contact ──
  ctx.font = `700 ${ri.headerSize}px ${fontFamily}`;
  ctx.fillText("☎ Y803-4546", baseX, curY);
  curY += 22;

  ctx.font = `400 ${ri.bodySize}px ${fontFamily}`;
  ctx.fillText("原素Type-Cの規格MDT回路には（税抜）", baseX, curY);
  curY += 16;
  ctx.fillText("対応しておりません", baseX, curY);
  curY += 24;

  // ── Hotline ──
  ctx.font = `700 ${ri.headerSize}px ${fontFamily}`;
  ctx.fillText("ナビダイヤル 00-0000-0000", baseX, curY);
  curY += 28;

  // ── Age rating ──
  ctx.font = `400 ${ri.bodySize}px ${fontFamily}`;
  ctx.fillText("対象年齢 300歳以上", baseX, curY);
  curY += 24;

  // ── Small product marks ──
  ctx.font = `400 10px ${fontFamily}`;
  ctx.fillText("品名 / PR", baseX, curY);
  curY += 14;
  ctx.fillText("合名 いっしん", baseX, curY);

  ctx.restore();
}

// ============================================================
// Barcode (custom draw)
// ============================================================
function drawBarcode(ctx: CanvasRenderingContext2D, frame: number): void {
  const { barcode: bc } = config;
  const entry = progress(frame, bc.entryStart, bc.entryDuration, cubicOut);
  if (entry <= 0) return;

  const disp = getDispersal(frame, 3, 0, 1); // fly down
  if (disp.alpha < 0.001) return;

  const alpha = entry * disp.alpha;
  const offsetY = lerp(30, 0, entry) + disp.dy;

  ctx.save();
  ctx.globalAlpha = alpha;

  const { x, y: baseY, w, h } = bc;
  const y = baseY + offsetY;

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, w, h);

  // Vertical bars
  ctx.fillStyle = "#000000";
  const barTop = y + 6;
  const barH = h - 28;
  let cursor = x + 10;
  let i = 0;

  while (cursor < x + w - 10) {
    const barW = 1 + Math.floor(sr(i * 3 + 17) * 3);
    const gap = 1 + Math.floor(sr(i * 3 + 18) * 2);
    if (sr(i * 3 + 19) > 0.3) {
      ctx.fillRect(cursor, barTop, barW, barH);
    }
    cursor += barW + gap;
    i++;
  }

  // Number text
  ctx.fillStyle = "#000000";
  ctx.font = `400 11px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("45300 123456", x + w / 2, y + h - 4);

  ctx.restore();
}

// ============================================================
// Grain (multiply-blend, block-based)
// ============================================================
function drawGrain(ctx: CanvasRenderingContext2D, frame: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = config.grainAlpha / 255;
  const gs = config.grainSize;
  for (let py = 0; py < H; py += gs) {
    for (let px = 0; px < W; px += gs) {
      ctx.fillStyle =
        sr(py * 0xffff + px + frame * 23) < 0.5 ? "#fff" : "#000";
      ctx.fillRect(px, py, gs, gs);
    }
  }
  ctx.restore();
}

// ============================================================
// Main draw
// ============================================================
export const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // 1. Background
  drawBg(ctx, frame);

  // 2. Warning bar (enters first, f60-100)
  drawWarningBar(ctx, frame);

  // 3. Title (enters at f125)
  drawTitle(ctx, frame);

  // 4. Right info cluster (enters at f140)
  drawRightInfo(ctx, frame);

  // 5. Barcode (enters at f155)
  drawBarcode(ctx, frame);

  // 6. Grain overlay
  drawGrain(ctx, frame);
};

// ============================================================
// Component
// ============================================================
export const IsshinReelPackage: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
