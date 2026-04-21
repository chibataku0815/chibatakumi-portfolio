/**
 * openrouter-depth.ts — dev-only depth estimation via OpenRouter (vision LLM).
 *
 * Sends each keyframe to Gemini 2.5 Pro, receives a 32x32 depth grid as JSON,
 * writes a 32x32 uint8 grayscale PNG per keyframe for WebGPU texture upload.
 *
 * Usage:
 *   cd packages/film-lab-renderer
 *   bunx tsx dev-scripts/openrouter-depth.ts
 *
 * Env:
 *   OPENROUTER_API_KEY — loaded from repo root .env.local
 *
 * Output:
 *   dev-fixtures/depth-probe-depth-NN.png (32x32 grayscale, 0=near, 255=far)
 *   dev-fixtures/depth-probe-depth-NN.json (raw grid for inspection)
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { PNG } from 'pngjs';

const GRID_SIZE = 32;
const MODEL = 'google/gemini-2.5-pro';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const scriptDir = dirname(new URL(import.meta.url).pathname);
const fixturesDir = resolve(scriptDir, '..', 'dev-fixtures');
const repoRoot = resolve(scriptDir, '..', '..', '..');
const envPath = resolve(repoRoot, '.env.local');

function loadApiKey(): string {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  if (!existsSync(envPath)) throw new Error(`.env.local not found at ${envPath}`);
  const env = readFileSync(envPath, 'utf8');
  const match = env.match(/OPENROUTER_API_KEY="?([^"\n]+)"?/);
  if (!match) throw new Error('OPENROUTER_API_KEY missing in .env.local');
  return match[1];
}

function buildPrompt(): string {
  return (
    `Estimate the relative depth of this image as a ${GRID_SIZE}x${GRID_SIZE} grid.\n` +
    `Output ONLY a JSON object of the form { "grid": number[][] } where:\n` +
    `- "grid" is exactly ${GRID_SIZE} rows and ${GRID_SIZE} columns.\n` +
    `- grid[row][col] is in [0.0, 1.0].\n` +
    `- 0.0 = nearest to camera, 1.0 = farthest from camera.\n` +
    `- row 0 = top of image, column 0 = left of image.\n` +
    `- Values must vary smoothly; don't clamp everything to 0 or 1.`
  );
}

async function callOpenRouter(apiKey: string, imageB64: string): Promise<number[][]> {
  const body = {
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt() },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.0,
    max_tokens: 16384,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://filmtone.app',
      'X-Title': 'filmtone-depth-probe',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? '';
  const cleaned = content.replace(/^```json\s*|```\s*$/g, '').trim();
  const parsed = JSON.parse(cleaned) as { grid: number[][] };

  if (!Array.isArray(parsed.grid) || parsed.grid.length !== GRID_SIZE) {
    throw new Error(`Expected ${GRID_SIZE}x${GRID_SIZE} grid, got ${parsed.grid?.length} rows`);
  }
  for (const row of parsed.grid) {
    if (!Array.isArray(row) || row.length !== GRID_SIZE) {
      throw new Error(`Expected ${GRID_SIZE}-col rows, got ${row?.length}`);
    }
  }
  return parsed.grid;
}

function gridToPng(grid: number[][]): Buffer {
  const png = new PNG({ width: GRID_SIZE, height: GRID_SIZE, colorType: 0 });
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const v = Math.max(0, Math.min(1, grid[y][x]));
      const gray = Math.round(v * 255);
      const idx = (y * GRID_SIZE + x) << 2;
      png.data[idx] = gray;
      png.data[idx + 1] = gray;
      png.data[idx + 2] = gray;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

async function main() {
  const apiKey = loadApiKey();
  const keyframes = readdirSync(fixturesDir)
    .filter((f) => /^depth-probe-kf-\d+\.png$/.test(f))
    .sort();

  if (keyframes.length === 0) {
    throw new Error(`No keyframes found in ${fixturesDir} (pattern: depth-probe-kf-NN.png)`);
  }
  console.log(`Found ${keyframes.length} keyframes. Inferring depth via ${MODEL}…`);

  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];
    const idx = kf.match(/(\d+)\.png$/)?.[1] ?? String(i + 1).padStart(2, '0');
    const b64 = readFileSync(join(fixturesDir, kf)).toString('base64');

    const t0 = Date.now();
    try {
      const grid = await callOpenRouter(apiKey, b64);
      const pngBuf = gridToPng(grid);
      writeFileSync(join(fixturesDir, `depth-probe-depth-${idx}.png`), pngBuf);
      writeFileSync(
        join(fixturesDir, `depth-probe-depth-${idx}.json`),
        JSON.stringify({ grid }, null, 2),
      );
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  [${i + 1}/${keyframes.length}] ${kf} → depth-probe-depth-${idx}.png (${dt}s)`);
    } catch (err) {
      console.error(`  [${i + 1}/${keyframes.length}] ${kf} FAILED: ${(err as Error).message}`);
      throw err;
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
