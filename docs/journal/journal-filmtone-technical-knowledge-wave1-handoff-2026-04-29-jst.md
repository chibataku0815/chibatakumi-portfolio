# Journal Wave 1 — Filmtone 技術ナレッジ志向への全面ピボット ハンドオフ

**作成日**: 2026-04-29 JST  
**前提リポ**: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` (branch: `main`)  
**前ハンドオフ**: `docs/journal/journal-rewrite-rejected-and-restart-handoff-2026-04-29-jst.md`  
**目的**: 別チャットでこの作業を **完全な状態から継続できる** ための引き継ぎ。本ドキュメントを最初に必ず読むこと。

---

## 0. 結論サマリ(最重要)

### 0.1 何が起きたか

このセッションで Wave 1 の方向性が **2 度の根本的なピボット** を経て確定した。

1. **第 1 ピボット**: ユーザー却下 → 4 ストリーム並列リサーチ → reader-value 起点で 7 記事を rewrite (commit `49cad154`)
2. **第 2 ピボット**: 「filmtone**ないし**技術力をアピールすべきなのに直近の細かい対応とか誰得?」 → 7 記事を全て `hold` に降格、Filmtone 駆動の 5 記事を新設
3. **第 3 ピボット**: 「判断とかじゃなくて技術詳細にした方がいいんじゃないの? ナレッジにもなるし」 → タイトル・要約を **判断ナラティブ → 技術詳細・ナレッジ志向** に全面書き直し

### 0.2 確定した方針

- **Wave 1 = Filmtone 駆動の 5 記事**(全て `status: "draft"`、本文未執筆)
- **既存 7 記事は全て `status: "hold"`** (registry に残るが index/sitemap から除外、direct URL アクセスも `notFound()`)
- **記事の framing**: 「判断/話/理由」ナラティブ ❌ / 「技術詳細・実装パターン・ナレッジ」 ✅
- **読者像**: エンジニア・技術リクルーター・ピア(ブックマークして参照する層)
- **EN/JA の関係**: 両方を技術ナレッジ起点で再執筆(翻訳ではなく独立した技術文書)

### 0.3 次セッションで何をやるか

1. **このセッションの未コミット変更を commit** (タイトル/要約/registry/ゲート、本文以外)
2. **5 記事の本文 `sections[]` を執筆** (heading / paragraph / code / callout / list)
3. **5 記事のルートファイル `page.tsx` を作成** (既存 `portfolio-renewal-2026/page.tsx` パターンを踏襲)
4. **`status: "draft"` → `"published"` に切替**
5. **`bunx tsc --noEmit` + `bun run build` で検証 → commit**

---

## 1. 現在のファイル状態(次セッションが受け取るもの)

### 1.1 git ステータス

```text
HEAD: 49cad154 refactor(journal): trim wave 1 to 5 published, gate motion-study drafts
```

直前のコミット `49cad154` の内容(参考):
- `boiling-poster-aperture` / `temporal-echo-residue` を draft 化
- motion-studies/[slug]/page.tsx に status ゲート追加
- `docs/journal/` の handoffs と supporting docs を追加

その後の **未コミット変更** (このセッションで足したもの):

```text
M apps/web/messages/en.json
M apps/web/messages/ja.json
M apps/web/src/app/[locale]/(portfolio)/journal/journal-typography-wordmark-system/page.tsx
M apps/web/src/app/[locale]/(portfolio)/journal/mobile-safari-touch-controller/page.tsx
M apps/web/src/app/[locale]/(portfolio)/journal/portfolio-renewal-2026/page.tsx
M apps/web/src/shared/data/journal.ts
?? docs/journal/journal-filmtone-technical-knowledge-wave1-handoff-2026-04-29-jst.md  (本ドキュメント)
```

**注意**: working tree には他に filmtone-ios / filmtone-lp 関連の未コミット変更がある (別セッションの作業)。**触らないこと**。

### 1.2 変更内容の詳細

#### `apps/web/src/shared/data/journal.ts`

- `journalEntries` 配列の構成を全面変更
  - **新 Wave 1 (5 entries, status: `"draft"`)**:
    1. `filmtone-motion-180-shutter-baseline` (case-study, production, priority 1)
    2. `filmtone-dual-lut-pipeline` (case-study, production, priority 2)
    3. `filmtone-cross-platform-color-parity` (engineering-note, production, priority 3)
    4. `filmtone-capacitor-native-bridge` (engineering-note, production, priority 4)
    5. `filmtone-app-store-v12-shipping` (case-study, production, priority 5)
  - **既存 3 記事 (status: `"hold"`、priority 90-92 で末尾に押し下げ)**:
    - `portfolio-renewal-2026` (priority 90)
    - `mobile-safari-touch-controller` (priority 91)
    - `journal-typography-wordmark-system` (priority 92)
- `motionStudyEntries` 配列の 4 件全て `status: "hold"` に変更
- JSDoc・型定義・helper 関数は変更なし

#### `apps/web/src/app/[locale]/(portfolio)/journal/<slug>/page.tsx` (3 ファイル)

3 つの静的記事ページ (`portfolio-renewal-2026`, `mobile-safari-touch-controller`, `journal-typography-wordmark-system`) に以下を追加:

```ts
import { notFound } from "next/navigation";
// ...
const entry = getJournalEntryBySlug(SLUG);
if (!entry || entry.status !== "published") notFound();
```

直接 URL アクセスでも 404 を返すゲートを追加。motion-studies/[slug] は `49cad154` で既に同じゲートが入っている。

#### `apps/web/messages/en.json` と `apps/web/messages/ja.json`

5 つの新エントリーを `journal.entries.<slug>` に追加 (eyebrow / title / summary / metaDescription)。既存の 7 エントリーは触っていない。

---

## 2. このセッションの完全な経緯

### 2.1 Phase 1 — 4 ストリーム並列リサーチ (Agent Teams)

ユーザー指示「Agent Teamsで」+ 「保守的な意見は優先せず」を受け、`journal-rewrite-2026` チームを作成し 4 並列 stream を起動:

| Stream | 担当 | 出力 |
|--------|------|------|
| A: content-extractor | 7 記事の本文を読み読者価値抽出 | `/tmp/journal-stream-a-output.md` |
| B: title-diagnostician | 却下されたタイトルの失敗モード診断 | `/tmp/journal-stream-b-output.md` |
| C: title-researcher | 2026 年日本語タイトル原則の外部リサーチ | `/tmp/journal-stream-c-output.md` |
| D: publish-auditor | 7 記事の公開可否を再評価 | `/tmp/journal-stream-d-output.md` |

統合: `/tmp/journal-synthesis-2026-04-29.md`

**重要発見**: 7 記事中 6 記事で **EN 原文も同じ情報設計失敗**。「ライト・サブストレート」「Renewal 2026」「Signal Stroke Relay」等の内部固有名詞が EN 側でも未定義のまま投下されている。**JA 単独修正では解決不可**。

### 2.2 Phase 2 — Wave 1 構成と再執筆スコープを決定

ユーザー回答(AskUserQuestion):
- **Wave 1 構成**: Option B (5 本 published / 2 本 draft 化)
- **EN/JA 両方を読者価値起点で再執筆**

実装(`/tmp/journal-synthesis-2026-04-29.md` の候補に従い):
- 7 記事の title/summary/metaDescription を EN+JA 両方リライト
- `boiling-poster-aperture` / `temporal-echo-residue` を draft 化
- motion-studies/[slug]/page.tsx に status ゲート追加

→ 別セッションの filmtone-lp commit `82e5c1aa` が working tree の journal 変更を意図せず巻き込み、その後 `49cad154 refactor(journal): trim wave 1 to 5 published, gate motion-study drafts` でクリーンアップ。

### 2.3 Phase 3 — 第 2 ピボット: Filmtone 駆動への転換

ユーザーフィードバック(verbatim):

> もっとfilmtoneの機能実装についての生地とかの方が良いと思います  
> 意味がない記事が多過ぎます  
> 読んでもらってfilmtoneないし、技術力をアピールすべきなのに直近の細かい対応とか誰得?

→ 既存 7 記事は **全て meta 記事**(ポートフォリオサイト自身の話)であり、Filmtone も技術力もアピールしていないと判明。**全 7 記事 → `hold`**、Filmtone 駆動の 5 記事を新設。

5 記事のソース素材:
- `docs/filmtone/filmtone-motion-180-baseline-industry-handoff-2026-04-29-jst.md`
- `docs/filmtone/ios/filmtone-ios-lut-intensity-slider-handoff-2026-04-29-jst.md`
- `docs/filmtone/ios/filmtone-ios-v12-release-to-aso-handoff-2026-04-29-jst.md`
- `apps/capacitor-film-lab-ios/CLAUDE.md`
- 直近 50 件の `feat(filmtone-ios)` / `fix(filmtone)` コミット

### 2.4 Phase 4 — 第 3 ピボット: 判断ナラティブ → 技術ナレッジ

ユーザーフィードバック(verbatim):

> 判断とかじゃなくて技術詳細にした方がいいんじゃないの?  
> ナレッジにもなるし

→ 「`〇〇にした判断`」「`〇〇した話`」「`〇〇した理由`」というナラティブ form ではなく、**実装パターン / 数式 / データモデル / 関数名** が並ぶ **technical reference** に書き直し。

書き換え原則:
- ナラティブ語(判断/話/理由/経緯)を排除
- 具体的な関数名・型・数式・ファイルパス・バージョン番号を summary に密度高く埋め込む
- 読者が **コピペして真似できる** レベルの粒度
- eyebrow(ジャンルラベル)も技術トピック単位に: `Motion Blur` / `Color Pipeline` / `Code Generation` / `iOS Bridge` / `Release Engineering`

---

## 3. 新 Wave 1 — 5 記事の完全仕様

### 3.1 記事 1: `filmtone-motion-180-shutter-baseline`

| フィールド | 値 |
|------|------|
| kind | `case-study` |
| href | `/journal/filmtone-motion-180-shutter-baseline` |
| publishedAt | `2026-04-29` |
| priority | 1 |
| tags | `["Filmtone", "Motion Blur", "Shutter Angle", "Color Science"]` |
| status | `"draft"` |
| evidenceLevel | `"production"` |
| related | `["filmtone-cross-platform-color-parity"]` |
| eyebrow | `Filmtone / Motion Blur` |

**JA title**:
> シャッター角度から露光フレーム数への変換 — Filmtone のモーションブラー数式と業界標準への準拠

**JA summary**:
> シャッター角度を露光時間として扱う実装。`exposureFrames = clamp(angle, 0, 720) / 360` で露光時間に正規化し、180度を「ベースライン (0.5 frame)」として扱う。リングバッファに渡されるのは `additionalExposureFrames = max(0, target - 0.5)` のみ。マッピングは `360度 → 2フレーム (triangle weights `[2/3, 1/3]`)`、`720度 → 3フレーム (flat weights `[1/3, 1/3, 1/3]`)`。同じ数式が WebGL fragment shader / WebGPU compute / iOS Swift export session に共有され、RED / Foundry Nuke / Blender / Houdini / After Effects の実装と整合する。

**JA metaDescription**:
> Filmtone のモーションブラー実装。シャッター角度を露光時間として正規化し、180度ベースライン + 追加露光のリングバッファ加重で WebGL/WebGPU/Swift 3 実装を共有させる数式。`exposureFrames = angle/360` から weights 配列まで具体的に解説。

**EN title**:
> From shutter angle to exposure frame count — Filmtone's motion blur math, aligned with industry conventions

**EN summary**:
> Treating shutter angle as exposure duration. `exposureFrames = clamp(angle, 0, 720) / 360`, with 180° as the baseline (`0.5 frame`). Only `additionalExposureFrames = max(0, target - 0.5)` reaches the ring buffer. The mapping is `360° → 2 frames (triangle weights [2/3, 1/3])` and `720° → 3 frames (flat weights [1/3, 1/3, 1/3])`. The same math is shared across a WebGL fragment shader, a WebGPU compute shader, and an iOS Swift export session — and validated against RED, Foundry Nuke, Blender, Houdini, and After Effects.

**EN metaDescription**:
> Filmtone's motion blur implementation: shutter angle normalized to exposure duration, with a 180° baseline plus ring-buffer additional exposure across WebGL/WebGPU/Swift. Walks through `exposureFrames = angle/360` and the concrete weight arrays.

**本文素材**: `docs/filmtone/filmtone-motion-180-baseline-industry-handoff-2026-04-29-jst.md` に **完全な実装記録 + 業界標準調査 + 数式 + ファイル一覧** がある。これをそのまま heading / paragraph / code / list / callout に分解可能。

**主要な実装ファイル**:
- `packages/film-lab-renderer/src/motionBlurMath.ts`
- `packages/film-lab-renderer/src/motionBlurMath.test.ts`
- `packages/film-lab-renderer/src/webgl/WebGLBackend.ts`
- `packages/film-lab-renderer/src/webgpu/WebGPUBackend.ts`
- `packages/film-lab-renderer/src/webgpu/RingBuffer.ts`
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMotionBlurMath.swift`

