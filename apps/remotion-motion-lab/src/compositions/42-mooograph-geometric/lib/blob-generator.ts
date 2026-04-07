/**
 * MOOOGRAPH Geometric — Procedural Blob Generator
 *
 * Generates organic blob shapes via multi-octave sinusoidal
 * deformation of a base circle. Fills with halftone dot pattern
 * to match the MOOOGRAPH visual style.
 */

export interface BlobConfig {
  cx: number;
  cy: number;
  baseRadius: number;
  points: number; // 64 recommended
  octaves: number; // 5 recommended
  seed: number;
}

/** Deterministic pseudo-random (same as sr in canvas-primitives) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generate a morphing blob Path2D.
 *
 * @param config - Blob geometry configuration
 * @param morphT - Morph parameter (typically frame * morphRate)
 * @returns Path2D of the blob outline
 */
export function generateBlobPath(config: BlobConfig, morphT: number): Path2D {
  const { cx, cy, baseRadius, points, octaves, seed } = config;
  const angleStep = (Math.PI * 2) / points;

  // Amplitude and frequency for each octave (descending amplitude)
  const amplitudes = [0.20, 0.15, 0.10, 0.06, 0.04];
  const frequencies = [1, 2, 3, 4, 5];

  // Generate radii for each sample point
  const radii: number[] = [];
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    let r = baseRadius;

    for (let o = 0; o < octaves; o++) {
      const amp = amplitudes[o] ?? 0.03;
      const freq = frequencies[o] ?? o + 1;
      const phase = seededRandom(seed * 17 + o * 31) * Math.PI * 2;
      const rate = (o + 1) * 0.7; // morph speed per octave
      r += baseRadius * amp * Math.sin(freq * angle + phase + morphT * rate);
    }

    radii.push(r);
  }

  // Convert polar to cartesian
  const pts: [number, number][] = radii.map((r, i) => {
    const angle = i * angleStep;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });

  // Build Path2D using quadratic bezier curves between midpoints
  const path = new Path2D();
  const first = pts[0];
  const second = pts[1];
  const midX0 = (first[0] + second[0]) / 2;
  const midY0 = (first[1] + second[1]) / 2;
  path.moveTo(midX0, midY0);

  for (let i = 1; i < points; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % points];
    const mx = (curr[0] + next[0]) / 2;
    const my = (curr[1] + next[1]) / 2;
    path.quadraticCurveTo(curr[0], curr[1], mx, my);
  }

  // Close: curve back to start midpoint
  path.quadraticCurveTo(first[0], first[1], midX0, midY0);
  path.closePath();

  return path;
}

/**
 * Draw a blob filled with a halftone dot pattern.
 *
 * 1. Fill blob shape with base color
 * 2. Clip to blob
 * 3. Overlay grid of small dots
 */
export function drawBlobWithHalftone(
  ctx: CanvasRenderingContext2D,
  blobPath: Path2D,
  bounds: { x: number; y: number; w: number; h: number },
  dotSpacing: number,
  dotRadius: number,
  baseColor: string,
  dotColor: string,
): void {
  ctx.save();

  // Fill with base color
  ctx.fillStyle = baseColor;
  ctx.fill(blobPath);

  // Clip to blob boundary
  ctx.clip(blobPath);

  // Halftone dot grid
  ctx.fillStyle = dotColor;
  for (let x = bounds.x; x < bounds.x + bounds.w; x += dotSpacing) {
    for (let y = bounds.y; y < bounds.y + bounds.h; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
