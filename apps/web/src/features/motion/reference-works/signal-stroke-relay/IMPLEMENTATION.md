# Signal Stroke Relay

Internal browser-first reference work for proving the `Theatre.js + Motion + SVG` home.

## Route

- `/[locale]/motion/reference-works/signal-stroke-relay`

## What Is Implemented

- `trimWindow()` based SVG draw-window control
- `staggerChain()` using Motion's `stagger()`
- `offsetGate()` for layer-local delay / reveal contracts
- `matchCutAnchor()` for baton continuity between the lead stroke and the title start
- dev-only Theatre Studio lazy boot with project/sheet objects kept separate from the runtime evaluator
- Theatre Studio does not load into the viewport by default and can be opened intentionally from the viewport header when authoring is needed

## Validation Intent

- relay reads as one statement
- Trim Paths reads as draw-window control, not generic stroke animation
- Theatre edits change timing without collapsing the evaluator boundary
- reduced-motion falls back to a static payoff frame
