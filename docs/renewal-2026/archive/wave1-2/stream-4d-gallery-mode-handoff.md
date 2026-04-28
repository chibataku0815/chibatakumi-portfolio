# Stream 4-D — Gallery mode (multi-scene composite) integration handoff

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 完了 Stream | Stream 4-D part 1: KineticHandoff scene cycle on `/experiments/dot` (commit `e1e52b7a`) |
| 残 Stream | Stream 4-D part 2: **Gallery mode** (multi-scene panel composite) on `/experiments/dot` |
| 親計画 | `life/.claude/plans/portfolio-renewal-2026-04.md` §7 Stream 4 |
| 前 handoff | `docs/renewal-2026/stream-4b-grid-flow-completion-handoff.md` (Stream 2/4-A/4-B/4-C 全体 landed + 4-D pre-flight fix) |
| 起点 branch | `feat/renewal-2026-phase2-motion-dot` (tip `e1e52b7a`) |
| 状態 | KineticHandoff (single-scene transition cycle) は配備済 / Gallery mode (multi-panel) **未配備** |

---

## 0. 本書の使い方

新 chat 開始時に最初に読み込ませる。§2 で「なぜ Phase A で gallery mode を見送ったか」を確認 → §3 の vendored asset を §4 の手順で participant + client に組み込む。

---

## 1. user feedback サマリ (本書の起点)

### 1.1 元の指示 (chat A)

`/experiments/{dot,grid,flow}` を visual 検証して。

### 1.2 user feedback (chat A 中盤)

- **`/dot`**: 「モーションが意味わかんない」 — 単一シーン (`river`) 表示で、しかも音なし → 何が起きているか分からない
- **`/grid`**: 「適切な文字を入れてください」 — default token "GRID" は portfolio の文脈に合わない
- **`/flow`**: 「確認済み」 — 7 scene auto-cycle で OK

→ chat A で対応した内容:
- **`/dot`**: motion-dot に `enableSceneCycle` option 追加、`createKineticHandoff` を participant に組み込み、16 vendor scene を ~8.5s ごとに attractor burst → handoff で巡回
- **`/grid`**: `initialHeroToken: "CHIBATAKUMI"` に変更

### 1.3 user feedback (chat A 後半 — 本書の起点)

> 元々のプロジェクトではマルチシーンもあるはずなのですが、なぜ組み込んでないのでしょうか？  
> 組み込みは新規タスクとして引き継いでください

→ **本書がその「新規タスク」**。

---

## 2. なぜ Phase A で見送ったか (chat A の判断記録)

`docs/renewal-2026/stream-4b-grid-flow-completion-handoff.md` §3.2 が以下を **Phase A+1 (別 chat、優先度低)** に明示分類していた:

> motion-dot: KineticHandoff orchestration / **Gallery mode** / Fluid scene legacy metaball pass / HUD / Keyboard

chat A では user の「動きが意味わかんない」feedback を受けて KineticHandoff を組み込むのが優先と判断した。Gallery mode は別軸 (同時複数シーン表示) で、KineticHandoff (時系列での切替) と直交する独立機能のため同 chat に詰め込まなかった。

しかし「マルチシーンの方が映える」のは事実で、portfolio の demo route としては gallery mode 込みでこそ 完成形になる (元の `motion-dot-new-webgpu/src/main.ts` がそう実装している)。本書が次 chat 着手用。

---

## 3. Vendored asset (すでに repo に存在、未配線)

### 3.1 `packages/motion-dot/src/scene/composite-25d.ts` (~390 LOC)

`createGalleryMode(device, w, h)` — 多パネル合成器。

- 4 layout presets: `2` (2x1), `4` (2x2), `8` (4x2), `12` (4x3)
- 各 panel は `rgba16float` offscreen で個別 render
- Compositor が gap 4px / gap color #d2d2d2 で grid 配置
- `gallery.render(encoder, outputView, sceneCount, renderPanel, time)` で一括 render
- `nextLayout()` / `prevLayout()` / `getPanelCount()` / `getBaseSceneIndex()` / `setBaseSceneIndex(idx)` / `shiftBase(delta)` 等の操作 API
- `createCompositor` を `gpu-2.5d-presets` から、`Quad` 型もそこから

