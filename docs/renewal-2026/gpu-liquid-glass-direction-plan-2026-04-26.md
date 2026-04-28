# GPU Liquid Glass Direction Plan

Date: 2026-04-26
Target repo: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`
Target app: `apps/web`
Adoption rules: `docs/renewal-2026/liquid-glass-adoption-rules-2026-04-26.md`

## Summary

Portfolio の global nav / experiments / selected route chrome に、CSS glassmorphism ではなく WebGPU 主体の Liquid Glass material を導入する。

目的は `backdrop-filter`、半透明カード、白 border/shadow の延長ではなく、portfolio の WebGPU motion identity と統合された独自 material を作ること。

実装は一気に全 route へ広げない。ページ単位で目視 QA し、問題なければ次へ進む。

## Product Direction

- WebGPU を primary path とする。
- WebGL fallback / CSS imitation fallback はこの package では作らない。
- Adoption decisions must follow `docs/renewal-2026/liquid-glass-adoption-rules-2026-04-26.md`.
- WebGPU unavailable 時は material を偽装しない。semantic DOM は残し、既存の explicit unsupported posture と同じ考え方に寄せる。
- DOM は semantic/accessibility layer として維持する。
- Visual material は fixed full-viewport, pointer-events-none の GPU overlay が担当する。
- 既存 `MotionStageProvider` の motion-dot canvas は置き換えない。
- GPU glass layer は existing motion background と競合しない lightweight compositor として追加する。

## Target Design

This section is the quality bar. Passing typecheck, having a WebGPU canvas, or showing shader color is not enough.

### Material Character

The intended material is a thin optical control layer, not a decorative glassmorphism card.

- It should feel like a polished lens floating just above the WebGPU motion field.
- At rest it should be restrained: mostly transparent, with visible depth at the edge, slight tint, and quiet surface tension.
- On pointer / scroll, it should reveal itself through a specular response, edge dispersion, and a local lensing bend.
- The material must preserve the portfolio identity: dark editorial motion system, amber/route accent, precise typography.
- The nav must read as functional chrome first. The effect supports hierarchy; it must not become the hero.

### Global Nav Target

The global nav rail should be a clean optical strip that protects readability without turning into a dirty full-width banner.

- Text and controls (`HOME`, `EXPERIMENTS`, `JOURNAL`, `CONTACT`, language switcher, film/audio controls when present) must remain crisp.
- The rail must not wash the viewport with pastel cyan/magenta/pink bands.
- The rail must not look like a stretched screenshot smear, static gradient, or translucent beige/gray slab.
- Lensing should be most visible at the top/bottom edges and around pointer movement, not uniformly across the entire 60px nav height.
- Chromatic aberration should be subtle and edge-bound. If it is visible across the whole nav fill, it is too strong.
- Specular response should be a sharp, controlled highlight, not a foggy glow.

### Motion HUD Conflict Rule

The motion-dot HUD / hotkey text must never visually sit underneath the global nav.

If HUD text is visible through the nav band, the implementation fails Gate 1. Fix the layer relationship before tuning the shader:

- Preferred: move or suppress the motion-dot HUD in the global nav band for portfolio routes.
- Acceptable: reserve the nav band so motion HUD starts below it.
- Not acceptable: cover HUD bleed with a muddy translucent GPU strip.

### Experiments Index Target

The `/experiments` index glass should frame the row group as a rail, not convert the work list into glass cards.

- The row group may have a subtle lens field behind it.
- Individual rows should stay typographic and scan-friendly.
- The row separators should catch light lightly; they should not become neon dividers.
- The three work accents should remain legible and not be recolored into one generic tint.

### Explicit Anti-Targets

Reject the implementation if it produces any of the following:

- A smeared horizontal rainbow/pastel strip across the nav.
- A gray/green/red dirty band that looks like corrupted blur.
- Motion-dot HUD text readable behind the nav rail.
- Nav text losing contrast because the shader is brighter than the UI.
- Full-surface chromatic noise instead of edge dispersion.
- Static gradient pretending to be refraction.
- White border/shadow-only glassmorphism.
- Content cards broadly converted to glass.
- Any route where the material competes with reading the page.

## Architecture

Add a shared Liquid Glass feature under `apps/web/src/features/liquid-glass/`.

Core components:

- `LiquidGlassProvider`
  - mounted inside `apps/web/src/app/[locale]/layout.tsx`
  - owns registered surfaces
  - owns viewport / pointer / scroll / route accent state
  - renders one fixed full-viewport WebGPU canvas
- `GpuGlassLayer`
  - client-only WebGPU renderer
  - creates adapter/device/context/pipeline
  - draws all registered surfaces with one shader and per-surface uniforms
  - must clean up animation frame, listeners, and GPU device
- `LiquidGlassSurface`
  - wraps DOM regions and registers measured rect/radius/intensity/tint
  - does not replace links/buttons/nav semantics

Uniforms:

- viewport size
- DPR, capped conservatively
- pointer position
- scroll velocity
- reduced-motion preference
- current route accent
- surface rect, radius, intensity, brightness, kind

DOM content cannot be sampled directly as a texture. Therefore v1 approximates optical behavior procedurally using measured rects, route accent, pointer/scroll motion, and the existing motion scene underneath.

## Shader Requirements

The WebGPU shader must visibly do things CSS cannot:

- rounded-rect SDF masks
- procedural lensing/refraction field
- cyan/magenta edge dispersion
- pointer-reactive specular highlight
- scroll-reactive specular sweep or energy kick
- route/accent-aware tint and contrast
- edge darkening / rim lighting / surface depth
- reduced motion freezes or heavily damps animation drift

Do not use CSS `backdrop-filter` as the primary effect.

## Initial Surfaces

1. Global nav rail
   - file: `apps/web/src/shared/components/Nav.tsx`
   - register one full-width nav surface
   - keep `<nav>`, links, language switcher, menu button, `aria-current`, `aria-expanded`
2. Mobile nav panel
   - same file
   - register only when panel is open
   - keep overlay click-to-close and body overflow lock behavior
3. `/experiments` index rail / row group
   - file: `apps/web/src/app/[locale]/experiments/page.tsx`
   - register the row group first
   - do not register every row until the group surface passes visual QA

Do not add glass everywhere. Do not make content cards all glass.

## Page-Gated Rollout

### Gate 0: Foundation

- Add provider, surface API, WebGPU renderer, WGSL shader, lifecycle cleanup.
- Mount provider in locale layout.
- Confirm typecheck has no new errors.

### Gate 1: `/`

- Apply only global nav rail.
- Browser QA:
  - nav remains readable
  - hero remains readable
  - motion-dot HUD does not show through the nav band
  - no smeared horizontal rainbow/pastel band
  - GPU canvas exists
  - material shows lensing / edge dispersion / motion-reactive highlight
  - no console errors or WebGPU validation warnings

### Gate 2: `/experiments`

- Add experiments index rail/row group.
- Browser QA:
  - rows remain readable
  - links remain clickable
  - material does not flatten the motion background
  - no console errors

### Gate 3: `/experiments/dot`, `/experiments/grid`, `/experiments/flow`

- Readability and conflict pass.
- Confirm glass overlay does not fight standalone experiment canvases, headers, or HUD/control surfaces.

### Gate 4: `/journal`, `/contact`, `/photography`, `/filmtone/privacy`

- Readability pass only unless a surface is clearly stable enough to register.
- Do not expand visual scope just to use the new component.

## Verification

Run from repo root:

```bash
git diff --check
apps/web/node_modules/.bin/tsc --noEmit -p apps/web --pretty false
bun run --cwd apps/web lint -- src/features/liquid-glass src/shared/components/Nav.tsx 'src/app/[locale]/experiments/page.tsx'
```

Allowed typecheck baseline:

```text
apps/web/src/features/interactive/film-lab/params-codec.test.ts:87
```

Browser QA:

- Start dev server with `bun run dev:web`.
- If `.next/dev/lock` is stale and no server is running, remove the stale lock and run `bun run --cwd apps/web dev`.
- Check:
  - `/`
  - `/experiments`
  - `/experiments/dot`
  - `/experiments/grid`
  - `/experiments/flow`
  - `/journal`
  - `/contact`
  - `/photography`
  - `/filmtone/privacy`
- Capture screenshots under `output/playwright/`.
- Record console errors/warnings, especially WebGPU validation output.

## Out Of Scope

- iOS work
- desktop app work
- Filmtone brand assets
- terminology streams
- deploy / Vercel release
- broad design refactors
- CSS-only glass fallback
- WebGL fallback

## Implementation Chat Prompt

Use this prompt to start the implementation chat:

```text
You are implementing the GPU Liquid Glass package for the portfolio app.

