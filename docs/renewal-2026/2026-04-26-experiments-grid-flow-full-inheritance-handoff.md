# Experiments Grid/Flow — Full-Inheritance Port (2026-04-26)

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-26 JST |
| パッケージ | `/experiments/grid` + `/experiments/flow` 完全踏襲ポート |
| 親 SSoT | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` |
| 前 chat handoff | `docs/renewal-2026/package-4-motion-works-grid-flow-handoff-2026-04-26.md` (ambient minimum landed) |
| 実装リポ | `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` |
| 作業ブランチ | `feat/renewal-2026-phase2-motion-dot` |
| ステータス | **landed (working tree, uncommitted)** — tsc green、placeholder scan clean、未コミット |
| 次 chat | §6 verbatim prompt をそのまま使う |

---

## 0. このドキュメントの目的

Package 4 で landed した「ambient minimum」(audio/HUD/keyboard なし) を **元 standalone Vite アプリ (`output/motion-grid-guided-webgpu` / `output/motion-flowline-webgpu`) と 1:1 で完全踏襲** した状態に拡張した記録。3 stream Agent Teams で並列実装。

---

## 1. 実装スコープ

### 1.1 ユーザー指示の核

- 「http://localhost:3217/experiments/grid と /experiments/flow が元のプロジェクトを完全踏襲できていません。完全に引き継ぐ形にしてください」
- 「本質を最優先、外殻は最小限。全てがうまく行った時の品質保証したい時にのみ外殻」
- 「保守的な意見は優先せず、プロダクトの品質を最優先」
- 「Agent Teamsで」

### 1.2 「完全踏襲」の定義

`output/motion-{grid,flow}-webgpu/src/main.ts` の standalone Vite アプリと UX 1:1。具体的には:

**grid:**
- AudioBus + AudioController (mic + music picker)
- HUD (FPS / scene / pattern / continuity / audio dial)
- ControlCluster (3 行 12 チップのクリック式ボタン)
- InputOverlay (hero token テキスト入力 + word morph)
- Keyboard cluster: ←→ pattern, R reset, T continuity, L loop, Z/⇧Z zoom, 0 default, F film, A audio, M music, I input, H hud
- 連続性モード (T) と word morph handoff
- Audio-reactive `GRID_WIRING.resolveInto` + electric signals 合成 film post

**flow:**
- AudioBus + AudioController (defaultSrc `/audio.mp3`)
- Tap-to-Start オーバーレイ
- HUD with scene picker (1-7) + keymap
- Auto-cycle 7 シーン × 12 秒 (84 秒フル一周)
- Keyboard: 1-7 pin, 0 auto, R reseed, A audio, F film, ? help
- Audio-reactive `FLOWLINE_WIRING` (breathStrength / vorticityPulse / rimPulse) + 8 wire 音響反応 film post

### 1.3 dot canvas 共存問題の解決

前 chat の Phase A+1 残課題だった「root layout の dot canvas が grid/flow ルートでも GPU loop を回し続ける」問題を **`MotionStageVisibility` context** で解決。grid/flow 滞在中は dot loop を完全停止 → GPU 競合なし。

---

## 2. 3 stream 並列実装 (Agent Teams)

### Stream A — `packages/motion-grid` 完全ポート

| 操作 | ファイル | 行数 |
|------|---------|------|
| NEW | `src/input/keyboard.ts` | 150 |
| NEW | `src/ui/hud.ts` | 371 |
| REWRITE | `src/mount.ts` | 670 (旧 178) |
| UPDATE | `package.json` | +`webgpu-motion-dom` / +`webgpu-motion-input` |

`main.ts` 668 行と 1:1 対応。差分は SSR ガード (`requireMotionAppElements` 削除、`document.body.appendChild` → `hostOverlay.appendChild`、`import.meta.env.DEV` Vite 専用ブロック削除) のみ。

### Stream B — `packages/motion-flow` 完全ポート

| 操作 | ファイル | 行数 |
|------|---------|------|
| NEW | `src/input/bindings.ts` | 75 |
| NEW | `src/ui/hud.ts` | 107 |
| REWRITE | `src/mount.ts` | 459 (旧 259) |
| UPDATE | `package.json` | +`webgpu-motion-input` / +`webgpu-motion-ui` |

`main.ts` 403 行と 1:1 対応。`defaultSrc: "audio.mp3"` → `defaultSrc: opts.defaultAudioSrc ?? "/audio.mp3"` (Next.js public root 対応)。

### Stream C — Route + dot suspension + index labels

| 操作 | ファイル |
|------|---------|
| NEW | `apps/web/src/features/motion/MotionStageVisibility.tsx` |
| MODIFY | `apps/web/src/features/motion/MotionStageProvider.tsx` (outer/inner 分割、`useEffect` の dep を `[hidden]` に) |
| MODIFY | `apps/web/src/features/motion/index.ts` (export 追加) |
| MODIFY | `apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx` (overlayRef + `useHideMotionStageOnMount`) |
| MODIFY | `apps/web/src/app/[locale]/(portfolio)/experiments/flow/client.tsx` (同上) |
| MODIFY | `apps/web/src/app/[locale]/(portfolio)/experiments/page.tsx` (state: "preview" → "active"、stale comment 削除) |

---

## 3. 主要 API 契約変更

### 3.1 `MountGridOptions` / `MountFlowOptions`

```ts
// 必須化
readonly hostOverlay: HTMLElement;
// 新規 (flow のみ)
readonly defaultAudioSrc?: string;  // default: "/audio.mp3"
```

route client は `<div ref={overlayRef} className="fixed inset-0 z-10 pointer-events-none [&>*]:pointer-events-auto" />` を canvas 上に重ね、HUD/cluster 子要素のみ pointer-events:auto にする。

### 3.2 `MotionStageVisibility` API

```ts
// 任意の子コンポーネントで呼ぶと、その mount 中は global dot canvas が停止
useHideMotionStageOnMount(): void