---

### 3.2 記事 2: `filmtone-dual-lut-pipeline`

| フィールド | 値 |
|------|------|
| kind | `case-study` |
| href | `/journal/filmtone-dual-lut-pipeline` |
| publishedAt | `2026-04-29` |
| priority | 2 |
| tags | `["Filmtone", "LUT", "Color Pipeline", "Architecture"]` |
| status | `"draft"` |
| evidenceLevel | `"production"` |
| related | `["filmtone-cross-platform-color-parity"]` |
| eyebrow | `Filmtone / Color Pipeline` |

**JA title**:
> Filmtone の2系統 LUT パイプライン実装 — `inputLut` / `creativeLut` のデータモデルと CIColorMatrix による intensity ブレンド

**JA summary**:
> Filmtone は `.cube` LUT を `inputLut` (Source Profile / Camera) と `creativeLut` (Look) の 2 スロットで保持する。データモデルは `ParsedCubeLutDTO { title, size, data, intensity }` と `SerializableLutDTO { size, data, intensity }`。書き出し順は `input LUT → base grade → tone compression → edge optics → glow → vignette → grain → creative LUT → print` で固定。`intensity < 0.999` の時は `CIColorMatrix` (元画像) と `CISourceOverCompositing` (LUT 結果) で線形ブレンドし、`>= 0.999` なら LUT 結果をそのまま返す。素材差し替え時は `inputLut` だけ消し、`creativeLut` は保持する。

