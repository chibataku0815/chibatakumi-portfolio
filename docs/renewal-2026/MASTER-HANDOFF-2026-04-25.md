# Renewal 2026 — Master Handoff Document

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 (JST) |
| 目的 | 別 chat への完全引き継ぎ。本書 1 つで全 context 復元可能 |
| 親計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md` |
| 対象 repo | `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` |
| 連動 repo | `/Volumes/SamsungPortableSSDX5001/documents/life/` |
| 現 branch | `feat/renewal-2026-phase2-motion-dot` |
| 現 HEAD | `7e16c224 feat(renewal-2026): Phase 1 motion-core + vendored webgpu-motion-libs submodule` |
| working tree | dirty / 未 commit / 未 push |
| 全体進捗 | §7 全 36 D{N}.{n} のうち landed 14 ≈ **39%** |

---

## 0. 本書の使い方

### 0.1 新 chat 開始時の必須手順

renewal 関連 chat を新規開始する場合、以下を順守:

1. 本書を **冒頭から末尾まで通読**（特に §0-§3 / §9 / §10）
2. 親計画 `life/.claude/plans/portfolio-renewal-2026-04.md` を読む（§0 Scope Lock / §7 D{N}.{n} / §8.5 Anti-Drift / §15 Postmortem 必須）
3. `docs/renewal-2026/stream-status/{1,2,3,4,5}.md` 全 5 件を読む
4. 自分の chat の作業範囲を §7 D{N}.{n} のどれに対応するか宣言
5. handoff doc を新規作成する場合、§8.5 の必須 4 セクションを満たすこと

### 0.2 本書の構成

| § | 内容 |
|---|---|
| 1 | プロジェクト identity、user の 5 つの顔、哲学 |
| 2 | リニューアルの核心目的（"ブランド貯水池"） |
| 3 | 確定方針 4 件（user approve 済み）|
| 4 | 期待効果（4 階層） |
| 5 | 新 IA 設計（site map / navigation / migration map）|
| 6 | 技術アーキテクチャ（motion-core / submodule / audio / no-fallback）|
| 7 | Streams 全 5 + D{N}.{n} 全 36 deliverables |
| 8 | 現在の実装実状況（commit / branch / working tree）|
| 9 | 2026-04-25 Scope Drift 事件 |
| 10 | Anti-Drift Discipline（再発防止メカニズム）|
| 11 | 重要ファイルパス完全列挙 |
| 12 | 関連 memory / pattern |
| 13 | Open Questions（未解決判断）|
| 14 | Stream 別 Kickoff prompt 雛形 |
| 15 | 次 chat 投入 prompt |

---

## 1. プロジェクト identity

### 1.1 Owner

- **GitHub**: chibataku0815
- **Email**: chiba@fores-tone.co.jp
- **Repo path**: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`

### 1.2 5 つの顔（user identity の核）

life repo CLAUDE.md より引用:

1. **フルスタックエンジニア** — システム設計、自動化、Claude Code アーキテクト
2. **クリエイティブディレクター** — Moving Postcard 哲学、映像制作、ブランド設計
3. **コマーシャルフォトグラファー** — イベント撮影、クライアントワーク
4. **マーケティング戦略家** — SNS 広告、プロダクト設計、グロース
5. **バイリンガルコミュニケーター** — 英語 DM、note / YouTube 発信

これらは「並列に複数」ではなく、**craft という単一軸の異なる断面** として renewal で統合される。

### 1.3 核心哲学

> 「表ではフィルムの美を見せ、裏では AI とコードで効率化する」（life CLAUDE.md）

Moving Postcard 哲学を **サイトレベルに昇華** する。サイト = 静的な作品集ではなく、**閲覧行為自体が design / code / sense の demonstration になる living artifact**。

### 1.4 関連 production

- **Filmtone Desktop**: WebGPU カラーグレーディングアプリ (現 v1.0.3、独立ドメイン化予定)
- **Filmtone iOS**: LUT-based film color (v1.1.1、ASC submit 済)
- **Filmtone Signature Pack**: 厳選 LUT 製品
- **3 motion artworks**: dot-new-webgpu / grid-guided-webgpu / flowline-webgpu
- **portfolio**: 現行 Next.js 16 + WebGL（renewal 対象）

---

## 2. リニューアルの核心目的

### 2.1 単なる外装更新ではない

現行 portfolio は Filmtone を中心とする feature tree で肥大化。`/profile` `/skills` `/works` `/interactive` `/installation` `/photography` `/motion` が並列に並び、5 つの顔が「多芸な人」として読まれる。

renewal の目的は外装更新ではなく **identity 再アラインメント**:

### 2.2 "ブランド貯水池" 化

> Filmtone は来るし去る。次の product も来て去る。**portfolio だけが残る。**

Refik Anadol Studio と同じ構造。studio site は不変、個々の product / exhibition は出入りする。portfolio が earned attention の貯水池になり、未来の全ての product / case study / 実験が、そこから給水を受けて立ち上がる。

Filmtone は最終的に独立ドメイン化するため、portfolio は Filmtone がいなくても identity 無傷で立つ設計が必須。

### 2.3 「サイト = 作品体験」化

- URL を踏んだ瞬間に既に scene が始まっている
- スクロール / 遷移 / hover が dot/grid/flow 語彙で統一
- 音響を ON にした瞬間、視覚と音が同期して visitor が participant になる
- 3 motion 作品の独立ギャラリーで full-screen 体験

---

## 3. 確定方針（user approve 済み 4 件）

2026-04-25 に AskUserQuestion で確定:

### 3.1 Audience: クリエイティブ仲間 / 同業界

- 商業 lead-gen 動線は **portfolio から排除**（別ドメイン LP に分離）
- statement piece モード、craft の濃度で殴る
- case study はあるが裏に置く

### 3.2 Filmtone: 1 作品として包含 → 最終独立ドメイン化

- portfolio renewal 完了時点では `/works/filmtone/*` 配下にホスト
- **将来別ドメイン化**するため、case study ページは Filmtone product と疎結合に作る（dynamic data 非依存）
- portfolio は Filmtone がいなくても identity 無傷で立つ

