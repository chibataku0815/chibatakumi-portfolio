# Renewal 2026 — Release Audit Handoff (2026-04-28 JST)

> 次の chat で **`feat/renewal-2026-phase2-motion-dot` を main にマージしてリリース可能か**を精査するための完全引き継ぎドキュメント。
>
> 本ドキュメント単体で別 chat に投入すれば、過去の経緯を遡らずに監査開始できるよう、**ブランチの全体像・直近改修の詳細・未検証領域・ロールバック手順**を自己完結で記載する。
>
> ユーザは「リリースして問題ないか精査したい」と明示しており、本ドキュメントの目的は **release blocker の発見と解消**。

---

## 0. 30 秒で読む（最優先サマリ）

- **ブランチ**: `feat/renewal-2026-phase2-motion-dot` （origin から **32 commit ahead**、未 push）
- **base**: `main` （origin/main = `852b61da`）
- **HEAD**: `9030a567 feat(motion-dot): stack status pill below dock at bottom-right`
- **scale**: 41 commit / 253 files / +28,246 / -3,551 LOC
- **本日(2026-04-27)の chat で確定した最終 5 commit**:
  1. `b3d75f04` Hero h1 を Jost-800 italic SVG bake に置換、glass panel 撤去
  2. `6d973d49` Hero eyebrow を mono → sans medium tracking 0.18em、role 文言修正
  3. `64bd241a` `body::after` の film-grain wash を撤去
  4. `f8b8e206` Hero readability を `focus(0.42)` → `immersive(1.0)` に切替（motion-dot 純度回復）
  5. `5cfd56f4` /journal editorial typography（font-mono 全廃 + Jost upright + 完全モノクローム）
  6. `9030a567` motion-dot HUD pill を bottom-right に縦スタック移設
- **検証済み**: dev server (`bun run dev`) 上で /journal を Chrome MCP で目視確認、TS 型チェック clean（既存無関係エラー除く）
- **未検証**: production build / 全ルート巡回 / Lighthouse / mobile / e2e / dark identity ルート（Filmtone, Photography）
- **release blocker 候補**: §7 / §8 を要熟読

---

## 1. リニューアルのコア構造（前提）

### 1.1 アーキテクチャの 3 層

| 層 | 実体 | 役割 | 備考 |
|---|---|---|---|
| **Substrate** | `packages/motion-dot` の WebGPU canvas | サイト全体の kinetic 背景 (`#D2D2D2` light) | bgColor `[0.82,0.82,0.82,1.0]` ハードコード、light 前提 |
| **Editorial** | Next.js App Router pages | テキスト・写真・compose | substrate 上に乗る読み物層 |
| **Liquid Glass chrome** | `apps/web/src/features/liquid-glass/*` | Nav chip / panel の WebGPU 屈折材 | front-overlay canvas が motion-dot の texture をサンプル |

### 1.2 substrate (light) の制約

- **`#D2D2D2`** が単一 substrate（Wave 4-3、commit `2ca243fd` で確定）
- **dark identity 保持例外**: Filmtone (`.dark` scope) と Photography (`body:has(.photography-page)`) のみ
- **dual-mode 廃止済**: `data-theme` 属性は portfolio 側から消滅（commit `290a51f1`）
- **詳細**: `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md`

### 1.3 readability shader pipeline

motion-dot canvas は section ごとに `data-readability` 属性で dim する shader uniform を持つ:

| value | uniform 値 | 用途 |
|---|---|---|
| `immersive` | 1.0 | Hero / 全画面 motion 体験 |
| `focus` | 0.42 | タイトル領域、軽く dim |
| `reading` | 0.20 | 本文領域、強く dim |

**重要原則**: 視認性向上のために CSS scrim (`::before` blur tint 等) を **使ってはならない**。必ず `data-readability` shader uniform を tune する。理由:

- CSS scrim は section 境界が見えてしまい editorial 的に破綻
- 過去に scrim を入れて一度 revert している（`05d603ab` → `67599652`）
- 詳細: `.claude/knowledge/patterns/data-readability-shader-pipeline.md`

### 1.4 routes / 4 つの identity

```
/                      home (light, ambient hero)
/works                 portfolio works (light)
/journal               editorial spread (light)  ← 本日 chat で typography 改修
/journal/motion-studies/{slug}  4 motion studies (light)
/contact               contact form (light)

/experiments/dot       motion-dot lab (light)
/experiments/grid      motion-grid lab (light)
/experiments/flow      motion-flow lab (light)
/experiments/wordmark  typography R&D (light, /experiments tier)

/filmtone              Filmtone product page (DARK identity ←例外)
/photography/...       photography portfolio (DARK identity ←例外)
```

