# Liquid Glass HUD Redesign Handoff - 2026-04-27 JST

このドキュメントは、次チャットで `motion-dot` HUD / control 群を Apple Liquid Glass として再設計するための完全引き継ぎです。

重要: 次チャットでは、旧 `docs/renewal-2026/2026-04-27-liquid-glass-nav-work-plan.md` だけを正本にしないこと。旧 work plan は作業途中の計画で、`Latest commit` など一部が古い。本ドキュメントを最初に読む。

## 0. 現在位置

| 項目 | 内容 |
|---|---|
| Repository | `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` |
| Branch | `feat/renewal-2026-phase2-motion-dot` |
| Current HEAD | `a7c5fe43 fix(renewal): restore liquid glass nav content layering` |
| HEAD status | `origin/feat/renewal-2026-phase2-motion-dot` より `ahead 11` |
| Active route during visual checks | `http://localhost:3000/journal` |
| Next task | Phase B: `motion-dot` HUD / controls の redesign-first Liquid Glass 化 |
| Critical correction | 現状 HUD の見た目をそのまま透明化するタスクではない。情報設計、サイズ、配置、レイヤー設計を刷新した上で Apple Liquid Glass material / interaction へ置き換えるタスク。 |

## 1. このチャットで起きたこと

### 1.1 元の依頼

ユーザーは次の work plan を提示した。

`docs/renewal-2026/2026-04-27-liquid-glass-nav-work-plan.md`

その上で以下の方針を指定した。

- 本質の進行を最優先
- 外殻の QA は「すべてがうまく行った時の品質保証」に限定
- 思考すべきところは `sequential-thinking`
- わからない場合は検索または質問
- Agent Teams で進める
- 推奨タイミングで次チャットに引き継ぐ

### 1.2 誤読と修正

最初に Phase A の境界問題修正を「実装してよい」と誤読して実装を進めた。ユーザーから「計画段階だった」と指摘が入り、巻き戻しを申し出た。

その後、ユーザーが現状スクリーンショットを提示し、メニュー文字やアイコンが消えていることを確認。「最短で直せるなら巻き戻し不要」とされたため、巻き戻しではなく実修正に切り替えた。

### 1.3 Phase A の実修正

Phase A の目的は、menu open 時に scrim 右端と panel 左端の間へ硬い縦帯が出る問題の解消。

採用した z-order:

```text
z=-10   motion-dot canvas
z=0     page HTML
z=1090  full viewport scrim, CSS backdrop-filter
z=1200  LiquidGlassFrontChrome canvas, front Liquid Glass material
z=1210  nav hit/icon layer
z=1300  panel content DOM
```

確定した修正:

- `LiquidGlassFrontChrome` を `--z-nav-front-glass: 1200` に移動
- scrim を full viewport に戻し、`--z-nav-panel-scrim: 1090`
- nav icon / hit layer を `--z-nav-hit: 1210` にして front glass より上へ
- panel content DOM を `--z-nav-panel-content: 1300`
- open menu の wrapper `fixed inset-0` が stacking context を作り、panel content が canvas の背面に閉じ込められていたため、scrim と panel を root fixed siblings に分離
- open menu 中の左上 brand icon は表示だけ残し、pointer events は scrim に通す
- sheet 外形は品質優先で軽くした:
  - `top/right/bottom: 32px`
  - `width: min(360px, calc(100vw - 4rem))`

コミット:

```bash
a7c5fe43 fix(renewal): restore liquid glass nav content layering
```

コミット対象:

- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx`
- `apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx`
- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`
- `apps/web/src/features/liquid-glass/compose-factory.ts`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`
- `apps/web/src/shared/components/Nav.tsx`

### 1.4 Phase A の検証結果

実施済み:

```bash
bun run --cwd apps/web lint -- src/features/liquid-glass src/shared/components/Nav.tsx 'src/app/[locale]/(portfolio)/layout.tsx'
git diff --check
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false
```

結果:

- scoped lint: pass
- `git diff --check`: pass
- TypeScript: 既知 baseline のみ

既知 baseline:

```text
apps/web/src/features/interactive/film-lab/params-codec.test.ts(87,34): error TS2352
```

ブラウザ確認:

- `/journal` で menu content / close icon / left brand icon の表示復帰を確認
- hit-test で panel title / close が最前面、left brand click は scrim に落ちることを確認
- sheet は `360px` 幅、`32px` inset の軽い accessory sheet として確認済み

## 2. 現在の関連コード状態

### 2.1 `layout.tsx`

ファイル:

`apps/web/src/app/[locale]/(portfolio)/layout.tsx`

現在の layer contract:

```css
--z-motion-hud: 20;
--z-motion-hud-panel: 30;
--z-nav-panel-scrim: 1090;
--z-nav-front-glass: 1200;
--z-nav-hit: 1210;
--z-nav-panel-content: 1300;
--z-nav-visual: var(--z-nav-front-glass);
--z-nav-panel: var(--z-nav-panel-content);
```

注意:

- `--z-nav-visual` と `--z-nav-panel` は互換 alias として残っている。
- `--z-motion-hud` はまだ `20` なので、現在の motion-dot HUD は front canvas より下にいる。
- Phase B で HUD text を front glass より上に出すなら、新しい text/content z 変数が必要。

### 2.2 `Nav.tsx`

ファイル:

`apps/web/src/shared/components/Nav.tsx`

現在の重要点:

- `document.body.style.overflow = isMenuOpen ? "hidden" : ""`
- menu open 時:
  - scrim: `fixed inset-0`, z `--z-nav-panel-scrim`
  - panel: `fixed bottom-8 right-8 top-8`, width `min(360px, calc(100vw - 4rem))`, z `--z-nav-panel-content`
  - panel は `LiquidGlassSurface surfaceId="nav.panel" kind="panel"`
  - left brand link は `isMenuOpen ? pointer-events-none : pointer-events-auto`

Phase B で追加すべき可能性:

- menu open 状態を `document.documentElement.dataset.navMenuOpen` などに反映し、HUD overlay を open menu 中に隠す。

### 2.3 `MotionStageProvider.tsx`

ファイル:

`apps/web/src/features/motion/MotionStageProvider.tsx`

現在:

```tsx
<div
  ref={overlayRef}
  aria-hidden="true"
  className="pointer-events-none fixed inset-0"
  style={{ zIndex: "var(--z-motion-hud, 20)" }}
/>
```

意味:

- motion-dot が生成する HUD / controls はこの overlay に入る。
- 現在は `z=20` なので menu scrim / front glass / panel より下。
- Phase B で control surfaces を front canvas に描く場合、HUD DOM text/buttons を front canvas より上にしないと文字が隠れる。
- ただし、単純に `z=1210` へ上げると open menu 中に HUD が scrim 上へ漏れる。

推奨:

- overlay に stable class を付ける:
  - `className="motion-stage-hud-overlay pointer-events-none fixed inset-0"`
- z を text/content 用に分離:
  - `style={{ zIndex: "var(--z-motion-hud-content, 1210)" }}`
- root CSS:
  - `:root[data-nav-menu-open="true"] .motion-stage-hud-overlay { display: none; }`

### 2.4 `LiquidGlassFrontChrome.tsx`

ファイル:

`apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx`

現在:

```tsx
style={{ zIndex: "var(--z-nav-front-glass, 1200)" }}
```

意味:

- front canvas は scrim より上。
- nav / panel / future control glass material を描く場所。
- `pointer-events-none` なので DOM hit layer で操作する。

### 2.5 `LiquidGlassProvider.tsx`

ファイル:

`apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`

現在:

- React owned `LiquidGlassSurface` は context の `registerSurface()` で登録される。
- `kind` は `nav | panel | rail | control`。
- `SURFACE_KIND_ID.control = 3` は既にある。
- まだ MutationObserver / querySelectorAll で non-React DOM controls を拾う処理はない。

Phase B 推奨:

- React nav surfaces と重複しないよう、scan 対象は専用属性に限定する。
- 例:

```ts
const CONTROL_SELECTOR = "[data-liquid-glass-control]";
```

または:

```ts
const CONTROL_SELECTOR = '[data-liquid-glass-surface^="control."]';
```

ただし `LiquidGlassSurface` も `data-liquid-glass-surface` を出すため、重複登録に注意。より安全なのは `data-liquid-glass-control="control.<id>"` の専用属性。

### 2.6 `compose-factory.ts` / `composite.ts`

ファイル:

- `apps/web/src/features/liquid-glass/compose-factory.ts`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`

