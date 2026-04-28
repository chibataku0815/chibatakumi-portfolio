# motion-grid / motion-flow Controller → Apple Liquid Glass 統合 — Handoff (2026-04-28 JST)

> 次 chat で **/experiments/grid と /experiments/flow の controller / HUD 群を Apple Liquid Glass material に統合する**ためのハンドオフ。本ドキュメント単体で別 chat に投入すれば、過去の経緯を遡らずに着手できる。

---

## 0. 30 秒で読む

- **タスク**: motion-grid と motion-flow の HUD / controller 群が Liquid Glass 未対応。motion-dot と同じ glass material 経路に乗せる。
- **既に実装済の参照**: `packages/motion-dot/src/ui/hud.ts` の `markLiquidGlassControl()` パターン (commit `eb4df565` Phase B Liquid Glass HUD redesign)
- **改修対象**:
  - `packages/motion-grid/src/ui/hud.ts` (371 LOC、`createHud` / `createInputOverlay` / `createControlCluster`)
  - `packages/motion-flow/src/ui/hud.ts` (110 LOC、`createFlowlineHud` が `createHudOverlay` / `createSceneSelector` / `createAudioMeter` / `createKeymapHud` を `webgpu-motion-ui` から組み立て)
- **現状 screenshot**:
  - `docs/renewal-2026/assets/2026-04-28-motion-grid-current.png`
  - `docs/renewal-2026/assets/2026-04-28-motion-flow-current.png`
- **branch**: `feat/renewal-2026-phase2-motion-dot` (45 commit ahead, 4 commit が本 chat 由来)

---

## 1. 前提: Apple Liquid Glass の動作原理（既存実装）

### 1.1 アーキテクチャ 3 層

| 層 | 実体 | 役割 |
|---|---|---|
| **Substrate** | `packages/motion-dot` の WebGPU canvas (light `#D2D2D2`) | サイト背景 |
| **Front canvas** | `apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx` | substrate texture をサンプリング、glass material を屈折描画 |
| **Surface registration** | `apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx` | DOM 要素を glass surface として登録 |

### 1.2 登録経路 2 つ

| 経路 | DOM marker | 用途 |
|---|---|---|
| **React** | `<LiquidGlassSurface data-liquid-glass-surface="...">` | React 木で書ける chrome (Nav 等) |
| **Imperative DOM** | `el.dataset.liquidGlassControl = "..."` | パッケージから注入される HUD (motion-dot / motion-grid / motion-flow) |

motion-grid / motion-flow は **imperative 経路**を使う必要がある (パッケージ内で document.createElement する DOM のため)。

### 1.3 MutationObserver

`LiquidGlassProvider.tsx:312-356` で `data-liquid-glass-control` が付いた DOM を全文書スキャン + 追加・削除・属性変更を監視。要素 attach 時に `registerSurface(el, { id, radius?, intensity?, brightness?, tint?, kind: "control" })` 呼び出し → front canvas で glass material 描画開始。

### 1.4 サポート data 属性

```ts
el.dataset.liquidGlassControl = "control.<group>.<id>"  // 必須 unique ID
el.dataset.liquidGlassRadius   = "14"                    // 角丸 px
el.dataset.liquidGlassIntensity = "0.55"                 // 屈折強度 0〜1
el.dataset.liquidGlassBrightness = "0.78"                // 透過明度 0〜1
el.dataset.liquidGlassTint     = "rgba(...)"             // optional 色味
```

---

## 2. 参照実装: motion-dot HUD（canonical）

### 2.1 ヘルパ (`packages/motion-dot/src/ui/hud.ts:94-104`)

```ts
function markLiquidGlassControl(
  el: HTMLElement,
  id: string,
  opts?: ControlSurfaceOptions,
): void {
  el.dataset.liquidGlassControl = id;
  if (opts?.radius !== undefined) el.dataset.liquidGlassRadius = String(opts.radius);
  if (opts?.intensity !== undefined) el.dataset.liquidGlassIntensity = String(opts.intensity);
  if (opts?.brightness !== undefined) el.dataset.liquidGlassBrightness = String(opts.brightness);
  if (opts?.tint) el.dataset.liquidGlassTint = opts.tint;
}
```

### 2.2 motion-dot の 4 surface

| surface ID | 位置 | 内容 | radius / intensity / brightness |
|---|---|---|---|
| `control.status` | bottom-right | "01/16 · Orbit · Raw" pill | 14 / 0.55 / 0.78 |
| `control.dock`   | bottom-right (status の上) | Film / Audio / More buttons | (motion-dot/src/ui/hud.ts:209〜) |
| `control.hotkeys` | bottom-right popover | 10-key 2-col grid | |
| `control.audio`  | bottom-right popover | source/device | |