Target repo:
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio

Source of truth:
docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md

Adoption rules:
docs/renewal-2026/liquid-glass-adoption-rules-2026-04-26.md

Implement a WebGPU-only Liquid Glass material for apps/web. Do not create WebGL fallback or CSS imitation fallback. If WebGPU is unavailable, do not fake the material with backdrop-filter; keep semantic DOM usable and preserve the explicit unsupported posture.

Important workflow:
1. Inspect current git status first. The worktree is dirty. Do not revert unrelated Filmtone/iOS/desktop/brand/reference-work changes.
2. There may already be partial liquid-glass implementation files from a prior interrupted chat. Inspect them carefully. Keep only what satisfies the plan, fix what is wrong, and do not assume the partial shader is valid until browser QA proves it.
3. Implement page-gated:
   - Gate 0: shared provider + WebGPU layer + surface registration.
   - Gate 1: global nav rail on /.
   - Gate 2: /experiments row group/rail surface.
   - Gate 3: readability/conflict pass on /experiments/dot, /experiments/grid, /experiments/flow.
   - Gate 4: readability pass on /journal, /contact, /photography, /filmtone/privacy.
4. Do not add glass everywhere. Do not make content cards all glass.
5. Keep nav semantic HTML and accessibility behavior intact.
6. Treat visual quality as the main gate. A technically working shader is a failure if it looks like a smeared pastel/rainbow nav band or if motion-dot HUD text is visible under the nav.
7. Before registering any surface, apply the Liquid Glass Adoption Rules decision test. Liquid Glass is for functional chrome, not content styling.

