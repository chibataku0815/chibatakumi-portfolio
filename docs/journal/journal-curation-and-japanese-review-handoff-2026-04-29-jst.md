# Journal — キュレーションと日本語精査ハンドオフ

**作成日**: 2026-04-29 JST  
**前提**: portfolio リポ `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` (branch: `main`, HEAD: `b15a7997`)  
**目的**: 別チャットで `/journal/` セクションの (1) 日本語品質と (2) 記事キュレーション根拠 を精査するための完全な引き継ぎ。

---

## 0. 直前のセッションで起きたこと（今回の文脈）

### 0.1 トリガー

ユーザーがホームヒーローのスクリーンショットを提示し「タイポグラフィがいくらなんでも大きすぎる」と指摘。背景の WebGPU motion-dot シェーダーは静謐なのに、前景の "FULLSTACK ENGINEER / CREATIVE DIRECTOR / CHIBA TAKUMI" ロックアップが看板級にビューポートを埋め尽くしていた。

### 0.2 誤探索 → 訂正

最初に `HomeHero.tsx` を編集してしまったが、`/[locale]/(portfolio)/page.tsx` が描画しているのは `AmbientHomeHero.tsx` であることが判明（ローカル dev で変化なしの報告から発覚）。`HomeHero.tsx` の変更は元値（`max-w-[54rem]`）にリバート済み。

### 0.3 確定した修正

**ファイル**: `apps/web/src/features/hero/components/AmbientHomeHero.tsx`  
**コミット**: `b15a7997 fix(web): right-size home hero descriptor lockup`

```diff
-<div className="w-full max-w-[min(86rem,calc(100vw-3rem))] sm:max-w-[min(86rem,calc(100vw-5rem))] lg:max-w-[min(86rem,calc(100vw-8rem))]">
+<div className="w-full max-w-[min(32rem,calc(100vw-3rem))] sm:max-w-[36rem] lg:max-w-[44rem]">
   <h1 className="leading-none">
     <Image
       …
-      sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1024px) calc(100vw - 5rem), min(86rem, calc(100vw - 8rem))"
-      className="block h-auto w-full max-w-[86rem]"
+      sizes="(max-width: 640px) min(32rem, calc(100vw - 3rem)), (max-width: 1024px) 36rem, 44rem"
+      className="block h-auto w-full"
```

**結果**: lockup 幅 1376px → 704px (lg) ≒ 約半分。アスペクト比 9416:1502 (≒6.27:1) なので高さも比例で縮小。  
**未確定**: ユーザーがブラウザで visual diff を確認していない可能性。さらに小さくする / 戻すの両方が選択肢として残っている。

### 0.4 Worktree 状態（未クリーンアップ）

```
worktree list:
  /…/chibatakumi-portfolio                                        23ee9bd2 [main]   ← b15a7997 にコミット後の HEAD
  /…/.worktrees/filmtone-ios-code-residual                        bb1e5bc5 [feature/filmtone-ios-code-residual]
  /…/.worktrees/logo-lockup-home-20260428                         6e1cf2cb [feature/logo-lockup-home-20260428]
```

両 feature ブランチの tip は **既に main の ancestor** に含まれている（`git merge-base --is-ancestor` で検証済み）。つまり追加で merge すべき差分は無い。残作業は worktree ディレクトリと merge 済みブランチの削除のみ。ユーザーは「worktree を main にマージ」を要求したが、技術的には merge 不要。クリーンアップは未承認。

### 0.5 untracked のドキュメント（このセッション外）

```
docs/filmtone/filmtone-motion-180-baseline-industry-handoff-2026-04-29-jst.md
docs/filmtone/ios/filmtone-ios-lut-intensity-slider-handoff-2026-04-29-jst.md
```

別ストリームのハンドオフ。今回の主題と無関係。

---

## 1. 次のセッションの主題（精査対象）

ユーザーの主訴:

> 技術記事の部分日本語も微妙だし、内容もなぜそれらを選んだかも不明なので精査したい

