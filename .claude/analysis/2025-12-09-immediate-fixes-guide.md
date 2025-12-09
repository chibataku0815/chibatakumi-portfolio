# Level 5到達への即実施改善ガイド

**日付**: 2025-12-09
**対象**: Profile & Skills ページ
**目標**: Level 2.5–3.0 → Level 4.5–5.0

---

## 📊 Before/After Overview

### Current State (Level 2.5–3.0)

```
❌ Signature Moment: 0個
❌ Fire（熱）要素: ほぼ欠落
❌ 感情アーク: 平坦
❌ 白バンド: 世界観破壊
⚠️  Amber使用: 22箇所（過剰、希釈）
⚠️  Typography: 階層弱い
⚠️  Composition: 黄金比未使用
```

### Target State (Level 4.5–5.0)

```
✅ Signature Moment: Color-Responsive Background
✅ Fire（熱）要素: インタラクション時に発現
✅ 感情アーク: Entry → Peak → Resolution
✅ 世界観: Pitch Black & Fire 完全体現
✅ Amber使用: 12箇所（戦略的配置）
✅ Typography: 極端な階層、editorial quality
✅ Composition: 黄金比、テンション
```

---

## 🚀 Priority 1: Immediate Fixes（本日実施）

### Fix 1.1: 白バンド削除（15分）

#### 問題
```tsx
// apps/web/src/features/skills/SkillsSections.tsx:12
const BAND_BG = "#f2f2f2";  // ❌ 突然の白背景

<h2 style={{ backgroundColor: BAND_BG, ... }}>
  {skill.title}
</h2>
```

**Impact**: Pitch Black 世界観を破壊、Level 3.0止まりの主要因

#### 解決策

**Option A: 削除（最も推奨）**
```tsx
// Before
<h2
  className="title-band relative inline-block text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
  style={{
    backgroundColor: BAND_BG,  // ❌ 削除
    padding: "0.3em 0.5em",
  }}
>
  {skill.title}
</h2>

// After: 究極の抑制（Pitch Black & Fire の美学）
<h2
  className="relative inline-block text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-[var(--text-base)]"
  style={{
    padding: "0.3em 0.5em",
  }}
>
  {skill.title}
</h2>
```

**Option B: Amber Outline（熱の縁取り）**
```tsx
<h2
  className="relative inline-block text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-[var(--text-base)] border-2 border-[var(--accent-amber1)]/40"
  style={{
    padding: "0.3em 0.5em",
  }}
>
  {skill.title}
</h2>
```

**Option C: Ghost Background（透過黒）**
```tsx
<h2
  className="relative inline-block text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-[var(--text-base)] bg-white/8 backdrop-blur-sm"
  style={{
    padding: "0.3em 0.5em",
  }}
>
  {skill.title}
</h2>
```

#### 実装手順

1. `apps/web/src/features/skills/SkillsSections.tsx` を開く
2. 12行目の `const BAND_BG = "#f2f2f2";` を削除
3. PatternA/B/Cの3箇所で以下を変更:

```tsx
// PatternA (146行目付近)
- style={{
-   backgroundColor: BAND_BG,
-   padding: "0.3em 0.5em",
- }}
+ style={{
+   padding: "0.3em 0.5em",
+ }}
- className="title-band relative inline-block ... text-black"
+ className="relative inline-block ... text-[var(--text-base)]"

// PatternB (251行目付近) も同様
// PatternC (291行目付近) も同様
```

4. `title-shadow` も削除（白背景前提の影）:
```tsx
- <div className="title-shadow absolute inset-0 translate-x-3 translate-y-3 bg-black/60" />
```

#### 期待効果
- **Level 3.0 → 3.5** 即座に到達
- 世界観の一貫性回復
- タイトルが「浮く」のではなく「統合」される

---

### Fix 1.2: Amber 戦略的削減（半日）

#### 問題
```
現状: 22箇所でAmber使用
→ 「限定使用、インタラクションの熱源」の原則に反する
→ 希釈され、インパクトなし
```

#### 解決策: Tier階層化

**Step 1: Heat Tokens定義**

