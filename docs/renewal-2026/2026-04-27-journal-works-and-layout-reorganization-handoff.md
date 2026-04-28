# /journal 内の作例とレイアウト整理 — 引き継ぎ document

**作成**: 2026-04-27 JST
**作成 session**: Claude Opus 4.7 (Wave 4 完了直後)
**次 session の目的**: `/journal` 内の motion studies (作例 6 件) と editorial spread のレイアウトを整理する
**ブランチ**: `feat/renewal-2026-phase2-motion-dot`
**HEAD**: `2674cb9a` (push 未)

このドキュメントは **新規 chat に完全引き継ぎするための単一参照点** です。Wave 4 までの全経緯、site の前提制約、編集デザイン方針、現在の構造、触ってはいけない箇所、検証手順をすべて含みます。これを読めば追加の文脈収集なしで作業開始できます。

---

## 0. 次 session の最初にやること (TL;DR)

1. このドキュメントを最後まで読む
2. ブラウザで `http://localhost:3000/ja/journal` を開いて現状の editorial spread を視覚把握 (dev server は前 session 終了時点で稼働中。落ちていれば `bun run --cwd apps/web dev` で再起動)
3. 以下 6 つの motion-studies route を順に開いて作例の中身を把握:
   - `/ja/journal/motion-studies/signal-stroke-relay`
   - `/ja/journal/motion-studies/anchored-progress-resolve`
   - `/ja/journal/motion-studies/boiling-poster-aperture`
   - `/ja/journal/motion-studies/motif-loop-background`
   - `/ja/journal/motion-studies/staged-emphasis-payoff`
   - `/ja/journal/motion-studies/temporal-echo-residue`
4. **§3 の Hard constraints と §4 の編集デザイン原則を必ず守る**
5. ユーザーに整理の方向性を聞いてから着手 (作例の order / grouping / 削除追加 / 個別ページの統一感 / sidebar 構造など、複数解釈可能なため)

---

## 1. Goal of this hand-off

ユーザーは「`/journal` 内の作例とレイアウトを整理したい」と表明。具体的なスコープは未定。次 session で以下のいずれか (または複合) を扱う可能性:

- **6 件の motion-studies を整理**: 順序、グルーピング、削除/追加、Phase / 技法 (PixiJS / SVG+DOM / Theatre.js) 別の分類軸
- **editorial spread の構成**: 1fr + 280px sidebar の枠組みを保ちつつ、内側のリズム調整
- **Sidebar の Contents / Edition の見直し**: ToC の見せ方、masthead meta の追加情報
- **個別 motion-study route のレイアウト統一**: 6 件で構造がバラバラなら統一する
- **Hero と body の typography / readability tuning** をもう一段
- **新規エントリ (notes/articles 系) を motion-studies と並列に置く構造**

整理の **判断はユーザー駆動**。実装前に必ず方向性を擦り合わせること。

---

## 2. ブランチと commit 履歴 (Wave 4 完了状態)

`feat/renewal-2026-phase2-motion-dot` ブランチの直近 9 commit:

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

未 push。`.claude/tasks/ACTIVE-PARALLEL-TASK.md` の最上段に Wave 4 の詳細記録がある。

### 2.1 working tree 状態

modified (Wave 4 と無関係、放置可):
- `.claude/settings.local.json`
- `apps/web/src/app/[locale]/(portfolio)/experiments/{flow,grid}/client.tsx`、`experiments/page.tsx`
- `bun.lock`、`packages/motion-{flow,grid}/package.json`、`packages/motion-{flow,grid}/src/mount.ts`

untracked (Wave 4-3 中に書いた docs / knowledge / memory):
- `docs/renewal-2026/2026-04-27-journal-works-and-layout-reorganization-handoff.md` (= this file)
- `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md`
- `.claude/knowledge/patterns/data-readability-shader-pipeline.md`
- 他 Wave 3 / Liquid Glass / brand 関連の untracked docs / images / playwright screenshots (本 wave スコープ外)

**注意**: 次 session は「整理」が主目的なので、untracked / modified の片付けは優先度低い。新しい wave / commit に入る前に必要に応じて整理判断。

---

## 3. Hard constraints (絶対に守るルール)

### 3.1 motion-dot canvas は light substrate 固定

