# Renewal 2026 — デプロイ前精査ハンドオフ (2026-04-28 JST)

> **目的**: 次 chat で本ブランチ (`feat/renewal-2026-phase2-motion-dot`, **52 commits ahead of main**) を精査し、本番デプロイする。本ドキュメント単独で経緯・前提・現状・既知リスク・検証手順がすべて再現できるよう作成。
>
> 本 chat の主成果は `/experiments/{grid,flow}` への Apple Liquid Glass 統合とその過程で発見された **複数の致命的 z-stacking バグ** の修正。

---

## 0. 30 秒で読む

- **ブランチ**: `feat/renewal-2026-phase2-motion-dot` (本日 6 commits 追加 → 52 commits ahead of main)
- **本日の到達点**: motion-dot / motion-grid / motion-flow すべてに **本物の Apple Liquid Glass 屈折**を通電。route swap (home ↔ /experiments/grid ↔ /experiments/flow) で stage が追従。
- **前提が破綻していた箇所**:
  1. ハンドオフが想定した「stamp data 属性で完了」は `/experiments/*` で **走るパスが居なかった** (motion-dot 停止のため)
  2. globals.css の `main, section { z-index: 1 }` で全 `<main>` が stacking context に閉じ込められ、HUD が **front canvas に隠されていた**
  3. light substrate 上で**白文字は不可視**、dark ink + light text-shadow が正解
  4. グローバルメニュー hide rule が `.motion-stage-hud-overlay` クラス限定だった
- **未解決リスク**: 後述 §7
- **デプロイ前必須**: 後述 §8 チェックリスト

---

## 1. このセッションの経緯 (時系列)

### 1.1 入力ハンドオフ
`docs/renewal-2026/2026-04-28-motion-grid-flow-liquid-glass-handoff.md` が出発点。要約:
- motion-grid / motion-flow の HUD を motion-dot 同等の Liquid Glass material に乗せる
- 参照実装: `packages/motion-dot/src/ui/hud.ts` の `markLiquidGlassControl()` パターン
- 検証手順: dev server 目視で data 属性 + 屈折確認

### 1.2 調査フェーズで発見した「ハンドオフが嘘」だった点

**Plan agent による独立レビューで判明:**

> `data-liquid-glass-control` を stamp しても `/experiments/*` では合成パスが走らない。`useHideMotionStageOnMount()` が motion-dot を停止し、`LiquidGlassProvider` の compose-pass effect は motion-dot の frame loop 依存。

実コードで裏付け:
- `apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx:26` → `useHideMotionStageOnMount()`
- `apps/web/src/features/motion/MotionStageProvider.tsx:55-65` → `mount.stop()` 呼出
- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx:237-268` → `motionStage.kind !== "ready"` gate
- `packages/motion-grid/src/mount.ts:191-193` (改修前) と `packages/motion-flow/src/mount.ts:136-138` (改修前) → `MountHandle.stop()` のみ露出、`gpu` / `onBeforeFrame` / `setComposePass` 無し

→ 視覚フリップ (擬似ガラス) と本物の合成パス通電の二択。**ユーザー判断「保守的な意見は優先せず、プロダクトの品質を最優先」で本物路線確定**。

### 1.3 ユーザー視点で起きた品質事故 (重要 — 同じ轍を踏まない)

私が「完了」と報告した後にユーザーがスクショで指摘した致命的バグ:

1. **指摘 A**: glass パネル背後にテキストが消える (1 回目)
   - 原因: `globals.css:530` の `main, section { z-index: 1 }` により `<main>` が stacking context、子の overlayRef を z=1210 にしても effective z=1 に閉じ込められて front canvas (z=1200) に隠される
   - 修正: overlayRef を `<main>` の外 (Fragment 直下) に hoist (commit `e795de3f`)

2. **指摘 B**: Nav 鞠 (brand pill / hamburger) と HUD が x/y で被る
   - 原因: HUD top:76 / right:24 が Nav (top:24, 48×48 → bottom:72) と隣接しすぎ、SceneSelector は hamburger と直接衝突
   - 修正: 全 top-anchored HUDs を top:96+ に押し下げ、SceneSelector は top:96 right:24 へ (commit `e795de3f`)

3. **指摘 C**: グローバルメニュー open 時に HUD chips が menu panel と被る
   - 原因: `:root[data-nav-menu-open] .motion-stage-hud-overlay { display: none }` は `.motion-stage-hud-overlay` 限定で route 側 overlay は無関係
   - 修正: route overlay にも同クラス付与 (commit `3b732ca6`)

**学び**:
- MCP screenshot は低解像度でテキスト視認できず誤判定する
- stacking context は親の `position+z-index` 組合せで想定外に発生する (Tailwind `relative` だけなら作らないが、グローバル CSS で z-index が付くと作る)
- light substrate (#d1d1d1) では白文字は完全に消える、dark ink + light text-shadow が必須
- ユーザー実機 (Retina 2x) と MCP browser (1.5x) で異なる症状が出る

---

## 2. アーキテクチャ概要 (現状)

### 2.1 Liquid Glass 3 層モデル (継続)

| 層 | 実体 | 役割 |
|---|---|---|
| **Substrate** | active stage の WebGPU canvas (motion-dot / motion-grid / motion-flow のいずれか) | 屈折される下地 |
| **Front canvas** | `apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx` | substrate texture をサンプリング、glass material を屈折描画 |
| **Surface registration** | `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx` | DOM 要素を glass surface として登録 (React + imperative DOM の 2 経路) |

### 2.2 Active Motion Stage (新規)

```
                 ┌──────────────────────────┐
                 │ ActiveMotionStageContext │  ← apps/web/src/features/motion/ActiveMotionStage.tsx
                 │  { device, format,       │
                 │    onBeforeFrame,        │
                 │    setComposePass }      │
                 └──┬───────────┬───────────┘
        registers   │           │   reads
                    │           │
          ┌─────────┴──┐    ┌───┴────────────┐
          │ MotionStage│    │ LiquidGlass    │
          │ (motion-dot│    │ Provider       │
          │  default)  │    │ + FrontChrome  │
          └────────────┘    └────────────────┘
                    │
          ┌─────────┴──────────────┐
          │ /experiments/grid 入る │
          │  → motion-dot stop()   │  ← MotionStageProvider effect
          │  → setActiveStage(null)│
          │  → motion-grid mount   │  ← ExperimentsGridClient effect
          │  → setActiveStage(grid)│
          │  ↓                     │
          │ LiquidGlassProvider    │
          │  → compose pass を     │
          │    grid.mount に bind  │
          └────────────────────────┘