現在:

```ts
const FRONT_KINDS = new Set([0, 1, 3]); // "nav", "panel", "control"
export const LIQUID_GLASS_MAX_SURFACES = 16;
```

重要リスク:

- `control` は front canvas 描画対象として既に入っている。
- ただし surface 最大数 `16` は不足する可能性が高い。
- hotkey legend 10個 + HUD + film + audio + nav brand + nav menu + panel で 16 を超える。
- `buildDrawList()` は現在 `state.surfaces.length` を先に `LIQUID_GLASS_MAX_SURFACES` へ clamp してから kind filter するため、登録順によって front control が落ちるリスクがある。

Phase B 推奨:

1. `LIQUID_GLASS_MAX_SURFACES` を最低 `32`、できれば `48` に上げる。
2. `buildDrawList()` は「全 surfaces を走査し、kind/visibility/viewport filter 後に slot 上限で止める」形に直す。

## 3. 現在の dirty worktree 注意

2026-04-27 01:xx JST 時点で、関連 nav/motion files は HEAD に入っているが、repo 全体には別作業の未コミット変更が多数ある。

代表例:

- `.claude/settings.local.json`
- `apps/web/src/app/[locale]/(portfolio)/experiments/flow/client.tsx`
- `apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx`
- `apps/web/src/app/[locale]/(portfolio)/experiments/page.tsx`
- `bun.lock`
- `packages/motion-flow/*`
- `packages/motion-grid/*`
- `docs/renewal-2026/2026-04-27-liquid-glass-nav-work-plan.md` は untracked
- `output/playwright/*` も untracked

次チャットでは絶対に `git reset --hard` や広範囲 checkout をしないこと。ユーザー作業の可能性がある。

Phase B で触る候補は以下に限定するのがよい。

