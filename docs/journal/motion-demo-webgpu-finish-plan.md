# Journal motion-demo Depth-2 計画 — WebGPU finish（grain + 色収差）

2026-06-10 起案・同日実装完了（公開はユーザー gate）。ユーザー裁定の経緯:

1. 「B（WebGPU 化 + vec-core finish 移植）が長期的に一番良い」
2. 「移植ではなく読み込みで使える認識では？」→ vec-core は import 設計だが①未 publish（Vercel で解決不能）②ライブ GPU 実装が存在しない、の 2 ギャップを確認
3. 「（vendoring 案は）二重管理にならないか」→ **vendoring 全面撤回**。filmtone と同一の **git submodule + workspace 直結**へ（このリポで Vercel 実証済みの house pattern）
4. 「承認」→ 本構成で実装

## 最終アーキテクチャ（v2 — コピーゼロ）

```
visual-effect-core (private GitHub: chibataku0815/visual-effect-core)
  └─ bridges/webgpu-finish  ← 新パッケージ @bridges/webgpu-finish = WGSL の正本
       src/params.ts    API-finish 標準定数 + 固定 light パレット（2026-06-08f 標準）
       src/cpu.ts       CPU 合成オラクル（lab パイプラインの逐語再構成）
       src/seed.ts      mulberry32 の Weyl 展開閉形式（GPU 並列化の鍵）
       src/wgsl.ts      grain / CA の WGSL 移植（テンプレート文字列）
       src/pipeline.ts  2 パス WebGPU パイプライン
       tools/verify-against-lab-frames.ts  hop-1 検証スクリプト

chibatakumi-portfolio
  └─ vendor/visual-effect-core  ← git submodule（filmtone と同型）
       workspaces: packages/{visual-effect-core,visual-render-core,visual-effect-controls}
                   bridges/{svg-webgpu,webgpu-finish}
  └─ apps/web …… @bridges/webgpu-finish を import するだけ（数学のコピーなし）
       features/journal/motion-demos/finish/lattice-breath-source.ts  source 描画（host 責務）
       features/journal/motion-demos/LatticeBreathFinishDemo.tsx      ライブデモ
       app/[locale]/(portfolio)/dev/finish-parity/                    parity ハーネス（dev 専用）
       e2e/finish-parity.spec.ts                                      hop-2 自動ゲート
```

- **責務分割は ADR-0001 準拠**: 効果数学（grain field・overlay・CA resample・重み ramp のパラメトリック合成）= `@bridges/webgpu-finish`。source 描画・パレット選択・ループ駆動 = host（portfolio）。
- vec-core への追加変更は additive のみ: `svg-webgpu` に `xmur3` export + 純 CPU モジュールのサブパス exports（`./grain-overlay`, `./chromatic-aberration-overlay`）。
- 残る「2 実装」は lab スクリプトと本パッケージの host 合成だが、これは hop-1 バイト証明で互いに pin される（二重管理ではなく oracle 関係）。

## 数学（移植の核心）

- **grain**: vec-core `grainSampleField`（`xmur3` → `mulberry32`）の 960 グリッド field → overlay 化（α=|v|·0.35）→ nearest 写像 merge → luma 反転 ramp 重み lerp。**mulberry32 は Weyl 列**（state = seed + (i+1)·0x6D2B79F5 mod 2³²）なので i 番目の出力は閉形式 = per-pixel GPU 並列化が可能。
- **CA**: vec-core `applyChromaticAberration` 逐語 — radial lateral、R 内向き/B 外向き bilinear、G/α 据え置き、HW sampler 不使用（textureLoad 手書き bilinear）。
- **丸めモード写像**: JS `Math.round`（half-up）→ WGSL `floor(x+0.5)` / `Uint8ClampedArray`（half-even）→ WGSL `round()`。
- パラメータは全て frame 相対（1080 基準をスケール）。grain seed 文字列は SNS 納品と同一（`api-finish-count-growth-post-g41-${f}`）= field 列がクリップとビット同一。