---

## 2. ブランチ全体の commit 年代記

41 commit を 6 wave に整理（時系列、新しい順は §0 を参照）:

### Wave 0 — 基盤（2026-04-25）
- `7e16c224` Phase 1 motion-core + vendored webgpu-motion-libs submodule
- `281a4d0a` Phase A motion-{dot,grid,flow} landed (build verified)
- `df1bbbac` Wave 1 — motion shell + IA + design system + audio infra
- `c0761910` Wave 2 finalize — Filmtone migration, audio wire-up, design system finish
- `d5702367` motion-dot 全体移植 from motion-dot-new-webgpu
- `42a15541` motion-dot ブートデフォルト復元（HUD / keyboard / audio panel always live）

### Wave 1 — Liquid Glass（2026-04-26〜27）
- `66d3f0ec` Package 12 — glass Nav rail + transparent experiments index
- `8b1ed8df` portfolio reset surfaces
- `2e68873d` Nav active state — section-level startsWith match
- `cf810667` satellite isolation via Next.js route groups
- `dc18f2c6` Filmtone canonical-path public assets restore
- `5c5a215f` Radix dark palette on data-theme=dark surfaces
- `e02b6305` JSX comment parse error fix
- `57b8b99f` **Apple Liquid Glass nav — WebGPU front-layer chrome**
- `a7c5fe43` liquid glass nav content layering 修正
- `eb4df565` **Phase B Liquid Glass HUD redesign — 4-surface dock**

### Wave 2 — Readability（2026-04-27）
- `8ae9a63a` foundation tokens for text readability
- `916a483a` readability dim plumbing + EditorialSection + scene damping
- `9c38bf7f` EditorialSection glass uses rail kind
- `8d0e2c1f` /contact form を EditorialSection で wrap
- `e05aa2de` /journal hero + list を readability wrap
- `07cede78` home hero を EditorialSection で wrap
- `ce4f3ccf` /experiments hero readability attr

### Wave 3 — /journal editorial spread（2026-04-27）
- `922ad257` /journal editorial spread — typography-first, sidebar masthead

### Wave 4 — Theme strip（2026-04-27）
- `290a51f1` data-theme dual-mode 廃止、`:root` に統合
- `2ca243fd` Wave 4-1 を light substrate に flip — dark-bg 概念廃止
- `05d603ab` readability scrim 試行
- `67599652` scrim revert
- `2674cb9a` readability dim 値の再調整 (focus 0.55→0.42, reading 0.35→0.20)

### Wave 5 — Motion Studies curation（2026-04-27）
- `eb01d545` /journal を 4 motion studies にキュレート

### Wave 6 — Hero + /journal typography 仕上げ（2026-04-27）  ← 本日の chat
- `b3d75f04` Hero h1 を Jost italic SVG bake に置換、glass 撤去
- `6d973d49` Hero eyebrow mono→sans、role 文言修正
- `64bd241a` body::after film-grain wash 撤去
- `f8b8e206` Hero readability immersive(1.0) に
- **`5cfd56f4`** **/journal editorial typography 改修（font-mono 全廃 + Jost + monochrome）**
- **`9030a567`** **motion-dot HUD pill を bottom-right に縦スタック**

---

## 3. 本日 (2026-04-27) chat の改修詳細

監査時に **必ず重点確認** すべき直近 2 commit を詳述する。

### 3.1 `5cfd56f4` /journal editorial typography

**変更ファイル**:
- `apps/web/src/app/[locale]/(portfolio)/journal/page.tsx` (+24/-21)
- `apps/web/src/app/fonts.ts` (+18/-1)
- `apps/web/src/app/globals.css` (+3/-0)

**改修内容**（3 phase まとめて 1 commit）:

#### Phase 1: font-mono 全廃 (10 箇所、journal/page.tsx)

