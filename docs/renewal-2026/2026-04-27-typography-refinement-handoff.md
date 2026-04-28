# Typography Refinement Handoff — 2026-04-27

> 次の chat で **`/journal` を中心としたサイト全体のタイポグラフィを「洗練されたもの」に改善する計画** を進めるための完全引き継ぎドキュメント。
> 本ドキュメント単体で別 chat に投げ込めば、過去の経緯を読み返さずに作業継続できるよう、現状・前提・制約・観察・選択肢をすべて自己完結で書き起こしている。

---

## 0. このドキュメントを開いた人へ（最初に読む 30 秒）

- **ブランチ**: `feat/renewal-2026-phase2-motion-dot`
- **ベース commit（このドキュメント時点）**: `f8b8e206 feat(hero): switch readability to immersive — restore motion-dot purity`
- **ゴール**: `/journal` の typography を、Supreme/Saint-Laurent 系の "fashion editorial display" 寄りの言語に磨き、サイト全体（works/about/contact 等）まで波及させる
- **品質基準（ユーザー方針）**:
  - 本質の進行を最優先、外殻は最小限
  - 保守的な意見ではなくプロダクト品質を最優先
  - dual identity (Fullstack Engineer × Creative Director) を typography で語り分ける
  - "Moving Postcard" の語彙を維持（編集的・情景的・控えめだが意図がある）

---

## 1. 本セッションの直近変更（前提コンテキスト）

`/journal` 改善の前段として、Hero（home）の typography を整える作業をこの chat で済ませた。同じ判断軸が `/journal` にもそのまま適用できる。

### 4 連コミット（順序通り）

| # | commit | 内容 |
|---|---|---|
| 1 | `b3d75f04` | `feat(hero): swap title to italic Jost wordmark + remove glass panel` — Hero title を Jost-800 Italic ベーキング SVG に置換、`EditorialSection glass` を撤去して plain `<section>` に |
| 2 | `6d973d49` | `feat(hero): update role to Fullstack Engineer / Creative Director, switch eyebrow from mono to refined sans` — `font-mono tracking-[0.32em]` → `font-sans font-medium tracking-[0.18em]`、role 文言修正 |
| 3 | `64bd241a` | `chore(theme): drop body::after film-grain wash` — 全画面に被さっていた `opacity:0.04 mix-blend-mode:multiply` の SVG fractal noise 層を削除 |
| 4 | `f8b8e206` | `feat(hero): switch readability to immersive — restore motion-dot purity` — Hero section の `data-readability` を `focus`(0.42) → `immersive`(1.0) に変更し motion-dot を full intensity に |

### この session で確定した判断（typography に効くもの）

- **`font-mono` を caption/eyebrow に使うのはブランドミスマッチ**。Mono は dev-tool / コード・プロダクトの語彙で、Jost-800 Italic Heavy（Supreme 系 fashion display）と同居すると「コードコメント＋雑誌ロゴ」の不一致になる
- **代替の正解**: Geist Sans Medium、tracking 0.14〜0.22em、uppercase、11〜13px。Supreme/Saint-Laurent 系の caption リズム
- **CSS スクリム（`body::after` 等）で読みやすさを作らない**。`data-readability` shader uniform で motion-dot 側を tune するのが正解（feedback memory に明記済）
- **Hero と Nav は wordmark を別系統で保つ**:
  - Nav: Geist Sans Medium ベース「現代の紋」（modern kamon）
  - Hero: Jost-800 Heavy Italic ベース「editorial display」
  - 両者は意図的に別役割

---

## 2. 現状のフォントシステム（Single Source of Truth）

### 2.1 next/font で読込まれているフォント（`apps/web/src/app/fonts.ts`）

```ts
geistSans  → --font-geist-sans     (Geist Sans, latin)
geistMono  → --font-geist-mono     (Geist Mono, latin)
notoSansJP → --font-noto-sans-jp   (Noto Sans JP, weights 300/400/500/700, preload:false)
```

`apps/web/src/app/[locale]/layout.tsx` の `<html className={fontVariables}>` で適用。

### 2.2 CSS 変数による family stack（`apps/web/src/app/globals.css:46-49`）

