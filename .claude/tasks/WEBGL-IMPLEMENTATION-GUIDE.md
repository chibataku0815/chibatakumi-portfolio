# WebGL 実装ガイド - 受賞レベル演出

Skills Page + Profile Page の WebGL シェーダー統合手順

---

## 実装済みコンポーネント（3つ）

### 1. ShaderImage（Skills Page）

**場所**: `apps/web/src/features/skills/components/ShaderImage.tsx`

**用途**: Skill セクションの画像を有機的に reveal

**特徴**:
- FBM ノイズによる円形 reveal
- Amber glow がエッジに沿って輝く
- スクロール連動（scrub: 0.8）

**使用方法**:

```tsx
// apps/web/src/features/skills/SkillsSections.tsx

import { ShaderImage } from "./components/ShaderImage";

// Pattern A/B/C の画像部分を置き換え
{skill.media?.type === "image" && (
  <ShaderImage
    src={skill.media.src}
    alt={skill.media.alt ?? skill.title}
    className="skill-image relative aspect-[4/5] overflow-hidden rounded-2xl"
    triggerRef={{ current: el }}  // section ref を渡す
  />
)}
```

**重要**: `triggerRef` は section の ref を渡すこと。

---

### 2. OriginGlowGL（Profile Page）

**場所**: `apps/web/src/features/profile/components/OriginGlowGL.tsx`

**用途**: Timeline 最深層（2011 Origin）の脈動する amber 光

**特徴**:
- Additive blending でグロー効果
- ノイズベースの有機的な輪郭
- ゆっくりとした脈動（1.5Hz）

**使用方法**:

```tsx
// apps/web/src/features/profile/ProfileSections.tsx

import { OriginGlowGL } from "./components/OriginGlowGL";

export function TimelineSection({ exp, index, total, setRef }: TimelineSectionProps) {
  const isDeepest = index === total - 1;

  return (
    <section ref={(el) => setRef(el, index)} ...>
      {/* 既存の Origin Glow (CSS) を削除 */}

      {/* WebGL 版に置き換え */}
      {isDeepest && (
        <OriginGlowGL
          triggerRef={{ current: el }}
          className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
          style={{ width: "300px", height: "300px" }}
        />
      )}

      {/* ... 既存コンテンツ ... */}
    </section>
  );
}
```

---

### 3. StrataLayerGL（Profile Page）

**場所**: `apps/web/src/features/profile/components/StrataLayerGL.tsx`

**用途**: Timeline 全セクションの背景に地層効果

**特徴**:
- 深さに応じて地層線の密度変化
- 深層（depth 0.7+）で化石の痕跡出現
- スクロールで地層が現れる演出

**使用方法**:

```tsx
// apps/web/src/features/profile/ProfileSections.tsx

import { StrataLayerGL } from "./components/StrataLayerGL";

export function TimelineSection({ exp, index, total, setRef }: TimelineSectionProps) {
  const depth = index;

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="timeline-section ..."
      data-depth={depth}
    >
      {/* WebGL 対応チェック */}
      {typeof window !== "undefined" && (
        <StrataLayerGL
          depth={depth / total}  // 0.0 ~ 1.0 に正規化
          triggerRef={{ current: el }}
          className="pointer-events-none absolute inset-0 -z-10"
        />
      )}

      {/* 既存の Grid Lines はフォールバックとして残す */}
      <div className="grid-lines ..." style={{ opacity: 0 }} />

      {/* ... 既存コンテンツ ... */}
    </section>
  );
}
```

---

## 段階的統合手順

### Phase 1: Skills Page ShaderImage

1. **ShaderImage をインポート**
   ```tsx
   import { ShaderImage } from "./components/ShaderImage";
   ```

2. **Pattern A/B/C の画像を置き換え**
   - 既存の `<img>` タグを `<ShaderImage>` に
   - `triggerRef` を section ref として渡す

3. **検証**
   - [ ] 画像が円形に reveal される
   - [ ] Amber glow がエッジに出現
   - [ ] スクロール連動が滑らか

### Phase 2: Profile Page OriginGlowGL

1. **OriginGlowGL をインポート**
   ```tsx
   import { OriginGlowGL } from "./components/OriginGlowGL";
   ```

2. **既存の Origin Glow (CSS div) を削除**
   ```tsx
   // 削除:
   {isDeepest && (
     <div className="origin-glow ..." style={{ filter: "blur(60px)" }} />
   )}
   ```

3. **WebGL 版に置き換え**

4. **検証**
   - [ ] 最深層でのみ表示
   - [ ] ゆっくり脈動している
   - [ ] スクロールで徐々に現れる

