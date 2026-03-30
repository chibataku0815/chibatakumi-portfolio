/**
 * @fileoverview ビルド済み `dist` をローカルで配信し、Playwright WebKit で
 * `runWebviewCapabilityProbe` と同等の計測結果を #report から読み取る。
 * Tauri 組み込み WKWebView との完全一致ではないが、Safari 系エンジンの近似比較用。
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webkit } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const port = 18765;

/**
 * dist を静的配信する（外部コマンドなし）。
 *
 * @returns {Promise<import('node:http').Server>}
 */
function serveDist() {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = req.url?.split("?")[0] || "/";
        let rel = url === "/" ? "/index.html" : url;
        const filePath = path.join(distDir, rel);
        if (!filePath.startsWith(distDir)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const buf = await readFile(filePath);
        const ext = path.extname(filePath);
        const types = {
          ".html": "text/html; charset=utf-8",
          ".js": "application/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".svg": "image/svg+xml",
        };
        res.writeHead(200, {
          "Content-Type": types[ext] || "application/octet-stream",
        });
        res.end(buf);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

const server = await serveDist();
const browser = await webkit.launch({
  headless: true,
});
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/`, {
  waitUntil: "load",
  timeout: 60000,
});

await page.waitForFunction(
  () => {
    const el = document.querySelector("#report");
    const t = el?.textContent ?? "";
    return t.length > 10 && !t.includes("計測中");
  },
  { timeout: 30000 },
);

const text = await page.locator("#report").innerText();
console.log("--- Playwright WebKit probe ---\n");
console.log(text);
await browser.close();
server.close();
process.exit(0);
