# Liquid Glass Nav — チャット全体作業計画 + 境界問題対応

Created: 2026-04-27 JST
Branch: `feat/renewal-2026-phase2-motion-dot`
Latest commit: `57b8b99f feat(renewal): Apple Liquid Glass nav — WebGPU front-layer chrome`

## 1. このチャットの作業全体経緯と確定事項

### 1.1 出発点（前チャットからのドリフト）

前チャットで Apple Liquid Glass の文脈を失い「ジェネリック黒ピル WebGPU」スパイクに着地。`docs/renewal-2026/2026-04-27-liquid-glass-nav-front-layer-handoff.md` で「この実装は最終版にしない、Liquid Glass を取り戻す」と明示。

### 1.2 当チャットでの確定事項

| 項目 | 確定値 / 方針 |
|---|---|
| 参考実装 | `/Volumes/SamsungPortableSSDX5001/documents/life/output/webgpu-liquid-glass-demo/` （demo の `composite.wgsl` を vendoring） |
| マテリアル戦略 | motion-dot の offscreen RT (textureB) を共有デバイスで「サンプリング」してリアル屈折を出す。HTML キャプチャは禁止 anti-target 維持。 |
| 配色 | dark editorial を基調、チップは control 寄り、パネルは "lit" 寄り（kindId=1 で識別、shader で出力分岐） |
| レイアウト | 分離チップ + Sheet パターン（参考: iOS 26 top-toolbar accessory + sheet）<br>Brand chip 48×48 / Menu chip 48×48 (icon-only) / Sheet 12px inset all sides + 20px radius |
| z 階層 | `--z-motion-hud:20` `--z-motion-hud-panel:30` `--z-nav-visual:1000` `--z-nav-hit:1010` `--z-nav-panel:1100` （※ §3 で改訂予定） |
| Scrim | CSS `backdrop-filter: blur` で本物のブラー（HTML/motion-dot を直接ボカす）。WebGPU 側 procedural Gaussian は「洗練されない」として却下済み。 |
| ジェスチャー | Esc / 外クリック / route 変更で close、`document.body.overflow:"hidden"` で背面スクロール抑止 |

### 1.3 確定した anti-target

- DOM キャプチャ系 (`html2canvas`, `getDisplayMedia`, `captureStream`, `drawImage`) — 引き続き禁止
- WebGL fallback — 引き続き禁止
- ※ CSS `backdrop-filter` は「scrim のみ」で許容（パネル本体・チップ本体には未使用）

### 1.4 アーキテクチャ（コミット時点）

```
z=-10  motion-dot canvas (substrate textureB を生成)
z=0    page HTML
z=1000 LiquidGlassFrontChrome canvas (前面 Liquid Glass material)
       ├ kind=nav  → Brand/Menu chip 描画（fsCompositeAlpha）
       └ kind=panel → Sheet 描画（fsCompositeAlpha）
z=1010 Nav 透明 hit layer (Link / button)
z=1100 Open menu container
       ├ scrim button (CSS bg-black/30 backdrop-blur-lg) ← 境界問題の元凶
       └ LiquidGlassSurface 透明 wrapper (panel 中身: BrandWordmark / Links / LanguageSwitcher)
```

## 2. 残タスク

### Phase A — 境界問題対応（本ドキュメント §3）

スクリーンショット 2026-04-27 01:21 で確認: scrim 右端と panel 左端の間に「ぼかし無し」の縦帯と硬い境界線が出現。

### Phase B — motion-dot HUD コントロール群の Liquid Glass 化

`packages/motion-dot/src/ui/hud.ts` の全ピル（SCENE / SINGLE / OPTIONS / RESET / FILM / TRANSIT / AUDIO / GALLERY / PANEL / FILE / Film toggle / Audio panel button / 数字 Counter）が `rgba(20,20,22,0.92)` で固いダークピル。

方針:
- motion-dot 側 hud.ts のピル `background` を透明化、`color` だけ残す
- 各ピルに `data-liquid-glass-surface="control.<id>"` を生やす（または class）
- portfolio 側で MutationObserver / 起動時 querySelectorAll でスキャンして `kind="control"` で LiquidGlassProvider に登録
- 前面 canvas の `FRONT_KINDS` に既に `"control"`(=3) を含めているので shader 側は変更不要
- HUD テキスト色は dark editorial の motion-dot 上で読める明度に再調整

### Phase C — 仕上げ

1. iyinchao 由来の per-channel IOR (R=0.98 / G=1.00 / B=1.02) の取り込み検討（現状は normal × edge × dispersionPx でチャネル shift だが、iyinchao は IOR 物理ベース）
2. /experiments/grid 等 motion-dot を hide するルートでの fallback（現状は front canvas が描画されない → チップ visual 消える）
3. accent route hookup の動作確認（/journal=#f5c36d, /experiments=#f0b25a など）
4. Reduced motion preference の最終調整

## 3. 境界問題の修正計画

### 3.1 現象

- Scrim button (`absolute bottom-0 left-0 top-0 right=calc(min(420px, ...) + 0.75rem)`) が panel 領域を「除外」配置
- 結果として `viewport_right − (panel_width + panel_inset_right)` の位置に scrim 右端が出現
- そこから panel SDF 左端まで約 12px：scrim もパネル material も無く、生 motion-dot が露出
- かつ scrim 右端が直線的にカットオフ → Apple Liquid Glass の連続感とは真逆の「貼り付けた感」

### 3.2 原因（z-order）

```
z=1100 scrim (CSS backdrop-blur-lg) ← この上にある全て…
z=1000 front canvas (panel SDF Liquid Glass)  ← …backdrop-filter で blur 対象になる
```