**JA metaDescription**:
> Filmtone の 2 系統 LUT パイプライン実装。`inputLut` / `creativeLut` のデータモデル、書き出し順序、CIColorMatrix + CISourceOverCompositing による intensity 線形ブレンドの仕組み、素材差し替え時の保持/破棄ルール。

**EN title**:
> Filmtone's two-lane LUT pipeline implementation — the inputLut/creativeLut data model and intensity blending via CIColorMatrix

**EN summary**:
> Filmtone holds `.cube` LUTs in two slots: `inputLut` (Source Profile / Camera) and `creativeLut` (Look). The data model is `ParsedCubeLutDTO { title, size, data, intensity }` and `SerializableLutDTO { size, data, intensity }`. The export order is fixed: `input LUT → base grade → tone compression → edge optics → glow → vignette → grain → creative LUT → print`. When `intensity < 0.999`, results blend linearly via `CIColorMatrix` (source) over `CISourceOverCompositing` (LUT output); above that, the LUT output passes through. On source replacement, `inputLut` clears but `creativeLut` is preserved.

**EN metaDescription**:
> Implementation of Filmtone's two-lane LUT pipeline — inputLut/creativeLut data model, the fixed export order, CIColorMatrix + CISourceOverCompositing intensity blending, and the source-replacement preservation rule.

**本文素材**: `docs/filmtone/ios/filmtone-ios-lut-intensity-slider-handoff-2026-04-29-jst.md` に **データモデル / Store mutation / Export rendering / UI entry point の完全記録** がある。

**主要な実装ファイル**:
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMediaTypes.swift` (DTO)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneCubeParser.swift` (import)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtonePhase0Math.swift` (export request)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneExportSession.swift` (rendering)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneEditorStore.swift` (mutation)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneRootView.swift` (UI)

---

### 3.3 記事 3: `filmtone-cross-platform-color-parity`

| フィールド | 値 |
|------|------|
| kind | `engineering-note` |
| href | `/journal/filmtone-cross-platform-color-parity` |
| publishedAt | `2026-04-29` |
| priority | 3 |
| tags | `["Filmtone", "WebGL", "WebGPU", "Swift", "Cross-platform"]` |
| status | `"draft"` |
| evidenceLevel | `"production"` |
| related | `["filmtone-motion-180-shutter-baseline", "filmtone-dual-lut-pipeline"]` |
| eyebrow | `Filmtone / Code Generation` |

**JA title**:
> TypeScript の色変換数学から Swift コードを機械生成する — Filmtone のクロスプラットフォーム色一致パイプライン

**JA summary**:
> 色変換・モーションブラー・露出計算を `packages/film-lab-renderer/src/` の TypeScript に集約し、`bun run generate:filmtone-ios-swift` で `FilmtonePhase0Generated.swift` を機械生成する。Swift 側は手書き禁止。Phase 0 contract test (`verify:swift-contract`) が生成された数式と TypeScript 出力の一致を検証する。WebGL fragment shader は GLSL 定数として、WebGPU compute は WGSL として、iOS Swift export は生成モジュールとして同じ数式を読む。色一致を「規律」ではなく「構造」で守る実装。

**JA metaDescription**:
> Filmtone がプレビュー (WebGL/WebGPU) と iOS Swift 書き出しで完全に同じ色を出すための単一参照源パターン。色変換・モーションブラー・露出計算を TypeScript に集約し、`generate:filmtone-ios-swift` で Swift モジュールを機械生成、`verify:swift-contract` で一致を検証。

