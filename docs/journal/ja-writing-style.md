# Journal — 日本語執筆スタイル

`/journal/` セクションの日本語の書き方を一箇所にまとめる。`apps/web/messages/ja.json` の `journal` 名前空間配下を書く・読む・直すときの基準。

最終更新: 2026-04-29 / 適用範囲: `journal.intro`, `journal.entries.<slug>.*`, `journal.motionStudies.entries.<slug>.*`, `journal.articles.<slug>.sections[]`

---

## 1. master-language ポリシー

- **JA は独立執筆**。EN は参考としてのみ読む。clause 順序や文の切り方は EN に従わない
- **両言語で完全に一致させるのは「事実」のみ**:
  - 数値、API 名、ファイルパス、CSS 変数名、commit hash
  - 採用した決定の中身（何を選び、何を捨てたか）
  - `sections[]` の配列長と各 block の `type` 順序
- **両言語で違っていてよいもの**:
  - 文の数（一文を二文に割る、二文を一文にまとめる）
  - 比喩や言い回し（"craft bar" → 別の比喩でも、概念が同じならよい）
  - 段落内の情報の登場順
- 既存記事の EN は wave 1 時点での master とみなす。EN を直すのは別タスク

### EN-master を維持しつつ JA を独立に書くとはどういうことか

NG（EN-master の翻訳調がそのまま残っている）:

> **EN:** "We took Geist Sans Medium as a base and re-cut A, K, C, T, H, B, M letterforms into SVG paths."
> **JA:** "Geist Sans Medium をベースに、A・K・C・T・H・B・M を段ごとに改変して SVG パスに固める。"

→ EN の "We took ... as a base and re-cut ..." の語順をなぞっている。「ベースに」「改変して」「固める」が一直線に並ぶ。

OK（独立に書き直した）:

> **JA:** "ベースは Geist Sans Medium。そこから A、K、C、T、H、B、M の 7 字を SVG パスとして抜き出し、ストロークやインクトラップを彫り直した。"

→ 主語と動詞の流れを日本語側で組み立て直している。事実（Geist Sans Medium / 7 字 / SVG パス / 彫り直し）は一致。

---

## 2. 想定読者

**デザイン系同業者 + テクノロジスト**。

- WebGPU / Shader / Visual Viewport / Theatre.js などの語は説明なしで使える
- ただし暗黙知をすべて前提にはしない。判断の理由は短くてもよいから書く
- クラフト感と編集物としての強度を許容する読者層。文学的トーンも有効に働く

---

## 3. 文体（口調）

- **常体（だ・である調）に統一**。記事内で ですます/だ である の混在は禁止
- 一人称は基本使わない。必要なら「自分」ではなく事実そのものを主語にする
  - NG: 「自分は後者を選んだ」
  - OK: 「後者を採用した」 / 「採用したのは後者」
- 受動表現は短く済むなら使う。冗長な「〜される〜される」の連鎖は避ける

---

## 4. 文学的トーン — ハイブリッドルール

**本文 paragraph は中立な技術語彙、callout / 章結び / 「もうひとつ」節は文学的トーンを許容**。

### 文学的トーンを残してよい場所

- `callout` ブロック
- 章末の最後の paragraph（次の見出しに渡す前の総括）
- 「もうひとつ」「次の波で書く」「背負った負債として」「予告なく塗り直すことになる」など、未完了・予告・自省を扱う節
- 各記事の最終 paragraph（記事を閉じる声）

### 本文 paragraph で避ける主観語

| 避ける | 言い換え（文脈による） |
|--------|------------------------|
| 自分は後者を選んだ | 後者を採用した |
| 編集物として強かった | 編集面での整合性が高かった / 編集物として成立した |
| 編集物として致命的 | 編集面で破綻する / レイアウトとして破綻する |
| 見るに堪えない | 視認性が著しく低下する / 写真が読めなくなる |
| 読み物として弱い | 読み物としての強度に届かない / 編集物としての密度が下がる |
| 結局いちばん壊れにくい | 経験上もっとも破綻しにくい |
| まだ自分のなかで決まっていない | 評価がまだ固まっていない |

### 残してよい修辞

callout や章結びでは以下は許容:

- 「これを『制約』と呼ぶか『方針』と呼ぶかは姿勢の問題だ」（callout のみ）
- 「背負った負債として明示しておく」（章結びのみ）
- 「次の波で書く」（予告 paragraph のみ）

---

## 5. 英単語のフォーマット規則

bare の英単語が地の文に散らばっている状態を解消する。以下の 4 区分で機械的に決める。

### 5.1 backtick で囲む（コード識別子）

