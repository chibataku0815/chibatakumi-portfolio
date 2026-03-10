# Hero Photo Visibility + Typography UI Redesign
**Date**: 2026-03-10
**Status**: Completed
**Team**: hero-photo-visibility (Agent Teams)

## Completed Tasks

### Task 1: シェーダー写真可視性改善
- **Agent**: shader-specialist
- object-contain → object-cover 変換
- config: baseColorDarken 0.55→0.72, edgeColorDarken 0.6→0.78, saturationRetain 0.6→0.78
- config: edgeFade 0.18→0.08, blendToBaseDistance 0.32→0.18, edgeInset 0.08→0.04
- config: blurRadius 0.05→0.03, minBrightness 0.06→0.03

### Task 2: portfolio.ts SNSデータ追加
- **Agent**: data-architect
- HeroContent型にsocialLinksフィールド追加
- GitHub / X / Instagram の3リンク追加

### Task 3: HomeHero UIリデザイン
- **Agent**: orchestrator (直接実装)
- ドメインセレクターパネル削除 → タイポグラフィのみ
- CTA削除 → SNSアイコンリンク
- CSSグラデーション軽減 (max 92%→72%)
- ドメインラベルのホバーでシェーダー連動維持

### Task 4: ビルド検証
- TypeScript型エラー修正 (BrandMark, BrandWordmark, Logo)
- ビルド成功確認

### 追加修正
- SectionScrollManager削除（スクロール反動バグ修正）
- ナビ透明化（ピル型コンテナ → 透明バー）
- SNSリンクURL修正

## Commit
`8af55b8` feat(hero): improve photo visibility, typography-only UI, and transparent nav

## Team Structure
| Agent | Role | Tasks |
|-------|------|-------|
| orchestrator | リード / UI実装 | Task 3, 4, 追加修正 |
| shader-specialist | WebGLシェーダー | Task 1 |
| data-architect | データ構造 | Task 2 |