`apps/web/src/app/globals.css` に追加:

```css
:root {
  /* ... 既存のトークン ... */

  /* ==========================================================================
     Heat Tokens (Amber アクセント階層)
     ========================================================================== */
  --heat-subtle: color-mix(in oklch, var(--accent-amber1) 30%, transparent);
  --heat-medium: var(--accent-amber1);
  --heat-intense: var(--accent-amber2);

  /* Heat Glow Effects */
  --heat-glow-sm: 0 0 8px color-mix(in oklch, var(--accent-amber1) 40%, transparent);
  --heat-glow-md: 0 0 12px color-mix(in oklch, var(--accent-amber1) 60%, transparent);
  --heat-glow-lg: 0 0 20px color-mix(in oklch, var(--accent-amber1) 80%, transparent);
}

@theme inline {
  /* ... 既存のトークン ... */
  --color-heat-subtle: var(--heat-subtle);
  --color-heat-medium: var(--heat-medium);
  --color-heat-intense: var(--heat-intense);
}
```

**Step 2: Tier定義と適用箇所**

##### Tier 1: Essential Heat（本質的な熱源）
**使用箇所**: 5箇所のみ、100% opacity

```tsx
// 1. Profile - Depth Indicator (最深層への進行)
// apps/web/src/features/profile/ProfileSections.tsx:185付近
background: `linear-gradient(90deg, var(--heat-intense) ${(depth + 1) * 15}%, ...)`

// 2. Profile - Origin Glow (根源の熱)
// apps/web/src/features/profile/components/OriginGlowGL.tsx:既存実装維持
uAmberColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) }

// 3. Skills - WebGL Shader Edge Glow (氷山が溶ける熱)
// apps/web/src/features/skills/components/ShaderImage.tsx:既存実装維持
uAmberColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) }

// 4. Contact - CTA Button (行動への熱い誘導)
// 未実装、Phase 2で追加

// 5. Hover State - Interactive Heat (触れた瞬間の熱発現)
// Phase 2で実装
```

##### Tier 2: Subtle Hints（微かな予感）
**使用箇所**: 7箇所、30-50% opacity

```tsx
// Skills - Meta lines
// apps/web/src/features/skills/SkillsSections.tsx:159, 239, 322
- <span className="h-px w-16" style={{ backgroundColor: skill.accent ?? "var(--accent-amber1)" }} />
+ <span className="h-px w-16 bg-[var(--heat-subtle)]" />

// Profile - Meta lines
// apps/web/src/features/profile/ProfileSections.tsx:144, 225
- <span className="h-px w-10 bg-[var(--accent-amber1)]" />
+ <span className="h-px w-10 bg-[var(--heat-subtle)]" />
```

##### Tier 3: 削除対象
**削除**: 10箇所

```tsx
// 1. SkillSectionSkeleton の amber-pulse
// apps/web/src/features/skills/components/SkillSectionSkeleton.tsx:35付近
- <div className="h-1 w-12 bg-[var(--accent-amber1)]/70 animate-[amber-pulse_1.5s_ease-in-out_infinite]" />
+ <div className="h-1 w-12 bg-white/20" />  // 通常のSkeleton色

// 2. Skills - Hybrid Skillset バッジ内のライン
// apps/web/src/features/skills/SkillsSections.tsx:64
- <span className="h-px w-12 bg-[var(--accent-amber1)]" />
+ 削除（バッジ自体がアクセント、内部ラインは過剰）

// 3-10. その他の装飾的使用箇所を監査して削除
```

#### 実装手順

1. **globals.css編集**（上記のHeat Tokens追加）
2. **SkillsSections.tsx編集**:
   ```bash
   # Meta linesを一括置換
   # 159, 239, 322行目付近
   ```
3. **ProfileSections.tsx編集**:
   ```bash
   # Meta linesを一括置換
   # 144, 225行目付近
   ```
4. **SkillSectionSkeleton.tsx編集**:
   ```bash
   # amber-pulse削除
   ```