### 3.2 `packages/motion-dot/src/index.ts` の re-export

```ts
export { createGalleryMode } from "./scene/composite-25d";
export type { GalleryMode, PanelRenderer } from "./scene/composite-25d";
```

→ public API は確定済。あとは **participant 内部での配線** だけ。

### 3.3 元の `life/output/motion-dot-new-webgpu/src/main.ts` の参照箇所

| 行 | 概要 |
|---|---|
| `87` | `INTENSITY_TUNING` (gate / range / contrast / galleryMix damping 8 軸) |
| `113` | `GALLERY_SCENE_DAMPING` — 17 scene 別の damping 上書き表 |
| `134` | `shapeIntensity` (motion-dot/index.ts に既存と同じ) |
| `138` | `createPresentationModulation(panelCount, shapedIntensity)` — single / gallery 共通の per-frame modulation factory |
| `197` | `applyGallerySceneDamping(sceneIndex, galleryModulation)` — 個別 panel の damping |
| `530-533` | per-frame: `singleModulation` / `galleryModulation` / `activeModulation` 計算 |
| `567-583` | Gallery 有効時、全可視 panel に `setAudioReactive` を damping 込みで push |
| `589-630` | Gallery render path: `gallery.render(encoder, compOv, entries.length, renderPanel, time)` で全 panel offscreen 合成 → `postPass.render(...)` で film-post 合成 |
| `630` | `sdf.resize(sz.width, sz.height)` — gallery render 後に SDF を full-resolution に戻す (panel render 時に panel size に縮めているため) |

---

## 4. 着手手順 (推奨順)

### 4.1 motion-dot/index.ts: gallery mode option 追加

`CreateDotParticipantOptions` に追加:

```ts
/**
 * When set, render multiple cycle scenes simultaneously in a panel grid
 * via createGalleryMode. The number is the panel count: 2 / 4 / 8 / 12
 * (matches LAYOUTS in scene/composite-25d.ts). Requires enableSceneCycle = true.
 * Default: undefined (single-scene render).
 */
readonly galleryPanelCount?: 2 | 4 | 8 | 12;
```

→ 後に keyboard cluster で動的に layout 切替できるようにするため固定値ではなく `readonly initialGalleryLayout?: 2 | 4 | 8 | 12` のほうが将来拡張しやすい。命名は judgment call。

### 4.2 motion-dot/index.ts: `INTENSITY_TUNING` + `GALLERY_SCENE_DAMPING` を vendored 元から移植

元 `motion-dot-new-webgpu/src/main.ts` の line 87-200 ぐらいを `participant` ファイル冒頭に const として移植。`GALLERY_SCENE_DAMPING` は scene index → damping の Record だが、cycle scenes が変わると index が変わるので、scene **名** ベースに書き換えるのが無難:

```ts
const GALLERY_SCENE_DAMPING_BY_NAME: Readonly<Record<string, { ... }>> = {
  "orbit":  { thresholdDamp: 1, softnessDamp: 1, ... },
  ...
};
```

### 4.3 motion-dot/index.ts: init() で galleryMode を build

```ts
let galleryMode: GalleryMode | null = null;

// in init() after kineticHandoff is set up:
if (galleryPanelCount !== undefined) {
  galleryMode = createGalleryMode(d, /* width */ ?, /* height */ ?);
  // resetLayout to the requested panel count
  while (galleryMode.getPanelCount() !== galleryPanelCount) {
    if (!galleryMode.nextLayout()) break;
  }
}
```

⚠️ **注意点**: galleryMode は init 時の (width, height) を取るが、stage 側は ctx.width/height を render 時に渡す。**初期サイズは仮値で渡し**、render() の最初で `galleryMode.resize(ctx.width, ctx.height)` で正サイズに合わせる。