### 3.3 Motion 3 作品: ambient 背景常駐 ＋ 独立ギャラリー（dual）

- サイト全体に persistent `<MotionCanvas>` layer
- `/experiments/{dot,grid,flow}` で full-screen 独立ギャラリー
- route 切替で scene parameters が滑らかに blend（flowline 0.5s scene blend pattern を流用）

### 3.4 Audio: opt-in core ＋ Experimental の hybrid

- デフォルト silent
- Sound icon 全ページ右下 fixed → ON で site-wide audio reactive
- `/experiments/*` 内で **mic input** opt-in（experimental zone）
- iOS Safari gesture-gate 厳守

### 3.5 Posture: 最大クリエイティブ・WebGPU first・fallback なし

user 指示原文:
> 保守的な意見は優先せずにプロダクトの品質を最優先

- WebGPU 非対応ブラウザには明示的 unsupported screen（fallback 描画なし、`feedback_no_fallback_bug_hotbed.md` 厳守）
- Lighthouse スコアは劣化容認、craft 完成度を優先
- 軽量 first paint より体験完了率を優先
- 商業 lead-gen 動線は別ドメイン LP に分離

---

## 4. 期待効果（4 階層）

### 4.1 直接効果（来訪者体験）

- URL を踏んだ瞬間に既に scene が始まっており、「これは普通のポートフォリオではない」と 1 秒で伝わる
- スクロール・遷移・hover が dot/grid/flow 語彙で統一、サイト全体が単一作品として知覚される
- 音響 ON で参加者になる
- 3 motion 作品の独立ギャラリー full-screen 体験

### 4.2 位置づけ効果（外部認知）

- 「写真もやるエンジニア」「コードも書くフォトグラファー」のラベリングから脱出
- 5 つの顔が「多芸」ではなく「単一の craft の異なる断面」として読まれる
- WebGPU + audio reactive personal site は production grade では世界的に希少
- awwwards / Are.na / read.cv / X 上の creative-tech 圏で自然に流通する artifact 化
- 「WebGPU で interactive 作れますか？」→ URL で殴れる

### 4.3 戦略効果（下流）

- **コラボ磁石化**: 案件依頼ではなく「一緒に何か作りませんか」が来る
- **登壇・寄稿・取材依頼**: 30 秒で credentials として機能
- **価格交渉力**: premium pricing の正当化コストゼロ
- **Filmtone 独立移行が損失なく実行可能**: portfolio が Filmtone に依存していない
- **Publishing channel 化**: 今後の WebGPU 実験は portfolio に publish するだけで露出
- **Self-filtering recruiting**: 語彙が一致しない人は離脱、初期コミュニケーション摩擦が減る

### 4.4 意図的トレードオフ（敢えて捨てるもの）

| 捨てるもの | 理由 |
|---|---|
| 商業 lead-gen | audience が peers なので front door に置くと craft signature が薄まる。商業案件は別ドメイン LP |
| 軽量・高速 first paint | 「体験を完了するか離脱するか」の二択 |
| 広い browser 互換 | WebGPU 非対応 = 静的代替なし、明示アナウンス |
| 多言語の同等扱い | 段階リリース、craft 一貫性が first |
| identity の柔軟性 | craft signature 定着で pivot コスト上昇は受け入れる |

---

## 5. 新 IA 設計（plan §4-§6）

### 5.1 Site Map（plan §4.1）

```
/
├── /[locale]                        # ja | en
│   ├── /                            # Hero — ambient WebGPU scene が常駐
│   ├── /works
│   │   ├── /filmtone               # Filmtone case study（旧 /film-lab/* を集約）
│   │   ├── /photography
│   │   ├── /commercial
│   │   └── /installation
│   ├── /experiments                # gallery
│   │   ├── /dot
│   │   ├── /grid
│   │   └── /flow
│   ├── /craft                      # 5 faces 統合（旧 /skills 進化）
│   ├── /journal                    # 思考・実験ログ（旧 /archive 進化）
│   ├── /about                      # bio（旧 /profile）
│   └── /contact
├── /api
│   ├── /waitlist                   # 汎用化
│   └── /donation/...               # 維持
└── /og/...                         # 維持
```

### 5.2 Navigation Model（plan §4.3）

- **Header**: グローバル minimal nav（Home / Works / Experiments / Craft / About）
- **Sub-nav**: 各セクション内 side rail（drawer 不使用）
- **Page transitions**: motion vocabulary で実装（dot drift / grid morph / flow handoff）
- **Background canvas**: **全ページに persistent `<MotionCanvas>` layer**、route 切替で scene blend

### 5.3 Motion 統合点（plan §4.4）

| Surface | 採用 motion | 強度 |
|---|---|---|
| Home Hero | dot-new Scene 1 idle 化 | 高 |
| Home スクロール | dot-new Scene 2 river ambient | 中 |
| Works 一覧 grid | grid-guided block layout | 中 |
| Works → 作品ページ遷移 | flowline scene blend | 中 |
| /experiments/dot | dot-new full + 17 scene + 2.5D composite | 最大 |
| /experiments/grid | grid-guided full + 入力 enable | 最大 |
| /experiments/flow | flowline full + auto cycle 7 scenes | 最大 |
| /craft | 5 faces それぞれに dot pattern variation | 中 |
| /about | 静止 dot grid + subtle drift | 低 |
| /contact | 純静的 | なし |

### 5.4 Migration Map（plan §6.1 — 18 path 全列挙）

