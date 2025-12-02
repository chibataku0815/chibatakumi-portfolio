# 2025-12-02 Bun版 Next.js セットアップ指示書
- Created: 2025-12-02T22:02:49+09:00 (Asia/Tokyo)
- Purpose: 既存ファイルがあるリポジトリに、BunでNext.js (App Router) + Tailwind + TypeScript + eslint を初期化する手順。コミット禁止、ビルド/リンター実行不要。

## 前提
- ルート直下に `.claude/`, `AGENTS.md`, `CLAUDE.md` が存在し、`create-next-app` が上書きを拒否する。
- Bun使用。既存gitを保持するため、空ディレクトリで初期化→同期する。

## 手順（実行コマンド）
1) 一時ディレクトリで雛形を作成  
   ```bash
   tmpdir=$(mktemp -d)
   cd "$tmpdir"
   bun create next . \
     --ts \
     --app \
     --tailwind \
     --eslint \
     --src-dir false \
     --import-alias "@/*"
   ```
2) 生成物をリポジトリへ同期（.gitは除外）  
   ```bash
   cd "$tmpdir"
   rsync -av --exclude ".git" --exclude ".next" ./ /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/
   ```
3) 依存インストール（リポジトリ直下で）  
   ```bash
   cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
   bun install
   ```
4) 確認（任意、ビルド/リンター不要）  
   - `ls` で `app/`, `pages/` がないこと（App Routerのみ）  
   - `tailwind.config.js`, `postcss.config.js`, `next.config.js`, `tsconfig.json` が生成済み  
   - `app/page.tsx` がプレースホルダであること

## 注意
- コミットは絶対に行わない。ビルド/リンターも不要。
- 雛形生成後は `tmpdir` を削除して構わない。
- 既存ファイルと衝突する場合は手動でマージ（本指示では自動削除しない）。