**EN title**:
> Generating Swift from TypeScript math — Filmtone's cross-platform color parity pipeline

**EN summary**:
> Color transforms, motion blur, and exposure math live in TypeScript inside `packages/film-lab-renderer/src/`. `bun run generate:filmtone-ios-swift` mechanically produces `FilmtonePhase0Generated.swift`; hand-editing the generated module is prohibited. The Phase 0 contract test (`verify:swift-contract`) confirms the generated math matches the TypeScript output. WebGL fragment shaders read the math as GLSL constants, WebGPU compute shaders as WGSL, and the iOS Swift export session as the generated module. Color parity is held by structure, not discipline.

**EN metaDescription**:
> How Filmtone keeps colors identical across WebGL/WebGPU preview and iOS Swift export — TypeScript as the single source of math, generated to Swift via `generate:filmtone-ios-swift` and validated through `verify:swift-contract`.

**本文素材**: `apps/capacitor-film-lab-ios/CLAUDE.md` §3 (build chain) と §4 (commit gate)、Motion 180 ハンドオフの「Verified Behavior Already Achieved」セクション。

**主要な実装ファイル**:
- `packages/film-lab-renderer/src/` (TypeScript master)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtonePhase0Generated.swift` (generated)
- `apps/capacitor-film-lab-ios/scripts/swift/test-motion-blur-math.swift` (contract test)
- `apps/capacitor-film-lab-ios/scripts/verify-phase0-contract.sh`

---

### 3.4 記事 4: `filmtone-capacitor-native-bridge`

| フィールド | 値 |
|------|------|
| kind | `engineering-note` |
| href | `/journal/filmtone-capacitor-native-bridge` |
| publishedAt | `2026-04-29` |
| priority | 4 |
| tags | `["Filmtone", "Capacitor", "iOS", "Native Plugin"]` |
| status | `"draft"` |
| evidenceLevel | `"production"` |
| eyebrow | `Filmtone / iOS Bridge` |

**JA title**:
> Capacitor native plugin で iOS PhotoLibrary / Core Image / ActivityKit に届く — `FilmtoneMediaPlugin` 9 メソッドの実装パターン

**JA summary**:
> Filmtone iOS は Capacitor 7.4 のハイブリッドアプリだが、`FilmtoneMediaPlugin` で 9 つの native メソッドを TypeScript 側に露出する: `pickSource` (PhotoLibrary)、`pickLutFile` (DocumentPicker)、`probeSource` (AVAsset metadata)、`renderPreviewFrame` (Core Image)、`runExport` (Core Video write)、`saveToPhotos` (PHPhotoLibrary)、`shareOutput` (UIActivityViewController)、`cancelExport`、`handleMemoryWarning`。各メソッドは Swift `@objc` で公開され、TypeScript 側 `src/native/filmtoneMedia.ts` がプロキシを定義する。bridge 変更は両側を同時 PR で出す (片肺更新が runtime 事故の最頻原因)。

**JA metaDescription**:
> Filmtone iOS が Capacitor native plugin 経由で iOS PhotoLibrary / Core Image / ActivityKit にアクセスする実装。`FilmtoneMediaPlugin` の 9 メソッド (pickSource / runExport / Live Activity / cancelExport 等) の責務分担と、TS↔Swift 両側同時更新パターン。

**EN title**:
> Reaching iOS PhotoLibrary, Core Image, and ActivityKit through a Capacitor native plugin — implementing FilmtoneMediaPlugin's nine methods

**EN summary**:
> Filmtone iOS is a Capacitor 7.4 hybrid app, but `FilmtoneMediaPlugin` exposes nine native methods to the TypeScript side: `pickSource` (PhotoLibrary), `pickLutFile` (DocumentPicker), `probeSource` (AVAsset metadata), `renderPreviewFrame` (Core Image), `runExport` (Core Video write), `saveToPhotos` (PHPhotoLibrary), `shareOutput` (UIActivityViewController), `cancelExport`, `handleMemoryWarning`. Each is published via Swift `@objc`, with a TypeScript proxy in `src/native/filmtoneMedia.ts`. Bridge changes ship in dual-side PRs (single-side updates are the most common runtime breakage).

**EN metaDescription**:
> How Filmtone iOS reaches iOS PhotoLibrary, Core Image, and ActivityKit through a Capacitor native plugin — the nine methods of `FilmtoneMediaPlugin` (pickSource / runExport / Live Activity / cancelExport, etc.) and the TS-Swift dual-PR pattern.

**本文素材**: `apps/capacitor-film-lab-ios/CLAUDE.md` §7 (Capacitor plugin surface) に 9 メソッドの一覧。`FilmtoneMediaPlugin.swift` 自体を読んで実装パターン抽出。

**主要な実装ファイル**:
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMediaPlugin.swift`
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMediaTypes.swift`
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMediaRuntime.swift`
- `apps/capacitor-film-lab-ios/src/native/filmtoneMedia.ts` (TS proxy)
- `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneExportLiveActivity.swift`
- `apps/capacitor-film-lab-ios/ios/App/App/CancelExportIntent.swift`

---

### 3.5 記事 5: `filmtone-app-store-v12-shipping`

| フィールド | 値 |
|------|------|
| kind | `case-study` |
| href | `/journal/filmtone-app-store-v12-shipping` |
| publishedAt | `2026-04-29` |
| priority | 5 |
| tags | `["Filmtone", "iOS", "App Store", "Fastlane", "Release Engineering"]` |
| status | `"draft"` |
| evidenceLevel | `"production"` |
| eyebrow | `Filmtone / Release Engineering` |

**JA title**:
> fastlane で iOS リリース工程を 6 lane に分ける — Filmtone の archive / screenshots / metadata / beta / release / submit_review 設計

**JA summary**:
> fastlane を 6 lane に責務分割する: `archive` (IPA ビルド)、`screenshots` (UI test snapshots)、`metadata` (ASC localized metadata + review info)、`beta` (TestFlight upload)、`release` (binary + metadata + screenshots upload)、`submit_review` (既存 build だけで審査提出)。実運用で踏んだ罠 2 つの修正も含む: gym 2.233 が認証引数を `xcargs` と `export_xcargs` の両方に渡し IPA export が `Exit status: 64`、`deliver` が `release_notes` を upload options に明示せず ASC が `whatsNew` 不在で review を弾く。それぞれの最小修正と再提出フローの記録。

