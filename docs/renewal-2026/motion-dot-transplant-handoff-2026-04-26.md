# motion-dot Wholesale Transplant Handoff (D2.8)

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-26 JST |
| 起点 user directive | 「motion-dot は本プロジェクトのままポートフォリオに移植したい / 保守的意見は優先せず品質最優先」 |
| 移植元 | `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-dot-new-webgpu/` (Vite app, canonical visual reference) |
| 移植先 branch | `feat/renewal-2026-phase2-motion-dot` (push 済) |
| 移植 commits | `d5702367` (transplant) + `42a15541` (boot defaults restore + audio.mp3) |
| Plan SSoT | `life/.claude/plans/idempotent-knitting-dragon.md` |
| Supersedes | `docs/renewal-2026/motion-dot-quality-remediation-handoff.md` (patchwork 撤回) |
| 親計画 | `life/.claude/plans/portfolio-renewal-2026-04.md` D2.8 |
| user verdict | 「一旦 OK」(2026-04-26)、full visual side-by-side parity 検証は次 chat 引継ぎ |

---

## 0. 次 chat 着手前の必須手順

1. 親計画 §0.4: `life/.claude/plans/portfolio-renewal-2026-04.md` §7 read / `stream-status/{1-5}.md` 全件 read
2. 本 handoff doc を end-to-end 通読
3. `life/.claude/plans/idempotent-knitting-dragon.md` 通読（移植プランの正本）
4. `life/output/motion-dot-new-webgpu/` を `bun run dev` で起動して視覚 baseline を体感
5. portfolio を `cd apps/web && bun run dev` 起動して `/` と `/experiments/dot` を side-by-side 確認

---

## 1. landed (commits)

### `d5702367 feat(motion-dot): wholesale transplant from motion-dot-new-webgpu (D2.8)`

- `packages/motion-dot/src/` の **bridge index.ts (1125 行) を削除**、原 `src/` を **verbatim copy** で展開
- `main.ts` (668 行) を verbatim copy + 最小編集で `mountMotionDotApp(opts: MountOptions): Promise<MountHandle>` に変換
  - line 217 `requireMotionAppElements()` → `opts.canvas / opts.hostOverlay`
  - line 302 `new AudioBus({ demoStyle: "beat" })` 据え置き
  - line 319-323 HUD/button factories に `hostOverlay` を引数で渡す
  - line 495 `createFixedStepLoop({...}).start()` 分離して `loop` 変数で stop() 可能に
  - line 663 `showFallback(fallback, e)` → `opts.onError?.(e); throw e;`
  - line 668 `main();` 削除
- `MountHandle.configure()` 実装: `setActiveScene / setSceneCycle / setHudVisible / setInputEnabled / setAudioEnabled` を一括公開
- auto-cycle: 原に無いため独自実装（`setInterval` 駆動、`kineticHandoff.start(sourceIdx)` で transition）
- subtree (animation/audio/compute/input/render/scene/shaders/transition/ui) は **byte-identical**（diff 0）
- `wgsl.d.ts` 削除、原 `vite-env.d.ts` を採用（Turbopack `*.wgsl?raw` rule で透過）
- `packages/motion-dot/src/index.ts` を 2 行 re-export に再生成
- `ui/hud.ts` 全 5 factory に `parent?: ParentNode` 引数追加（webgpu-motion-dom 既存 option を forwarding）
- `apps/web/src/features/motion/MotionStageProvider.tsx` 改修: `createMotionStage` 削除、`mountMotionDotApp` を boot
- `MotionStageContext.ts` payload を `{ kind, mount?: MountHandle }` に縮小
- `useExperimentParticipant.ts` 削除 → `useMotionDotMount.ts` 新規（context から MountHandle を取って `configure(...)` 呼ぶだけ）
- `AmbientHomeHero.tsx`, `experiments/dot/client.tsx` 書き換え
- `PageTransition.tsx` を pass-through 化（`setActive` 呼び出し削除）
- `experiments/grid/client.tsx`, `experiments/flow/client.tsx` を Wave 3 placeholder banner に差し替え
- 母数: 14 file changed, +971 / -1403 (差分 -432 行 = 抽象化税の解消)

### `42a15541 fix(motion-dot): restore original boot defaults — HUD / keyboard / audio panel always live`

- 直前 commit で MotionStageProvider と AmbientHomeHero に `hudVisible: false / inputEnabled: false / audioEnabled: false` を override していた → user 「完全踏襲」directive を受けて全部撤去
- 結果: HUD overlay / keyboard cluster / film toggle button / audio settings panel / file picker (key M) / hotkey legend 全部 boot 直後から live
- `apps/web/public/audio.mp3` (6.7MB、原 file) コピー、`main.ts:415` の `defaultSrc` を絶対パス `"/audio.mp3"` に変更（Next.js から route 配下で 404 を防ぐ）
- 4 file changed, +16 / -25

---