### 2.3 適用例 (`packages/motion-dot/src/ui/hud.ts:137-170`)

```ts
export function createStatusPill(parent?: ParentNode): HTMLDivElement {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: `var(--motion-hud-bottom, 22px)`,
    right: "22px",
    padding: "8px 14px",
    borderRadius: "14px",
    background: "transparent",                    // ← 背景は完全透明、glass が裏で描く
    color: "rgba(255,255,255,0.92)",
    font: `500 12px/1 ${FONT_STACK}`,
    // ...
  });
  markLiquidGlassControl(root, "control.status", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });
  return appendTo(parent, root);
}
```

**重要原則**:
- `background: "transparent"` 必須 — glass が背景を描くため自前 bg は不要
- `color: "rgba(255,255,255,...)"` で white-on-glass 可読性
- `borderRadius` と `dataset.liquidGlassRadius` を **同じ値**にする (CSS と shader の二重定義)

---

## 3. 改修対象: motion-grid

### 3.1 現状

`packages/motion-grid/src/ui/hud.ts` (371 LOC):

```ts
const TOKEN = {
  ink: "#1a1a1a",
  paper: "#D1D1D1",
  bg: "rgba(255,255,255,0.62)",        // ← 自前の半透明背景
  bgActive: "#1a1a1a",
  divider: "rgba(26,26,26,0.16)",
  radius: "2px",                        // ← 2px = ほぼ角なし、glass と相性悪い
  fontMono: "ui-monospace, ...",
  fontStack: "system-ui, sans-serif",
};

export function createHud(container: HTMLElement): HTMLDivElement {
  return createOverlayText({
    parent: container,
    style: {
      position: "fixed",
      top: "16px",
      left: "16px",
      fontFamily: TOKEN.fontStack,
      fontSize: "12px",
      letterSpacing: "0.02em",
      color: "#444",                    // ← dark text on light bg
      // ...
    },
  });
}
```

→ `webgpu-motion-dom` の `createOverlayText` で素の `<div>` 注入、glass marker なし。

### 3.2 出力 surface 群（screenshot から特定）

screenshot `docs/renewal-2026/assets/2026-04-28-motion-grid-current.png` で確認:

| surface | 位置 | 現状 | 改修先 ID 案 |
|---|---|---|---|
| Status HUD | top-left | "Grid Typography / Hero Word \| Film ON \| Loop ON \| I OFF \| GRID \| lead-chain \| Extend R (4/10) \| 37%" | `control.grid.status` |
| Keymap legend | bottom-right | PATTERN/RESET/CONTINUITY/LOOP/ZOOM/FILM/AUDIO/MUSIC/INPUT/HUD ladder | `control.grid.hotkeys` |
| Control cluster | bottom-right (キーマップの下、2 つの pill) | input draft/控え | `control.grid.cluster` |

### 3.3 改修手順

1. `packages/motion-dot/src/ui/hud.ts:94-104` の `markLiquidGlassControl` ヘルパを `packages/motion-grid/src/ui/hud.ts` にコピー (もしくは `webgpu-motion-dom` 等の共通 lib に切り出して両方から import)。
2. `createHud` / `createInputOverlay` / `createControlCluster` の root element に `markLiquidGlassControl(root, "control.grid.<id>", { radius, intensity, brightness })` を呼ぶ。
3. styles を以下に変更:
   - `background: "transparent"` (TOKEN.bg を捨てる)
   - `borderRadius` を 12〜14px に上げる (glass と整合)
   - `color` を `rgba(255,255,255,0.9)` 系に切替 (glass 上で白文字)
   - `font` を motion-dot と同じ `FONT_STACK` (Geist Sans 系) に統一
4. `position: "fixed"` 維持、anchor 値を motion-dot と整合 (top-left status は `control.status` と衝突しないか確認)

### 3.4 注意点

- **status HUD は top-left**。motion-dot の `control.status` は bottom-right なので id 衝突なし、ただし top-left には Nav (logomark) があるので **`top: "60px"` 程度に下げる**こと検討
- **font-mono を残すか**: 現状 `TOKEN.fontMono` 使用。motion-dot は Geist Sans。**統一すべきか motion-grid の identity として残すか**判断必要（推奨: Geist Sans 統一、editorial 一貫性のため）
- **TOKEN.bgActive `#1a1a1a`** — input mode active 時の dark accent。glass 上では visibility が落ちる可能性、active state を別表現 (border / ring) に検討

---

## 4. 改修対象: motion-flow

### 4.1 現状

`packages/motion-flow/src/ui/hud.ts` (110 LOC):

