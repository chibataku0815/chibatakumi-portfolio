# TC Logomark Redesign — Handoff Document

> **目的**: このドキュメントは、CHIBA TAKUMI ロゴタイプ実装の経緯・成果・現状を記録し、
> 次フェーズ「ロゴマーク（TCシンボル）の数学的リデザイン」に引き継ぐための全情報を含む。

---

## 1. プロジェクト概要

### ブランド
- **名前**: CHIBA TAKUMI（千葉 工）— ソフトウェアエンジニア & フォトグラファー
- **ブランド方向性**: quiet tension, craft precision, integrated perspective
- **ビジュアルスタンス**: restrained, sharp, editorial, never decorative-first

### アイデンティティ構成
| 要素 | 状態 | 備考 |
|------|------|------|
| **ロゴタイプ** `CHIBA TAKUMI` | **完了** | opentype.js で字形改変、SVG パスベース |
| **ロゴマーク** `TC / 工` シンボル | **リデザイン対象** | 現在は手書き stroke ベース、幾何学的再設計が必要 |
| **ロックアップ** (マーク + タイプ) | 自動生成 | build-wordmark.ts で出力 |

---

## 2. 完了済み: ロゴタイプ実装

### 2.1 アプローチ
CSSスタイリングを4回試行しすべてreject → opentype.js でフォントグリフを抽出し、ベジェ制御点を数学的に改変する方法で解決。

### 2.2 技術パイプライン
```
Geist Sans Medium .otf
    ↓ opentype.loadSync → charToGlyph → getPath(0,0,1000)
extract-glyphs.ts → raw-glyphs.json
    ↓ 字形改変アルゴリズム適用
modify-glyphs.ts → modified-glyphs.json
    ↓ カーニング + 座標変換 + SVG組み立て
build-wordmark.ts → portfolio.ts / SVGファイル / preview.html
```

### 2.3 字形改変一覧
| 文字 | 改変 | 手法 |
|------|------|------|
| A | フラットトップ apex (90 UPM) | apex付近のL命令のX座標を中心から±45に調整 |
| A | クロスバー短縮 (-6 UPM/side) | crossbar のL命令X座標をシフト |
| K | ジャンクションギャップ強化 | ステム接点Y座標を上下に6UPMずらし + 中心点を8UPMステム方向へ |
| C | 30°ターミナルカット | ターミナル端のY座標をtan(30°)×depth分シフト + X座標12UPM外側へ |
| T | クロスバー延長 (+4 UPM/side) | 端点X座標を±4 + 角のターミナルカット |
| H | 光学中心クロスバー | crossbar Y座標を数学的中心から+8UPM上へ |
| B | ウエストink trap | 外側ジャンクション点を12UPM内側へ |
| M | ダイアゴナル細め | 内側V端点を±10UPM狭め + ナディア16UPM深化 |
| I, U | 改変なし | Iは呼吸点、Uは原型カーブ維持 |

### 2.4 SVG座標変換
```
Font coords (opentype.js):
  y = 0  → baseline
  y < 0  → above baseline (cap height = -710)
  y > 0  → below baseline (overshoot)

SVG coords:
  svgY = fontY + 730  (= 710 capHeight + 20 overshoot padding)

  font y=-710 (cap)     → SVG y=20  (top)
  font y=0   (baseline) → SVG y=730 (bottom)
  font y=16  (overshoot) → SVG y=746

ViewBox: "0 0 {totalWidth} 750"
```

### 2.5 カーニングテーブル
**CHIBA (Primary)**:
| ペア | 値 (UPM) |
|------|----------|
| C-H | -18 |
| H-I | 0 |
| I-B | 0 |
| B-A | -24 |

**Word Space**: 234 UPM

**TAKUMI (Secondary)**:
| ペア | 値 (UPM) |
|------|----------|
| T-A | -32 |
| A-K | -20 |
| K-U | -14 |
| U-M | -4 |
| M-I | -10 |

### 2.6 最終仕様
- **ウェイト**: CHIBA / TAKUMI 両方 Geist Medium 500（統一）
- **色 (Nav)**: 両方 `var(--text-base)` = `#F5F5F5`
- **色 (Hero)**: CHIBA = `var(--text-base)`, TAKUMI = `color-mix(in srgb, var(--text-base) 78%, var(--accent-amber1))`
- **レンダリング**: `fill` ベース（stroke ではなく）、クローズドパスアウトライン
- **レスポンシブ**: `w-full max-w-[52rem]` でコンテナ幅に自動フィット