| 役割 | before | after |
|---|---|---|
| eyebrow (NOTES & STUDIES, REFERENCE WORKS, Contents, Edition) | `font-mono ... tracking-[0.32\|0.28em]` | `font-sans font-medium ... tracking-[0.18em]` |
| number label (No. 01) | `font-mono ... tabular-nums tracking-[0.25em]` | `font-sans font-medium ... tabular-nums tracking-[0.16em]` |
| slug label (STAGED-EMPHASIS-PAYOFF) | `font-mono ... tracking-[0.22em]` | `font-sans font-medium ... tracking-[0.14em]` |
| meta line (DOM · GRAPHEME STAGGER) | `font-mono ... tracking-[0.24em]` | `font-sans font-medium ... tracking-[0.14em]` |
| CTA (→ 開く) | `font-mono ... tracking-[0.22em]` | `font-sans font-medium ... tracking-[0.14em]` |
| ToC items | `font-mono ... tracking-[0.18em]` | `font-sans font-medium ... tracking-[0.12em]` |
| 年号・通番 (Edition dl) | `font-mono ... tracking-[0.18em]` | `font-sans font-medium tabular-nums ... tracking-[0.10em]` |

**判断根拠**: Stream A research（4 並列 agent の 1 つ）が `Saint Laurent / Supreme / The Row / SSENSE / Margiela / Aimé Leon Dore / Vogue` を調査し、**fashion editorial で font-mono caption は使われない**ことを確認。font-size は `[10px]` / `[11px]` を保持、色トークンも保持。Hero の同様改修（`6d973d49`）と語彙統一。

#### Phase 2: Jost upright を display heading に

`fonts.ts` に `next/font/google` で Jost を追加:
```ts
export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  display: "swap",
  preload: false,  // ← Hero wordmark は SVG bake 済、runtime preload 不要
});
```

`globals.css` に新 stack を追加（既存 `--font-family-sans` は **不変**、body は Geist のまま）:
```css
--font-family-display: var(--font-jost), var(--font-geist-sans),
  "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
```

journal/page.tsx の h1 / h2 / h3 に **inline style で適用**:
```tsx
<h1 style={{ fontFamily: "var(--font-family-display)" }} className="...">
  {t("title")}
</h1>
```

**判断根拠（Stream D CJK audit）**: h1/h2/h3 に渡る i18n strings (`journal.title`, `journal.motionStudies.title`, `journal.motionStudies.entries.*.title`) は **ja でも全部 Latin only**。よって Jost 適用が CJK 混植問題を起こさないことを確認済。本文 (summary, heroProse) は CJK 混植のため Jost を当てず Geist Sans のまま。

#### Phase 3: per-study color 全廃 → 完全モノクローム

ユーザフィードバック「意味なくカラフルにしている意味がわかりません」を受けて、`MotionStudyEntry.accent` 型フィールドと 4 entries の `accent: "#..."` を削除。

| 場所 | before | after |
|---|---|---|
| No.XX badge | inline `style={{ color: entry.accent }}` (赤/青/橙/紫) | `text-[var(--text-base-40)]` (subtle gray) |
| → arrow | inline `style={{ color: entry.accent }}` | 親 `text-[var(--text-base-60)]` を継承 |
| ToC sidebar 番号 | inline `style={{ color: entry.accent }}` | `text-[var(--text-base-40)]` |
| REFERENCE WORKS eyebrow | inline `style={{ color: "var(--heat-medium)" }}` (amber) | `text-[var(--text-base-60)]` |

**最終結果**: 階層が **weight + tracking + size + opacity だけ** で表現され、Saint Laurent / The Row 系の austere monochrome editorial に。色相ゼロ。

### 3.2 `9030a567` motion-dot HUD pill 縦スタック

**変更ファイル**: `packages/motion-dot/src/ui/hud.ts` (+13/-4)

**問題**: `createStatusPill` が `top: var(--motion-hud-top, 90px); left: 18px` で固定配置されており、**サイト全体で**editorial wordmark (Hero Jost-italic / /journal h1 "Journal") と衝突していた。

**改修**: pill を bottom-right の控えに移し、dock の **下に縦スタック**（dock が上、pill が下）。

```ts
// 改修前
position: "fixed", top: "var(--motion-hud-top, 90px)", left: "18px"

// 改修後
const PILL_BOTTOM_PX = 22;
const PILL_HEIGHT_ESTIMATE_PX = 32;
const STACK_GAP_PX = 14;
const DOCK_BOTTOM_PX = PILL_BOTTOM_PX + PILL_HEIGHT_ESTIMATE_PX + STACK_GAP_PX;  // = 68

// pill
position: "fixed",
bottom: `var(--motion-hud-bottom, ${PILL_BOTTOM_PX}px)`,  // 22
right: `${DOCK_RIGHT_PX}px`,  // 22
```

