import { defineConfig, devices } from "@playwright/test";

/**
 * Film Lab のプリセット見た目をスクリーンショットする E2E 用設定。
 * @description `bun run e2e:preset-quality` で dev サーバを起動し、`/film-lab` を開く。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
    // Film Lab は WebGL2 必須。headless Chromium でソフトウェア GL を試みる。
    launchOptions: {
      args: [
        "--ignore-gpu-blocklist",
        "--enable-webgl",
        "--use-angle=swiftshader",
      ],
    },
  },
  webServer: {
    command: "bun run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