訳すと 2 軸の懸念:

1. **日本語品質**: `/journal/` の見出し・要約・本文の日本語が「微妙」（不自然・読みにくい・翻訳調・テクニカル語の混在に一貫性がない、のいずれか／複数）
2. **キュレーション根拠**: なぜ "この 3 本 + モーション 4 本" が選ばれたか不明。選定基準・優先順位・除外したものの記録が無い

精査の出力イメージ:
- 各記事の JA 文を行単位でレビュー → 修正提案 or 全面リライト方針
- キュレーション根拠の言語化 → なぜこの組合せか、何を「次の wave」に回したか、何は永久に出さないか

---

## 2. リポジトリ・コードマップ（journal 関連のみ）

### 2.1 ルーティング (Next.js App Router, `/[locale]/(portfolio)/journal/`)

```
apps/web/src/app/[locale]/(portfolio)/journal/
  page.tsx                                           ← index (一覧)
  portfolio-renewal-2026/page.tsx                    ← 記事 1
  mobile-safari-touch-controller/page.tsx            ← 記事 2
  journal-typography-wordmark-system/page.tsx        ← 記事 3
  motion-studies/page.tsx                            ← motion studies index
  motion-studies/[slug]/page.tsx                     ← motion study 詳細 (動的)
```

i18n: `next-intl` の `getTranslations` / `setRequestLocale`。`[locale]` セグメントで `ja` / `en` を切り替え。

### 2.2 レジストリ（記事メタデータ）

**ファイル**: `apps/web/src/shared/data/journal.ts` （103 行）

```ts
export type JournalKind = "case-study" | "engineering-note" | "study" | "motion-study";
export type JournalStatus = "published" | "draft" | "hold";
export type JournalEvidenceLevel = "production" | "rnd" | "experimental";

export interface JournalEntry {
  readonly slug: string;
  readonly kind: JournalKind;
  readonly href: string;
  readonly publishedAt: string;
  readonly priority: number;
  readonly tags: readonly string[];
  readonly status: JournalStatus;
  readonly evidenceLevel: JournalEvidenceLevel;
  readonly related?: readonly string[];
  readonly demoHref?: string;
}

export const journalEntries: readonly JournalEntry[] = [ …3 entries… ];
export const motionStudyEntries: readonly JournalEntry[] = [ …4 entries… ];
```

**重要**: このレジストリには `priority` と `tags` はあるが、**「なぜこの記事を選んだか」のキュレーション根拠は記録されていない**。これがユーザー第二の問いの直接の出所。

### 2.3 翻訳メッセージ

```
apps/web/messages/ja.json   (1674 lines)
apps/web/messages/en.json   (1672 lines)
```

journal 関連は両ファイルの `journal` 名前空間配下:
- `journal.title` / `description` / `eyebrow` / `intro`
- `journal.indexLabels.*`
- `journal.entries.<slug>.*`        ← 各記事の eyebrow / title / summary / metaDescription
- `journal.motionStudies.entries.<slug>.*`
- `journal.articles.<slug>.sections[]`  ← **本文ブロック**（`heading` / `paragraph` / `code` / `callout` / `list`）

motion studies は `journal.articles` には載っていない（本文セクション 0）。**index と詳細 stub のみで本文が無い** = motion studies は未着手。

### 2.4 レンダリング層

```
apps/web/src/features/journal/
  article-blocks.ts          ← block 型定義（heading/paragraph/code/callout/list）
  JournalArticleBody.tsx     ← block 配列 → React レンダリング
  JournalArticleHeader.tsx   ← 記事ヘッダ
  JournalIndexCard.tsx       ← 一覧カード
  JournalIndexGroup.tsx      ← 一覧グルーピング
```

精査時のリライトはほぼ `messages/ja.json` の編集で完結する。コンポーネントを触る必要は基本ない。

---

## 3. 現在のキュレーション（事実関係）

