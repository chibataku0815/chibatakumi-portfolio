# Liquid Glass Nav Front-Layer Handoff

Created: 2026-04-27 00:01 JST  
Repo: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`  
Branch: `feat/renewal-2026-phase2-motion-dot`  
Primary route under discussion: `http://localhost:3000/journal`

## Executive Summary

This handoff exists because the current chat drifted from the original Liquid Glass architecture. The user explicitly caught that drift:

> "ちょっと待て、リキッドグラスの文脈どこいった"

The next chat must **restore Liquid Glass as the visual/material system**. Do not continue the current generic dark WebGPU menu/chrome direction as final product work.

The real unresolved problem is:

- The portfolio nav was converted into a floating Liquid Glass pill.
- On `/journal`, page HTML and/or motion HUD visuals appeared in front of, or visually over, the nav.
- The user explicitly rejected a hand-wavy explanation that this was merely transparent glass showing underlying content.
- The user then proposed changing the global nav to an opening/closing menu like shadcn/Radix Sheet, or even drawing all UI in WebGPU.
- I implemented a quick generic front WebGPU overlay with dark pills and a black DOM sheet. This made chrome appear above the page but **lost the Liquid Glass design language**. Treat this as an incorrect intermediate spike, not final direction.

Correct next direction:

- Use Sheet/open-close behavior only as an interaction model.
- Keep the visual material as Liquid Glass.
- Prefer architecture where visible persistent nav chrome is rendered in a front GPU layer, while HTML is limited to invisible hit targets and accessibility where possible.
- If visible HTML remains for an opened menu, it must be integrated into a Liquid Glass panel, not a plain black sheet.

## Original Gate 1 Scope

Original task was Liquid Glass ARCH-B Gate 1 for the Next.js portfolio:

- Remove `backdropFilter` / `backdrop-blur-*` from `apps/web/src/shared/components/Nav.tsx`.
- Wrap nav rail with `<LiquidGlassSurface kind="nav">`.
- Update `--motion-hud-top` to `calc(var(--nav-height, 64px) + 16px)`.
- Fix `Nav.tsx` lint baseline for `setState-in-effect`.
- Run browser QA across 16 motion-dot scenes and 9 anti-targets.

Important architecture:

- ARCH-B means Liquid Glass is implemented in the existing motion-dot WebGPU render pipeline.
- `LiquidGlassProvider` registers DOM surface rects.
- `LiquidGlassProvider` installs a compose pass into the existing `motion-dot` mount.
- It intentionally avoids CSS blur/backdrop and avoids page capture.
- Forbidden tokens in this scope include:
  - `backdrop-filter`
  - `webkit-backdrop-filter`
  - `backdrop-blur`
  - `webgl`
  - `html2canvas`
  - `getDisplayMedia`
  - `captureStream`
  - `drawImage`

## User Pivots During The Session

### Pivot 1: Full-width fixed nav was not enough

User feedback:

> ナビが上部固定だとリキッドグラスにした意味が薄いです  
> motion-dotのコントローラーも含めてレイアウトを洗練されたものへ改善してください

Response implemented earlier:

- Converted full-width top rail to a centered floating pill.
- Intended benefit: all four SDF edges visible, Liquid Glass surface reads more clearly.
- Motion-dot HUD/controller styling was stripped of CSS blur and made more solid.

### Pivot 2: Nav was not visually front-most

User repeated:

> ナビがz軸で最前面に表示されてないです

Screenshots showed long motion-dot HUD text and/or page title crossing the nav band.

Initial mistaken diagnosis:

- I suggested the issue was transparent Liquid Glass rail showing underlying content.
- User corrected this as inaccurate:

> Liquid Glass の rail DOM が透明なので、下の journal タイトルが「最前面の nav を透過して」見えている状態ではないです  
> htmlコンポーネントが全面にきています  
> 適当なことを言わないでください

This correction is important. The next chat should treat the defect as a real stacking/layer/composition problem, not as "intended glass transparency."

### Pivot 3: Consider Sheet-like global menu or all-WebGPU UI

User proposed:

- Use a shadcn/Radix Sheet-like open/close global menu.
- The issue may be that HTML components are fighting motion/WebGPU components.
- It may be valid to build all visuals in WebGPU.

Important clarification:

- A Sheet-like global menu is acceptable only as behavior.
- The visual treatment must remain Liquid Glass.
- Fully WebGPU visible UI is directionally valid, but all interaction/a11y/routing still needs a DOM contract or equivalent.

## Current Working Tree State

The working tree is dirty and includes user WIP unrelated to this nav task. Do not revert unrelated files.

Relevant files changed in this chat:

- `apps/web/src/shared/components/Nav.tsx`
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx`
- `apps/web/src/features/motion/MotionStageProvider.tsx`
- `packages/motion-dot/src/ui/hud.ts`
- `bun.lock`

There are also unrelated or parallel WIP changes in:

- `apps/web/src/app/[locale]/(portfolio)/experiments/flow/client.tsx`
- `apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx`
- `apps/web/src/app/[locale]/(portfolio)/experiments/page.tsx`
- `apps/web/src/features/motion/index.ts`
- `packages/motion-dot/src/index.ts`
- `packages/motion-dot/src/main.ts`
- `packages/motion-flow/*`
- `packages/motion-grid/*`
- untracked `apps/web/src/features/liquid-glass/`
- untracked `packages/motion-dot/src/compose-pass.ts`
- other docs/assets under `docs/`, `output/`, `.claude/`, and `apps/web/public/brand/`

Do not run destructive git commands. Do not use `git checkout --` or `git reset --hard`.

## Current File-Level Details

### `apps/web/src/shared/components/Nav.tsx`

Current state is **not final**.

It now contains:

- A hidden/a11y nav hit layer:
  - fixed full-screen `<nav aria-label="Global">`
  - transparent `Link` hit target at top-left
  - transparent menu `button` at top-right
- A `NavChromeLayer` component starting around line 179:
  - creates a front fixed canvas
  - attempts WebGPU rendering for black brand/menu pills
  - falls back to Canvas2D
  - uses a generic WGSL shader named `NAV_CHROME_SHADER`
- A DOM sheet-like menu:
  - plain black right-side `<aside>`
  - visible HTML links and locale switcher

Why this is wrong:

- It solves part of "frontmost" by putting a front canvas at `--z-nav-visual`.
- But it abandons Liquid Glass material.
- The menu is a plain black DOM sheet, not Liquid Glass.
- The persistent chrome is generic dark pill art, not the existing Liquid Glass SDF/lensing/dispersion system.

Useful pieces to salvage:

- The interaction split is directionally useful:
  - visible GPU layer
  - invisible DOM hit/a11y layer
  - route-change closes menu using the React previous-render state pattern
  - Escape closes the menu
- The front canvas layer concept is useful, but it must render Liquid Glass, not generic dark pills.

### `apps/web/src/app/[locale]/(portfolio)/layout.tsx`

Current root vars include:

```tsx
:root {
  --motion-hud-top: calc(var(--nav-height, 64px) + 28px);
  --z-motion-hud: 20;
  --z-motion-hud-panel: 30;
  --z-nav-visual: 1000;
  --z-nav-hit: 1010;
  --z-nav-panel: 1100;
}
```

The `--z-*` layer contract is useful.

But the comment currently says:

> The floating nav owns the top band...

That comment is outdated because nav is no longer a floating Liquid Glass pill in the current spike.

### `apps/web/src/features/motion/MotionStageProvider.tsx`

Current useful changes:

- The motion-dot HUD host has explicit low layer:

```tsx
<div
  ref={overlayRef}
  aria-hidden="true"
  className="pointer-events-none fixed inset-0"
  style={{ zIndex: "var(--z-motion-hud, 20)" }}
/>
```

- `MotionStageVisibilityProvider` / `useMotionStageHidden` was added to stop/restart global motion when experiments mount their own surfaces.
- `setStatus({ kind: "pending" })` was changed to a microtask `publishStatus(...)` to satisfy React `set-state-in-effect` lint.

Potential caution:

- This file already had parallel WIP around experiment route hiding. Verify against user changes before editing.

### `packages/motion-dot/src/ui/hud.ts`

Useful changes:

- CSS blur/backdrop was removed from HUD controls.
- HUD elements now use explicit z-index variables:
  - `HUD_Z_INDEX = "var(--z-motion-hud, 20)"`
  - `HUD_PANEL_Z_INDEX = "var(--z-motion-hud-panel, 30)"`
- Long top-left HUD text was shortened:
  - now writes `[scene/count] Scene -- Raw/Film`
  - hotkey legend text moved to `hud.title`
- HUD top is controlled by `--motion-hud-top`, currently below nav top band.

These changes are mostly consistent with the layer contract and should probably be kept.

### `bun.lock`

`bun.lock` has a small diff adding workspace dependencies under motion packages:

- `webgpu-motion-input`
- `webgpu-motion-ui`
- `webgpu-motion-dom`

This may have been caused by a mistaken `bunx eslint` attempt that resolved dependencies. Inspect before committing. Do not blindly include in the final PR unless the dependency lock update is actually desired.

## Existing Liquid Glass Files And Concepts

Important untracked/modified Liquid Glass files from earlier Gate 1 work:

- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`
- `apps/web/src/features/liquid-glass/types.ts`
- `apps/web/src/features/liquid-glass/index.ts`
- `packages/motion-dot/src/compose-pass.ts`

Known architecture from earlier inspection:

- `LiquidGlassProvider` reads `useMotionStage()`.
- When motion stage is ready, it installs a compose pass on motion-dot's `MountHandle`.
- `LiquidGlassSurface` registers DOM element rects and options in a registry.
- The compose pass packs up to 16 surfaces into a uniform buffer.
- WGSL uses SDF to draw/lens/brighten/dispersion through the registered surfaces.
- The current compose pass renders into the existing motion-dot canvas, which is positioned behind HTML:

```tsx
const DEFAULT_CANVAS_CLASS =
  "fixed inset-0 -z-10 pointer-events-none w-screen h-screen";
```

Critical architectural consequence:

- A Liquid Glass effect rendered only into the `-z-10` motion canvas cannot appear above HTML page content.
- It can only affect the motion substrate behind DOM.
- If the visible nav must be front-most over HTML, either:
  - the Liquid Glass visual layer must be drawn in a front overlay canvas, or
  - the relevant visible page/nav content must also be GPU-rendered in a shared layer, or
  - HTML layout must never physically cross/cover the top nav material.

Do not use forbidden page-capture shortcuts to sample HTML underneath.

## Browser / QA Evidence

Screenshots in:

`output/playwright/2026-04-26-liquid-glass-gate1/`

Existing artifacts:

- `01-home-initial.png`
- `02-scene-next.png`
- `03-scene-2.png`
- `04-scene-3.png`
- `05-scene-3-film-on.png`
- `06-scrolled-700.png`
- `07-journal-scrolled-700.png`
- `08-journal-pointer-on-pill.png`
- `09-nav-frontmost-fixed.png`
- `10-nav-frontmost-wide.png`
- `11-journal-gpu-menu.png`
- `12-journal-webgpu-menu.png`

Interpretation:

- `01` to `08`: earlier floating Liquid Glass pill work.
- `05`: shows long motion-dot HUD text crossing top band.
- `07` / user screenshots: `/journal` exposes the frontmost defect.
- `11` and `12`: current generic WebGPU menu/chrome spike; visually front, but not Liquid Glass context. Do not treat as final quality.

In-app browser final observed state before this handoff:

- URL: `http://localhost:3000/journal`
- Closed state: black WebGPU brand/menu chips top-left/top-right over the page/motion.
- Open state: right-side black DOM menu/sheet.
- Console warnings: 0 after fixing WGSL reserved keyword issues.

## Verification Already Run

Passed:

```bash
bun run lint src/shared/components/Nav.tsx src/features/motion/MotionStageProvider.tsx
```

Passed earlier:

```bash
./apps/web/node_modules/.bin/tsc -p packages/motion-dot/tsconfig.json --noEmit
```

Forbidden-token grep over the directly touched Liquid Glass/nav/HUD files returned no matches:

```bash
rg -n "backdropFilter|backdrop-filter|webkit-backdrop-filter|backdrop-blur|html2canvas|getDisplayMedia|captureStream|drawImage|webgl" \
  apps/web/src/shared/components/Nav.tsx \
  packages/motion-dot/src/ui/hud.ts \
  apps/web/src/features/motion/MotionStageProvider.tsx \
  'apps/web/src/app/[locale]/(portfolio)/layout.tsx'
```

Known pre-existing / unrelated typecheck failure:

```text
src/features/interactive/film-lab/params-codec.test.ts(87,34):
Conversion of type 'Record<string, unknown>' to type 'Params' may be a mistake...
```

This failure is not from the nav work.

## Dev Server State

At handoff time, a dev server was running on:

```text
http://localhost:3000
```

Observed listener:

```text
node PID 9627 TCP *:3000 (LISTEN)
```

If stale/hung:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill <pid>
rm -f apps/web/.next/dev/lock
bun run --cwd apps/web dev
```

## The Main Architectural Correction

Do not continue the generic WebGPU chrome as final.

The corrected Liquid Glass direction should be:

1. Keep the open/close global menu interaction model.
2. Restore Liquid Glass as the visual material.
3. Move persistent visible nav chrome away from ordinary HTML text/background.
4. Use HTML only for:
   - hit targets
   - focus rings, if needed
   - screen reader labels
   - routing events
5. Render visible nav/menu material through Liquid Glass GPU logic.

Important constraint:

- A front overlay canvas cannot truly refract arbitrary HTML behind it unless the HTML is available as a texture.
- The project explicitly forbids capture shortcuts such as `html2canvas`, `getDisplayMedia`, `captureStream`, and `drawImage`.
- Therefore "Liquid Glass over HTML" has only a few valid routes:
  - Render a procedural/self-contained Liquid Glass material in the front overlay. This gives material continuity but not true DOM refraction.
  - Ensure top chrome sits over the motion/WebGPU substrate rather than over arbitrary page text.
  - Move more of the visible page/nav composition into GPU surfaces.
  - Use a real browser compositor/CSS backdrop path, but that contradicts Gate 1 anti-targets and should not be used.

For Gate 1.5, the pragmatic target is likely:

- Front overlay Liquid Glass SDF material for persistent global chrome.
- Invisible DOM hit layer for navigation.
- Open menu as a Liquid Glass panel with a strong enough material/backplate to prevent page HTML visually competing.
- DOM text inside the open panel may remain if it is clearly above the glass panel and does not violate the "visible persistent HTML nav" problem.

## Recommended Next Implementation Plan

### Step 1: Stop the generic WebGPU chrome from becoming final

Either:

- Replace `NavChromeLayer` with a `LiquidGlassFrontChrome` implementation, or
- Temporarily revert `Nav.tsx` toward the previous Liquid Glass pill and then re-apply the open/close interaction model.

Do not ship the current `NAV_CHROME_SHADER` black-pill material as-is.

### Step 2: Keep useful layer contract

Keep or refine:

```css
--z-motion-hud: 20;
--z-motion-hud-panel: 30;
--z-nav-visual: 1000;
--z-nav-hit: 1010;
--z-nav-panel: 1100;
```

Motion HUD should remain below nav visual/hit layers.

### Step 3: Restore Liquid Glass visual material

Use existing Liquid Glass primitives as source of truth:

- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`
- `packages/motion-dot/src/compose-pass.ts`

Possible implementation shape:

- Extract the SDF/material functions from the existing composite shader into a reusable shader module/string.
- Create a front overlay pass/component that renders:
  - compact brand chip
  - menu trigger chip
  - optional open menu panel surface
- Use the same surface option vocabulary:
  - `kind`
  - `radius`
  - `intensity`
  - `brightness`
  - `tint`
- Do not render generic opaque dark pills.

### Step 4: Sheet behavior, Liquid Glass surface

The shadcn/Radix Sheet reference should guide structure:

- trigger
- overlay/scrim
- content panel
- close
- Escape to close
- close on route change

But visual style must be:

- Liquid Glass panel/surface
- not black generic sheet
- no CSS `backdrop-filter`

### Step 5: Browser QA

Must verify:

- `/journal` at normal and wide viewport.
- Page heading/text cannot appear in front of nav material.
- motion-dot HUD is below nav.
- menu trigger is clickable.
- menu opens and closes.
- Escape closes menu.
- route link closes menu.
- console errors/warnings are 0.
- forbidden-token grep remains clean.

Useful commands:

```bash
bun run --cwd apps/web dev
bun run --cwd apps/web lint src/shared/components/Nav.tsx src/features/motion/MotionStageProvider.tsx
./apps/web/node_modules/.bin/tsc -p packages/motion-dot/tsconfig.json --noEmit
rg -n "backdropFilter|backdrop-filter|webkit-backdrop-filter|backdrop-blur|html2canvas|getDisplayMedia|captureStream|drawImage|webgl" \
  apps/web/src/shared/components/Nav.tsx \
  packages/motion-dot/src/ui/hud.ts \
  apps/web/src/features/motion/MotionStageProvider.tsx \
  'apps/web/src/app/[locale]/(portfolio)/layout.tsx'
```

## User Preferences / Operating Constraints

User explicitly wants:

- Product quality over conservative choices.
- Do not prioritize "safe-looking" half measures if they degrade the product.
- Use `sequential-thinking` for reasoning-heavy decisions.
- If unknown, search with Gemini or web search.
- "Agent Teamsで": use parallel agents/tools where useful, especially read-only audits; keep implementation coherent.
- Preserve the ability to continue in a new chat with full context.

Tone/context:

- User is technically sharp and will catch vague or inaccurate explanations.
- Do not say "this is just transparency" unless proven with DOM/compositor evidence.
- Distinguish:
  - z-index/stacking
  - visual transparency
  - GPU canvas placement
  - HTML hit layers
  - true refraction versus procedural glass material

## Specific Mistakes To Avoid Repeating

1. Do not claim the `/journal` issue is only the transparent rail showing content behind it.
2. Do not replace Liquid Glass with generic dark WebGPU pills.
3. Do not treat shadcn Sheet as a visual style. It is only an interaction pattern.
4. Do not use CSS `backdrop-filter` or `backdrop-blur`.
5. Do not use page capture APIs or draw HTML into canvas.
6. Do not revert unrelated user WIP in experiments/grid/flow or package work.
7. Do not assume a higher z-index alone solves a material/compositor problem.

## Highest-Precision Handoff Prompt For Next Chat

Copy/paste the following prompt into the next chat:

```text
Repo: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
Branch: feat/renewal-2026-phase2-motion-dot
Current route to verify: http://localhost:3000/journal
Handoff doc to read first:
docs/renewal-2026/2026-04-27-liquid-glass-nav-front-layer-handoff.md

Task:
Restore the Liquid Glass context for the global nav/menu after the previous chat drifted into a generic WebGPU dark-pill/menu spike.

Important background:
- Original project is Liquid Glass ARCH-B Gate 1.
- Liquid Glass is currently implemented through LiquidGlassProvider + LiquidGlassSurface + a WebGPU compose pass plugged into motion-dot.
- Original anti-targets still apply: no CSS backdrop-filter/backdrop-blur, no html2canvas/getDisplayMedia/captureStream/drawImage, no WebGL path.
- The user reported that on /journal the nav is not visually front-most. Do not explain this away as merely transparent glass showing content behind it; the user explicitly rejected that. Treat it as a real layer/compositor/material problem.
- The user suggested a shadcn/Radix Sheet-like open/close global menu, and also said an all-WebGPU visible UI may be acceptable because HTML components are competing with motion/WebGPU components.
- Use Sheet only as an interaction model. The visible material must remain Liquid Glass.

Current bad intermediate state:
- apps/web/src/shared/components/Nav.tsx now contains a generic NavChromeLayer front WebGPU canvas with dark brand/menu pills and a black DOM sheet.
- This made chrome visible above /journal, but it lost Liquid Glass. Do not continue this as final.
- It is acceptable to salvage the invisible DOM hit/a11y layer, route-change close logic, Escape close behavior, and z-index variables.

Useful current changes:
- packages/motion-dot/src/ui/hud.ts now puts HUD below nav with --z-motion-hud and shortens the long HUD text. Keep unless a better HUD layout is needed.
- apps/web/src/features/motion/MotionStageProvider.tsx now gives the motion HUD host an explicit z-index and supports MotionStageVisibilityProvider. Be careful: this file also overlaps with user WIP.
- apps/web/src/app/[locale]/(portfolio)/layout.tsx defines --z-motion-hud, --z-motion-hud-panel, --z-nav-visual, --z-nav-hit, --z-nav-panel.

Need implement:
1. Replace the generic black NavChromeLayer visual with a Liquid Glass front-layer visual.
2. Keep visible persistent nav/menu chrome out of ordinary HTML. HTML may remain as invisible hit targets and screen-reader labels.
3. Open/close global menu should behave like a Sheet, but visually be a Liquid Glass panel/surface, not a plain black sheet.
4. If true refraction over arbitrary HTML is impossible without forbidden capture APIs, document the limit and implement the best valid Liquid Glass material: front overlay SDF/dispersion/highlight surface that does not rely on forbidden capture.
5. Verify /journal specifically: page title/body and motion HUD must not appear in front of the nav/menu material.

Commands/QA:
- bun run --cwd apps/web dev
- bun run --cwd apps/web lint src/shared/components/Nav.tsx src/features/motion/MotionStageProvider.tsx
- ./apps/web/node_modules/.bin/tsc -p packages/motion-dot/tsconfig.json --noEmit
- rg -n "backdropFilter|backdrop-filter|webkit-backdrop-filter|backdrop-blur|html2canvas|getDisplayMedia|captureStream|drawImage|webgl" apps/web/src/shared/components/Nav.tsx packages/motion-dot/src/ui/hud.ts apps/web/src/features/motion/MotionStageProvider.tsx 'apps/web/src/app/[locale]/(portfolio)/layout.tsx'
- Browser QA with in-app browser or Playwright on http://localhost:3000/journal
- Check console errors/warnings are 0.

Do not:
- Do not use CSS blur/backdrop.
- Do not use page capture APIs.
- Do not revert unrelated dirty files.
- Do not ship generic dark pills as the final answer.
- Do not ignore the Liquid Glass adoption docs:
  docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md
  docs/renewal-2026/liquid-glass-adoption-rules-2026-04-26.md

Expected outcome:
A corrected Liquid Glass nav/menu architecture where the visual chrome is front-most, remains Liquid Glass, and /journal no longer shows HTML or motion HUD visually competing above the nav/menu.
```

