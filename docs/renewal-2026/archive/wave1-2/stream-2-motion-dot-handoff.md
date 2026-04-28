# Stream 2 — motion-dot package 化 起動 handoff

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 前提 | Stream 1 完了 (`feat/renewal-2026-phase1-motion-core` に landed、commit `7e16c224`) |
| 親計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` (§5.2, §7 Stream 2) |
| 完了 handoff | `docs/renewal-2026/stream-1-completion-handoff.md` |
| 推奨実行 | **新 chat で Agent Teams 5 並列** |

---

## 0. 着手条件 (確認済み)

| 条件 | 状態 |
|---|---|
| Phase A 完了 (vendor/webgpu-motion-libs submodule 解決可) | ✅ |
| MotionParticipant API 4 件 確定 | ✅ (Stream 1 §3、推奨案で確定) |
| portfolio bun install green | ✅ |
| motion-core / motion-grid / motion-flow tsc --noEmit 0 errors | ✅ |
| `packages/motion-dot/` skeleton (src/, package.json, README.md) | ✅ |

---

## 1. Stream 2 ゴール

`life/output/motion-dot-new-webgpu` を `chibatakumi-portfolio/packages/motion-dot/` として package 化し、portfolio から scene 単位で import 可能な API を整備する。**rewrite ではなく package 化 + integration**。

### 成果物

- `packages/motion-dot/src/` に WebGPU 実装を移植
  - 17+ particle scene (orbit / river / magnet / mitosis / pendulum / ripple / delta / flock / helix / phase-transition / firefly / molecular / chain / converge / text-attractor / grid-fluid 等)
  - metaball SDF, kinetic-handoff, 2.5D composite (gallery mode), film post
- `createDotScene(name: SceneName, opts)` API 整備
- `MotionParticipant` 化 (Stream 1 で確定した API に合わせる)
- portfolio 内の demo route で 17+ scene 動作確認

### Scope 想定: 3-5 日 (Agent Teams 5 並列)

---

## 2. ソース location

| 内容 | パス |
|---|---|
| WebGPU 実装本体 | `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-dot-new-webgpu/` |
| portfolio 統合先 | `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/packages/motion-dot/` |
| 共有 lib (vendor) | `chibatakumi-portfolio/vendor/webgpu-motion-libs/packages/{webgpu-motion-shell,audio,post,art,scene,input,dom,ui,gpu-fx-presets,gpu-2.5d-presets,gpu-film-post}` |

---

## 3. MotionParticipant API (Stream 1 で確定)

### 3.1 render() signature
**B 案採用**: `render(passEncoder)` のみ。compute 必要時は optional hook を実装:
```typescript
dispatchCompute?(cmd: GPUCommandEncoder): void;
```
MotionStage が render の前に `if (p.dispatchCompute) p.dispatchCompute(enc)` で呼ぶ。
**dot は基本的に compute 不要** (metaball SDF は fragment 計算)、必要 scene のみ optional 実装。

### 3.2 blendTo()
**MotionStage が blend を所有**。`blendTo(other, t)` で participant が role 自己判定 (other 参照で outgoing/incoming 判定)。

### 3.3 AudioState.bands
**`Float32Array` 確定** (alloc-free)。MotionStage が AudioBus の Float32Array view を保持。`AudioBands` interface は外部参照用に残す。

### 3.4 transpilePackages
Stream 4 (Portfolio Shell) 着手時の最初の preview deploy で検証。Stream 2 は影響なし。

---

## 4. Agent Teams 5 並列分解 (推奨)

### Stream 2-A: Source 移植 + 依存整理
- `output/motion-dot-new-webgpu/src/*` を `packages/motion-dot/src/` にコピー
- import path を `@chibatakumi/webgpu-motion-*` (vendor 解決) に書き換え
- package.json dependencies に `webgpu-motion-{shell,audio,post,art,scene,input,dom,ui}`, `gpu-fx-presets`, `gpu-2.5d-presets` を追加
- tsconfig.json 整備 (Stream 1 motion-core/grid/flow の構成と一致)

### Stream 2-B: createDotScene API
- `packages/motion-dot/src/index.ts` で `createDotScene(name, opts)` を export
- 17+ scene 名を type-safe にする (`SceneName` union)
- `MotionParticipant<DotParams>` factory として実装 (DOT_WIRING canonical)
- HUD (debug overlay) は portfolio 標準で OFF、option で toggle 可能に

### Stream 2-C: kinetic-handoff transition + composite-25d
- `transition/kinetic-handoff.ts` を `MotionStage` の page transition orchestrator から呼べる shape に整備
- `composite-25d.ts` を gallery mode (`/experiments/dot`) で full-screen 採用可能な API に
- 既存 standalone gallery mode (HUD あり、dev script で動かせる) を維持

### Stream 2-D: typecheck + 単体動作検証
- motion-dot 単体で `bunx tsc --noEmit` 0 errors
- vendor lib 経由の import がすべて解決
- portfolio 内 demo route (`apps/web/app/[locale]/_dev/dot/page.tsx` 等、tmp で OK) で 1 scene が動作

### Stream 2-E: 残 Canvas2D 版 archive 化
- `output/motion-dot-new` (Canvas2D legacy) は **削除しない**
- `journal/motion-studies/dot-new-canvas2d` として後続 Stream 4 で archive 予定の旨を README に記載
- WebGPU 版が main craft signature であることを明示

---

## 5. 依存・ブロッカー

- Stream 1 完了 ✅
- vendor/webgpu-motion-libs の submodule pointer が `3ec0ffc` 以降で固定されていること (typing 修正済) ✅
- 親計画 §5.2 の "package 化 + portfolio integration" 方針に従う

---

## 6. 完了基準

- [ ] `packages/motion-dot/` 配下に 17+ scene 動作実装が landed
- [ ] `createDotScene(name, opts)` API export
- [ ] `bunx tsc --noEmit` 0 errors (motion-dot)
- [ ] portfolio 内 demo route で 1 scene 動作確認
- [ ] `feat/renewal-2026-phase2-motion-dot` ブランチ (or 同 phase1 ブランチ continuation) に commit + push
- [ ] Stream 3/4/5 着手 handoff doc を作成

---

## 7. 起動プロンプト (新 chat で投入)

```
Stream 2 (motion-dot package 化) を起動してください。

起点 doc: chibatakumi-portfolio/docs/renewal-2026/stream-2-motion-dot-handoff.md
親計画: life/.claude/plans/portfolio-renewal-2026-04.md §5.2, §7 Stream 2
ソース: life/output/motion-dot-new-webgpu/
統合先: chibatakumi-portfolio/packages/motion-dot/

Stream 1 完了状態:
- feat/renewal-2026-phase1-motion-core landed (commit 7e16c224, push 済)
- vendor/webgpu-motion-libs submodule @ 3ec0ffc (typing fix landed)
- motion-core / motion-grid / motion-flow typecheck 0 errors
- API 4 件確定 (B / MotionStage 所有 / Float32Array / Stream 4 検証)

Agent Teams 5 並列で起動。Stream 2-A 〜 2-E の 5 ストリーム
(handoff doc §4 参照) に分割して並列実行。
```