#### 期待効果
- **Level 3.5 → 4.0**
- Amberが「熱源」として機能
- 希釈解消、インパクト増大
- "Pitch Black & Fire"の「Fire」が明確化

---

### Fix 1.3: Typography 階層強化（半日）

#### 問題
```
現状のサイズ比率:
  Hero Title: clamp(2.8rem, 8vw, 5rem)  // 44.8–80px
  Body Text:  1rem                       // 16px
  比率: 2.8:1 〜 5:1

→ 控えめすぎる、印象に残らない
→ Award-Worthy レベルは 8:1 〜 12:1
```

#### 解決策: 極端なサイズ対比

**Step 1: Typography Scale Token 再定義**

`apps/web/src/app/globals.css`:

```css
:root {
  /* Typography Scale - Award-Worthy Level */
  --type-display-hero: clamp(6rem, 18vw, 14rem);      /* 96–224px */
  --type-display-xl: clamp(4rem, 12vw, 10rem);        /* 64–160px */
  --type-display-lg: clamp(2.5rem, 8vw, 6rem);        /* 40–96px */
  --type-heading: clamp(1.8rem, 4vw, 3rem);           /* 28.8–48px */
  --type-body-lg: clamp(1.1rem, 1.5vw, 1.4rem);       /* 17.6–22.4px */
  --type-body: 1rem;                                   /* 16px */
  --type-caption: 0.875rem;                            /* 14px */

  /* Letter Spacing - Extreme Contrast */
  --tracking-ultra-tight: -0.06em;  /* Hero用 */
  --tracking-tighter: -0.04em;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.1em;
  --tracking-wider: 0.2em;         /* Meta lines用 */

  /* Font Weight - Extreme Contrast */
  --weight-ultra-light: 200;
  --weight-light: 300;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-ultra-bold: 800;
}
```

**Step 2: 適用箇所**

##### Skills Hero
`apps/web/src/features/skills/SkillsSections.tsx:68`:

```tsx
// Before
<AnimatedHeading
  as="h1"
  className="text-[clamp(2.8rem,8vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em]"
>
  Skills
</AnimatedHeading>

// After: 極端な大きさ + 極細
<AnimatedHeading
  as="h1"
  className="text-[var(--type-display-hero)] font-[200] leading-[0.9] tracking-[var(--tracking-ultra-tight)]"
>
  Skills
</AnimatedHeading>
```

##### Profile Hero
`apps/web/src/features/profile/ProfileSections.tsx:68`:

```tsx
// Before
<AnimatedHeading
  as="h1"
  className="text-[clamp(3.5rem,10vw,7rem)] font-semibold leading-[0.9] tracking-[-0.04em]"
>
  Profile
</AnimatedHeading>

// After: さらに極端に
<AnimatedHeading
  as="h1"
  className="text-[var(--type-display-hero)] font-[200] leading-[0.85] tracking-[var(--tracking-ultra-tight)]"
>
  Profile
</AnimatedHeading>
```

##### Section Titles（Skills/Profile共通）
```tsx
// Before
<h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-[-0.02em]">
  Strengths
</h2>

// After: サイズは維持、ウェイトを極端に
<h2 className="text-[var(--type-heading)] font-[700] tracking-[var(--tracking-tight)]">
  Strengths
</h2>
```

##### Skill Titles（白バンド削除後）
`apps/web/src/features/skills/SkillsSections.tsx:168, 251, 291`:

```tsx
// After: 極端な大きさ + 極太
<h2 className="relative inline-block text-[var(--type-display-xl)] font-[800] leading-[1] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]">
  {skill.title}
</h2>
```

**Step 3: Font Weight 確認**

Geist Sans が 200, 800 をサポートしているか確認:
```tsx
// apps/web/src/app/layout.tsx
import { GeistSans } from "geist/font/sans";

// weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] を確認
```

サポートしていない場合、代替:
- 200 → 300 (Light)
- 800 → 700 (Bold)

#### 期待効果
- **Level 3.5 → 4.0**
- 視覚的インパクト大幅増
- タイポグラフィが「画像」として機能
- Aristide Benoist レベルの editorial quality

---