**JA metaDescription**:
> Filmtone iOS の fastlane lane 設計実装。archive / screenshots / metadata / beta / release / submit_review の 6 lane 責務分担と、gym xcargs 二重渡しおよび deliver release_notes 未明示で踏んだ罠の最小修正方法。

**EN title**:
> Splitting an iOS release into six fastlane lanes — Filmtone's archive / screenshots / metadata / beta / release / submit_review design

**EN summary**:
> Fastlane is split into six lanes by responsibility: `archive` (IPA build), `screenshots` (UI test snapshots), `metadata` (ASC localized metadata + review info), `beta` (TestFlight upload), `release` (binary + metadata + screenshots upload), `submit_review` (resubmits an existing build for review). The record covers two production traps and their fixes: gym 2.233 passing auth args into both `xcargs` and `export_xcargs` (causing `Exit status: 64` on IPA export), and deliver missing `release_notes` in upload options (causing ASC to reject the review submission for missing `whatsNew`). Each is patched with minimum-viable Fastfile edits.

**EN metaDescription**:
> Implementation record of Filmtone's fastlane lane design — archive / screenshots / metadata / beta / release / submit_review responsibilities, with patches for the gym xcargs duplication and the deliver release_notes omission traps.

**本文素材**: `docs/filmtone/ios/filmtone-ios-v12-release-to-aso-handoff-2026-04-29-jst.md` に **lane 一覧 + 罠の詳細 + 修正コミット** が完全記録されている。`apps/capacitor-film-lab-ios/RELEASE.md` も参照。

**主要な実装ファイル**:
- `apps/capacitor-film-lab-ios/fastlane/Fastfile`
- `apps/capacitor-film-lab-ios/fastlane/Deliverfile`
- `apps/capacitor-film-lab-ios/fastlane/metadata/{ja,en-US}/release_notes.txt`
- `apps/capacitor-film-lab-ios/RELEASE.md`

---

## 4. 既存 7 記事の `hold` 詳細

すべて `status: "hold"`、index/sitemap/SSG から除外、direct URL アクセスも `notFound()`。データは registry に残る。

| slug | kind | priority | 元 status | hold 理由 |
|------|------|----------|-----------|-----------|
| portfolio-renewal-2026 | case-study | 90 | published | meta 記事(ポートフォリオサイト自身の話)、Filmtone/技術力アピールに寄与しない |
| mobile-safari-touch-controller | engineering-note | 91 | published | 「直近の細かい対応」、誰得 |
| journal-typography-wordmark-system | study | 92 | published | meta 記事(サイトの wordmark の話) |
| signal-stroke-relay | motion-study | 1 | published | 内部 vocabulary、外向き弱い |
| staged-emphasis-payoff | motion-study | 2 | published | 内部 vocabulary、外向き弱い |
| boiling-poster-aperture | motion-study | 3 | draft | デモなしで概念だけ、`49cad154` で先に draft 化済 |
| temporal-echo-residue | motion-study | 4 | draft | 同上 |

復帰条件(将来の wave で出す場合):
- `portfolio-renewal-2026` を出す場合は **WebGPU シェーダー実装の技術詳細** に寄せて全面書き直し(現在の編集判断ナラティブは捨てる)
- `mobile-safari-touch-controller` は単独記事ではなく、もっと大きな iOS 系記事の 1 セクションに統合
- motion-studies 4 本は wave 2 で動画 embed 込みで再評価

---

## 5. 検証済みファクト(再調査不要)

### 5.1 Filmtone コードベース構造 (CLAUDE.md §6 より)

| 領域 | 主要ファイル |
|------|--------------|
| Export pipeline | `FilmtoneExportSession.swift` 系、`MezzanineService.swift` |
| Depth | `DepthSourceService.swift`、`VideoDepthSourceService.swift`、`FilmtoneDepthMap.swift` |
| Color / Profile | `FilmtoneColorPipeline.swift`、`FilmtoneCubeParser.swift`、`SourceProbeService.swift` |
| Live Activity | `FilmtoneExportLiveActivity.swift`、`LockScreenView.swift` |
| Optics math | `FilmtoneRayAngleOptics.swift`、`FilmtoneMotionBlurMath.swift`、`FilmtonePhase0Math.swift` |
| State / Storage | `FilmtoneEditorStore.swift`、`FilmtonePersistence.swift` |
| Capacitor bridge | `FilmtoneBridgeViewController.swift`、`FilmtoneMediaPlugin.swift` |
| UI (SwiftUI) | `FilmtoneRootView.swift`、`FilmtonePreviewView.swift` |
| Generated | `FilmtonePhase0Generated.swift` ← **手動編集禁止** |

### 5.2 ビルド連鎖

```sh
# 開発時
bun run build                      # tsc --noEmit && vite build
bun run cap:sync:ios               # web → ios/App/App/public

# Filmtone コンタクト検証
bun run generate:filmtone-ios-swift
bun run --cwd apps/capacitor-film-lab-ios verify:swift-contract

# ポートフォリオ web ビルド検証
cd apps/web && bun run build
```

### 5.3 Wave 1 ビルド出力 (現状)

ビルド成功。journal 関連の SSG 出力:
- `/journal` (index、`publishedJournalEntries` 経由 → 現状空)
- `/journal/portfolio-renewal-2026` 等 3 ルート(static、`notFound()` で 404)
- `/journal/motion-studies` (index)
- `/journal/motion-studies/[slug]` (動的、`publishedMotionStudyEntries` 空 → SSG 0 件)

draft の 5 記事は journal.ts にあるが、page.tsx ファイルが未作成 + status="draft" → 公開されていない。

### 5.4 リポ構成 (journal 関連抜粋)