```css
--font-family-sans: var(--font-geist-sans), var(--font-noto-sans-jp),
                    "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
--font-family-mono: var(--font-geist-mono), "SFMono-Regular", "Consolas", monospace;
```

Tailwind theme でも `--font-sans` / `--font-mono` として再公開。`body { font-family: var(--font-family-sans); }`。

### 2.3 ローカルバンドルされている OFL フォント（`apps/web/public/fonts/`）

| ファイル | 用途 | 現状の利用 |
|---|---|---|
| `Jost-800-HevyItalic.otf` | Supreme 系 Heavy Italic | **Hero wordmark にベイク済**（runtime 読込なし）+ /experiments/wordmark で opentype.js が runtime load |
| `Inter-ExtraBold.woff` | Saint Laurent 系 | /experiments/wordmark のみ |
| `HankenGrotesk-BlackItalic.woff` | HBA 系 | /experiments/wordmark のみ |
| `BebasNeue-Regular.ttf` | display logo standard | /experiments/wordmark のみ |

**重要:** これら 4 つは **CSS `@font-face` 経由では一切読込まれていない**。/experiments/wordmark での opentype.js による font 解析と Three.js 描画専用。サイト本体の typography ではアクセス不可。

### 2.4 ベイクされた SVG ワードマーク

| field | 用途 | font 由来 | 出力 |
|---|---|---|---|
| `portfolioData.branding.wordmark` | Nav の compact monogram + wordmark | Geist Sans Medium / Light（字形改変済） | inline SVG paths（`apps/web/scripts/build-wordmark.ts` 出力） |
| `portfolioData.branding.wordmarkItalic` | Hero h1 | Jost-800 Heavy Italic | inline SVG paths（`apps/web/scripts/build-italic-wordmark.ts` 出力、本 session 新規） |

### 2.5 Tracking / Weight トークン（`globals.css:60-79`）

```css
--tracking-ultra-tight: -0.06em;   /* Hero 用 */
--tracking-tighter:     -0.04em;
--tracking-tight:       -0.02em;
--tracking-normal:       0;
--tracking-wide:         0.1em;
--tracking-wider:        0.2em;    /* Meta lines */

--weight-ultra-light: 200;  --weight-light: 300;
--weight-normal:      400;  --weight-medium: 500;
--weight-semibold:    600;  --weight-bold: 700;
--weight-ultra-bold:  800;
```

**Geist Sans の実効ウェイト:** Geist は variable font だが、`Geist({...})` 経由で読込んでいるため Medium/Bold 等の中間ウェイトはすべて利用可能（ただし重量を増やすほど preload されない）。

### 2.6 Text 色トークン

```css
--text-base:        var(--slate-12);   /* near-black on light substrate */
--text-muted:       var(--slate-11);
--text-base-90/80/70/60/50/40/30/20    /* opacity variants */
--heat-subtle/medium/intense           /* warm amber accent (color-mix) */
--accent-amber1                         /* primary orange accent */
```

---

## 3. `/journal` 現状監査

### 3.1 ファイル

```
apps/web/src/app/[locale]/(portfolio)/journal/
├─ page.tsx                                          ← 一覧（hero + Motion Studies index）
└─ motion-studies/
   ├─ staged-emphasis-payoff/page.tsx
   ├─ temporal-echo-residue/page.tsx
   ├─ signal-stroke-relay/page.tsx
   └─ boiling-poster-aperture/page.tsx
```

### 3.2 `journal/page.tsx` のタイポグラフィ階層（line 番号は本ドキュメント時点）