### Phase 3: Profile Page StrataLayerGL

1. **StrataLayerGL をインポート**
   ```tsx
   import { StrataLayerGL } from "./components/StrataLayerGL";
   ```

2. **Timeline 各セクションに追加**
   - Grid Lines の前に配置
   - `depth` を正規化して渡す

3. **検証**
   - [ ] 浅い層は地層線が疎
   - [ ] 深い層は地層線が密
   - [ ] 深層（70%+）で化石が出現
   - [ ] スクロールで地層が現れる

---

## パフォーマンス最適化

### GPU 負荷の分散

```
同時に動作する Canvas:
- Skills: 最大 3個 (各 Skill セクションに ShaderImage)
- Profile: 最大 5個 (4 Timeline + 1 OriginGlow)

→ 合計 8個まで

Bottleneck 回避策:
1. Viewport 外の Canvas は自動的に描画停止（R3F の仕組み）
2. Fragment shader のループは最大 4回（FBM octaves）
3. Texture は dispose() で確実に解放
```

### メモリ管理

すべてのコンポーネントに `useEffect` cleanup 実装済み:

```tsx
useEffect(() => {
  return () => {
    materialRef.current?.dispose();
    texture?.dispose();
  };
}, []);
```

### 60fps 維持チェック

開発時に確認:

```tsx
// Chrome DevTools > Performance
// FPS counter を有効化

// Target: 60fps 維持
// Acceptable: 55fps 以上
// Warning: 50fps 以下（最適化必要）
```

---

## WebGL 非対応時のフォールバック

### 検出方法

```tsx
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch (e) {
    return false;
  }
}
```

### フォールバック実装

```tsx
// Skills Page
{isWebGLSupported() ? (
  <ShaderImage src={...} />
) : (
  <img src={...} className="skill-image ..." />
)}

// Profile Page - StrataLayerGL
{isWebGLSupported() && <StrataLayerGL ... />}
{/* Grid Lines はフォールバックとして常に存在 */}

// Profile Page - OriginGlowGL
{isDeepest && isWebGLSupported() && <OriginGlowGL ... />}
{/* CSS グロー (filter: blur) をフォールバックとして残す */}
```

---

## Art Direction との整合性

### ShaderImage（Skills）

**コンセプト**: "氷山の一角が溶けて姿を現す"

- Amber glow = 溶けた熱の余韻
- FBM distortion = 有機的な溶解
- Circular reveal = 中心から外への解放

### OriginGlowGL（Profile）

**コンセプト**: "地層の最深部で脈動する原初の熱"

- Pulse = 生命の鼓動
- Amber = 根源の温もり
- Additive blending = 光が闇を貫く

### StrataLayerGL（Profile）

**コンセプト**: "掘り進むほど現れる歴史の層"

- Horizontal lines = 時間の堆積
- Fossils (深層のみ) = 原初の痕跡
- Scroll reveal = 掘削の行為

---

## トラブルシューティング

### 問題: 画面が真っ黒

**原因**: Shader compilation error

**解決**:
1. Console でエラー確認
2. GLSL syntax チェック
3. `uniform` の型不一致を確認

### 問題: パフォーマンス低下

**原因**: 複数の Canvas が同時に動作

**解決**:
1. DevTools Performance タブで確認
2. Fragment shader のループ回数を減らす
3. Geometry の subdivision を減らす (64 → 32)

### 問題: モバイルで動かない

**原因**: WebGL サポート or パフォーマンス

**解決**:
1. `isWebGLSupported()` でチェック
2. モバイルでは FBM octaves を 4 → 3 に削減
3. フォールバックを確実に実装

---

## 最終チェックリスト

### Skills Page
- [ ] ShaderImage が全 Skill セクションで動作
- [ ] Amber glow がエッジに沿って輝く
- [ ] スクロール連動が滑らか
- [ ] WebGL 非対応時に `<img>` が表示

### Profile Page
- [ ] StrataLayerGL が Timeline 全セクションで表示
- [ ] 深さに応じて地層線の密度変化
- [ ] 深層で化石が出現
- [ ] OriginGlowGL が最深層のみで脈動
- [ ] 60fps 維持

### パフォーマンス
- [ ] Canvas が 8個以下
- [ ] メモリリークなし（dispose 実装）
- [ ] モバイルで動作確認

---

## 完了後の体験

### Skills Page
「画像が氷山のように溶けて現れ、エッジに amber の熱が走る」

### Profile Page
「時間を掘り進むほど地層が現れ、最深部で原初の光に到達する」

---

**これで受賞レベルの WebGL 演出が完成します。**
