# /journal motion-studies の精査・キュレーション見直し — 引き継ぎ document

**作成**: 2026-04-27 JST
**作成 session**: Claude Opus 4.7 (Wave 5 完了直後 + 06 排除直後)
**次 session の目的**: `/journal` に掲載中の **5 件の motion-study が本当に適切か** を精査・調査する。必要なら入れ替え / 追加 / 更なる削除を実行する。
**ブランチ**: `feat/renewal-2026-phase2-motion-dot`
**HEAD**: `2674cb9a` (Wave 5 + 06 排除分は **未コミット**、working tree に保持中)

このドキュメントは **新規 chat に完全引き継ぎするための単一参照点** です。Wave 4 の経緯、Wave 5 で実施した整理、06 排除の判断、site の前提制約、編集デザイン方針、現存 5 件の motion-study の詳細、精査の論点をすべて含みます。これを読めば追加の文脈収集なしで精査作業を開始できます。

前回の整理 wave (Wave 5) のハンドオフは `docs/renewal-2026/2026-04-27-journal-works-and-layout-reorganization-handoff.md` にあり、本書はその続編です。Wave 4 までの土台を踏襲しています。

---

## 0. 次 session の最初にやること (TL;DR)

1. このドキュメントを最後まで読む (特に §3, §4, §7, §9)
2. 前作の integral 引き継ぎ `docs/renewal-2026/2026-04-27-journal-works-and-layout-reorganization-handoff.md` の §3 (Hard constraints) と §4 (編集デザイン原則) を読む — 本書では参照のみで再記載しない部分がある
3. ブラウザで `http://localhost:3000/ja/journal` を開いて現状の 5 entries / 3 chapters の構成を視覚把握 (dev server は port 3000 で稼働中の前提。落ちていれば `bun run --cwd apps/web dev`)
4. 5 件の detail page を順に開いて各作品の **完成度 / 編集適合性 / 競合との比較対象性** を評価する観点で再観賞:
   - `/ja/journal/motion-studies/signal-stroke-relay` (No.01)
   - `/ja/journal/motion-studies/staged-emphasis-payoff` (No.02)
   - `/ja/journal/motion-studies/boiling-poster-aperture` (No.03)
   - `/ja/journal/motion-studies/temporal-echo-residue` (No.04)
   - `/ja/journal/motion-studies/motif-loop-background` (No.05)
5. **§9 の精査論点をユーザーと擦り合わせてから着手** (排除 / 入替 / 追加 / 順序変更 / 章再構成 など、複数解釈可能なため)

---

## 1. Goal of this hand-off

ユーザーは「**現在掲載されている 5 件の motion study が本当に適切か精査したい**」と表明。具体的なスコープは未定。次 session で以下のいずれか (または複合) を扱う可能性:

- **品質の再評価**: 5 件それぞれが portfolio 掲載に値する完成度か、内部 benchmark と外部競合 portfolio 両軸で再判定
- **追加排除の判断**: 06 (anchored-progress-resolve) と同様、完成度が足りない作品があれば更に削減
- **入れ替えの判断**: 既存作品を停止し、別の作品に差し替える可能性 (Phase 2 の GSAP / Three.js 計画作品など)
- **追加掲載の判断**: 新規 reference work を作って journal を増強する方向
- **章の再構成**: 5 件の grouping (Title / Reveal / Ambient) が適切か再判定、または別軸の grouping (制作年順 / 技法カテゴリ / 表現 grammar) への切替
- **掲載順の再決定**: keystone (No.01) を別作品に変更する判断
- **順位 / accent / context 文字列の再調整**: editorial としての可読性向上

精査の **判断はユーザー駆動**。実装前に必ず方向性を擦り合わせること。

---

## 2. ブランチと commit 履歴

`feat/renewal-2026-phase2-motion-dot` ブランチの直近 9 commit (HEAD まで):

```
2674cb9a fix(theme): tighten readability dim — focus 0.55→0.42, reading 0.35→0.20
67599652 revert(theme): drop the readability scrim — visible section boundary
05d603ab feat(theme): readability scrim — backdrop blur + faint dark tint behind copy
2ca243fd fix(theme): flip Wave 4-1 to light substrate — abolish dark-bg concept
290a51f1 refactor(theme): drop data-theme dual-mode, consolidate to :root
922ad257 feat(renewal): /journal editorial spread — typography-first, sidebar masthead
ce4f3ccf feat(renewal): /experiments hero readability attr
07cede78 feat(renewal): wrap home hero with EditorialSection
e05aa2de feat(renewal): wrap /journal hero + list readability
```

**Wave 5 + 06 排除は未 push / 未 commit**。working tree に変更が残っており、push の判断は次 session 担当 + ユーザーで実施。

### 2.1 working tree 状態 (Wave 5 + 06 排除後)