```

### 2.3 ComposePass トポロジ (motion-dot/grid/flow 共通)

```
scene render → offscreen (rgba16float, persistent)
MotionFilmPostPass → compose-substrate (swap-chain format, persistent)
ComposePass.render → swap chain (with optional front render via frontTarget())
```

`createDefaultBlitPass` がフォールバック (substrate → swap chain pass-through)。LiquidGlassProvider が active stage に対し `setComposePass(liquidGlassPass)` で差し込む。

`@chibatakumi/motion-core/compose` (新規 subpath) に `ComposePass` interface と `createDefaultBlitPass` を集約。motion-dot/grid/flow の sibling-on-sibling 依存を回避。

### 2.4 z-index レイヤー契約 (`(portfolio)/layout.tsx:53` style block)

```
--z-motion-hud: 20                  motion-dot HUD chips ベース
--z-motion-hud-panel: 30            motion-dot audio panel
--z-motion-hud-content: 1210        motion-stage-hud-overlay (motion-dot + experiments routes)
--z-nav-panel-scrim: 1090           full-viewport CSS backdrop scrim
--z-nav-front-glass: 1200           LiquidGlassFrontChrome canvas
--z-nav-hit: 1210                   transparent <Link>/<button> a11y layer
--z-nav-panel-content: 1300         open menu DOM contents
```

**重要**: `globals.css:530-534` の `main, section { position: relative; z-index: 1 }` がグローバルに適用される。これにより `<main>` 内側の z-index は親の stacking context (z=1) に閉じ込められる。**fixed positioned overlays で front canvas より上に出したい場合は `<main>` の外に hoist 必須**。

`:root[data-nav-menu-open] .motion-stage-hud-overlay { display: none }` でグローバルメニュー open 時に HUD overlay を一括非表示。motion-dot の host overlay と experiments routes の overlay 両方がこのクラスを持つ。

---

## 3. 改修した surface 一覧

### 3.1 motion-dot (既存、変更なし — 参照のみ)
| ID | 位置 | radius/intensity/brightness |
|---|---|---|
| `control.status` | bottom: 22, right: 22 | 14 / 0.55 / 0.78 |
| `control.dock` | bottom: 68, right: 22 | 22 / 0.85 / 0.72 |
| `control.hotkeys` | bottom: 136, right: 22 | 20 / 0.80 / 0.74 |
| `control.audio` | bottom: 136, right: 22 | 24 / 0.90 / 0.75 |

### 3.2 motion-grid (本日新規)
| ID | 位置 | radius/intensity/brightness |
|---|---|---|
| `control.grid.status` | top: 96, left: 24 | 14 / 0.55 / 0.78 |
| `control.grid.input` | top: 148, left: 24 (display:none until I キー) | 14 / 0.55 / 0.78 |
| `control.grid.cluster` | bottom: 24, right: 24 (chip 群を内包) | 18 / 0.75 / 0.74 |

### 3.3 motion-flow (本日新規)
| ID | 位置 | radius/intensity/brightness |
|---|---|---|
| `control.flow.overlay` | top: 96, left: 24 | 14 / 0.55 / 0.78 |
| `control.flow.scenes` | top: 96, right: 24 (SceneSelector buttons 内包) | 18 / 0.75 / 0.74 |
| `control.flow.audio` | top: 160, right: 24 | 16 / 0.70 / 0.76 |
| `control.flow.keymap` | bottom: 24, right: 24 (display:none, ? キーで toggle) | 20 / 0.80 / 0.74 |

### 3.4 デザイントークン (light substrate 前提)

```ts
// motion-grid/flow の HUD 共通
inkOnGlass: "rgba(26,26,26,0.92)"            // dark ink — 白文字は light substrate で不可視
inkOnGlassMuted: "rgba(26,26,26,0.66)"
inkOnGlassActive: "rgba(255,255,255,0.98)"   // active 時は inverse highlight (#1a1a1a bg)
bgActiveOverlay: "rgba(26,26,26,0.86)"       // dark active highlight on glass
textShadow: "0 1px 0 rgba(255,255,255,0.55)" // light shadow で emboss
```

font: `'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif'`

---

## 4. コミット一覧 (本セッション 6 件)

```
3b732ca6 fix(experiments): hide route HUD overlay when global menu opens
e795de3f fix(experiments): hoist HUD overlay out of <main> and dodge Nav rail
9e456f1c fix(experiments): lift hostOverlay above LiquidGlassFrontChrome canvas    ← 部分的、e795de3f で完成
146483ef feat(experiments,liquid-glass): route-aware Liquid Glass on /experiments/{grid,flow}
171c353d feat(motion-grid,motion-flow): expose compose-pass plumbing on MountHandle
b8086368 refactor(motion-core,motion-dot): hoist ComposePass to motion-core/compose
```

`9e456f1c` は z-index を 1210 に上げた最初の試み (但し stacking context の罠で効かず)、`e795de3f` で完成。bisect 用に残してある。

### 4.1 変更ファイル一覧

**新規**:
- `packages/motion-core/src/compose/compose-pass.ts` (motion-dot から移植)
- `packages/motion-core/src/compose/index.ts`
- `apps/web/src/features/motion/ActiveMotionStage.tsx`

**修正**:
- `packages/motion-core/package.json` (`./compose` subpath export)
- `packages/motion-dot/src/compose-pass.ts` (motion-core 経由の re-export shim に変更)
- `packages/motion-grid/src/mount.ts` (gpu+setComposePass+onBeforeFrame、frame loop に compose pass 統合)
- `packages/motion-grid/src/index.ts` (compose 型 re-export)
- `packages/motion-grid/src/ui/hud.ts` (markLiquidGlassControl + 3 surface + dark-on-glass token)
- `packages/motion-flow/src/mount.ts` (同上)
- `packages/motion-flow/src/index.ts` (同上)
- `packages/motion-flow/src/ui/hud.ts` (4 surface + vendor atom 後処理 + updateSceneSelector ラッパ)
- `apps/web/src/features/motion/MotionStageProvider.tsx` (active stage 登録/解除)
- `apps/web/src/features/motion/index.ts` (ActiveMotionStage 公開)
- `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx` (useMotionStage → useActiveMotionStage)
- `apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx` (同上)
- `apps/web/src/app/[locale]/(portfolio)/layout.tsx` (`<ActiveMotionStageProvider>` 追加)
- `apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx` (overlayRef を main 外、Nav dodge、active stage 登録、motion-stage-hud-overlay class)
- `apps/web/src/app/[locale]/(portfolio)/experiments/flow/client.tsx` (同上)

---

## 5. 検証済みの動作 (本セッション内)

### 5.1 build / type / lint baseline
```
bunx tsc --noEmit  → 1 error (params-codec.test.ts:87:34) ← pre-existing baseline
bun run lint       → 43 problems (15 errors, 28 warnings) ← pre-existing baseline
bun run build      → green
```

baseline 超えはなし。

### 5.2 視覚 + DOM 検証 (MCP browser, viewport 1280×941, DPR 1.5)

**home (`/ja`)**:
- 4 motion-dot surfaces (status, dock, hotkeys, audio) 登録、bottom-right にガラス pill
- motion-dot 黒ドット背景
- ロゴ pill (top-left), hamburger (top-right) ガラス可視

**`/ja/experiments/grid`**:
- 3 surfaces 登録: control.grid.{status, input, cluster}
- 3 canvas: motion-dot (z=-10, 停止), motion-grid (z=0, active), front overlay (z=1200)
- 2 表示 (input は display:none): status pill (top:96, left:24), cluster (bottom:24, right:24)
- nav.brand / nav.menu と座標的にも DOM 的にも被らない

**`/ja/experiments/flow`**:
- 4 surfaces 登録: control.flow.{overlay, scenes, audio, keymap}
- 同 3 canvas 構成
- 3 表示 (keymap は display:none): overlay (top:96, left:24), scenes (top:96, right:24), audio (top:160, right:24)
- 同上、Nav と無衝突

**stage swap 往復** (home ↔ grid ↔ home ↔ flow ↔ home):
- 各 active stage に追従して compose pass が再 bind
- WebGPU device lost / context lost エラーなし
- DOM stale なし (motion-dot HUDs は stop 時に MutationObserver で detach)
- console error なし

**メニュー open/close**:
- `data-nav-menu-open` 属性付与 → `.motion-stage-hud-overlay` (motion-dot + route 側) が `display: none`
- 閉じると属性消失 → 全 HUDs 復活
- メニュー panel と HUD chips の被りなし

### 5.3 視覚スクショ証跡
`output/playwright/2026-04-28-*.png` (untracked):
- `home-after-zfix.png` — home 完全表示
- `grid-no-overlap.png` — grid 修正完了
- `flow-after-zfix.png` — flow ガラス通電
- `grid-menu-open.png` — メニュー open 時の HUD 非表示確認

---

## 6. 既存コードベースの落とし穴 (次 chat 必読)

### 6.1 `main, section { z-index: 1 }` (globals.css:530-534)
- 全 `<main>` `<section>` が **stacking context** を作る
- 内側の `position: fixed` 子要素の z-index も親の context 内で評価される
- **対策**: front canvas (z=1200) より上に出したい固定要素は `<main>` の外 (Fragment 直下) に置く
- 例: experiments の overlayRef は `<main>` の **兄弟**として配置

### 6.2 motion-dot の MountHandle 拡張 API
motion-dot の MountHandle は `gpu` / `setComposePass` / `onBeforeFrame` を持つ (`packages/motion-dot/src/main.ts:99-130`)。motion-grid / motion-flow も同じ shape に揃えた (本セッション)。

### 6.3 vendor `webgpu-motion-ui` の clobbering
`vendor/webgpu-motion-libs/packages/webgpu-motion-ui/src/scene-selector.ts:110-129` の `updateSceneSelector` は state 変化のたびに button の `background` / `color` / `borderColor` を上書きする。

→ motion-flow 側で `updateSceneSelector` を**ラップ**し、vendor 呼出後に `styleSceneSelectorButtons()` で再上書き。fragile だが vendor 改修より安全。

### 6.4 `useHideMotionStageOnMount()` の挙動
`apps/web/src/features/motion/MotionStageVisibility.tsx` の hidden flag を立てる。MotionStageProvider はこの flag で motion-dot を `mount.stop()` する。但し `setStatus` は呼ばない (前回 ready 状態を保持) → `motionStage.kind === "ready"` のままになる **stale handle 問題**あり。

これが「LiquidGlassProvider が motion-dot に張り付いたまま死ぬ」根本原因だった。**ActiveMotionStage 抽象化により回避**。

### 6.5 light substrate と文字色
motion-dot の HUD は白文字 (`rgba(255,255,255,0.92)`) を使うが、これは motion-dot の **dark dot field がコントラストを生む**前提。motion-grid / motion-flow の `paletteGpuColor("paper") = #d1d1d1` light substrate では白文字は完全に消える。