Implementation requirements:
- Add LiquidGlassProvider / GpuGlassLayer / LiquidGlassSurface under apps/web/src/features/liquid-glass.
- Mount the provider in apps/web/src/app/[locale]/layout.tsx inside the existing app provider tree.
- Register surfaces in apps/web/src/shared/components/Nav.tsx and apps/web/src/app/[locale]/experiments/page.tsx.
- Shader must include rounded-rect SDF, procedural lensing/refraction, subtle cyan/magenta edge dispersion, pointer/scroll-reactive specular response, route/accent-aware tint/contrast, edge depth, and reduced-motion damping.
- Avoid CSS backdrop-filter as the primary effect.
- The GPU overlay canvas must be fixed full viewport, pointer-events none, above the motion background, and below/behind functional DOM content so links/buttons remain usable.
- The target look is a restrained dark optical control layer: crisp typography, edge-bound dispersion, local pointer/scroll highlight, no full-width color smear.
- Before expanding beyond `/`, solve the motion-dot HUD/nav conflict. HUD/hotkey text must not be visible through the nav rail.

Verification:
- git diff --check
- apps/web/node_modules/.bin/tsc --noEmit -p apps/web --pretty false
  Only apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 may remain.
- bun run --cwd apps/web lint -- src/features/liquid-glass src/shared/components/Nav.tsx 'src/app/[locale]/experiments/page.tsx'
- Browser QA with console open on:
  /, /experiments, /experiments/dot, /experiments/grid, /experiments/flow, /journal, /contact, /photography, /filmtone/privacy
- Capture screenshots under output/playwright/.
- Report GPU architecture, why CSS fallback was not used, shader/material behaviors, affected routes, no-fallback behavior, browser QA/console results, git diff --check, and typecheck results.

Do not deploy.
```