**maxWidth 調整**: `min(28rem, calc(100vw - 44px))` に拡張（旧 `36px` から）して transition label も右ガッターに収まる。

**副作用**: dock の bottom anchor が定数式から導出されるため、`POPOVER_BOTTOM` (hotkeys / audio settings popover の anchor) も自動追従。

**重要**: HUD pill は `motion-dot` package 内で **fixed positioning でグローバルに固定配置**される。すなわち **/journal 以外の全ルートにも同じ移設が反映される**。これは意図通り（top-left 衝突は他 page でも起きるため）だが、**監査時に各ルートで意図せず別の collision が発生していないか確認必須**。

---

## 4. 検証済みのこと

| 項目 | 検証手段 | 結果 |
|---|---|---|
| /journal の visual quality | Chrome MCP screenshot 4 枚 (`.claude/tasks/journal-*.jpeg`) | OK — typography editorial、HUD 衝突解消 |
| TypeScript 型チェック | `bunx tsc --noEmit` (apps/web) | clean (既存無関係 error 1 件のみ: `params-codec.test.ts`) |
| dev server HMR | `curl localhost:3000/ja/journal` → 307 / 200 / 反映確認 | 反映済 |
| font-mono 残存ゼロ | `grep -n "font-mono" journal/page.tsx` | 0 件 |
| `entry.accent` 残存ゼロ | `grep -n "entry.accent\|accent:" journal/page.tsx` | 0 件 |
| Jost upright が DOM に到達 | dev server で /journal を render し Jost が h1/h2/h3 に効いている | 目視確認 OK |

---

## 5. 未検証のこと（リリース前 audit で必須）

### 5.1 production build

**未実行**。少なくとも:
```bash
cd apps/web && bun run build
```
を回して以下を確認すべき:

- TS strict / lint で警告が出ていないか
- Jost フォントが正しく bundle され Vercel CDN から配信できるか
- `next/font/google` の network call が production で失敗しないか
- `--font-family-display` が computed style で解決されるか（変数名 typo がないか）
- Turbopack ビルドエラーが出ていないか（過去に `react-day-picker/style.css` 系 lightningcss エラーあり、要警戒）

### 5.2 全ルート巡回（HUD 移設の波及）

HUD pill が bottom-right に移ったことで、**全ルートの bottom-right に他の要素がないか** を要確認:

| ルート | 確認ポイント |
|---|---|
| `/` (home) | Hero h1 (Jost italic SVG) と HUD が衝突しないこと、AmbientHomeHero の bottom anchor (eyebrow + h1) と被らないか |
| `/works` | 作品グリッドの右下 padding が HUD と重ならないか |
| `/journal` | OK（本 chat で確認済） |
| `/journal/motion-studies/{slug}` × 4 | ReferenceWork コンポーネントの footer / next-link が HUD と被らないか |
| `/contact` | フォーム最下部の submit button と HUD が衝突しないか |
| `/experiments/dot` | scene-cycle UI と HUD が共存するか（experiments は HUD 主役の場所） |
| `/experiments/grid` | 同上 |
| `/experiments/flow` | flowline HUD（別 package, motion-flow）が motion-dot HUD と被らないか **要警戒** |
| `/experiments/wordmark` | typography R&D 環境、HUD が candidate prep と被らないか |
| `/filmtone` (DARK) | dark identity 維持されているか、HUD が dark surface 上で readable か |
| `/photography` (DARK) | 同上 |

### 5.3 Mobile viewport

HUD pill maxWidth は `min(28rem, calc(100vw - 44px))`。狭幅で:
- transition label `[Transition] Foo → Bar` が ellipsis で切れる挙動
- pill と dock の縦スタックが viewport 高に収まるか
- 横向き mobile で底辺 122px (PILL 22+32 + GAP 14 + DOCK 56) が content と重ならないか

### 5.4 i18n EN ルート

`/en/journal` 以下のレンダリングは未確認。**特に**:
- 英語タイトルが Jost で意図通り組まれるか（Latin only なので問題なし想定だが要目視）
- hreflang / canonical が正しいか（journal/page.tsx の `generateMetadata` は変更なし）

### 5.5 Lighthouse / Core Web Vitals

- LCP: Jost フォント追加で FOUT 増えていないか
- CLS: HUD pill 位置変更で初期描画が動かないか
- Bundle size: Jost weight 3 種追加で増分（font subset latin で ~30KB 想定）