**全エントリ `publishedAt: "2026-04-29"`** = 今日同時公開。コミット `b8353730 feat(journal): wave 1 — registry, articles, motion-studies hub` の "wave 1" が示すように、これは継続するシリーズの初回。

### 3.1 主記事 3 本

| # | slug | kind | priority | tags | evidence | summary |
|---|------|------|----------|------|----------|---------|
| 1 | `portfolio-renewal-2026` | case-study | 1 | WebGPU, Shader, Light Substrate, Editorial | production | サイト全体を 1 枚のライト面に統合した判断記録 |
| 2 | `mobile-safari-touch-controller` | engineering-note | 2 | iOS Safari, Visual Viewport, Layout | rnd | `visualViewport` を CSS 変数に降ろすプラミング |
| 3 | `journal-typography-wordmark-system` | study | 3 | Typography, Wordmark, SVG, Pipeline | rnd | Geist を彫って wordmark にする extract→modify→build |

**`related` 関係**: 1 ↔ 3 のみ相互参照。2 は孤立。

### 3.2 Motion studies 4 本（本文未執筆）

| # | slug | priority | tags |
|---|------|----------|------|
| 1 | `signal-stroke-relay` | 1 | Theatre, Cascade, Choreography |
| 2 | `staged-emphasis-payoff` | 2 | Pacing, Emphasis, Family |
| 3 | `boiling-poster-aperture` | 3 | Boil Field, Displacement, Reveal |
| 4 | `temporal-echo-residue` | 4 | Echo, Decay, Residue |

`ja.json` の `journal.motionStudies.entries.<slug>` に title / summary / metaDescription だけある。`journal.articles.<slug>` には載っていないので **本文ブロックが無い** = 詳細ページは要約だけで埋めている可能性が高い（要確認: `motion-studies/[slug]/page.tsx` がどう振る舞うか）。

### 3.3 セクション数（記事のボリューム）

```
portfolio-renewal-2026                   : 20 sections (heading 6, paragraph 10, code 2, callout 1, list 1)
mobile-safari-touch-controller           : 15 sections (heading 5, paragraph 6, code 2, callout 1, list 1)
journal-typography-wordmark-system       : 14 sections (heading 5, paragraph 5, list 2, code 1, callout 1)
motion-studies/*                         :  0 sections（未執筆）
```

---

## 4. 日本語品質の懸念点（具体例ベース）

`apps/web/messages/ja.json` の実サンプル（`journal` 名前空間より抜粋）。

### 4.1 一覧 intro

```
"intro": "作品の背景にある考えと、制作中の技術的な記録。コード・モーション・映像・写真をひとつの基準で扱おうとする試みです。"
```

**懸念**: 「ひとつの基準で扱おうとする試み」は意味は通るが冗長。"作品の背景にある考え" と "制作中の技術的な記録" は文として不揃い（前者は名詞句、後者も名詞句だが "制作中の" の係りが曖昧）。

### 4.2 記事タイトル

```
"title": "ライト・サブストレートに統一する — Renewal 2026 の実装と削ったもの"
"title": "iOS Safari の Visual Viewport を CSS 変数に降ろす"
"title": "Geist を彫り直して Wordmark にする — extract → modify → build パイプライン"
```

**懸念**:
- 「ライト・サブストレート」は中点で繋いだカタカナだが、本文では「ライト面」「単一のライト・サブストレート」と表記揺れ
- 「降ろす」は技術的暗喩としてやや強い（CSS 変数化の意）。読者が初見で意味を取れるかは要検討
- 「彫り直す」は wordmark の修飾としては印象的だが、英語版 "Carving Geist into a wordmark" の直訳調

### 4.3 本文サンプル（portfolio-renewal-2026 / 序盤）