| 旧 | 新 | 動作 |
|---|---|---|
| `/[locale]/film-lab` | `/[locale]/works/filmtone` | 301 + 内容再構成 |
| `/[locale]/film-lab/privacy` | `/[locale]/works/filmtone/privacy` | 301 |
| `/[locale]/film-lab/signature` | `/[locale]/works/filmtone/signature` | 301 |
| `/[locale]/film-lab/roadmap` | `/[locale]/works/filmtone/roadmap` | 301 |
| `/[locale]/film-lab/release-notes` | `/[locale]/works/filmtone/release-notes` | 301 |
| `/[locale]/film-lab/support` | `/[locale]/works/filmtone/support` | 301 |
| `/[locale]/film-lab/download` | `/[locale]/works/filmtone/download` | 301 |
| `/[locale]/film-lab/og` | `/[locale]/works/filmtone/og` | 301 |
| `/[locale]/photography` | `/[locale]/works/photography` | 301 |
| `/[locale]/interactive` | `/[locale]/works`（解体）| 301 to /works |
| `/[locale]/installation` | `/[locale]/works/installation` | 301 |
| `/[locale]/motion/reference-works/*` | `/[locale]/journal/motion-studies/*` | 301 |
| `/[locale]/motion` | `/[locale]/experiments` | 301 + 中身を 3 lab に再構成 |
| `/[locale]/skills` | `/[locale]/craft` | 301 + 内容再構成 |
| `/[locale]/profile` | `/[locale]/about` | 301 |
| `/[locale]/archive` | `/[locale]/journal` | 301 |
| `/[locale]/works` | `/[locale]/works`（再構築）| 同 URL |
| `/[locale]/contact` | `/[locale]/contact` | 同 URL、簡素化 |

### 5.5 API Migration（plan §6.2）

- `/api/film-lab/waitlist` → `/api/waitlist`（汎用化）+ alias 維持
- `/api/film-lab/donation/*` → そのまま維持（Filmtone 独立ドメイン化まで）
- `/api/film-lab/ai/smart-look` → 独立ドメイン化と同時に Filmtone repo へ移行候補

---

## 6. 技術アーキテクチャ（plan §5）

### 6.1 Stack

| 層 | 採用 |
|---|---|
| Framework | Next.js 16.0.7 (App Router) |
| Package Manager | Bun 1.3.3 |
| TypeScript | 5.x strict |
| Styling | Tailwind 4 + Radix Colors |
| 3D / Graphics | WebGPU 統一（Three.js / Pixi / r3f は legacy として残置）|
| Audio | WebAudio API + AudioBus（webgpu-motion-audio）|
| Test | Playwright e2e + Bun unit |
| Deploy | Vercel |

### 6.2 Motion Core Library（plan §5.1）

```
chibatakumi-portfolio/
├── packages/
│   ├── motion-core/                # MotionParticipant API
│   │   ├── src/{shell,audio,post,art}/  # webgpu-motion-* re-export
│   │   ├── src/participant/             # MotionParticipant<T>, MotionStage, AudioState
│   │   └── src/stage/                   # createMotionStage, RAF loop, blend orchestration
│   ├── motion-dot/                 # motion-dot-new-webgpu wrapper
│   ├── motion-grid/                # motion-grid-guided-webgpu wrapper
│   ├── motion-flow/                # motion-flowline-webgpu wrapper
│   ├── design-system/              # Tailwind plugin + tokens + primitives
│   └── film-lab-{core,renderer,ui,smart-look}/  # 既存
├── vendor/
│   └── webgpu-motion-libs/         # submodule (11 packages)
└── apps/web/
    └── src/features/motion/         # MotionStageProvider, MotionUnsupported, useExperimentParticipant
```

### 6.3 Submodule 戦略

**確定**: Plan A — Subtree split + 独立 repo + submodule

- 独立 repo: `https://github.com/chibataku0815/webgpu-motion-libs` (private)
- 11 packages: webgpu-motion-{art, audio, dom, input, post, scene, shell, ui} + gpu-{fx-presets, 2.5d-presets, film-post}
- subtree split で履歴保持（55 commits、HEAD `e498a44`）
- portfolio 側: `vendor/webgpu-motion-libs/` 配下、`workspaces` に `vendor/webgpu-motion-libs/packages/*` 追加
- life 側は今後別途切替（破壊的変更を避けるため Stream 1 完了の依存ではない）

### 6.4 MotionParticipant API（plan §5.1）

```typescript
type MotionParticipant<TParams extends string = string> = {
  readonly name: string;
  readonly fps: number;
  readonly audioWiring: AudioWiring<TParams> | null;
  init(device: GPUDevice, format: GPUTextureFormat): Promise<void>;
  update(dt: number, audioState: AudioState, scene: SceneSnapshot): void;
  render(ctx: ParticipantFrameContext): void;
  blendTo(other: MotionParticipant<string>, t: number): void;
  dispose(): void;
};

type AudioState = {
  readonly analyser: AnalyserNode | null;
  readonly bands: AudioBands;          // bass / mid / treble / presence
  readonly onsets: OnsetBands;
  readonly intensity: number;          // 0-1, slow envelope
};
```

設計方針:
- **No-fallback**: init 前に lifecycle method 呼出は throw（silent no-op 禁止）
- subpath-only barrel: `motion-core/{shell,audio,post,art,participant,stage}` 各 subpath からのみ import（Next.js SSR boundary clean、tree-shaking 有効）
- offscreen rgba16float per-name texture allocation
- 単一 GPU device + 単一 AudioBus + 単一 RAF loop (45 FPS fixed)

### 6.5 Audio Architecture（plan §5.3）

```
┌─ GlobalAudioController (singleton) ─┐
│  - AudioBus (single instance)       │
│  - source: file | mic | silent      │
│  - mute toggle                      │
│  - persists in localStorage         │
└──────────┬──────────────────────────┘
           │
           ↓ shared analyser data
┌─ Active MotionParticipant ──────────┐
│  - subscribes to AudioBus            │
│  - resolveInto(deltaBuffer, ...)     │
│  - applies to scene/film params      │
└──────────────────────────────────────┘
```

- デフォルト silent
- Sound icon 全ページ右下 fixed
- ON 時: 通常 page = 内蔵 BGM、`/experiments/*` = 作品付属 audio.mp3 or mic input
- iOS Safari: gesture-gate 厳守

### 6.6 SSR / Hydration / 非対応ブラウザ（plan §5.4）