### 5.6 dark identity ルート（Filmtone, Photography）

本ブランチでの substrate flip + readability + Jost 追加が **dark identity** に副作用を与えていないか:
- Filmtone の wordmark / button color
- Photography の grid layout
- Nav が dark scope 内で正しい palette に解決されるか

### 5.7 e2e / 視覚 regression

- `apps/web/e2e/wordmark-geometry-test.spec.ts` (untracked) は Hero wordmark 用 e2e、本 chat 関連
- 既存 Playwright spec があれば回す
- visual regression（reg-cli, percy 等）は未導入の模様

---

## 6. 既知の懸念事項（リリース前に判断必要）

### 6.1 ReferenceWork pages の typography が hub と乖離 🟡

`/journal/motion-studies/{slug}` の 4 ページの実体は:
- `apps/web/src/features/motion/reference-works/stagedEmphasisPayoff/StagedEmphasisPayoffReferenceWork.tsx`
- `apps/web/src/features/motion/reference-works/temporalEchoResidue/TemporalEchoResidueReferenceWork.tsx`
- `apps/web/src/features/motion/reference-works/signalStrokeRelay/SignalStrokeRelayReferenceWork.tsx`
- `apps/web/src/features/motion/reference-works/boilingPosterAperture/BoilingPosterApertureReferenceWork.tsx`

**未改修**。hub (/journal) は Jost + monochrome に切替えたが、各 study 詳細ページの typography は手付かず。Stream B 監査結果ではこれら ReferenceWork に同様の `font-mono` / per-study color が残っている可能性が高い。

**判断**:
- (a) リリース前に揃える（追加 1〜2 commit）
- (b) hub だけ先行リリースし、ReferenceWork は次イテレーション
- (c) ReferenceWork も同改修を本ブランチで完結させる

ユーザの「**保守的な意見ではなくプロダクト品質を最優先**」方針からすると **(a) または (c) を推奨**。

### 6.2 `max-w-[44ch]` が CJK で意図より狭い 🟡

Stream D CJK audit で発覚した既存問題（5 箇所）:

| ファイル | 行 | クラス |
|---|---|---|
| `journal/page.tsx` | 89（移動済の可能性あり） | `max-w-[44ch]` description |
| `StagedEmphasisPayoffReferenceWork.tsx` | 67 | `max-w-[44ch]` heroProse |
| `SignalStrokeRelayReferenceWork.tsx` | 67 | `max-w-[44ch]` heroProse |
| `TemporalEchoResidueReferenceWork.tsx` | 67 | `max-w-[44ch]` heroProse |
| `BoilingPosterApertureReferenceWork.tsx` | 67 | `max-w-[44ch]` heroProse |

`44ch` は en で 44 文字幅の意図だが ja では 1 CJK ≒ 2ch なので 22 CJK 文字幅 → 意図より狭い。`.ai/knowledge/cjk-typography-pitfalls.md` で `em` ベースを推奨。

**推奨修正**: `max-w-[40rem]` 等の rem ベースに置換（5 箇所一括）。

**判断**: 既存問題で本 chat 由来ではないため必須ではないが、editorial 品質基準的にリリース前修正を強く推奨。

### 6.3 working tree に大量の uncommitted 変更 🟡

`git status` で **109 lines** のエントリ。本 chat 由来 **以外** の M / ?? が多数:

**modified（コミットされていない、本 chat 由来ではない）**:
```
.claude/settings.local.json
.claude/tasks/ACTIVE-PARALLEL-TASK.md
apps/web/package.json                        ← deps 追加？要確認
apps/web/src/app/[locale]/(portfolio)/experiments/flow/client.tsx
apps/web/src/app/[locale]/(portfolio)/experiments/grid/client.tsx
apps/web/src/app/[locale]/(portfolio)/experiments/page.tsx
bun.lock                                     ← deps 追加？要確認
packages/motion-flow/package.json
packages/motion-flow/src/mount.ts
packages/motion-grid/package.json
packages/motion-grid/src/mount.ts
```

**untracked（追跡外）**:
```
apps/web/e2e/wordmark-geometry-test.spec.ts   ← Hero wordmark e2e
apps/web/public/brand/filmtone-bg-candidates-v2/
apps/web/public/brand/filmtone-logo-background-candidates-v1.png
apps/web/public/brand/filmtone-logo-master-2048.png
apps/web/public/fonts/                        ← Jost-800 / Inter / Hanken / Bebas（experiments/wordmark で使用）
apps/web/src/app/[locale]/(portfolio)/experiments/wordmark/
apps/web/src/features/hero/lib/
```