// 必要なら状態のみ参照
useMotionStageHidden(): boolean
```

`hidden=true` で `mount.stop()`、`false` に戻ったら effect 再走で `mountMotionDotApp` を再起動 (re-mount on transition 実装済)。

### 3.3 `bindKeyboardShortcuts` / `bindFlowlineKeyboard`

両方とも `() => void` の dispose 関数を返す契約に変更 (元の grid 側は元から返していた、flow 側は新規追加)。`mount.stop()` 時に呼んでイベントリスナー解除。

---

## 4. 検証結果

```
$ apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-grid/tsconfig.json
0 errors
$ apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-flow/tsconfig.json
0 errors
$ apps/web/node_modules/.bin/tsc --noEmit -p apps/web
1 error: apps/web/src/features/interactive/film-lab/params-codec.test.ts:87 (既知 Filmtone baseline、無関係)
$ rg -n 'TODO\(Wave|future chat|Restoring after|placeholder|Wave 3' apps/web/src/app/\[locale\]/\(portfolio\)/experiments
0 hits (premiumMediaPlaceholder は Filmtone owner で対象外)
$ rg -n 'requireMotionAppElements|showFallback|import\.meta\.env\.DEV|document\.body\.appendChild' packages/motion-grid/src packages/motion-flow/src
0 hits in code (コメント以外)
```

**合計差分**: 11 ファイル変更、+1013 / -216 行、新規 5 ファイル。

---

## 5. 残課題 (次 chat 向け)

### 5.1 外殻 QA (ユーザー指示で defer 中)

- ブラウザ動作確認 (Chrome MCP):
  - `/experiments/grid` で AudioController toggle 動作、word input、pattern 連続性が動くか
  - `/experiments/flow` で TAP TO START → audio.mp3 再生、scene 1-7 ピン、auto cycle 動作
  - hidden→shown 復帰時の dot canvas 再起動 (再ナビゲートで verify)
- スクリーンショット: `docs/renewal-2026/screenshots/2026-04-26-grid-{ja,en}.png` 等
- 既存ルート (home, /experiments/dot, /journal/, /works/, /filmtone, /photography) のリグレッションスモークテスト
  - 特に MotionStageProvider 改修により dot 専用ルートで dot が正しく再起動するか

### 5.2 commit

- ユーザーの commit 認可が出たら `feat/renewal-2026-phase2-motion-dot` 上で:
  ```
  feat(experiments): full-inheritance port of motion-grid/motion-flow standalone apps
  - port input/keyboard, ui/hud verbatim from output/motion-{grid,flow}-webgpu/src
  - rewrite mount.ts to host-driven API with hostOverlay, full state machine
  - add MotionStageVisibility context to suspend dot canvas on grid/flow routes
  - promote /experiments grid+flow state from "preview" to "active"
  ```
- ただし他 chat の作業 (Stream 1 motion-dot 系、Stream 4-D gallery 等) が同 branch に混在しているので、ユーザーは差分 commit (`git add -p` または specific paths) を選ぶ可能性あり

### 5.3 Phase B+ ポリッシュ

- AudioController の `destroy()` API 不在 (型に存在しない) — `stop()` で `toggle off` しているが将来 destroy が増えたら呼ぶ
- `WorkState` 型の `"preview"` variant を削除するか curatorial 判断
- HUD は英語のみ (元の標準装備) — i18n 化の判断は別 chat
- `sceneController.participant.reset()` 呼び出し (flow 側 R キー) のランタイム確認

### 5.4 Filmtone baseline error

`apps/web/src/features/interactive/film-lab/params-codec.test.ts:87` は本ポートと無関係。Filmtone owner chat で別途解決。

---

## 6. 次 chat 引き継ぎ verbatim プロンプト

新 chat 冒頭に**そのままコピペ**:

````
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/2026-04-26-experiments-grid-flow-full-inheritance-handoff.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/package-4-motion-works-grid-flow-handoff-2026-04-26.md
/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md

上の 3 ドキュメントを必ず先に読んでください。1 番目が今回最重要 — 2026-04-26 に Agent Teams 3 並列で landed した「experiments grid/flow 完全踏襲ポート」のハンドオフです。要点:

- /experiments/grid と /experiments/flow の mount.ts を元 standalone (output/motion-{grid,flow}-webgpu) と 1:1 まで拡張済
- AudioController + HUD + keyboard + ControlCluster + word morph (grid) / tap-to-start + scene picker HUD (flow) を完全装備
- MotionStageVisibility context 新設で dot canvas 競合解消
- tsc 0 errors (apps/web は Filmtone baseline 1 件のみ既知)
- 全て working tree、未コミット

== 実装リポと作業ブランチ ==
- 実装リポ: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
- 作業ブランチ: feat/renewal-2026-phase2-motion-dot
- 同 branch に他 chat の uncommitted (Stream 1 motion-dot 系、liquid-glass 系等) が混在 — `git status` で本ポート分を分類してから commit

== 今回の依頼 ==
[ここに次のタスクを書く。例:]
- 「Chrome MCP で /experiments/grid と /experiments/flow を visual smoke-test してスクリーンショット保存して」
- 「本ポート分だけ commit して」(その場合は handoff §5.2 のメッセージテンプレを使う)
- 「dot ルート (/experiments/dot) のリグレッションを確認して」
- 「Phase B+: HUD i18n 化を実装して」
- 「次の package (Core Content / Satellite / QA) に着手」

== 不変ルール ==
1. silent fallback 禁止 (feedback_no_fallback_bug_hotbed.md)
2. 自動 commit/push 禁止
3. Filmtone baseline error (params-codec.test.ts:87) は触らない
4. 思考は sequential-thinking、調査は gemini-search または web search
5. 並列タスクは 1 message 複数 tool 呼び出しで parallel 実行
6. 内部処理英語、最終出力日本語

「Agent Teamsで」(4-5 並列に分解できる粒度の時のみ)
````

---

## 7. ファイル参照ショートカット

- 本 handoff: `docs/renewal-2026/2026-04-26-experiments-grid-flow-full-inheritance-handoff.md`
- 前 chat handoff: `docs/renewal-2026/package-4-motion-works-grid-flow-handoff-2026-04-26.md`
- 親 SSoT: `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`
- 元 grid main: `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-grid-guided-webgpu/src/main.ts`
- 元 flow main: `/Volumes/SamsungPortableSSDX5001/documents/life/output/motion-flowline-webgpu/src/main.ts`
- grid mount (新): `packages/motion-grid/src/mount.ts`
- flow mount (新): `packages/motion-flow/src/mount.ts`
- visibility hook: `apps/web/src/features/motion/MotionStageVisibility.tsx`
- grid route: `apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx`
- flow route: `apps/web/src/app/[locale]/(portfolio)/experiments/flow/client.tsx`

---

## 8. 一行サマリ

**`/experiments/grid` と `/experiments/flow` の standalone Vite app からの完全踏襲ポートが Agent Teams 3 並列で landed。AudioController + HUD + keyboard + ControlCluster + InputOverlay (grid) / Tap-to-Start + scene picker (flow) + dot canvas suspension が全て working tree に揃い、tsc 0 errors。次は外殻 QA (Chrome MCP visual smoke-test) または commit。**