→ **dark ink + white text-shadow emboss** を採用 (本セッション)。`memory/feedback_*` に書き残す価値あり。

### 6.6 DPR mismatch
- motion-{dot,grid,flow} canvas: `Math.min(window.devicePixelRatio, 1.5)` (vendor `gpu.ts:47`)
- LiquidGlassFrontChrome canvas: `Math.min(window.devicePixelRatio || 1, DPR_CAP=2)`

異なる DPR でも compose-factory の back / front レンダリングがそれぞれの DPR で座標スケールするため動く (`apps/web/src/features/liquid-glass/compose-factory.ts:380-462`)。

### 6.7 stash 残
ハンドオフ §6 で言及された `stash@{0} wip-motion-flow-grid-experiments-wordmark-2026-04-28` は本ブランチの commit と内容重複。**次 chat で確認後 `git stash drop stash@{0}` 推奨**。

---

## 7. 既知リスク・未解決の論点 (デプロイ前判断要)

### 7.1 検証されていないシナリオ

| 項目 | 状態 | 推奨 action |
|---|---|---|
| **Retina 2x (実機) での視覚検証** | MCP は 1.5x で目視。ユーザー指摘で実機 2x の見え方が異なることが判明 | デプロイ前にユーザー実機で全 route 確認 |
| **モバイル viewport (`<720px`)** | HUD 位置 (top:96 等) は desktop 前提。`(max-width: 720px)` で `--rail-height: 56px` に変わるが、HUD 位置の調整未実施 | スマホ実機で `/experiments/{grid,flow}` 確認、HUD overflow なら responsive 化 |
| **input mode (I キー) 実機** | display:none → block の切替を実機テストせず | grid で I キー押下、input overlay の visual 確認 |
| **AudioMeter 実値変化** | tap to start 後の audio reactive が glass 上でどう見えるか | flow で tap to start → 音楽再生 → meter 値の見え方確認 |
| **scene selector 実切替** | vendor clobbering 対策の wrap が複数 scene 切替で機能するか fragile | flow で 1〜7 scene 切替、active state が glass 上で正しく見えるか確認 |
| **WebGPU 非対応ブラウザ** | unsupported banner が出る paths のみ実装、glass 自体の fallback はなし | Safari (WebGPU 限定環境) や WebGPU 非対応ブラウザで unsupported banner 動作確認 |
| **GPUDevice context swap** | home → /experiments/grid → home の round-trip で device 再 configure。leaks/context-lost 監視は未実施 | DevTools Memory + GPU profile で 5-10 往復、leak 確認 |
| **Filmtone / Photography routes** | これらは `(satellite)/layout.tsx` を使い独自 shell。Liquid Glass 影響範囲外だが、本 chat で触っていない | spot check のみ可 |

