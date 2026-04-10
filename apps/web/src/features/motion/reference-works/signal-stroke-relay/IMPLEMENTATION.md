# Signal Stroke Relay

Internal browser-first reference work for proving the `Theatre.js + Motion + SVG` home.

## Route

- `/[locale]/motion/reference-works/signal-stroke-relay`
- clean capture mode:
  - `?capture=1`
  - `?capture=1&frame=18`
  - `?capture=1&play=0`

## What Is Implemented

- `trimWindow()` based SVG draw-window control
- `staggerChain()` using Motion's `stagger()`
- `offsetGate()` for layer-local delay / reveal contracts
- `matchCutAnchor()` for baton continuity between the lead stroke and the title start
- dev-only Theatre project/sheet/object boot with Studio UI kept separate from the runtime evaluator
- Theatre Studio UI is lazy-loaded in dev and initializes only when explicitly requested from the viewport header
- capture mode strips surrounding chrome so still/video evidence can be taken without widening scope

## Validation Intent

- relay reads as one statement
- Trim Paths reads as draw-window control, not generic stroke animation
- Theatre edits change timing without collapsing the evaluator boundary
- reduced-motion falls back to a static payoff frame

## Knowledge

- Route mount 時点で必要なのは `@theatre/core` の project / sheet / object state であり、これは Studio UI なしで起動する。
- Dev の default route state では `@theatre/studio` は未読込のままで、header 表示も `Studio Idle` に留まれる。
- `LOAD STUDIO` / `SHOW STUDIO` を押した時だけ `@theatre/studio` を dynamic import して `initialize()` し、その後に UI を restore する。
- `initialize()` path では cleanup と authoring 導線のために `hide()` も呼ぶが、これは `init-on-mount then hide` を意味しない。
- Playback 中の visual state は evaluator を source of truth に保ち、Studio は authoring UI に限定する。
- Studio の初期化 / hidden 制御は playback toggle と別 effect に分ける。`PLAY` / `PAUSE` に Studio 制御を巻き込まない。

## Validation Snapshot

- Date: 2026-04-10
- Route validated: `http://127.0.0.1:3007/en/motion/reference-works/signal-stroke-relay`
- Capture route validated: `http://127.0.0.1:3007/en/motion/reference-works/signal-stroke-relay?capture=1&frame=78`
- Console state after the Theatre fix: no runtime error while Theatre project state is active and Studio UI is still not loaded
- Evidence captures:
  - `output/playwright/signal-stroke-relay-early-018f.png`
  - `output/playwright/signal-stroke-relay-middle-043f.png`
  - `output/playwright/signal-stroke-relay-payoff-078f.png`
  - `output/playwright/signal-stroke-relay-playback.webm`
  - `output/playwright/signal-stroke-relay-theatre-before-057f.png`
  - `output/playwright/signal-stroke-relay-theatre-after-baseframe30-057f.png`
  - `output/playwright/signal-stroke-relay-reduced-motion-settled-078f.png`
- Technique family readability: proven enough for this narrow Phase 1 pass.
  - `018f` proves Trim Paths as the lead draw-window before downstream stages open.
  - `043f` proves stagger / offset sequencing and shows the baton handoff nearly complete (`batonT ~= 0.961`) while the title is still opening.
  - `078f` proves the payoff frame with title and underline fully resolved.
  - basic Match Cut is not proven as a strong standalone read; it remains subtle in this narrow browser pass.
  - Manual spot-check completed after evidence review: the basic Match Cut read is still acceptable for this Phase 1 narrow proof.
- Library home: proven.
  - The validated route stays browser-first in `apps/web` and reads as `Theatre.js + Motion + SVG`.
- Accidental drift into non-goals: proven absent in this pass.
  - No evidence of PixiJS / Three.js migration, GPU post treatment, smear / boiling / liquid / morph behavior, or Remotion-first runtime drift.
- Theatre live retiming / authoring edits: proven.
  - With Theatre Studio open, `Global > Base frame` was changed from `12` to `30` while the route stayed paused at `057f`.
  - The viewport changed from a late resolved title state to an earlier title-entry state without leaving the browser runtime path, which proves Theatre edits are reaching the evaluator boundary live.
- reduced-motion payoff fallback: proven.
  - Under `prefers-reduced-motion: reduce`, the `/en` route settled at `078f` and exposed a `STATIC` control state.
  - The captured viewport matches the payoff composition rather than an in-flight animation state.
- export / regression adapter behavior: not proven yet.
  - In this pass, no dedicated Signal Stroke Relay export / regression adapter implementation was found under `apps/` or `packages/`; the route only states that this work should sit below the browser runtime later.
- Direction judgment: accepted as a browser-first Phase 1 narrow proof only.
  - This does not accept shared extraction, production readiness, or export / regression adapter behavior.
