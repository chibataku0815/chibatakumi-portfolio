# Stream 4 — Portfolio Shell + MotionStage + motion-dot Phase A 完了 handoff

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 完了 Stream | Stream 4-A (MotionStage core), 4-C (routing + transpilePackages + workspace deps), 4-B-dot (motion-dot Phase A wiring), tsconfig hygiene followup |
| 残 Stream | 4-B-grid (Phase A wiring), 4-B-flow (Phase A wiring), 4-D (preview deploy 検証) |
| 親計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` §7 Stream 4 |
| 起点 doc | `docs/renewal-2026/stream-2-completion-handoff.md` |
| 現在 branch | `feat/renewal-2026-phase2-motion-dot` (local 上、Stream 2 + 4 work が混在) |
| 状態 | **typecheck 全 motion package 0 errors / working tree dirty / 未 commit / 未 push** |

---

## 0. 本書の使い方

新 chat 開始時に最初に読み込ませる。§2 の landed surface を確認 → §3 の残タスクから優先選択 → §4 の起動 prompt 投入。

---

## 1. 状態の現実

memory が "Stream 1 fully landed (commit pushed)" と記録していたため当 chat は最初に "Stream 2 push 済" と誤った前提を持っていた。実状況:

- **Stream 1** (commit `7e16c224` "Phase 1 motion-core + vendored webgpu-motion-libs submodule"): origin push 済 ✅
- **Stream 2** (motion-dot package 化 + scaffold): branch `feat/renewal-2026-phase2-motion-dot` 上 working tree、**未 commit / 未 push**
- **Stream 4** (本 chat の作業): 同一 branch 上で重ね、**未 commit / 未 push**

CLAUDE.md §11 "Git操作はユーザーが行う（自動コミット禁止）" により、Stream 2 + 4 を user が分離 commit するか単一 commit で landed するかを判断する。推奨は §5 参照。

---

## 2. 完了サマリ

### 2.1 Stream 4-A — MotionStage core ✅

**新規ファイル**:
- `packages/motion-core/src/stage/index.ts` (336 行) — `createMotionStage` factory + Stage class
- `packages/motion-core/src/stage/composite.wgsl.ts` — fullscreen-triangle composite shader (single-tex blit / two-tex cross-blend)

**更新**:
- `packages/motion-core/package.json` — `./stage` subpath export 追加 + `@webgpu/types` devDep
- `packages/motion-core/tsconfig.json` — `types: ["@webgpu/types"]`
- `packages/motion-core/src/participant/index.ts` — **API 改訂**:
  - `init(device, target: GPUTexture)` → `init(device, format: GPUTextureFormat)` (target は stage 所有)
  - `render(passEncoder)` → `render(ctx: ParticipantFrameContext)`：encoder + outputView + format + w/h + time を渡し、participant が compute / 複数 pass / film post を一手に encode
  - `AudioState`：`bands: Float32Array` (handoff §3.4 で提案) → `bands: AudioBands; onsets: OnsetBands; intensity` (AudioBus と alloc-free に shape 一致、wiring.resolveInto と直接整合)

**MotionStage 設計**:
- 単一 GPU device、単一 AudioBus、単一 RAF loop (45 FPS fixed-step、`webgpu-motion-shell.createFixedStepLoop`)
- 各 participant に rgba16float の per-name offscreen texture を allocate (canvas 解像度に追従)
- frame loop: `audioBus.update(dt)` → CPU `participant.update` → GPU encoder → `participant.render(ctx={encoder, outputView=offscreen, ...})` → composite pass で swapchain に blit/cross-fade
- `setActive(name, blendDurationMs=500)` で 0.5s cross-blend (flowline canon)
- `setRouteKey(key)` で route 通知 (participant が ambient/gallery 状態切替に使用)
- 無 fallback: `navigator.gpu` 不在で `createMotionStage` 同期 throw → React boundary で `kind: "unsupported"` に変換

### 2.2 Stream 4-C — routing + transpilePackages + workspace deps ✅

**`apps/web/next.config.ts`** — `transpilePackages` に 16 packages 追加:
- `@chibatakumi/motion-{core,dot,grid,flow}`
- `webgpu-motion-{shell,audio,post,art,dom,input,scene,ui}`
- `gpu-fx-presets`, `gpu-2.5d-presets`, `gpu-film-post`

**`apps/web/package.json`** — workspace deps 4 件追加:
- `@chibatakumi/motion-core`, `motion-dot`, `motion-grid`, `motion-flow` (`workspace:*`)

**新規 React boundary (`apps/web/src/features/motion/`)**:
- `MotionStageContext.ts` — `createContext<MotionStageStatus>` (pending/ready/unsupported/error)
- `MotionStageProvider.tsx` — client component。canvas を `fixed inset-0 -z-10 pointer-events-none` に mount、`createMotionStage` を非同期 boot、`useRouter()` の path 変化で `setRouteKey` 自動同期
- `MotionUnsupported.tsx` — ready/pending 時非表示、unsupported/error 時 craft 体裁の banner
- `useExperimentParticipant.ts` — route 用 hook：`{ factory: () => MotionParticipant }` で stage に register + setActive
- `index.ts` — public boundary

**新規 routes**:
- `apps/web/src/app/[locale]/experiments/layout.tsx` — `MotionStageProvider` + `MotionUnsupportedBanner` を装着
- `apps/web/src/app/[locale]/experiments/{dot,grid,flow}/page.tsx` — 各々 `useExperimentParticipant({ factory: createXParticipant(...) })` で activate

### 2.3 Stream 4-B-dot — motion-dot Phase A wiring ✅ (single-scene path)

**`packages/motion-dot/src/index.ts`** で `createDotParticipant` を SCAFFOLD → REAL に置き換え:

| Lifecycle | 内容 |
|---|---|
| `init(device, format)` | initialScene が vendor 系なら `buildVendorSource(name, device)` で source 構築。fluid なら `createFluidScene` を構築 (但し render は throw — Phase A+1 まで)。`createFilmPostPass(device, format)` を構築。 |
| `update(dt, audioState, scene)` | `shapeIntensity(audioState.intensity)` で 0.08-0.92 の non-linear 整形 → `DOT_WIRING.resolveInto(DOT_AUDIO_DELTA_BUFFER, bands, onsets, shaped)` でゼロ alloc 解決 → source が `setAudioReactive` を持つ場合 `{...bands, ...onsets, intensity: shaped}` を push |
| `render(ctx)` | offscreen lazy alloc/resize → SDF lazy init/resize → modulation 計算 (panelCount=1 のみ、gallery damping は Phase A+1) → `sdf.updateConfig` + `filmPost.updateConfig` → `sdf.render(encoder, offscreenView, time, currentSource)` (内部で source.update を発火) → `filmPost.render(encoder, offscreenView, ctx.outputView, time, w, h)` |
| `dispose` | source / fluid / sdf / filmPost / offscreenTexture を順に destroy、initialized を false |

**Phase A scope の deferred**:
- KineticHandoff transition (state machine は vendored 済 (`packages/motion-dot/src/transition/kinetic-handoff.ts`)、participant に未配線)
- Gallery mode (`createGalleryMode` exported 済、participant に未配線、`/experiments/dot` で fullscreen 採用予定)
- HUD overlay (`./ui/hud` vendored 済、`enableHud` opt は未対応)
- Keyboard cluster (`./input/keyboard` vendored 済、`enableInput` opt は未対応)
- Fluid scene の SDF non-bypass (`createMetaballPass` を `./render/metaball-pass` から動的 import する path)
- 17 scene 同時 build (現在は initial 1 scene のみ。scene 切替には participant 内で他 scene を lazy build する仕組みが必要)

これらは `/experiments/dot` で audio 反応 + film grade の 1 scene visual を立ち上げるには不要。Phase A+1 で順次着手。

### 2.4 tsconfig hygiene followup ✅

`packages/motion-{core,grid,flow}/{package.json,tsconfig.json}` に `@webgpu/types` devDep + `"types": ["@webgpu/types"]` を追加。Phase 1 commit `7e16c224` 由来 pre-existing の `GPUDevice`/`GPURenderPassEncoder` 未解決を解消。

---

## 3. 残タスク (次 chat 着手)

### 3.1 Stream 4-B-grid — motion-grid Phase A wiring

**前提 / scope**:
- 現状 `packages/motion-grid/src/participant.ts` は SCAFFOLD のみ (init/update/render が no-op、`GRID_WIRING` の 3 wires は declared)
- 実装ソースは `life/output/motion-grid-guided-webgpu/src/` に存在 (`scene/discrete-grid-scene`, `render/grid-block-pass`, etc.)
- motion-dot のように `vendor/webgpu-motion-libs` 経由で取り込まれていない (Stream 1 は基盤 lib のみ subtree split、grid/flow source は portfolio に未 vendoring)

**Phase A 推奨アプローチ**:
1. `life/output/motion-grid-guided-webgpu/src/{scene,render,text}` を `packages/motion-grid/src/` に vendoring (Stream 2 の motion-dot が取った方針と同型)
2. `package.json` に `gpu-fx-presets` 等の必要 dep 追加
3. participant の `init/update/render/dispose` を motion-dot Phase A 同型 pattern で書き起こす
   - DiscreteGridScene + GridBlockPass + MotionFilmPostPass の 3 段
   - GRID_WIRING の 3 wires (film.bloom.threshold/intensity, film.tonemap.compression) を deltaBuffer に resolve
   - electricSignals (strikeFlag, flickerIntensity, glowMix, rgbSplitBump) は scene-driven なので participant が driving

**完了基準**:
- `packages/motion-grid/` typecheck 0 errors
- `/experiments/grid` で 1 scene が render される (audio 反応含む)

### 3.2 Stream 4-B-flow — motion-flow Phase A wiring

**前提 / scope**:
- 同じく SCAFFOLD のみ。`FLOW_WIRING` の 8 wires declared (Phase 10 post-tune coefficients)
- 実装ソースは `life/output/motion-flowline-webgpu/src/` (compute/scene/text)
- **flow は compute pass を持つ** — 4000-16000 agent particle simulation。MotionParticipant API は `render(ctx)` 内で encoder への compute 直接 dispatch 可能なので OK

**Phase A 推奨アプローチ**:
1. `life/output/motion-flowline-webgpu/src/{compute,scene,text}` を `packages/motion-flow/src/` に vendoring
2. participant `init` で FlowlineSceneController + FlowlineComputeHandle + HeroSdf + RibbonPass + MotionFilmPostPass を構築
3. `update`: sceneController.update(dt) + FLOW_WIRING.resolveInto(deltaBuffer, ...)
4. `render(ctx)`: compute dispatch + ribbonPass.render + filmPost.render (motion-dot と同 pattern)

**完了基準**:
- `packages/motion-flow/` typecheck 0 errors
- `/experiments/flow` で auto-cycle 7 scenes が動作

### 3.3 Stream 4-D — preview deploy 検証

**前提 / scope**:
- 現在 monorepo 全体 typecheck:
  - motion-core/dot/grid/flow: **0 errors**
  - apps/web: **1 error** (`src/features/interactive/film-lab/params-codec.test.ts:87` Conversion of Record<string, unknown> → Params。pre-existing、本 Stream 由来ではない)
  - .next/dev/types/validator.ts: **6 errors** (about/motion-systems/work routes 未存在。これも pre-existing、stale .next type cache。`rm -rf apps/web/.next` で消える可能性高)

**手順**:
1. user が Stream 2 + Stream 4 を commit + push (§5 参照)
2. Vercel preview deploy 起動
3. `/experiments/dot` 動作確認:
   - WebGPU 対応 browser (Chrome / Edge / Arc / macOS Safari TP) で metaball + bloom が見える
   - WebGPU 非対応 (iOS Safari) で MotionUnsupportedBanner が表示
4. transpilePackages 効果検証:
   - Next.js client bundle に WGSL 文字列が tree-shake されず転写される
   - Network DevTools で WGSL strings がクライアントへ送られていることを確認
5. /experiments/grid /experiments/flow は Phase A 未配線なら no-op render (黒画面 + banner なし、pending state)。Phase A landed 後に visual 確認

### 3.4 Phase A+1 残 work (motion-dot 拡張、別 chat または併走可)

motion-dot の Phase A は single-scene 限定。次フェーズで:
- KineticHandoff を participant に組み込み (scene 切替で 17 scenes を cycle)
- Gallery mode (`createGalleryMode`) を `enableHud` 経由で fullscreen に
- Fluid scene の legacy metaball pass 配線 (`./render/metaball-pass` の動的 import)
- HUD overlay (chrome MCP debug 時のみ toggle、enableHud opt)
- Keyboard input cluster (`./input/keyboard` を `enableInput` opt 経由で activate)

---

## 4. 次 chat 起動 prompt (コピペ用)

```
Renewal 2026 Stream 4 残タスク (motion-grid / motion-flow Phase A wiring + preview deploy) を起動してください。