### 7.2 fragile な実装

1. **vendor `updateSceneSelector` clobbering 対策**: 上流 vendor が `updateSceneSelector` の挙動を変えると壊れる。vendor 更新時要確認 (`packages/motion-flow/src/ui/hud.ts:174-194`)。

2. **HMR 中の active stage handover**: setActiveStage(null) → setActiveStage(grid) の race condition は理論上問題ない設計だが、HMR や Strict Mode double-mount で壊れる可能性。production build では Strict Mode の double-mount は発生しないはず。

3. **`<main>` 内の他コンテンツの z-index**: `(portfolio)` 配下の他ルート (works, journal, contact, photography, filmtone) が `<main>` 内で z-index を使っていれば本セッションの修正で副作用がある可能性。**全ルート目視必須**。

### 7.3 本ブランチ全体の精査 (本日範囲外の 46 commits)

`feat/renewal-2026-phase2-motion-dot` は本日修正分 6 commit を含み計 52 commits ahead of main。本セッションで触っていない以下の commits の動作確認も必要:

```
4c8ce109 docs: reorganize handoff documentation structure
9923c384 chore(brand): filmtone background candidates + 2048 master logo
9de65a58 feat(experiments,hero): wordmark geometry pipeline + R&D playground
85978f74 feat(theme): dark scope token re-resolution for Filmtone/Photography identity
eab48f0c feat(motion-flow,motion-grid): hostOverlay + HUD/input subsystem completion
05e55b18 feat(experiments,contact): typography parity with /journal
9030a567 feat(motion-dot): stack status pill below dock at bottom-right
... (他 39 commits)
```