### 4.4 motion-dot/index.ts: render() で gallery path を分岐

```ts
if (galleryMode) {
  galleryMode.resize(ctx.width, ctx.height);
  
  // Composite offscreen target (separate from panel offscreens)
  const compositeView = ensureOffscreenView(ctx.width, ctx.height);
  
  const renderPanel: PanelRenderer = (enc, view, sceneIdx, pw, ph) => {
    const sceneSrc = cycleSources[sceneIdx];
    if (!sceneSrc || !sdf) return;
    const sceneName = cycleSceneNames[sceneIdx] ?? "";
    const damped = applyGallerySceneDamping(sceneName, galleryModulation);
    sdf.resize(pw, ph);
    sdf.updateConfig({ threshold: damped.threshold, softness: damped.softness, rimIntensity: damped.rimIntensity });
    sdf.render(enc, view, ctx.time, sceneSrc);
  };
  
  galleryMode.render(ctx.encoder, compositeView, cycleSources.length, renderPanel, ctx.time);
  
  // Restore SDF to stage size for any subsequent passes (none in this branch but safer)
  sdf.resize(ctx.width, ctx.height);
  
  // Film post composes the composite onto stage's outputView
  filmPost.render(ctx.encoder, compositeView, ctx.outputView, ctx.time, ctx.width, ctx.height);
} else {
  // existing single-scene path
}
```

### 4.5 motion-dot/index.ts: update() で 全 visible panel に setAudioReactive

```ts
if (galleryMode) {
  const base = galleryMode.getBaseSceneIndex();
  const panelCount = galleryMode.getPanelCount();
  for (let i = 0; i < panelCount; i++) {
    const si = (base + i) % cycleSources.length;
    const src = cycleSources[si];
    if (src && src.setAudioReactive) {
      const damped = applyGallerySceneDamping(cycleSceneNames[si], galleryReactive);
      src.setAudioReactive(damped);
    }
  }
} else {
  // existing single-source setAudioReactive
}
```

### 4.6 motion-dot/index.ts: dispose() で galleryMode.destroy() 追加

```ts
try { galleryMode?.destroy(); } catch { /* ignore */ }
galleryMode = null;
```

### 4.7 apps/web/src/app/[locale]/experiments/dot/client.tsx: opt-in

```ts
createDotParticipant({
  enableSceneCycle: true,
  galleryPanelCount: 4,  // 2 / 4 / 8 / 12 から選択。4 が見栄えと動きのバランス良。
  enableHud: true,
  enableInput: true,
}),
```

→ もしくは別 route `/experiments/dot/gallery` を新設して single と並べて見せる手も。判断は user。

### 4.8 KineticHandoff と gallery mode の関係を明示する

⚠️ **重要 design decision** — 元 main.ts では:
- gallery 有効時、各 panel は **単独で auto-update** (kineticHandoff は走らせない)
- gallery 中の panel scene は固定 (kineticHandoff で巡回しない)
- kineticHandoff は single mode (panelCount = 1) のときのみ走る

これを participant に持ち込むなら、`galleryPanelCount` 設定時は kineticHandoff.start() を **呼ばない** (or stop) ようにする。逆に kineticHandoff を gallery 中も走らせて全 panel を一斉に切り替える派生設計もありうる (元 main.ts には無い挙動)。**user 判断必要**。

推奨デフォルト: 元 main.ts に揃える (gallery 中は kineticHandoff idle)。

### 4.9 typecheck + build verify

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
bunx tsc -p packages/motion-dot/tsconfig.json --noEmit
bun run build:web   # Vercel parity, ~1-2 分
```

`.next` キャッシュが stale errors を出すなら `rm -rf apps/web/.next`。

### 4.10 ローカル動作確認

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
bun run dev
# → http://localhost:3000/ja/experiments/dot で 4 panel grid に scene が並んで表示
```

