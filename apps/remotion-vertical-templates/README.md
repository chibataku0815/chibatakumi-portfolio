# remotion-vertical-templates

Sabrina 系プロンプト（縦型 1080×1920・30fps）の実験用 Remotion アプリ。Film Lab の `remotion-film-lab` とは独立。

## 手順

```bash
cd apps/remotion-vertical-templates
bun install   # モノレポルートからなら一度だけ
bun run dev   # Remotion Studio（`/packages/...` は親で postinstall 済み想定）
```

## Composition ID

| ID | 内容 |
|----|------|
| `ProductDemoSabrina` | プロダクトデモ 25s（6 シーン・モック文言・`public/fixtures` 画像） |
| `TestimonialSabrina` | レビュー訴求 20s（5 シーン・`src/fixtures/reviews.mock.json`） |

## 書き出し例

```bash
bun run render:product
bun run render:testimonial
```

## worktree

開発ブランチ例: `exp/remotion-vertical-scaffold`（`git worktree` で `origin/main` から作成）。