**判断**:
- 本 chat 由来ではない modified は **意図的に取り残された WIP** か **過去 chat の commit 漏れ** かを判定必要
- リリース前に：(a) WIP は別ブランチに退避、(b) 完成しているなら別 commit に分離、(c) 含めるなら整理して commit
- e2e spec / experiments/wordmark / public/fonts / hero/lib は **Wave 6 前段の commit が漏れている**可能性が高い（Hero wordmark Tier 1/2 tuning の result handoff 文書あり）

### 6.4 origin から 32 commit ahead、未 push 🟡

```
## feat/renewal-2026-phase2-motion-dot...origin/feat/renewal-2026-phase2-motion-dot [ahead 32]
```

origin に最新 35 commit が反映されていない。**監査前に push して PR 化**すべきか、ローカルで確認するかは判断必要。CI が走るなら push 推奨。

### 6.5 `.claude/tasks/` に多数の screenshot / report 6.1 から派生

本 chat 由来の screenshot 7 枚と監査 report 4 件:
```
.claude/tasks/typography-references-2026-04-27.md
.claude/tasks/journal-typography-patch-list-2026-04-27.md
.claude/tasks/jost-system-integration-2026-04-27.md
.claude/tasks/journal-cjk-i18n-impact-2026-04-27.md
.claude/tasks/journal-after-phase1+2-viewport.jpeg
.claude/tasks/journal-after-phase1+2-fullpage.jpeg
.claude/tasks/journal-after-monochrome-fullpage.jpeg
.claude/tasks/journal-pure-monochrome.jpeg
.claude/tasks/journal-hud-relocated.jpeg
.claude/tasks/journal-hud-stacked.jpeg
.claude/tasks/journal-hud-stacked-swapped.jpeg
```

監査時の visual reference として有用。git に含めるかは方針次第（`.claude/` は gitignore されていない様子）。

---

## 7. リリース前監査チェックリスト

次 chat で **このリストを上から順に実行**することを推奨。

### 7.1 ビルド系（10 分）
- [ ] `bun install` が clean に通る
- [ ] `cd apps/web && bun run build` が成功する
- [ ] `bunx tsc --noEmit` で apps/web に新規 error が出ない（既存 1 件 `params-codec.test.ts` はベースライン）
- [ ] `bun run lint` で apps/web に新規 warning が出ない

### 7.2 全ルート目視巡回（30 分、Chrome MCP 推奨）
- [ ] `/` home — Hero wordmark + HUD 衝突なし
- [ ] `/works` — 作品グリッド + HUD
- [ ] `/journal` — 本 chat 改修箇所 ★
- [ ] `/journal/motion-studies/staged-emphasis-payoff` — typography が hub と整合
- [ ] `/journal/motion-studies/temporal-echo-residue` — 同上
- [ ] `/journal/motion-studies/signal-stroke-relay` — 同上
- [ ] `/journal/motion-studies/boiling-poster-aperture` — 同上
- [ ] `/contact` — form と HUD
- [ ] `/experiments` — index
- [ ] `/experiments/dot` — motion-dot showcase
- [ ] `/experiments/grid` — motion-grid showcase
- [ ] `/experiments/flow` — motion-flow showcase（**flowline HUD と motion-dot HUD の重複に注意**）
- [ ] `/experiments/wordmark` — typography R&D
- [ ] `/filmtone` — dark identity 保持
- [ ] `/photography/...` — dark identity 保持
- [ ] `/en/journal` — 英語版

各ルートで:
- [ ] HUD pill が他要素と衝突していない
- [ ] HUD dock (Film/Audio/More) の機能が動作（クリック）
- [ ] Hotkey legend (H key) / audio settings が popover で開く
- [ ] Nav chip が glass 材で正しく refract
- [ ] CJK レンダリングに不自然な改行 / 字形ズレがない

### 7.3 typography 品質 (15 分、/journal 集中)
- [ ] /journal hero "Journal" が Jost で組まれている（geometric J/a/r/n/a/l 字形）
- [ ] /journal "Motion Studies" が同じく Jost
- [ ] 各 study h3 (Staged Emphasis Payoff 等) が Jost
- [ ] 全 caption が tracking 0.18em / 0.16 / 0.14 / 0.12 / 0.10 で階段状に
- [ ] 色相が完全モノクローム（amber も無し）
- [ ] body intro / summary / heroProse は Geist Sans のまま
- [ ] CJK + Latin 混植が自然（specs/quotes 等）