- `packages/motion-dot/src/ui/hud.ts`
- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`
- `apps/web/src/features/liquid-glass/compose-factory.ts`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`
- `apps/web/src/features/motion/MotionStageProvider.tsx`
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx`
- `apps/web/src/shared/components/Nav.tsx`
- 必要なら docs handoff

## 4. Phase B の正しい認識

ユーザー確認済み:

「現状デザインのまま Liquid Glass に置き換える」のではない。

正しいタスク:

> motion-dot HUD / control 群の情報設計、サイズ、配置、レイヤー設計を刷新した上で、Apple Liquid Glass の material / interaction として再構成する。

つまり以下は不十分:

- 既存 `rgba(20,20,22,0.92)` を透明化するだけ
- 既存 hotkey legend chip をそのままガラス化するだけ
- 現在の右下 hotkey cluster をそのまま維持するだけ
- 黒ピルを薄い白ピルに置換するだけ

期待される方向:

- nav sheet と同じ Liquid Glass system に統合
- motion-dot の control affordance を「必要なときだけ現れる軽い control surface」として再設計
- controls は motion-dot の作品性を邪魔せず、front Liquid Glass material として浮く
- text/icon DOM は glass canvas より上で鮮明
- menu open 中は HUD controls が scrim / sheet に漏れない
- `motion-dot` の raw dark pill 感を排除

## 5. Phase B の現状対象

### 5.1 `packages/motion-dot/src/ui/hud.ts`

現状の solid backgrounds:

- `createFilmToggleButton()`:
  - `background: "rgba(20,20,22,0.92)"`
- `createAudioSettingsButton()`:
  - `background: "rgba(20,20,22,0.92)"`
- `createSourceButton()`:
  - `background: "rgba(255,255,255,0.06)"`
- `createAudioSettingsPanel()` root:
  - `background: "rgba(16,16,18,0.95)"`
- `refreshButton`, `actionButton`
- `createHotkeyLegend()` chip/key backgrounds
- update functions rewrite backgrounds:
  - `updateFilmToggleButton()`
  - `updateAudioSettingsButton()`
  - `setSourceButtonState()`

Existing controls:

- HUD text/counter: `[1/16] Orbit - Raw`
- Film toggle button
- Audio panel button
- Audio settings panel
- Hotkey legend:
  - Scene
  - Single
  - Options
  - Reset
  - Film
  - Transit
  - Audio
  - Gallery
  - Panel
  - File

### 5.2 Design target for Phase B

Do not preserve old layout blindly. Suggested redesign:

1. Replace bottom-right hotkey cluster with a compact glass control dock.
   - Favor fewer visible controls by default.
   - Show high-value controls, not every hotkey as equal pill.
   - Consider progressive disclosure: primary controls + options reveal.

2. Move status/counter into a lightweight glass label.
   - Smaller, editorial, readable over motion-dot.
   - Avoid gray opaque pill.

3. Film / Audio / Gallery / Panel should become icon/text micro controls.
   - Liquid Glass surface behind each or behind a grouped dock.
   - DOM text/icons above front canvas.

4. Audio settings panel needs a separate treatment.
   - Either not in first slice, or redesigned as a compact glass popover.
   - Do not leave opaque dark root if the task claims all controls are Liquid Glass.

5. Menu open isolation.
   - When global nav menu opens, HUD/control layer should disappear or sit below scrim.
   - Since control glass is drawn on front canvas at z=1200, it can leak over scrim unless controls are deregistered/hidden or draw-disabled during menu open.

## 6. Recommended implementation plan

### Slice 1 - establish safe layer and registration plumbing

Files:

- `apps/web/src/shared/components/Nav.tsx`
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx`
- `apps/web/src/features/motion/MotionStageProvider.tsx`
- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx`
- `apps/web/src/features/liquid-glass/compose-factory.ts`
- `apps/web/src/features/liquid-glass/shaders/composite.ts`

Steps:

1. In `Nav.tsx`, extend the existing menu-open effect:

```ts
useEffect(() => {
  document.body.style.overflow = isMenuOpen ? "hidden" : "";
  document.documentElement.toggleAttribute("data-nav-menu-open", isMenuOpen);
  return () => {
    document.body.style.overflow = "";
    document.documentElement.removeAttribute("data-nav-menu-open");
  };
}, [isMenuOpen]);
```

2. In `MotionStageProvider.tsx`, add class and z:

```tsx
className="motion-stage-hud-overlay pointer-events-none fixed inset-0"
style={{ zIndex: "var(--z-motion-hud-content, 1210)" }}
```

3. In `layout.tsx`, add:

```css
--z-motion-hud-content: 1210;
:root[data-nav-menu-open] .motion-stage-hud-overlay { display: none; }
```

4. In `composite.ts`, raise surface capacity:

```ts
export const LIQUID_GLASS_MAX_SURFACES = 48;
```

5. In `compose-factory.ts`, revise `buildDrawList()` so it iterates all surfaces and only stops when `slot >= LIQUID_GLASS_MAX_SURFACES` after kind/visibility filters.

6. In `LiquidGlassProvider.tsx`, add MutationObserver for non-React controls.
   - Prefer dedicated attr: `data-liquid-glass-control`
   - Parse:
     - `data-liquid-glass-radius`
     - `data-liquid-glass-intensity`
     - `data-liquid-glass-brightness`
     - `data-liquid-glass-tint`
   - Register with `kind: "control"`
   - Clean up stale registrations when nodes disappear

### Slice 2 - redesign HUD/control DOM in `packages/motion-dot/src/ui/hud.ts`

Do this after Slice 1 works.

Recommended primitives:

```ts
function markLiquidGlassControl(
  element: HTMLElement,
  id: string,
  options?: {
    radius?: number;
    intensity?: number;
    brightness?: number;
    tint?: string;
  },
): HTMLElement {
  element.dataset.liquidGlassControl = `control.${id}`;
  if (options?.radius !== undefined) element.dataset.liquidGlassRadius = String(options.radius);
  if (options?.intensity !== undefined) element.dataset.liquidGlassIntensity = String(options.intensity);
  if (options?.brightness !== undefined) element.dataset.liquidGlassBrightness = String(options.brightness);
  if (options?.tint) element.dataset.liquidGlassTint = options.tint;
  return element;
}
```

Design treatment:

- Use transparent backgrounds on DOM controls.
- Keep text/icon color and focus outlines.
- Remove box shadows that fight the glass material.
- Replace large black pill density with a smaller dock / label system.
- If keeping hotkey legend visible, register one grouped surface for the dock instead of ten individual chips to reduce surface count and improve coherence.

### Slice 3 - visual verification

Use Browser / in-app browser on:

- `/journal`
- `/experiments`
- `/`

Checks:

- HUD controls are visible and readable when menu closed.
- HUD controls do not leak above global menu scrim/sheet when menu open.
- No hard black pills remain in visible HUD/control areas.
- Liquid Glass material is visible behind controls.
- nav sheet remains as committed in `a7c5fe43`.
- console errors / WebGPU validation warnings: 0.

## 7. Commands and baselines

Use Bun. Root has no `lint` script, so do not run `bun lint` from root.

Use:

```bash
bun run --cwd apps/web lint -- src/features/liquid-glass src/features/motion src/shared/components/Nav.tsx 'src/app/[locale]/(portfolio)/layout.tsx'
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false
git diff --check
```

Known TypeScript baseline:

```text
apps/web/src/features/interactive/film-lab/params-codec.test.ts(87,34): error TS2352
```

If additional TypeScript errors appear in touched files, fix them.

Forbidden anti-targets:

- `html2canvas`
- `getDisplayMedia`
- `captureStream`
- `drawImage`
- WebGL fallback

DOM capture remains forbidden. Sampling motion-dot offscreen GPU texture is allowed because it is internal GPU RT access over shared device.

## 8. Known risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| HUD text hidden behind front canvas | control glass is drawn at z=1200 | raise HUD DOM content to `--z-motion-hud-content: 1210` |
| HUD leaks over menu | raised HUD DOM/content or front control glass can sit above scrim | `data-nav-menu-open` should hide HUD overlay and deregister/skip controls if needed |
| Surface cap drops controls | existing cap is 16 | raise to 48 and filter before cap |
| Duplicate registrations | React `LiquidGlassSurface` already emits `data-liquid-glass-surface` | use dedicated `data-liquid-glass-control` for non-React HUD |
| Audio panel remains opaque | old panel root is `rgba(16,16,18,0.95)` | either include panel in redesign slice or explicitly mark as out of first slice |
| Existing dirty worktree | unrelated user changes exist | only touch scoped files; no reset/checkout |

## 9. Suggested acceptance criteria for Phase B

- [ ] Visible `motion-dot` control UI no longer reads as solid dark generic pill UI.
- [ ] HUD/control layout is redesigned, not merely recolored.
- [ ] Apple Liquid Glass material is generated through the existing front canvas path.
- [ ] DOM labels/icons are crisp above glass.
- [ ] Global nav menu open hides or suppresses HUD/control layer cleanly.
- [ ] No DOM capture or WebGL fallback introduced.
- [ ] Surface count handles all active nav + panel + controls.
- [ ] `/journal`, `/experiments`, `/` checked in browser.
- [ ] scoped lint passes.
- [ ] Typecheck has only the known `params-codec.test.ts:87` baseline.

## 10. High-Precision Handoff Prompt for the Next Chat

Use this prompt verbatim in the next chat:

```text
Repository:
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio

Start by reading:
1. docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md
2. docs/renewal-2026/2026-04-27-liquid-glass-nav-work-plan.md
3. Current code in:
   - apps/web/src/shared/components/Nav.tsx
   - apps/web/src/app/[locale]/(portfolio)/layout.tsx
   - apps/web/src/features/motion/MotionStageProvider.tsx
   - apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx
   - apps/web/src/features/liquid-glass/compose-factory.ts
   - apps/web/src/features/liquid-glass/shaders/composite.ts
   - packages/motion-dot/src/ui/hud.ts

Context:
Current HEAD is a7c5fe43 fix(renewal): restore liquid glass nav content layering.
Phase A nav/sheet boundary and z-order are committed. Do not revert it.
There are unrelated dirty/untracked files in the worktree. Do not reset, checkout, or clean them.

Task:
Implement Phase B, but with the corrected product understanding:
This is NOT a task to keep the current motion-dot HUD design and merely replace opaque dark pills with transparent Liquid Glass. Redesign the motion-dot HUD/control system first, then implement it as Apple Liquid Glass controls using the existing front canvas material path.

Required approach:
- Use sequential-thinking for design/architecture decisions.
- Use Agent Teams/subagents only for bounded independent inspection if helpful.
- Prioritize product quality over conservative minimalism.
- Keep implementation scoped to the files needed for Phase B.
- Do not introduce DOM capture APIs: html2canvas, getDisplayMedia, captureStream, drawImage.
- Do not introduce WebGL fallback.
- Prefer the existing WebGPU shared-device/front-canvas Liquid Glass path.