| 役割 | line | クラス（抜粋） | フォント |
|---|---|---|---|
| Hero eyebrow ("NOTES & STUDIES") | 83 | `font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--text-base-60)]` | **Geist Mono** |
| Hero title "Journal" | 86 | `text-[clamp(3.5rem,11vw,7rem)] font-medium leading-[0.95] tracking-[-0.04em]` | Geist Sans Medium |
| Hero description | 89 | `text-[1.25rem] leading-[1.7] text-[var(--text-muted)]` | Geist Sans Regular（CJK は Noto Sans JP） |
| Body intro | 103 | `text-[1rem] leading-[1.85] text-[var(--text-base-80)]` | Geist Sans / Noto Sans JP |
| Section eyebrow ("REFERENCE WORKS") | 117 | `font-mono text-[10px] uppercase tracking-[0.32em]` | **Geist Mono**（heat color） |
| Section title "Motion Studies" | 122 | `text-[clamp(2rem,5vw,3rem)] font-medium tracking-[-0.025em]` | Geist Sans Medium |
| Section intro | 125 | `text-[0.95rem] leading-[1.7]` | Geist Sans / Noto Sans JP |
| Study no. label "No. 01" | 141 | `font-mono text-[10px] uppercase tabular-nums tracking-[0.25em]` | **Geist Mono** |
| Study slug "STAGED-EMPHASIS-PAYOFF" | 146 | `font-mono text-[10px] uppercase tracking-[0.22em]` | **Geist Mono** |
| Study title (h3) | 150 | `text-[clamp(1.5rem,3.4vw,2.25rem)] font-medium tracking-[-0.02em]` | Geist Sans Medium |
| Study context "DOM · GRAPHEME STAGGER" | 153 | `font-mono text-[10px] uppercase tracking-[0.24em]` | **Geist Mono** |
| Study summary | 156 | `text-[0.95rem] leading-[1.75]` | Geist Sans / Noto Sans JP |
| CTA "→ 開く" | 159 | `font-mono text-[10px] uppercase tracking-[0.22em]` | **Geist Mono** |
| Sidebar "Contents" / "Edition" | 174,200 | `font-mono text-[10px] uppercase tracking-[0.28em]` | **Geist Mono** |
| ToC items | 182 | `font-mono text-[11px] uppercase tracking-[0.18em]` | **Geist Mono** |
| Edition meta | 203 | `font-mono text-[10px] tracking-[0.18em]` | **Geist Mono** |

### 3.3 観察された問題（Hero と同じ症状）

1. **`font-mono` 過多** — eyebrow / 番号 / slug / context / CTA / sidebar すべてが Geist Mono。「dev portfolio の caption 言語」が支配的。Hero で抜けたミスマッチが /journal で全開
2. **tracking-[0.32em]** — aggressive。Saint-Laurent / Supreme の caption は 0.10〜0.18em が一般的。今のは 1990s editorial / vintage analog 寄りでブランドの方向と合致しない
3. **タイトル "Journal" は Geist Sans Medium** — クリーンだが display としての character（個性）がない。Hero の Jost italic と並ぶと「Hero だけ display で /journal は body 拡大版」に見える。階層の差別化が弱い
4. **serif が一切ない** — body editorial の余韻を出す language が unavailable
5. **CJK と Latin の混植** — Geist Sans → Noto Sans JP の fallback 順だが、混植時の x-height / metric 整合は未調整。Title size でズレが目立つ可能性
6. **アクセント色の使い方** — study ごとに `accent: "#d96b6b"` などをインラインで使用。色相は良いが、各 study で 4 色独立はやや散漫

### 3.4 関連 i18n 文字列

`apps/web/messages/{ja,en}.json` の `journal` namespace。display side で改行制御や強調マーカー（マル囲み数字、長音、カギ括弧）を typography 側で扱うかは別トピック。

---

## 4. 検討すべき改善方向性（次 chat で議論する選択肢）

### 軸 A: caption/eyebrow をどう扱うか
- **A-1**: `font-sans font-medium tracking-[0.18em]` に統一（Hero と同じ判断を全面適用）。最小破壊
- **A-2**: caption 専用に **Inter ExtraBold** を `@font-face` で系列追加（Saint-Laurent 寄り、Geist より硬い）
- **A-3**: caption 専用に **Söhne / GT America 系の有償 sans** を導入（最高品質だが license コスト）

### 軸 B: display を Geist で続けるか、Jost を system に昇格するか
- **B-1**: Geist Sans Medium のまま、サイズ/トラッキングだけ tune（コスト最小）
- **B-2**: **Jost (regular weight) を `@font-face` 経由で system font に昇格** → /journal hero "Journal" を Jost で組む → Hero の italic と family レベルで呼応
- **B-3**: **編集 serif を新規導入**（Migra Italic / PP Editorial New Italic / Hoefler Text 風）→ display は serif、body は sans の二段構成（雑誌編集の典型語彙）

