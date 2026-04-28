# Stream 2 — motion-dot package 化 完了 handoff

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 起点 doc | `stream-2-motion-dot-handoff.md` |
| ブランチ | `feat/renewal-2026-phase2-motion-dot` (local 未 push) |
| 起点 commit | `7e16c224` (Phase 1 motion-core landed) |
| 完了 working tree | uncommitted (CLAUDE.md §11 — user が commit + push) |
| typecheck | motion-dot `bunx tsc --noEmit` 0 errors |

---

## 1. landed 内容

### Stream 2-A: Source 移植 + 依存整理

- `life/output/motion-dot-new-webgpu/src/{animation,audio,compute,input,render,scene,shaders,transition,ui}` を `packages/motion-dot/src/` へ vendor
- import path は元から vendor lib 名(`gpu-fx-presets`, `webgpu-motion-{audio,dom,input}`, `gpu-2.5d-presets`)で書かれていたため書き換え不要
- `packages/motion-dot/package.json` deps に 6 workspace pkg を配線:
  - `@chibatakumi/motion-core` (← Stream 2-B で追加)
  - `gpu-2.5d-presets`, `gpu-fx-presets`
  - `webgpu-motion-{audio,dom,input}`
- `packages/motion-dot/tsconfig.json` を motion-core/grid/flow と整合(types: `["@webgpu/types"]` を追加)
- `src/wgsl.d.ts` で `*.wgsl?raw` shim 宣言

### Stream 2-B: createDotScene API + MotionParticipant scaffold

`packages/motion-dot/src/index.ts` で以下を export:

| Symbol | 種別 | 役割 |
|---|---|---|
| `DOT_SCENE_NAMES` | `readonly tuple` | 17 scene 名の canon (16 vendor preset + `fluid` local) |
| `DotSceneName` | type | `typeof DOT_SCENE_NAMES[number]` (type-safe union) |
| `DotScene` | interface | 統一 scene adapter: `encode/particleBuffer/count/reset/destroy` + optional `setAttractor/exportState/exportStateAsync/importState` |
| `createDotScene(name, device, opts?)` | factory | **REAL**: name dispatch で vendor preset (`createOrbitParticles` 等) または local `createFluidScene` を呼び、`DotScene` adapter を返す |
| `createDotParticipant(opts?)` | factory | **SCAFFOLD**: `MotionParticipant<DotParam>` を返す。`init/update/render/blendTo/dispose` は uninitialized 時に投げ、initialized 時は no-op + TODO(phase-a) コメント。motion-grid/motion-flow と完全 parity |
| `DOT_DEFAULT_INITIAL_SCENE` | const | `"river"` (ambient reference scene) |

参考: motion-grid `createGridParticipant` / motion-flow `createFlowParticipant` と同じ scaffold パターン(`feedback_no_fallback_bug_hotbed.md`: silent no-op 禁止、未初期化使用時は明確なエラー)。

### Stream 2-C: kinetic-handoff + composite-25d 露出

`src/index.ts` で再エクスポート:

- `createKineticHandoff` + `KineticHandoffController` / `TransitionParticipant` / `TransitionScene` / `TransitionPhase`
- `createGalleryMode` + `GalleryMode` / `PanelRenderer`
- `createFluidScene` + `FluidScene`
- `Scene` interface + `PARTICLE_FLOATS` / `PARTICLE_BYTES`
- vendor 型: `AttractorConfig`, `ParticleStateSnapshot`, `MetaballParticleSource`

これで MotionStage(Stream 4)が page transition 時に `createKineticHandoff` を直接呼べる。`composite-25d` の `createGalleryMode` は `/experiments/dot` route で full-screen 採用可能。

### Stream 2-D: typecheck

```bash
cd packages/motion-dot
bunx tsc --noEmit  # 0 errors
```

✅ motion-dot 単体 typecheck green。

⚠️ 既知の **pre-existing** 関連事項: motion-grid と motion-flow の tsconfig は `@webgpu/types` を types に持たず、`webgpu-motion-shell/src/env.d.ts` の triple-slash 参照を transitively 拾う経路もないため、それぞれの個別 typecheck では `GPUDevice`/`GPURenderPassEncoder`/`GPUTexture` 未解決エラーが出る(Phase 1 commit `7e16c224` 由来、Stream 2 で導入したものではない)。**修正案**: `packages/motion-{grid,flow}/{package.json,tsconfig.json}` に `@webgpu/types` devDep + `"types": ["@webgpu/types"]` を追加。本リポの tsconfig hygiene followup として独立 issue 化推奨。

### Stream 2-E: Canvas2D archive 契約

`packages/motion-dot/README.md` "Canvas2D legacy preservation policy" 節で:

- `life/output/motion-dot-new` (Canvas2D legacy) は **削除しない**
- Stream 4 で `journal/motion-studies/dot-new-canvas2d` として archive 予定
- WebGPU 版が main craft signature であることを明示

---

## 2. 完了基準 (handoff doc §6) チェック

- [x] `packages/motion-dot/` 配下に 17+ scene 動作実装が landed
  - 16 vendor preset + 1 local fluid = **17 scene**、全部 `createDotScene` で type-safe にアクセス可能
