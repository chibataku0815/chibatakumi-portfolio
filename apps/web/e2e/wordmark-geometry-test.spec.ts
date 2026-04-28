import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BUNDLED_FONTS = ["jost", "inter", "hanken", "bebas"] as const;

const OUT_DIR = path.resolve(process.cwd(), "../../output/playwright");

type CaptureCase = {
  label: (typeof BUNDLED_FONTS)[number];
  kind: "raw" | "signature" | "wire";
  query: string;
};

async function expectWordmarkPixels(buffer: Buffer, name: string) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let brightPixels = 0;
  let nonDarkPixels = 0;
  const totalPixels = info.width * info.height;

  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luminance > 80) brightPixels += 1;
    if (luminance > 32) nonDarkPixels += 1;
  }

  const brightRatio = brightPixels / totalPixels;
  const nonDarkRatio = nonDarkPixels / totalPixels;

  expect
    .soft(
      brightRatio,
      `${name}: expected visible light wordmark pixels, got ${(brightRatio * 100).toFixed(2)}%`,
    )
    .toBeGreaterThan(0.01);
  expect
    .soft(
      nonDarkRatio,
      `${name}: expected canvas not to be blank/dark, got ${(nonDarkRatio * 100).toFixed(2)}%`,
    )
    .toBeGreaterThan(0.02);
}

test("wordmark production logotype gate: raw/signature comparison, wire capture, non-blank canvas", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  const captureCases: CaptureCase[] = BUNDLED_FONTS.flatMap((label) => [
    {
      label,
      kind: "raw",
      query: `font=${label}&mode=solid&frame=off&palette=raw&bg=flat`,
    },
    {
      label,
      kind: "signature",
      query: `font=${label}&mode=solid&frame=off`,
    },
    {
      label,
      kind: "wire",
      query: `font=${label}&mode=wireframe&frame=off&palette=raw&bg=flat`,
    },
  ]);

  for (const captureCase of captureCases) {
    await page.goto(`/en/experiments/wordmark?${captureCase.query}`, {
      waitUntil: "networkidle",
    });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1200);

    const fileName = `2026-04-27-wordmark-${captureCase.label}-${captureCase.kind}.png`;
    const buffer = await canvas.screenshot({
      path: path.join(OUT_DIR, fileName),
      animations: "disabled",
    });

    await expectWordmarkPixels(
      buffer,
      `${captureCase.label}/${captureCase.kind}`,
    );
  }

  // Keep the earlier Tier 2 review filenames available for handoff comparison.
  for (const label of BUNDLED_FONTS) {
    // Tier 2 final: solid mode + each font's assigned bg shader
    await page.goto(
      `/en/experiments/wordmark?font=${label}&mode=solid&frame=off`,
      {
        waitUntil: "networkidle",
      }
    );
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: `../../output/playwright/2026-04-27-wordmark-${label}-tier2-final.png`,
      fullPage: false,
    });

    // Tier 2 baseline: solid mode + flat bg (kerning only, no bg effect)
    await page.goto(
      `/en/experiments/wordmark?font=${label}&mode=solid&frame=off&bg=flat`,
      {
        waitUntil: "networkidle",
      }
    );
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: `../../output/playwright/2026-04-27-wordmark-${label}-tier2-flatbg.png`,
      fullPage: false,
    });

    // Geometry health: wireframe mode + flat bg (kerning visible in geometry)
    await page.goto(
      `/en/experiments/wordmark?font=${label}&mode=wireframe&frame=off&bg=flat`,
      {
        waitUntil: "networkidle",
      }
    );
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: `../../output/playwright/2026-04-27-wordmark-${label}-tier2-wire.png`,
      fullPage: false,
    });
  }

  // Filter motion-dot WebGPU errors (layout-level, SwiftShader limitation).
  const fatalErrors = consoleErrors.filter(
    (msg) =>
      !msg.includes("Download the React DevTools") &&
      !msg.includes("favicon") &&
      !msg.includes("[motion-dot]") &&
      !msg.includes("WebGPU"),
  );
  const fatalPageErrors = pageErrors.filter(
    (msg) => !msg.includes("[motion-dot]") && !msg.includes("WebGPU"),
  );

  expect(fatalPageErrors).toEqual([]);
  expect(fatalErrors).toEqual([]);
});

test("wordmark URL params: font, mode, frame, palette, and bg are addressable", async ({
  page,
}) => {
  await page.goto(
    "/en/experiments/wordmark?font=inter&mode=wireframe&frame=on&palette=warm&bg=editorial",
    { waitUntil: "networkidle" },
  );

  await expect(page.getByText("Inter ExtraBold")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/mode wireframe/)).toBeVisible();
  await expect(page.getByText(/frame on/)).toBeVisible();
  await expect(page.getByText(/palette warm/)).toBeVisible();
  await expect(page.getByText(/bg editorial/)).toBeVisible();

  await page.goto(
    "/en/experiments/wordmark?font=bebas&mode=both&frame=off&palette=mono&bg=vignette",
    { waitUntil: "networkidle" },
  );

  await expect(page.getByText("Bebas Neue Regular")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/mode both/)).toBeVisible();
  await expect(page.getByText(/frame off/)).toBeVisible();
  await expect(page.getByText(/palette mono/)).toBeVisible();
  await expect(page.getByText(/bg vignette/)).toBeVisible();

  await page.goto(
    "/en/experiments/wordmark?font=unknown&mode=invalid&frame=off&palette=invalid&bg=invalid",
    { waitUntil: "networkidle" },
  );

  await expect(page.getByText("Jost 800 Italic")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/mode solid/)).toBeVisible();
  await expect(page.getByText(/frame off/)).toBeVisible();
  await expect(page.getByText(/palette raw/)).toBeVisible();
  await expect(page.getByText(/bg flat/)).toBeVisible();
});