### 軸 C: body editorial の余韻
- **C-1**: 現状維持（Geist Sans）
- **C-2**: long-form 引用や motion-study 詳細ページの本文だけ serif（Iowan Old Style / IBM Plex Serif / Source Serif 4 等の OFL serif）
- **C-3**: body は sans のまま、ただし **CJK 側を Noto Sans JP → Yū Gothic / Tsukushi A Old Mincho** に切替検討（macOS bundled なので追加コストゼロ、CJK editorial 寄りに）

### 軸 D: 階層の垂直リズム
- 現状は h1 7rem / h2 3rem / h3 2.25rem / body 1rem。modular scale が 2× 〜 1.5× で揃ってない。**Major Third (1.250) / Perfect Fourth (1.333) / Golden (1.618) のいずれかで再設計** することで階層の説得力が増す

### 軸 E: 数字（番号 / 年号 / Vol 表記）
- 現状 `font-mono tabular-nums`。**display で `text-[var(--text-base)]` の Geist Sans tabular-nums + tracking-[-0.01em]** に切替えると編集ぽい威厳が出る（雑誌の vol/page 表記の語彙）

### 軸 F: `tracking` トークンの再設計
- 既存トークン (`--tracking-ultra-tight` 〜 `--tracking-wider`) は値域はあるが、editorial display 用の 0.14〜0.22em の細分化がない。`--tracking-eyebrow / --tracking-caption / --tracking-meta` のような **意味論的トークン** にリファクタすると改修が一括化できる

---

## 5. 制約・前提（壊してはいけないもの）

| 領域 | 前提 |
|---|---|
| substrate | site 全体は light substrate（`#D2D2D2`）。dark identity 保持は **Filmtone (`.dark` scope) と Photography (`body:has(.photography-page)`)** のみ |
| motion-dot | canvas は `bgColor [0.82,0.82,0.82,1]` をハードコード。light 前提でしか整合しない |
| readability | shader uniform `--motion-dot-readability` (focus 0.42 / reading 0.20 / immersive 1.0) で dim 制御。CSS scrim は禁止 (`feedback_no_css_scrim_for_readability.md` 参照) |
| Nav wordmark | Geist Sans Medium ベース「現代の紋」を維持（commit `b3d75f04` で Hero と分離済） |
| Hero wordmark | Jost-800 Heavy Italic ベイクを維持（`branding.wordmarkItalic`） |
| /experiments/wordmark | typography R&D 環境。本番 typography とは別扱いで温存 |
| パッケージマネージャ | **bun**（`npm` 禁止）。font 追加時も `bun add` |
| ビルドスクリプト規約 | OFL font のベイク = `apps/web/scripts/build-*.ts`（既存 `build-wordmark.ts` `build-italic-wordmark.ts` のパターンを踏襲） |
| 出力先規約 | `.cache/*.json` はインポート用、`public/brand/*.svg` は standalone artifact |
| i18n | `apps/web/messages/{ja,en}.json` の namespace 構造を保つ。typography 改修で文字列は触らない |
| CJK 注意点 | `text-wrap: balance` 不可（CJK で不自然な折返し）、`ch` ではなく `em` で幅制限、`word-break: auto-phrase` で日本語フレーズ境界 — 既存ナレッジ `.ai/knowledge/cjk-typography-pitfalls.md` 必読 |

---

## 6. 重要参照ファイル（次 chat で最初に読むべき場所）

### 6.1 typography 設計の中枢

```
apps/web/src/app/fonts.ts                                  # next/font の読込
apps/web/src/app/globals.css                               # font tokens / tracking / weight
apps/web/src/app/[locale]/layout.tsx                       # <html className={fontVariables}>
apps/web/src/shared/data/portfolio.ts                      # branding.wordmark / wordmarkItalic
apps/web/scripts/build-italic-wordmark.ts                  # OFL → SVG ベイクの最新パターン
apps/web/scripts/build-wordmark.ts                         # 既存 Geist 改変版パイプライン
```

### 6.2 /journal 関連

```
apps/web/src/app/[locale]/(portfolio)/journal/page.tsx                                    # 一覧
apps/web/src/app/[locale]/(portfolio)/journal/motion-studies/{slug}/page.tsx              # 4 件の詳細
apps/web/messages/ja.json  (journal namespace)
apps/web/messages/en.json  (journal namespace)
```

