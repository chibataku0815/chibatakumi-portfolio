import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Film Lab の各プリセットを同じ入力画像で描画し、ビューポート PNG を書き出す。
 * @description 初回は `bunx playwright install chromium` が必要。出力は `preset-quality-corpus/snapshots/latest/`（gitignore）。
 */
const PRESET_NAMES = [
  "cinematic",
  "portra",
  "gold200",
  "pro400h",
  "ektar100",
  "superia400",
  "cinestill800t",
  "bw",
  "reset",
] as const;

const CORPUS_JPG = path.join(
  process.cwd(),
  "src/features/interactive/film-lab/preset-quality-corpus/landscape_reference_01.jpg",
);

const OUT_DIR = path.join(
  process.cwd(),
  "src/features/interactive/film-lab/preset-quality-corpus/snapshots/latest",
);

test.describe("Film Lab preset quality snapshots", () => {
  test("dump viewport PNG per preset", async ({ page }) => {
    test.setTimeout(180_000);
    if (!fs.existsSync(CORPUS_JPG)) {
      throw new Error(
        `preset-quality: missing corpus image. Run preset-quality-corpus/generate-synthetic-corpus.sh or copy default.jpg to landscape_reference_01.jpg. path=${CORPUS_JPG}`,
      );
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    // dev サーバでは HMR 等で networkidle が終わらないことがあるため load のみ待つ
    await page.goto("/film-lab", { waitUntil: "load" });
    await expect(page.getByTestId("film-lab-open")).toBeVisible({ timeout: 90_000 });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("film-lab-open").click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles(CORPUS_JPG);

    const loading = page.getByText("Loading media…");
    try {
      await loading.waitFor({ state: "visible", timeout: 5000 });
    } catch {
      /* 高速環境では一瞬しか出ない */
    }
    await expect(loading).not.toBeVisible({ timeout: 60_000 });

    // WebGL のテクスチャ反映待ち
    await page.waitForTimeout(1500);

    const viewport = page.getByTestId("film-lab-viewport");
    await expect(viewport).toBeVisible();

    for (const name of PRESET_NAMES) {
      await page.getByTestId("film-lab-preset-select-trigger").click();
      await page.getByTestId("film-lab-preset-search-input").fill(name);
      await page.getByTestId(`film-lab-preset-${name}`).click();
      await page.waitForTimeout(800);
      const filePath = path.join(OUT_DIR, `${name}.png`);
      await viewport.screenshot({ path: filePath, animations: "disabled" });
    }
  });
});
