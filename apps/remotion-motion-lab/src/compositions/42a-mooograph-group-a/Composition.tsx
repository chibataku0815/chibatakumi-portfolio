/**
 * MOOOGRAPH Group A — Isolated composition for 4 shapes.
 *
 * Renders only Group A (5a star, 5b blue rect, 5c arch, 5d triangle)
 * on a solid #E8E6E0 background. No L0/L1 layers.
 *
 * Supports overlay mode: reference video behind canvas at adjustable opacity.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";
import { CanvasScene, W, H } from "../../lib/canvas-primitives";
import { EASINGS, type EasingFn } from "../../lib/canvas-easing";
import { roundRect } from "../../lib/isshin-primitives";
import {
  PALETTE,
  GROUP_A_SHAPES,
  IMAGE_SOURCES,
  config,
} from "./config";
import type { ShapeDef } from "../42-mooograph-geometric/config";

// ── Image preloader (simplified for Group A) ──
function useGroupAImages(): Record<string, HTMLImageElement> | null {
  const [images, setImages] = useState<Record<
    string,
    HTMLImageElement
  > | null>(null);
  const [handle] = useState(() => delayRender("Loading Group A assets"));

  useEffect(() => {
    const entries = Object.entries(IMAGE_SOURCES);
    if (entries.length === 0) {
      setImages({});
      continueRender(handle);
      return;
    }
    const loaded: Record<string, HTMLImageElement> = {};
    let count = 0;
    for (const [key, path] of entries) {
      const img = new Image();
      img.onload = () => {
        loaded[key] = img;
        count++;
        if (count >= entries.length) {
          setImages(loaded);
          continueRender(handle);
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load ${path}`);
        count++;
        if (count >= entries.length) {
          setImages(loaded);
          continueRender(handle);
        }
      };
      img.src = staticFile(path);
    }
  }, [handle]);

  return images;
}

// ── Shape interpolation (local, uses config.enterDuration) ──
interface ShapeAnimState {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  rotation: number;
  alpha: number;
  visible: boolean;
}

function interpolateGroupAShape(
  shape: ShapeDef,
  frame: number,
): ShapeAnimState {
  const { enterFrame, exitFrame, enterEasing, exitEasing } = shape;
  const enterEnd = enterFrame + config.enterDuration;
  const exitStart = exitFrame - config.exitDuration;

  const base = {
    w: shape.w,
    h: shape.h,
    rotation: shape.rotation ?? 0,
  };

  if (frame < enterFrame || frame > exitFrame) {
    return { x: shape.x, y: shape.y, ...base, scale: 0, alpha: 0, visible: false };
  }

  const enterEase: EasingFn = EASINGS[enterEasing] ?? EASINGS.quintOut;
  const exitEase: EasingFn = EASINGS[exitEasing] ?? EASINGS.cubicIn;

  const scaleFrom = shape.scaleFrom ?? 0;
  const enterOffsetX = shape.enterOffsetX ?? 0;
  const enterOffsetY = shape.enterOffsetY ?? 0;
  const exitOffsetX = shape.exitOffsetX ?? 0;
  const exitOffsetY = shape.exitOffsetY ?? 0;
  const enterAlphaMin = shape.enterAlphaMin ?? 0;

  // Enter phase
  if (frame < enterEnd) {
    const rawT = (frame - enterFrame) / config.enterDuration;
    const t = enterEase(Math.max(0, Math.min(1, rawT)));
    return {
      x: shape.x + enterOffsetX * (1 - t),
      y: shape.y + enterOffsetY * (1 - t),
      ...base,
      scale: scaleFrom + (1 - scaleFrom) * t,
      rotation: base.rotation * t,
      alpha: Math.max(enterAlphaMin, t),
      visible: true,
    };
  }

  // Exit phase
  if (frame >= exitStart) {
    const rawT = (frame - exitStart) / config.exitDuration;
    const t = exitEase(Math.max(0, Math.min(1, rawT)));
    return {
      x: shape.x + exitOffsetX * t,
      y: shape.y + exitOffsetY * t,
      ...base,
      scale: 1 - (1 - scaleFrom) * t,
      rotation: base.rotation * (1 - t),
      alpha: Math.max(enterAlphaMin, 1 - t),
      visible: true,
    };
  }

  // Hold phase
  return { x: shape.x, y: shape.y, ...base, scale: 1, alpha: 1, visible: true };
}

// ── Shape drawing (reuses patterns from L5-geometric-shapes.ts) ──

function drawStar4(ctx: CanvasRenderingContext2D, outerR: number): void {
  const innerR = outerR * 0.35;
  const points = 4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawArch(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const archRadius = w / 2;
  ctx.beginPath();
  ctx.arc(w / 2, archRadius, archRadius, Math.PI, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
}

function drawGroupAShapes(
  ctx: CanvasRenderingContext2D,
  frame: number,
  images: Record<string, HTMLImageElement> | null,
): void {
  for (const shape of GROUP_A_SHAPES) {
    const state = interpolateGroupAShape(shape, frame);
    if (!state.visible || state.alpha < 0.001) continue;

    ctx.save();
    ctx.globalAlpha = state.alpha;

    // Transform: translate to position center, apply scale, then offset to top-left
    const cx = state.x + state.w / 2;
    const cy = state.y + state.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(state.scale, state.scale);
    if (state.rotation) ctx.rotate(state.rotation);
    ctx.translate(-state.w / 2, -state.h / 2);

    switch (shape.type) {
      case "image": {
        const img = images?.[shape.imageKey ?? ""];
        if (img) {
          ctx.drawImage(img, 0, 0, state.w, state.h);
        } else {
          // Placeholder
          ctx.fillStyle = shape.color;
          ctx.globalAlpha = state.alpha * 0.3;
          ctx.fillRect(0, 0, state.w, state.h);
          ctx.strokeStyle = "#FF0000";
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, state.w, state.h);
        }
        break;
      }
      case "star": {
        ctx.fillStyle = shape.color;
        ctx.translate(state.w / 2, state.h / 2);
        drawStar4(ctx, Math.min(state.w, state.h) / 2);
        ctx.fill();
        break;
      }
      case "arch": {
        ctx.fillStyle = shape.color;
        drawArch(ctx, state.w, state.h);
        ctx.fill();
        break;
      }
      case "triangle": {
        ctx.fillStyle = shape.color;
        drawTriangle(ctx, state.w, state.h);
        ctx.fill();
        break;
      }
      default:
        break;
    }

    ctx.restore();
  }
}

// ── Main component ──
export const MooographGroupA: React.FC<{
  showRef?: boolean;
}> = ({ showRef = true }) => {
  const images = useGroupAImages();

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      // Background: solid #E8E6E0 only (no L0/L1)
      ctx.fillStyle = PALETTE.background;
      ctx.fillRect(0, 0, W, H);

      // Group A shapes
      drawGroupAShapes(ctx, frame, images);
    },
    [images],
  );

  return (
    <AbsoluteFill>
      {/* Reference video (background) */}
      {showRef && (
        <AbsoluteFill style={{ opacity: 0.5 }}>
          <OffthreadVideo
            src={staticFile("reference/mooograph-reference-30fps.mp4")}
            startFrom={0}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Canvas reproduction */}
      <AbsoluteFill style={{ opacity: showRef ? 0.7 : 1 }}>
        <CanvasScene draw={draw} />
      </AbsoluteFill>

      {/* Mode indicator */}
      {showRef && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            color: "#FF0000",
            fontSize: 14,
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.7)",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          GROUP A OVERLAY
        </div>
      )}
    </AbsoluteFill>
  );
};