### 2.7 意思決定の経緯
1. 初期: Light 300 (TAKUMI) + Medium 500 (CHIBA) のウェイト差 → TAKUMI が細く見える
2. 修正1: 両方 Medium 500 に統一 → まだ TAKUMI が細く見える
3. 修正2: TAKUMI の色を 80% opacity → 100% に統一 → 解決（暗い背景での光学錯視）
4. Hero: 1行表示、`w-full` でモバイル対応

---

## 3. 現在のロゴマーク（リデザイン対象）

### 3.1 現行デザイン
```
現行 TC シンボル（stroke ベース）:
┌──────────────────────┐
│  ━━━━━━━━━━━━━━━━━━  │  ← 上レール
│  ┃         ┃         │  ← 左縦 (C) + 中央ステム (T)
│  ┃━━━━━━━━━┛         │  ← 中間レール (工)
│  ┃         ┃         │
│  ━━━━━━━━━━━━━━━━━━  │  ← 下レール
└──────────────────────┘
```

### 3.2 現行 SVG パス
```svg
<!-- logo-mark.svg (80x80 grid) -->
<path d="M62 16H20V64H62M40 16V64M20 40H50"
      stroke="#F5F5F5" stroke-width="5"
      stroke-linecap="round" stroke-linejoin="round"/>
```

### 3.3 現行 portfolio.ts データ
```typescript
logo: {
  viewBox: "0 0 72 72",
  width: 72,
  height: 72,
  strokeWidth: 3.5,
  minSize: 16,
  clearSpace: 12,
  path: "M10 10H62V18H18V54H62V62H10Z M28 10H62V18H49V62H39V18H28Z",
}
```

### 3.4 BrandMark.tsx コンポーネント
```tsx
// stroke ベースのレンダリング
<svg viewBox={logo.viewBox} fill="none">
  <path d={logo.path}
    stroke="currentColor"
    strokeWidth={logo.strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round" />
</svg>
```

### 3.5 現行の問題点
- **手書きの直線 stroke** — 幾何学的根拠がない
- **TC の読みが弱い** — 「工」の記憶は残るが、T/C として認識しにくい
- ロゴタイプとの一貫性が薄い（タイプは fill ベースの改変グリフ、マークは stroke の直線）
- favicon スケール（16px）での視認性に課題

### 3.6 シンボルの意味レイヤー
| レイヤー | 読み | 構造 |
|---------|------|------|
| T | Takumi (名) | 中央の縦ステム |
| C | Chiba (姓) | 左縦 + 上下レール = 開いた C |
| 工 | たくみ (craft) | 上下横棒 + 中央縦棒 = 漢字「工」 |

---

## 4. 数学的リデザインへの提案

### 4.1 ロゴタイプで確立したデザイン言語
ロゴマークに引き継ぐべき設計原則:

| 原則 | ロゴタイプでの適用 | マークへの適用案 |
|------|------------------|-----------------|
| **黄金比 φ** | クロスバー位置 H×(1-1/φ)、スペース幅 S×φ² | グリッド分割、内部比率 |
| **Fibonacci 数列** | 文字幅比 21:13:5、基本単位 48UPM | マークのグリッド単位 |
| **超楕円 n≈2.5** | C, B, U のカーブ（計画段階） | マークの角丸、内部カーブ |
| **30° ターミナル** | C, T の端処理 | マークの開放端 |
| **ink trap** | B ウエスト、K ジャンクション | 交差部の処理 |
| **fill ベース** | アウトラインパス | マークも fill に統一 |

### 4.2 数学的アプローチの候補
1. **黄金比グリッド**: 72×72 or 80×80 のグリッドを φ 比率で分割
2. **円と直線の幾何学構成**: 正円、黄金矩形、角度 30°/60°/90° の組み合わせ
3. **超楕円ベース**: |x/a|^2.5 + |y/b|^2.5 = 1 で角丸を統一
4. **opentype.js 再利用**: T, C の文字グリフを抽出し、幾何学的にオーバーレイ・融合

### 4.3 技術的制約
- **BrandMark.tsx**: 現在 stroke ベース → fill ベースに変更が望ましい（ロゴタイプと統一）
- **portfolio.ts `logo.path`**: 単一パス → 複数パスに拡張可能（primaryPaths 方式）
- **favicon 対応**: 16px で識別可能な最小限の構造が必要
- **stroke-draw アニメーション**: ページトランジションで使用中 → 移行計画が必要