### 7.4 mobile / responsive（10 分）
- [ ] 375px 幅で /journal が縦長レイアウトに崩れず読める
- [ ] HUD pill が viewport hopping しない
- [ ] sidebar (Contents/Edition) が collapse する設計か（現状は lg 以上で sticky、sm では下にスタック）

### 7.5 dark identity ルート（10 分）
- [ ] /filmtone のダークテーマが substrate flip で壊れていない
- [ ] /photography の写真が想定通り表示
- [ ] dark scope 内の Nav / button color が正しい

### 7.6 paranoia（任意）
- [ ] DevTools で `--font-jost: 'Jost_xxxxx', 'Jost_Fallback_xxxxx'` が `<html>` に注入されているか
- [ ] computed `font-family` で h1/h2/h3 が Jost 解決
- [ ] FOUT が長すぎないか（Jost preload: false なので最初の view で代替フォントが見える可能性）
- [ ] Lighthouse Performance ≥ 90

---

## 8. release blocker と判断する基準

以下のいずれかに該当したら **release blocker** とし、修正してから merge:

1. production build が fail する
2. 全 portfolio ルートのうちどれか 1 つでも HUD pill が深刻な衝突を起こす
3. dark identity ルート (Filmtone, Photography) が壊れている
4. Hero wordmark / /journal h1 で Jost が読み込まれず Geist にフォールバックしたまま
5. CJK を含むタイトルが意図しない箇所で改行 / 字形破綻
6. ReferenceWork 4 ページの typography が **明らかに** hub と不整合（ユーザ判断）
7. mobile (375px) で読めない / 操作不能

以下は **release-with-caveat** として許容可（次イテレーションで修正前提）:

- `max-w-[44ch]` の CJK 過密（既存問題）
- e2e spec の coverage 不足
- visual regression baseline 未整備

---

## 9. 関連ファイル / 知識マップ

### 9.1 本 chat 改修済ファイル（最重要）
```
apps/web/src/app/[locale]/(portfolio)/journal/page.tsx   ← /journal hub
apps/web/src/app/fonts.ts                                 ← Jost 追加
apps/web/src/app/globals.css                              ← --font-family-display 定義
packages/motion-dot/src/ui/hud.ts                         ← StatusPill 移設 + DOCK_BOTTOM 計算
```

### 9.2 関連だが本 chat 未改修（次手の候補）
```
apps/web/src/features/motion/reference-works/{stagedEmphasisPayoff,temporalEchoResidue,signalStrokeRelay,boilingPosterAperture}/*ReferenceWork.tsx
apps/web/src/features/hero/components/AmbientHomeHero.tsx (Hero、本 chat の前身 4 commit で改修済)
apps/web/src/shared/components/Nav.tsx
apps/web/src/features/liquid-glass/LiquidGlassFrontChrome.tsx
```

### 9.3 typography pipeline
```
apps/web/scripts/build-wordmark.ts          ← Geist Sans 改変版 → portfolio.ts.wordmark
apps/web/scripts/build-italic-wordmark.ts   ← Jost-800 italic → portfolio.ts.wordmarkItalic
apps/web/scripts/.cache/                    ← intermediate JSON
apps/web/public/brand/                      ← standalone SVG artifacts
```

### 9.4 design system
```
packages/design-system/src/tokens/typography
packages/design-system/src/tailwind/plugin.ts (typographyVars)
```

### 9.5 i18n
```
apps/web/messages/ja.json    journal namespace
apps/web/messages/en.json    journal namespace
```

### 9.6 ナレッジ（必読）
```
.claude/knowledge/patterns/data-readability-shader-pipeline.md     ← CSS scrim 禁止の根拠
.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md ← light bg ハードコード
.claude/knowledge/patterns/nav-active-state-startswith.md
.ai/knowledge/cjk-typography-pitfalls.md                           ← text-wrap balance 禁止 / em ベース
.ai/knowledge/gsap-ease-syntax.md
.ai/knowledge/hero-shader-visibility.md
.ai/knowledge/scroll-trigger-pitfalls.md
```