`packages/motion-dot/src/main.ts` 内で metaball pass の `bgColor` が `[0.82, 0.82, 0.82, 1.0]` (≈ `#D2D2D2`) で hardcode されている。site 全体は light editorial substrate **しか成立しない**。

dark にしたくなった時の対応は 2 通りしかない:
1. 該当ルートの shell に `.dark` class を付ける (Filmtone 方式: `.dark` scope で Radix `slate-dark` / `amber-dark` が活性化、`bg-[var(--slate-1)]` で dark bg)
2. ルート専用 CSS で canvas を `display: none` し独自 dark 背景を貼る (Photography 方式: `body:has(.photography-page)` で linear-gradient + canvas hide)

**`/journal` は portfolio route なので light substrate 一択。** dark に振りたい誘惑が出たら一度立ち止まる。

詳細パターン: `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md`

### 3.2 装飾パネル / glass scrim を貼らない

「視認性が足りない」と感じても、CSS で `::before` panel / `editorial-surface-flat` glass / 半透明 dark tint を被せる解は **使わない**。Wave 4-3 で実際に試して即 revert (`05d603ab` → `67599652`)、ユーザーから「境界線がはっきり見えるような感じは理想ではない」と明確な却下。

正しい解は `data-readability` shader pipeline の uniform tuning か、新しい uniform を pipeline に足すこと。詳細: §6 と `.claude/knowledge/patterns/data-readability-shader-pipeline.md`。

memory にも durable feedback として記録済: `feedback_no_css_scrim_for_readability.md`

### 3.3 触ってはいけないファイル / 領域

- `packages/motion-dot/*` — canvas 自体は WebGPU + 別 build pipeline で動作中。本 session の整理スコープ外
- `apps/web/src/app/globals.css` の Filmtone 関連 (`.fl-*` tokens、`.film-lab-*` classes、`.film-lab-liquid-glass`) — Filmtone shell の dark identity を支える、整理の対象外
- `apps/web/src/app/[locale]/(satellite)/*` (Filmtone / Photography satellite shells) — independent identity、portfolio 整理と無関係
- `apps/web/src/app/[locale]/(portfolio)/photography/*` — `body:has(.photography-page)` で独自 dark
- 別 commit 済の Wave 3 wrap (`07cede78` home hero、`e05aa2de` の旧 /journal wrap は Wave 4-2 で superseded だが他は触らない)

---

## 4. 編集デザイン原則 (Wave 4-2 で確立、今後継承)

ユーザーが Wave 4 進行中に明文化した方向性。Wave 4-2 の `922ad257` commit と現 `/journal page.tsx` がリファレンス実装。

### 4.1 typography hierarchy で勝負する

- `EditorialSection` wrapper、`.editorial-surface-flat`、glass panel、`.photography-*` decorative classes は **使わない**
- font-mono の caps eyebrow + clamp() 大見出し + 構造化された prose、で hierarchy を作る
- divider は border ではなく gradient hairline (`linear-gradient(90deg, transparent, rgba(0,0,0,0.22), transparent)`) で句読点を打つ
- card 装飾、border 囲み、影付きパネルは禁止

### 4.2 motion-studies = 編集の手本 (editorial DNA)

- `/photography` `/filmtone` は **商業 LP**。premium reference にしない
- editorial DNA は `/journal/motion-studies/[slug]` の 6 reference works
- そこに採用されている pattern: sidebar grid `grid-cols-[minmax(0,1fr)_320px]` (journal は 280px に縮めて使用)、mono eyebrow caps、clamp headline、structured prose、左 border accent / 縦割 list、glass panel 不在

### 4.3 motion-dot は kinetic substrate として残す

- canvas を消すのではなく、`data-readability` 属性で読書セクションでの energy を shader-side で減衰させる
- 「motion-dot を読む雑誌の表紙 + 編集ページ」が `/journal` のメタファ

### 4.4 accent color の使い方

各 motion-study に固有 accent (hex) を持たせている (§5.2 参照)。使い所は厳しく制限:

- ✅ entry No. 番号 (`No. 01` 等)
- ✅ 矢印 glyph
- ✅ sidebar Contents の番号
- ❌ card 装飾全体に色を流す
- ❌ background tint
- ❌ heading 色 (text-base = 黒で統一)

