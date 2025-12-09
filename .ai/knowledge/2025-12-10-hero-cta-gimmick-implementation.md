# Hero Section & CTA Gimmick Implementation

## 実施日
2025-12-10

## 概要
ポートフォリオサイトのHeroセクションとCTAボタンに高品質なギミックを実装。日本語Webフォント（Noto Sans JP）の導入も同時に実施。

---

## 実装内容

### 1. 日本語Webフォント導入

| ファイル | 変更内容 |
|---------|----------|
| `apps/web/src/app/fonts.ts` | 新規作成 - Geist + Noto Sans JP 設定 |
| `apps/web/src/app/layout.tsx` | fontVariables適用 |
| `apps/web/src/app/globals.css` | フォントファミリースタック追加 |

**フォールバックチェーン:**
```
Geist Sans → Noto Sans JP → Hiragino Sans → Meiryo → sans-serif
```

### 2. HeroText アニメーション強化

| 機能 | 実装内容 |
|------|----------|
| タイトル | マウス追従パララックス + ホバー時グリッチエフェクト |
| タグライン | タイプライター効果（無限ループ、subTagline含む） |
| カーソル | 点滅カーソル表示 |

**重要な技術的ポイント:**
- `allLines`配列は`useMemo`でメモ化必須（無限レンダリング防止）
- タイプライターは`revealedLines >= allLines.length`で3秒休止後リスタート

### 3. GlowButton コンポーネント

**ファイル:** `apps/web/src/shared/components/GlowButton.tsx`

**常時動作アニメーション（4種）:**
1. **テキストリング** - SVG textPath使用、15秒周期で逆回転
2. **流れる光** - conic-gradient、3秒周期で正回転
3. **呼吸パルス** - radial-gradient、2.5秒周期で明滅
4. **シマー効果** - border opacity、2秒周期で明滅

**CSSアニメーション定義:**
```css
@keyframes glowButtonRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes glowButtonRotateReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes glowButtonPulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.03); } }
@keyframes glowButtonShimmer { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
```

**SVGテキストリング実装:**
```tsx
<svg viewBox="0 0 180 180">
  <defs>
    <path id="glowButtonTextPath" d="M 90, 90 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" />
  </defs>
  <text fill="rgba(255, 255, 255, 0.5)" fontSize="10">
    <textPath href="#glowButtonTextPath">{orbitText}</textPath>
  </text>
</svg>
```

### 4. Contact送信ボタン

**ファイル:** `apps/web/src/features/contact/ContactClient.tsx`

横長ピル型ボタンのため、テキストリングは不採用。以下のギミックのみ：
- 流れる光（3秒周期）
- 呼吸パルス（2.5秒周期）
- シマー効果（2秒周期）
- マグネティック効果

---

## 技術的注意点

### スクロールバーチラつき防止
- GlowButtonにパディングラッパー（40px）追加
- 親セクションに`overflow-hidden`追加

### GSAPとCSSアニメーションの使い分け
- **GSAP**: マグネティック効果、ホバーインタラクション
- **CSS**: 常時回転、パルスなどの継続アニメーション

### SVG textPath 文字数
円周を完全に埋めるには十分な文字数が必要。短い場合は繰り返す：
```
"VIEW SKILLS • EXPLORE WORK • DISCOVER MORE • VIEW SKILLS • EXPLORE WORK • DISCOVER MORE • "
```

---

## 変更ファイル一覧

| ファイル | 操作 |
|---------|------|
| `apps/web/src/app/fonts.ts` | 新規作成 |
| `apps/web/src/app/layout.tsx` | 更新 |
| `apps/web/src/app/globals.css` | 更新 |
| `apps/web/src/app/page.tsx` | 更新 |
| `apps/web/src/features/hero/components/HeroText.tsx` | 大幅更新 |
| `apps/web/src/shared/components/GlowButton.tsx` | 新規作成 |
| `apps/web/src/shared/components/MagneticButton.tsx` | 新規作成 |
| `apps/web/src/shared/components/index.ts` | 更新 |
| `apps/web/src/features/contact/ContactClient.tsx` | 更新 |

---

## 失敗と学び

### ShaderButton（廃止）
WebGLベースのボタンを最初に実装したが、以下の問題で廃止：
- ボタンサイズが大きすぎ
- オレンジボーダーが太く醜い
- グレー背景ボックスが見える

**教訓:** WebGLは細かい調整が難しい。CSSアニメーションで十分な効果が得られる場合はそちらを優先。

### CSS @property の互換性
`@property`によるCSS変数アニメーションはブラウザ互換性に問題あり。GSAPまたは通常のCSSアニメーションを使用。
