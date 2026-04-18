# Benchmark — Filmtone iOS Phase 0

27-run gate (or 9/18-run partial gate) auto-collection workflow for the Phase 0 export kill-test.

## 5-tap workflow

Per export run, end-to-end:

1. **Pick source** — load the fixed 60s or 5min clip.
2. **Run export** — wait for completion.
3. **Save to Photos** — confirm the system permission once per run if prompted.
4. **Mark visual floor** — inspect the saved file (start, middle, end). Tap `Pass` or `Fail` in the export sheet.
5. **Share benchmark result** — taps the `ベンチ結果を共有` button. The 1-line markdown row is copied to the clipboard (or shared via the system sheet on platforms that expose `navigator.share`).

Paste the line into a new file under `benchmark/runs/<date>-<device>-<clip>.md` (or append to a per-device markdown file).

## Markdown row format

Canonical row schema (parsed by `scripts/aggregate-benchmark.ts`):

```
| <date> | <device_model> | <iOS> | <clip_id> | <input_resolution> | <output_resolution> | <realtime_ratio>x | <file_size_mb>MB | thermal=<state> | mem_warn=<n> | save=<ok|fail|not-run> | visual=<pass|fail|not-checked> | err=<domain:code|none> | <duration_sec> |
```

Lines that look like the markdown header (`| date |…`) or the divider (`| --- |…`) are ignored by the parser, so a per-device file can be a properly formed markdown table.

## Aggregator

Run from the worktree root:

```sh
bun run scripts/aggregate-benchmark.ts benchmark/runs/
```

The aggregator prints a single decision line and a breakdown:

| Decision | Conditions |
| --- | --- |
| `Strong-Go` | 60s avg ≤ 2.0x realtime AND 100% visual pass AND 100% save ok |
| `Go` | 60s avg ≤ 2.5x realtime AND visual fail rate < 10% |
| `No-Go` | otherwise (or no 60s clips present) |

Exit codes: `0` on Strong-Go / Go, `3` on No-Go, `1` on bad usage, `2` on empty directory.

## Bucketing rules

- A row is treated as a 60s run when its `duration_sec` is within ±5s of 60 OR its `clip_id` contains the substring `60s`.
- A row is treated as a 5min run when its `duration_sec` is within ±15s of 300 OR its `clip_id` contains the substring `5min`.
- A row with a non-empty `err=` is counted as an export failure (it does not complete the 5-min completion bucket).

## Sample rows

A reference Strong-Go scenario is kept under `benchmark/samples/` so you can sanity-check the aggregator without committing real device data:

```sh
bun run scripts/aggregate-benchmark.ts benchmark/samples/
```

Real device data lives only under `benchmark/runs/` and never overwrites samples.
