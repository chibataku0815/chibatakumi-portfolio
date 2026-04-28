# Stream 1 Completion — 次チャット引き継ぎ

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 完了 Stream | Stream 1 — Motion Core Library 抽出 |
| 親計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` |
| 起点 handoff | `docs/renewal-2026/stream-1-motion-core-handoff.md` |
| 現在 branch | `feat/renewal-2026-phase1-motion-core` |
| 状態 | **両 Phase 完了 / working tree dirty / 未 commit / 未 push** |

---

## 0. 本書の使い方

新 chat 開始時にこの doc を最初に読み込ませる。§3 の outstanding 4 件をユーザーと確定させてから §6 の Stream 2 着手プロンプトを投入。

---

## 1. 完了サマリ

### Phase A — `webgpu-motion-libs` 独立 repo + portfolio submodule
| 軸 | 結果 |
|---|---|
| 新 repo | https://github.com/chibataku0815/webgpu-motion-libs (**private**) |
| 構成 | bun workspace、`packages/*` 11 packages |
| 抽出 packages | webgpu-motion-{art, audio, dom, input, post, scene, shell, ui} + gpu-{fx-presets, 2.5d-presets, film-post} |
| 履歴 | subtree split で個別 history 保持、main 上 55 commits（HEAD `e498a44`） |
| ローカル mirror | `~/code/webgpu-motion-libs/` |
| portfolio 統合 | `vendor/webgpu-motion-libs` submodule、root `package.json` workspaces に `vendor/webgpu-motion-libs/packages/*` 追加 |
| 検証 | webgpu-motion-libs `bun install` EXIT 0（36 packages）／ portfolio `bun install` EXIT 0（postinstall: film-lab-core/renderer/smart-look 全 green） |

### Phase B — MotionParticipant API + grid/flow adapter
| 成果物 | 内容 |
|---|---|
| `packages/motion-core/src/participant/index.ts` | `MotionParticipant<TParams>`, `MotionStage`, `SceneSnapshot`, `AudioState` 型定義 |
| `packages/motion-core/src/{shell,audio,post,art}/index.ts` | webgpu-motion-* re-export shim（type+runtime）、subpath-only export で tree-shaking + SSR 境界保持 |
| `packages/motion-core/src/audio/index.ts` | `AudioWiring<P>` alias を `AudioWireSet<P>` の上に追加（upstream brand-symbol 変更耐性） |
| `packages/motion-grid/src/participant.ts` | `createGridParticipant` + `GridParams`（3 wires: film.bloom.{threshold,intensity}, film.tonemap.compression）、`GRID_WIRING` canonical 定数 |
| `packages/motion-flow/src/participant.ts` | `createFlowParticipant` + `FlowParams`（8 wires: 3 field/trail + 5 film、Phase 10 post-tune coefficients 反映）、`FLOW_WIRING` canonical 定数 |
| typecheck | Phase B code 0 errors（残 5 errors は vendored upstream の `@webgpu/types` 未設定 / `*.wgsl?raw` module declaration 不足。上流側の責任） |

### 採用した design 方針
- **No-fallback**: lifecycle メソッドは init 前に呼ばれたら **throw**（silent no-op 禁止、`feedback_no_fallback_bug_hotbed.md`）
- **Subpath-only barrel**: `motion-core/src/index.ts` は `./participant` のみ re-export、shell/audio/post/art は subpath 経由のみ（Next.js SSR boundary clean）
- **Workspace 解決**: vendor 配下は per-workspace install で `node_modules/@chibatakumi/*` ではなく packages/*/node_modules/ で resolve

---

## 2. Working Tree の現状（要 commit / 未 push）

```
A  .gitmodules
 M bun.lock
 M package.json                          # workspaces に vendor/* 追加
A  vendor/webgpu-motion-libs             # submodule pointer @ e498a44e
?? docs/renewal-2026/                    # この doc + handoff
?? packages/design-system/               # skeleton（Stream 3 owner）
?? packages/motion-core/                 # Phase B 実装
?? packages/motion-dot/                  # skeleton（Stream 2 owner）
?? packages/motion-flow/                 # Phase B 実装
?? packages/motion-grid/                 # Phase B 実装
```

**life monorepo 側の throwaway branches（cleanup 非緊急）**:
```
split/gpu-2.5d-presets   split/webgpu-motion-input
split/gpu-film-post      split/webgpu-motion-post
split/gpu-fx-presets     split/webgpu-motion-scene
split/webgpu-motion-art  split/webgpu-motion-shell
split/webgpu-motion-audio split/webgpu-motion-ui
split/webgpu-motion-dom
```

---

## 3. ★ 次チャットでユーザー判断が必要な 4 件

### 3.1 `render()` signature — compute pass の余地
**問題**: 現状 `render(passEncoder: GPURenderPassEncoder)` のみ。flowline は 4000-16000 agents の compute dispatch を毎フレーム必要とするが、render pass 内では encode できない。