`heat-medium` (= `--accent-amber1` 経由 amber) は **Motion Studies header の eyebrow にだけ** 使う warm punctuation。entry accent (cool) と暖色 (warm) を意図的に対比させる構造。

### 4.5 site 全体は light single substrate (Wave 4-3 確定)

- `data-theme="dark|light"` 属性は廃止
- `:root` token は全て light 方向に解決
- Filmtone (`.dark` scope) と Photography (`body:has(.photography-page)`) のみ dark identity 保持
- detail: memory `project_light_substrate_state.md`

---

## 5. 現在の `/journal` 構造

### 5.1 ファイル: `apps/web/src/app/[locale]/(portfolio)/journal/page.tsx`

頭の構造 (実装は実ファイル参照):

```tsx
type MotionStudyEntry = {
  key: "signalStrokeRelay" | "anchoredProgressResolve" | ...;
  slug: "signal-stroke-relay" | "anchored-progress-resolve" | ...;
  accent: string;
};

const motionStudies: readonly MotionStudyEntry[] = [
  { key: "signalStrokeRelay",       slug: "signal-stroke-relay",       accent: "#f0b25a" }, // warm amber
  { key: "anchoredProgressResolve", slug: "anchored-progress-resolve", accent: "#3a8acd" }, // blue
  { key: "boilingPosterAperture",   slug: "boiling-poster-aperture",   accent: "#b85cba" }, // magenta
  { key: "motifLoopBackground",     slug: "motif-loop-background",     accent: "#5cb88a" }, // green
  { key: "stagedEmphasisPayoff",    slug: "staged-emphasis-payoff",    accent: "#d96b6b" }, // red
  { key: "temporalEchoResidue",     slug: "temporal-echo-residue",     accent: "#7a7af0" }, // indigo
] as const;
```

JSX の composition:

```
<main relative min-h-screen text-base>
  <article>
    <header data-readability="focus" class="hero-padding">
      <div max-w-6xl>
        eyebrow (mono caps) → h1 clamp(3.5..7rem) → description (max-w-44ch text-1.25rem)
      </div>
    </header>

    <section data-readability="reading" class="body-padding">
      <div max-w-6xl grid lg:grid-cols-[minmax(0,1fr)_280px] gap-y-16 lg:gap-x-20>
        <div>  {/* LEFT */}
          intro paragraph
          hr (gradient hairline)
          <header>
            eyebrow (heat-medium amber) → h2 (Motion Studies, clamp 2..3rem) → intro
          </header>
          <ol space-y-14>
            {entries.map}:  {/* per-entry block */}
              <Link data-transition>
                "No. {NN}" (entry.accent) | slug (mono mute)
                h3 (clamp 1.5..2.25rem, hover→black)
                context line (mono mute)
                summary paragraph (max-w-44rem, leading 1.75)
                arrow → "開く" (hover gap expand)
              </Link>
          </ol>
        </div>
        <aside lg:sticky lg:top-32>  {/* RIGHT */}
          Contents block: ToC linked to #slug anchors with accent number
          Edition block: Vol 01 / Updated 2026.04 / Studies {n}
        </aside>
      </div>
    </section>
  </article>
</main>
```

### 5.2 6 motion-studies の inventory

| No. | Key                        | Slug                          | Accent     | i18n title (ja)         | Context (i18n)                                |
|-----|----------------------------|-------------------------------|------------|-------------------------|-----------------------------------------------|
| 01  | `signalStrokeRelay`        | `signal-stroke-relay`         | `#f0b25a`  | Signal Stroke Relay     | Reference Work 01 · Theatre.js + Motion + SVG |
| 02  | `anchoredProgressResolve`  | `anchored-progress-resolve`   | `#3a8acd`  | Anchored Progress Resolve | Phase 1 · Work 03 · SVG + DOM                |
| 03  | `boilingPosterAperture`    | `boiling-poster-aperture`     | `#b85cba`  | Boiling Poster Aperture | Phase 1 · PixiJS Library-Fit                  |
| 04  | `motifLoopBackground`      | `motif-loop-background`       | `#5cb88a`  | Motif Loop Background   | PixiJS · Loop Phasing                          |
| 05  | `stagedEmphasisPayoff`     | `staged-emphasis-payoff`      | `#d96b6b`  | Staged Emphasis Payoff  | Phase 3 · Work 05 · SVG + DOM                  |
| 06  | `temporalEchoResidue`      | `temporal-echo-residue`       | `#7a7af0`  | Temporal Echo Residue   | Phase 3 · Work 06 · PixiJS                     |