すべての code identifier は prose 内でも `` ` `` で囲む。

- 関数・クラス・コンポーネント名: `` `useReadabilityRegions` ``, `` `BrandWordmark` ``
- CSS 変数 / 値: `` `--vvh` ``, `` `100vh` ``, `` `[0.82, 0.82, 0.82, 1.0]` ``
- ファイルパス: `` `apps/web/src/app/fonts.ts` ``, `` `extract-glyphs.ts` ``
- CSS セレクタ / 擬似要素 / 属性: `` `:root` ``, `` `::before` ``, `` `body:has(.photography-page)` ``, `` `data-readability` ``
- API / メソッド: `` `window.visualViewport` ``, `` `IntersectionObserver` ``

### 5.2 backtick で囲む（製品・技術・概念名）

prose に登場する以下の用語も backtick で囲む。これは **wave 1 時点での揺れを消すため** の規則。

- 技術仕様: `` `WebGPU` ``, `` `WebGL2` ``, `` `Visual Viewport` ``
- ライブラリ・実装名: `` `motion-dot` ``, `` `Theatre.js` ``, `` `data-readability` ``
- 自前の概念: `` `Liquid Glass` ``, `` `light substrate` ``（カタカナ表記もある、§6 参照）
- ファイルフォーマット名: `` `.otf` ``, `` `.woff2` ``, `` `.svg` ``

理由: prose 内の bare 英単語は「翻訳調」を強める。code か concept かを問わず一律 backtick にする方が、JA としてのリズムが安定する。

### 5.3 bare で書く（固有名詞）

人・場所・サービス・フォントなど、固有名詞は backtick なしで書く。

- 人: CHIBA, TAKUMI
- フォント: Geist, Geist Sans, Jost
- 自社プロダクト: Filmtone, Photography
- 社外サービス・OS: iOS Safari, Android Chrome, iPhone, GitHub
- 文字（フォント彫り直しの対象）: A、K、C、T、H、B、M（中黒で並べる）

### 5.4 翻訳または注釈する（loanword・比喩）

loanword（英語の比喩・慣用句）はそのまま音写しない。日本語に翻訳するか、bare ＋ 括弧注釈で済ませる。

| EN | JA |
|----|-----|
| plumbing | 配信基盤 / 配線 / `plumbing`（配線） |
| source of truth | 単一参照源 / `source of truth`（単一参照源） |
| payoff | 落ち / `payoff`（落ち） |
| boil field | `boil` 場 |
| craft bar | クラフトの基準 / 「クラフトの帯」 |

「プラミング」のような直音写は使わない（JA として馴染まない、kanji or bare＋注釈に倒す）。

---

## 6. 用語決定（揺れの解消）

wave 1 時点で揺れているものを以下に固定する。grep の対象。

| 概念 | 採用表記 | 禁止表記 | 備考 |
|------|----------|----------|------|
| light substrate | `light substrate` または「ライト・サブストレート」 | 「ライト面」「単一のライト面」「light 面」 | 同じ記事内ではどちらかに統一。タイトルは backtick、本文は中黒カナでもよい |
| Theatre.js | `Theatre.js` | `theatre`（lowercase）, `Theatre`（拡張子なし） | コードでも prose でも casing を保つ |
| boil field | `boil` 場 | 「ボイル場」「boiling」「boil field」（bare） | カナ化しない、英＋日のハイブリッド表記 |
| data-readability | `` `data-readability` `` | bare の `data-readability` | prose でも常に backtick |
| source of truth | 単一参照源 または `` `source of truth` `` | bare の "source of truth" | 記事内で一貫させる |
| chrome（UI 文脈） | `chrome` | クローム / Chrome（ブラウザと混同） | 「ナビゲーションの chrome」のように backtick |
| scrim | `scrim` | スクリム | 自前の概念ではないので翻訳しない |
| WebGPU / WebGL2 | `WebGPU`, `WebGL2` | 「ウェブ GPU」 | 仕様名は backtick |
| dark / light（モード文脈） | dark モード / light モード（バックティック不要） | 「ダーク」「ライト」のカナ化、`dark` の bare 単独 | 「dark/light の二重モード」のような並列は許容 |

### light substrate の表記方針（補足）

- 記事タイトル・大見出しでは「ライト・サブストレート」（カナ中黒） — 印象を固定するため
- 本文では `light substrate`（backtick） — 反復しても密度が崩れない
- どちらを採るかは **同じ記事内では一貫させる**。混在は禁止

---

## 7. 文の作り方

### 7.1 一文の長さ

- 平叙文の標準長は 30〜60 文字。連続して 100 文字超の文を書かない
- 並列を「、」だけで繋げて 4 つ以上重ねない（読点ジャングル禁止）
- 句読点は意味の切れ目で打つ。リズムだけのために増やさない

### 7.2 連体修飾の長さ

「〜する〜の〜が〜する〜」のような連体修飾の入れ子は 2 段までにする。3 段に届きそうなら一度文を切る。

NG:
> 「`motion-dot` が WebGPU で 60fps を切らないために毎フレーム自前のクリアカラーを書き込むときに使うクリアカラーは float 値で `[0.82, 0.82, 0.82, 1.0]` に直書きしている。」

OK:
> 「`motion-dot` は `WebGPU` で動き、60fps を保つために毎フレーム自前のクリアカラーを書く。値は float で `[0.82, 0.82, 0.82, 1.0]`。直書きしている。」

### 7.3 代名詞・指示語

「これ」「これら」「その」が指す対象を曖昧にしない。前文の主語が二択以上ある場合は、指示語ではなく名詞で受け直す。

NG: 「Filmtone と Photography は別系統で生きている。これらは exception として残している。」

OK: 「Filmtone と Photography は別系統で生きている。この 2 つだけは例外として明示的に残している。」

---

## 8. block ごとの書き方

### 8.1 `heading`

- 8〜30 文字程度
- 体言止め可。「〜する」「〜について」のような曖昧な締めは避ける
- 英単語を含む見出しは backtick を使わない（見出しは特殊扱い、グラフィックとして読まれる）
  - OK: `Liquid Glass はナビにだけ残した`
  - NG: `` `Liquid Glass` はナビにだけ残した ``

### 8.2 `paragraph`

- 1 paragraph = 60〜180 文字を目安。500 文字を超えたら割る
- 一段落で言うのは 1 アイデアまで。複数のアイデアは段落を分ける
- 結論先出しでも、状況→決定の順でもよい。記事内で大筋を統一する

### 8.3 `code`

- text 側に「言語名: 何のコードか」の 1 行コメントを入れる（既存の慣習）
- code 内のコメントは英語と日本語が混在してよいが、同じ block 内では揃える
- code block の前後で paragraph を必ず置く（裸の code を見出し直後に置かない）

### 8.4 `callout`

- 文学的トーンを許可する場所
- 60〜200 文字。callout は本文の脇道、要約や姿勢表明に使う
- 「重要」「注意」のラベルは付けない（既存スタイルを踏襲）

### 8.5 `list`

- 短い句を 3〜6 項目並べる。文を並べるなら短く
- 項目内で「。」を使わない。「、」までで完結する句にする
- 番号付きが必要なら `list` の代わりに paragraph で「1) ... 2) ...」と書く（既存慣習）

---

## 9. 校正チェック（コミット前）

```bash
# 1. 揺れの残存確認
rg -F 'ライト面' apps/web/messages/ja.json
rg -F 'theatre' apps/web/messages/ja.json | grep -v 'Theatre.js'
rg -F 'プラミング' apps/web/messages/ja.json
rg -F 'data-readability' apps/web/messages/ja.json | grep -v '`data-readability`'