#### Wave 5 の主な modified
- `apps/web/messages/ja.json` — `chapters` namespace + `heroProse` 追加 / `context` 全件書き換え (Stack · Topic 形式)
- `apps/web/messages/en.json` — 同上 mirror
- `apps/web/src/app/[locale]/(portfolio)/journal/page.tsx` — chapter regroup, 章 nested `<ol>` 構造、新順序
- `apps/web/src/features/motion/reference-works/{signal-stroke-relay,staged-emphasis-payoff,boiling-poster-aperture,temporal-echo-residue,motif-loop-background}/*ReferenceWork.tsx` — canonical editorial DNA skeleton
- `apps/web/src/features/motion/reference-works/{boiling-poster-aperture,temporal-echo-residue}/fixtures.ts` — orphan `copy:` wrapper 削除

#### 06 排除関連の deleted
- `apps/web/src/app/[locale]/(portfolio)/journal/motion-studies/anchored-progress-resolve/page.tsx`
- `apps/web/src/features/motion/reference-works/anchored-progress-resolve/AnchoredProgressResolveReferenceWork.tsx`
- `apps/web/src/features/motion/reference-works/anchored-progress-resolve/AnchoredProgressResolveSurface.tsx`
- `apps/web/src/features/motion/reference-works/anchored-progress-resolve/anchored-progress-family/index.ts`
- `apps/web/src/features/motion/reference-works/anchored-progress-resolve/fixtures.ts`

#### 06 排除関連の modified
- `apps/web/src/app/sitemap.ts` — slug list から `anchored-progress-resolve` 削除
- 上記 i18n / list page から `anchoredProgressResolve` entry と `uiState` chapter 削除