**注意**: context フィールドの命名 (Phase / Work N / 技法) は完全に統一されていない (例: 03 は "Phase 1 · PixiJS Library-Fit" で Work 番号なし、04 は Phase なし)。**整理対象の候補**。

i18n source: `apps/web/messages/{ja,en}.json` の `journal.motionStudies.entries.{key}` namespace。

### 5.3 個別 motion-study route

各作例には dedicated route:
```
apps/web/src/app/[locale]/(portfolio)/journal/motion-studies/{slug}/page.tsx
```
6 件全て揃っている。実装は `apps/web/src/features/motion/reference-works/{slug}/...` の component を import して描画する pattern。

reference-works dir (slug 名):
```
apps/web/src/features/motion/reference-works/
├── anchored-progress-resolve/
├── boiling-poster-aperture/
├── motif-loop-background/
├── signal-stroke-relay/
├── staged-emphasis-payoff/
└── temporal-echo-residue/
```

各 work dir に Surface / config / fixtures / scene / evaluator が散在。**個別 work の構造にバラつきがある可能性大** — 整理の対象になり得る。

### 5.4 どこから「Phase」が来ているか

context 文字列の "Phase 1 / Phase 2 / Phase 3" は過去の作業フェーズ命名の名残。実際の Phase 定義は `.ai/` や Wave 1-3 のドキュメントで定義されているが、現在の `/journal` には Phase 軸での grouping は存在せず、フラットな No.01-06 listing になっている。整理時に Phase 軸で grouping するか、それとも技法軸 (PixiJS / SVG+DOM / Theatre.js) で分けるかは判断ポイント。

---

## 6. data-readability shader pipeline (視認性整理の正しい道具)

`/journal` は hero に `data-readability="focus"`、body section に `data-readability="reading"` が付与済 (commit `922ad257`)。これらの値は WebGPU shader composite に流れて canvas energy を smooth dim する。

### 6.1 現在の token 値 (commit `2674cb9a`)

```css
:root {
  --motion-dot-readability-default: 1;
  --motion-dot-readability-focus: 0.42;   /* hero copy */
  --motion-dot-readability-reading: 0.20; /* body prose */
}
```

`@property --motion-dot-readability` 登録 + `transition: --motion-dot-readability 0.6s var(--motion-ease-soft)` で smooth 補間。`useReadabilityRegions` hook が IntersectionObserver で section 入退場を検知し、`document.documentElement` に書き込み + JS module ref 経由で `LiquidGlassProvider` shader uniform に流す。

### 6.2 整理時に readability を再 tune する場合

数値変更だけなら `globals.css` の上記 3 行を編集して dev で確認 → commit。新しい値 (例 reading = 0.15 まで深める) を試す程度。

**新しい per-region 効果を足したくなった時の正解形**:
1. `@property --motion-dot-blur` (例) を `<number>` syntax で登録
2. `:root` に default 値、`[data-readability="..."]` に per-state 値
3. JS module ref を拡張、`useReadabilityRegions` で読む
4. shader composite pass に uniform 1 本追加して使う

CSS layer (scrim / panel / glass) で解こうとしない。

### 6.3 anti-pattern (rejected, 2026-04-27)

`05d603ab` で `[data-readability="focus|reading"]::before` に `backdrop-filter: blur` + tint を貼った → section 境界が hard edge として可視 → ユーザー却下 → `67599652` で削除。再提案禁止。

---

## 7. token / color reference (light substrate)

`globals.css` 内の semantic alias:

| Token                          | 解決値 (`:root` light scope)                  | 備考 |
|--------------------------------|-----------------------------------------------|------|
| `--bg-primary`                 | `#D2D2D2`                                     | canvas bgColor と同色 |
| `--bg-secondary`               | `#E8EAED`                                     | |
| `--fg-primary`                 | `#1A1A1A`                                     | body text base |
| `--fg-secondary`               | `#202124`                                     | |
| `--accent`                     | `#B86E00`                                     | amber-9 light deeper |
| `--bg-dark`                    | `var(--slate-1)` ≈ `#fcfcfd`                  | **vestigial 名前**, 16 ファイル参照 |
| `--text-base`                  | `var(--slate-12)` ≈ `#1c2024`                 | 主に dark text |
| `--text-base-{20..90}`         | slate-12 dark の opacity variant              | |
| `--text-muted`                 | `var(--slate-11)` ≈ `#60646c`                 | |
| `--accent-amber1`              | `var(--amber-9)`                              | warm accent |
| `--heat-medium`                | = `var(--accent-amber1)`                      | Motion Studies eyebrow に使用 |
| `--shadow-elev-1/2/3`          | rgba(0,0,0,0.10/0.12/0.16) light tune         | |
| `--shadow-glow-*`              | amber rgba (white→amber に flip 済)            | progress / pulse 用 |

`.dark` scope (Filmtone) では同 alias が dark scale に解決 (Radix scope chain)。journal は light scope だけ気にすればよい。

---

## 8. 検証 commands (整理後の sanity check)

```bash
# Lint (apps/web 範囲)
bun run --cwd apps/web lint
# baseline 43 problems (15 errors, 28 warnings) は既知 — 増えなければ OK

# Type check
apps/web/node_modules/.bin/tsc --noEmit --incremental false -p apps/web --pretty false 2>&1 | tail -10
# baseline は params-codec.test.ts:87 TS2352 のみ — 他が出たら fail

# Routes (dev :3000 が稼働中の前提、redirect 込み)
curl -sIL http://localhost:3000/ja/journal | grep HTTP
curl -sIL http://localhost:3000/en/journal | grep HTTP
curl -sIL http://localhost:3000/ja/journal/motion-studies/signal-stroke-relay | grep HTTP
# (同様に他 5 slug)
# 全て最終 200 が期待値

# motion-studies route 全 6 件巡回
for slug in signal-stroke-relay anchored-progress-resolve boiling-poster-aperture motif-loop-background staged-emphasis-payoff temporal-echo-residue; do
  echo "--- $slug ---"
  curl -sIL "http://localhost:3000/ja/journal/motion-studies/$slug" 2>&1 | grep HTTP | tail -1
done
```

整理過程で個別 motion-study の component を触る場合、その work の visual を browser で確認すること。reference works は Phase 1-3 で時期がばらけて実装されており、個別の挙動 (audio bus / GPU init / reduced-motion) を保つ必要がある。

---

## 9. 整理の方向性 — 候補リスト (実装前にユーザー判断必要)

ユーザーへの提案で取り上げる選択肢の例:

### A. 順序の整理
- 現状フラット No.01-06 (実装順)
- 案 A1: 制作時系列 (Phase 1 → Phase 3)
- 案 A2: 技法でグループ化 (PixiJS 系 / SVG+DOM 系 / Theatre.js 系)
- 案 A3: 表現の階層 (タイトル系 / 進捗 UI 系 / ポスター系 / 残像系)

### B. context 文字列の統一
現在バラバラ (`Reference Work 01 · ...`, `Phase 1 · Work 03 · ...`, `PixiJS · ...`)。
- 案 B1: `Phase X · Work NN · Stack` の形式に統一
- 案 B2: Phase 番号を捨てて `Stack · Topic` のようなシンプル形に
- 案 B3: 完全に自由形 (現状追認、統一しない)

### C. accent 色の調整
6 色 (amber/blue/magenta/green/red/indigo) は light substrate で全て視認可能だが、彩度バランスが不均一。light bg 向けに調整するか? それとも今の鮮やかさが motion-studies のシグネチャ?

### D. sidebar masthead の追加情報
現在 Vol / Updated / Studies count のみ。
- 案 D1: フィルター (技法 chip で entries を絞る)
- 案 D2: タグ (Pixi / SVG / Theatre.js)
- 案 D3: 何も足さず空気の量を保つ

### E. 個別 motion-study route のレイアウト統一
- 各 page.tsx の構造が work ごとにバラついている可能性が高い
- 整理対象: hero の format、context line、summary の置き方、playground の embed 形

