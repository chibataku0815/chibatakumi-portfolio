#!/usr/bin/env node
/**
 * @file Film Lab 用 — Next dev が参照する `apps/web` と `.env.local` の位置を表示する。
 * @description `bun run dev:context` で実行。`process.cwd()` が `.../apps/web` でなければ、
 *   `NEXT_PUBLIC_*` が空に埋め込まれる典型原因（別ディレクトリで `next dev` を起動している）。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** next.config.ts がある apps/web ルート（本スクリプトは apps/web/scripts/ に置く） */
const webAppRoot = path.join(__dirname, "..");

console.log("[Film Lab dev context]");
console.log("  process.cwd()     =", process.cwd());
console.log("  apps/web (fixed)  =", webAppRoot);

const cwdOk = path.resolve(process.cwd()) === path.resolve(webAppRoot);
console.log(
  "  cwd matches apps/web?",
  cwdOk ? "YES (next dev は通常ここで起動する)" : "NO — ルートで `bun run dev`（package.json 参照）か `cd apps/web` してから dev",
);

for (const name of [".env.local", ".env"]) {
  const abs = path.join(webAppRoot, name);
  const ok = fs.existsSync(abs);
  console.log(`  ${name.padEnd(12)} ${ok ? "exists " : "MISSING"} ${abs}`);
}

console.log("\nTip: モノレポルートからは `bun run dev`（ルート package.json の dev）を使うと cwd が apps/web になる。");