起点 doc:
- chibatakumi-portfolio/docs/renewal-2026/stream-4-completion-handoff.md (本書)
- chibatakumi-portfolio/docs/renewal-2026/stream-2-completion-handoff.md
親計画: life/.claude/plans/portfolio-renewal-2026-04.md §7 Stream 4

前提 (Stream 4 partially landed):
- branch `feat/renewal-2026-phase2-motion-dot` (Stream 2 + Stream 4 work 混在、未 commit/push 状態)
- MotionStage core (packages/motion-core/src/stage/), MotionParticipant API 改訂、apps/web/{features/motion,app/[locale]/experiments}/, motion-dot single-scene Phase A wiring が landed
- typecheck: 全 motion package 0 errors、apps/web は pre-existing 1 件 (params-codec.test.ts)、.next stale 6 件 (.next clean で消える)

着手:
1. Stream 2 + Stream 4 の commit / push (user 操作)
2. Stream 4-B-grid Phase A wiring (life/output/motion-grid-guided-webgpu vendoring + participant 実装)
3. Stream 4-B-flow Phase A wiring (life/output/motion-flowline-webgpu vendoring + participant 実装、compute dispatch 含む)
4. Stream 4-D preview deploy 検証 (Vercel preview, /experiments/dot で WebGPU 動作確認)