#### Wave 5 と無関係 (放置可、別 wave で扱うべき)
- `.claude/settings.local.json`
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`
- `apps/web/package.json`、`bun.lock`
- `apps/web/src/app/[locale]/(portfolio)/experiments/{flow,grid}/client.tsx`、`experiments/page.tsx`
- `packages/motion-{flow,grid}/package.json`、`packages/motion-{flow,grid}/src/mount.ts`

#### Wave 5 で生成した untracked (本書 + screenshot 等)
- `docs/renewal-2026/2026-04-27-journal-works-and-layout-reorganization-handoff.md` (= Wave 5 の元ハンドオフ)
- `docs/renewal-2026/2026-04-27-journal-motion-studies-curation-review-handoff.md` (= 本書)
- `output/playwright/2026-04-27-wave5-{journal-list,detail-signal,detail-staged,journal-after-excision}.jpeg`
- 他 untracked docs (Wave 4 関連の積み残し、本 wave スコープ外)

**注意**: 06 排除直後の状態は visual / route 検証済 (HTTP 200 × 5 + 404 × 1 / typecheck baseline / lint baseline)。次 session 開始時点でサーバーが落ちていなければ即時動作確認可能。

---

## 3. Hard constraints (絶対に守るルール)

前作ハンドオフ §3 を継承。要点:

### 3.1 motion-dot canvas は light substrate 固定
`packages/motion-dot/src/main.ts` 内で metaball pass の `bgColor` が `[0.82, 0.82, 0.82, 1.0]` で hardcode。`/journal` は portfolio route なので **light substrate 一択**。dark に振りたい誘惑が出たら立ち止まる。

詳細: `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md`

### 3.2 装飾パネル / glass scrim を貼らない
視認性が足りないと感じても CSS で `::before` panel / glass / 半透明 dark tint を被せる解は **使わない**。`data-readability` shader pipeline の uniform tuning が正解。

詳細: `.claude/knowledge/patterns/data-readability-shader-pipeline.md`

### 3.3 触ってはいけないファイル / 領域
- `packages/motion-dot/*` — canvas 自体は WebGPU + 別 build pipeline、本 session 範囲外
- `apps/web/src/app/globals.css` の Filmtone 関連 (`.fl-*` tokens、`.film-lab-*` classes、`.film-lab-liquid-glass`)
- `apps/web/src/app/[locale]/(satellite)/*` (Filmtone / Photography)
- `apps/web/src/app/[locale]/(portfolio)/photography/*`
- 既 commit 済の Wave 3/4 関連の wrap や theme 統合は触らない

### 3.4 motion-study の Surface 内部は触らない
Wave 5 で確立した contract: detail page chrome (header / sidebar) は editorial DNA、Surface 内部 (PixiJS canvas / SVG / WebGPU) は **work が自分の表現空間として保持**。Surface 内部の `bg-[#0f1014]` 等の dark stage は意図的、site substrate と分離している。

精査では Surface の **挙動 / 完成度** を評価対象にできるが、**実装には踏み込まない** (次 session の精査結果として「この作品を排除 / 入替」と判断したらその時点で改めて scope を広げる)。

---

## 4. 編集デザイン原則 (Wave 4-2 確立 + Wave 5 強化)

### 4.1 typography hierarchy で勝負
- `EditorialSection` wrapper、`.editorial-surface-flat`、glass panel、`.photography-*` decorative classes は **使わない**
- font-mono caps eyebrow + clamp() 大見出し + 構造化 prose で hierarchy を作る
- divider は border でなく gradient hairline (`linear-gradient(90deg, transparent, rgba(0,0,0,0.22), transparent)`) で句読点
- card 装飾 / border 囲み / 影付きパネル / `rounded-[28px] border bg-white/[0.03]` 系 glass aside は禁止

### 4.2 editorial DNA の出所
- `/photography` `/filmtone` は **商業 LP**。premium reference にしない
- editorial DNA は `/journal` list page (Wave 4-2 commit `922ad257`) と 5 detail page (Wave 5 で migrate 済) が正本
- 適用 pattern: sidebar `lg:grid-cols-[minmax(0,1fr)_280px]`, mono eyebrow caps, clamp headline, structured prose, plain `space-y-10` aside, glass panel 不在

### 4.3 motion-dot は kinetic substrate
canvas を消すのでなく `data-readability="focus|reading"` で読書セクションでの energy を shader-side で減衰。「motion-dot を読む雑誌の表紙 + 編集ページ」が `/journal` のメタファ。

### 4.4 site 全体は light single substrate (Wave 4-3 確定)
- `data-theme="dark|light"` 属性は廃止、`:root` token は全て light 方向に解決
- Filmtone (`.dark` scope) と Photography (`body:has(.photography-page)`) のみ dark identity 保持
- 5 件の motion-study detail page は全て light substrate に統合済 (Wave 5)

### 4.5 accent 色の使い方
各 motion-study に固有 accent (hex) を持たせる:
| No. | slug | accent |
|-----|------|--------|
| 01 | signal-stroke-relay | `#f0b25a` (warm amber) |
| 02 | staged-emphasis-payoff | `#d96b6b` (red) |
| 03 | boiling-poster-aperture | `#b85cba` (magenta) |
| 04 | temporal-echo-residue | `#7a7af0` (indigo) |
| 05 | motif-loop-background | `#5cb88a` (green) |

使用所:
- ✅ entry No. 番号 (`No. 01` 等)、矢印 glyph、sidebar Contents の番号
- ❌ card 装飾 / background tint / heading 色

`heat-medium` (= `--accent-amber1`) は **Motion Studies eyebrow にだけ** 使う warm punctuation。

---

## 5. Wave 5 + 06 排除で実施したこと (詳細)

### 5.1 Wave 5 — editorial coherence pass

**動機**: Wave 4-2 で list page を editorial DNA に migrate した時点で、6 件の detail page は pre-Wave-4-2 の aesthetic (glass panel / dark token holdover / hardcoded JP prose / sidebar 3-6 のばらつき) のまま取り残されていた。本質の最大の負債。

**実施項目**:
1. **list page chapter regroup** — `motionStudies` array を motion-grammar 順に並べ替え、`motionStudyChapters` を導入し nested `<ol>` 構造で `[ Title sequence / Reveal / Ambient / UI state ]` (当時 6 件) を明示
2. **context 形式統一** — 全 entry の context を `Stack · Topic` に書き換え (例: `Theatre.js + SVG · Trim Relay`)
3. **detail page 6 件の canonical skeleton 化**:
   - `bg-[var(--bg-dark)]` / `bg-[#ecebe6]` 撤去 → site light substrate inherit
   - `rounded-[28px] border border-white/10 bg-white/[0.03]` glass aside → plain `space-y-10` aside
   - `data-readability="focus"` を header、`data-readability="reading"` を body section に付与
   - back-nav `← Journal` (`data-transition="true"`、`/journal#${slug}` anchor) を header 先頭に
   - eyebrow / title / heroProse を `useTranslations("journal.motionStudies.entries.${key}")` で取得
   - sidebar の `border-l border-white/15 pl-3` accent 削除、plain prose に統一
   - `xl:grid-cols-[minmax(0,1fr)_320px]` → `lg:grid-cols-[minmax(0,1fr)_280px]`、`max-w-7xl` → `max-w-6xl`
4. **i18n 拡張** — 各 entry に `heroProse` (詳細ページの hero 説明文) と新 `context` を追加、`chapters` namespace を新設
5. **fixture cleanup** — `boiling-poster-aperture/fixtures.ts` と `temporal-echo-residue/fixtures.ts` の orphan `copy:` wrapper 削除

**並列実行**: Step 0 (i18n seed) を serial、その後 Stream A (list page) / Stream B (signal-staged-boiling) / Stream C (temporal-motif-anchored) を Agent Teams で 3 並列 (sonnet)。Step 2 (fixture cleanup + 検証) を serial で締め。Wall clock 約 5 分。

**詳細**: `~/.claude/plans/journal-docs-renewal-2026-2026-04-27-jou-imperative-globe.md` に Wave 5 の plan 全文。

### 5.2 06 排除 — anchored-progress-resolve

**動機**: ユーザー判断 — Wave 5 完了後に「06 は完成度が低いので排除してください」と指示。

**実施項目**:
1. `motionStudies` array から `anchoredProgressResolve` entry 削除、`MotionStudyEntry` の key/slug union から該当 literal 除外
2. `motionStudyChapters` から `uiState` chapter (該当作品 1 件のみだったため章ごと消滅) 削除、`MotionStudyChapterId` 型からも除外
3. `apps/web/messages/{ja,en}.json` から `chapters.uiState` と `entries.anchoredProgressResolve` 削除
4. `apps/web/src/app/sitemap.ts` の slug list から `anchored-progress-resolve` 削除
5. **dir 削除**:
   - `apps/web/src/app/[locale]/(portfolio)/journal/motion-studies/anchored-progress-resolve/` (route)
   - `apps/web/src/features/motion/reference-works/anchored-progress-resolve/` (Surface / config / fixtures / evaluator / family)

**確認**:
- 残存参照 grep 0 件
- `/ja/journal/motion-studies/anchored-progress-resolve` → HTTP 404 (期待通り)
- 5 件残存 routes は全て HTTP 200 (ja/en 共)
- typecheck / lint baseline 維持
- visual: 5 entries (No.01-05) + 3 chapters (Title 2 / Reveal 2 / Ambient 1) で gradation 良好、bottom-heavy にならず

---

## 6. 現在の `/journal` 構造 (post-Wave 5, post-excision)

### 6.1 list page: `apps/web/src/app/[locale]/(portfolio)/journal/page.tsx`

```ts
type MotionStudyEntry = {
  key: "signalStrokeRelay" | "stagedEmphasisPayoff" | "boilingPosterAperture" | "temporalEchoResidue" | "motifLoopBackground";
  slug: "signal-stroke-relay" | "staged-emphasis-payoff" | "boiling-poster-aperture" | "temporal-echo-residue" | "motif-loop-background";
  accent: string;
};

type MotionStudyChapterId = "titleSequence" | "reveal" | "ambient";

const motionStudies: readonly MotionStudyEntry[] = [
  { key: "signalStrokeRelay",     slug: "signal-stroke-relay",     accent: "#f0b25a" },
  { key: "stagedEmphasisPayoff",  slug: "staged-emphasis-payoff",  accent: "#d96b6b" },
  { key: "boilingPosterAperture", slug: "boiling-poster-aperture", accent: "#b85cba" },
  { key: "temporalEchoResidue",   slug: "temporal-echo-residue",   accent: "#7a7af0" },
  { key: "motifLoopBackground",   slug: "motif-loop-background",   accent: "#5cb88a" },
] as const;

const motionStudyChapters = [
  { id: "titleSequence", slugs: ["signal-stroke-relay", "staged-emphasis-payoff"] },
  { id: "reveal",        slugs: ["boiling-poster-aperture", "temporal-echo-residue"] },
  { id: "ambient",       slugs: ["motif-loop-background"] },
] as const;
```

JSX 構造:
```
<main>
  <article>
    <header data-readability="focus">  // hero
      eyebrow ("Notes & Studies") → h1 "Journal" → description
    </header>
    <section data-readability="reading">
      <div grid 1fr+280px>
        <div>
          intro paragraph
          gradient hairline
          "Motion Studies" heading (heat-medium amber eyebrow)
          <ol space-y-24>  // OUTER chapters
            {motionStudyChapters.map → <li> with [ chapter title ] header + INNER <ol space-y-14>}
          </ol>
        </div>
        <aside sticky>  // flat 5-entry TOC + Edition meta
          Contents (No.01-05 → titles)
          Edition (Vol 01 / Updated 2026.04 / Studies 5)
        </aside>
      </div>
    </section>
  </article>
</main>
```

### 6.2 detail page canonical (5 件で統一)

各 `*ReferenceWork.tsx` は同じ skeleton:
- captureMode 早期 return (Surface のみ minimal layout)
- 内部 `DetailPage` 関数で `useTranslations` + Editorial DNA layout
- header `data-readability="focus"`: back-nav `← Journal` → context (Stack·Topic) → h1 (clamp 2.5..5.5rem) → heroProse
- section `data-readability="reading"`: 1fr + 280px sidebar grid
- aside: plain `space-y-10`、no glass panel、4-5 sections
  - Runtime / Stack / Extraction / [Subject 任意] / Non-Goals
- Surface は左カラムに raw embed (Surface 内部の dark stage / canvas は work 個別)

### 6.3 i18n 構造 (`apps/web/messages/{ja,en}.json` の `journal` namespace)

```
journal:
  title, description, eyebrow, intro
  motionStudies:
    title, eyebrow, intro, openLabel, backLabel
    chapters: { titleSequence, reveal, ambient }
    entries:
      signalStrokeRelay: { title, context, summary, heroProse }
      stagedEmphasisPayoff: { ... }
      boilingPosterAperture: { ... }
      temporalEchoResidue: { ... }
      motifLoopBackground: { ... }
```

各 entry の field 用途:
| field | 用途 |
|-------|------|
| `title` | list と detail で共通 |
| `context` | list eyebrow + detail eyebrow (Stack · Topic 形式) |
| `summary` | list の entry preview (短文) |
| `heroProse` | detail の hero 直下の長め説明文 (44ch 内) |

---

## 7. 現存 5 件の motion-study 完全インベントリ

精査の対象。各作品の technical / editorial / fragility を一覧化。

### No.01 — Signal Stroke Relay (Title sequence)

| 項目 | 値 |
|------|----|
| slug | `signal-stroke-relay` |
| accent | `#f0b25a` (warm amber) |
| context | `Theatre.js + SVG · Trim Relay` |
| dominant stack | Theatre.js + SVG (with Framer Motion secondary) |
| feature dir | `apps/web/src/features/motion/reference-works/signal-stroke-relay/` (13 files) |
| Surface | `SignalStrokeRelaySurface.tsx` (18k) — SVG stroke-dasharray trim animation, Theatre.js authoring |
| Phase metadata | Phase 1 (IMPLEMENTATION.md, 2026-04-10) |
| sidebar sections | Runtime / Extraction / Non-Goals (3、`techniqueFamily` field 不在のため Stack 省略) |
| viewport | 1440×540 (extreme wide, ~2.67:1) |
| fragile init | Theatre project state must load before authoring; Studio UI lazy-loaded |
| 視覚的記述 | リード線 → icon → title → 下線へ、Trim Path で線が信号として relay されるタイトルシーケンス。`Trim Paths` を主技法に置き、relay timing の grammar だけを狭く検証 |
| 編集適合性候補ポイント | Theatre.js authoring を主役に据えた唯一の作品で、journal の "authoring tool 観" を象徴できる。一方で Trim path は商業 portfolio で珍しくなく、独自性の検証が要 |

### No.02 — Staged Emphasis Payoff (Title sequence)

| 項目 | 値 |
|------|----|
| slug | `staged-emphasis-payoff` |
| accent | `#d96b6b` (red) |
| context | `SVG + DOM · Grapheme Stagger` |
| dominant stack | SVG + DOM text (no canvas, no GPU) |
| feature dir | `apps/web/src/features/motion/reference-works/staged-emphasis-payoff/` (含む `staged-emphasis-family/` + `benchmark-source/`) |
| Surface | `StagedEmphasisPayoffSurface.tsx` (9.6k) — grapheme-by-grapheme RAF DOM rendering |
| Phase metadata | Phase 3 (`phase3-validation-note.md`, 2026-04-11) — HTTP/1.1 200, 0 console errors, benchmark-comparison-note.md 同梱 |
| sidebar sections | Runtime / Stack / Extraction / Subject (旧 Phrase) / Non-Goals (5) |
| viewport | 1000×500 (2:1) |
| fragile init | Pure RAF loop; grapheme DOM rendering with explicit reducedMotionFrame |
| 視覚的記述 | "Inagawa" 駅名標を一字ずつ build → payoff hold → delayed disappearance。grapheme 単位で文字の出し方そのものを設計 |
| 編集適合性候補ポイント | benchmark-source 同梱 (実在する駅名標 motion との一致を検証済) で「first-source benchmark pass」を主張できる。Phase 3 の最も documentation 整備された作品 |

### No.03 — Boiling Poster Aperture (Reveal)

| 項目 | 値 |
|------|----|
| slug | `boiling-poster-aperture` |
| accent | `#b85cba` (magenta) |
| context | `PixiJS · Aperture Reveal` |
| dominant stack | PixiJS (Application + Sprite + BlurFilter + DisplacementFilter + canvas-generated poster texture) |
| feature dir | `apps/web/src/features/motion/reference-works/boiling-poster-aperture/` (11 files) |
| Surface | `BoilingPosterApertureSurface.tsx` (5.9k) — PixiJS scene |
| Phase metadata | Phase 1 validation intent (no Phase number in IMPLEMENTATION.md) |
| sidebar sections | Runtime / Stack / Extraction / Non-Goals (4) |
| viewport | 1200×1600 portrait (内部で `max-w-[720px]` clamp) |
| fragile init | PixiJS Application/Renderer init; `Texture.from(createPosterCanvas())` 依存 |
| 視覚的記述 | 一枚絵の poster 上で boiling edge / mask gate / displacement reveal / secondary action を組み合わせ、「見せる瞬間」を主役にした aperture reveal |
| 編集適合性候補ポイント | poster grammar で完結する単独作。CRT 風 jitter + アパーチュア演出は editorial の "視覚的見せ場" として強い。portrait レイアウトは journal 内で唯一 |

### No.04 — Temporal Echo Residue (Reveal)

| 項目 | 値 |
|------|----|
| slug | `temporal-echo-residue` |
| accent | `#7a7af0` (indigo) |
| context | `PixiJS + WebGPU · Echo Trail` |
| dominant stack | PixiJS + WebGPU (24fps vs others 30fps; echo sample count=5, 2-frame step) |
| feature dir | `apps/web/src/features/motion/reference-works/temporal-echo-residue/` (含む `temporal-echo-residue-family/` + `benchmark-source/`) |
| Surface | `TemporalEchoResidueSurface.tsx` (6.9k) — PixiJS + WebGPU adapter negotiation, fallback to Canvas with warning |
| Phase metadata | Phase 3 (`phase3-validation-note.md`, 2026-04-11) — WebGPUREND ERER vs CANVASRENDERER の区別を明記 |
| sidebar sections | Runtime / Stack / Extraction / Subject / Non-Goals (5) |
| viewport | 960×? (landscape) |
| fragile init | WebGPU adapter negotiation; `rendererName` detection で fallback path |
| 視覚的記述 | lead cursor + 5 echo samples (taper 1.08, alpha decay)、time-offset stack で lyric/glyph residue の grammar を検証 |
| 編集適合性候補ポイント | journal 中で唯一の WebGPU 利用作。Phase 3 の最先端作品。WebGPU 対応を portfolio で主張する根拠になる |

### No.05 — Motif Loop Background (Ambient)

| 項目 | 値 |
|------|----|
| slug | `motif-loop-background` |
| accent | `#5cb88a` (green) |
| context | `PixiJS · Loop Phasing` |
| dominant stack | PixiJS (4×3 grid = 12 motifs, infinite loop, alpha clamp for readability) |
| feature dir | `apps/web/src/features/motion/reference-works/motif-loop-background/` (6 files) |
| Surface | `MotifLoopBackgroundSurface.tsx` (8.1k) — PixiJS scene, useSyncExternalStore for reduced-motion |
| Phase metadata | "Clamp Stable" status label (Phase 番号なし) |
| sidebar sections | Runtime / Stack / Extraction / Non-Goals (4) |
| viewport | 1440×960 (内部 motif clamped 420×600) |
| fragile init | PixiJS renderer init with explicit error handling (`setSceneError`) |
| 視覚的記述 | 12 motif grid に subtle translate/scale/rotate jitter、background wash + readability plate、ambient な背景動き |
| 編集適合性候補ポイント | 唯一の Ambient 作品 = 章を単独で支えている。前景に出ない設計上 hero impact が弱い可能性。journal 内では「背景表現の reference」として位置づけられる |

---

## 8. 排除済 (anchored-progress-resolve) — 参考

ユーザー判断で 06 として掲載していたが排除。ハンドオフの完全性のため記載:

| 項目 | 値 |
|------|----|
| slug | `anchored-progress-resolve` (削除済) |
| accent (旧) | `#3a8acd` (blue) |
| context (旧) | `SVG + DOM · State Machine` |
| dominant stack | SVG + DOM (no animation library) |
| chapter (旧) | `uiState` (この作品の排除と同時に章ごと消滅) |
| Phase metadata | embedded `phaseToneMap` (loading / waiting / resolve の internal 3 phases) |
| 排除理由 | "完成度が低い" (ユーザー判断、2026-04-27) |
| 削除した dir | route (`/journal/motion-studies/anchored-progress-resolve/`) と feature dir 完全削除 |

**復活させる場合** (もし精査で「実は他より優れていた」と判断したら): git history (`git show 2674cb9a:apps/web/src/features/motion/reference-works/anchored-progress-resolve/...` 等) から復元可能、ただし working tree からは消えているので `git restore` 必要。

---

## 9. 精査の論点 — 候補リスト (実装前にユーザー判断必要)

ユーザーへの提案で取り上げる選択肢の例:

### A. 個別作品の品質判定軸

各作品を以下の軸で再評価する:
- **完成度**: 演出は最後まで追い込まれているか？ rough edge / glitch がないか？ reduced-motion 対応は？
- **独自性**: 既存 portfolio や motion design の世界で同じ pattern が量産されていないか？ 千葉拓巳の signature と言えるか？
- **編集適合性**: journal の "ひとつの基準で扱う試み" という framing に収まるか？ technique 観点の learning value は？
- **技術主張**: WebGPU / Theatre.js / PixiJS / SVG+DOM のどの強み軸を支えるか？ portfolio 全体での技術の幅を示せるか？
- **視覚的 impact**: site visitor (potential client / collaborator) が初見で記憶するか？ "scrolling kill" されないか？
- **章バランス**: Title (2) / Reveal (2) / Ambient (1) は適切か？ 各章内の質の差は？

### B. 排除候補 / 入替候補 / 強化候補の特定

論点例:
- **B1**: Motif Loop Background は ambient で前景に出ない設計のため、editorial で hero impact が弱い可能性。Ambient 章ごと削るか、強化するか。
- **B2**: Boiling Poster Aperture と Temporal Echo Residue が両方 PixiJS 主軸で技術重複している可能性。どちらかに集約するか役割を明確化するか。
- **B3**: Signal Stroke Relay と Staged Emphasis Payoff は両方 Title sequence で重複に見える。違いを明示できるか、片方に集約するか。
- **B4**: Phase 1 validation 直後で documentation が薄い作品 (Boiling Poster Aperture など) は Phase 3 級の整備が必要か。
- **B5**: "Phase 2" 計画作品 (GSAP / Three.js 系) で一級の出来のものがあれば追加するか。

### C. 章再構成の選択肢

現在: Title (2) / Reveal (2) / Ambient (1) = 5 件、章間ペース不均等
- **C1**: 章を畳む (Ambient を Reveal に統合) → 2 章構成にして bias を明示
- **C2**: 章を増やす (Title 2 / Reveal 2 / Ambient 1 + 新章) → 6 件目を加えて均衡
- **C3**: 章を完全廃止 (Wave 5 以前の flat listing に戻す) → 5 件均一
- **C4**: 別軸での grouping (技法 / 制作年 / 表現 grammar 動詞)

### D. 順序 / keystone の再決定

- 現在: signal → staged → boiling → temporal → motif (Title-Reveal-Ambient 順)
- **D1**: keystone を Phase 3 (staged or temporal) に移す
- **D2**: keystone を最も完成度の高いもの (要評価) に置く
- **D3**: 制作時系列 (Phase 1 → 3) に揃える

### E. 競合 / benchmark との比較

精査の客観性を高めるため:
- **E1**: 著名な motion design portfolio (Active Theory / Tendril / Buck / FROG / etc.) との比較で各作品の位置づけ
- **E2**: Awwwards / FWA 受賞作との比較で完成度評価
- **E3**: Codrops / Codepen 等の reference 実装と比較して独自性測定

これらは独立論点。ユーザーと 1 件ずつ握ってから着手。

---

## 10. reference-works 構造とドキュメント所在

各 motion-study の意図 / 検証メモ / Phase 評価が散在しているため、精査時に参照すべき場所:

### 内部ドキュメント (work 別)
- `apps/web/src/features/motion/reference-works/signal-stroke-relay/IMPLEMENTATION.md` — Phase 1 validation
- `apps/web/src/features/motion/reference-works/boiling-poster-aperture/IMPLEMENTATION.md` — validation intent
- `apps/web/src/features/motion/reference-works/staged-emphasis-payoff/phase3-validation-note.md` — Phase 3 validation (HTTP 200, 0 console errors)
- `apps/web/src/features/motion/reference-works/staged-emphasis-payoff/benchmark-comparison-note.md` — first-source benchmark の比較メモ
- `apps/web/src/features/motion/reference-works/staged-emphasis-payoff/benchmark-source/` — 比較 source
- `apps/web/src/features/motion/reference-works/temporal-echo-residue/phase3-validation-note.md` — Phase 3 validation
- `apps/web/src/features/motion/reference-works/temporal-echo-residue/benchmark-source/` — 比較 source

### 共通の motion infrastructure
- `apps/web/src/features/motion/index.ts` — context + visibility hooks のみ export、registry は不在
- 共通 registry が無いため、phase / stack / metadata を一覧する正本は本書の §7 が現状唯一

### Phase 計画の出所
- `.ai/GLOBAL.md` — Phase 1 (Framer Motion) / Phase 2 (GSAP / Three.js) / Phase 3 計画 (portfolio 全体の motion stack roadmap)
- `apps/web/src/features/motion/reference-works/staged-emphasis-payoff/staged-emphasis-family/index.ts` — Phase 3 work 内部の family helper

---

## 11. 検証 commands (精査後の sanity check)

精査の結果、何かを変えた場合の確認手順:

```bash
# Lint (apps/web)
bun run --cwd apps/web lint
# baseline 43 problems (15 errors, 28 warnings) — 増えなければ OK

# Type check
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false 2>&1 | tail -10
# baseline は params-codec.test.ts:87 TS2352 のみ

# Routes (dev :3000 が稼働中の前提、redirect 込み)
for slug in signal-stroke-relay staged-emphasis-payoff boiling-poster-aperture temporal-echo-residue motif-loop-background; do
  echo "--- $slug ---"
  curl -sIL "http://localhost:3000/ja/journal/motion-studies/$slug" 2>&1 | grep HTTP | tail -1
done

# 排除済が確実に 404 のままか確認
curl -sIL "http://localhost:3000/ja/journal/motion-studies/anchored-progress-resolve" 2>&1 | grep HTTP | tail -1
# expected: 404 (再追加していない限り)
```

精査で個別 motion-study の Surface を検証する場合、その work の visual を browser で確認すること。reference works は Phase 1-3 で時期がばらけて実装されており、個別の挙動 (audio bus / GPU init / reduced-motion) が異なる。

### Visual references (Wave 5 で取得したスクリーンショット)
- `output/playwright/2026-04-27-wave5-journal-list.jpeg` — Wave 5 直後の list page (6 entries 時)
- `output/playwright/2026-04-27-wave5-journal-after-excision.jpeg` — 06 排除後 (5 entries 時、現状)
- `output/playwright/2026-04-27-wave5-detail-signal.jpeg` — Signal Stroke Relay detail
- `output/playwright/2026-04-27-wave5-detail-staged.jpeg` — Staged Emphasis Payoff detail

---

## 12. Reference docs / knowledge / memory

精査 session で必要に応じて参照:

### コードベース内
- **本書の元になった Wave 5 ハンドオフ**: `docs/renewal-2026/2026-04-27-journal-works-and-layout-reorganization-handoff.md` (§3 Hard constraints / §4 編集デザイン / §5-7 旧構造 / §10 reference docs)
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` — Wave 4-5 の commit 履歴と判断履歴
- `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md` — canvas 制約
- `.claude/knowledge/patterns/data-readability-shader-pipeline.md` — pipeline 拡張パターン
- `apps/web/messages/{ja,en}.json` の `journal` namespace — i18n source of truth
- `apps/web/src/app/[locale]/(portfolio)/journal/page.tsx` — list page 正本

### グローバル memory (cross-session)
- `~/.claude/projects/-Volumes-.../memory/MEMORY.md` — index
- `memory/feedback_no_css_scrim_for_readability.md` — 視認性改善時の禁止事項
- `memory/project_light_substrate_state.md` — site の現状

### plan files
- `~/.claude/plans/journal-docs-renewal-2026-2026-04-27-jou-imperative-globe.md` — Wave 5 の実行 plan (本書の前段)

---

## 13. 引き継ぎ checklist (新 session が最初に確認)

- [ ] このドキュメントを最後まで読んだ
- [ ] §3 の Hard constraints を理解した (motion-dot light 固定 / scrim 禁止 / Surface 内部不可侵)
- [ ] §4 の編集デザイン原則を内面化した (typography only / no panel / motion-dot は kinetic substrate / light single substrate / accent 使用所制限)
- [ ] §5 で Wave 5 + 06 排除の経緯を把握した
- [ ] §7 で 5 件の motion-study の inventory を理解した
- [ ] §8 で排除済 06 の存在と排除理由を認識した
- [ ] §9 で精査の論点候補を読んだ
- [ ] ブラウザで `/ja/journal` と 5 件の motion-studies を視覚把握した
- [ ] 精査の方向性をユーザーに確認した (§9 から選ぶか、ユーザー独自の構想か)
- [ ] dev server は port 3000 で稼働中 (落ちていれば `bun run --cwd apps/web dev`)
- [ ] 触ってはいけない領域 (Filmtone / Photography / motion-dot package / 各 Surface 内部) を理解した
- [ ] 検証 commands (§11) を把握した
- [ ] Wave 5 + 06 排除分は **未 commit / 未 push**。新 session 開始時にユーザーと commit 戦略を確認すること

---

## 14. 一行サマリー (毎回 chat 開始時に宣言する想定)

> **「`feat/renewal-2026-phase2-motion-dot` ブランチで `/journal` に掲載中の 5 件の motion-study (signal-stroke-relay / staged-emphasis-payoff / boiling-poster-aperture / temporal-echo-residue / motif-loop-background) を精査する。site は light single substrate (motion-dot canvas が `bgColor 0.82` を hardcode、Filmtone と Photography だけ dark identity)、装飾パネル / CSS scrim は禁止 (`data-readability` shader uniform で解決)、editorial DNA は Wave 5 で 6 件の detail page まで統合済。Wave 5 + 06 (anchored-progress-resolve) 排除分は未 commit。精査の方向性 (個別品質再評価 / 入替 / 追加 / 章再構成 など) はユーザー判断に従う。実装より先に判断を握る。」**

これでハンドオフ完了。次 session は §0 → §3 → §4 → §7 → §9 → ユーザーと方向性合意 → 検証 / 実装、の流れで進めること。

---

## Appendix A — 排除済 anchored-progress-resolve の git からの復元手順 (参考)

万一精査の結果「実は 06 のほうが他より優れていた」と判断した場合の復元:

```bash
# まだ commit していない状態なので、index と working tree の両方から消えている
# 一つ前の状態 (HEAD = 2674cb9a) には残っている

# route と feature dir を一括復元
git checkout HEAD -- apps/web/src/app/\[locale\]/\(portfolio\)/journal/motion-studies/anchored-progress-resolve/
git checkout HEAD -- apps/web/src/features/motion/reference-works/anchored-progress-resolve/

# その後 list page / sitemap / i18n に entry を再追加 (Wave 5 完了直後の状態は git show でも見れる)
# ja.json / en.json の anchoredProgressResolve / chapters.uiState を復活
# motionStudies array に { key: "anchoredProgressResolve", slug: "anchored-progress-resolve", accent: "#3a8acd" } 追加
# motionStudyChapters に { id: "uiState", slugs: ["anchored-progress-resolve"] } 追加
# MotionStudyEntry / MotionStudyChapterId の union 型に追加
# sitemap.ts の motionStudySlugs に "anchored-progress-resolve" 追加
```

ただし排除はユーザーの明示判断なので、復元判断にも同等の判断重みが必要。

---

## Appendix B — Wave 5 + 06 排除の commit 戦略 (未実施)

ユーザーが commit を希望した場合の推奨:

5 commits (Wave 5 plan の commit strategy + 06 排除を 1 commit 追加):
1. `feat(journal): seed i18n keys for chapter regroup and detail-page DNA`
2. `feat(journal): chapter regroup` (list page)
3. `refactor(motion-studies): editorial DNA migration B` (signal/staged/boiling)
4. `refactor(motion-studies): editorial DNA migration C` (temporal/motif/anchored)
5. `chore(motion-studies): drop orphan fixtures.copy wrappers`
6. `feat(journal): excise anchored-progress-resolve` (06 排除)

または 2 commits まとめ:
1. `feat(journal): editorial coherence pass — chapter regroup + 6 detail pages migrated to editorial DNA`
2. `feat(journal): excise anchored-progress-resolve`

または 1 commit:
1. `feat(journal): wave 5 — editorial coherence pass + curate to 5 motion studies`

push は `feat/renewal-2026-phase2-motion-dot` ブランチ上で行う。push の判断はユーザーに任せる。
