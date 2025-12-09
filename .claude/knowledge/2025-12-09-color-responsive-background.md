# Color-Responsive Background 実装ナレッジ

**作成日:** 2025-12-09
**タスク:** Phase 2 - Signature Moment
**レベル貢献:** L4 → L4.5+

---

## 概要

Skills/Profile ページでセクションをホバー/タップした際、背景の FluidGradientBackground がそのセクションの accent 色に呼応して変化する「Signature Moment」を実装。さらに、マウス周辺に回転テキストリングを表示する派手な装飾を追加。

---

## 実装アーキテクチャ

```
SkillsClient / ProfileClient (状態管理)
├─ hoveredSkillId / hoveredTitle: string | null
├─ accentColor = skills.find(s => s.id === hoveredSkillId)?.accent
│
├─ SkillsBackground / ProfileBackground
│   └─ FluidGradientBackground
│       └─ displayMaterial.uniforms
│           ├─ uAccentColor (vec3)
│           ├─ uAccentMix (float)
│           └─ iMouse (vec4)
│
├─ MouseTextRing (回転テキストリング)
│   ├─ デスクトップ: マウス追従
│   └─ モバイル: タップで出現 → 2.5秒後フェードアウト
│
└─ SkillSection / StrengthSection / TimelineSection
    ├─ onMouseEnter → setHoveredSkillId(skill.id)
    └─ onMouseLeave → setHoveredSkillId(null)
```

---

## 変更ファイル一覧

### シェーダー
- `apps/web/src/features/fluid-gradient/shader/materials/display.ts`
  - `uAccentColor`, `uAccentMix`, `iMouse` uniform 追加
  - 3層ラジアルグロー効果（マウス位置ベース）
  - パルスアニメーション

### FluidGradientBackground
- `apps/web/src/features/fluid-gradient/components/FluidGradientBackground.tsx`
  - `accentColor` prop 追加
  - `displayMaterialRef` で material 参照保持
  - GSAP で `uAccentMix` のトゥイーン
  - `iMouse` を displayMaterial に渡す

### Skills ページ
- `apps/web/src/features/skills/SkillsSections.tsx`
  - `SkillsBackground`: accentColor prop 追加
  - `SkillSection`: hover handlers 追加
- `apps/web/src/features/skills/SkillsClient.tsx`
  - `hoveredSkillId` state 追加
  - `MouseTextRing` コンポーネント追加

### Profile ページ
- `apps/web/src/features/profile/ProfileSections.tsx`
  - `ProfileBackground`: accentColor prop 追加
  - `StrengthSection`, `TimelineSection`: hover handlers 追加
- `apps/web/src/features/profile/ProfileClient.tsx`
  - hover state 追加
  - `MouseTextRing` コンポーネント追加

### 共通コンポーネント
- `apps/web/src/features/skills/components/MouseTextRing.tsx` (新規)
  - 回転テキストリング
  - 内側ダッシュリング（反時計回り）
  - 浮遊パーティクル
  - 中央クロスヘア
  - コーナーブラケット
  - デスクトップ: マウス追従（スムーズ補間）
  - モバイル: タップで出現 → 2.5秒後フェードアウト

---

## シェーダーの実装詳細

### マウスグロー効果
```glsl
// Mouse-based radial glow effect
if (iMouse.x > 0.0 && iMouse.y > 0.0 && uAccentMix > 0.01) {
  vec2 mouseUV = iMouse.xy / iResolution.xy;
  vec2 currentUV = fragCoord / iResolution.xy;

  float dist = distance(currentUV, mouseUV);

  // Multi-layer glow for depth
  float innerGlow = exp(-dist * dist * 80.0);  // Tight inner glow
  float midGlow = exp(-dist * dist * 20.0);    // Medium spread
  float outerGlow = exp(-dist * dist * 5.0);   // Soft outer halo

  vec3 mouseGlow = uAccentColor * 2.0 * innerGlow;
  mouseGlow += uAccentColor * 1.2 * midGlow;
  mouseGlow += uAccentColor * 0.5 * outerGlow;

  // Pulsing effect
  float pulse = 0.85 + 0.15 * sin(iTime * 2.5);
  mouseGlow *= pulse;

  col += mouseGlow * uAccentMix * 0.9;
}
```

---

## モバイル対応

### デバイス判定
```tsx
// pointer: fine → デスクトップ（マウス操作）
// pointer: coarse → モバイル（タッチ操作）
const isTouch = !window.matchMedia("(pointer: fine)").matches;
```

### タップ動作
- `touchstart` イベントでリング出現
- タップ位置に配置
- 2.5秒後に自動フェードアウト
- テキストがない場合は "Touch" を表示

---

## パフォーマンス考慮

- シェーダーの計算コストは minimal（exp, distance, mix のみ）
- GSAP の色トゥイーンは CPU 側で実行
- 60fps 維持を確認

---

## アクセント色データ

```typescript
// Skills (portfolio.ts)
"01" Visual & Photo:    #f2b869
"02" Code & Interaction: #e8a85a
"03" Motion & Sound:     #e19246
"04" Identity & Systems: #f0b25a

// Profile
共通: #e8a85a (PROFILE_ACCENT)
```

すべてウォームゴールド/アンバー系で「Pitch Black & Fire」世界観と整合。

---

## 今後の拡張可能性

1. **色の個別化**: Profile の各セクションにも固有の accent 色を設定
2. **パーティクルエフェクト**: 追加の WebGL パーティクル
3. **サウンド連動**: ホバー時に微かな効果音
4. **タッチジェスチャー**: スワイプで色変化など

---

## 関連ドキュメント

- `.claude/tasks/awwwards-upgrade/phase-2-signature-moment/01-color-responsive-background.md`
- `.claude/skills/webgl-shader/SKILL.md`
- `.claude/skills/art-direction/SKILL.md`