## 2. 動作する control surface（原と同一）

### `/` (home)
- AmbientHomeHero が auto-cycle 設定（4 scene 5.5s 周期）を出した上で **HUD / keyboard / film toggle / audio panel すべて live**
- ユーザは Arrow keys で auto-cycle を上書きしてシーン手動切替可能
- F で film toggle、A で audio panel、M で audio file picker、W で typography text 変更、T で transition、R で reset、0 で gallery 解除、I で panel toggle、H で options visibility

### `/experiments/dot`
- `sceneCycle: false` のみ override、それ以外は boot defaults
- 16 scene library を Arrow keys で manual navigation（fluid scene = "Fluid (GPU)" 含む）

### `/experiments/grid`, `/experiments/flow`
- Wave 3 placeholder banner（motion-grid/flow は Wave 3 で原コードベースパターンで再構築）

---

## 3. 検証済み

- ✅ `apps/web/node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json` → 1 baseline error のみ (`params-codec.test.ts:87`、Wave 1 起因外)
- ✅ `apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-dot/tsconfig.json` → 0 errors
- ✅ `bun run --cwd apps/web build` → ✓ Compiled successfully in 2.3s, ✓ 67 pages prerendered (13 workers, 554ms)
- ✅ `next dev` boot success（user 「一旦 OK」確認）

---

## 4. 残作業（次 chat 担当）

### 4.1 Visual side-by-side parity 検証（最優先）

`life/output/motion-dot-new-webgpu` (vite dev) と `chibatakumi-portfolio/apps/web` (next dev) を **同時起動**して以下確認:

| 軸 | 検証項目 |
|---|---|
| **A. Audio off — single scene** | 全 16 scene で particle 軌道・密度・metaball 周辺 bloom が一致 |
| **B. Fluid scene** | 「Fluid (GPU)」シーンが portfolio に復活して原と同一見え方（前 chat で missing だった、transplant で復活想定） |
| **C. Audio on** | audio panel → Default Track 再生で metaball threshold pulse のタイミング一致、onset で rim/bloom transient 一致 |
| **D. File picker** | key M または audio panel "File" でローカル音楽ファイル選択 → 解析正常動作 |
| **E. Audio Input** | audio panel "Audio Input" で外部 interface (Scarlett 等) 選択 → 動作確認 |
| **F. Film toggle** | F キーまたは右上ボタンで film passthrough/post 切替が両方で同一 |
| **G. Home auto-cycle** | `/` で 5.5s 周期 4 scene cycle 正常動作 |
| **H. Cross-route survival** | `/` → `/experiments/dot` → `/about` → `/` で canvas 再 mount 無し、GPU 再 init 無し |
| **I. HMR** | AmbientHomeHero.tsx 編集 → save で canvas 描画継続 |

### 4.2 既知の懸念（Risk register、verify 必要）

- **R1 HMR**: `MountHandle.stop()` で loop.stop() / keyboardTeardown / overlay 撤去は実装済だが、Next.js fast refresh で実際に二重起動が起きないか要 console / GPU profiler 確認
- **R5 dual AudioBus**: `apps/web/src/features/audio/AudioBusProvider` (Wave 1 D5.3) と motion-dot 内 AudioBus が **別 instance**。motion-dot のは視覚効果駆動、AudioBusProvider のは SoundToggleControl/MicInputGate 駆動。**Wave 3 で統合（MountHandle.audioBus を expose し AudioBusProvider が adopt）推奨**
- **motion-core/src/stage/index.ts**: 451 行の orphan dead code（消費者 0）。Wave 3 で削除 or motion-grid/flow rebuild で再利用するか判断

### 4.3 Wave 3 forward

- D2.7 formal verify (kinetic-handoff full cycle / composite-25d gallery / 17 scene 全切替 e2e selector)
- motion-grid / motion-flow を原コードベースパターン（own canvas + own loop）で再構築
- gallery mode を原コードベース上に再実装（前 chat で撤退した showcase peak 機能）

---

## 5. 重要参照 path

| 種別 | path |
|---|---|
| **Plan SSoT** | `life/.claude/plans/idempotent-knitting-dragon.md` |
| **本 handoff** | `chibatakumi-portfolio/docs/renewal-2026/motion-dot-transplant-handoff-2026-04-26.md` |
| **superseded** | `chibatakumi-portfolio/docs/renewal-2026/motion-dot-quality-remediation-handoff.md` |
| **stream-status** | `chibatakumi-portfolio/docs/renewal-2026/stream-status/2.md` |
| **移植元 (原 motion-dot)** | `life/output/motion-dot-new-webgpu/` |
| **移植先 main.ts** | `chibatakumi-portfolio/packages/motion-dot/src/main.ts` (verbatim + ~140 行 mount adapter) |
| **移植先 index.ts** | `chibatakumi-portfolio/packages/motion-dot/src/index.ts` (2 行 re-export) |
| **MotionStageProvider** | `chibatakumi-portfolio/apps/web/src/features/motion/MotionStageProvider.tsx` |
| **useMotionDotMount** | `chibatakumi-portfolio/apps/web/src/features/motion/useMotionDotMount.ts` |
| **AmbientHomeHero** | `chibatakumi-portfolio/apps/web/src/features/hero/components/AmbientHomeHero.tsx` |
| **experiments/dot client** | `chibatakumi-portfolio/apps/web/src/app/[locale]/experiments/dot/client.tsx` |
| **PageTransition** | `chibatakumi-portfolio/apps/web/src/shared/transitions/PageTransition.tsx` |
| **audio asset** | `chibatakumi-portfolio/apps/web/public/audio.mp3` |