そのため scrim を panel 領域まで広げると WebGPU パネルマテリアルもブラーで潰れる。それを避けるため scrim を panel 直前で打ち切ったのが境界線の正体。

### 3.3 修正案（採用）— Front canvas を scrim より上に配置

```
z=-10   motion-dot
z=0     page HTML
z=1010  Nav hit layer (Link / button)
z=1090  scrim button — FULL viewport を覆う、CSS backdrop-blur-lg + bg-black/30
z=1200  ★front canvas (--z-nav-front-glass) — 新設
        ├ kind=nav  chip Liquid Glass
        └ kind=panel sheet Liquid Glass（SDF 内 alpha=1 で scrim を視覚的に置き換え）
z=1300  ★panel content DOM (--z-nav-panel-content) — 新設
        BrandWordmark / Links / LanguageSwitcher / X close
```

#### なぜ解決するか

- Scrim が viewport 全域を覆い、CSS backdrop-filter で HTML+motion-dot を均一にブラー
- Front canvas は scrim の **上** にいるので scrim の backdrop-filter は front canvas を blur しない
- パネル SDF 内側で alpha=mask=1 → 完全 opaque で scrim を視覚的に上書き、refraction された motion-dot が見える
- パネル SDF feather (≈1〜2px) で 「ブラー scrim」 → 「Liquid Glass material」 が滑らかに繋がる ＝ 硬い境界線が消える
- パネル内の DOM (text/links) は z=1300 で front canvas の上 → くっきり読める

#### 副次効果

- 閉時のチップ (kind=nav) も z=1200 で同じパターン。挙動変化なし。
- 旧 `--z-nav-visual` は廃止。`--z-nav-front-glass: 1200` に置換。
- 旧 `--z-nav-panel: 1100` は scrim 専用に格下げ → `--z-nav-panel-scrim: 1090`、panel 中身は `--z-nav-panel-content: 1300` に分離。

### 3.4 実装手順（最小差分）

1. **`apps/web/src/app/[locale]/(portfolio)/layout.tsx`**
   ```css
   --z-nav-hit: 1010;
   --z-nav-panel-scrim: 1090;     /* NEW */
   --z-nav-front-glass: 1200;     /* NEW (旧 --z-nav-visual) */
   --z-nav-panel-content: 1300;   /* NEW (旧 --z-nav-panel) */
   ```
   旧 `--z-nav-visual: 1000` と `--z-nav-panel: 1100` は互換のため残しつつ deprecated コメント。

2. **`LiquidGlassFrontChrome.tsx`**
   - canvas の `style.zIndex` を `var(--z-nav-front-glass, 1200)` に変更

3. **`Nav.tsx`**
   - 開メニューの container `<div className="fixed inset-0">` に z 指定不要（中の各要素で個別に指定）
   - scrim `<button>`: `style={{ zIndex: "var(--z-nav-panel-scrim, 1090)" }}` で **`right` 指定削除（フル viewport）**
   - LiquidGlassSurface (パネル DOM 中身ラッパー): `style={{ zIndex: "var(--z-nav-panel-content, 1300)" }}`、その他属性 (`role="dialog"` など) は維持

4. **検証**
   - `bun lint`
   - `tsc --noEmit -p apps/web`（baseline `params-codec.test.ts:87` のみ許容）
   - 禁止トークン grep
   - ブラウザ確認は **ユーザー側で**（私からは Playwright を走らせない）

### 3.5 リスクと観察ポイント

| リスク | 対処 |
|---|---|
| `getCurrentTexture()` を z 上位の canvas で呼ぶ際の同期問題 | 既に共有デバイスで動作実績あり。z 値は描画パスに影響しない（CSS だけの問題） |
| iOS Safari 等で backdrop-filter が効かない端末 | `bg-black/30` だけでも一定の dim は確保。Apple 系は backdrop-filter サポート済 |
| scrim フル viewport により chip がブラー対象に「見える」恐れ | チップは z=1200 (front canvas) で上にあるためブラー対象外 |
| open menu 時の scrim クリック範囲 | 全 viewport を覆うので panel 範囲外クリックは全て close 対象。panel 中身は z=1300 で上にあり click は伝播しない |

### 3.6 受け入れ条件

- [ ] scrim 右端と panel SDF 左端の間に硬い縦帯が見えない
- [ ] panel 内側はブラーされず鮮明な Liquid Glass material（リム / fresnel / specular がくっきり）
- [ ] panel 外側（scrim 領域）は CSS backdrop-blur で motion-dot が綺麗に blur されている
- [ ] panel 内 DOM (text/links) は鮮明に読める
- [ ] console エラー / WebGPU 検証警告 0
- [ ] /journal / /experiments / / の全 portfolio route で動作

## 4. 直近 Issue 候補（Phase A 完了後に着手）

- 4.1 motion-dot HUD ピル群の Liquid Glass 化（§2 Phase B）
- 4.2 Sheet open/close の motion 演出（spring 系 transform、現状は CSS 切替のみ）
- 4.3 reduced-motion 設定での scrim blur 軽減
- 4.4 narrow viewport (≤720px) で chip / panel サイズの調整
- 4.5 /experiments/grid など motion-dot hide route での front canvas fallback

## 5. ロールバック / 緊急復旧

直近 working state へ戻すには:

```bash
git reset --hard 57b8b99f
```

または特定ファイルのみ:

```bash
git checkout 57b8b99f -- apps/web/src/features/liquid-glass/ apps/web/src/shared/components/Nav.tsx
```