Agent Teams 推奨: 4-B-grid + 4-B-flow を並列 (両者独立 vendoring)、4-D は 4-B 完了後。
```

---

## 5. user 引き継ぎ手順 (commit + push)

### A. 推奨 commit 戦略

**option 1 — Stream 2 + Stream 4 単一 commit**:

最も平易。両者は同 branch 上で landed。

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
git add \
  apps/web/next.config.ts apps/web/package.json bun.lock \
  apps/web/src/app/\[locale\]/experiments/ \
  apps/web/src/features/motion/ \
  packages/motion-core/ \
  packages/motion-dot/ \
  packages/motion-grid/ \
  packages/motion-flow/ \
  docs/renewal-2026/

git commit -m "feat(renewal-2026): Stream 2 motion-dot package + Stream 4 MotionStage + Phase A (motion-dot)

Stream 2 — motion-dot package 化:
- Vendor motion-dot-new-webgpu source (animation/audio/compute/input/render/scene/shaders/transition/ui)
- createDotScene REAL factory (17 scenes), createDotParticipant Phase A REAL
- Re-export createKineticHandoff / createGalleryMode / createFluidScene + types

Stream 4-A — MotionStage core (motion-core/src/stage/):
- createMotionStage factory, single GPU device + AudioBus + RAF loop
- per-participant rgba16float offscreen pool, composite pass to swapchain
- 0.5s cross-blend orchestration via setActive(name, blendDurationMs)
- API 改訂: init(device, format), render(ctx: ParticipantFrameContext)
- AudioState shape 修正 (Float32Array → AudioBands/OnsetBands/intensity)

Stream 4-C — apps/web 配線:
- transpilePackages 16 packages (motion-* + webgpu-motion-* + gpu-*)
- workspace deps 4 (motion-core/dot/grid/flow)
- features/motion/{Provider,Context,UnsupportedBanner,useExperimentParticipant}
- /experiments/{dot,grid,flow} routes + experiments layout

Stream 4-B-dot — motion-dot Phase A wiring (single-scene):
- init: vendor source build + filmPost
- update: shapeIntensity + DOT_WIRING.resolveInto + setAudioReactive
- render: SDF + filmPost composite to ctx.outputView
- panelCount=1 modulation only; gallery / handoff / fluid deferred to Phase A+1

Followup (tsconfig hygiene): @webgpu/types に motion-{core,grid,flow} を移行

Typecheck: motion-* 全 package 0 errors。apps/web 1 件 pre-existing test mismatch のみ。"

git push -u origin feat/renewal-2026-phase2-motion-dot
```

