# Filmtone Desktop Update Notification Fix (2026-04-08)

- **Issue:** `#22` `fix(desktop): Filmtone update banner does not appear on launch`
- **Status:** 完了
- **Worktree:** `.worktrees/feature-desktop-update-notification-fix`
- **Summary:** Filmtone Desktop の更新通知が「起動時」に出ない不具合を調査し、初回チェックの起動条件と配布ビルド時の更新 URL 埋め込みを修正した。

## Root Cause

- 初回更新チェックが `45s` 遅延されており、短時間で閉じるユーザーには通知が届かなかった。
- `FILM_LAB_DESKTOP_UPDATE_CHECK_URL` の埋め込みが live process env 依存で、配布ビルドに更新チェック URL が入らないケースがあった。

## Changes

- `electron/desktop-update-service.ts`
  - renderer load 完了時に初回更新チェックを即時実行するよう変更。
  - 45 秒タイマーは renderer ready が来ない場合の fallback に限定。
- `scripts/build-electron.mjs`
  - workspace / app 配下の `.env.local` と `.env.production.local` から `FILM_LAB_DESKTOP_UPDATE_CHECK_URL` を解決できるよう変更。
- `electron/desktop-update-service.test.ts`
  - 起動直後の初回チェック
  - loading 中キュー通知の flush
  をカバーするテストを追加。

## Verification

- `bun test --config vitest.config.ts electron/semver-compare.test.ts electron/desktop-update-service.test.ts`
- `bun ./scripts/build-electron.mjs`
- `dist-electron/main.cjs` に update-meta URL が埋め込まれることを確認
