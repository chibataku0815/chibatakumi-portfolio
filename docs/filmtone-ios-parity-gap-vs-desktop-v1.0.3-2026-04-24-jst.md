# Filmtone iOS — Desktop v1.0.3 候補に対する未対応項目まとめ

- 日付: 2026-04-24 JST
- Desktop 基準: `desktop-v1.0.2..HEAD`（29 commits 候補 = v1.0.3）
- iOS 基準: `apps/capacitor-film-lab-ios` 現行 HEAD（v1.0 Waiting for Review + main に v1.1 相当 4 commits push 済）
- 用途: iOS v1.1 スコープ決定、v1.0 公開前の「しない」リスト確定、UI 側の透明性改善優先度判定

## 0. 結論サマリ

Desktop で新たに入った 9 領域のうち、iOS は **3 完全未対応 / 3 partial / 3 ほぼ同等**。逆に iOS が先行している領域が 1 つある（compare slider）。

| 優先度 | 領域 | iOS 状態 | v1.1 で入れる？ |
|-------|-----|---------|----------------|
| **P0** | HDR ソース検知 + 警告 | ✗ 完全欠落 | ⬤ 入れるべき（silent degrade 回避） |
| **P0** | Export sidecar JSON | ✗ 完全欠落 | ⬤ 入れるべき（再編集可能性の担保） |
| **P1** | Camera optics を renderer に配線 | ✗ intake 止まり | ⬤ Phase0 Math 拡張で可能 |
| **P1** | ソース動画メタデータ（color/rotation/FPS trust） | ✗ 欠落 | ⬤ AVAsset から取れる |
| **P2** | Cross Filter depth-aware | ✗ flat | ○ shader 拡張必要 |
| **P2** | Bloom/Halation/Diffusion depth coupling | ✗ flat | ○ shader 拡張必要 |
| **P2** | Camera optics の UI label 表示 | ✗ 無表示 | ⬤ 軽い改修で可 |
| **P3** | Progressive loading Quality badge | ✗ 無 | △ 設計次第 |
| **P3** | Export 形式多様化（PNG / MOV 等） | ✗ MP4/JPEG 固定 | △ ユーザー要望次第 |
| — | Preset catalog 網羅性 | ✓ 同等（但し contract defaults 硬直） | — |
| — | Default Neutral + soft finish | ✓ 同等（実装パターンは異なる） | — |
| — | Compare slider | **iOS 先行**（Desktop 未対応） | — |

## 1. P0 — iOS v1.1 で入れるべき（silent degradation を防ぐ観点）

### 1.1 HDR ソース検知 + 警告が丸ごと無い

- **Desktop が持つもの**
  - ffprobe で colorTransfer / colorPrimaries / mastering display metadata を取得
  - `colorClass` を `sdr-bt709 / hdr-pq / hdr-hlg / wide-gamut-unknown / unknown` に分類
  - `HdrPolicyNotice.tsx` で PQ / HLG を読んだ際に琥珀色 callout（タイトル+本文+install command copy）
  - `hdrPreparationPolicy.strategy/reason` を sidecar に保存
- **iOS の現状**
  - `SourceProbeService.swift` は **寸法 / 尺 / 公称 framerate / AVAssetTrack FOV のみ**。color space / transfer / primaries / mastering は一切読まない
  - `FilmtoneExportSession.swift` には HDR 分岐が **無い**
  - UI に HDR 警告コンポーネントが **無い**
- **ユーザー影響**: PQ / HLG 撮影を iOS で読むと **何の警告も無くそのまま SDR ライクに書き出される**。ダイナミックレンジが消えたことに気付かない
- **v1.1 で必要な変更**
  - `CMFormatDescription` / `AVAssetTrack.mediaSubType` から transfer characteristics と color primaries を読む
  - `SourceProbeDTO` に `colorClass` 相当を追加
  - iOS 側は ffmpeg に依存しないので「警告を出すだけ」で OK（install CTA は不要、代わりに "この素材の HDR→SDR 変換は現在非対応" 旨のメッセージ）

### 1.2 Export sidecar JSON が書き出されない

- **Desktop が持つもの**
  - `<output>.filmtone-session.json` に preset / grade / camera optics / source metadata / HDR policy / app version を格納
  - 再インポートで grade が完全復元可能
- **iOS の現状**
  - `FilmtoneExportSession.swift` は Photos library に動画/画像を保存するだけで **sidecar を一切書かない**
  - どの preset でどう grade したかの履歴が残らない
- **ユーザー影響**: 書き出した iPhone 素材を Desktop に持ってきても「再編集の出発点」を復元できない。制作フローとしての往復が片方向
- **v1.1 で必要な変更**
  - iOS 側で同 schema の JSON を Photos asset の隣に置くか、`FileManager` の Documents 配下に副産物として保存
  - AirDrop / Files.app 経由で Desktop に渡せる経路を用意
  - Desktop 側の import fallback（`export-metadata-session.ts:55-60`）が既に preset 無しに対応しているので、互換はとりやすい

## 2. P1 — 光学コンテキスト整合性

