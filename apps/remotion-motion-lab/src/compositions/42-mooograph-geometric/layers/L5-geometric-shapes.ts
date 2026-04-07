/**
 * MOOOGRAPH Geometric — Layer 5: Geometric Shapes
 *
 * Draws all geometric shapes (rects, circles, arches, triangles,
 * bars, stars, images, paths) with per-shape enter/hold/exit animation.
 */
import { interpolateShape } from "../lib/interpolate";
import { SHAPES, PALETTE } from "../config";
import { roundRect } from "../../../lib/isshin-primitives";

/**
 * Draw a 5-pointed star centered at (0,0) with given outer radius.
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  outerR: number,
): void {
  const innerR = outerR * 0.4;
  const points = 5;
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

/**
 * Draw an arch (rectangle with semicircular top).
 */
function drawArch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const archRadius = w / 2;
  ctx.beginPath();
  // Semicircle top
  ctx.arc(w / 2, archRadius, archRadius, Math.PI, 0);
  // Right side down
  ctx.lineTo(w, h);
  // Bottom
  ctx.lineTo(0, h);
  // Left side up
  ctx.closePath();
}

/**
 * Draw an equilateral-ish triangle.
 */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
}

export function drawShapes(
  ctx: CanvasRenderingContext2D,
  frame: number,
  images: Record<string, HTMLImageElement> | null,
): void {
  for (const shape of SHAPES) {
    const state = interpolateShape(shape, frame);
    if (!state.visible || state.alpha < 0.001) continue;

    ctx.save();
    ctx.globalAlpha = state.alpha;

    // Transform: translate to shape center, apply scale + rotation
    const cx = state.x + state.w / 2;
    const cy = state.y + state.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(state.scale, state.scale);
    if (state.rotation !== 0) {
      ctx.rotate((state.rotation * Math.PI) / 180);
    }
    ctx.translate(-state.w / 2, -state.h / 2);

    switch (shape.type) {
      case "image": {
        const img =
          shape.imageKey && images ? images[shape.imageKey] : undefined;
        if (img) {
          ctx.drawImage(img, 0, 0, state.w, state.h);
        } else {
          // Placeholder: colored rect with X when asset is missing
          ctx.fillStyle = shape.color;
          ctx.globalAlpha = state.alpha * 0.4;
          ctx.fillRect(0, 0, state.w, state.h);
          ctx.strokeStyle = PALETTE.black;
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, state.w, state.h);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(state.w, state.h);
          ctx.moveTo(state.w, 0);
          ctx.lineTo(0, state.h);
          ctx.stroke();
        }
        break;
      }

      case "path": {
        if (shape.pathD) {
          ctx.fillStyle = shape.color;
          const p = new Path2D(shape.pathD);
          ctx.fill(p);
        }
        break;
      }

      case "rect":
      case "bar": {
        ctx.fillStyle = shape.color;
        const cr = shape.cornerRadius ?? 0;
        if (cr > 0) {
          roundRect(ctx, 0, 0, state.w, state.h, cr);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, state.w, state.h);
        }
        break;
      }

      case "circle": {
        ctx.fillStyle = shape.color;
        const r = shape.radius ?? Math.min(state.w, state.h) / 2;
        ctx.beginPath();
        ctx.arc(state.w / 2, state.h / 2, r, 0, Math.PI * 2);
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

      case "star": {
        ctx.fillStyle = shape.color;
        ctx.translate(state.w / 2, state.h / 2);
        drawStar(ctx, Math.min(state.w, state.h) / 2);
        ctx.fill();
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }
}
