## 目的
- `/skills` ページを新規作成し、現行の Works/Case-Study 内容と Profile のスキル・経歴情報を統合した「マルチスキル」訴求のページを実装する。
- ビジュアルはモノトーン基調＋必要最小のアクセント。写真/映像を含めたダイナミック表現（背景にthree.jsの流体を敷きつつ、各セクションに写真レイヤを載せる構成）。
- Worksページの重複を解消し、ナビに Skills を追加する（Worksは非表示または統合先として扱う）。

## 対象モデル
- Claude Code Haiku 4.5

## 禁止・注意
- **コミット禁止**（`git commit` など絶対に実行しない）
- ビルド/リンタ実行やその記載は不要
- 既存の構造を壊さない（必要な最小限のリファクタのみ）

## 実装方針（概要）
1. `/skills` ページを追加（`apps/web/src/app/skills/page.tsx`）。モノトーン背景＋three.js流体（既存FluidGradientBackground）を敷き、セクションごとに写真レイヤを重ねる。
2. コンテンツは「マルチスキル」を軸に4セクション程度（例: Visual & Photo / Code & Interaction / Motion & Sound / Identity & Systems）。Worksにあったcase studyテキストを、スキル表現に翻訳し直す。
3. Profileの役割/タグを取り込み、タグやロールをセクション下部に小さく表示。
4. ナビゲーションに `Skills` を追加し、`Works` リンクは外すか `Skills` に置き換える。
5. データソースは `apps/web/src/shared/data/portfolio.ts` に統合用データを追加（`works` を `skills` に読む形でもよい）。必要なら型定義を最小限拡張。

## 具体タスク
- ルート追加: `apps/web/src/app/skills/page.tsx` を新規作成。
  - three.js背景: `FluidGradientBackground` を固定配置し、その上にセクションを積む。
  - 各セクションに: タイトル帯（ライトグレー）、サブコピー、ロール/タグのピル。写真レイヤ（`media.src`）を背景に敷き、上に黒グラデを薄く重ねる。
  - タイポはモノトーン主体。アクセントカラーは必要最小限（Amber系1色程度）。
- データ: `apps/web/src/shared/data/portfolio.ts`
  - `works` を `skills` 的なフィールドとして再利用または新設（例: `skills: { items: [...] }`）。4アイテム程度、写真・説明・タグ・role・metaを保持。
  - 既存 `works` の重複感をなくすため、case study ではなくスキル表現にコピーを変更する。
  - ナビリンク: `Skills` を追加、`Works` は外す/置換。
- コンポーネント: 可能な限り既存レイアウトの再利用でOK（新規UIを `skills/page.tsx` 内で完結させてもよい）。
- スタイル: モノトーン基調 (#0b0b0b ベース、帯は #f2f2f2)、アクセントは最小。背景写真には薄い黒グラデを載せ、文字は白系。

## 確認事項（完了時にセルフチェック）
- `/skills` ページが表示でき、4セクション程度のマルチスキル表示があること
- ナビに `Skills` が追加され、`Works` の重複導線がないこと
- 背景はthree.js流体＋写真レイヤ、モノトーン基調で派手色が最小化されていること
- コミットは行っていないこと