### 2.1 Camera optics は取れているが renderer に渡っていない

- **Desktop が持つもの**
  - ffprobe で make / model / lens / focal / HFOV を取得
  - `resolveRayAngleOptics()` が fovXDeg / fovYDeg を shader uniform に渡す
  - フォールバックは 65° HFOV（`RAY_ANGLE_FALLBACK_HFOV_DEG`）
- **iOS の現状**
  - `SourceProbeService.swift:146-177` が `CMFormatDescriptionExtension_HorizontalFieldOfView` と `AVAsset.metadata` から **camera optics を取得はしている**
  - しかし Phase0 Params 構造体に `fovXDeg / fovYDeg / rayAngleGamma / rayAngleInnerThreshold` が **一切無い**（`FilmtonePhase0Math.swift` の paramKeys）
  - 取得した FOV は DTO に入るだけで **shader に届かない**
- **ユーザー影響**: 24mm で撮った広角素材も望遠素材も「iOS 上では同じ 65° 決め打ち」で描画される。フレーム端の光学的挙動が現実と合わない
- **v1.1 で必要な変更**
  - Phase0 Params に ray-angle 系キーを追加
  - Metal shader 側で `tanHalfFov` 相当の uniform を受け取って角度マスクを計算

### 2.2 ソース動画メタデータ（color / rotation / fps 信頼度）

- **Desktop が持つもの**
  - `display.rotationDeg` / `display.source`（side-data / tags / raw）
  - `color.colorRange / colorSpace / colorTransfer / colorPrimaries`
  - `timing.sourceFrameRateTrusted` + `trustReason`
- **iOS の現状**
  - `AVAssetTrack.preferredTransform` は読めるが **Phase0 export 側で rotation を適用できているか未検証**（Metal でピクセルフォーマット次第）
  - color / transfer / primaries は全欠落
  - VFR 検知も無い（公称 framerate を素通し）
- **ユーザー影響**: 縦撮り素材で preview 向きは合っても export で意図通りにならない個体が出る可能性。VFR クリップで音ずれ / 尺ずれが起き得る
- **v1.1 で必要な変更**
  - `AVAssetTrack.formatDescriptions` から ColorAttachments を読み込む
  - AVAsset の nominal vs actual frame count 比較で trust を導出

## 3. P2 — 光学的仕上がりの機微

### 3.1 Cross Filter が depth-aware でない

- **Desktop が持つもの**
  - `cross-filter-streak.frag.wgsl.ts` に `sourceWeight()` があり、depth + ray-angle + edge gain で streak の長さ/強度を連続変調
  - hidden contract defaults: `crossFilterDepthGain / AngleGain / AngleGamma / AngleInnerThreshold / EdgeLengthGain / EdgeStrengthGain`
- **iOS の現状**
  - `FilmtonePhase0Math.swift` の paramKeys にこれら **6 キーが全て無い**
  - iOS の Metal shader は基本 cross streak（輝度閾値だけ）で平坦
- **ユーザー影響**: 近景の強い点光源が背景より主張しない。cinematic heavy な夜景で Desktop と iOS の見た目が乖離
- **v1.1 実装コスト**: 中（contract defaults を iOS 側でも保持する必要、depth texture を Phase0 に配管する必要）

### 3.2 Bloom / Halation / Diffusion の depth coupling

- **Desktop が持つもの**: `bloom-depth-prefilter / halation-depth-prefilter / diffusion-depth-prefilter` 3 本の shader
- **iOS の現状**: depth 係数キーが **全欠落**（`depthMistGain / depthGlowGain / depthMistRayAngleGain / depthBloomRayAngleGain / depthHalationRayAngleGain / depthMistFieldPsfGain ...`）
- **ユーザー影響**: 全 depth plane が等しく glow に寄与。被写界的な表情が出ない
- **v1.1 実装コスト**: 大（3 shader pass + depth map の iOS 側パイプライン整備）

### 3.3 Camera optics が UI に出ない（取れているのに）

- **Desktop**: ソース情報行に `Sony A7R4 · Sony FE 35mm f/1.4 · 35.0mm eq · HFOV 65.0deg · metadata` を 1 行表示
- **iOS**: `SourceProbeDTO` まで取っているのに UI で **どこにも出ない**
- **ユーザー影響**: 「この素材の光学情報が拾えたかどうか」がユーザーに分からない。透明性の欠如
- **v1.1 実装コスト**: 小（Swift UI の一行ラベル追加）

## 4. P3 — あると嬉しい

### 4.1 Progressive loading / Quality badge

- **Desktop**: `use-progressive-load.ts` + `QualityBadge.tsx` で FHD / 4K / Converting / Enhancing を UI 表示
- **iOS**: 段階的ロード設計そのものが無い。単純な進捗バーのみ
- **ユーザー影響**: 編集中の preview 解像度が不透明
- **v1.1 実装コスト**: 中（mezzanine を preview の裏で走らせる設計まで必要）

### 4.2 Export 形式の多様化