**選択肢**:
- A. シグネチャ拡張: `render(cmdEncoder: GPUCommandEncoder, passEncoder: GPURenderPassEncoder)`
- B. 別 hook 追加: `dispatchCompute?(cmd: GPUCommandEncoder): void` を render の前に呼ぶ
- C. participant が自分で `device.createCommandEncoder()` して別 submit（GPU 同期ペナルティ）

**推奨**: **B**（compute は optional hook、stage 側で `if (p.dispatchCompute) p.dispatchCompute(enc)` の安全性）。grid は使わないので signature 太らせない。

### 3.2 `blendTo()` の駆動責任
**問題**: 0.5s scene blend で outgoing/incoming どちらが blend を駆動するか曖昧。

**現状実装**: 両 participant の `blendTo` を MotionStage が叩く想定。

**flowline 既存 pattern**: 単一 source（次 scene が参照を取って自分側で fade-in）。

**推奨**: **MotionStage が blend を所有**、participant は `.blendTo(other, t)` で「自分が outgoing なら fade-out、incoming なら fade-in」を判定（`other` 引数で判別可）。現実装の shape はどちらにも対応可。次 chat で MotionStage 実装時に確定。

### 3.3 Vercel build での submodule 解決安定性
**問題**: vendor 配下の `@chibatakumi/*` は per-workspace install。Vercel の read-only filesystem post-build で resolve が壊れる可能性。

**確認方法**: 早期に preview deploy で `bun install --frozen-lockfile` → build → 各 surface が import できるか確認。Stream 4 (Portfolio Shell) 着手時に最初の deploy で検証。

**先回り対策**: `next.config.ts` の `transpilePackages` に `@chibatakumi/motion-core`, `webgpu-motion-*` を追加する準備（実装は Stream 4）。

### 3.4 `AudioState.bands` の型
**問題**: hot-path で毎 frame alloc を避けたい。

**現状定義**: `bands: Float32Array`（alloc-free）。

**webgpu-motion-audio 実装**: `AudioBands` は 4-field interface（`{ low, mid, high, presence }` 形）。

**推奨**: **MotionStage が `AudioBus` 内部の Float32Array view を保持** し、participant に渡す時は `bands: Float32Array` のまま。型は `Float32Array` で確定、interface AudioBands は外部参照用にのみ残す。

---

## 4. Stream 2 (motion-dot package 化) 着手条件

| 条件 | 状態 |
|---|---|
| Phase A 完了（vendor packages 解決可能） | ✅ |
| MotionParticipant API 確定 | △（§3.1, §3.2 の決定待ち） |
| portfolio bun install green | ✅ |
| `packages/motion-dot/` skeleton 存在 | ✅（src/, package.json, README.md） |

**§3 の 4 件確定後すぐ着手可能**。motion-dot は既に `output/motion-dot-new-webgpu/` で WebGPU 実装完成しているため、scope は「package 化 + portfolio scene API 整備」で 3-5 日想定（plan §5.2）。

---

## 5. 残タスク（Stream 1 範疇では非ブロッカー）

- [ ] life の `split/*` 11 branches 削除（任意、いつでも可: `git branch -D split/<name>`）
- [ ] portfolio に commit + push（ユーザーが diff レビュー後）
- [ ] webgpu-motion-libs の upstream 修正:
  - `tsconfig.json` に `@webgpu/types` 追加
  - `vite-env.d.ts` に `*.wgsl?raw` module declaration 追加
  - 上記は webgpu-motion-libs 側で commit→push、submodule pointer 更新が必要

---

## 6. 次チャット起動プロンプト（コピペ用）

```
Stream 1 完了の引き継ぎ doc を読んで状態確認。

doc: chibatakumi-portfolio/docs/renewal-2026/stream-1-completion-handoff.md

タスク:
1. §3 の 4 件 (render signature / blendTo 駆動 / Vercel resolve / AudioState.bands) を確定。
   推奨案で OK なら明示。違うなら指摘。
2. 確定後、§5 の残タスクのうち以下を実施:
   - portfolio に commit（メッセージは ja、conventional commits 形式）
     - ブランチ feat/renewal-2026-phase1-motion-core への単一 commit でよい
   - life の split/* 11 branches 削除
   - webgpu-motion-libs の upstream typing 修正（@webgpu/types + wgsl?raw）→ submodule pointer 更新
3. Stream 2 (motion-dot package 化) を Agent Teams で起動。
   起点 doc: 同 §4 の着手条件
   親計画: life/.claude/plans/portfolio-renewal-2026-04.md §5.2, §7 Stream 2
```

---

## 7. 参照

- 親計画: `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`
- 起点 handoff: `docs/renewal-2026/stream-1-motion-core-handoff.md`
- Phase A 詳細手順: 同 §3.2 Step A-D
- Phase B 設計根拠: 親計画 §5.1 (Participant API), §5.5 (Pipeline)
- 関連 memory:
  - `feedback_no_fallback_bug_hotbed.md` — silent fallback 禁止
  - `feedback_review_release_blockers_deep_pass.md` — Agent Teams merge 後の独立 deep pass
  - `feedback_minimize_decision_cost.md` — 承認後はまとめて landed