---

## 5. ファイル構成

### 5.1 ブランド関連ファイル
```
apps/web/
  scripts/
    fonts/Geist-Light.otf          # フォント（.gitignore対象）
    fonts/Geist-Medium.otf         # フォント（.gitignore対象）
    .cache/                         # 中間ファイル（.gitignore対象）
    extract-glyphs.ts               # グリフ抽出
    modify-glyphs.ts                # 字形改変
    build-wordmark.ts               # 組み立て + 出力
    utils/path-ops.ts               # パス操作ユーティリティ
  src/
    shared/
      data/portfolio.ts             # branding.wordmark + branding.logo
      components/
        BrandWordmark.tsx           # ロゴタイプ（inline SVG fill）
        BrandMark.tsx               # ロゴマーク（inline SVG stroke）← リデザイン対象
  public/
    brand/
      logo-mark.svg                 # マーク SVG ← リデザイン対象
      logo-mark-512.png             # マーク PNG ← 再生成必要
      logo-wordmark.svg             # ワードマーク SVG（完了）
      logo-lockup.svg               # ロックアップ SVG（マーク更新で再生成）
docs/
  brand-identity-mini-guide.md      # ブランドガイド
```

### 5.2 設定ファイル
- `apps/web/tsconfig.json`: `exclude: ["node_modules", "scripts"]`
- `apps/web/.gitignore`: `scripts/fonts/`, `scripts/.cache/`
- `apps/web/package.json`: `opentype.js` in devDependencies

---

## 6. 環境・実行方法

### 6.1 前提
- **Package manager**: bun (npm ではなく)
- **Framework**: Next.js App Router + Tailwind v4 + shadcn/ui
- **フォント**: Geist Sans（サイト全体で使用）

### 6.2 ロゴタイプビルド手順
```bash
cd apps/web

# 1. フォントが scripts/fonts/ にあることを確認
ls scripts/fonts/Geist-Medium.otf

# 2. パイプライン実行
bun run scripts/extract-glyphs.ts    # → .cache/raw-glyphs.json
bun run scripts/modify-glyphs.ts     # → .cache/modified-glyphs.json
bun run scripts/build-wordmark.ts    # → portfolio.ts + SVG files + preview.html

# 3. ビルド検証
bun run build
```

### 6.3 プレビュー
- `scripts/.cache/preview.html` をブラウザで開く（複数サイズ比較）
- `bun run dev` → localhost:3000 でNav/Hero確認

---

## 7. 次のタスク: ロゴマーク数学的リデザイン

### 7.1 ゴール
現在の手書き stroke ベースの TC シンボルを、数学的根拠に基づいた幾何学マークに再設計する。

### 7.2 要件
1. T, C, 工 の三重読みを維持
2. ロゴタイプと同じ設計言語（φ, Fibonacci, 超楕円, 30°ターミナル）
3. fill ベースのアウトラインパス（ロゴタイプと統一）
4. 16px favicon で識別可能
5. ページトランジション用 stroke-draw アニメーション対応（オプション）

### 7.3 変更対象ファイル
- `apps/web/src/shared/data/portfolio.ts` — `branding.logo` フィールド
- `apps/web/src/shared/components/BrandMark.tsx` — stroke → fill 変更
- `apps/web/public/brand/logo-mark.svg` — 新マーク
- `apps/web/public/brand/logo-mark-512.png` — 再生成
- `apps/web/public/brand/logo-lockup.svg` — 再生成
- `apps/web/src/app/icon.svg` — favicon 更新
- `docs/brand-identity-mini-guide.md` — マーク仕様追記

### 7.4 推奨アプローチ
1. 80×80 グリッドをφ比率で分割（黄金比コンストラクション）
2. T/C/工 の構造要素を幾何学プリミティブ（円弧、直線、超楕円）で構成
3. SVG パスを手動 or スクリプトで生成
4. `portfolio.ts` と `BrandMark.tsx` を更新
5. favicon、lockup を再生成

---

## 8. 参考リンク

- **ブランドガイド**: `docs/brand-identity-mini-guide.md`
- **パイプライン詳細**: `memory/logotype-pipeline.md`（Claude memory内）
- **opentype.js**: https://opentype.js.org/
- **Geist Sans**: https://github.com/vercel/geist-font