```
"なぜライトに統一したのか"

"Renewal 2026 で最初に決めたのは、サイトの背景を 1 枚にすることだった。dark / light の二重モードでも、章ごとにテーマを切り替える運用でもない。単一のライト・サブストレートを土台に置き、その上で読み物・作品・モーションをすべて成立させる。"

"理由は技術側にある。背景の motion-dot は WebGPU で 60fps を切らないために、毎フレーム自前のクリアカラーを書き込む。そのクリアカラーは float 値で `[0.82, 0.82, 0.82, 1.0]` に直書きしている。サイト側がこれと食い違うと、スクロールの瞬間ごとに背景が二段階で点滅してしまう。"

"つまり、サイトを暗く出すという選択肢は、シェーダー側を書き直さない限り存在しない。これを「制約」と呼ぶか「方針」と呼ぶかは姿勢の問題で、自分は後者を選んだ。dark を出す価値より、ライトの 1 枚で全カテゴリを成立させるほうが、編集物として強かった。"
```

**懸念**:
- `motion-dot` `WebGPU` `float` `dark` `light` `data-readability` `scrim` `Liquid Glass chrome` などの英単語が地の文に混在。**フォーマット規則が無い**（イタリック / バッククォート / カナ表記、どれを使うかの基準が曖昧）
- 「自分は後者を選んだ」「編集物として強かった」のような文学的・主観的トーンと、技術的事実の記述が地続き → 慣れた読者には魅力だが、読者層を選ぶ
- 「dark を出す価値より、ライトの 1 枚で全カテゴリを成立させるほうが、編集物として強かった」は省略が多く、文意が一読では取りにくい
- 英語版（master と思われる）と並べると、JA は EN の意訳として成立しているが「日本語として独立して書かれた」感は薄い → ユーザーの「微妙」はここに来ている可能性が高い

### 4.4 EN/JA の関係（master/translation の方向性）

英文サンプル:
```
"Identity needed a carved wordmark, not a font. We took Geist Sans Medium as a base and re-cut A, K, C, T, H, B, M letterforms into SVG paths. An ongoing R&D piece — Jost still co-exists in the build, and we say so."
```

JA:
```
"個人の identity に必要だったのはフォントではなく彫られた wordmark だった。Geist Sans Medium をベースに、A・K・C・T・H・B・M を段ごとに改変して SVG パスに固める。Jost との共存を抱えたまま走らせている進行中の R&D。"
```

両者は意味としては並走しているが、JA は EN の sentence-by-sentence の影が見える（"We took … as a base and re-cut …" → "ベースに … 改変して固める"）。**どちらが先に書かれた master かは未確認** — git log と次セッションでの本人ヒアリングが必要。

---

## 5. キュレーション根拠の不在（事実）

レジストリ (`journal.ts`) と翻訳ファイルを読み切ったが、以下が **どこにも記録されていない**:

1. なぜ初回（wave 1）に「Renewal case study」「iOS visualViewport」「Wordmark pipeline」を選んだか
2. なぜ "production / rnd / rnd" の混合になったか（全部 production 寄せでも、全部 rnd でもなく）
3. motion studies が 4 本で、なぜ "stroke-relay / emphasis-payoff / boil-aperture / echo-residue" の 4 つか
4. wave 2 / wave 3 で何を出す予定か（"wave 1" と銘打った以上、設計があるはず）
5. **意図的に出さない / 出せない** 領域は何か（filmtone iOS の詳細? カラグレ? 商業案件?）

`evidenceLevel` (`production` / `rnd` / `experimental`) の運用基準も `journal.ts` の型定義にしか存在せず、ドキュメントが無い。

---

## 6. 精査時の具体的な問い（次セッションへ）

### 6.1 日本語品質の問い

- カナ／漢字／英字の混在ルールを言語化できるか？（例: API 名は backtick、概念語はカナ、固有名は英字、など）
- どの読者層を想定しているか？（同業者前提 / 一般エンジニア / 経営者・PM 兼業）→ それでトーンが決まる
- 「カットしたもの」「捨てた選択肢」を強調する文体は意図的か（読み物としての強度を取りに行っている）→ もしそうなら一貫性チェックの基準にできる
- EN と JA、どちらが master か。両方独立に書くのか、片方を翻訳元にするのか
- "編集物として強かった" のような literary な締めくくりは ブランドボイスとして残すか、技術記事の規範に寄せて整えるか

