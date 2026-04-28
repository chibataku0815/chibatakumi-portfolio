# Claude Code 実装プロンプト: Photography LP 再定位
- 作成日: 2026-03-09
- 対象: `apps/web` の Photography LP
- モード: Agent Teams
- 優先度: High
- 目的: 「東京」訴求を主軸から外し、英語対応を `text-first` に再定義した上で、Photography LP のコピー・SEO・UX を整合的に修正する

---

## あなたの役割

あなたは `orchestrator-director` として実行を統括してください。

このタスクは **Agent Teams** で進めてください。  
独立ストリームが 4 以上あるため、必ずチーム分割し、進捗管理し、最後に統合してください。

また、**思考が必要な箇所では必ず `sequential-thinking` を使ってください。**  
曖昧さが残る場合は、まずリポジトリを探索し、必要なら検索し、それでも解決しない場合のみ質問してください。

複数の独立した確認・探索・読取は、**必ず並列実行**してください。

---

## 背景

現状の Photography LP は、表のコピーで「東京」を強く押し出しすぎている。  
ユーザーとしてはこの点に違和感がある。

加えて、英語でのテキストコミュニケーションには問題がない一方、**リスニングには難がある**。  
そのため、現状の `bilingual communication` / `日英バイリンガル進行` の表現は、口頭英語対応まで含意しかねず、期待値設計として危険である。

この修正では以下を両立すること:

1. 本文コピーから過剰な「東京」訴求を外す
2. ただし SEO / metadata / JSON-LD / 地域文脈としての東京は維持する
3. 英語対応は `text-first English coordination` として再定義する
4. 固有事例名 `Cafe Cursor Tokyo` などの実在名称は維持する
5. 既存のフォーム仕様、i18n、Slack webhook 送信、WebGL 背景、ルーティングは壊さない

---

## 既に確定している方針

### 1. 東京訴求の扱い
- 表のコピーでは東京色を薄める
- SEO では東京を残す
- 完全削除ではない
- 固有事例名の `Cafe Cursor Tokyo` / `Cursor Tokyo Meetup` はそのまま残す

### 2. 英語対応の扱い
- `bilingual` という曖昧な表現はやめる
- `text-first English support` / `英語テキスト対応` に再定義する
- 問い合わせ、事前調整、納品説明は英語テキストで対応可能
- 当日の口頭英語運用は前提にしない
- 電話やリスニング前提の約束はしない

---

## 実装前に必ず読むもの

以下を最初に確認してください。

- `AGENTS.md`
- `.ai/GLOBAL.md`
- `.ai/parallel-work.md`
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`
- `docs/photography/photography-redesign-handoff.md`
- `docs/photography/photography-i18n-handoff.md`

必要に応じて以下も参照してください。

- `.claude/skills/copywriting/SKILL.md`
- `.claude/skills/art-direction/SKILL.md`
- `.claude/skills/project-coordinator/SKILL.md`

---

## Agent Teams の編成

最低 6 ロールで進めてください。

### 1. Coordinator / Orchestrator
責務:
- 全体進行
- 依存関係管理
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` の作業宣言と完了報告
- 最終統合

### 2. Brand Strategist
責務:
- 東京依存のブランド軸を整理
- 前面に出す価値を定義
- 「何を言わないか」も定義

### 3. Copywriter
責務:
- Hero / About / CTA / proof strip / success state の `ja/en` コピー再設計
- `bilingual` を `text-first` 表現へ置換
- 過剰な東京訴求を削る

### 4. SEO / IA Specialist
責務:
- metadata / OG / JSON-LD の修正方針確定
- 本文と SEO 文言の役割分離
- `Tokyo` を検索面だけに適切に残す

### 5. UX Writer / Service Designer
責務:
- 問い合わせ前後の期待値設計
- 英語テキスト対応の安心感を CTA 周辺で自然に伝える
- 当日の口頭英語を誤期待させない文面設計

### 6. Implementation Reviewer
責務:
- i18n key の整合確認
- 非機能回帰の確認
- フォーム仕様 / hidden input / `select value` / Slack webhook / build 成功の維持確認

---

## 期待する成果物

### 実装成果物
- 必要なコード変更
- i18n メッセージ更新
- metadata / JSON-LD 修正
- 差分の要約
- 実施した検証結果