---

## 5. Acceptance criteria

- [ ] `/experiments/dot` で gallery mode (デフォルト 4 panel) が default 起動
- [ ] 各 panel が独立した scene を render (orbit / river / magnet / mitosis 等が同時に見える)
- [ ] film-post (bloom / grain / chroma / vignette) が composite 後に適用されて全体に統一感
- [ ] WebGPU 非対応 browser で MotionUnsupportedBanner 表示 (これは既存)
- [ ] 単一 panel 路 (`galleryPanelCount` 未指定) は backwards compatible で動く (既 `enableSceneCycle` だけの起動も維持)
- [ ] `bun run --cwd apps/web build` が exit 0 で 68 routes prerender 通過
- [ ] dispose 時に panel offscreen + galleryMode が leak なく解放

---

## 6. scope 外 (本 chat でも触らない)

- HUD overlay (panel layout 名 / scene index の表示) — Phase A+1 の別軸
- keyboard cluster (`G` で gallery toggle / `[` `]` で layout 切替) — Phase A+1
- audio file picker / AudioController — Phase A+1
- Fluid scene の panel 表示 (legacy metaball pass 必要) — fluid 自体が Phase A+1
- motion-grid の input mode (hero token typing) — 関係ない

---

## 7. 次 chat 起動 prompt (コピペ用)

```
Renewal 2026 Stream 4-D part 2 (gallery mode 配線) を起動してください。

起点 doc:
- chibatakumi-portfolio/docs/renewal-2026/stream-4d-gallery-mode-handoff.md (本書、最優先)
- 前 handoff: chibatakumi-portfolio/docs/renewal-2026/stream-4b-grid-flow-completion-handoff.md (Stream 2/4 全体 landed)
親計画: life/.claude/plans/portfolio-renewal-2026-04.md §7 Stream 4

前提:
- branch `feat/renewal-2026-phase2-motion-dot` (chat A 終了時 tip = e1e52b7a)
- KineticHandoff scene cycle は /experiments/dot で動作確認済 (user 確認済の場合)
- vendor/webgpu-motion-libs submodule は b96998b ahead

着手:
1. 本書 §3 の vendored asset (createGalleryMode + INTENSITY_TUNING + GALLERY_SCENE_DAMPING) を motion-dot/index.ts の participant に配線
2. galleryPanelCount option 追加、render() の gallery 分岐実装
3. /experiments/dot client.tsx で galleryPanelCount: 4 を opt-in
4. typecheck + bun run build:web で verify、user に local 動作確認依頼

注意:
- 本書 §4.8 の design decision (gallery 中は kineticHandoff idle) を user に確認すること
- 元 main.ts (life/output/motion-dot-new-webgpu/src/main.ts) を実装のリファレンスに、ただし整数 idx ベースの GALLERY_SCENE_DAMPING を scene 名 keyed Record に書き換える (cycle scenes 設定変更で index が変わるため)
- feedback_no_fallback_bug_hotbed.md: silent fallback 禁止、init 前に gallery 必要 GPU 資源が無ければ throw
```

---

## 8. 参照 / 関連 memory

- `feedback_minimize_decision_cost.md` — 4.8 の design decision は user に推奨案 (元 main.ts に揃える) を一緒に提示する
- `feedback_no_fallback_bug_hotbed.md` — gallery render path で silent fallback 禁止
- `feedback_review_release_blockers_deep_pass.md` — Agent Teams は使わず単独 chat で深く実装、merge 後 build / typecheck deep pass
- 前 handoff: `stream-4b-grid-flow-completion-handoff.md` §5.1 の commit 戦略 (submodule 別 push / 親 single commit) は本 chat でも踏襲

memory 更新候補 (chat 終了時):
- `portfolio_renewal_2026_04_stream4_full_landed.md` を Phase A 完了 + KineticHandoff cycle landed + gallery mode landed に更新
- gallery mode landed 後、本 doc は `docs/guides/archive/` へ移動候補