```ts
import {
  createAudioMeter,
  createHudOverlay,
  createKeymapHud,
  createSceneSelector,
  // ...
} from "webgpu-motion-ui";
```

→ **motion-flow は webgpu-motion-ui (vendor 経由) の atom を直接 compose**。motion-grid と違い自前 DOM ではなく vendored library 製。

### 4.2 出力 surface 群（screenshot から特定）

screenshot `docs/renewal-2026/assets/2026-04-28-motion-flow-current.png`:

| surface | 位置 | 現状 |
|---|---|---|
| HudOverlay | top-left | "EXPERIMENTS / FLOW" breadcrumb (mono) |
| SceneSelector | top-right | scene list dropdown |
| AudioMeter | top-right (selector の下) | 4-field meter |
| KeymapHud | bottom-right (`?` toggle) | keymap entries |

screenshot 上では bottom-right に **2 本の細長い pill bar** が見える — これが新 motion-flow HUD (commit `eab48f0c` で追加) かどうかは要検証。motion-dot の dock+status と類似の見た目だが、motion-flow 側の hud.ts には該当 createX なし。**`packages/motion-flow/src/mount.ts` を読んで HUD 注入経路全部を洗い直す**こと。

### 4.3 改修手順 (2 案)

#### 案 A: webgpu-motion-ui の atom を改修（影響範囲広）

`vendor/webgpu-motion-libs/packages/webgpu-motion-ui/` の `createHudOverlay` / `createSceneSelector` / `createAudioMeter` / `createKeymapHud` 実装に `markLiquidGlassControl` を組み込む。

- **Pro**: 全 vendored library 利用箇所で一括 glass 化
- **Con**: vendor submodule の改修が必要、上流 PR or fork 維持

#### 案 B: motion-flow 側でラッパしてマーカー追加（推奨）

`createFlowlineHud` の戻り値 `{ overlay, selector, meter, keymap }` の各 root element に対して、`createFlowlineHud` 内で `markLiquidGlassControl` を呼ぶ。

```ts
export function createFlowlineHud(options: CreateFlowlineHudOptions): FlowlineHud {
  const overlay = createHudOverlay({ parent: options.parent, position: { top: "16px", left: "16px" } });
  markLiquidGlassControl(overlay.root, "control.flow.overlay", { radius: 14, intensity: 0.55, brightness: 0.78 });
  // ... 同じく selector, meter, keymap
}
```

各 atom が **`.root` プロパティを返しているか**を vendor の type 定義で確認 (`HudOverlay` / `SceneSelector` / `AudioMeter` / `KeymapHud` 型)。なければ案 A 必須。

- **Pro**: vendor 触らない
- **Con**: vendor 側のスタイル (background / radius / color) が glass と相性悪ければ overlay スタイルを上書きする追加処理が必要

### 4.4 注意点

- **motion-flow は dark substrate を持つ** (screenshot で background は dark — site の light substrate を override している可能性)。
  - motion-flow の WebGPU canvas が独自の dark color を出力しているなら、glass material は **dark substrate をサンプリング**することになり、見え方が motion-dot と異なる
  - light substrate に揃えるか、motion-flow 側の dark を許容するかは brand 判断
- **`?` キー toggle の keymap** が現状 bottom-right。motion-dot の `H` キー hotkeys popover と同位置 — **同時表示時の重なり**を確認

---

## 5. 検証方法

### 5.1 dev server で目視

```bash
cd apps/web && bun run dev
# → http://localhost:3000/ja/experiments/grid
# → http://localhost:3000/ja/experiments/flow
```

各 HUD root element に `data-liquid-glass-control` 属性が DevTools で確認できること。Chrome の Computed パネルで `background: rgba(0, 0, 0, 0)` (透明) になっていること。glass の屈折が見えること (背景の motion canvas のドット/ラインが要素裏で歪むこと)。

### 5.2 LiquidGlassProvider 登録ログ

`apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx:293` の `registerSurface` 呼び出しに `console.log` を一時挿入し、attach 時にログ出力。motion-grid/flow の各 surface ID が登場することを確認。

### 5.3 Build / type check

```bash
cd apps/web && bun run build         # 既に green
cd apps/web && bunx tsc --noEmit     # baseline 1 件のみ (params-codec.test.ts)
cd apps/web && bun run lint          # baseline 43 problems
```

改修で baseline 超えないこと。

---

## 6. ブランチ状態（2026-04-28 12:50 時点）