### ドキュメント成果物
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` の適切な更新
- 必要なら今回の判断を短く残す handoff / notes

---

## 変更対象の中心

主に以下を確認・編集してください。

- `apps/web/messages/ja.json`
- `apps/web/messages/en.json`
- `apps/web/src/app/[locale]/photography/page.tsx`

必要なら以下も読むこと:

- `apps/web/src/features/photography/sections/HeroSection.tsx`
- `apps/web/src/features/photography/sections/AboutSection.tsx`
- `apps/web/src/features/photography/sections/CTAFormSection.tsx`

---

## 変更方針

### A. Hero
以下を修正してください。

- `Tokyo-Based Event Photographer` / `東京拠点のイベントフォトグラファー` を撤去
- `for Tokyo teams` / `東京で残す` のような直接的な地域訴求を撤去
- Hero の主張は以下の優先順位に並び替える
  1. イベントの熱量を編集的に残せること
  2. 当日セレクト / 72時間納品の速さ
  3. 写真が後工程でも使いやすいこと
- proof strip の communication 項目は `英語テキスト対応` を短く正確に伝える文面へ変更
- `where: Tokyo` のような案件メタは、固有事例情報として必要なら残してよい

### B. About
以下を修正してください。

- `日英バイリンガル進行` / `Bilingual direction` を廃止
- 代わりに以下の意味を伝える
  - 英語での問い合わせや事前共有は問題ない
  - 納品説明まで英語テキストで齟齬なく進められる
  - ただし現場の口頭英語運用を過剰に約束しない
- `community literacy` / 技術コミュニティ理解は維持してよい

### C. CTA
以下を修正してください。

- CTA 左カラムまたはフォーム周辺に、英語テキスト対応の補助文を追加または差し替え
- 期待値として伝えるべきこと:
  - メール / DM / 事前共有資料は英語で問題ない
  - 相談から納品説明までテキストベースで対応可能
  - 現場口頭の英語進行までは前提としない
- 防御的すぎる言い回しにはしない
- 「できない」ではなく「どの形でスムーズに対応できるか」を示す

### D. Metadata / SEO / JSON-LD
以下を満たしてください。

- SEO 面では `Tokyo` を維持する
- 本文コピーと SEO コピーは役割を分ける
- `generateMetadata()` の `title`, `description`, `ogTitle`, `ogDescription` は必要に応じて修正
- JSON-LD の `description`, `serviceType`, `areaServed` は意味整合を確認
- URL、locale 構造、canonical、alternates は変更しない

### E. 固有名詞
以下は維持してください。

- `Cafe Cursor Tokyo`
- `Cursor Tokyo Meetup`

---

## 絶対に壊してはいけないもの

- `next-intl` のルーティング
- 日本語デフォルト / 英語 `/en/...`
- `select` の `value` は英語固定
- hidden input `source="photography"`
- hidden input `locale`
- `submitPhotographyInquiry`
- Slack webhook 送信仕様
- Hero の WebGL 背景とフォールバック
- 既存 build 成功状態

---

## 品質基準

このタスクは単なる文言置換ではありません。  
以下を満たしてください。

- 東京訴求を弱めても、Hero の強度が落ちない
- 英語対応の文言が誠実で、かつ弱く見えない
- 日本語版と英語版でニュアンスのズレがない
- `bilingual` を安易に別表現へ置換するだけで済ませない
- LP 全体の編集性・格を落とさない
- Level 4 以上の差別化された体験を維持する

---

## 実行手順

1. ルール・handoff・対象コードを読む
2. `sequential-thinking` で論点を整理する
3. Agent Teams を編成する
4. 各専門家にスコープを切って並列実行する
5. コピー・SEO・UX の競合を統合する
6. 実装する
7. `npm run build` を実行する
8. missing key / 型エラー / 回帰がないことを確認する
9. 最終要約を出す
10. Team をクリーンアップする

---

## 作業ルール

- 変更前に `.claude/tasks/ACTIVE-PARALLEL-TASK.md` へ作業宣言
- 並列時は `.ai/parallel-work.md` を遵守
- dirty worktree を前提に、Photography 関連以外を巻き込まない
- 不要な `git add .` をしない
- 既存の unrelated changes を戻さない
- 最小差分で編集する
- 調査・読取・検索は可能な限り並列化する

---

## 完了条件

以下をすべて満たしたら完了です。

- Hero の主訴求から過剰な東京押し出しが消えている
- 英語対応が `text-first` として正確に表現されている
- metadata / OG / JSON-LD に東京情報が適切に残っている
- `Cafe Cursor Tokyo` などの固有事例は保持されている
- `next-intl` missing key がない
- `npm run build` が成功する
- フォーム送信仕様に変更がない
- 最終報告に、変更点・検証結果・未解決事項が整理されている

---

## 最終報告フォーマット

以下の順序で簡潔に報告してください。

1. 変更概要
2. 修正した訴求の要点
3. SEO と本文の役割分離
4. 英語対応の期待値設計
5. 検証結果
6. 残課題があれば短く記載

---
