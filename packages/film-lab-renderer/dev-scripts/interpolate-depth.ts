/**
 * interpolate-depth.ts — expand 10 keyframe depth maps to per-video-frame depth PNGs.
 *
 * Keyframes were extracted from the source video at every 15th frame
 * (ffmpeg select='not(mod(n,15))') of a 150-frame clip, so keyframe index
 * N corresponds to video frame (N-1)*15. Between keyframes, depth is
 * linearly interpolated per-pixel. After the last keyframe, the final
 * depth map is held (clamp).
 *
 * Usage:
 *   cd packages/film-lab-renderer
 *   bunx tsx dev-scripts/interpolate-depth.ts
 *
 * Output:
 *   dev-fixtures/depth-frame-NNNN.png (32x32 grayscale, one per video frame)
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { PNG } from 'pngjs';

const GRID_SIZE = 32;
const KEYFRAME_STRIDE = 15;
const TOTAL_FRAMES = 150;

const scriptDir = dirname(new URL(import.meta.url).pathname);
const fixturesDir = resolve(scriptDir, '..', 'dev-fixtures');

function loadDepthPng(file: string): number[] {
  const buf = readFileSync(join(fixturesDir, file));
  const png = PNG.sync.read(buf);
  if (png.width !== GRID_SIZE || png.height !== GRID_SIZE) {
    throw new Error(`Expected ${GRID_SIZE}x${GRID_SIZE} png, got ${png.width}x${png.height}`);
  }
  const out = new Array<number>(GRID_SIZE * GRID_SIZE);
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    out[i] = png.data[i * 4] / 255;
  }
  return out;
}

function writeDepthPng(values: number[], filename: string) {
  const png = new PNG({ width: GRID_SIZE, height: GRID_SIZE, colorType: 0 });
  for (let i = 0; i < values.length; i++) {
    const g = Math.round(Math.max(0, Math.min(1, values[i])) * 255);
    png.data[i * 4] = g;
    png.data[i * 4 + 1] = g;
    png.data[i * 4 + 2] = g;
    png.data[i * 4 + 3] = 255;
  }
  writeFileSync(join(fixturesDir, filename), PNG.sync.write(png));
}

function main() {
  const keyframes = readdirSync(fixturesDir)
    .filter((f) => /^depth-probe-depth-\d+\.png$/.test(f))
    .sort();

  if (keyframes.length === 0) {
    throw new Error('No depth-probe-depth-NN.png found. Run openrouter-depth.ts first.');
  }

  const kfData = keyframes.map(loadDepthPng);
  console.log(`Loaded ${kfData.length} keyframes. Interpolating to ${TOTAL_FRAMES} frames…`);

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const kfIndex = f / KEYFRAME_STRIDE;
    const kLo = Math.min(Math.floor(kfIndex), kfData.length - 1);
    const kHi = Math.min(kLo + 1, kfData.length - 1);
    const t = kLo === kHi ? 0 : kfIndex - kLo;

    const dLo = kfData[kLo];
    const dHi = kfData[kHi];
    const out = new Array<number>(GRID_SIZE * GRID_SIZE);
    for (let i = 0; i < out.length; i++) {
      out[i] = dLo[i] * (1 - t) + dHi[i] * t;
    }

    const name = `depth-frame-${String(f).padStart(4, '0')}.png`;
    writeDepthPng(out, name);
  }

  console.log(`Wrote ${TOTAL_FRAMES} depth frames.`);
}

main();