### Fix 1.4: Composition - 黄金比適用（半日）

#### 問題
```
現状のグリッド比率:
  Pattern A: md:grid-cols-[1.2fr,1fr]  // 1.2:1
  Pattern B: md:grid-cols-[1fr,1.2fr]  // 1:1.2

→ 控えめすぎる、テンションなし
→ 黄金比 φ = 1.618:1 を使うべき
```

#### 解決策

`apps/web/src/features/skills/SkillsSections.tsx`:

```tsx
// Pattern A: 右重心（148行目付近）
// Before
<div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1.2fr,1fr]">

// After: 黄金比
<div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1.618fr,1fr]">

// Pattern B: 左重心（217行目付近）
// Before
<div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1fr,1.2fr]">

// After: 黄金比（逆）
<div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1fr,1.618fr]">

// Pattern C: 中央緊張（302行目付近）
// Before
<div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr,1.5fr]">

// After: 黄金比
<div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr,1.618fr]">
```

#### 期待効果
- **Level 3.5 → 4.0**
- 構図の緊張感増大
- 視覚的バランスの洗練
- "Professional" → "Award-Worthy" への転換

---

### Fix 1.5: Negative Space 拡大（半日）

#### 問題
```
現状:
  Breathing Zone: h-[15vh], h-[20vh], h-[30vh]
  → 不規則、理由不明
  → Element:Space 比率が低い（1:1未満）

Award-Worthy レベル:
  Luxury比率: 1:2+
  → 贅沢な余白が高級感を生む
```

#### 解決策

##### Skills Page
`apps/web/src/features/skills/SkillsClient.tsx`:

```tsx
// Before
<div className="h-[20vh]" aria-hidden="true" />  // Before sections
{/* sections */}
<div className="h-[30vh]" aria-hidden="true" />  // After sections

// After: 黄金比ベースの余白
<div className="h-[61.8vh]" aria-hidden="true" />  // φ × 100vh
{/* sections */}
<div className="h-[100vh]" aria-hidden="true" />   // φ² × 100vh
```

##### Profile Page
`apps/web/src/features/profile/ProfileClient.tsx`:

```tsx
// Before
<div className="h-[15vh]" aria-hidden="true" />  // 83行目
<div className="h-[20vh]" aria-hidden="true" />  // 111行目
<div className="h-[30vh]" aria-hidden="true" />  // 139行目

// After: 統一された黄金比スケール
<div className="h-[50vh]" aria-hidden="true" />   // 83行目: 十分な呼吸
<div className="h-[61.8vh]" aria-hidden="true" /> // 111行目: φ × 100vh
<div className="h-[100vh]" aria-hidden="true" />  // 139行目: φ² × 100vh
```

##### Section min-height も調整

```tsx
// Before
<section className="... min-h-screen ...">

// After: より高い min-height でゆとり
<section className="... min-h-[120vh] ...">
```

#### Token化（推奨）

`apps/web/src/app/globals.css`:

```css
:root {
  /* Breathing Zone Tokens (Golden Ratio Based) */
  --breath-sm: 38.2vh;   /* (1 - φ⁻¹) × 100 */
  --breath-md: 61.8vh;   /* φ⁻¹ × 100 */
  --breath-lg: 100vh;    /* φ⁰ × 100 */
  --breath-xl: 161.8vh;  /* φ × 100 */
}
```

適用:
```tsx
<div className="h-[var(--breath-md)]" aria-hidden="true" />
```

#### 期待効果
- **Level 3.5 → 4.0**
- 高級感・存在感の増大
- 「詰まっている」→「贅沢な余白」
- スクロール体験の向上（ゆったり、呼吸できる）

---

## 🎯 Priority 2: Signature Moment 実装（2週間）

### Feature 2.1: Color-Responsive Background

#### コンセプト
```
作品カードをホバーした瞬間、
背景シェーダーがその作品の色彩に呼応して変化する。

これが「触れた時の熱量」の核心実装。
```

#### 実装設計

**Step 1: WorkItem に dominantColor追加**

`apps/web/src/shared/data/portfolio.ts`:

```ts
export interface WorkItem {
  // ... 既存のフィールド
  media?: {
    type: "image" | "video";
    src: string;
    alt?: string;
    dominantColor?: string;  // 追加: #RRGGBB format
  };
}

// データに色を追加
export const portfolioData = {
  pages: {
    skills: [
      {
        id: "visual-photo-direction",
        title: "Visual & Photo Direction",
        media: {
          type: "image",
          src: "/images/...",
          dominantColor: "#D4AF37",  // 例: ゴールド
        },
        // ...
      },
      // ... 他のskillsにも追加
    ],
  },
};
```

**Step 2: Hover State管理**

`apps/web/src/features/skills/SkillsClient.tsx`:

```tsx
import { useState } from "react";

export default function SkillsClient({ skills }: SkillsClientProps) {
  // 追加: Hover State
  const [hoveredSkill, setHoveredSkill] = useState<WorkItem | null>(null);

  // ... 既存のコード

  return (
    <SkillsLayout>
      {/* Background に hovered情報を渡す */}
      <SkillsBackground
        dominantColor={hoveredSkill?.media?.dominantColor}
        intensity={hoveredSkill ? 0.6 : 0.1}
      />

      <SkillsIntro />
      <div className="h-[61.8vh]" aria-hidden="true" />

      {skills.map((skill, idx) => (
        <SkillSection
          key={skill.id}
          skill={skill}
          index={idx}
          setRef={setRef}
          onHoverChange={setHoveredSkill}  // 追加
        />
      ))}

      <div className="h-[100vh]" aria-hidden="true" />
    </SkillsLayout>
  );
}
```

**Step 3: SkillSection にホバーハンドラ追加**

`apps/web/src/features/skills/SkillsSections.tsx`:

```tsx
interface SkillSectionProps {
  skill: WorkItem;
  index: number;
  setRef: (el: HTMLElement | null, index: number) => void;
  onHoverChange?: (skill: WorkItem | null) => void;  // 追加
}

export function SkillSection({ skill, index, setRef, onHoverChange }: SkillSectionProps) {
  const pattern = getLayoutPattern(index);

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="skill-section ..."
      data-pattern={pattern}
      onMouseEnter={() => onHoverChange?.(skill)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      {/* ... 既存のコンテンツ */}
    </section>
  );
}
```

**Step 4: Background Shader を Color-Responsive に**

`apps/web/src/features/skills/SkillsSections.tsx`:

```tsx
interface SkillsBackgroundProps {
  dominantColor?: string;
  intensity?: number;
}

export function SkillsBackground({ dominantColor, intensity = 0.1 }: SkillsBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={fluidConfigMonochrome}
        fadeIn={true}
        dominantColor={dominantColor}     // 追加: shader に渡す
        intensity={intensity}              // 追加: 色の強度
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: BASE_BG,
          mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
    </div>
  );
}
```

**Step 5: FluidGradientBackground を拡張**

`apps/web/src/features/fluid-gradient/FluidGradientBackground.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

interface FluidGradientBackgroundProps {
  className?: string;
  config: any;
  fadeIn?: boolean;
  dominantColor?: string;   // 追加
  intensity?: number;       // 追加
}

export function FluidGradientBackground({
  className,
  config,
  fadeIn = false,
  dominantColor,
  intensity = 0.1,
}: FluidGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<any>(null);

  // Shader setup (既存)
  useEffect(() => {
    // ... Three.js setup

    uniformsRef.current = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0.02, 0.02, 0.02) },  // 初期色: Pitch Black
      uIntensity: { value: 0.1 },
      // ... other uniforms
    };

    // ... mesh, scene, renderer setup
  }, []);

  // Color transition on dominantColor change
  useEffect(() => {
    if (!uniformsRef.current) return;

    if (dominantColor) {
      const targetColor = new THREE.Color(dominantColor);

      // スムーズに色遷移
      gsap.to(uniformsRef.current.uColor.value, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 1.2,
        ease: "power2.inOut",
      });

      gsap.to(uniformsRef.current.uIntensity, {
        value: intensity,
        duration: 0.8,
        ease: "power2.out",
      });
    } else {
      // ホバー解除時: Pitch Blackに戻る
      gsap.to(uniformsRef.current.uColor.value, {
        r: 0.02,
        g: 0.02,
        b: 0.02,
        duration: 1.5,
        ease: "power2.inOut",
      });

      gsap.to(uniformsRef.current.uIntensity, {
        value: 0.1,
        duration: 1.0,
        ease: "power2.in",
      });
    }
  }, [dominantColor, intensity]);

  return <canvas ref={canvasRef} className={className} />;
}
```