Current z contract:
- motion-dot canvas: z=-10
- page HTML: z=0
- nav scrim: --z-nav-panel-scrim: 1090
- LiquidGlassFrontChrome canvas: --z-nav-front-glass: 1200
- nav hit/icon layer: --z-nav-hit: 1210
- nav panel content: --z-nav-panel-content: 1300
- motion HUD overlay is still --z-motion-hud: 20 and must be redesigned for Phase B

Implement in this order:
1. Add a menu-open root signal in Nav.tsx, e.g. document.documentElement data-nav-menu-open.
2. Add a stable class to MotionStageProvider HUD overlay and introduce --z-motion-hud-content: 1210, while hiding the HUD overlay when data-nav-menu-open is present.
3. Add non-React HUD control registration in LiquidGlassProvider using a dedicated data-liquid-glass-control attribute and MutationObserver.
4. Raise LIQUID_GLASS_MAX_SURFACES to at least 48 and fix buildDrawList so filtering happens before the cap blocks later relevant surfaces.
5. Redesign packages/motion-dot/src/ui/hud.ts controls:
   - remove solid dark pill language
   - introduce smaller, lighter control/dock surfaces
   - mark redesigned controls with data-liquid-glass-control
   - keep labels/icons crisp as DOM above the glass
   - decide explicitly whether the audio settings panel is in this slice; do not accidentally leave it as an opaque dark panel if claiming full HUD conversion
6. Verify in browser on /journal, /experiments, and /.

Validation:
Run:
bun run --cwd apps/web lint -- src/features/liquid-glass src/features/motion src/shared/components/Nav.tsx 'src/app/[locale]/(portfolio)/layout.tsx'
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false
git diff --check

Known TypeScript baseline:
apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 TS2352

Before editing, briefly restate the redesign interpretation and the scoped file plan. If anything is ambiguous, ask before implementation.
```
