/**
 * CalibrationDebug — Known-coordinate markers for pipeline verification.
 *
 * Draws markers at mathematically exact positions so that
 * the ffmpeg crop / CSS crop pipeline can be validated
 * before any coordinate measurement begins.
 */
import React, { useCallback } from "react";
import { CanvasScene, W, H } from "../../lib/canvas-primitives";

export function drawCalibration(
  ctx: CanvasRenderingContext2D,
  _frame: number,
): void {
  // 1. White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // 2. Grid lines at 480px intervals
  ctx.strokeStyle = "#CCCCCC";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 480; x < W; x += 480) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 480; y < H; y += 480) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  // 3. Center crosshair — red, 2px, 40px arms
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(920, 540);
  ctx.lineTo(1000, 540);
  ctx.moveTo(960, 500);
  ctx.lineTo(960, 580);
  ctx.stroke();

  // 4. Corner boxes — blue, 20×20, centered on coordinate
  ctx.fillStyle = "#0000FF";
  ctx.fillRect(90, 90, 20, 20); // center = (100, 100)
  ctx.fillRect(1810, 970, 20, 20); // center = (1820, 980)

  // 5. Additional corner markers — green, top-right and bottom-left
  ctx.fillStyle = "#00AA00";
  ctx.fillRect(1810, 90, 20, 20); // center = (1820, 100)
  ctx.fillRect(90, 970, 20, 20); // center = (100, 980)

  // 6. Canvas boundary — red 1px outline
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // 7. Coordinate labels
  ctx.fillStyle = "#000000";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("(960,540)", 1005, 530);
  ctx.fillText("(100,100)", 115, 95);
  ctx.fillText("(1820,980)", 1700, 960);
  ctx.fillText("(1820,100)", 1700, 95);
  ctx.fillText("(100,980)", 115, 960);

  // 8. Canvas size label
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Canvas: ${W}x${H}`, W / 2, 20);
}

export const CalibrationDebug: React.FC = () => {
  const stableDraw = useCallback(drawCalibration, []);
  return <CanvasScene draw={stableDraw} />;
};