# 2. 一人称・主観語の残存確認
rg '自分は' apps/web/messages/ja.json
rg '編集物として(強|致命|弱)' apps/web/messages/ja.json
rg '見るに堪え' apps/web/messages/ja.json

# 3. 文末の混在確認（記事ごと）
python3 -c "
import json, re
d = json.load(open('apps/web/messages/ja.json'))
for slug, art in d['journal']['articles'].items():
    if isinstance(art, dict) and 'sections' in art:
        sections = art['sections']
    else:
        continue
    desu_count = 0
    da_count = 0
    for s in sections:
        text = s.get('text', '')
        desu_count += len(re.findall(r'(です|ます)。', text))
        da_count += len(re.findall(r'(だ|である)。', text))
    print(f'{slug}: ですます={desu_count}, だである={da_count}')
"
```

混在が出たら必ず一方に倒す。

---

## 10. 直さないこと（既存スタイルの保持）

以下は wave 1 のブランドボイスとして残す。直そうとしない:

- 「次の波で書く」「次の wave」のような巻き予告
- 「背負った負債として明示しておく」のような自省的な章結び
- callout 内での主観評価（「これを姿勢と呼ぶ」など）
- code block 内のコメント文体
- `motion-studies/<slug>` の eyebrow に英単語並列で書く形式（`Theatre / Cascade` のような）

---

## 参照

- `docs/journal/journal-curation-and-japanese-review-handoff-2026-04-29-jst.md` — 精査の経緯
- `docs/journal/curation-rationale.md` — キュレーション根拠
- `docs/journal/wave-2-backlog.md` — 次 wave 候補
- `apps/web/src/shared/data/journal.ts` — レジストリと運用ポリシーの JSDoc
- `apps/web/src/features/journal/article-blocks.ts` — block 型定義
