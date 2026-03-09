# Vercel Build Fix - Bun Lockfile Unification

**作成日:** 2026-03-09T19:20:00+0900 (Asia/Tokyo)  
**ステータス:** 完了  
**Agent:** Codex CLI

---

## 背景

Vercel の production build が `lightningcss/node/index.js` 起点で失敗した。  
ローカル macOS では `npm run build` が通る一方、Vercel Linux 環境のみで CSS ビルドが落ちる非対称状態だった。

---

## 根本原因

`apps/web` に `bun.lock` と `package-lock.json` が共存しており、`package-lock.json` は macOS 由来の native optional package 解決結果を含んでいた。  
そのため Vercel Linux 環境で必要な `lightningcss-linux-*` / `@tailwindcss/oxide-linux-*` が install 対象から外れ、Tailwind v4 の PostCSS 実行時に module resolve error が発生していた。

---

## 対応内容

1. `apps/web/package-lock.json` を削除
2. `apps/web/package.json` に `packageManager: "bun@1.3.3"` を追加
3. `apps/web/README.md` を Bun 正本運用に更新
4. `bun.lock` を唯一の lockfile として扱う方針に統一
5. `node_modules` / `.next` をクリーン状態相当で再構築し、build を再検証

---

## 検証結果

- `bun install` 成功
- `bun run build` をクリーン状態から 2 回成功
- `npm run build` も単独実行で成功
- `/[locale]` 配下の主要 SSG ルート生成を確認
- ユーザー報告により Vercel 本番 build 成功を確認

---

## 変更ファイル

- `apps/web/package.json`
- `apps/web/README.md`
- `apps/web/package-lock.json` (削除)
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`

---

## 成果

- Vercel Linux とローカルの依存解決差異を解消
- Tailwind v4 / `@tailwindcss/postcss` / `lightningcss` 周辺の native optional dependency 問題を根本修正
- 今後の依存更新フローを Bun に一本化

---

## 関連ナレッジ

- `.ai/knowledge/2026-03-09-agent-teams-vercel-bun-lockfile-knowledge.md`

---

## コミット

- `ae0e6e4` `fix: unify web app dependency management with bun`