### 6.3 Hero（参考になる前例）

```
apps/web/src/features/hero/components/AmbientHomeHero.tsx                                 # 本 session 改修済
apps/web/src/features/hero/components/HomeHero.tsx                                        # 旧 Hero (現在は未使用、commit 内に残置)
```

### 6.4 グローバルナレッジ

```
~/.claude/projects/.../memory/MEMORY.md                    # 過去 session の決定事項
.ai/knowledge/cjk-typography-pitfalls.md                   # CJK 罠
.ai/knowledge/gsap-ease-syntax.md
.ai/knowledge/hero-shader-visibility.md
.ai/knowledge/scroll-trigger-pitfalls.md
.claude/knowledge/patterns/data-readability-shader-pipeline.md   # readability uniform pipeline
.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md
```

### 6.5 既存 handoff（参考）

```
docs/renewal-2026/2026-04-27-text-readability-handoff.md
docs/renewal-2026/2026-04-27-hero-wordmark-tier2-result-handoff.md
docs/renewal-2026/2026-04-27-hero-wordmark-tuning-handoff.md
```

---

## 7. 推奨アプローチ（次 chat 開始時の出発点として）

私（Claude）が次の chat で最初に提案するなら、こうする。**ユーザーは別案を選ぶ自由がある** が、開始点として書き残す。

### Phase 1（最小で効くもの、〜1 commit）
1. `/journal` 内の **`font-mono` を全面廃止**、Hero と同じ `font-sans font-medium` + tracking 0.18em ベースに置換
2. tracking トークンを意味論化（`--tracking-eyebrow: 0.18em` など）して global で使う
3. `text-wrap: balance` 含む CJK pitfall の有無を確認

### Phase 2（display の格上げ、〜1 commit）
1. Jost (Regular / Medium) を `@font-face` で system font に昇格
2. /journal の "Journal" / "Motion Studies" など **display 系を Jost に切替**（italic ではなく upright で hero との差別化）
3. study title (h3) は Geist Sans Medium のまま据置（読みやすさ優先）

### Phase 3（垂直リズムの再設計、〜2 commit）
1. modular scale を Major Third / Perfect Fourth から選定し、`--type-display-* / --type-heading / --type-body / --type-caption` をリビルド
2. design-system package （`@chibatakumi/design-system/tokens/typography`）と整合
3. /journal の clamp 値を新 scale で書き直し

### Phase 4（CJK editorial の磨き、〜1 commit）
1. CJK font stack を再評価（Noto Sans JP weight 300 が pre-load されてない問題含む）
2. h1/h2 の CJK 高さ補正（`font-feature-settings: "halt"` / `text-spacing-trim` 等）
3. 必要なら CJK 専用 `@font-face` で **Yu Gothic / Hiragino Mincho ProN** を front-loaded に

### Phase 5（works/about/contact への波及）
- Phase 1〜4 で確立したルールを残りページに適用

---

## 8. 動作確認の前提

- 開発: `bun run dev`（port 3000）
- Chrome MCP 経由のスクリーンショット & DOM 検査が利用可能
- localhost:3000 dev server は **本 session 終了時点で稼働中**（再起動が必要なら `apps/web` で `bun run dev`）
- /experiments/wordmark で Jost / Inter / Hanken / Bebas を opentype.js 経由で実画面比較できる

---

## 9. 次 chat への引き継ぎ要約（30 秒で読める版）

> Hero は本日 italic Jost ベイク + glass 撤去 + film-grain 撤去 + readability immersive で「Moving Postcard 純度」を回復した。
> 同じ品質基準を /journal にも横展開したい。
> /journal は **`font-mono` 過多** が最大の論点。Hero で抜いたミスマッチがそのまま残っている。
> Geist Mono caption を `font-sans font-medium tracking-[0.18em]` に置換する Phase 1 だけで visual quality は大きく上がる見込み。
> 余裕があれば Jost を system font に昇格して display と body の階層を Jost upright × Geist Sans body の二段構成にする（Phase 2）。
> serif 導入や modular scale 再設計は Phase 3 以降。
> 制約: light substrate / motion-dot canvas hardcode / data-readability shader uniform / Nav wordmark Geist 維持 / Hero wordmark Jost italic 維持 / bun。
