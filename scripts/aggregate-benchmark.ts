#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  parseBenchmarkRow,
  type ParsedBenchmarkRow,
} from "../packages/film-lab-core/src/benchmark-row.ts";

interface AggregateBuckets {
  sixtySecondRows: ParsedBenchmarkRow[];
  fiveMinuteRows: ParsedBenchmarkRow[];
  allRows: ParsedBenchmarkRow[];
}

interface AggregateSummary {
  decision: "Strong-Go" | "Go" | "No-Go";
  totalRuns: number;
  sixtySecondAvgRealtime: number | null;
  sixtySecondMaxRealtime: number | null;
  sixtySecondCount: number;
  fiveMinuteCompletionRate: number | null;
  fiveMinuteCount: number;
  visualPassRate: number | null;
  visualFailCount: number;
  visualUncheckedCount: number;
  saveOkRate: number | null;
  saveFailCount: number;
  errors: ParsedBenchmarkRow[];
  reasoning: string;
}

const SIXTY_SECOND_TOLERANCE_SEC = 5;
const FIVE_MINUTE_TOLERANCE_SEC = 15;

function isCloseTo(value: number | null, target: number, tolerance: number): boolean {
  if (value == null) return false;
  return Math.abs(value - target) <= tolerance;
}

function bucketize(rows: ParsedBenchmarkRow[]): AggregateBuckets {
  const sixtySecondRows: ParsedBenchmarkRow[] = [];
  const fiveMinuteRows: ParsedBenchmarkRow[] = [];

  for (const row of rows) {
    if (isCloseTo(row.durationSec, 60, SIXTY_SECOND_TOLERANCE_SEC) || row.clipId.includes("60s")) {
      sixtySecondRows.push(row);
    }
    if (isCloseTo(row.durationSec, 300, FIVE_MINUTE_TOLERANCE_SEC) || row.clipId.includes("5min")) {
      fiveMinuteRows.push(row);
    }
  }

  return { sixtySecondRows, fiveMinuteRows, allRows: rows };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function maximum(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

function decide(
  sixtySecondAvg: number | null,
  visualPassRate: number | null,
  saveOkRate: number | null,
  visualFailCount: number,
  totalChecked: number,
): { decision: "Strong-Go" | "Go" | "No-Go"; reasoning: string } {
  if (
    sixtySecondAvg != null &&
    sixtySecondAvg <= 2.0 &&
    visualPassRate === 1 &&
    saveOkRate === 1
  ) {
    return {
      decision: "Strong-Go",
      reasoning: `60s avg ${sixtySecondAvg}x ≤ 2.0x AND 100% visual pass AND 100% save ok`,
    };
  }

  const visualFailRate = totalChecked > 0 ? visualFailCount / totalChecked : 1;
  if (sixtySecondAvg != null && sixtySecondAvg <= 2.5 && visualFailRate < 0.1) {
    return {
      decision: "Go",
      reasoning: `60s avg ${sixtySecondAvg}x ≤ 2.5x AND visual fail rate ${(
        visualFailRate * 100
      ).toFixed(1)}% < 10%`,
    };
  }

  const reasons: string[] = [];
  if (sixtySecondAvg == null) {
    reasons.push("no 60s clips");
  } else if (sixtySecondAvg > 2.5) {
    reasons.push(`60s avg ${sixtySecondAvg}x > 2.5x`);
  }
  if (visualFailRate >= 0.1) {
    reasons.push(`visual fail rate ${(visualFailRate * 100).toFixed(1)}% ≥ 10%`);
  }
  if (saveOkRate != null && saveOkRate < 1) {
    reasons.push(`save ok rate ${(saveOkRate * 100).toFixed(0)}% < 100%`);
  }
  return {
    decision: "No-Go",
    reasoning: reasons.length > 0 ? reasons.join("; ") : "thresholds not met",
  };
}

function aggregate(rows: ParsedBenchmarkRow[]): AggregateSummary {
  const { sixtySecondRows, fiveMinuteRows } = bucketize(rows);

  const sixtySecondRealtimes = sixtySecondRows
    .map((r) => r.realtimeRatio)
    .filter((v): v is number => typeof v === "number");
  const sixtySecondAvgRealtime = average(sixtySecondRealtimes);
  const sixtySecondMaxRealtime = maximum(sixtySecondRealtimes);

  const fiveMinuteCompletions = fiveMinuteRows.filter(
    (r) => r.errorCode == null && r.errorDomain == null,
  );
  const fiveMinuteCompletionRate =
    fiveMinuteRows.length > 0 ? fiveMinuteCompletions.length / fiveMinuteRows.length : null;

  const checkedVisualRows = rows.filter((r) => r.visualFloor !== "not-checked");
  const visualPassCount = checkedVisualRows.filter((r) => r.visualFloor === "pass").length;
  const visualFailCount = checkedVisualRows.filter((r) => r.visualFloor === "fail").length;
  const visualUncheckedCount = rows.filter((r) => r.visualFloor === "not-checked").length;
  const visualPassRate =
    checkedVisualRows.length > 0 ? visualPassCount / checkedVisualRows.length : null;

  const saveAttemptedRows = rows.filter((r) => r.saveResult !== "not-run");
  const saveOkCount = saveAttemptedRows.filter((r) => r.saveResult === "ok").length;
  const saveFailCount = saveAttemptedRows.filter((r) => r.saveResult === "fail").length;
  const saveOkRate = saveAttemptedRows.length > 0 ? saveOkCount / saveAttemptedRows.length : null;

  const errors = rows.filter((r) => r.errorCode != null || r.errorDomain != null);

  const { decision, reasoning } = decide(
    sixtySecondAvgRealtime,
    visualPassRate,
    saveOkRate,
    visualFailCount,
    checkedVisualRows.length,
  );

  return {
    decision,
    totalRuns: rows.length,
    sixtySecondAvgRealtime,
    sixtySecondMaxRealtime,
    sixtySecondCount: sixtySecondRows.length,
    fiveMinuteCompletionRate,
    fiveMinuteCount: fiveMinuteRows.length,
    visualPassRate,
    visualFailCount,
    visualUncheckedCount,
    saveOkRate,
    saveFailCount,
    errors,
    reasoning,
  };
}

function loadRowsFromDir(dir: string): ParsedBenchmarkRow[] {
  const absoluteDir = resolve(dir);
  const stat = statSync(absoluteDir);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${absoluteDir}`);
  }

  const rows: ParsedBenchmarkRow[] = [];
  for (const entry of readdirSync(absoluteDir)) {
    if (!entry.endsWith(".md")) continue;
    if (entry === "README.md") continue;
    const text = readFileSync(join(absoluteDir, entry), "utf-8");
    for (const line of text.split(/\r?\n/)) {
      const parsed = parseBenchmarkRow(line);
      if (parsed) rows.push(parsed);
    }
  }
  return rows;
}

function formatRate(value: number | null): string {
  if (value == null) return "n/a";
  return `${(value * 100).toFixed(0)}%`;
}

function printSummary(summary: AggregateSummary): void {
  console.log(`${summary.decision} — ${summary.reasoning}`);
  console.log("");
  console.log(`Total runs:               ${summary.totalRuns}`);
  console.log(
    `60s clip realtime avg:    ${
      summary.sixtySecondAvgRealtime != null ? `${summary.sixtySecondAvgRealtime}x` : "n/a"
    } (max ${
      summary.sixtySecondMaxRealtime != null ? `${summary.sixtySecondMaxRealtime}x` : "n/a"
    }, n=${summary.sixtySecondCount})`,
  );
  console.log(
    `5min clip completion:     ${formatRate(summary.fiveMinuteCompletionRate)} (n=${
      summary.fiveMinuteCount
    })`,
  );
  console.log(
    `Visual floor pass rate:   ${formatRate(summary.visualPassRate)} (fail=${
      summary.visualFailCount
    }, unchecked=${summary.visualUncheckedCount})`,
  );
  console.log(
    `Save to Photos ok rate:   ${formatRate(summary.saveOkRate)} (fail=${summary.saveFailCount})`,
  );

  if (summary.errors.length > 0) {
    console.log("");
    console.log(`Errors (${summary.errors.length}):`);
    for (const row of summary.errors) {
      console.log(
        `  - ${row.date} ${row.deviceModel} ${row.clipId} → ${
          row.errorDomain ?? "—"
        }:${row.errorCode ?? "—"}`,
      );
    }
  }
}

function main(): void {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: bun run scripts/aggregate-benchmark.ts <benchmark/runs/>");
    process.exit(1);
  }

  const rows = loadRowsFromDir(dir);
  if (rows.length === 0) {
    console.error(`No benchmark rows found under ${resolve(dir)}`);
    process.exit(2);
  }

  const summary = aggregate(rows);
  printSummary(summary);
  process.exit(summary.decision === "No-Go" ? 3 : 0);
}

main();
