# Journal — キュレーション根拠

`/journal/` に何を載せ、何を載せないかの基準。レジストリ (`apps/web/src/shared/data/journal.ts`) の `priority` と `tags` だけでは説明できない部分を言語化する。

最終更新: 2026-04-29 / 適用範囲: wave 1 と wave 2 以降の選定判断

---

## 1. Wave 1 selection logic（2026-04-29）

3 本の主記事と 4 本の motion-study が wave 1 で公開された。

| slug | kind | 選定理由 |
|------|------|----------|
| `portfolio-renewal-2026` | case-study | 直近最大の意思決定の記録。サイト全体を 1 枚のライト・サブストレートに統合したロジック自体を、サイトの上で検証可能にする根幹 |
| `mobile-safari-touch-controller` | engineering-note | 再利用可能な技術メモ。`visualViewport` を CSS 変数に降ろす配信基盤は、今後 iOS Safari を相手にする実装で繰り返し使う |
| `journal-typography-wordmark-system` | study | 進行中 R&D の honesty。Wordmark パイプラインが完成品ではないことを公開で書き残すことで、ブランドの本気度を計らせる |
| `signal-stroke-relay` | motion-study | source に存在する 4 件のうち、Theatre.js タイムラインの参照型 relay の代表格 |
| `staged-emphasis-payoff` | motion-study | pacing の study。emphasis family の 1 サンプル |
| `boiling-poster-aperture` | motion-study | boil 場 + displacement での reveal。WebGL 側で持つ紙の質感 |
| `temporal-echo-residue` | motion-study | 動きの decay と residue。静止後の余韻設計 |

`motif-loop-background` は wave 1 commit (`b8353730`) で **意図的に除外**。「source tree に存在しないため」が明示的な理由（コミットメッセージ参照）。

### Wave 1 が示そうとしたこと

3 本の組み合わせは「production / rnd / rnd」という evidenceLevel の混合になっている。意図:

- **production 1 本**: 既にサイト全体に乗っている判断を、サイトの上で評価可能にする（同じ画面で読みながらロジックを検証できる）
- **rnd 2 本**: 進行中である R&D を「進行中だ」と書きつつ載せる。完成を待たないことで wave のリズムを保つ
- **motion-study 4 本**: 単機能のモーション原語のみ。プロダクト案件・カラグレ・商業案件は wave 1 ではすべて除外

---

## 2. `kind` の運用基準

`JournalKind` は 4 値: `case-study` / `engineering-note` / `study` / `motion-study`。

| kind | 何を書くか | 何を書かないか |
|------|-----------|---------------|
| `case-study` | 大きな意思決定の記録。何を選び、何を捨てたか。**判断の論理が再現可能であること** | チュートリアル、How-to、外向けの広告 |
| `engineering-note` | 再利用可能な技術メモ。**他の実装に持っていける配線・構造** に絞る | 単発の bug fix、サービス障害対応、内部固有のもの |
| `study` | 進行中 R&D。完成していないことを明示しつつ、現時点での到達点を書く | 完成品の説明（それは case-study になる） |
| `motion-study` | 単機能のモーション原語。1 記事 = 1 概念 | 複合的な演出、商業案件の motion |

### 境界例

- 「サイトに乗っている技術 + 進行中 R&D が混ざっている」: case-study と study のどちらに倒すか → **意思決定の記録**が中心なら case-study、**進行中の探索**が中心なら study
- 「再利用可能性は高いが、サイト固有の事情も含む」: engineering-note と case-study の境界 → 持ち出しても動くと思えるなら engineering-note、サイト固有の判断と分離できないなら case-study

---

## 3. `evidenceLevel` の運用基準

`JournalEvidenceLevel` は 3 値: `production` / `rnd` / `experimental`。