- [x] `createDotScene(name, opts)` API export
  - 実 signature は `createDotScene(name, device, opts?)` (device は GPU resource 構築に必要)
- [x] `bunx tsc --noEmit` 0 errors (motion-dot)
- [ ] portfolio 内 demo route で 1 scene 動作確認
  - **Stream 4 へ deferred**。理由: `apps/web/src/app/[locale]/_dev/dot/page.tsx` 配置 + `next.config.ts` の `transpilePackages` に `@chibatakumi/motion-dot` 追加 + apps/web/package.json への dep 追加が必要で、これは Stream 4 (Portfolio Shell の MotionStage 実装と同時) でやるのが整合的。motion-grid / motion-flow も同様に scaffold で demo route なし、parity 維持。
- [ ] `feat/renewal-2026-phase2-motion-dot` ブランチに commit + push
  - **CLAUDE.md §11 により user 操作**(下記 §4 参照)
- [x] Stream 3/4/5 着手 handoff doc を作成
  - 本 doc が Stream 4 の前提を提供。Stream 3 は別途 motion-grid Phase A wiring、Stream 5 は motion-flow Phase A wiring の handoff として後続作成。

---

## 3. Phase A 残 work (Stream 4 で着手)

`createDotParticipant.init()` body を埋める作業:

```ts
async init(device, target) {
  // 1. SceneEntry[] 構築 — DOT_SCENE_NAMES.map(name => createDotScene(name, device, opts))
  // 2. MetaballSDF — gpu-fx-presets の createMetaballSDF(device, w, h, opts)
  // 3. MotionFilmPostPass — webgpu-motion-post の createFilmPostPass(device, target.format)
  // 4. KineticHandoff controller — createKineticHandoff({ scenes, getCurrentIndex, setCurrentIndex })
  // 5. OffscreenTargetPool slot を name keyed で確保
  // 6. (option) HUD / keyboard cluster
  initialized = true;
}
```

`update(dt, audioState, scene)`:

```ts
// DOT_WIRING.resolveInto(DOT_AUDIO_DELTA_BUFFER, audioState.bands, ...);
// currentScene.encode(commandEncoder, scene.time, dt);
// metaballSdf.refreshFromSource(currentScene);
// kineticHandoff.update(dt, scene.time);
// filmPost.updateConfig(composeFilmConfig(DOT_AUDIO_DELTA_BUFFER));
```

`render(passEncoder)`:

```ts
// metaballSdf.render(passEncoder);
// (filmPost は MotionStage が outputView を渡す経路で別途呼ぶ — TBD in Stream 4)
```

参考実装: `life/output/motion-dot-new-webgpu/src/main.ts`。MotionParticipant lifecycle に再構成する作業。

---

## 4. 引き継ぎ手順 (user 操作)

### A. commit + push

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
git add packages/motion-dot/ bun.lock docs/renewal-2026/

git commit -m "feat(renewal-2026): Stream 2 motion-dot package 化 (Phase 1 scaffold + real createDotScene)

- Vendor motion-dot-new-webgpu source (animation/audio/compute/input/render/scene/shaders/transition/ui)
- Wire 6 workspace deps incl @chibatakumi/motion-core
- createDotScene(name, device, opts?) — REAL factory, 17 scenes (16 vendor preset + fluid local)
- createDotParticipant(opts?) — SCAFFOLD matching motion-grid/motion-flow parity
- Re-export createKineticHandoff / createGalleryMode / createFluidScene + types
- DOT_SCENE_NAMES / DotSceneName for type-safe scene access
- bunx tsc --noEmit 0 errors (motion-dot)
- README: Canvas2D archive contract + Phase A deferred items"

git push -u origin feat/renewal-2026-phase2-motion-dot
```

### B. (option) tsconfig hygiene followup

motion-grid / motion-flow の `@webgpu/types` 不足は別 commit / 別 issue 推奨:

```diff
# packages/motion-grid/package.json (motion-flow も同じ)
   "devDependencies": {
+    "@webgpu/types": "^0.1.69"
   }

# packages/motion-grid/tsconfig.json (motion-flow も同じ)
   "compilerOptions": {
     "rootDir": "src",
+    "types": ["@webgpu/types"]
   }
```

### C. 次 chat 起動 prompt

```
Renewal 2026 Stream 4 (Portfolio Shell + MotionStage) を起動してください。

起点 doc: chibatakumi-portfolio/docs/renewal-2026/stream-2-completion-handoff.md §3
親計画: life/.claude/plans/portfolio-renewal-2026-04.md §7 Stream 4
前提: Stream 1/2 landed (motion-core + motion-grid + motion-flow scaffold + motion-dot 完了)

Stream 4 の最初の deliverable:
1. apps/web/src/features/motion/ に MotionStage 実装 (canvas owned, RAF loop, blendTo orchestration)
2. apps/web/next.config.ts transpilePackages に @chibatakumi/motion-* 追加
3. apps/web/package.json に motion-dot/grid/flow を dep として配線
4. /experiments/dot で createDotParticipant が live (Phase A wiring もここで完成)

Agent Teams 推奨: 4-A (MotionStage core) / 4-B (MotionParticipant Phase A wiring × 3 packages 並列) / 4-C (route + transpilePackages) / 4-D (typecheck + preview deploy 検証)
```
