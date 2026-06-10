# Journal — Wave 2 Backlog

`/journal/` の次 wave 以降の候補リスト。`hold` ステータスの予約 slug もここで一覧化する。レジストリ (`apps/web/src/shared/data/journal.ts`) に hold エントリとして書くかどうかは、各候補が公開準備に近づいた時点で判断する。

最終更新: 2026-04-29 / 次 wave 公開目標: 未定（書く価値がある記事が揃った時点）

---

## 凡例

- **slug**: 記事 URL に使う識別子（仮）
- **kind**: `case-study` / `engineering-note` / `study` / `motion-study`
- **evidenceLevel**: `production` / `rnd` / `experimental`
- **素材**: 既存のハンドオフ・知見ファイル
- **公開可否**: 顧客機密・NDA の確認が必要かどうか
- **note**: 残課題、書く前提条件

---

## 1. 候補（公開準備に近い順）

### 1.1 `filmtone-ios-lut-intensity-slider`

| 項目 | 値 |
|------|----|
| kind | engineering-note |
| evidenceLevel | rnd |
| 想定 priority | 1 |
| 素材 | `docs/filmtone/ios/filmtone-ios-lut-intensity-slider-handoff-2026-04-29-jst.md` |
| 公開可否 | OK（自社プロダクト Filmtone iOS） |
| note | LUT intensity スライダーの実装記録。タッチ操作の正確性、スライダーの離散値ハンドリング、リアルタイムプレビューの色パイプラインとの整合 |

### 1.2 `filmtone-motion-180-baseline-industry`

| 項目 | 値 |
|------|----|
| kind | study |
| evidenceLevel | rnd |
| 想定 priority | 2 |
| 素材 | `docs/filmtone/filmtone-motion-180-baseline-industry-handoff-2026-04-29-jst.md` |
| 公開可否 | OK（自社プロダクト Filmtone） |
| note | シネマモーションの 180 度シャッターベースライン。Filmtone がどのモーション基準を industry standard として採用しているか、その判断のロジック |

### 1.3 `photography-lp-design-polish`

| 項目 | 値 |
|------|----|
| kind | case-study または engineering-note |
| evidenceLevel | production |
| 想定 priority | 3 |
| 素材 | `MEMORY.md` 内「Photography LP Design Polish ナレッジ (2026-03-09)」、`.ai/knowledge/gsap-ease-syntax.md`、`.ai/knowledge/hero-shader-visibility.md`、`.ai/knowledge/scroll-trigger-pitfalls.md` |
| 公開可否 | OK（自社サイト） |
| note | Photography LP のモーション差別化技法集。GSAP scrub、card-settle、icon pop bounce、counter ignition、breathing glow など。Vercel + Turbopack の CSS 制約も含む。kind を case-study にするか engineering-note にするかは、論点を「LP として何を達成したか」に置くか「再利用可能な技法」に置くかで決める |

### 1.4 `wordmark-pipeline-v2`（仮、wave 3 以降の可能性）

| 項目 | 値 |
|------|----|
| kind | case-study |
| evidenceLevel | production |
| 想定 priority | 1 |
| 素材 | `wordmark-pipeline-v1`（= wave 1 の `journal-typography-wordmark-system`）の進行から派生 |
| 公開可否 | OK |
| note | Jost を完全に消し、Geist 派生 wordmark のみで成立させる次のフェーズ。v1 の callout で予告した「次の波で書く」の本体。wordmark v1 が `rnd` から `production` に上がった時点で書く |

---

## 2. 早めに書きたいが素材が足りない候補

### 2.1 `data-readability-shader-pipeline`

| 項目 | 値 |
|------|----|
| kind | engineering-note |
| evidenceLevel | production |
| 素材 | `.claude/knowledge/patterns/data-readability-shader-pipeline.md`、`MEMORY.md` の Wave 4-3 メモ |
| note | wave 1 の portfolio-renewal-2026 内で触れた `data-readability` shader pipeline を切り出した engineering-note。読み物としては case-study の補講に近い。wave 1 の関連記事として読まれる前提で短く書く |

### 2.2 `motion-dot-light-substrate-constraint`

| 項目 | 値 |
|------|----|
| kind | engineering-note |
| evidenceLevel | production |
| 素材 | `.claude/knowledge/patterns/motion-dot-light-substrate-constraint.md` |
| note | `motion-dot` が hardcode する `bgColor` の制約と、それがサイト全体に及ぼす影響。wave 1 の portfolio-renewal-2026 で触れた節を、再利用可能なメモに切り出す |

### 2.3 `cjk-typography-pitfalls`

| 項目 | 値 |
|------|----|
| kind | engineering-note |
| evidenceLevel | production |
| 素材 | `.ai/knowledge/cjk-typography-pitfalls.md`、`MEMORY.md` の CJK タイポグラフィメモ |
| note | `text-wrap: balance` が CJK で誤動作する問題、`em` vs `ch` の選択、`word-break: auto-phrase`。Web タイポの落とし穴集として独立記事化できる |

---

## 3. 出さない／保留のもの

### 3.1 商業案件・カラグレ案件

- 顧客機密に該当するため `/journal/` には出さない
- 一般化された手法（カラーホイールの使い分け、LUT の評価軸）は別ページで扱う可能性あり

### 3.2 内部ツール・社内オペ

- 業務フロー、契約・価格、外部委託の進め方は `/journal/` のスコープ外
- `chibataku0815/life` リポに留める

### 3.3 短命な workaround

- 半年で陳腐化する「いま動く方法」は書かない
- 恒久対策がある場合は対策のほうを書く

---

## 4. 候補が wave に乗る条件

各候補が `published` に上がるまでに揃える必要があるもの:

- [ ] 本文 sections[] が JA / EN 両方で執筆済み
- [ ] 用語が `docs/journal/ja-writing-style.md` の表記ルールに準拠
- [ ] commit hash か file path で実装に紐づく（`production` の場合）
- [ ] 顧客機密・NDA の最終チェック
- [ ] related 記事との相互参照を貼る
- [ ] tags が既存 wave の tags と整合（重複か新規かを意識する）

---

## 5. wave 2 公開時のチェック

- [ ] wave 1 の記事の更新も同時に行うか判断（用語揺れの後追い修正など）
- [ ] sitemap が新 slug を含むことを確認
- [ ] `getStaticParams` の slug 一覧を更新
- [ ] hreflang `<link>` が両ロケールで揃っていることを確認

---

## 関連

- `docs/journal/curation-rationale.md` — 何を載せるかの基準
- `docs/journal/ja-writing-style.md` — 日本語執筆スタイル
- `apps/web/src/shared/data/journal.ts` — レジストリ
- `docs/journal/motion-study-rollout.md` — **drawer 18 技法の motion-study 展開はこちらが正本**（このファイルは非 drawer 候補のみ扱う）
