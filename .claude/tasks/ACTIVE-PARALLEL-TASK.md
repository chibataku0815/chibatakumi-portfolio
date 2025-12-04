# Active Parallel Task

## 🔄 Typography Direction & Shader Brush-up (2025-12-04T21:44:48+0900)
- Created: 2025-12-04T21:44:48+09:00 (Asia/Tokyo)
- Status: 📋 プロンプト作成完了 → 実装待ち
- Progress: 50%

### 目的
1. タイポグラフィの世界観を定義し、Pitch Black & Fire テーマに沿った「読みやすく尖った」トーンを決める
2. シェーダーに有機的な動き／インタラクションを足し、「なぜWebGLか」が伝わる表現へブラッシュアップする

### Checklist
- [x] 現状のHero shader/タイポグラフィ構成を調査
- [x] タイポグラフィスキルでデザイン方針を確認
- [x] シェーダーアニメーション技術調査 (RAF, uniform, GLSL patterns)
- [x] Haiku 4.5向け詳細実装プロンプトを作成
- [ ] 実装実行 (別チャットで)
- [ ] 動作確認・パラメータチューニング

### 成果物
- `.claude/tasks/2025-12-04-typography-shader-implementation-prompt.md` - Haiku 4.5向け実装プロンプト

### 変更予定ファイル
| ファイル | 変更内容 |
|----------|---------|
| `src/app/globals.css` | タイポグラフィCSS変数追加 |
| `src/app/page.tsx` | HeroText コンポーネント使用 |
| `src/features/hero/shader/types.ts` | uTime/uPointer/uScroll uniform追加 |
| `src/features/hero/shader/config/hero.ts` | シェーダーアニメーションパラメータ追加 |
| `src/features/hero/shader/materials/hero.ts` | 呼吸/カーソル/スクロール効果のGLSL追加 |
| `src/features/hero/components/HeroShaderBackground.tsx` | RAFループ + イベントリスナー追加 |
| `src/features/hero/components/HeroText.tsx` | **新規** GSAPダイナミックタイポアニメーション |
| `src/features/hero/components/index.ts` | HeroText export追加 |
| `src/shared/utils/splitText.ts` | **新規** 文字分割ユーティリティ |

### GSAP演出内容
- 文字分割 (SplitText風) + stagger reveal
- rotateX + y移動 での3D的な登場
- letter-spacing 0.15em → -0.02em の収束
- サブタイトル: clipPath クリップマスクreveal
- スクロールインジケーター: パルスアニメーション
- ScrollTrigger: パララックス + フェードアウト連動

### 調整パラメータ (config/hero.ts)
- `breathIntensity`: 呼吸する光の明度変調量 (0.05-0.15)
- `breathFrequency`: 呼吸のスピード (0.3-0.6)
- `cursorDistortionStrength`: カーソル歪みの強さ (0.01-0.03)
- `cursorDistortionRadius`: カーソル影響範囲の急峻さ (2.0-4.0)
- `cursorFbmPhaseShift`: カーソルによるFBM位相シフト (0.05-0.12)
- `scrollGrainScaleMin`: スクロール時grain最小スケール (0.8-0.9)
- `scrollGrainScaleMax`: スクロール時grain最大スケール (1.1-1.3)

---

## Archived Tasks

以下は完了済みタスクのアーカイブ参照:

- `archive/2025-12-02-bun-next-setup-guide.md` - Bun版 Next.js初期セットアップ
- `archive/2025-12-02-hero-bg-unification-prompt.md` - Hero/背景親和プロンプト
- `archive/2025-12-03-next-webgl-handoff-prompt.md` - WebGL保守性ハンドオフ