### 6.2 キュレーションの問い

- wave 1 の 3 本 + motion 4 本は、どの軸で選ばれたか？（直近の重要判断 / 再利用される技術 / 顧客が読む可能性）
- motion studies は本文未執筆だが、index に出してしまっている。これは "予告" として意図的か、それとも執筆漏れか
- 次の wave で出す候補リスト（"hold" ステータスの記事）はどこに保管するか — `journal.ts` に `status: "hold"` で並べるのか、別の backlog ファイルか
- 出さない領域（顧客機密、商業案件の内部、まだ発表できない実装）の境界線をどう書くか

---

## 7. 検証コマンド（次セッションが最初に走らせるもの）

```bash
# 1. リポ位置と branch
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
git status && git log --oneline -3
# → main, HEAD: b15a7997 fix(web): right-size home hero descriptor lockup

# 2. journal の中身を一望
python3 -c "import json; d=json.load(open('apps/web/messages/ja.json')); import sys, json as j; j.dump(d.get('journal', {}), sys.stdout, ensure_ascii=False, indent=2)" | less

# 3. 各記事のブロック構造
python3 - <<'PY'
import json
d = json.load(open('apps/web/messages/ja.json'))
for slug, art in d['journal']['articles'].items():
    print(f'\n== {slug} ==')
    for i, s in enumerate(art.get('sections', [])):
        t = s.get('type')
        preview = (s.get('text','')[:80] if t in ('paragraph','heading') else f'[{t}]')
        print(f'  {i:02d} {t:9s} {preview}')
PY

# 4. ローカル確認
cd apps/web && bun run dev
# → http://localhost:3000/journal （ja デフォルト）
# → http://localhost:3000/en/journal （EN）
```

---

## 8. 次セッションへの引き継ぎプロンプト（コピペ用・最高精度版）

> 以下を新規チャットの最初のメッセージにそのまま貼ると、別セッションがゼロから精査を始められます。

---

**[ここから次チャット用プロンプト]**