```
feat/renewal-2026-phase2-motion-dot — 45 commit ahead of main

直近 4 commit (本 chat 由来):
9923c384 chore(brand): filmtone background candidates + 2048 master logo
9de65a58 feat(experiments,hero): wordmark geometry pipeline + R&D playground
85978f74 feat(theme): dark scope token re-resolution for Filmtone/Photography identity
eab48f0c feat(motion-flow,motion-grid): hostOverlay + HUD/input subsystem completion

その前段 (2026-04-27 chat 由来):
05e55b18 feat(experiments,contact): typography parity with /journal — Jost display, mono ladder, drop accents
9030a567 feat(motion-dot): stack status pill below dock at bottom-right
5cfd56f4 feat(journal): editorial typography — drop font-mono, add Jost upright display
... (Wave 6 typography 仕上げ + Phase B Liquid Glass HUD)
```

### 残 stash (注意)

- `stash@{0}` `wip-motion-flow-grid-experiments-wordmark-2026-04-28` — 上記 4 commit と内容重複の保険。**確認後 `git stash drop stash@{0}` で削除可**

### working tree

`.claude/` `output/playwright/` `docs/renewal-2026/*-handoff.md` のみ untracked (ローカル状態 / artifacts、release scope 外)

---

## 7. 関連ファイル

### 7.1 改修対象
```
packages/motion-grid/src/ui/hud.ts          ← 371 LOC、3 createX
packages/motion-grid/src/mount.ts           ← HUD 注入箇所
packages/motion-flow/src/ui/hud.ts          ← 110 LOC、1 createX
packages/motion-flow/src/mount.ts           ← HUD 注入箇所
```

### 7.2 参照実装
```
packages/motion-dot/src/ui/hud.ts                            ← canonical (markLiquidGlassControl + 4 surface)
apps/web/src/features/liquid-glass/LiquidGlassProvider.tsx   ← MutationObserver + registerSurface
apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx ← front canvas + WebGPU material
apps/web/src/features/liquid-glass/compose-factory.ts        ← surface kind routing (back rail / front nav,panel,control)
apps/web/src/features/liquid-glass/shaders/composite.ts      ← computeGlass shader
```

### 7.3 関連 commit (参照)
```
eb4df565 feat(renewal): Phase B Liquid Glass HUD redesign — 4-surface dock
57b8b99f feat(renewal): Apple Liquid Glass nav — WebGPU front-layer chrome
a7c5fe43 fix(renewal): restore liquid glass nav content layering
eab48f0c feat(motion-flow,motion-grid): hostOverlay + HUD/input subsystem completion
```

### 7.4 関連ハンドオフ (前段)
```
docs/renewal-2026/2026-04-28-release-audit-handoff.md             ← 前段 audit 計画
docs/renewal-2026/2026-04-27-liquid-glass-nav-front-layer-handoff.md
docs/renewal-2026/2026-04-27-liquid-glass-hud-redesign-handoff.md
docs/renewal-2026/2026-04-27-liquid-glass-nav-work-plan.md
docs/renewal-2026/liquid-glass-adoption-rules-2026-04-26.md
docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md
```

---

## 8. ナレッジ (必読)

```
.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md
  → motion-dot は light bg `[0.82,0.82,0.82,1.0]` hardcode、glass は light substrate 前提

.claude/knowledge/patterns/data-readability-shader-pipeline.md
  → CSS scrim 禁止、readability は shader uniform で

.ai/knowledge/cjk-typography-pitfalls.md
  → text-wrap balance 禁止、em ベース推奨
```

---

## 9. 次 chat への期待アクション

1. このドキュメントを最初に読む（30 秒サマリ → §3 + §4 改修手順）
2. screenshot 2 枚を確認 (`docs/renewal-2026/assets/2026-04-28-motion-{grid,flow}-current.png`)
3. `packages/motion-dot/src/ui/hud.ts` を一読して canonical pattern を頭に入れる
4. `packages/motion-grid/src/ui/hud.ts` 改修 (案 §3.3)
5. `packages/motion-flow/src/ui/hud.ts` 改修 (案 §4.3 案 B 推奨)
6. dev server 目視 → glass 屈折確認
7. build / tsc / lint で baseline 維持確認
8. 1〜2 commit に分けて commit (`feat(motion-grid,motion-flow): liquid glass HUD integration`)
9. 検証完了後 push & PR

---

## 10. 補足 — Agent Teams 並列化の判断

motion-grid と motion-flow は **独立した package**、改修先 file も別。並列化候補だが:

- 共通 helper (`markLiquidGlassControl`) を切り出すなら 1 chat sequential が安全
- vendored library 改修 (案 §4.3 案 A) を選ぶなら、 vendor 側変更 + 両 package 利用箇所更新で 2 stream 並列可

判断は次 chat の lead に委譲。

---

**End of handoff. 次 chat はこのドキュメント単体で完結して着手できる。**
