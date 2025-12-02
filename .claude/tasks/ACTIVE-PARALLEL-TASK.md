# Active Parallel Task

## ✅ Next.js/WebGL 保守性ハンドオフプロンプト作成 (2025-12-03T00:31:31+09:00 ～ 2025-12-03T00:31:31+09:00)
- Updated: 2025-12-03T00:31:31+09:00 (Asia/Tokyo)
- Status: ✅ 完了（haiku4.5向け指示テンプレを作成）
- Progress: 100%

### Checklist
- [x] 現状のHero背景実装と課題を整理
- [x] haiku4.5向けの実装プロンプトを作成し `.claude/tasks/2025-12-03-next-webgl-handoff-prompt.md` に追加
- [x] プロンプトでコミット禁止/ビルド不要/最小差分を明示

### Notes / Plan Snapshot (Asia/Tokyo: 2025-12-03T00:31:31+09:00)
- Hero背景は `HeroShaderBackground.tsx` で画像contain + 平均暗部+端ブラー補完 + FBM/ノイズ（Amberリークなし）。ノイズ振幅は写真分散から算出。
- 次ステップ: Three/GLコードを `components/canvas` へ集約し、fbm/noise/色抽出を `lib/shaders` に分離、パラメータは config 一元化。Tailwind拡張は最小限。
- 実装指示は `.claude/tasks/2025-12-03-next-webgl-handoff-prompt.md` に記載。出力時は変更ファイル一覧とパラメータ調整箇所を必ず明記する。

## ✅ グローバルルール刷新（ポートフォリオ対応）
- Created: 2025-12-02T21:44:27+09:00
- Updated: 2025-12-02T21:44:27+09:00 (Asia/Tokyo)
- Status: ✅ 完了（AGENTS/CLAUDE をポートフォリオ仕様へ更新）
- Progress: 100%

### Checklist
- [x] 既存 `AGENTS.md` / `CLAUDE.md` の旧プロジェクト要素を確認
- [x] ポートフォリオ前提の運用方針を整理（Next.js, Tailwind, shadcn/ui, Framer Motion）
- [x] `AGENTS.md` を再設計・更新
- [x] `CLAUDE.md` を再設計・更新
- [x] ACTIVE-PARALLEL-TASK をリセットし完了記録

### Notes / Plan Snapshot (Asia/Tokyo: 2025-12-02T21:44:27+09:00)
- 旧Expo/FX/iOS前提やASO/Serena/AI運用5原則の逐語出力など、現プロジェクトと無関係な規約を除去。
- Next.js App Router + Tailwind + shadcn/ui + Framer Motion を基軸にし、Phase 2 の GSAP / Three.js 置換を考慮した抽象化を明記。
- Pitch Black & Fire テーマ、Amberアクセント限定利用、HeroとGridでの質感差分、NoiseをCSS/SVGで軽量付与するガードを追加。
- SoT を `AGENTS.md` / `CLAUDE.md` / `.claude/tasks/ACTIVE-PARALLEL-TASK.md` に集約し、以降のタスクはここを起点に管理。

---

## ✅ Hero/背景親和プロンプト作成 (2025-12-02T21:58:34+09:00 ～ 2025-12-03T00:07:57+09:00)
- Updated: 2025-12-03T00:07:57+09:00 (Asia/Tokyo)
- Status: ✅ 完了（実装・検証済み）
- Progress: 100%

### Checklist
- [x] 要件整理（同一パレット/ノイズ/ブレンドで親和）
- [x] 実装手順とガード方針をまとめる
- [x] Claude Code (haiku4.5) 向け詳細プロンプトを作成
- [x] 必要に応じて色・ノイズの具体値をセット
- [x] 実装後の確認項目を追記

### Notes / Plan Snapshot (Asia/Tokyo: 2025-12-02T21:58:34+09:00)
- `.claude/tasks/2025-12-02-hero-bg-unification-prompt.md` にhaiku4.5向け実装プロンプトを作成済み。
- 背景/写真の親和はシェーダーで達成（写真を中心に表示し、周辺は写真の平均暗部色＋端のブラーをFBM+ノイズで補完）。Amberリークは別対応とし、彩度・明度・粒度を写真に合わせて統一。
- 成果物: 上記プロンプトドキュメント＋ナレッジ `.claude/knowledge/2025-12-03-hero-bg-unification.md` を追加。

---

## ✅ Bun版 Next.js 初期セットアップ指示書 (2025-12-02T22:02:49+09:00 ～ 2025-12-02T22:12:19+09:00)
- Updated: 2025-12-02T22:12:19+09:00 (Asia/Tokyo)
- Status: ✅ 完了（指示書提供・実行確認済み）
- Progress: 100%

### Checklist
- [x] 非空ディレクトリ向けのBunセットアップ手順を作成
- [x] 指示書を `.claude/tasks/2025-12-02-bun-next-setup-guide.md` に追加
- [x] 実行結果を確認（apps/web 配下に雛形生成）
- [ ] 必要なら衝突解決方針を追記（後続）

### Notes / Plan Snapshot (Asia/Tokyo: 2025-12-02T22:02:49+09:00)
- `bun create next` を一時ディレクトリで生成し、`rsync --exclude .git` でリポジトリへ同期する手順を提示。`bun install` までを記載。
- apps/web 配下に雛形が配置され、Tailwind v4 + src/app 構成になっている（--src-dir false でも src 配下に生成された）。ルートとの分離で worktree 併用が容易。
- コミット禁止・ビルド/リンター不要を明示。既存ファイルと衝突した場合は手動マージ前提。