- Canvas は **client-only**: `'use client'` boundary を `<MotionCanvas>` で明確化
- WebGPU 検出: `navigator.gpu?.requestAdapter()` を mount 直後、失敗時は明示的 unsupported screen
- Lighthouse スコア劣化容認

### 6.7 Visual Language Tokens（plan §5.6）

motion-dot-new 基調:

| Token | 値 |
|---|---|
| BG primary (light) | `#D2D2D2` |
| BG secondary (light) | `#E8EAED` |
| Foreground primary | `#1A1A1A` |
| Foreground secondary | `#202124` |
| Accent (light) | `#FFFFFF` |
| Grid unit | hexagonal 7/6/7、サイズ 5/9/15 |
| Motion grammar | easeOutQuint / smootherstep / springScaleSimple |
| Film canon | FILM_STOCK_CANON（webgpu-motion-art） |
| Typography | Geist Sans + Noto Sans JP（現行継承） |

**重要決定**: dark mode 一辺倒だった現行を **light mode default** に変更（dot-new が light 基調のため）。dark mode は alternate として保持。

---

## 7. Streams 全 5 + D{N}.{n} 全 36 deliverables

詳細は plan §7 + `docs/renewal-2026/stream-status/{1-5}.md` 参照。本書ではサマリのみ。

### 7.1 Stream 1: Motion Core Library — 🟡 D1.6 残

| ID | Deliverable | 状態 |
|---|---|---|
| D1.1 | `packages/motion-core` 新設 | ✅ commit `7e16c224` |
| D1.2 | webgpu-motion-* 8 packages 取り込み | ✅ submodule |
| D1.3 | gpu-* 3 packages 取り込み | ✅ submodule |
| D1.4 | MotionParticipant API + 型定義 | ✅ |
| D1.5 | motion-grid / motion-flow skeleton 化 | ✅ |
| D1.6 | webgpu-motion-libs 側 typing fix | ⏳ |

### 7.2 Stream 2: motion-dot-new-webgpu Package 化 — 🟡 D2.7 残

| ID | Deliverable | 状態 |
|---|---|---|
| D2.1 | source vendor (9 subdir) | ✅ working tree |
| D2.2 | package.json deps 6 件配線 | ✅ |
| D2.3 | createDotScene REAL factory | ✅ |
| D2.4 | DotScene 統一 adapter | ✅ |
| D2.5 | createDotParticipant scaffold | ✅ |
| D2.6 | kinetic-handoff + composite-25d + fluid-scene re-export | ✅ |
| D2.7 | portfolio shell 経由 demo route 動作 | ⏳ Stream 4 D4.7 と統合 |

### 7.3 Stream 3: Visual Language Design System — 🔴 NOT STARTED

| ID | Deliverable | 状態 |
|---|---|---|
| D3.1 | Tailwind 4 plugin で palette tokens | ⏳ |
| D3.2 | Typography scale 移管 | ⏳ |
| D3.3 | Light mode default 化 + dark alt | ⏳ |
| D3.4 | Component primitives 4 種 (Logo / Wordmark / SoundToggle / NavRail) | ⏳ |
| D3.5 | Storybook 導入 | ⏳ |
| D3.6 | `Logo.tsx` を design-system Logo に置換 | ⏳ |

### 7.4 Stream 4: Portfolio Shell Renewal — 🟡 6/15 landed、9 open

