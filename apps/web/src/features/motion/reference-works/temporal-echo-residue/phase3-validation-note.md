# Temporal Echo Residue Phase 3 Validation Note

This note distinguishes the two artifact lanes used in the current Phase 3 check.

## Headless Capture Batch

- artifact home:
  - `output/playwright/temporal-echo-benchmark-check/console-summary.json`
  - `output/playwright/temporal-echo-benchmark-check/contact-sheet.png`
- purpose:
  - benchmark key-frame comparison
- current recorded state:
  - `warningCount: 7`
  - repeated `No available adapters.`
  - capture screenshots may show `CANVASRENDERER`

This batch is useful for frame-to-frame grammar comparison, but it is not the authoritative renderer-home artifact.

## Live Non-Capture Route

- artifact home:
  - `output/playwright/temporal-echo-benchmark-check/live-route-summary.json`
  - `output/playwright/temporal-echo-benchmark-check/live-route-console.log`
  - `output/playwright/temporal-echo-benchmark-check/live-route-hud.txt`
  - `output/playwright/temporal-echo-benchmark-check/live-route-frame-048.png`
- route:
  - `http://127.0.0.1:3000/en/motion/reference-works/temporal-echo-residue?frame=48&play=0`
- current recorded state:
  - `rendererLabelRead: WEBGPURENDERER`
  - `warningCount: 0`
  - `errorCount: 0`

This live route artifact is the authoritative renderer-home check for the current Phase 3 pass.
