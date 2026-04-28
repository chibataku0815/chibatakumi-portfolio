# Stream 4-B grid + flow Phase A 完了 handoff

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 完了 Stream | Stream 4-B-grid (Phase A wiring), Stream 4-B-flow (Phase A wiring) |
| 残 Stream | 4-D (preview deploy 検証 + 実 browser での visual 確認) |
| 親計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` §7 Stream 4 |
| 起点 doc (前回) | `docs/renewal-2026/stream-4-completion-handoff.md` (Stream 4-A/4-C/4-B-dot landed) |
| 現在 branch | `feat/renewal-2026-phase2-motion-dot` (local 上、Stream 2 + 4 + 4-B-grid/flow が混在) |
| 状態 | **typecheck motion-* 全 0 errors / apps/web は pre-existing 1 件のみ / working tree dirty / 未 commit / 未 push** |

---

## 0. 本書の使い方

新 chat 開始時に最初に読み込ませる。§2 の landed surface を確認 → §3 の残タスク (preview deploy) を実行。Stream 4 全体がほぼ landed 完了。残るは visual 検証のみ。

---

## 1. 状態の現実

前 chat (Stream 4 partial landed handoff) で残っていた 4-B-grid / 4-B-flow Phase A wiring を本 chat で Agent Teams 並列で完了。

- **Stream 1** (commit `7e16c224` "Phase 1 motion-core + vendored webgpu-motion-libs submodule"): origin push 済 ✅
- **Stream 2** (motion-dot package 化 + Phase A): branch `feat/renewal-2026-phase2-motion-dot` 上 working tree、**未 commit / 未 push**
- **Stream 4-A/4-C/4-B-dot** (前 chat): 同 branch 上、**未 commit / 未 push**
- **Stream 4-B-grid Phase A** (本 chat): vendoring + participant 実装、**未 commit / 未 push**
- **Stream 4-B-flow Phase A** (本 chat): vendoring + participant 実装 + compute pass 配線、**未 commit / 未 push**

CLAUDE.md §11 "Git操作はユーザーが行う（自動コミット禁止）" により、user が単一 commit で landed する想定。推奨 commit message は §5 参照。

---

## 2. 完了サマリ (本 chat)

### 2.1 Stream 4-B-grid Phase A wiring ✅

**vendored** (`life/output/motion-grid-guided-webgpu/src/` → `packages/motion-grid/src/`、19 files):

| Path | 概要 |
|---|---|
| `audio/wiring.ts` | GRID_WIRING (3 wires) + GRID_AUDIO_DELTA_BUFFER。canonical type 名 `GridParam` (singular) |
| `scene/discrete-grid-scene.ts` | DiscreteGridScene + factory `createDiscreteGridScene()` (CPU-only state machine) |
| `scene/typography/*.ts` (12 files) | hero-token + hero-word-pattern-{registry,shared,verifier} + 8 pattern definitions |
| `render/grid-block-pass.ts` | createGridBlockPass(device, format) + GridBlockPass.render(encoder, view, snapshot, reactive, textAlpha) |
| `render/grid-block.wgsl` | block shader (`?raw` import 経由) |
| `wgsl.d.ts` | `*.wgsl?raw` declaration |

**participant.ts 実装**:
- 3 段 pipeline: DiscreteGridScene (CPU) → GridBlockPass (offscreen rgba16float) → MotionFilmPostPass (composite to ctx.outputView)
- FILM_STOCK_CANON baseline + GRID_AUDIO_DELTA_BUFFER deltas + `ElectricFilmSignals` overlay (strikeFlag, flickerIntensity, glowMix, rgbSplitBump from `ELECTRIC_TICKER_CHARACTERS`) を `composeFilmConfig` で合成 (main.ts から lift)
- `initialHeroToken` は `scene.validateHeroToken` で検証、不正なら throw (`feedback_no_fallback_bug_hotbed.md`)
- `enableInput` は accept 済だが Phase A+1 deferred (keyboard cluster 未配線)
- legacy `GridParams` 型を `@deprecated` alias として維持 (scaffold call sites 救済)

**deferred (Phase A+1)**:
- input mode (hero-token typing) — `webgpu-motion-input` 必要
- audio controller / Music picker (route handler 側で AudioBus toggle で済む想定)
- `hero-word-pattern-verifier.ts` は vendored 済だが Phase A 未使用 (型 graph 維持のため残置)

### 2.2 Stream 4-B-flow Phase A wiring ✅

**vendored** (`life/output/motion-flowline-webgpu/src/` → `packages/motion-flow/src/`、24 files、~3136 LOC):

| Path | 概要 |
|---|---|
| `audio/{params,wiring}.ts` | FlowlineParam union + FLOWLINE_WIRING (8 wires Phase 10 post-tune) + FLOWLINE_AUDIO_DELTA_BUFFER |
| `compute/{flowline-compute,flowline-config,shape-curve}.ts + flowline-update.wgsl` | FlowlineComputeHandle (4000-16000 agents、24-field FlowlineRuntimeParams) |
| `render/{ribbon-pass,ribbon-config}.ts + ribbon.wgsl` | RibbonPassHandle (premultiplied-alpha triangle-strip into rgba16float) |
| `scene/{laminar,turbulent,attractor-knot,comb-flow,spirograph,epitrochoid,lissajous}.ts + flowline-participant + index.ts` | 7-scene canon + FlowlineSceneController (0.5s blend + reseed pulse) |
| `text/{glyph-registry,sdf-generator,sdf-texture}.ts` | Hero "FLOWLINE" SDF (r32float upload) |
| `wgsl.d.ts` | `*.wgsl?raw` declaration |

**participant.ts 実装**:
- 5 段 pipeline: FlowlineSceneController.tick (compute config blend + reseed) → compute.update (encoder.beginComputePass、agent simulation) → ribbonPass.render (offscreen rgba16float) → filmPost.render (composite to ctx.outputView)
- FLOWLINE_AUDIO_DELTA_BUFFER の 8 wires を `compute.update` の breathStrength/vorticityPulse/rimPulse に直接注入 + filmPost の bloom/grain/chroma/tonemap deltas に注入
- `particleCount` → SMALL/MEDIUM/LARGE preset 自動選択 (4000/8000/16000)
- `autoCycle` (default true) で `scene.time` (SceneSnapshot) ベースの 7-scene cycle、`SCENE_CYCLE_DURATION_SEC` ごとに `sceneController.switchTo` 発火
- `cachedDt` closure: `ParticipantFrameContext` は dt を持たないため、update から render へ shuttle
- `shapeIntensity` (gate 0.08 / range 0.72) を tonemap.compression wire 用に適用

**Workspace deps 追加**: `webgpu-motion-scene: workspace:*` (TransitionParticipant<FlowSnapshot> 用)。`apps/web/next.config.ts` の transpilePackages には Stream 4-C で既登録。

**deferred (Phase A+1)**:
- HUD overlay (`ui/`) / keyboard cluster (`input/`) — vendored せず
- Per-participant epoch reset (現在は `scene.time` 絶対値で cycle、participant activation toggle 時の reset 未対応)
- `blendTo` は no-op (Flowline 内部の 0.5s blend は scene 単位、participant 単位の blend は MotionStage の composite 層)

### 2.3 Strict-failure 厳守

両 participant とも:
- `init` 失敗 → throw clean (e.g. invalid hero token)
- `update` / `render` を `init` 前 / 必須 GPU 資源 null で呼ばれたら throw
- `dispose` のみ per-resource try/catch (idempotent)
- Silent fallback / no-op は一切なし (`feedback_no_fallback_bug_hotbed.md`)

### 2.4 typecheck 結果

| package | TS 5.9.3 | TS 6.0.3 |
|---|---|---|
| motion-core | 0 errors | 0 errors |
| motion-dot | 0 errors | 0 errors |
| motion-grid | **0 errors** | **0 errors** |
| motion-flow | **0 errors** | **0 errors** |
| apps/web (`.next` clean 後) | 1 error (pre-existing `params-codec.test.ts:87`、本 stream 由来ではない) | — |

`.next/dev/types/validator.ts` の 6 stale errors は `rm -rf apps/web/.next` で解消 ✅。

---

## 3. 残タスク (次 chat 着手)

### 3.1 Stream 4-D — preview deploy 検証

**前提**:
- user が §5 の commit + push を実行済
- monorepo typecheck green (motion-* + apps/web pre-existing 1 件のみ)

**手順**:
1. Vercel preview deploy を起動 (`feat/renewal-2026-phase2-motion-dot` branch)
2. `/experiments/dot` 動作確認:
   - WebGPU 対応 browser (Chrome / Edge / Arc / macOS Safari TP) で metaball + bloom + audio 反応 visible
   - WebGPU 非対応 (iOS Safari、Firefox 一部) で `MotionUnsupportedBanner` 表示
3. `/experiments/grid` 動作確認:
   - DiscreteGridScene の typography blocks がレンダリング、film-post が audio 反応
   - hero token (default) が pulsate、electricSignals (strikeFlag / glowMix) が周期的に発火
4. `/experiments/flow` 動作確認:
   - 4000 agents の ribbon が auto-cycle 7 scenes で連続描画
   - `SCENE_CYCLE_DURATION_SEC` ごとに 0.5s blend で次 scene へ切替
   - audio で breathStrength / vorticityPulse / rimPulse が反応
5. transpilePackages 効果検証:
   - DevTools Network で WGSL strings がクライアントへ送られているか
   - Next.js client bundle で WGSL 文字列が tree-shake されず転写されている

**完了基準**: 3 routes 全てで WebGPU 対応 browser で visible、非対応 browser で banner、production build success。

### 3.2 Phase A+1 残 work (別 chat、優先度低)

- motion-grid: input mode (hero-token typing keyboard cluster)
- motion-flow: per-participant epoch reset + flow-side keyboard cluster (希望時)
- motion-dot: KineticHandoff orchestration / Gallery mode / Fluid scene legacy metaball pass / HUD / Keyboard
- 全 participant: HUD overlay (chrome MCP debug 用) を `enableHud` opt 経由で

これらは preview deploy が動いて visual 検証通過してから着手で問題なし。

---

## 4. 次 chat 起動 prompt (コピペ用)

```
Renewal 2026 Stream 4-D (preview deploy + visual 検証) を起動してください。

起点 doc:
- chibatakumi-portfolio/docs/renewal-2026/stream-4b-grid-flow-completion-handoff.md (本書、最優先)
- chibatakumi-portfolio/docs/renewal-2026/stream-4-completion-handoff.md (Stream 4-A/4-C/4-B-dot)
親計画: life/.claude/plans/portfolio-renewal-2026-04.md §7 Stream 4

前提 (Stream 4 全て landed):
- branch `feat/renewal-2026-phase2-motion-dot` (Stream 2 + 4 全部 landed、user commit 済か実 working tree で必ず verify)
- typecheck motion-* 全 0 errors、apps/web pre-existing 1 件のみ
- /experiments/dot /experiments/grid /experiments/flow 全 route 配線済

着手:
1. Vercel preview deploy 起動
2. WebGPU 対応 browser で /experiments/{dot,grid,flow} visual 検証
3. WebGPU 非対応 browser で MotionUnsupportedBanner 表示確認
4. transpilePackages 効果 (WGSL 転写) を DevTools Network で確認

注意:
- Phase A+1 (input/HUD/Gallery など) は scope 外、別 chat で実施
- visual で broken な scene があっても、まず production build success を確認、その後 wiring debug
```

---

## 5. user 引き継ぎ手順 (commit + push)

### 5.0 Stream 4-D pre-flight で発見・修正済 (build verified)

次 chat で Stream 4-D を起動する前に、本 chat の終盤で **ローカル `bun run build:web` を完走させ、Vercel preview deploy で必ず再現する 3 件の release blocker を fix した**。

| # | 失敗内容 | 修正 | ファイル |
|---|---|---|---|
| 1 | Turbopack: 5 件の `Unknown module type` (`*.wgsl`) で build fail | `apps/web/next.config.ts` に `turbopack.rules` を追加し `raw-loader` で wgsl を `*.js` 化。`raw-loader@4.0.2` を apps/web devDep に追加 | `apps/web/next.config.ts` / `apps/web/package.json` / `bun.lock` |
| 2 | SSG prerender: `/experiments/dot` で `ReferenceError: GPUTextureUsage is not defined` | 各 page を thin `dynamic({ssr: false})` wrapper 化、実装は sibling `client.tsx` に分離。SSR 時の motion-* 静的 import を回避 | `apps/web/src/app/[locale]/experiments/{dot,grid,flow}/page.tsx` を書き換え + `client.tsx` を新規 |
| 3 | 同 SSG: `features/motion` chunk 評価で同 `GPUTextureUsage` 例外 | submodule `vendor/webgpu-motion-libs/packages/webgpu-motion-shell/src/offscreen.ts` の `const DEFAULT_USAGE = GPUTextureUsage.* | GPUTextureUsage.*` を `function getDefaultUsage()` に lazy 化 | submodule 側の修正 |

最終 build 結果: 全 68 routes prerender 通過、`/[locale]/experiments/{dot,grid,flow}` の 6 pages も SSG 完了 (内側は client-only なので browser だけで participant 起動)。

### 5.1 推奨 commit 戦略 (submodule + 親 repo)

`vendor/webgpu-motion-libs` は git submodule (chibataku0815/webgpu-motion-libs / main)。submodule 側の SSR fix を先に push し、親 repo は submodule pointer bump も含めて単一 commit。

```bash
# === 1. Submodule 側 — SSR fix ===
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/vendor/webgpu-motion-libs

git add packages/webgpu-motion-shell/src/offscreen.ts
git commit -m "fix(webgpu-motion-shell): defer GPUTextureUsage eval (SSR safety)

Module-top \`const DEFAULT_USAGE = GPUTextureUsage.* | GPUTextureUsage.*\`
crashes Next.js 16 prerender (Node has no WebGPU globals). Move the
constant into a lazy getter so it's only evaluated when the function
runs in browser context.

Surfaced by chibatakumi-portfolio Renewal 2026 Stream 4-D pre-flight
build (next build / Turbopack)."

git push origin main

# === 2. 親 repo (chibatakumi-portfolio) ===
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio

git add \
  apps/web/next.config.ts apps/web/package.json bun.lock \
  apps/web/src/app/\[locale\]/experiments/ \
  apps/web/src/features/motion/ \
  packages/motion-core/ \
  packages/motion-dot/ \
  packages/motion-grid/ \
  packages/motion-flow/ \
  docs/renewal-2026/ \
  vendor/webgpu-motion-libs

git commit -m "feat(renewal-2026): Stream 2 + 4 motion-{dot,grid,flow} Phase A landed (build verified)

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
- panelCount=1 modulation only; gallery/handoff/fluid deferred to Phase A+1

Stream 4-B-grid — motion-grid Phase A wiring:
- Vendor motion-grid-guided-webgpu source (audio/scene/render + typography 12 files)
- createGridParticipant: DiscreteGridScene + GridBlockPass + MotionFilmPostPass
- composeFilmConfig from main.ts (FILM_STOCK_CANON + GRID_AUDIO_DELTA + ElectricFilmSignals)
- initialHeroToken validation (throws on invalid); input/HUD deferred

Stream 4-B-flow — motion-flow Phase A wiring (compute pass):
- Vendor motion-flowline-webgpu source (audio/compute/render/scene/text, ~3136 LOC)
- createFlowParticipant: SceneController + Compute + HeroSdf + RibbonPass + FilmPost
- 5-stage pipeline with shared command encoder (compute + render passes)
- particleCount → SMALL/MEDIUM/LARGE preset selection
- autoCycle 7 scenes by SceneSnapshot.time, cachedDt closure for compute dispatch
- webgpu-motion-scene: workspace:* added (TransitionParticipant<FlowSnapshot>)

Stream 4-D pre-flight (本 chat 終盤、build blocker fix):
- apps/web/next.config.ts: turbopack.rules で *.wgsl raw-loader 登録
- apps/web/package.json: raw-loader@4.0.2 devDep 追加
- /experiments/{dot,grid,flow}/page.tsx を dynamic({ssr:false}) wrapper 化、実装は sibling client.tsx へ分離
- vendor/webgpu-motion-libs submodule pointer bump (offscreen.ts SSR safety fix)

Followup (tsconfig hygiene): @webgpu/types に motion-{core,grid,flow} を移行

Build verified: bun run --cwd apps/web build = exit 0 / 68 routes prerendered (experiments/{dot,grid,flow} 6 pages SSG 通過、内側は client-only)。
Typecheck: motion-* 全 package 0 errors。apps/web 1 件 pre-existing test mismatch (params-codec.test.ts:87) のみ。"

git push -u origin feat/renewal-2026-phase2-motion-dot
```

---

## 6. 参照 / 関連 memory

- `feedback_no_fallback_bug_hotbed.md` — 両 participant とも silent fallback なし、init 前 lifecycle で throw
- `feedback_review_release_blockers_deep_pass.md` — 本 chat で Agent Teams merge 後 deep pass (typecheck + lifecycle 整合性 + ParticipantFrameContext API 確認) を実施済
- `feedback_minimize_decision_cost.md` — 本書も option 1 (single commit) を推奨 (前 handoff doc 継承)
- `feedback_verify_before_quoting_handoff.md` — 本 chat 冒頭で memory が伝える "Stream 2 push 済" 前提を実 working tree (`git status`) で検証 → memory が伝える通り未 commit を確認

memory 更新候補:
- `portfolio_renewal_2026_04_stream4_partial_landed.md` → `portfolio_renewal_2026_04_stream4_full_landed.md` (Phase A 全体 landed) に更新
- 4-D 完了後に handoff doc archive へ
