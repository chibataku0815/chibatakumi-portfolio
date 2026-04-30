# Filmtone（Web）— インタラクティブ Film Lab 機能 設計メモ

> **対象**: `apps/web/src/features/interactive/film-lab/`  
> **製品表示名**: Filmtone。URL・パッケージ名は従来どおり `film-lab` 系スラッグ。  
> **パラメータの単一ソース**: `film-lab-core`（`Params`・`PARAM_KEYS`）。Web は `types.ts` から re-export。
> **関連 Issue（life・クローズ済み）**: [chibataku0815/life#28](https://github.com/chibataku0815/life/issues/28) — 本ファイルで仕様面の一次情報を置く。

---

## 1. Overview

ブラウザ上で画像（／一部動画）を読み込み、**LUT・トーン・グレイン・Bloom / Halation** などを **WebGL（Three.js）** で合成し、URL 共有・（任意）寄付・スマートルック API 連携まで含む機能群。

- **エントリ**: `FilmLabFullPage`（`/film-lab` ページ）、`FilmLabShowcase`（デモ用）。feature 公開は `index.ts`。
- **描画の心臓**: `FilmLabCanvas` + `Viewport` + マルチパスシェーダ。
- **UI**: `ControlPanel`・`PresetBar`・`LUTPanel`・Quick メタスライダー等。i18n は `next-intl` の `film-lab` 名前空間。

**Desktop（Electron）** は standalone Filmtone repo の別アプリ。シェーダ文字列・`film-lab-core` は共有しうるが、本ファイルの主対象は **Web**。

---

## 2. Architecture（データとレイヤ）

```
FilmLabFullPage / FilmLabShowcase
  └── FilmLabCanvas (WebGL・MediaLoader・Viewport)
  └── ControlPanel (Reducer・スライダー・共有・寄付・Smart Look)
  └── PresetBar / LUTPanel / …
film-lab-core (Params schema・既定値)
apps/web API routes (寄付・Smart Look BFF 等。本ディレクトリ外と連携)
```

- **状態**: `film-lab-reducer.ts` — プリセット適用、A/B 比較、Undo/Redo（履歴上限 30）、`initialGradeParams`（URL 復元）との整合。
- **メディア**: `MediaLoader.ts` — 画像／動画、HEIC/Safari まわりのフォールバック。`Viewport` は cover 幾何・split・compare とシェーダ uniform を同期。
- **共有**: `share-utils.ts`・`params-codec.ts` — grade を URL に載せる。`feature-flags.ts` で表示切替。

---

## 3. Shader pipeline（概要）

すべて **文字列として GLSL** を保持し、`Viewport` 内で RawShaderMaterial / オフスクリーンパスに渡す。**Remotion** は `composite.frag.ts` 等を import 共有しており、Web と出力の見え方を揃える。

| 段 | 主ファイル | 役割（要約） |
|----|------------|----------------|
| メイングレード | `shader/filmlab.vert.ts` + `filmlab.frag.ts` | トーン・色温度・RGB シフト（径方向）・3D LUT・split 左半分原画など |
| Bloom | `shader/bloom.frag.ts` | ハイライト抽出〜ブラー |
| Halation | `shader/halation.frag.ts` | ハレーション |
| Blur 補助 | `shader/blur.frag.ts` | パス間ブラー |
| 合成 | `shader/composite.frag.ts` | Bloom/Halation/ビネット/グレイン（径方向マスク可）/レンズソフト/比較モード合成 |

**uniform の意味**は各 `*.frag.ts` 先頭の JSDoc を正とする。パラメータ名と `Params` の対応は `Viewport` 側の代入を追う。

---

## 4. Presets & LUT

- **プリセット一覧・既定 `Params`**: `preset-data.ts`（`PRESETS`、`PresetName`）。
- **外部 LUT**: `.cube` パース `core/cube-parser.ts`。載せ替え時は ControlPanel / Canvas のコールバック連携。
- **品質コーパス**: `preset-quality-corpus/`（検証用アセット・スクリプト README）。

---

## 5. Major components（ファイル地図）

| コンポーネント | 役割 |
|----------------|------|
| `FilmLabCanvas.tsx` | シーン構築、ツールバー、DnD/ファイル入力、compare HUD、`FilmLabCanvasRef`（AI 用 JPEG/PNG 差し替え） |
| `ControlPanel.tsx` | スライダー群、Reducer 接続、モード切替 |
| `quick-meta-sliders.ts` | Quick モード用メタ操作 → `MERGE_PARAMS` |
| `PresetBar.tsx` | プリセット選択 |
| `LUTPanel.tsx` | LUT UI |
| `FilmLabSmartLookSection.tsx` | スマートルック UI・BFF 呼び出し（詳細は API 側ドキュメントと `film-lab-smart-look.ts`） |
| `FilmLabDonation*.tsx` / `film-lab-donation-*.ts` | Stripe・cookie・デバッグ |
| `FilmLabShareSection.tsx` | 共有コピー等 |
| `FilmLabProofVideoCard.tsx` / `film-lab-proof-videos.ts` | LP プルーフ動画 |
| `desktop-release-info.ts` | Desktop DL 導線用 env 参照（Web 表示） |

---

## 6. Interaction & UX（抜粋）

- **Before/After / A/B**: reducer の `BEFORE_AFTER_*`、`COMPARE_*`、`SWITCH_SLOT`。composite の `uAbCompare` / split position。
- **モバイル**: ツールバー高さ・pointer coarse。詳細は各コンポーネントのクラス定数。
- **chromeLayout**: `overlay` | `stacked`（Desktop 埋め込み等でツールバー位置調整）。

---

## 7. Out of scope（本ファイルでは深掘りしない）

- **Desktop Electron** のウィンドウ・動画書き出しパイプライン（standalone Filmtone repo）。
- **寄付・Smart Look** の法務文面・本番シークレット。
- **life リポ**の Issue / handoff（運用の正本は life 側 `docs/guides/film-lab-documentation-index.md`）。

---

## 8. Maintenance

- **仕様変更時**: 本ファイルと、影響するシェーダ JSDoc、必要なら `film-lab-core` のスキーマを同期する。
- **Breaking な Params 変更**: Web・Desktop・Remotion・テストの四方を意識（このリポ内の参照を grep）。

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-03-31 | 初版 — 現行 Web 実装に合わせたアーキテクチャ・パイプライン・コンポーネント地図（life#28 対応） |