| level | 閾値 |
|-------|------|
| `production` | サイトに**現時点で乗っている**実装の記録。読者が `view-source` で実物を見られる |
| `rnd` | source tree には**ある**が進行中で、完成と呼べない状態。あるいはリリース予定はあるがまだ wired up されていない |
| `experimental` | source tree には**ない**。idea プロト、`apps/exampleXX/` のサンプル、ローカルの私的実験 |

`experimental` の記事は wave 1 では **公開しない方針**。`status: "hold"` または下書きに留める。

### 嘘をつかないための補助規則

- `production` を称する記事は、commit hash か file path で実物に紐づけられること
- `rnd` の記事は、何が完成していないかを記事内で明示する（callout で「Jost との共存を抱えたまま走らせている」のように）
- 後から evidenceLevel が変わる場合は、記事末尾に変更ログを残す（wave 2 以降のルール）

---

## 4. `status` の運用

`JournalStatus` は 3 値: `published` / `draft` / `hold`。

| status | 状態 |
|--------|------|
| `published` | sitemap に出る。`/journal/<slug>` が描画される |
| `draft` | 本文を書きかけ。レジストリには載せるが `publishedJournalEntries` から除外 |
| `hold` | wave 2 以降の候補。slug を予約するためにレジストリに載せるが index から除外 |

`publishedJournalEntries` フィルタが `status === "published"` のみを通すので、`draft` と `hold` は自動的に sitemap・index から消える。

`hold` の slug 予約は wave 2 公開時に名前重複を避けるため。任意。`docs/journal/wave-2-backlog.md` のリストだけで運用してもよい。

---

## 5. 意図的に出さない領域

以下は journal に **載せない**。wave 2 以降も方針を維持する。

### 5.1 顧客機密

- 具体的なクライアント名・社名（同意がある場合を除く）
- 商業案件のスケジュール、予算、配信計画
- クライアントから提供を受けた素材の内部処理過程

### 5.2 公開不可な実装

- NDA 配下のもの（提携先の SDK・API・社内ツール）
- 未発表ハードウェア・ソフトウェアとの連携
- 公開前のサービス・プロダクトに関するもの

### 5.3 内部のみで意味を持つ事実

- 社内オペレーションの手順
- 業務委託・パートナーとの分業の中身
- 個人的な体調・メンタル・関係の話題

### 5.4 短期で陳腐化する情報

- 特定のバージョン番号に依存し、半年で意味を失う「いま動く方法」
- 一時的な workaround（恒久対策がある場合は対策のほうを書く）

---

## 6. wave に分けて出すという運び

journal は wave 単位で出す。wave 1 = 2026-04-29 の同時公開分。

### wave 単位で出す理由

- 一度にまとめて出すことで、記事間の文脈（related, 用語）を統一できる
- 散発的に追加するより、編集物としての強度が高い
- 公開時のレビュー（タイポ、用語揺れ、JA 品質）を一括でできる

### wave のサイズ目安

- 3〜5 記事程度。多すぎると編集物としての密度が下がる
- 主記事 (`case-study` / `engineering-note` / `study`) と motion-study を 1〜2 本ずつ含める
- すべて `production` でも、すべて `rnd` でもないバランスにする

### wave 間のリズム

- 1〜3 ヶ月に 1 回が目安
- 毎月出す必要はない。書く価値がある記事だけを束ねる

### 候補の在処

wave 2 以降の候補は `docs/journal/wave-2-backlog.md` で一元管理する。

---

## 7. 関連ドキュメント

- `docs/journal/journal-curation-and-japanese-review-handoff-2026-04-29-jst.md` — 精査の経緯
- `docs/journal/ja-writing-style.md` — 日本語執筆スタイル
- `docs/journal/wave-2-backlog.md` — 次 wave 候補
- `docs/renewal-2026/2026-04-27-journal-motion-studies-curation-review-handoff.md` — wave 1 直前の motion-studies 精査議論
- `apps/web/src/shared/data/journal.ts` — レジストリ本体（policy JSDoc あり）