- **Desktop**: Image PNG / JPEG、Video MP4 / MOV / M4V。session isolation + abort/retry
- **iOS**: Image JPEG 固定、Video MP4 固定、1 本ずつ、abort UI 無し
- **ユーザー影響**: アーカイブ目的で PNG が欲しい / ProRes 系パイプライン非対応 / Batch 不可
- **v1.1 実装コスト**: 中〜大（AVAssetWriter の codec 分岐 + UI）

## 5. 逆方向の差（Desktop が未対応）

### 5.1 Compare slider preview（iOS 先行）

- commit `e789dd1c feat(ios): add compare preview frame controls`
- **iOS**: before/after をスライダーで連続比較可能
- **Desktop**: `compareViewportSync.ts` はあるが A/B トグルのみでスクラブ不可
- **次のリリースで**: Desktop 側に逆輸入するか、iOS 独自の強みとしてマーケ訴求するかの判断

## 6. 同等なのでケア不要（但し保守性に注意）

### 6.1 Default Neutral + soft finish

- Desktop: `createFilmtoneDefaultParams() = reset + FILMTONE_SOFT_FINISH_PATCH` の合成
- iOS: `FilmtonePhase0Generated.swift:62-92` で soft finish 値を直書き
- **見た目は一致**。但し iOS は patch + base の合成ではなく「最終値直書き」のため、contract defaults が将来変わると iOS 側は手動再生成が必要

### 6.2 Preset catalog（9 Film Stock + Utility + Look）

- Desktop / iOS 両方で 11 プリセット揃う
- **但し** depth/angle/edge gains など **hidden contract defaults は iOS 側で定数埋め込み**。Desktop で gain を調整しても iOS には自動反映されない。regenerate script が要る

## 7. v1.1 提案スコープ（整理）

以下を束で iOS v1.1 に載せると「silent degradation 防止 + 光学整合性」という一貫した物語になる:

1. **HDR 検知と警告**（§1.1）— "この素材は HDR です。現在の iOS ビルドでは SDR トーンマップ非対応のため、DR が保たれない可能性があります" の 1 行
2. **Export sidecar JSON**（§1.2）— Desktop と同じ schema で Files.app / AirDrop 対応
3. **Camera optics の renderer 配線**（§2.1）— Phase0 Params 拡張 + Metal shader `tanHalfFov` uniform
4. **Camera optics の UI 表示**（§3.3）— 取れた値を 1 行で可視化
5. **ソース動画メタデータ拡張**（§2.2）— color attachments + rotation 適用検証 + fps trust

§3.1 / §3.2（depth coupling 系）は shader 規模が大きいので v1.2 へ分離、§4 は要望次第。

## Appendix A — Desktop 側 reference 実装マップ

| 領域 | Desktop 実装 |
|-----|-------------|
| Default soft finish | `packages/film-lab-core/src/presets.ts:652-668` |
| Cross filter depth-aware | `packages/film-lab-renderer/src/webgpu/shaders/cross-filter-streak.frag.wgsl.ts` |
| Ray-angle optics | `packages/film-lab-renderer/src/webgpu/rayAngleOptics.ts` |
| Depth prefilters | `.../shaders/{bloom,halation,diffusion}-depth-prefilter.frag.wgsl.ts` |
| Camera optics intake | `apps/desktop-film-lab-batch/electron/video-export-camera-optics.ts` |
| Source video metadata | `apps/desktop-film-lab-batch/electron/video-export-source-metadata.ts` |
| HDR policy notice | `apps/desktop-film-lab-batch/src/renderer/HdrPolicyNotice.tsx` (+ `messages/ja.json`) |
| Sidecar writer | `apps/desktop-film-lab-batch/src/renderer/export-metadata-session.ts` |
| Progressive load | `apps/desktop-film-lab-batch/src/renderer/use-progressive-load.ts` + `QualityBadge.tsx` |

## Appendix B — iOS 側現行ファイル

| 領域 | iOS 実装 |
|-----|---------|
| Preset catalog | `apps/capacitor-film-lab-ios/ios/App/App/FilmtonePresetCatalog.swift` |
| Phase0 params & math | `apps/capacitor-film-lab-ios/ios/App/App/FilmtonePhase0Generated.swift`, `FilmtonePhase0Math.swift` |
| Source probe | `apps/capacitor-film-lab-ios/ios/App/App/SourceProbeService.swift` |
| Export session | `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneExportSession.swift` |
| Mezzanine cache | `apps/capacitor-film-lab-ios/ios/App/App/MezzanineService.swift` |
| Snapshot support | `apps/capacitor-film-lab-ios/ios/App/App/FilmtoneSnapshotSupport.swift` |

## Appendix C — 追加確認が必要な未解決ポイント

- iOS の `AVAssetTrack.preferredTransform` が **実 export で正しく適用されるか** が未検証（§2.2）。縦撮りで rotation が壊れる個体があれば v1.0 公開を止めるべきかも
- iOS の Mezzanine service は **preview 側では動くが export では unused** — Desktop と同じ状況。どこかで wire するか、or 消すかの判断が要る（次回 release で整理）