→ デプロイ前に少なくとも以下を全 route で目視:
- `/`, `/about`, `/contact`, `/craft`, `/journal`, `/works`, `/works/commercial`, `/works/installation`
- `/experiments`, `/experiments/dot`, `/experiments/grid`, `/experiments/flow`, `/experiments/wordmark`
- `/journal/motion-studies/{boiling-poster-aperture,signal-stroke-relay,staged-emphasis-payoff,temporal-echo-residue}`
- `/filmtone/*` (満載: about, atelier, contact, faq, prologue, release-notes, roadmap, signature, support)
- `/photography`
- 言語切替 (en/ja 両方)

---

## 8. デプロイ前必須チェックリスト

### 8.1 コード品質ゲート
- [ ] `cd apps/web && bun run build` → green
- [ ] `cd apps/web && bunx tsc --noEmit` → 1 error baseline (params-codec.test.ts) のみ
- [ ] `cd apps/web && bun run lint` → 43 problems baseline 維持
- [ ] `git status` → 想定外の uncommitted なし
- [ ] `git diff main..HEAD --stat` → 変更範囲をユーザー確認

### 8.2 ローカル実機検証 (Retina 2x 実機推奨)
- [ ] dev server: `cd apps/web && bun run dev`
- [ ] ホーム `/ja` → motion-dot 4 surface ガラス + 黒ドット
- [ ] `/ja/experiments/grid` → 3 surface (status, input [I キー], cluster) + GRID typography
- [ ] `/ja/experiments/flow` → 4 surface (overlay, scenes, audio, keymap [? キー]) + ribbons
- [ ] グローバルメニュー open/close → 全 route で HUD chips が menu と被らない
- [ ] home ↔ grid ↔ flow 5 往復 → WebGPU error なし、glass 追従
- [ ] motion-grid: I キー → input overlay 表示、ESC で消える
- [ ] motion-grid: T/L/F/A/M/H 各キー → chip active 状態が dark inverse highlight に
- [ ] motion-flow: tap to start → audio meter 値変化 + glass 内表示
- [ ] motion-flow: 1-7 scene 切替 + 0 (auto) → SceneSelector active state 切替が glass 上で見える
- [ ] motion-flow: ? キー → keymap glass 表示
- [ ] 全 route の Nav (logomark + hamburger) → 全ルートで動作
- [ ] 全 route の SoundToggleControl → motion-dot routes と experiments routes 両方
- [ ] `/about`, `/contact`, `/craft`, `/journal`, `/works`, `/works/commercial`, `/works/installation` 各 spot check
- [ ] `/journal/motion-studies/*` 4 ページ
- [ ] `/filmtone/*` 全サブルート
- [ ] `/photography`
- [ ] 言語切替 (`en` / `ja`) 全 route