**option 2 — Stream 2 / Stream 4 を分離 commit**:

履歴が綺麗だが手間。Stream 2 は scaffold のみで Stream 4 が API 改訂 + Phase A wiring を上書きしているため、ファイル粒度では分離困難 (motion-dot/src/index.ts が両方に跨る、motion-{grid,flow} の participant.ts も同様)。option 1 推奨。

### B. 次 chat への引き渡し

push 後、新 chat で §4 の prompt を投入。

---

## 6. 参照 / 関連 memory

- `feedback_no_fallback_bug_hotbed.md` — silent degradation 禁止。MotionStage は WebGPU 不在で同期 throw、participant は init 前 lifecycle で throw、motion-dot は fluid scene render で throw
- `feedback_review_release_blockers_deep_pass.md` — Agent Teams merge 後の独立 deep pass。次 chat で 4-B-grid/flow merge 後に同様の点検 (shader math dry run + xcodebuild の grid/flow 版)
- `feedback_minimize_decision_cost.md` — 承認後はまとめて landed。本書も option 1 (single commit) を推奨
- `feedback_verify_before_quoting_handoff.md` — 本 chat の冒頭で「Stream 2 push 済」と user が誤って quote した点を verify で訂正。次 chat も working tree 状態を verify してから start すること

memory 更新候補 (本書反映):
- `Portfolio Renewal 2026 — Stream 1 fully landed (commit pushed)` → `Stream 1 + 2 + 4 partial landed (一部 push 済)` に書き換え
- 新規 memory `portfolio_renewal_2026_04_stream4_partial_landed.md` を作成