| ID | Deliverable | 状態 |
|---|---|---|
| D4.1 | MotionStage core | ✅ working tree |
| D4.2 | next.config.ts transpilePackages 16 packages | ✅ |
| D4.3 | apps/web workspace deps 4 件 | ✅ |
| D4.4 | features/motion/ boundary | ✅ |
| D4.5 | `/experiments/{dot,grid,flow}` 3 route | ✅ |
| D4.6 | motion-{dot,grid,flow} Phase A wiring | ✅ |
| **D4.7** | **persistent canvas を root layout に移動** | ⏳ |
| **D4.8** | **Home Hero 全面書き換え** | ⏳ |
| **D4.9** | **新 IA routes 7 個実装** (works/* 4 + craft + about + journal) | ⏳ |
| **D4.10** | **旧 routes 解体** (interactive/skills delete + 6 rename/relocate) | ⏳ |
| **D4.11** | **Redirect map 18 path 配線** | ⏳ |
| **D4.12** | Page transition orchestrator | ⏳ |
| D4.13 | next-intl 既存継承 | ⏳ |
| D4.14 | e2e tests | ⏳ |
| D4.15 | preview deploy 検証 | ⏳ |

### 7.5 Stream 5: Filmtone Subsumption + Audio Integration — 🔴 NOT STARTED

| ID | Deliverable | 状態 |
|---|---|---|
| D5.1 | `/works/filmtone/*` 内容再構成 (8 sub-route) | ⏳ |
| D5.2 | API ルート整理 | ⏳ |
| D5.3 | GlobalAudioController 実装 | ⏳ |
| D5.4 | Sound icon UI 全ページ右下 fixed | ⏳ |
| D5.5 | mic input opt-in `/experiments/*` | ⏳ |
| D5.6 | Filmtone case study dynamic data 非依存化 | ⏳ |
| D5.7 | Filmtone redirect SEO 維持 | ⏳ |

### 7.6 Stream 間依存

- Stream 2 ← Stream 1（motion-core API 確定後）
- Stream 4 D4.7-D4.9 ← Stream 2（dot scene を root canvas で動作）
- Stream 4 D4.7-D4.10 ← Stream 3 並走可能、Component primitives は D4 終盤で必要
- Stream 5 D5.1 ← Stream 4 D4.9（`/works/*` 構造確定）
- Stream 5 D5.4 ← Stream 4 D4.7（root layout MotionCanvas）+ Stream 3 D3.4（SoundToggle primitive）

---

## 8. 現在の実装実状況

### 8.1 Branch / Commit

- branch: `feat/renewal-2026-phase2-motion-dot`
- HEAD: `7e16c224 feat(renewal-2026): Phase 1 motion-core + vendored webgpu-motion-libs submodule`
- 未 commit changes: 多数（下記 §8.2 参照）
- 未 push

### 8.2 Working Tree State

```
M apps/web/next.config.ts                    # transpilePackages 16 packages 拡張
M apps/web/package.json                       # workspace deps 4 件追加
M bun.lock
M packages/motion-core/package.json
M packages/motion-core/src/participant/index.ts   # MotionParticipant API 改訂 (init signature etc.)
M packages/motion-core/tsconfig.json          # @webgpu/types 追加
M packages/motion-dot/README.md               # 17+ scene catalog + Canvas2D archive policy
M packages/motion-dot/package.json
M packages/motion-dot/src/index.ts            # createDotScene REAL factory + createDotParticipant
M packages/motion-flow/package.json
M packages/motion-flow/src/index.ts
M packages/motion-flow/src/participant.ts     # Phase A wiring
M packages/motion-flow/tsconfig.json
M packages/motion-grid/package.json
M packages/motion-grid/src/index.ts
M packages/motion-grid/src/participant.ts     # Phase A wiring
M packages/motion-grid/tsconfig.json
m vendor/webgpu-motion-libs                    # submodule pointer

?? apps/web/src/app/[locale]/experiments/
?? apps/web/src/features/motion/
?? docs/renewal-2026/                         # 計画書 + handoff doc 群
?? packages/motion-core/src/stage/             # MotionStage core
?? packages/motion-dot/src/{animation,audio,compute,input,render,scene,shaders,transition,ui}/
?? packages/motion-dot/src/wgsl.d.ts
?? packages/motion-dot/tsconfig.json
?? packages/motion-flow/src/{audio,compute,render,scene,text}/
?? packages/motion-flow/src/wgsl.d.ts
?? packages/motion-grid/src/{audio,render,scene}/
?? packages/motion-grid/src/wgsl.d.ts
?? packages/design-system/                    # skeleton
```

### 8.3 既存 routes（未解体、Stream 4 D4.10 で処理）

```
apps/web/src/app/[locale]/{
  archive,           # → /journal
  contact,           # 維持
  film-lab/*,        # → /works/filmtone/*
  installation,      # → /works/installation
  interactive,       # delete
  motion,            # → /experiments + /journal/motion-studies
  page.tsx,          # Home (旧 HomeHero、Stream 4 D4.8 で書換)
  photography,       # → /works/photography
  profile,           # → /about
  skills,            # delete (→ /craft)
  works              # 再構築
}
```

### 8.4 全体進捗

§7 全 36 D{N}.{n} のうち landed = **14 / 36 ≈ 39%**

| Stream | landed / total |
|---|---|
| 1 | 5 / 6 |
| 2 | 6 / 7 |
| 3 | 0 / 6 |
| 4 | 6 / 15 |
| 5 | 0 / 7 |

---

## 9. 2026-04-25 Scope Drift 事件

### 9.1 何が起こったか

2026-04-25 の Phase 1 〜 Stream 4 実行 chat 群（4 chat）において:

| chat | landed | 落とした deliverable |
|---|---|---|
| Stream 1 chat | motion-core API + submodule | — |
| Stream 2 chat | motion-dot package 化 + createDotScene | demo route 検証は Stream 4 へ forward（OK）|
| Stream 4 chat（前段） | MotionStage + transpilePackages + `/experiments/*` 3 route | **D4.7-D4.15 の 9 deliverable**（root layout / Home Hero / 新 IA route / 旧 route 解体 / redirect map / page transition / e2e）|
| Stream 4-B chat | motion-{grid,flow} Phase A | **Stream 3 / Stream 5 を §3 残タスクから完全に除外** |

結果: Phase 3 の意味が「Stream 4 の MotionStage 配線部分のみ」に縮退、Stream 3 / Stream 5 は kickoff handoff doc すら作成されない無自覚後送り状態。

### 9.2 Root cause（構造的原因）

**Failure mode 1**: handoff §3 が「次 chat の即着手 task」になっていた
- 「plan §7 全 D{N}.{n} の未充足項目」ではなく、書き手が直近で見えている motion package 関連 task のみを記録
- site-wide deliverables（root layout / redirect / Sound icon / Filmtone migration / Design System）は視野から外れた

**Failure mode 2**: plan §7 の Stream 定義が prose bullet で D{N}.{n} 化されていなかった
- 「Stream 4: 新 IA route 実装 + persistent canvas + redirect map + ...」が 1 段落で並んでおり、`/experiments/*` だけ landed した chat が「Stream 4 完了」と誤認できた

**Failure mode 3**: Cross-Stream visibility が必須化されていなかった
- handoff doc に「全 5 Stream の current status」を書く義務がなく、Stream 3 / Stream 5 の存在が完全に視界から消えていた

### 9.3 検出経緯

user が「最小単位段階進行か、それとも scope drift か」を問い、handoff doc 群を grep で検証:

- 全 4 handoff doc § 3 残タスクに site-wide deliverables 記載 0 件
- Stream 3 / Stream 5 用 handoff doc 不在

→ drift 確定

### 9.4 復元（plan rev で組み込み）

| 改修 | 場所 |
|---|---|
| Scope Lock 宣言 | plan §0 |
| Drift state 実態記録 | plan §3.4 |
| Stream 完了判定基準 | plan §7.0 |
| §7 D{N}.{n} checklist 化（5 Stream × 計 36 deliverable）| plan §7.1-7.5 |
| Anti-Drift Discipline | plan §8.5 |
| Risks に Scope drift 再発 High 追加 | plan §9 |
| §11.1 を D{N}.{n} 対応 + 状態列付き | plan §11.1 |
| stream-status/{1-5}.md SSoT 制定 | docs/renewal-2026/stream-status/ |
| Postmortem | plan §15 |

---

## 10. Anti-Drift Discipline（再発防止メカニズム）

### 10.1 §0 Scope Lock 5 ルール

1. **§0.1**: 「全面リニューアル」 = §4-§6 全要求 + §7 全 5 Streams 完了。一部 landed を「完了」と称することは禁止
2. **§0.2**: Stream 完了 = §7 D{N}.{n} 全 closed。chat handoff doc は完了判定権限を持たない
3. **§0.3**: De-scope は user 明示 approve 必須。chat 独断は禁止
4. **§0.4**: 新 chat 開始時の必須手順 — plan §7 + stream-status 5 件読み込み + 担当範囲宣言
5. **§0.5**: Drift detection 過去事故記録 → §15 Postmortem 参照

### 10.2 §7.0 Stream 完了判定の唯一基準

各 D{N}.{n} は 3 要素を満たす:
- ✅ landed: 実装が working tree に入った
- ✅ verified: typecheck / e2e / 手動 walkthrough のいずれかで動作確認済
- ✅ recorded: stream-status/{N}.md に commit ref + 確認手順が記録された

部分実装で landed item を `[x]` にすることは禁止。

### 10.3 §8.5 handoff doc 必須 4 セクション

handoff doc が以下を満たさない場合は **invalid**（Stream 完了 declare 不可）:

1. **Plan Compliance Audit**: §7 D{N}.{n} checklist 完全コピー + 各項目状態
2. **Cross-Stream Visibility**: 全 5 Stream の current status summary
3. **Scope Diff Table**: 要求 (plan §) vs 本 chat landed の差分
4. **§3 残タスク**: (a) 自 Stream の D{N}.{n} 未充足項目 full enumeration + (b) 他 Stream の進捗 / blocker + (c) 直近の次 task

### 10.4 SSoT System

`docs/renewal-2026/stream-status/{1-5}.md` が **chat 横断の正本**。

- handoff doc は session 単位の補助記録
- Stream 完了判定の正本は stream-status/{N}.md
- 相違が生じた場合は stream-status/{N}.md が優先

### 10.5 Self-Enforcement

これらの rule は self-enforcing:

- handoff doc が必須 4 セクションを満たさない → invalid 化、Stream 完了 declare 権限消失
- 新 chat 開始時の §0.4 必須手順を skip → Stream 完了 declare 権限消失
- de-scope を user approve なしで実行 → §15 Postmortem に追記、復元される

---

## 11. 重要ファイルパス完全列挙

### 11.1 Plan / 親ドキュメント

```
/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/
└── portfolio-renewal-2026-04.md     # 親計画（正本）

/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/
├── README.md                                      # docs ディレクトリ index
├── MASTER-HANDOFF-2026-04-25.md                   # 本書
├── stream-status/                                 # SSoT
│   ├── README.md
│   ├── 1.md   # Stream 1 status
│   ├── 2.md
│   ├── 3.md
│   ├── 4.md
│   └── 5.md
└── archive/wave1-2/                               # Wave 1/2 完了済 chat handoff
    ├── stream-1-motion-core-handoff.md            # chat handoff (起点)
    ├── stream-1-completion-handoff.md             # chat handoff (完了)
    ├── stream-2-motion-dot-handoff.md
    ├── stream-2-completion-handoff.md
    ├── stream-4-completion-handoff.md
    ├── stream-4b-grid-flow-completion-handoff.md
    ├── stream-4d-gallery-mode-handoff.md          # 4-D Gallery mode (新規追加分、内容未確認)
    ├── stream-wave1-completion-handoff.md
    └── stream-wave2-completion-handoff.md
```

### 11.2 Portfolio repo（変更対象）

| Path | 役割 | §7 対応 D | 状態 |
|---|---|---|---|
| `apps/web/src/app/[locale]/layout.tsx` | persistent `<MotionCanvas>` を root に統合 | D4.7 | [ ] |
| `apps/web/src/app/[locale]/page.tsx` | Home Hero 全面書き換え | D4.8 | [ ] |
| `apps/web/src/app/[locale]/works/{filmtone,photography,commercial,installation}/` | 新 route 作成 | D4.9, D5.1 | [ ] |
| `apps/web/src/app/[locale]/{craft,about,journal}/` | 新 route 作成 | D4.9 | [ ] |
| `apps/web/src/app/[locale]/film-lab/**` | `/works/filmtone/**` へ移動 | D4.10, D5.1 | [ ] |
| `apps/web/src/app/[locale]/{interactive,skills,profile,archive,installation,motion,photography}/` | 新 IA に移行 / 削除 / リネーム | D4.10 | [ ] |
| `apps/web/src/app/[locale]/experiments/{dot,grid,flow}/` | 既存維持 | D4.5 | [x] |
| `apps/web/src/app/[locale]/experiments/layout.tsx` | D4.7 完了時に MotionStageProvider を root へ移して撤去 | D4.7 | [x]→[撤去] |
| `apps/web/middleware.ts` または `next.config.ts` | redirect map 18 path | D4.11 | [ ] |
| `apps/web/next.config.ts` | transpilePackages 拡張 | D4.2 | [x] |
| `apps/web/tailwind.config.ts` | dot-new palette tokens 統合 | D3.1 | [ ] |
| `apps/web/src/app/globals.css` | typography clamp logic 移管 | D3.2 | [ ] |
| `apps/web/src/components/Logo.tsx` | dot vocabulary で再描画 (design-system Logo に置換) | D3.6 | [ ] |
| `apps/web/src/features/audio/` | GlobalAudioController + Sound icon UI | D5.3, D5.4 | [ ] |
| `apps/web/src/features/motion/` | MotionStageProvider 等 | D4.4 | [x] |
| `apps/web/package.json` | workspace deps + design-system + audio | D4.3, D3.x | [x] motion 4 件のみ |
| `packages/motion-core/` | Motion Core | D1.1-1.4 | [x] |
| `packages/motion-dot/` | motion-dot package | D2.1-2.6 | [x] |
| `packages/motion-grid/` | grid-guided package | D1.5, D4.6 | [x] |
| `packages/motion-flow/` | flowline package | D1.5, D4.6 | [x] |
| `packages/design-system/` | tokens / Storybook / Component primitives | D3.1-3.5 | [x] skeleton のみ |
| `vendor/webgpu-motion-libs/` | submodule | D1.2, D1.3 | [x] |
| `docs/renewal-2026/stream-status/{1-5}.md` | Stream Status SSoT | §7.0 | [x] |

### 11.3 Life repo（参照のみ、再利用ソース）

```
/Volumes/SamsungPortableSSDX5001/documents/life/

# 参照ソース
output/motion-dot-new-webgpu/src/      # Stream 2 vendor 元（既に portfolio に取り込み）
output/motion-dot-new/src/             # Canvas2D legacy、journal archive 用
output/motion-grid-guided-webgpu/src/  # Stream 4-B-grid vendor 元
output/motion-flowline-webgpu/src/     # Stream 4-B-flow vendor 元

# webgpu-motion-* 8 packages（既に独立 repo 化、life 側からは直接参照不要）
packages/webgpu-motion-{art,audio,dom,input,post,scene,shell,ui}/

# gpu-* 3 packages（同上、独立 repo 化済）
packages/gpu-{fx-presets,2.5d-presets,film-post}/
（output/ 配下にも一部存在）

# 計画書
.claude/plans/portfolio-renewal-2026-04.md   # 親計画

# global skills / agents
.claude/agents/, .claude/skills/, .claude/knowledge/patterns/
```

### 11.4 webgpu-motion-libs 独立 repo

```
https://github.com/chibataku0815/webgpu-motion-libs (private)
HEAD: e498a44 (subtree split で 55 commits、履歴保持)

packages/
├── webgpu-motion-art
├── webgpu-motion-audio
├── webgpu-motion-dom
├── webgpu-motion-input
├── webgpu-motion-post
├── webgpu-motion-scene
├── webgpu-motion-shell
├── webgpu-motion-ui
├── gpu-fx-presets
├── gpu-2.5d-presets
└── gpu-film-post
```

local mirror: `~/code/webgpu-motion-libs/`

---

## 12. 関連 memory / pattern

### 12.1 Feedback memories（renewal で厳守）

| memory | 適用 |
|---|---|
| `feedback_no_fallback_bug_hotbed.md` | WebGPU 非対応に fallback を作らない、明示的 unsupported screen のみ |
| `feedback_film_mode_default_on.md` | film post を default ON（FILM_STOCK_CANON 全 surface） |
| `feedback_push_limits_to_visual_feasibility.md` | 視覚 feasibility 限界まで攻める |
| `feedback_design_quality_priority.md` | 深澤 / Rams 水準の craft、技術と同等に優先 |
| `feedback_minimize_decision_cost.md` | 承認後はまとめて landed（commit + push） |
| `feedback_review_release_blockers_deep_pass.md` | Agent Teams merge 後に独立 deep pass |
| `feedback_density_vs_meaning.md` | 密度より統一感・クラフト品質を優先 |
| `feedback_always_compare_reference.md` | 出力と参考を並べて差分確認、AI 動画分析を鵜呑みにしない |
| `feedback_webgpu_writebuffer_per_layer.md` | 同一バッファへの複数 writeBuffer は最後の値で上書き |
| `feedback_no_cosmetic_additions.md` | 効果が曖昧な装飾を「とりあえず追加」しない |

### 12.2 Patterns（再利用可能な手順）

| pattern | 内容 |
|---|---|
| `chrome_mcp_react_managed_input_pattern.md` | Chrome MCP × React controlled input（preview deploy 検証時に使用可能） |
| `macos26_electron_adhoc_hardened_runtime_fix.md` | macOS 26 ad-hoc Electron 起動修正 |
| `filmtone_webgpu_migration_motivation.md` | Filmtone WebGPU 移行動機（色品質 + 架構共通化、性能改善ではない） |

### 12.3 Global rules（必読）

- `~/.claude/CLAUDE.md`: 言語ルール（内部処理英語、最終出力日本語）、bun 使用、検索ルール（gemini-search 優先）
- `/Volumes/SamsungPortableSSDX5001/documents/life/CLAUDE.md`: life repo workflow、Agent Teams 運用、5 つの顔

---

## 13. Open Questions（未解決判断）

plan §12 から:

1. **Filmtone 独立ドメイン**は portfolio renewal 完了の前か後か？
   - 推奨: 後。renewal で `/works/filmtone` 安定後に独立化
2. **Light mode default 化** で Filmtone 既存 UI（dark glass tokens）と衝突する箇所の処理
   - Stream 3 D3.3 で確定が必要
3. **Sound icon の常設位置**: 右下 fixed か、nav rail 内か
   - 推奨: 右下 fixed（Stream 3 D3.4 で確定）
4. **`/journal` を作るか保留か**: bilingual communicator 顔の発信物統合 or 外部 link 集約
5. **写真ギャラリーの優先度**: 商業案件は別ドメイン LP 化方針なので `/works/photography` にどこまで案件を載せるか
6. **Custom 音楽**: 内蔵 BGM を新規作曲 or 既存音源（royalty-free or 自作）から選定

これらは Stream 着手時に user 確認を取る。

---

## 14. Stream 別 Kickoff prompt 雛形

### 14.1 Stream 1 残作業（D1.6 typing fix）

```
webgpu-motion-libs 側の typing fix を実施:
1. tsconfig.json に @webgpu/types 追加
2. vite-env.d.ts に *.wgsl?raw module declaration 追加
3. webgpu-motion-libs commit + push
4. portfolio submodule pointer 更新

参照: stream-status/1.md D1.6
```

### 14.2 Stream 2 残作業（D2.7 demo route 検証）

Stream 4 D4.7 完了と統合実施。単独着手不要。

### 14.3 Stream 3 kickoff（NOT STARTED）

```
Stream 3 (Visual Language Design System) を起動。

事前読み込み（必須）:
- 親計画: life/.claude/plans/portfolio-renewal-2026-04.md §0 / §5.6 / §7.3 / §8.5 / §15
- 本書 (master-handoff)
- stream-status/3.md
- 全 5 stream-status

最初のタスク:
1. docs/renewal-2026/stream-3-design-system-kickoff-handoff.md 新規作成
   - 必須セクション: Plan Compliance Audit / Cross-Stream Visibility / Scope Diff / 残タスク full
2. plan §12 Open Question 2 (Light mode 衝突) を user 確認
3. 既存 Filmtone dark glass tokens の grep で範囲確定
4. D3.1 Tailwind 4 plugin から着手

Stream 3 D{N}.{n} 全 6 deliverable 達成が完了条件（plan §7.3）。
handoff doc は §8.5 必須 4 セクションを満たすこと。
```

### 14.4 Stream 4 残作業（D4.7-D4.15 復元）

```
Stream 4 の de-scoped 9 deliverable を復元実施。

事前読み込み（必須）:
- 親計画 §0 / §4 / §6 / §7.4 / §8.5 / §15
- 本書 (master-handoff)
- stream-status/4.md
- archive/wave1-2/stream-4-completion-handoff.md（前段）
- archive/wave1-2/stream-4b-grid-flow-completion-handoff.md（前段）

優先度（依存順）:
1. D4.7 root layout に persistent <MotionCanvas> 移動 (Stream 5 D5.4 の前提)
2. D4.8 Home Hero 全面書き換え
3. D4.9 新 IA routes 7 個作成 (Stream 5 D5.1 の前提)
4. D4.10 旧 routes 解体 (Stream 5 D5.1 と協調)
5. D4.11 Redirect map 18 path 配線
6. D4.12 Page transition orchestrator
7. D4.13 next-intl 動作確認
8. D4.14 e2e tests
9. D4.15 preview deploy

Agent Teams 推奨分割:
- 4-A2: D4.7 + D4.8 (root layout + Home Hero)
- 4-A3: D4.9 + D4.10 (新 IA + 旧解体)
- 4-A4: D4.11 + D4.12 (redirect + transition)
- 4-A5: D4.13 + D4.14 + D4.15 (verification)

Stream 4 D{N}.{n} 全 15 deliverable 達成が完了条件（plan §7.4）。
```

### 14.5 Stream 5 kickoff（NOT STARTED）

```
Stream 5 (Filmtone Subsumption + Audio Integration) を起動。

事前読み込み（必須）:
- 親計画 §0 / §4 / §5.3 / §6 / §7.5 / §8.5 / §15
- 本書 (master-handoff)
- stream-status/5.md
- 全 5 stream-status

依存条件確認:
- Stream 4 D4.7 (root layout MotionCanvas) ← D5.4 の前提
- Stream 4 D4.9 (`/works/*` 構造) ← D5.1 の前提
- Stream 3 D3.4 (SoundToggle primitive) ← D5.4 の前提

最初のタスク:
1. docs/renewal-2026/stream-5-filmtone-audio-kickoff-handoff.md 新規作成
2. 上記依存の current status を Cross-Stream Visibility に書き出し
3. 並列着手可能な D5 から開始:
   - D5.3 GlobalAudioController（Stream 4/3 不要）
   - D5.6 Filmtone case study dynamic data 非依存化（Stream 4 D4.9 と並走）
   - D5.7 Filmtone redirect SEO 整備（Stream 4 D4.11 完了後）

Stream 5 D{N}.{n} 全 7 deliverable 達成が完了条件（plan §7.5）。
```

---

## 15. 次 chat 投入 prompt（コピペ用）

### 15.1 推奨投入 prompt

```
chibatakumi-portfolio renewal 2026 を継続。

事前必須読み込み（順序厳守）:
1. /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/MASTER-HANDOFF-2026-04-25.md (本書)
2. /Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md
3. docs/renewal-2026/stream-status/{1,2,3,4,5}.md 全 5 件

確認事項:
- 現状 Stream 1: 🟡 D1.6 残 / Stream 2: 🟡 D2.7 残 / Stream 3: 🔴 NOT STARTED / Stream 4: 🟡 6/15 / Stream 5: 🔴 NOT STARTED
- 全体 39%、scope drift 復元中
- branch: feat/renewal-2026-phase2-motion-dot、未 commit

実行タスク:
[ここに具体的な指示を記載 — 例: "Stream 4 D4.7 root layout integration を実施" / "Stream 3 kickoff" / "全 untracked + modified を単一 commit にまとめて push" など]

遵守事項（plan §0 / §8.5）:
- handoff doc 作成時は必須 4 セクション (Plan Compliance Audit / Cross-Stream Visibility / Scope Diff Table / §3 残タスク full enumeration) を満たすこと
- Stream 完了 declare は §7 D{N}.{n} 全 closed のみ
- de-scope は user 明示 approve なしには不可
- stream-status/{N}.md を最新化
```

### 15.2 commit + push 用 prompt

```
chibatakumi-portfolio renewal の現 working tree を commit + push。

事前確認:
- branch: feat/renewal-2026-phase2-motion-dot
- working tree: 多数 modified + untracked
- 内容: Stream 2 (motion-dot package 化) + Stream 4-A/4-B/4-C (MotionStage + transpilePackages + experiments routes + Phase A wiring) + 計画書改修 (scope drift 復元) + stream-status/ SSoT 整備

handoff doc 群 (新規追加):
- docs/renewal-2026/MASTER-HANDOFF-2026-04-25.md
- docs/renewal-2026/stream-status/{README,1,2,3,4,5}.md
- docs/renewal-2026/README.md (更新)

life repo 側の変更:
- .claude/plans/portfolio-renewal-2026-04.md (scope drift 復元改修)

タスク:
1. 内容を logical な単一 / 複数 commit に分割
2. portfolio repo に push (origin feat/renewal-2026-phase2-motion-dot)
3. life repo の plan 修正も別 commit で push
4. stream-status/{1,2}.md に commit ref を追記
```

---

## 16. 補足 — 本書の rev 履歴

| rev | 日時 | 内容 |
|---|---|---|
| 1.0 | 2026-04-25 | 初版作成。scope drift 復元後の master handoff として、別 chat への完全引き継ぎを目的に整備 |

本書は MEMORY.md / handoff doc / plan のうち、**新 chat が plan 着手前に必要な全 context を 1 ファイルで提供**することを目的とする。本書を読まずに renewal 関連 chat を開始することは plan §0.4 違反。