### 9.7 本 chat の中間成果物（監査の参考）
```
.claude/tasks/typography-references-2026-04-27.md           Stream A research
.claude/tasks/journal-typography-patch-list-2026-04-27.md   Stream B audit
.claude/tasks/jost-system-integration-2026-04-27.md         Stream C plan
.claude/tasks/journal-cjk-i18n-impact-2026-04-27.md         Stream D CJK audit
.claude/tasks/journal-after-phase1+2-fullpage.jpeg           Phase1+2 後の screenshot
.claude/tasks/journal-pure-monochrome.jpeg                   monochrome 化後
.claude/tasks/journal-hud-stacked-swapped.jpeg               HUD 移設後
```

### 9.8 過去のハンドオフ（参照）
```
docs/renewal-2026/2026-04-27-typography-refinement-handoff.md            本 chat の前身
docs/renewal-2026/2026-04-27-text-readability-handoff.md
docs/renewal-2026/2026-04-27-hero-wordmark-tier2-result-handoff.md
docs/renewal-2026/2026-04-27-hero-wordmark-tuning-handoff.md
docs/renewal-2026/MASTER-HANDOFF-2026-04-25.md
docs/renewal-2026/director-chat-handoff-2026-04-26-post-package7.md
docs/renewal-2026/director-chat-handoff-2026-04-26.md
```

---

## 10. 緊急ロールバック手順

監査で release blocker が発見され、本 chat の改修だけを巻き戻したい場合:

### 10.1 最後の 6 commit だけを revert（Wave 6）
```bash
git revert --no-edit 9030a567  # HUD relocation
git revert --no-edit 5cfd56f4  # /journal typography
git revert --no-edit f8b8e206  # Hero readability immersive
git revert --no-edit 64bd241a  # body::after 撤去
git revert --no-edit 6d973d49  # Hero eyebrow sans 化
git revert --no-edit b3d75f04  # Hero italic Jost wordmark
```
これで Wave 5 (`eb01d545` /journal motion studies curation) まで巻き戻る。

### 10.2 HUD pill 移設だけを巻き戻し（最小ロールバック）
```bash
git revert --no-edit 9030a567
```
Hero / /journal typography は維持され、HUD だけ top-left 90px に戻る。

### 10.3 /journal typography だけを巻き戻し
```bash
git revert --no-edit 5cfd56f4
```
HUD は新位置のまま、/journal は font-mono + per-study color の旧版に戻る。

### 10.4 完全ロールバック（リニューアル全体）
```bash
git checkout main
# feat/renewal-2026-phase2-motion-dot ブランチは保持（merge せず）
```

---

## 11. 次 chat への期待アクション

1. **本ドキュメントを最初に読む**（30 秒サマリ → 直近 5 commit 詳細）
2. **§5 未検証チェックリスト**を上から実行
3. **§6 既知の懸念事項**を 1 つずつ判定（解消 / 許容）
4. **§7 監査チェックリスト**で全ルート巡回
5. **release-blocker / release-with-caveat / release-ok** の 3 段階で判定
6. blocker があれば §10 のロールバック手順を参考に最小修正
7. 判定結果を `docs/renewal-2026/2026-04-XX-release-audit-result.md` に記録
8. user に **GO / NO-GO / GO-WITH-CAVEAT** を提示

---

## 12. 補足 — Agent Teams 並列の使い方（参考）

本 chat では 4 並列 stream (research / audit / Jost plan / CJK audit) を Agent Teams で同時実行し、lead が結果統合 → 実装した。次 chat も同様のアプローチが有効:

- 全ルート巡回を 4 並列 (portfolio / experiments / dark-identity / mobile) に分割
- production build / Lighthouse / e2e を並列実行
- 各 stream は read-only audit で `.claude/tasks/audit-{stream}-2026-04-XX.md` を出力
- lead が release-blocker 判定

CLAUDE.md project rules: 「独立ストリーム 4 以上 → Agent Teams、3 以下 → Sequential」。

---

## 13. 連絡先 / context

- ユーザ: chiba@fores-tone.co.jp（Fullstack Engineer / Creative Director）
- 本リニューアルの哲学: **Moving Postcard**（編集的・情景的・控えめだが意図がある）
- ユーザの判断基準: **本質の進行を最優先、外殻は最小限。保守的な意見ではなくプロダクト品質を最優先**
- Filmtone / Photography は dark identity の例外として保持
- パッケージマネージャ: **bun**（npm 不可）

---

**End of handoff. 次 chat はこのドキュメント単体で完結して監査を開始できる。**