## 証明チェーン — 検証記録（2026-06-10 実測・全 PASS）

```
SNS クリップの finish（lab CPU パイプライン・count-growth-post-light 実納品フレーム）
   ↑ hop-1: applyFinishCpu ≡ lab final bytes
   |   bun tools/verify-against-lab-frames.ts <labDir> --all
   |   ✅ 90/90 フレーム・4,665,600 bytes/frame 全一致・maxΔ=0（バイト同一）
@bridges/webgpu-finish CPU オラクル
   ↑ hop-2: WGSL ≡ オラクル（bun run e2e:finish-parity・640×640・Playwright Chromium）
   |   ✅ main（full chain・f=0/24/38/60）: 100% が ±1 LSB・maxΔ=1・不一致 83〜117/1,638,400（0.005〜0.007%）
   |   ✅ leg a（fringing=0 = grain 段単独）: 不一致 0 = **WGSL grain はオラクルとバイト同一**
   |        → ±1 LSB の残差は CA bilinear の f32/f64 丸めのみと確定
   |   ✅ leg b（全効果 off・writeTexture）: 不一致 0 = パイプライン経路はバイト清浄
   |   ✅ leg d（全効果 off・copyExternalImageToTexture）: 不一致 0 = ライブデモのアップロード経路も清浄
   |   ✅ leg c（seed+1 破壊）: 62.7% 不一致・maxΔ=48 で FAIL = ゲートは反証可能
WGSL 2 パス（本番ライブデモ）
```

単体テスト（vec-core 内・`bun test`）:
- `seed.test.ts`: Weyl 閉形式 ≡ `grainSampleField` 全インデックス f32 一致（960×960 wraparound 含む）+ 破壊 seed 反証レッグ — 7 tests PASS
- `svg-webgpu` 回帰: 157/157 PASS（additive 変更の無害確認）

統合検証:
- `tsc --noEmit`（apps/web）: 新規エラーゼロ（既存の film-lab release-data.test.ts 1 件のみ残置 = 着手前から存在）
- `bun run build:web`: ✅ 83/83 SSG・両ロケール lattice-breath プリレンダー
- i18n: JSON parse OK・ですます 0・ja/en block 数 11=11・type 順序一致
- 実描画確認: 記事ページの canvas `toDataURL` 抽出で 2 フレーム目視 — 固定 light パレット・CA フリンジ・grain を確認（headless の figure screenshot が空に写るのは WebGPU 合成の既知アーティファクト・実内容は描画されている）

## 既知の偏差（盛らない）

- CA 段の f32/f64 丸めで全バイトの ~0.006% が ±1 LSB（gate の許容そのもの・grain 段はバイト同一）
- 表示解像度 640 では 960 グリッド grain が 1 device px に量子化（kernel の nearest 写像どおり）
- ライブは H.264（`-tune grain`）を経ない生フレーム = クリップより grain が鮮明（こちらが真値）
- rgba8unorm 書き込みの tie 丸めは実装定義（±1 LSB 許容に包含）

## 運用

- **vec-core を更新したら**: submodule 内で commit → GitHub へ push → portfolio で gitlink bump（filmtone と同じ儀式）
- **vec-core の正本リポ**（/Volumes/.../forestone/visual-effect-core）へは submodule から `git fetch` で同期（編集は一方からのみ）
- 次の verb を載せる手順: source 描画関数（host）+ デモ component + registry 登録のみ。finish パイプラインは verb 非依存
- bloom が要る verb が出たら vec-core 側で Pass 1.5 を検討（YAGNI で未実装)
- 残課題: Playwright headless の figure screenshot に WebGPU canvas が写らない件は無害（toDataURL は機能する）

## ロールバック

`JournalMotionDemo.tsx` の registry 1 行を `LatticeBreathDemo`（SVG）へ戻すだけで Depth-1 に復帰。