```
# Portfolio Journal — 日本語品質とキュレーション根拠の精査

## 前提

リポジトリ: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
Branch: main / HEAD: b15a7997 (前セッションで AmbientHomeHero の lockup 縮小をコミット)

完全な背景は次のドキュメントに整理済み。最初に必ず読み込むこと:
docs/journal/journal-curation-and-japanese-review-handoff-2026-04-29-jst.md

このドキュメントには以下が含まれる:
- 直前セッションの経緯（hero typography 修正、worktree 状態、untracked ファイル）
- /journal/ のルーティング・レジストリ・翻訳ファイル・レンダリング層のマップ
- 現在のキュレーション事実（主記事 3 本 + motion-studies 4 本、全 publishedAt 2026-04-29）
- 日本語品質の懸念ポイント（具体サンプル付き）
- キュレーション根拠の不在事実
- 精査時の問いリスト
- 検証コマンド一式

## このセッションでやること

ユーザーの主訴:
「技術記事の部分日本語も微妙だし、内容もなぜそれらを選んだかも不明なので精査したい」

精査は 2 軸:

### 軸 1: 日本語品質

対象: apps/web/messages/ja.json の `journal` 名前空間配下
  - journal.intro
  - journal.entries.<slug>.{eyebrow, title, summary, metaDescription}
  - journal.motionStudies.entries.<slug>.{eyebrow, title, summary, metaDescription}
  - journal.articles.<slug>.sections[]  (heading / paragraph / code / callout / list)

懸念候補（ハンドオフドキュメント §4 参照）:
- 英単語の地の文混在ルールが不明（バッククォート / イタリック / カタカナ化）
- 文学的トーンと技術的事実の混在
- 表記揺れ（「ライト面」「ライト・サブストレート」「単一のライト面」）
- EN と JA の master/translation 方向性が未確認

### 軸 2: キュレーション根拠

対象: apps/web/src/shared/data/journal.ts
  - 主記事 3: portfolio-renewal-2026 / mobile-safari-touch-controller / journal-typography-wordmark-system
  - motion 4: signal-stroke-relay / staged-emphasis-payoff / boiling-poster-aperture / temporal-echo-residue

懸念（ハンドオフドキュメント §5 参照）:
- レジストリにキュレーション根拠が記録されていない（priority と tags のみ）
- evidenceLevel (production/rnd/experimental) の運用基準もドキュメント無し
- "wave 1" を名乗る以上、wave 2 以降の予定があるはずだが backlog が無い
- motion studies は本文未執筆（journal.articles に載っていない）= 予告状態

## 進め方の提案

最初の応答で以下を順に実行してほしい:

1. 上記ハンドオフドキュメントを Read で読む
2. apps/web/messages/ja.json の journal 名前空間を読み、現状を自分の言葉で要約する
3. apps/web/src/shared/data/journal.ts を読み、レジストリ事実を確認する
4. ユーザーに以下を質問する（精査の前提を固めるため）:
   a. EN と JA、どちらが master か（独立執筆か翻訳か）
   b. 想定読者層は誰か（同業エンジニア / 一般 PM / クライアント）
   c. ブランドボイスとして文学的トーン（「自分は後者を選んだ」「編集物として強かった」など）は維持するか
   d. wave 2 以降の候補があるか、backlog はどこに置くか
   e. motion-studies の本文未執筆は意図的（予告）か、執筆漏れか
5. 質問への回答を受けてから、軸 1（日本語）と軸 2（キュレーション）のどちらから着手するかをユーザーに確認

## 守ってほしいこと（前セッションの方針）

- 本質の進行を最優先、外殻は最小限。保守的な意見は採らずプロダクト品質を優先
- 思考すべき箇所は sequential-thinking で考える
- 検索が必要なら gemini-search または web search を使う（記憶ベースで断言しない）
- 並列に走らせられる調査は同時に投げる
- 内部処理は英語、最終出力は日本語
- パッケージマネージャは bun
- Plan モードで設計 → ExitPlanMode で承認 → 実装、の順序を守る

精査の出力イメージ:
- 軸 1: ja.json の各文に対する diff 提案 or 全面書き直し方針 + 表記ルール（カナ／漢字／英字混在の運用基準）
- 軸 2: キュレーション根拠を journal.ts のコメント or 別 docs に言語化、wave 2 backlog の保管場所決定、motion-studies 未執筆の扱い決定

開始してください。
```

**[ここまで次チャット用プロンプト]**

---

## 9. 補足: このハンドオフを書いた根拠（再現性）

- `/journal/` の構造は以下のコマンドで確認:
  ```bash
  find apps/web/src -type d -name journal -o -name article*
  cat apps/web/src/shared/data/journal.ts
  cat apps/web/src/app/[locale]/(portfolio)/journal/page.tsx
  ```
- 翻訳の中身:
  ```bash
  python3 -c "import json; d=json.load(open('apps/web/messages/ja.json')); print(json.dumps(d.get('journal', {}), ensure_ascii=False, indent=2))"
  ```
- "wave 1" の文脈:
  ```bash
  git log --oneline | grep -i journal
  # 946a3b19 fix(journal): include translation namespace expansion missing from wave 1 commit
  # b8353730 feat(journal): wave 1 — registry, articles, motion-studies hub
  ```
- worktree のマージ状態:
  ```bash
  git merge-base --is-ancestor 6e1cf2cb HEAD && echo merged
  git merge-base --is-ancestor bb1e5bc5 HEAD && echo merged
  ```

このドキュメントは時間で陳腐化する。次セッションは必ず最初に `git log -3` と `git status` で現状を取り直すこと。