```text
apps/web/
  src/app/[locale]/(portfolio)/journal/
    page.tsx                                          ← index
    portfolio-renewal-2026/page.tsx                   ← hold (notFound gate あり)
    mobile-safari-touch-controller/page.tsx           ← hold (notFound gate あり)
    journal-typography-wordmark-system/page.tsx       ← hold (notFound gate あり)
    motion-studies/page.tsx                           ← motion studies index
    motion-studies/[slug]/page.tsx                    ← 動的 (status gate あり)
  src/shared/data/journal.ts                          ← registry
  src/features/journal/
    article-blocks.ts                                 ← block 型定義
    JournalArticleBody.tsx                            ← block → React
    JournalArticleHeader.tsx
    JournalIndexCard.tsx
    JournalIndexGroup.tsx
  messages/en.json                                    ← EN translations
  messages/ja.json                                    ← JA translations
```

**未作成**(次セッションで作る):
```text
apps/web/src/app/[locale]/(portfolio)/journal/
  filmtone-motion-180-shutter-baseline/page.tsx
  filmtone-dual-lut-pipeline/page.tsx
  filmtone-cross-platform-color-parity/page.tsx
  filmtone-capacitor-native-bridge/page.tsx
  filmtone-app-store-v12-shipping/page.tsx
```

---

## 6. 次セッションの推奨進め方

### 6.1 Phase A — 状況確認 (5 分以内)

```sh
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
git log --oneline -3
git status --short -- apps/web/messages/ apps/web/src/shared/data/ 'apps/web/src/app/[locale]/(portfolio)/journal/' docs/journal/
```

`git log --oneline -3` で `49cad154 refactor(journal): trim wave 1 to 5 published, gate motion-study drafts` が出てくれば前提通り。HEAD が違っていたらこのドキュメントの作成時点と差分が出ている可能性あり、まずユーザーに確認。

### 6.2 Phase B — 未コミット変更を commit (10 分)

未コミットの差分は本ハンドオフの §1.2 の通り。Filmtone 系の他作業は触らない。

```sh
git add \
  apps/web/messages/en.json \
  apps/web/messages/ja.json \
  apps/web/src/shared/data/journal.ts \
  'apps/web/src/app/[locale]/(portfolio)/journal/portfolio-renewal-2026/page.tsx' \
  'apps/web/src/app/[locale]/(portfolio)/journal/mobile-safari-touch-controller/page.tsx' \
  'apps/web/src/app/[locale]/(portfolio)/journal/journal-typography-wordmark-system/page.tsx' \
  docs/journal/journal-filmtone-technical-knowledge-wave1-handoff-2026-04-29-jst.md
```

コミットメッセージ案:

```
refactor(journal): pivot wave 1 to filmtone technical knowledge

Move all 7 existing entries to status: "hold" — they are meta-articles
about the portfolio site itself, neither showcasing Filmtone nor real
technical depth. Add five filmtone-anchored draft entries that lead with
implementation patterns, math, data models, and concrete file paths
rather than decision narratives:

- filmtone-motion-180-shutter-baseline (Motion Blur)
- filmtone-dual-lut-pipeline (Color Pipeline)
- filmtone-cross-platform-color-parity (Code Generation)
- filmtone-capacitor-native-bridge (iOS Bridge)
- filmtone-app-store-v12-shipping (Release Engineering)

Bodies (sections[]) and per-article page.tsx files come in a follow-up
commit. The three previously-static page.tsx files now gate on
status === "published" so held entries return notFound() on direct URL.

Handoff document captures the full pivot context for the next session.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### 6.3 Phase C — 5 記事の本文 `sections[]` を執筆 (60-120 分)

`apps/web/messages/{en,ja}.json` の `journal.articles.<slug>.sections` 配列に block 配列を追加する。各 block の type は次のいずれか:

```ts
type ArticleBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "callout"; tone?: "note" | "warning" | "info"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] };
```

(正確な型は `apps/web/src/features/journal/article-blocks.ts` を読んで確認)

執筆時の原則(第 3 ピボット由来):
- **判断ナラティブを書かない**: 「〇〇にした判断」「〇〇した話」「〇〇の理由」は使わない
- **コピペ可能な粒度**: 関数名・型・数式・ファイルパスを具体的に並べる
- **読者が真似できる**: 抽象論ではなく実装手順
- **EN/JA は翻訳ではなく独立した技術文書**: 同じ事実を書くが、それぞれの言語で自然に書く

各記事の本文素材は §3 の各 entry に列挙したハンドオフ docs と実装ファイル。記事 5 (fastlane) は handoff doc にほぼ完成形の素材があるので、そこから始めるのが速い。

**順序の推奨**:
1. 記事 5 (fastlane) ← 素材が最も整理されている、構造単純、warm-up 用
2. 記事 1 (motion blur) ← 数式が明確、技術詳細の見本
3. 記事 2 (dual LUT) ← LUT slider handoff doc から完全に出せる
4. 記事 4 (capacitor) ← CLAUDE.md と FilmtoneMediaPlugin.swift から
5. 記事 3 (cross-platform parity) ← 1 と 2 を書いた後、横断話として書きやすい

### 6.4 Phase D — page.tsx を 5 ファイル作成 (15 分)

既存の `portfolio-renewal-2026/page.tsx` をテンプレートに、5 ファイル作成。違いは `SLUG` 定数だけ。

**重要**: status ゲートを最初から入れる:

```ts
const entry = getJournalEntryBySlug(SLUG);
if (!entry || entry.status !== "published") notFound();
```

(ただし Phase E で status を published に切り替えるまで、route は 404 を返す)

### 6.5 Phase E — status を draft → published に切替 (5 分)

`apps/web/src/shared/data/journal.ts` の 5 entries の status を `"draft"` → `"published"` に変更。

### 6.6 Phase F — 検証 + コミット

```sh
bunx tsc --noEmit                                # 型チェック (既存の release-data.test.ts 1 件は無関係エラー)
cd apps/web && bun run build                      # SSG 出力確認 (5 記事が新規 SSG されること)
cd ../.. && bun run dev                           # ローカル目視
```

ブラウザで確認すべきこと:
- `/journal` が 5 記事のカードを表示する
- 各記事ページが正常に表示される
- EN (`/en/journal/...`) と JA (`/journal/...`) 両方が動く
- holds (旧 7 記事の URL) が 404 を返す
- sitemap.xml に 5 つの新 URL が含まれる

OK ならコミット:

```
feat(journal): publish wave 1 — five filmtone technical knowledge articles
```

---

## 7. 触ってはいけないこと(boundaries)

- **Filmtone iOS / filmtone-lp の他作業の未コミット変更**: 別セッションで進行中。 git status で確認、触らない
- **`apps/capacitor-film-lab-ios/CLAUDE.md`**: 既存。journal 作業ではコメントアウトしない
- **`packages/film-lab-renderer/src/` の TypeScript**: 記事の素材として読むだけ、編集しない
- **`apps/capacitor-film-lab-ios/ios/App/App/FilmtonePhase0Generated.swift`**: 機械生成、絶対に手書きしない
- **`docs/filmtone/*.md`**: 記事の素材として読むだけ、編集しない
- **既存 7 記事の sections[] (en.json/ja.json)**: hold の状態でも残しておく。削除しない
- **`docs/journal/` の前ハンドオフ docs**: 履歴として残す
- **`/tmp/journal-stream-{a,b,c,d}-output.md` と `/tmp/journal-synthesis-2026-04-29.md`**: 揮発性、無視してよい(参照したければあるかもしれない)

---

## 8. 重要なグローバル制約(再掲)

CLAUDE.md / .ai/GLOBAL.md より:

- **bun を使う**(npm ではなく)
- **内部処理は英語、最終出力は日本語**(ただし記事本文は EN/JA 両方独立執筆)
- **思考すべき箇所は sequential-thinking**
- **検索が必要なら gemini-search または WebSearch**(記憶ベースで断言しない)
- **並列に走らせられる調査は同時に投げる**
- **コミットはユーザーが明示的に指示するまでしない**
- **保守的な意見は優先しない、プロダクト品質を最優先**

`apps/capacitor-film-lab-ios/CLAUDE.md` より(Filmtone コンテキスト):

- **不変条件 gate**: `Profile.version=4`、Sidecar V1、`hiddenDefaults`(`depthRayAngleGamma=1.4` / `innerThreshold=0.1`)、`Info.plist` の `NSPhotoLibrary*UsageDescription` / `NSSupportsLiveActivities` / `ITSAppUsesNonExemptEncryption` は明示 gate なしに触らない
- **bridge 増設は両側同時 PR**: TS と Swift どちらかだけ更新する事故を避ける

---

## 9. 検証コマンドリファレンス

### Wave 1 entries の確認

```sh
# JA エントリ確認
python3 -c "
import json
ja = json.load(open('apps/web/messages/ja.json'))
for slug, e in ja['journal']['entries'].items():
    print(f'{slug}: {e.get(\"title\", \"\")}')
"

# registry 確認
grep -E "slug:|status:" apps/web/src/shared/data/journal.ts | head -40
```

### ビルド確認

```sh
cd apps/web && bun run build 2>&1 | grep -E "journal|motion-stud"
```

### 型チェック

```sh
cd apps/web && bunx tsc --noEmit 2>&1 | grep -v "release-data.test.ts" | head -20
```

(`release-data.test.ts` の 1 件のエラーは journal 作業と無関係、既存)

---

## 10. リファレンス

### 関連ハンドオフ

- `docs/journal/journal-curation-and-japanese-review-handoff-2026-04-29-jst.md`(初期)
- `docs/journal/journal-rewrite-rejected-and-restart-handoff-2026-04-29-jst.md`(リライト却下後)
- **本ドキュメント**: Filmtone 駆動 + 技術ナレッジ志向への全面ピボット

### 補助 docs

- `docs/journal/curation-rationale.md`(前セッションのキュレーション根拠 — 古い前提に基づく、参考程度)
- `docs/journal/wave-2-backlog.md`(wave 2+ 候補)
- `docs/journal/ja-writing-style.md`(前セッションの style guide — 第 3 ピボットで上書きされた、参考程度)

### Filmtone 素材

- `docs/filmtone/filmtone-motion-180-baseline-industry-handoff-2026-04-29-jst.md`(motion blur ハンドオフ完全版)
- `docs/filmtone/ios/filmtone-ios-lut-intensity-slider-handoff-2026-04-29-jst.md`(dual LUT 完全版)
- `docs/filmtone/ios/filmtone-ios-v12-release-to-aso-handoff-2026-04-29-jst.md`(リリース工程完全版)
- `apps/capacitor-film-lab-ios/CLAUDE.md`(Filmtone iOS 全体ガイド)
- `apps/capacitor-film-lab-ios/RELEASE.md`(リリース手順詳細)

---

## 11. 最高精度を出せる引き継ぎ詳細プロンプト(コピペ用)

> 以下を新規チャットの最初のメッセージにそのまま貼り付けてください。

---

**[ここから次チャット用プロンプト]**

```
# Portfolio Journal Wave 1 — Filmtone 技術ナレッジ記事の本文執筆

## 前提

リポジトリ: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
Branch: main

完全な背景・経緯・現状ファイル・5 記事の仕様・本文素材は次のハンドオフに整理
されている。最初に必ず Read すること:

  docs/journal/journal-filmtone-technical-knowledge-wave1-handoff-2026-04-29-jst.md

このハンドオフは前ハンドオフ群(同じ docs/journal/ 配下の 2 件)の続きで、
以下を含む:

- このセッションで起きた 3 度のピボットの完全経緯
- 新 Wave 1 の 5 記事の slug / kind / priority / tags / eyebrow / title /
  summary / metaDescription (EN+JA 両方)
- 既存 7 記事の hold 状態の理由
- 触ってはいけないファイルの境界
- 検証コマンド一式
- 5 記事それぞれの本文素材ファイル (handoff docs + 実装ファイル) の指定

## このセッションでやること

ハンドオフ §6 の Phase A〜F を順に実行する:

A. 状況確認 (git log -3 / git status で現状確認)
B. 未コミットの差分を 1 commit にまとめる(コミットメッセージ案あり)
C. 5 記事の本文 sections[] を EN+JA 両方執筆
   (apps/web/messages/{en,ja}.json の journal.articles.<slug>.sections に追加)
D. 5 ファイルの page.tsx を作成
   (既存の portfolio-renewal-2026/page.tsx をテンプレに、SLUG 定数だけ変更)
E. registry の status を draft → published に切替
F. tsc / build / dev で検証してコミット

## 守ってほしいこと(第 3 ピボット由来、最重要)

- **判断ナラティブを書かない**: 「〇〇にした判断」「〇〇した話」「〇〇した
  理由」「〇〇という選択」のようなナラティブ form は禁止
- **技術詳細・ナレッジを書く**: 関数名・型・数式・ファイルパス・バージョン
  番号・コマンドを具体的に並べる
- **コピペで真似できる粒度**: 抽象論ではなく実装手順
- **EN/JA は翻訳ではない**: 同じ事実を書くが、それぞれの言語で自然な
  technical writing として独立執筆する

## 守ってほしいこと(運用)

- 思考が必要な箇所は sequential-thinking で考える
- わからない実装事実は **コードを読んで確認** する(記憶ベースで断言しない)
  - Filmtone コードは apps/capacitor-film-lab-ios/ 以下
  - 共有数学は packages/film-lab-renderer/src/ 以下
- 検索が必要なら gemini-search または WebSearch
- 並列に走らせられる調査は同時に投げる
- 内部処理は英語、最終出力は日本語(記事本文は EN/JA 両方独立)
- パッケージマネージャは bun
- コミットはユーザーが明示的に指示するまでしない
- 保守的な意見を優先しない、プロダクト品質を最優先

## 触らないもの(再掲、ハンドオフ §7 参照)

- Filmtone iOS / filmtone-lp の他作業の未コミット変更
- packages/film-lab-renderer/src/ の TypeScript(読むだけ、編集しない)
- apps/capacitor-film-lab-ios/ios/App/App/FilmtonePhase0Generated.swift(機械生成、絶対手書きしない)
- 既存 7 記事の sections[] (hold だが残しておく)

## 5 記事の slug と本文素材(再掲、ハンドオフ §3 参照)

1. filmtone-motion-180-shutter-baseline (Motion Blur, case-study)
   素材: docs/filmtone/filmtone-motion-180-baseline-industry-handoff-2026-04-29-jst.md
   実装: packages/film-lab-renderer/src/motionBlurMath.ts 系
        apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMotionBlurMath.swift

2. filmtone-dual-lut-pipeline (Color Pipeline, case-study)
   素材: docs/filmtone/ios/filmtone-ios-lut-intensity-slider-handoff-2026-04-29-jst.md
   実装: apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMediaTypes.swift
        FilmtoneCubeParser.swift / FilmtonePhase0Math.swift /
        FilmtoneExportSession.swift / FilmtoneEditorStore.swift / FilmtoneRootView.swift

3. filmtone-cross-platform-color-parity (Code Generation, engineering-note)
   素材: apps/capacitor-film-lab-ios/CLAUDE.md §3-4
   実装: packages/film-lab-renderer/src/ + apps/capacitor-film-lab-ios/ios/App/App/FilmtonePhase0Generated.swift +
        apps/capacitor-film-lab-ios/scripts/swift/

4. filmtone-capacitor-native-bridge (iOS Bridge, engineering-note)
   素材: apps/capacitor-film-lab-ios/CLAUDE.md §7
   実装: apps/capacitor-film-lab-ios/ios/App/App/FilmtoneMediaPlugin.swift
        FilmtoneMediaTypes.swift / FilmtoneMediaRuntime.swift +
        apps/capacitor-film-lab-ios/src/native/filmtoneMedia.ts

5. filmtone-app-store-v12-shipping (Release Engineering, case-study)
   素材: docs/filmtone/ios/filmtone-ios-v12-release-to-aso-handoff-2026-04-29-jst.md
   実装: apps/capacitor-film-lab-ios/fastlane/Fastfile
        Deliverfile / metadata/ / RELEASE.md

## 推奨執筆順序(warm-up から)

1. 記事 5 (fastlane)   ← 素材最整理、構造単純
2. 記事 1 (motion blur) ← 数式明確、技術詳細の見本
3. 記事 2 (dual LUT)
4. 記事 4 (capacitor)
5. 記事 3 (cross-platform parity)  ← 1 と 2 を書いた後の横断話

## 期待する成果

- 5 記事 × 本文(EN+JA) = 10 sections[] 配列
- 5 ファイル × page.tsx = 5 ルートファイル
- registry status 切替コミット 1 件
- 全 5 記事が /journal に正常表示、EN/JA 両方で動く

開始してください。最初は git log と git status で現状確認、その次にハンドオフを Read。
```

**[ここまで次チャット用プロンプト]**

---

## 12. このハンドオフを書いた根拠(再現性)

```sh
# 現状確認
git log --oneline -5
git status --short -- apps/web/messages/ apps/web/src/shared/data/ 'apps/web/src/app/[locale]/(portfolio)/journal/' docs/journal/

# 5 entries の確認
python3 -c "
import json
for lang in ['en', 'ja']:
    d = json.load(open(f'apps/web/messages/{lang}.json'))
    print(f'\\n=== {lang} ===')
    for slug in [
        'filmtone-motion-180-shutter-baseline',
        'filmtone-dual-lut-pipeline',
        'filmtone-cross-platform-color-parity',
        'filmtone-capacitor-native-bridge',
        'filmtone-app-store-v12-shipping',
    ]:
        e = d['journal']['entries'].get(slug, {})
        print(f'{slug}: {e.get(\"title\", \"MISSING\")[:80]}')
"

# registry 確認
grep -E "slug:|status:|priority:" apps/web/src/shared/data/journal.ts
```

このドキュメントは時間で陳腐化する。次セッションは必ず最初に `git log -3` と `git status` で現状を取り直すこと。