### F. 新カテゴリの追加
- 「notes」「articles」みたいな text-only エントリ枠を作るか?
- 現状 Motion Studies しかない、journal の名前に対して content がモーション習作 6 件のみ

### G. Hero / readability の追加 tune
- focus 0.42、reading 0.20 から更に動かすか
- 新しい shader 効果 (blur / vignette) を data-readability pipeline に足すか

これらは独立の判断なので、ユーザーと 1 件ずつ握ってから着手。

---

## 10. 既知の積み残し / open questions

1. **`--bg-dark` という alias 名は誤解を招く** が rename は 16 ファイル touch なので deferred (Wave 4-3 で意図的に保留)。整理 wave で同時に rename するか別 wave に切るかは判断
2. **Filmtone layout の `(satellite)/filmtone/layout.tsx` JSDoc** に stale な `data-theme="dark"` 言及 (Wave 4-1 報告済、コメントのみ実害なし)
3. **`packages/design-system/src/tokens/index.ts` の `THEME` 説明コメント**: 旧 `[data-theme="dark"]` 言及残り (実害なし)
4. **untracked playwright screenshots / handoff docs** が大量 — 整理 wave 内で必要分だけ commit するか別途まとめて整理 commit するか

---

## 11. Reference docs / knowledge / memory

整理 session で必要に応じて参照:

### コードベース内
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` — Wave 4 の commit 履歴と判断履歴
- `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md` — canvas 制約
- `.claude/knowledge/patterns/data-readability-shader-pipeline.md` — pipeline 拡張パターン
- `.claude/knowledge/patterns/nav-active-state-startswith.md` — Nav 関連 (副次)
- `apps/web/messages/ja.json` `journal` namespace — i18n source of truth

### グローバル memory (cross-session)
- `~/.claude/projects/-Volumes-.../memory/MEMORY.md` — index
- `memory/feedback_no_css_scrim_for_readability.md` — 視認性改善時の禁止事項
- `memory/project_light_substrate_state.md` — site の現状
- `memory/logotype-pipeline.md` — logo / wordmark ロジック (副次)

### plan file
- `~/.claude/plans/radiant-riding-pascal.md` — Wave 4-3 の実行 plan (光 substrate 反転の詳細)

### Wave 4 元 plan (2-wave parallel)
- 元の Wave 4 plan (4-1 + 4-2 並列) は本 session の最初のメッセージ内に inline で存在。新 chat で読みたい場合はこのファイル経由で `git log -p 290a51f1` `git log -p 922ad257` で当時の意図を再構築できる

---

## 12. 引き継ぎ checklist (新 session が最初に確認)

- [ ] このドキュメントを最後まで読んだ
- [ ] §3 の Hard constraints を理解した (motion-dot light 固定 / scrim 禁止)
- [ ] §4 の編集デザイン原則を内面化した (typography only / no panel / motion-dot は kinetic substrate)
- [ ] ブラウザで `/ja/journal` と 6 motion-studies を視覚把握した
- [ ] 整理の方向性をユーザーに確認した (§9 から選ぶか、ユーザー独自の構想か)
- [ ] dev server は port 3000 で稼働中 (落ちていれば `bun run --cwd apps/web dev`)
- [ ] 触ってはいけない領域 (Filmtone / Photography / motion-dot package) を理解した
- [ ] 検証 commands (§8) を把握した
- [ ] commit 単位は小さく、`feat(journal):` `refactor(journal):` 系の prefix で

---

## 13. 一行サマリー (毎回 chat 開始時に宣言する想定)

> **「`feat/renewal-2026-phase2-motion-dot` ブランチで `/journal` 内の motion-studies (6 件) と editorial spread を整理する。site は light single substrate (motion-dot canvas が `bgColor 0.82` を hardcode、Filmtone と Photography だけ dark identity)、装飾パネル / CSS scrim は禁止 (`data-readability` shader uniform で解決)、editorial DNA は motion-studies reference works そのもの。整理の方向性 (順序 / 統一 / 分類軸) はユーザー判断に従う。」**

これでハンドオフ完了。次 session は §0 → §3 → §4 → ユーザーと方向性合意 → 実装、の流れで進めること。