### 8.3 モバイル確認 (`<720px`)
- [ ] DevTools responsive (375px, 414px, 768px) で全 route スクロール
- [ ] HUD overflow なし
- [ ] Nav rail 高さ縮小 (`--rail-height: 56px`) で他要素と被らない
- [ ] menu open でモバイル panel が機能

### 8.4 ブラウザ互換
- [ ] Chrome (本日の検証ブラウザ) ✓
- [ ] Safari macOS — WebGPU 利用可否 + unsupported banner 動作
- [ ] Safari iOS — 同上
- [ ] Firefox — 同上
- [ ] WebGPU 強制無効化 (chrome://flags) → unsupported banner 出るか

### 8.5 GPU メモリ / リソース
- [ ] DevTools Performance + Memory で home → /experiments/grid → home 10 往復
- [ ] heap snapshot diff で leak 確認
- [ ] GPU device lost の console 警告なし

### 8.6 stash / branch hygiene
- [ ] `git stash list` で `wip-motion-flow-grid-experiments-wordmark-2026-04-28` 内容確認 → 本ブランチに反映済みなら `git stash drop stash@{0}`
- [ ] `git log main..HEAD` 全 commits をユーザーレビュー
- [ ] PR 作成想定: タイトル + summary + test plan は別途作成

### 8.7 デプロイ実行 (Vercel)
- [ ] `vercel pull` で env 同期
- [ ] preview deploy: `vercel deploy` → preview URL でリモート検証 (Retina 実機で再確認)
- [ ] preview で `/experiments/{grid,flow}` 改めて目視
- [ ] preview で全 8.2 項目を再実行
- [ ] OK なら `vercel deploy --prod` (or main へ merge → 自動 deploy)

---

## 9. 推奨デプロイ戦略

### 9.1 段階
1. **PR 作成** (本ブランチ → main): 全 52 commits を 1 PR でレビュー。コミット粒度は bisect 容易性のため意図的に細かい。
2. **Preview deploy** で実機検証 (Retina 2x 必須、§8.2 全項目)
3. **段階公開**: Vercel Rolling Releases で 10% → 50% → 100% を段階的に
4. **観測**: Speed Insights / Web Analytics で Web Vitals (LCP, CLS, INP) regression なきこと
5. **Rollback 準備**: 問題発生時は Vercel 即時 rollback (前 production deploy へ)

### 9.2 リスク低減
- preview で `/experiments/{grid,flow}` を **Retina 実機で時間をかけて目視**。MCP 検証は不十分という今日の教訓。
- mobile (375px) で全 route スクロール。HUD layout は desktop 前提で設計。
- 前段の 46 commits (本日範囲外) も spot check 必須。

### 9.3 観測すべき本番指標
- WebGPU 初期化失敗率 (unsupported banner 表示率)
- `/experiments/*` route の bounce rate / time on page
- console error reports (Sentry 等が入っていれば)

---

## 10. 関連ファイル早見表

### 10.1 本セッション改修対象
```
packages/motion-core/src/compose/{compose-pass.ts,index.ts}     ← 新規 subpath
packages/motion-core/package.json                              ← exports['./compose']
packages/motion-dot/src/compose-pass.ts                        ← re-export shim
packages/motion-grid/src/{mount.ts,index.ts,ui/hud.ts}
packages/motion-flow/src/{mount.ts,index.ts,ui/hud.ts}
apps/web/src/features/motion/ActiveMotionStage.tsx             ← 新規
apps/web/src/features/motion/{MotionStageProvider.tsx,index.ts}
apps/web/src/features/liquid-glass/{LiquidGlassProvider.tsx,LiquidGlassFrontChrome.tsx}
apps/web/src/app/[locale]/(portfolio)/layout.tsx
apps/web/src/app/[locale]/(portfolio)/experiments/{grid,flow}/client.tsx
```

### 10.2 参照のみ (canonical)
```
packages/motion-dot/src/main.ts:99-130              MountHandle interface (canonical)
packages/motion-dot/src/main.ts:599-611, 820-857    frame loop hook + handle return
packages/motion-dot/src/ui/hud.ts:94-104            markLiquidGlassControl helper
apps/web/src/features/liquid-glass/compose-factory.ts:380-462  compose pass back+front render
apps/web/src/app/globals.css:530-534                main, section { z-index: 1 } ← 罠
apps/web/src/app/[locale]/(portfolio)/layout.tsx:53-54   :root[data-nav-menu-open] hide rule
vendor/webgpu-motion-libs/packages/webgpu-motion-ui/src/scene-selector.ts:110-129  clobbering 元
```

### 10.3 関連ハンドオフ
```
docs/renewal-2026/2026-04-28-motion-grid-flow-liquid-glass-handoff.md  ← 本セッションの入力
docs/renewal-2026/2026-04-28-release-audit-handoff.md                  ← 前段 audit 計画
docs/renewal-2026/2026-04-27-liquid-glass-nav-front-layer-handoff.md   ← Nav 編
docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md      ← HUD 編
docs/renewal-2026/liquid-glass-adoption-rules-2026-04-26.md            ← ルール集
docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md        ← 方針
```

### 10.4 ナレッジ
```
.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md     ← light bg 前提
.claude/knowledge/patterns/data-readability-shader-pipeline.md          ← CSS scrim 禁止
.ai/knowledge/cjk-typography-pitfalls.md                                ← text-wrap balance 禁止
```

---

## 11. 次 chat への引き継ぎプロンプト (最高精度版)

> 以下を**そのまま新規 chat の冒頭に貼り付け**れば、本セッションの全コンテキストを再現できる。

---

```
あなたはこれから、私のポートフォリオ全面リニューアルを本番デプロイする。
ブランチは `feat/renewal-2026-phase2-motion-dot` (52 commits ahead of main)。
このブランチを精査し、品質ゲートを通し、Vercel に preview → production を順に通すのが本タスク。

## 必読
最初に以下を必ず読んでから着手:
1. `docs/renewal-2026/2026-04-28-renewal-deploy-readiness-handoff.md` (本ハンドオフ全文)
2. `CLAUDE.md` と `.claude/CLAUDE.md` のプロジェクト規約
3. `apps/web/src/app/globals.css:525-540` (main/section の z-index トラップ実装箇所)

## 絶対禁止 / 同じ轍を踏まない
- **MCP screenshot だけで「OK」判定しない**: 解像度が低くテキスト視認できない。必ず DOM の getBoundingClientRect、computed style、elementsFromPoint で数値検証する。視覚は最後に補助で見る。
- **「完了」を実機未確認で報告しない**: 前回これでユーザーから「殺すぞ」と複数回叱責されている。各修正後は必ずユーザーに目視させる前に DOM 数値検証を完了させ、なお解像度問題で見落とす可能性は明示する。
- **stacking context の罠**: globals.css の `main, section { z-index: 1 }` は全 `<main>` を z=1 stacking context にする。fixed positioned overlay を front canvas (z=1200) より上に出すには `<main>` の外 (Fragment 直下) に hoist する必要。新規 fixed overlay を作る際は必ず確認。
- **白文字 on glass を盲信しない**: motion-dot は dark dot field のおかげで白文字が読める。motion-grid/flow の light substrate (#d1d1d1) では白文字は完全に消える。dark ink + white text-shadow emboss が正解。
- **Nav 鞠と被らせない**: Nav は (left:32 / right:1200, top:24, 48×48) を占有 (= y:24-72)。top-anchored HUDs は top ≥ 96 必須。
- **メニュー open hide rule**: `:root[data-nav-menu-open] .motion-stage-hud-overlay { display: none }` は class 限定。新規 HUD overlay には `motion-stage-hud-overlay` class を必ず付ける。
- **vendor 改修禁止**: `vendor/webgpu-motion-libs/` は触らない。`updateSceneSelector` のような clobbering 問題は consumer 側でラップで対応。
- **デプロイ前にユーザー判断を仰ぐ**: preview deploy までは独力で進めて良いが、production への昇格は必ずユーザーの go サイン後。

## やるべきこと (順序)
### Phase 1 — 静的検証
1. `cd apps/web && bun run build` で green 確認
2. `cd apps/web && bunx tsc --noEmit` で baseline (1 error in params-codec.test.ts のみ)
3. `cd apps/web && bun run lint` で baseline (43 problems) 維持
4. `git status` で uncommitted 想定外なし、`git diff main..HEAD --stat` で範囲確認
5. `git log main..HEAD --oneline` で 52 commits を ユーザーに提示

### Phase 2 — ローカル実機検証 (Retina 2x ユーザー実機)
ユーザー dev server を起動 (port 3000)。本ハンドオフ §8.2 全項目をユーザーに目視させる。指摘があれば必ず実装側で修正 (CSS だけで済まない時は React/TS まで)。修正後は次の MUST:
- DOM の getBoundingClientRect / computed style / elementsFromPoint で**数値検証完了** → ユーザー目視に回す
- 重複指摘を避けるため、同種バグ (z-stacking, overlap, 余白) は他 route でも横展開チェック

### Phase 3 — モバイル (`<720px`)
DevTools responsive で 375 / 414 / 768 px、§8.3 項目。HUD overflow / Nav 鞠縮小整合性。

### Phase 4 — ブラウザ互換 (§8.4)
Chrome / Safari / Firefox。WebGPU 非対応で unsupported banner 動作。

### Phase 5 — GPU リソース (§8.5)
DevTools Memory + Performance で home ↔ /experiments/{grid,flow} 10 往復、leak / device-lost 確認。

### Phase 6 — stash 整理 (§8.6)
`stash@{0}` 内容確認、本ブランチに反映済みなら drop。

### Phase 7 — PR + preview deploy
1. ユーザー指示を受けて push & PR 作成 (タイトル < 70 chars、summary + test plan)
2. Vercel preview URL でリモート Retina 実機再検証
3. preview で §8.2 全項目を**再実行**
4. ユーザー go サインを待つ

### Phase 8 — production
- `vercel deploy --prod` または main merge
- Rolling Release 推奨 (10% → 50% → 100%)
- Speed Insights / Web Analytics で Web Vitals regression 監視
- 問題発生時は即時 rollback

## 動作の前提知識 (本ハンドオフから抽出)

### Liquid Glass 全体像
- `(portfolio)/layout.tsx` で `<ActiveMotionStageProvider>` → `<MotionStageProvider>` → `<LiquidGlassProvider>` → `<LiquidGlassFrontChrome>` の階層
- motion-dot がデフォルトの active stage、`/experiments/{grid,flow}` で route 側 mount が active stage を上書き
- `LiquidGlassProvider` の compose-pass effect は active stage の `setComposePass` / `onBeforeFrame` に hook
- `LiquidGlassFrontChrome` の canvas は active stage の `device` で configure → swap 時に reconfigure

### z-index 契約
```
--z-motion-hud-content: 1210     (route + motion-dot HUDs)
--z-nav-front-glass: 1200        (LiquidGlassFrontChrome canvas)
--z-nav-panel-content: 1300      (open menu DOM)
```
**globals.css の main/section z-index:1 トラップ**で `<main>` 内 fixed は z=1 に閉じ込められる。route の overlayRef は `<main>` の**外**。

### HUD position 決定済み (Nav dodge)
- motion-grid: status (top:96, left:24), input (top:148, left:24, hidden), cluster (bottom:24, right:24)
- motion-flow: overlay (top:96, left:24), scenes (top:96, right:24), audio (top:160, right:24), keymap (bottom:24, right:24, hidden)

### dark-on-glass token
```ts
inkOnGlass: "rgba(26,26,26,0.92)"
inkOnGlassActive: "rgba(255,255,255,0.98)"
bgActiveOverlay: "rgba(26,26,26,0.86)"
textShadow: "0 1px 0 rgba(255,255,255,0.55)"
```

## 質問してよいタイミング
- ユーザー実機目視のタイミング (毎修正ごと)
- preview deploy 後の production go サイン
- 本ハンドオフ §7 の未検証項目で挙動が想定外だった時
- 8.2 で挙げた全 route のうち、本ハンドオフ範囲外の commits 由来で問題発見した時 (本セッション以前の 46 commits)

## 期待する報告形式
- 各 Phase の終了時、検証した項目を箇条書きで明示 (DOM 数値含む)
- 修正したバグはコミット粒度を保つ (1 修正 1 commit、bisect 用)
- 「動いた」ではなく「<具体的検証手段> で <数値> を確認した」と書く

## 禁則
- 確認なしで destructive git (force push / reset --hard / branch -D / stash drop) しない
- 確認なしで production deploy しない
- 確認なしで vendor/ 配下を触らない
- 確認なしで .env / vercel.ts / vercel.json を変更しない
- mock データで動作確認 → 実機未確認のまま完了報告しない (前回の致命傷)

着手前に、Phase 1 の静的検証結果と本ハンドオフ §8.2 のローカル検証計画をまず提示すること。
```

---

**End of handoff. 次 chat はこのドキュメント単体で完結して着手できる。**
