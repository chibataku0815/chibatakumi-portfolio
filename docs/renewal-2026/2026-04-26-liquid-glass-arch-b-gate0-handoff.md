# Liquid Glass — ARCH-B Gate 0 Handoff

**Date**: 2026-04-26 JST
**Target repo**: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
**SSoT plan**: `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/minimal-webgpu-liquid-reactive-frog.md`
**Direction plan**: `docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md`
**Branch**: `feat/renewal-2026-phase2-motion-dot`

---

## 1. Summary — what shipped at Gate 0

Foundation for the ARCH-B same-canvas Liquid Glass architecture. The
liquid-glass feature no longer owns a canvas, a WebGPU device, or its own
rAF loop. It plugs into motion-dot's render pipeline as a final-stage
**compose pass** that reads motion-dot's MotionFilmPostPass output texture
(`textureB`) and writes the swap chain.

```
motion-dot WebGPU canvas (z:-10):
  ├ Pass S: scene render          → textureA (rgba16float)   [unchanged]
  ├ Pass P: MotionFilmPostPass    → textureB (swap format)   [NEW target]
  └ Pass C: composePass.render    → swap chain               [NEW stage]
              │
              ├ default (null)            → fullscreen blit (bit-identical)
              └ liquid-glass composePass  → blit + per-surface scissored lensing
```

Surface registration ergonomics from React (`<LiquidGlassSurface kind="rail" …>`)
are preserved.

## 2. What changed

### Modified

