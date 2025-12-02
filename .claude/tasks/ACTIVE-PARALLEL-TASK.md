# Active Parallel Task

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

## 🚧 Hero/背景親和プロンプト作成 (2025-12-02T21:58:34+09:00 ～ In Progress)
- Updated: 2025-12-02T21:58:34+09:00 (Asia/Tokyo)
- Status: 進行中（Claude Code向けプロンプト作成）
- Progress: 50%

### Checklist
- [x] 要件整理（同一パレット/ノイズ/ブレンドで親和）
- [x] 実装手順とガード方針をまとめる
- [x] Claude Code (haiku4.5) 向け詳細プロンプトを作成
- [ ] 必要に応じて色・ノイズの具体値をセット（後続作業）
- [ ] 実装後の確認項目を追記（後続作業）

### Notes / Plan Snapshot (Asia/Tokyo: 2025-12-02T21:58:34+09:00)
- `.claude/tasks/2025-12-02-hero-bg-unification-prompt.md` にhaiku4.5向けの実装プロンプトを作成。
- 方針: 背景/画像/GLが同一パレット・同一ノイズ・同一ブレンドを共有し、CSSフォールバックを即描画。HeroのみThree.js遅延ロードで差し替え可能にし、Gridや本文はCSSのまま。
- 成果物: 上記プロンプトドキュメント。後続で具体パレット値やノイズ素材を決めて指示に追加予定。

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