**Step 6: Fragment Shader を拡張**

Shader内で `uColor` と `uIntensity` を使用:

```glsl
// fragmentShader
uniform vec3 uColor;
uniform float uIntensity;

void main() {
  // ... FBM計算

  vec3 baseColor = uColor;
  float noise = fbm(vUv * 3.0 + uTime * 0.1);

  vec3 finalColor = mix(
    vec3(0.02),  // Pitch Black
    baseColor,
    noise * uIntensity
  );

  gl_FragColor = vec4(finalColor, 1.0);
}
```

#### 期待効果
- ✅ **Signature Moment 獲得**（Level 4.5到達）
- ✅ 「触れた時の熱量」体現
- ✅ "Pitch Black & Fire" の核心実装
- ✅ 他サイトでは体験できない瞬間

#### 工数
3–5日（Shader実装、テスト、調整含む）

---

## 📈 Level到達予測

### 実装フェーズごとの到達Level

```
Phase 0 (現状):
  Level 2.5–3.0
  ├─ First Impression: L2
  ├─ Coherence: L3
  ├─ Craft: L3
  └─ Emotion: L2

Phase 1 (Immediate Fixes - 本日〜3日):
  Level 3.5–4.0
  ├─ Fix 1.1: 白バンド削除 → Coherence L4
  ├─ Fix 1.2: Amber削減 → Concept L4
  ├─ Fix 1.3: Typography → First Impression L3
  ├─ Fix 1.4: 黄金比 → Composition L4
  └─ Fix 1.5: Negative Space → Craft L4

Phase 2 (Signature Moment - 2週間):
  Level 4.5–5.0
  ├─ Color-Responsive BG → Signature Moment L5 ✓
  ├─ Hover State強化 → Interaction L5
  └─ Typography極端化 → First Impression L4

Phase 3 (Emotional Arc - 3週間):
  Level 5.0 (Award-Worthy)
  ├─ Heat Mapping → Emotion L5
  ├─ 全体調和 → Coherence L5
  └─ Craft Details → Innovation L5
```

### Quick Wins まとめ

**今日できること（2時間）**:
1. ✅ Fix 1.1: 白バンド削除（15分）
2. ✅ Fix 1.2: Amber削減開始（1時間）
3. ✅ Fix 1.4: 黄金比適用（30分）

**→ Level 3.0 → 3.5 即座に到達**

**今週完了（3日）**:
1. ✅ Phase 1全完了
2. ✅ Phase 2設計開始

**→ Level 3.5 → 4.0 到達**

---

## 🔄 次のステップ

### 推奨アクション（優先順）

1. **即実施（今から15分）**:
   ```bash
   # Fix 1.1: 白バンド削除
   code apps/web/src/features/skills/SkillsSections.tsx
   # 12行目、168行目、251行目、291行目を編集
   ```

2. **本日中（2時間）**:
   ```bash
   # Fix 1.2: Amber削減
   # globals.css → Heat tokens追加
   # SkillsSections.tsx → Meta lines置換
   # SkillSectionSkeleton.tsx → amber-pulse削除
   ```

3. **今週中（3日）**:
   ```bash
   # Fix 1.3, 1.4, 1.5: Typography, 黄金比, Negative Space
   # Phase 1完全完了
   ```

4. **来週開始（2週間）**:
   ```bash
   # Phase 2: Signature Moment実装
   # Color-Responsive Background
   # Level 4.5–5.0 到達
   ```

---

**このガイドに従って実装を開始してください。質問があれば随時対応します。**
