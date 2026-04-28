# @chibatakumi/motion-dot

Renewal 2026 — Dot motion participant. WebGPU 17+ particle scenes + metaball SDF + 2.5D composite. Main craft signature of the portfolio motion language.

## Position in Renewal 2026 architecture

- WebGPU implementation. **This is the main craft signature.**
- Wraps `life/output/motion-dot-new-webgpu` (vendored into `src/` via Stream 2-A).
- Exposes `createDotScene(name, opts)` returning a `MotionParticipant<DotParams>` (Stream 2-B).
- Used by portfolio shell at `/experiments/dot` (gallery mode, full HUD) and as ambient motion vocabulary on home / works pages.

## Scene catalog (17+)

`gpu-fx-presets` (vendor lib) provides the canonical preset scenes, in this order:

- `orbit`
- `river`
- `magnet`
- `mitosis`
- `pendulum`
- `ripple`
- `delta`
- `flock`
- `helix`
- `phase-transition`
- `firefly`
- `molecular`
- `chain`
- `converge`
- `text-attractor`
- `grid-fluid`

Phase 2 local GPU-compute scene (lives under `src/scene/`):

- `fluid` — `src/scene/fluid-scene.ts`

Order matches `life/output/motion-dot-new-webgpu/src/main.ts` `libScenes`.

## Local module map

| Subdir | Owns |
|---|---|
| `animation/` | easing |
| `audio/` | `DOT_WIRING` audio param map (`bands.bass → metaball threshold`, etc.) |
| `compute/` | GPU compute particle system + WGSL shaders |
| `input/` | keyboard cluster (gallery mode only) |
| `render/` | metaball SDF render pass |
| `scene/` | local scenes (`fluid-scene`, `composite-25d` for 2.5D gallery), `scene-types` |
| `shaders/` | shared WGSL noise |
| `transition/` | `kinetic-handoff` (used by MotionStage page transitions) |
| `ui/` | HUD overlay (gallery mode only) |

## Canvas2D legacy preservation policy

The Canvas2D-era predecessor at `life/output/motion-dot-new` is **preserved, not deleted**. Stream 4 of Renewal 2026 will archive it as `journal/motion-studies/dot-new-canvas2d` (read-only craft journal entry). This package (`motion-dot`) is the WebGPU successor and the production craft signature. Do not delete the Canvas2D source until the journal archive lands.

## Status

Phase 1 / Stream 2 — package 化 landed.

- ✅ **Stream 2-A**: source vendored under `src/`, vendor lib deps wired (5 workspace pkgs + `@chibatakumi/motion-core`), `?raw` shim + tsconfig configured.
- ✅ **Stream 2-B**: `createDotScene(name, device, opts?)` real factory + `createDotParticipant(opts?)` scaffold (parity with motion-grid / motion-flow).
- ✅ **Stream 2-C**: `kinetic-handoff` transition controller + `composite-25d` gallery mode re-exported at package root.
- ✅ **Stream 2-D**: `bunx tsc --noEmit` 0 errors (motion-dot).
- ✅ **Stream 2-E**: Canvas2D archive contract documented (see "Canvas2D legacy preservation policy").
- ⏸️ **Phase A wiring**: `createDotParticipant.init()` body — build SceneEntry array, MetaballSDF, MotionFilmPostPass, KineticHandoff orchestration. Lands when MotionStage in Stream 4 (Portfolio Shell) drives this participant.
- ⏸️ **Demo route**: deferred to Stream 4 alongside motion-grid / motion-flow demo routes (requires `transpilePackages` wire-up + locale routing).

## Usage

```ts
import {
  createDotScene,
  createDotParticipant,
  DOT_SCENE_NAMES,
  DOT_WIRING,
} from "@chibatakumi/motion-dot";

// Direct scene factory (lower-level, e.g. unit tests, custom shells):
const orbit = createDotScene("orbit", device);
orbit.encode(encoder, time, dt);

// Participant factory (used by MotionStage in portfolio shell):
const dot = createDotParticipant({
  initialScene: "river",
  enableHud: false,
  enableInput: false,
});
stage.register(dot);
stage.setActive("dot", 500);
```

`DOT_SCENE_NAMES` is the type-safe canon (17 entries, order matches handoff snapshot indexing). `DOT_WIRING` is the 7-wire audio canon (1 input → 1 param) backing `createDotParticipant`'s `audioWiring`.