---

## 6. 次 chat 起動 verbatim prompt

```
chibatakumi-portfolio renewal 2026 D2.8 motion-dot wholesale transplant の visual parity verification を継続してください。

== 必須前提 (skip 禁止) ==
1. 親計画: /Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md §7 + stream-status/{1-5}.md 全件 read
2. plan SSoT: /Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/idempotent-knitting-dragon.md 通読
3. 本 task の handoff doc 通読: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/motion-dot-transplant-handoff-2026-04-26.md
4. 原プロジェクト visual baseline: /Volumes/SamsungPortableSSDX5001/documents/life/output/motion-dot-new-webgpu/ を bun run dev で起動して目で焼き付ける
5. portfolio dev: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/web で bun run dev 起動

== 前 chat 状況 ==
- branch: feat/renewal-2026-phase2-motion-dot tip = 42a15541 (push 済)
- D2.8 [~] partial: wholesale transplant landed (commits d5702367 + 42a15541)、user 「一旦 OK」確認、full visual side-by-side parity verification 残
- typecheck: motion-dot 0 errors / apps/web 1 baseline error / build 67/67 pages prerendered
- HUD / keyboard / film toggle / audio panel / file picker / 全 control surface 原と同一が起動

== 担当 D{N}.{n} ==
D2.8 motion-dot wholesale transplant の visual parity verification + 残作業のみ。Wave 2 の他 D{N}.{n} には触らない。

== 着手手順 ==
handoff doc §4.1 の 9 軸 (A-I) を side-by-side で順次確認:
A. Audio off — single scene 視覚 parity
B. Fluid scene 復活確認（前 chat で missing だった）
C. Audio on — reactive parity
D. File picker (key M)
E. Audio Input
F. Film toggle (F key)
G. Home auto-cycle (5.5s × 4 scene)
H. Cross-route survival
I. HMR

差分があれば原因特定 → main.ts (motion-dot) の minimum diff で fix。fix 不要なら user OK で D2.8 を [~] → [x] 昇格、stream-status/2.md + Wave 1 handoff doc 関連箇所更新。

== 制約 ==
- 保守的意見優先せず品質最優先 (user 既定 directive)
- 完全踏襲: 原 motion-dot-new-webgpu の挙動を 1:1 で再現
- silent fallback 禁止 (feedback_no_fallback_bug_hotbed)
- chat 独断 de-scope 禁止 (plan §0.3)
- 並列 Stream は silently 縮退禁止 (feedback_no_silent_stream_redefine)
- handoff doc を invalidate しないように stream-status / 親 handoff を同時更新

main thread 直接実装が現実的（visual diff の人間目視 + 1 file 中心の patch 作業）。Agent Teams は使わない。

着手前に原と portfolio の **side-by-side baseline 確認** が最優先。これなしで実装に入っても hit miss が続く。
```

---

## 7. commit / push 状態

- 全 commits は origin に **push 済**:
  - `df1bbbac` Wave 1
  - `c0761910` Wave 2 finalize
  - `d2ef8676` chore: motion-dot deps
  - `183729fb` Director audit (other chat)
  - `d5702367` transplant
  - `42a15541` boot defaults restore + audio.mp3

- 次 chat はクリーン HEAD から作業開始可能。

---

## 8. 教訓（patterns に抽出候補）

- **抽象化リファクタは小さな regression を量産する**: 668 行の動く code を 1125 行の "綺麗" な抽象に書き直すと、抽象境界の細部 (constants / config keys / 副作用) が drift して quality が侵食される。「そのまま移植」が常に第一案、抽象化は 2 周目以降。
- **byte-identical な subtree 確認は drift 検査の決定打**: `diff -q` で原 src/ と現 src/ を比べた結果、subtree 全 file が一致していたため「実 transplant の delta は orchestration layer (main.ts) のみ」と確信できた。次回も類似 transplant 時は最初に diff -q 確認。
- **motion-dot は canvas/GPU/RAF/AudioBus/FilmPostPass/HUD を all-own する設計**: MotionStage 抽象とは正面衝突する。motion-grid / motion-flow を participant API で wrap するなら、motion-dot は singleton mount として並走させる二重構造が現実解。