| File | Change |
|---|---|
| `packages/motion-dot/src/main.ts` | `mountMotionDotApp` accepts `composePass`. MFP now writes textureB; final stage runs `composePass.render` (or default blit). MountHandle exposes `setComposePass`, `onBeforeFrame`, `gpu: { device, queue, format }`. |
| `packages/motion-dot/src/index.ts` | Re-exports `ComposePass`, `ComposePassFrameContext`. |
| `packages/motion-dot/src/ui/hud.ts` | HUD `top` values use `var(--motion-hud-top, 16px)`; default 16px preserves baseline. Audio settings button / panel offset via `calc()`. |
| `apps/web/src/app/[locale]/layout.tsx` | `<LiquidGlassProvider>` mounted between `<NextIntlClientProvider>` and `<AudioBusProvider>`. `:root { --motion-hud-top: 16px }` declared (Gate 1 will swap to nav-aware calc). |
| `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx` | Refactored to consume `useMotionStage()`, install compose pass, push pointer / scroll / route accent / surface DOM rects through `onBeforeFrame`. Removed self-canvas mount. |
| `apps/web/src/app/[locale]/glass-poc/` | **Deleted.** The PoC route used CSS gradient stripes as a fake substrate, which the new architecture (refracting motion-dot's MotionFilmPostPass output) cannot meaningfully sample. It produced misleading visuals — keeping it would have risked validating against the wrong reference. The visual reference target for Gate 1+ is the demo at `/Volumes/SamsungPortableSSDX5001/documents/life/output/webgpu-liquid-glass-demo/` running on its own dev server; the integration target is `/` on the portfolio with the real motion-dot substrate. |

### Added

| File | Lines | Purpose |
|---|---:|---|
| `packages/motion-dot/src/compose-pass.ts` | 149 | `ComposePass` types + `createDefaultBlitPass` (nearest-filter pass-through, bit-identical to legacy direct write). |
| `apps/web/src/features/liquid-glass/shaders/composite.ts` | 244 | WGSL string with `vsMain` + `fsBlit` + `fsComposite` entry points. Demo composite verbatim + (a) multi-rect via dynamic offset, (b) controlled brightness inside rail, (c) opaque output. |
| `apps/web/src/features/liquid-glass/compose-factory.ts` | 332 | Pure-TS `createLiquidGlassComposePass({device, format, getFrameState})` factory. Owns pipeline, sampler, bind group layout, uniform buffer (16 surfaces × 256-byte stride). Renders blit + per-surface scissored composite in one pass. |

### Removed

| File | Reason |
|---|---|
| `apps/web/src/features/liquid-glass/shader.ts` | Replaced by `shaders/composite.ts`. The old single-pass procedural-substrate shader had no access to motion-dot's actual rendered field. |
| `apps/web/src/features/liquid-glass/GpuGlassLayer.tsx` | Owned its own canvas + device + rAF. Replaced by `compose-factory.ts` which plugs into motion-dot's existing loop. |

## 3. Architecture decisions worth preserving

- **Pixel-identical guarantee by design.** Default blit uses the same swap-chain
  format as textureB, nearest sampling, and exact-half-pixel UVs. With
  `composePass=null` (or composePass with 0 surfaces) the swap chain is
  bit-identical to the legacy `MFP → swap chain` direct write.
- **Provider order**: `MotionStage > NextIntlClient > LiquidGlass > AudioBus`.
  LiquidGlass needs the motion-dot handle (so inside MotionStage), needs i18n
  to be initialized for translated child surfaces (so inside NextIntlClient),
  and stays outside AudioBus to keep audio surface lifecycle independent.
- **`--motion-hud-top` deferred to 16px in Gate 0.** This keeps HUD position
  identical to baseline. Gate 1 swaps it to `calc(var(--nav-height, 64px) + 16px)`
  in the same change that adds the nav rail surface, so HUD shift coincides
  with rail appearance.
- **No-op when WebGPU unsupported.** When `useMotionStage()` is in `pending`,
  `unsupported`, or `error`, LiquidGlassProvider's install effect bails. The
  surface registry still accepts entries, but no rendering occurs and no
  fallback material is faked. Matches the explicit unsupported posture.

## 4. Verification (Gate 0 acceptance)

```bash
# 1. Whitespace / conflict markers
git diff --check
# → 0 hits ✓

# 2. apps/web typecheck
apps/web/node_modules/.bin/tsc --noEmit -p apps/web --pretty false
# → only baseline: apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 ✓

# 3. Liquid-glass lint (Gate 0 scope — glass-poc deleted)
bun run --cwd apps/web lint -- src/features/liquid-glass
# → 0 errors, 0 warnings ✓

# 4. Forbidden tokens (DOM / canvas pixel theft, CSS backdrop-filter)
rg -n "backdrop-filter|webkit-backdrop-filter|webgl|html2canvas|getDisplayMedia|captureStream|drawImage" \
  apps/web/src/features/liquid-glass apps/web/src/shared/components/Nav.tsx
rg -n "html2canvas|getDisplayMedia|captureStream|drawImage" packages/motion-dot/src
# → both 0 hits ✓
```

### Pre-existing baseline lint findings (NOT introduced by Gate 0)

- `apps/web/src/shared/components/Nav.tsx:23` — `setState-in-effect` error
  (commit 2cc3e93eb, 2026-03-10). Will be resolved in Gate 1 when Nav.tsx
  is touched for the rail wiring.
- `apps/web/src/app/[locale]/layout.tsx:122` — `<img>` warning (Meta Pixel
  noscript fallback, pre-existing).

These are intentionally out of Gate 0 scope.

## 4b. Visual reference vs integration target — do not confuse the two

| | Visual reference (target) | Integration target (validation) |
|---|---|---|
| Where | `/Volumes/SamsungPortableSSDX5001/documents/life/output/webgpu-liquid-glass-demo/` | `chibatakumi-portfolio` `/` route |
| Substrate | demo's procedural Pass A (rgba16float) | motion-dot MotionFilmPostPass output (16 metaball scenes) |
| Run | Vite dev server in the demo repo | `bun run --cwd apps/web dev` |
| Use | Defines what "good lensing / dispersion / specular" looks like for the rail material | Confirms the same composite shader produces equivalent quality on top of the real motion-dot substrate |

Do not validate against `/glass-poc` (deleted) — its CSS gradient stripes
were never sampled by the new architecture, so any visual on that route
was unrelated to the true rail material. Always run the demo separately
to lock the visual target, then judge the portfolio against it.

## 5. What Gate 0 does NOT do

- No `<Nav>` change. No `backdropFilter` removal yet. No `<LiquidGlassSurface>`
  wrapping the nav rail. (Gate 1.)
- No experiments rail. (Gate 2.)
- No canvas-conflict QA on `/experiments/{dot,grid,flow}`. (Gate 3.)
- No readability sweep on long-text routes. (Gate 4.)
- No `--motion-hud-top` calc swap (still 16px). Done together with Gate 1.

## 6. Gate 1 starter prompt — paste into a fresh chat in `chibatakumi-portfolio`

Open a new Claude Code session in `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
and paste the block below, verbatim.

---

> # Liquid Glass — ARCH-B Gate 1 (`/` nav rail + Nav.tsx backdropFilter removal)
>
> ## Premise
>
> Gate 0 has shipped (commit history on branch `feat/renewal-2026-phase2-motion-dot`).
> motion-dot owns a `composePass` API; liquid-glass is a React-only feature
> that pushes a compose pass into motion-dot. Provider stack is wired in
> `apps/web/src/app/[locale]/layout.tsx`.
>
> Read first (SSoT order):
>
> 1. `docs/renewal-2026/2026-04-26-liquid-glass-arch-b-gate0-handoff.md` — this doc.
> 2. `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/minimal-webgpu-liquid-reactive-frog.md` — full plan; Gate 1 sits in §6 and §D7 / §D8.
> 3. `docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md` — anti-targets, Gate 1 acceptance criteria.
>
> ## Goals
>
> 1. Remove `backdropFilter` / `WebkitBackdropFilter` / `backdrop-blur-*` from
>    `apps/web/src/shared/components/Nav.tsx` (the **primary** effect must
>    be the GPU compose pass, not CSS).
> 2. Wrap the nav rail's interior with `<LiquidGlassSurface kind="nav" …>`
>    so it registers with the layout-mounted `LiquidGlassProvider`. The
>    `<nav>` element itself stays as semantic HTML; only the inner
>    container becomes the surface.
> 3. Update `--motion-hud-top` in `[locale]/layout.tsx` from `16px` to
>    `calc(var(--nav-height, 64px) + 16px)` so motion-dot HUD slides
>    underneath the rail (anti-target: HUD bleed through nav band).
> 4. Tune surface params (radius, intensity, brightness, route-accent tint
>    consumption) so the rail reads as a thin optical control layer over
>    the dark editorial motion field. Walk all 16 motion-dot scenes
>    (←/→ keys) and confirm none turn the rail into a bright slab. The
>    composite shader's controlled-brightness curve (modification (b))
>    should already prevent the worst cases; intensity / brightness props
>    are the dial.
> 5. Existing pre-Gate-0 lint baseline `Nav.tsx:23 setState-in-effect`
>    should be fixed during this change (move `setIsMenuOpen(false)` out
>    of the `useEffect` body — gate on a route change ref or use the
>    suggested pattern from the React docs).
>
> ## Hard constraints (do not violate)
>
> - **No second canvas.** WebGPU canvas count must stay at 1
>   (`document.querySelectorAll('canvas').length === 1`).
> - **No CSS imitation fallback.** When WebGPU is unsupported, Nav stays as
>   `bg-zinc-950/72` flat-dark — do not paint a fake glass with `backdrop-filter`.
> - **Do not touch** `globals.css` `.ui-panel` / `.ui-pill` / `.fl-card.fl-card--frost`,
>   Filmtone iOS / desktop / Capacitor, brand assets, reference-work.
> - Sticky behavior: `nav.getBoundingClientRect().top === 0` after `window.scrollTo(0,700)`.
> - Mobile nav panel keeps overlay click-to-close + body overflow lock.
>
> ## Acceptance — 9 anti-target browser QA on `/`
>
> Open dev server (`bun run --cwd apps/web dev`), reload `/` with console open.
>
> ❌ Smeared horizontal rainbow / pastel strip across the nav.
> ❌ Dirty gray / green / red corrupted blur band.
> ❌ Motion-dot HUD text readable under the rail.
> ❌ Nav text losing contrast.
> ❌ Full-surface chromatic noise (dispersion must stay edge-bound).
> ❌ Static gradient pretending to be refraction (the substrate must
>     visibly evolve as motion-dot scene animates).
> ❌ White-border / shadow-only glassmorphism look.
> ❌ All cards converted to glass.
> ❌ Reduced-motion preference still allows full lensing animation.
>
> Plus: 0 console errors, 0 WebGPU validation warnings, sticky-on-scroll OK.
> Capture screenshots into `output/playwright/2026-04-26-liquid-glass-gate1/`.
>
> ## Files touched (expected diff scope)
>
> - `apps/web/src/shared/components/Nav.tsx` — backdropFilter removal,
>   `<LiquidGlassSurface>` wrap, the setState-in-effect fix.
> - `apps/web/src/app/[locale]/layout.tsx` — `--motion-hud-top` calc swap.
> - (no motion-dot edits expected — composePass API is sufficient)
>
> ## Verification
>
> ```bash
> git diff --check
> apps/web/node_modules/.bin/tsc --noEmit -p apps/web --pretty false
> # baseline allowed: apps/web/src/features/interactive/film-lab/params-codec.test.ts:87
>
> bun run --cwd apps/web lint -- \
>   src/features/liquid-glass \
>   src/shared/components/Nav.tsx \
>   'src/app/[locale]/layout.tsx'
> # Nav.tsx:23 setState-in-effect MUST be resolved in Gate 1.
>
> rg -n "backdrop-filter|webkit-backdrop-filter|webgl|html2canvas|getDisplayMedia|captureStream|drawImage" \
>   apps/web/src/features/liquid-glass apps/web/src/shared/components/Nav.tsx
> rg -n "backdrop-blur" apps/web/src/shared/components/Nav.tsx
> # both expected: 0 hits
> ```
>
> Browser:
>
> - 1 canvas only.
> - 0 console errors / warnings.
> - Sticky at scrollY 700: nav top = 0.
> - Pointer over nav: subtle local highlight on rail interior.
> - Scroll fast: micro-sweep along rail width.
> - Motion-dot scene cycle (←/→): rail substrate visibly evolves; never gray-slab.
>
> ## Out of scope
>
> - `/experiments` row group (Gate 2).
> - Mobile panel surface registration (defer; Gate 1 keeps mobile panel flat-dark).
> - Filmtone, brand, reference-work, anything outside the listed files.

---

End of Gate 1 prompt.
