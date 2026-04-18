#!/usr/bin/env bun
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseBenchmarkRow } from "../packages/film-lab-core/src/benchmark-row.ts";

const HEADER =
  "| date | device | iOS | clip_id | input_resolution | output_resolution | realtime_ratio | file_size_mb | thermal | memory_warnings | save | visual | error | duration_sec |";
const DIVIDER =
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";

function readClipboard(): string {
  const result = Bun.spawnSync(["pbpaste"]);
  if (result.exitCode !== 0) {
    console.error("pbpaste failed; are you on macOS with a readable clipboard?");
    process.exit(1);
  }
  return new TextDecoder().decode(result.stdout);
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(merged);
}

function extractRows(text: string): string[] {
  const rows: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (!line.startsWith("|") || !line.endsWith("|")) continue;
    if (line.startsWith("| ---") || line.toLowerCase().startsWith("| date |")) continue;
    if (parseBenchmarkRow(line)) rows.push(line);
  }
  return rows;
}

function ensureHeader(targetPath: string): void {
  if (existsSync(targetPath)) {
    const existing = readFileSync(targetPath, "utf-8");
    if (existing.includes(HEADER)) return;
    writeFileSync(targetPath, `${HEADER}\n${DIVIDER}\n${existing.startsWith("\n") ? "" : ""}${existing}`);
    return;
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${HEADER}\n${DIVIDER}\n`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const useStdin = args.includes("--stdin");
  const positional = args.filter((a) => a !== "--stdin");
  const targetArg = positional[0] ?? "benchmark/runs/auto.md";
  const targetPath = resolve(targetArg);

  const rawText = useStdin ? await readStdin() : readClipboard();
  const source = useStdin ? "stdin" : "clipboard";
  const rows = extractRows(rawText);

  if (rows.length === 0) {
    console.error(`No valid benchmark rows found on ${source}.`);
    console.error("Expect a line like:");
    console.error(`  ${HEADER.replace(/\|/g, "|")}`);
    if (!useStdin) {
      console.error("Did you tap ベンチ結果を共有 in the iOS app and paste/AirDrop the row?");
      console.error("Diagnose: `pbpaste | head -c 400` to see what the clipboard actually holds.");
      console.error("If a shell hook overwrites clipboard, use stdin mode:");
      console.error("  printf '...row...' | bun run bench:append --stdin /tmp/smoke.md");
    }
    process.exit(2);
  }

  ensureHeader(targetPath);
  appendFileSync(targetPath, rows.map((r) => `${r}\n`).join(""));

  console.log(`Appended ${rows.length} row(s) to ${targetPath} (source: ${source})`);
  for (const row of rows) {
    console.log(`  ${row}`);
  }
}

main();
