# Agent Teams Knowledge: Vercel Build Fix with Bun Lockfile Unification

- Created: 2026-03-09T19:20:00+0900 (Asia/Tokyo)
- Status: Completed
- Scope: Vercel / Next.js 16 / Tailwind v4 / Bun / native optional dependencies

---

## 概要

`apps/web` の Vercel build failure を、依存管理の正本を Bun に統一することで解消した。  
症状は Tailwind v4 の CSS build 中に `lightningcss` の native module が見つからないというものだったが、原因は CSS 設定ではなく lockfile 競合だった。

---

## 症状

- Vercel で `npm run build` が失敗
- import trace は `src/app/globals.css` → `@tailwindcss/postcss` → `lightningcss/node/index.js`
- ローカル macOS では build 成功
- Vercel Linux だけが落ちる

この条件が揃った場合、CSS 記述ミスよりも native optional dependency の OS 差異を先に疑う。

---

## 根本原因

`apps/web/package-lock.json` に Linux 向け実体エントリがなく、macOS 向けの `lightningcss-darwin-*` / `@tailwindcss/oxide-darwin-*` だけが実質的に解決されていた。  
一方で `lightningcss` は実行環境の `platform` / `arch` に応じて `lightningcss-linux-x64-gnu` などを動的 `require` するため、Vercel Linux で失敗した。

---

## 切り分け手順

1. ローカル build が通るか確認する
2. lockfile が複数存在しないか確認する
3. `package-lock.json` か `bun.lock` に Linux native package の記録があるか確認する
4. `lightningcss` / `@tailwindcss/oxide` の optional dependency 群を確認する
5. lockfile 正本を 1 つに決めて install / build を再実行する

---

## 今回の正解パターン

- `apps/web` の package manager 正本を Bun に固定
- `package-lock.json` を削除
- `package.json` に `packageManager: "bun@1.3.3"` を追加
- `README.md` に Bun 運用ルールを明記
- Vercel でも Bun install / Bun build を前提に揃える

---

## Agent Teams での役割分担

### 1. Orchestrator Director

- 依存管理の正本を決める
- 「CSS 設定問題」ではなく「lockfile / install strategy 問題」と論点を固定する
- ローカル成功 / Vercel失敗の非対称性を重要シグナルとして扱う

### 2. Build / CI Specialist

- Vercel build log の import trace から失敗起点を特定する
- ローカル build と CI build の差分を整理する
- install command / build command の固定有無を確認する

### 3. Package Manager Specialist

- lockfile の重複を検出する
- `packageManager` フィールドを追加する
- package manager を跨いだ lockfile 共存を解消する

### 4. Frontend Platform Specialist

- `postcss.config.mjs`, `globals.css`, Tailwind v4 構成が原因ではないことを切り分ける
- CSS import trace に引きずられて誤修正しない

### 5. Deployment Specialist

- Vercel がどの lockfile / package manager を検出するかを確認する
- monorepo の working directory と install strategy を点検する

### 6. QA Specialist

- クリーン install 後に build を複数回通す
- `.next` を消した状態でも再現性を確認する
- Vercel 再デプロイ成功まで閉じない

---

## 再発防止ルール

- 1 アプリにつき lockfile 正本は 1 つだけにする
- native optional dependency を持つ package を使う場合、CI の OS 差異を最初に確認する
- Vercel 失敗時に import trace が CSS でも、原因を CSS に限定しない
- ローカル成功 / Vercel失敗なら、コード差分より install 差分を先に調べる
- `README.md` に package manager の正本を明記する

---

## チェックリスト

- `apps/web` に不要な `package-lock.json` がない
- `package.json` に `packageManager` がある
- `bun.lock` に Linux 向け native package エントリがある
- `bun install` 後に `bun run build` が成功する
- Vercel の install/build command が Bun 前提と矛盾しない

---

## 関連ファイル

- `apps/web/package.json`
- `apps/web/README.md`
- `apps/web/bun.lock`
- `.claude/tasks/archive/2026-03-09-vercel-build-fix-bun-lockfile-unification.md`
