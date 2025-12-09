# Skills Page 受賞レベル品質実装プロンプト

Haiku 4.5 向け詳細実装指示書

---

## 絶対禁止事項（最重要）

```
1. git commit は絶対に実行しない
2. git add も実行しない
3. コミットメッセージの作成もしない
4. 「コミットしますか？」と聞かない
5. back.out, bounce, elastic 系 ease は使用禁止
6. backgroundPositionY は使用禁止（transform を使用）
```

---

## 現状の問題点

### 1. Description の文字単位 reveal が未実装

**現状** (`SkillsAnimations.ts:167-173`):
```typescript
// T+1.2s: Description (文字分割なし、シンプルにフェードイン)
if (description) {
  tl.to(
    description,
    { opacity: 1, duration: config.description.duration, ease: config.description.ease },
    1.2
  );
}
```

**問題**: 単純なフェードインでは「語り始める」感覚が出ない。ビジョンでは「1文字ずつ opacity: 0 → 1 + blur(4px) → blur(0)」と指定されている。

### 2. Title Shadow の追従が不完全

**現状** (`SkillsSections.tsx:165`, `248`, `288`):
```tsx
<div className="title-shadow absolute inset-0 translate-x-3 translate-y-3 bg-black/60" />
```

**問題**: 影が常に表示されている。ビジョンでは「タイトル後に影がついてくる」＝タイトルが登場した後に、影が遅れて追従する演出が必要。

### 3. Parallax の動きが粗い

**現状** (`SkillsAnimations.ts:218-250`):
```typescript
scrub: 0.8,
```

**問題**: scrub 値が固定で、Ghost の「沈んでいく」感覚が不十分。速度差のレイヤー設計も活かしきれていない。

### 4. ease の選定が単調

**現状**: ほぼ全て `expo.out` または `power2.out`

**問題**: 緩急がない。motion-design の原則「Slow In / Slow Out」を活かすには、要素ごとに適切な ease を選定すべき。

### 5. Grid Lines の初期状態

**現状** (`SkillsSections.tsx:98-106`):
```tsx
<div
  className="grid-lines ..."
  style={{
    // opacity: 0 の初期設定がない
    willChange: "transform, opacity",
  }}
/>
```

**問題**: `setInitialState` で設定しているが、CSS 側に初期値がないため、GSAP 読み込み前にちらつく可能性。

### 6. セクション間の「呼吸」が形式的

**現状** (`SkillsClient.tsx:89-90`, `102-103`):
```tsx
<div className="h-[20vh]" aria-hidden="true" />
// ...
<div className="h-[30vh]" aria-hidden="true" />
```

**問題**: 単なる空白。ビジョンでは「次の Ghost が深淵から浮上し始める」予感の演出が必要。

---

## 修正指示

### Task 1: Description の文字単位 reveal 実装

`apps/web/src/features/skills/SkillsAnimations.ts` を修正:

```typescript
// T+1.2s: Description - 文字単位でタイプライター的reveal
if (description) {
  const text = description.textContent || "";
  // 元のテキストを保持
  description.setAttribute("data-original-text", text);

  // 文字を span でラップ（空白は直接出力）
  description.innerHTML = text
    .split("")
    .map((char, i) =>
      char === " "
        ? " "
        : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
    )
    .join("");

  const chars = description.querySelectorAll<HTMLElement>(".char");

  if (chars.length > 0) {
    tl.to(
      chars,
      {
        opacity: 1,
        filter: "blur(0px)",
        stagger: config.description.charStagger, // 0.008s/char
        duration: config.description.duration,    // 0.6s
        ease: config.description.ease,            // power2.out
        clearProps: "filter",
      },
      1.2
    );
  }
}
```

**補足**:
- `display: inline-block` は blur が効くために必要
- `clearProps: "filter"` でアニメーション後にフィルターを削除
- 空白は span 化しない（レイアウト崩れ防止）

### Task 2: Title Shadow の遅延追従

`apps/web/src/features/skills/SkillsSections.tsx` の各パターンで、影の初期状態を設定:

**Pattern A (`SkillsSections.tsx:164-165`)**:
```tsx
{/* Title */}
<div className="relative">
  <div
    className="title-shadow absolute inset-0 translate-x-3 translate-y-3 bg-black/60"
    style={{ opacity: 0 }}  // 追加: 初期状態は非表示
  />
```

**Pattern B (`SkillsSections.tsx:247-248`)**:
```tsx
<div className="relative text-right">
  <div
    className="title-shadow absolute inset-0 -translate-x-3 translate-y-3 bg-black/60"
    style={{ opacity: 0 }}  // 追加
  />
```

**Pattern C (`SkillsSections.tsx:287-288`)**:
```tsx
<div className="relative text-center">
  <div
    className="title-shadow absolute inset-0 translate-y-4 bg-black/60"
    style={{ opacity: 0 }}  // 追加
  />
```

`SkillsAnimations.ts` の setupSectionEntry 関数で、影のアニメーションを調整:

```typescript
// T+0.9s: Title
if (titleBand) {
  tl.to(
    titleBand,
    {
      x: "0%",
      opacity: 1,
      duration: config.title.duration,
      ease: config.title.ease,
    },
    0.9
  );

  // T+1.3s: Shadow follows (タイトル完了後、0.4秒遅れ)
  if (titleShadow) {
    tl.to(
      titleShadow,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.5,       // 少し長めに
        ease: "power3.out",  // より滑らかに
      },
      1.3  // タイトル完了(0.9+0.9=1.8)より前だが、動き出しは遅れて見える
    );
  }
}
```

### Task 3: Grid Lines の CSS 初期状態

`apps/web/src/features/skills/SkillsSections.tsx` の Grid Lines に初期 opacity を追加:

```tsx
{/* Grid Lines (背景レイヤー) */}
<div
  className="grid-lines pointer-events-none absolute inset-0 -z-[6] mix-blend-soft-light"
  style={{
    backgroundImage:
      "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "100px 100px",
    opacity: 0,  // 追加: CSS レベルで初期非表示
    willChange: "transform, opacity",
  }}
/>
```

### Task 4: Parallax の scrub 値と速度調整

`apps/web/src/features/skills/SkillsAnimations.ts` の setupParallax を調整:

```typescript
export function setupParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const content = el.querySelector<HTMLElement>(".skill-content");
  const accents = el.querySelectorAll<HTMLElement>(".accent-element");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    scrub: 1.2,  // 変更: より滑らかに（0.8 → 1.2）
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5; // -0.5 ~ 0.5

      // Ghost: 「沈んでいく」感覚を強化
      if (ghost) {
        const y = centered * config.ghost.speed * 120;  // 変更: 100 → 120（動きを大きく）
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange * 1.5;  // スケール変化を強化
        const baseOpacity = 0.15;
        const opacity = baseOpacity - Math.abs(centered) * config.ghost.opacityRange * 1.2;

        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.04, opacity));
      }

      // Content: 微細な追従（変更なし）
      if (content) {
        const y = centered * config.content.speed * 50;
        content.style.transform = `translateY(${y}px)`;
      }

      // Accents: 中程度の追従
      for (const accent of accents) {
        const y = centered * config.accent.speed * 60;  // 変更: 80 → 60（より繊細に）
        accent.style.transform = `translateY(${y}px)`;
      }

      // Grid Lines: オーバースクロール
      if (gridLines) {
        const y = progress * config.background.speed * 50;  // 変更: 40 → 50
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
```

### Task 5: ease の多様化

`apps/web/src/features/skills/SkillsAnimations.ts` の ANIMATION_CONFIG を拡張:

```typescript
export const ANIMATION_CONFIG = {
  entry: {
    ghost: {
      initialY: 80,
      initialBlur: 12,
      initialScale: 1.1,
      finalOpacity: 0.15,
      duration: 1.2,
      ease: "expo.out",  // 維持: 深淵から浮上する感覚
    },
    rail: {
      duration: 1.0,
      ease: "power3.out",  // 変更: expo.out → power3.out（構造的な動き）
    },
    title: {
      initialX: "-120%",
      duration: 0.9,
      ease: "expo.out",  // 維持: 確信に満ちた登場
    },
    description: {
      charStagger: 0.008,
      charBlur: 4,
      duration: 0.6,
      ease: "power2.out",  // 維持: 語りのリズム
    },
    tags: {
      initialY: 20,
      stagger: 0.08,
      duration: 0.4,
      ease: "power2.out",  // 変更: power3.out → power2.out（ピアノ的）
    },
    image: {
      clipDuration: 1.0,
      ease: "power4.out",  // 変更: expo.out → power4.out（reveal 的）
    },
    shadow: {
      duration: 0.5,
      ease: "power3.out",  // 追加: 影専用
    },
    gridLines: {
      duration: 0.8,
      ease: "power1.out",  // 追加: 最も控えめ
    },
  },
  // ... parallax は既存のまま
} as const;
```

### Task 6: セクション間の「呼吸」ゾーンに予感を追加

`apps/web/src/features/skills/SkillsSections.tsx` に新コンポーネントを追加:

```tsx
// ファイル末尾に追加
export function BreathingZone({ nextSkillMeta }: { nextSkillMeta?: string }) {
  return (
    <div className="breathing-zone relative h-[30vh] overflow-hidden">
      {/* 次の Ghost の予感 */}
      {nextSkillMeta && (
        <div
          className="ghost-preview pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em]"
          style={{
            fontSize: "clamp(8rem, 20vw, 16rem)",
            color: "rgba(255,255,255,0.03)",
            mixBlendMode: "overlay",
            filter: "blur(8px)",
          }}
        >
          {nextSkillMeta.split(" ")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}
```

`apps/web/src/features/skills/SkillsClient.tsx` で使用:

```tsx
import {
  SkillsLayout,
  SkillsBackground,
  SkillsIntro,
  SkillSection,
  BreathingZone,  // 追加
} from "./SkillsSections";

// return 内:
{/* Skill Sections */}
{skills.map((skill, idx) => (
  <Fragment key={skill.id}>
    <SkillSection
      skill={skill}
      index={idx}
      setRef={setRef}
    />
    {/* 次のセクションがある場合、呼吸ゾーンを挿入 */}
    {idx < skills.length - 1 && (
      <BreathingZone nextSkillMeta={skills[idx + 1]?.meta} />
    )}
  </Fragment>
))}
```

**Fragment のインポートを忘れずに**:
```tsx
import { Fragment, useCallback, useEffect, useRef } from "react";
```

---

## アニメーションタイムライン（最終版）

```
T+0.0s  ────────────────────────────────
        │
        │  [Grid Lines: 深淵から浮かび上がる]
        │  opacity: 0 → 0.08
        │  Duration: 0.8s
        │  Ease: power1.out
        │  Mood: 「空間の存在を感じる」
        │
T+0.3s  ────────────────────────────────
        │
        │  [Ghost Text: 深淵から浮上]
        │  blur(12px) → blur(0)
        │  y: 80 → 0
        │  opacity: 0 → 0.15
        │  scale: 1.1 → 1.0
        │  Duration: 1.2s
        │  Ease: expo.out
        │  Mood: 「存在の予感」
        │
T+0.6s  ────────────────────────────────
        │
        │  [Rail: 上から下へ reveal]
        │  clipPath: inset(0 0 100% 0) → inset(0)
        │  Duration: 1.0s
        │  Ease: power3.out
        │  Mood: 「構造の出現」
        │
T+0.9s  ────────────────────────────────
        │
        │  [Title Band: 左からスライド]
        │  x: -120% → 0%
        │  opacity: 0 → 1
        │  Duration: 0.9s
        │  Ease: expo.out
        │  Mood: 「主題の提示」
        │
T+1.2s  ────────────────────────────────
        │
        │  [Description: 文字単位 reveal]
        │  各文字: opacity: 0 → 1, blur(4px) → blur(0)
        │  Stagger: 0.008s/char
        │  Duration: 0.6s
        │  Ease: power2.out
        │  Mood: 「語り始める」
        │
T+1.3s  ────────────────────────────────
        │
        │  [Title Shadow: 遅れて追従]
        │  opacity: 0 → 1
        │  x/y: offset → 0
        │  Duration: 0.5s
        │  Ease: power3.out
        │  Mood: 「深みの確立」
        │
T+1.6s  ────────────────────────────────
        │
        │  [Tags: ピアノの鍵盤的 stagger]
        │  y: 20 → 0
        │  opacity: 0 → 1
        │  Stagger: 0.08s
        │  Duration: 0.4s
        │  Ease: power2.out
        │  Mood: 「技術の音楽」
        │
T+2.0s  ────────────────────────────────
        │
        │  [Image: circle mask reveal]
        │  clipPath: circle(0%) → circle(100%)
        │  Duration: 1.0s
        │  Ease: power4.out
        │  Mood: 「視覚的証拠」
        │
T+3.0s  ────────────────────────────────
        │
        │  [セクション完成]
        │  Parallax がスクロールに連動
        │
────────────────────────────────────────
```

---

## 品質チェックリスト

### 構図
- [ ] セクションごとに Pattern A/B/C がローテーションしている
- [ ] Ghost Text が viewport 外にはみ出して緊張を作っている
- [ ] Grid Lines が控えめに空間の奥行きを演出している

### モーション
- [ ] Description が文字単位で reveal している
- [ ] Title の後に Shadow が遅れて追従している
- [ ] Tags がピアノの鍵盤を叩くように順番に現れる
- [ ] Image が中心から circle mask で reveal している
- [ ] Ghost が parallax で「沈んでいく」感覚がある

### ease の適切さ
- [ ] Ghost: expo.out（深淵からの浮上）
- [ ] Rail: power3.out（構造的）
- [ ] Title: expo.out（確信）
- [ ] Description: power2.out（語り）
- [ ] Tags: power2.out（リズミカル）
- [ ] Image: power4.out（reveal）
- [ ] Shadow: power3.out（追従）

### パフォーマンス
- [ ] will-change が transform, opacity のみに限定
- [ ] filter は clearProps で解除
- [ ] レイアウト系プロパティ（width, margin 等）を動かしていない

### 禁止事項
- [ ] git commit を実行していない
- [ ] back.out, bounce, elastic を使用していない
- [ ] backgroundPositionY を使用していない
- [ ] すべて中央配置になっていない

---

## 実装順序

1. **Grid Lines の初期状態** - CSS に opacity: 0 追加
2. **Title Shadow の初期状態** - 各パターンに opacity: 0 追加
3. **ANIMATION_CONFIG の拡張** - ease の多様化
4. **Description の文字単位 reveal** - setupSectionEntry 修正
5. **Shadow の遅延追従** - setupSectionEntry 修正
6. **Parallax の調整** - scrub 値と速度倍率の変更
7. **BreathingZone コンポーネント** - 新規追加
8. **SkillsClient での使用** - Fragment + BreathingZone

---

## 補足: 神は細部に宿る

### 文字単位 reveal の意図

「語り始める」感覚を演出するため、Description は単純なフェードインではなく、タイプライター的な reveal にする。これにより：

- 訪問者の視線が文字を追う
- 読む速度と reveal 速度が同期する感覚
- 「今、語られている」というライブ感

### Shadow 追従の意図

Title Band が登場した後、少し遅れて影が追いつく演出は：

- 「慣性」を表現（Follow Through の原則）
- Title に「重み」を与える
- 奥行き感の確立

### ease の選定理由

| 要素 | ease | 理由 |
|------|------|------|
| Ghost | expo.out | 深淵からの浮上、速く始まり優雅に終わる |
| Rail | power3.out | 構造的、安定感のある動き |
| Title | expo.out | 確信に満ちた登場 |
| Description | power2.out | 穏やかな語り、読みやすさ |
| Tags | power2.out | リズミカル、音楽的 |
| Image | power4.out | ドラマチックな reveal |
| Shadow | power3.out | 追従、二次的な動き |

---

**重要**: このプロンプトを実行後、必ず目視で確認してください。数値やタイミングは実際の見た目で微調整が必要になる場合があります。

**再度強調**: git commit は絶対に実行しないこと。

---

# Part 2: Three.js による受賞レベル演出

GSAPアニメーションだけでは受賞は難しい。Three.js/WebGL を活用して、記憶に残るビジュアル体験を構築する。

---

## Three.js 追加要素

### 1. Skill Image の Distortion Reveal

現在の `clipPath: circle()` は CSS レベル。シェーダーによるノイズベースの reveal に置き換える。

**新規ファイル**: `apps/web/src/features/skills/shader/imageReveal.ts`

```typescript
export const imageRevealVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const imageRevealFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uProgress;      // 0.0 ~ 1.0
  uniform float uNoiseScale;    // ノイズの粗さ
  uniform vec2 uResolution;

  varying vec2 vUv;

  // Simple hash noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // FBM for organic reveal edge
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Center-based distance
    vec2 center = uv - 0.5;
    float dist = length(center);

    // Add noise to the reveal edge
    float noiseValue = fbm(uv * uNoiseScale);

    // Reveal threshold with noise distortion
    float threshold = uProgress * 1.5;  // Slightly overshoot for full reveal
    float edge = smoothstep(threshold - 0.1 - noiseValue * 0.2, threshold, dist);

    // Sample texture
    vec4 color = texture2D(uTexture, uv);

    // Apply reveal mask (1.0 - edge to invert)
    color.a *= 1.0 - edge;

    // Add subtle glow at reveal edge
    float glowStrength = smoothstep(0.05, 0.0, abs(dist - threshold + noiseValue * 0.1));
    color.rgb += vec3(0.95, 0.85, 0.7) * glowStrength * 0.3;  // Warm amber glow

    gl_FragColor = color;
  }
`;
```

**新規コンポーネント**: `apps/web/src/features/skills/components/ShaderImage.tsx`

```tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree, Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { imageRevealVertex, imageRevealFragment } from "../shader/imageReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ShaderImageMeshProps {
  src: string;
  progress: React.MutableRefObject<number>;
}

function ShaderImageMesh({ src, progress }: ShaderImageMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const texture = useTexture(src);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uProgress: { value: 0 },
      uNoiseScale: { value: 8.0 },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    }),
    [texture, viewport]
  );

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={imageRevealVertex}
        fragmentShader={imageRevealFragment}
        transparent
      />
    </mesh>
  );
}

interface ShaderImageProps {
  src: string;
  alt: string;
  className?: string;
  triggerRef: React.RefObject<HTMLElement>;
}

export function ShaderImage({ src, alt, className, triggerRef }: ShaderImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top 70%",
      end: "top 30%",
      scrub: 0.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, [triggerRef]);

  return (
    <div ref={containerRef} className={className} aria-label={alt}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ShaderImageMesh src={src} progress={progressRef} />
      </Canvas>
    </div>
  );
}
```

### 2. Ghost Text の歪みシェーダー

Ghost Text をスクロールに連動して歪ませる。深淵から浮かび上がり、沈んでいく感覚を強化。

**新規ファイル**: `apps/web/src/features/skills/shader/ghostText.ts`

```typescript
export const ghostTextVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;  // 0.0 (top) ~ 1.0 (bottom)
  uniform float uDistortion;

  varying vec2 vUv;

  // Simple noise for vertex displacement
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Subtle wave distortion based on scroll
    float wave = sin(pos.x * 2.0 + uTime * 0.5) * 0.02;
    wave += sin(pos.y * 3.0 + uTime * 0.3) * 0.015;

    // Increase distortion as scroll progresses (Ghost "sinks")
    float sinkFactor = abs(uScrollProgress - 0.5) * 2.0;
    pos.z += wave * sinkFactor * uDistortion;
    pos.y -= sinkFactor * 0.1;  // Subtle vertical sink

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const ghostTextFragment = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying vec2 vUv;

  void main() {
    // Base opacity decreases as Ghost sinks
    float sinkFactor = abs(uScrollProgress - 0.5) * 2.0;
    float opacity = uOpacity * (1.0 - sinkFactor * 0.5);

    // Add subtle noise grain
    float grain = fract(sin(dot(vUv * 100.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    grain = (grain - 0.5) * 0.05;

    vec3 color = uColor + grain;

    gl_FragColor = vec4(color, opacity);
  }
`;
```

### 3. セクション間トランジションシェーダー

セクションが切り替わる際の「深淵への沈降」と「浮上」を表現。

**新規ファイル**: `apps/web/src/features/skills/shader/sectionTransition.ts`

```typescript
export const sectionTransitionFragment = /* glsl */ `
  uniform float uProgress;    // 0.0 ~ 1.0 (current section exit)
  uniform float uNextProgress; // 0.0 ~ 1.0 (next section entry)
  uniform vec2 uResolution;
  uniform float uTime;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;

    // Vertical gradient for "sinking" effect
    float verticalGradient = uv.y;

    // Add noise for organic edge
    float n = noise(uv * 6.0 + uTime * 0.1);

    // Current section fades from bottom up (sinking)
    float exitMask = smoothstep(uProgress - 0.2 - n * 0.1, uProgress, verticalGradient);

    // Next section reveals from top down (emerging)
    float entryMask = smoothstep(1.0 - uNextProgress + 0.2 + n * 0.1, 1.0 - uNextProgress, verticalGradient);

    // Combine masks
    float alpha = exitMask * (1.0 - entryMask);

    // Deep black with subtle variation
    vec3 color = vec3(0.04, 0.04, 0.05) + n * 0.02;

    gl_FragColor = vec4(color, alpha);
  }
`;
```

### 4. マウス追従のパーティクル/歪み（控えめ）

Skills Page 全体に、マウスに反応する微細なパーティクルまたは歪みを追加。既存の FluidGradientBackground を活用しつつ、よりサブトルに。

**修正対象**: `apps/web/src/features/skills/SkillsSections.tsx`

```tsx
// SkillsBackground を修正

export function SkillsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={{
          ...fluidConfigMonochrome,
          // よりサブトルな設定
          brushStrength: 0.3,      // デフォルトより弱く
          distortionAmount: 0.15,  // 歪みを抑える
          colorIntensity: 0.4,     // 色を抑える
          softness: 0.8,           // よりソフトに
        }}
        fadeIn={true}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: BASE_BG,
          mixBlendMode: "multiply",
          opacity: 0.92,  // 少し強めに黒を重ねる
        }}
      />
    </div>
  );
}
```

---

## 実装アーキテクチャ

```
apps/web/src/features/skills/
├── SkillsClient.tsx           # メイン（GSAP + R3F 管理）
├── SkillsSections.tsx         # セクションコンポーネント
├── SkillsAnimations.ts        # GSAPアニメーション設定
├── components/
│   ├── ShaderImage.tsx        # 画像の Distortion Reveal
│   └── GhostTextGL.tsx        # Ghost Text のシェーダー版（オプション）
├── shader/
│   ├── imageReveal.ts         # 画像 reveal シェーダー
│   ├── ghostText.ts           # Ghost テキストシェーダー
│   └── sectionTransition.ts   # セクション遷移シェーダー
└── index.ts
```

---

## 段階的実装ガイド

### Phase 1: 既存の GSAP 改善（Part 1 で対応済み）
- Description 文字単位 reveal
- Title Shadow 追従
- Parallax 調整
- ease 多様化

### Phase 2: ShaderImage コンポーネント追加
1. `shader/imageReveal.ts` を作成
2. `components/ShaderImage.tsx` を作成
3. `SkillsSections.tsx` で `skill-image` を `ShaderImage` に置き換え

**置き換え例**:
```tsx
// Before
{skill.media?.type === "image" && (
  <div className="skill-image relative aspect-[4/5] overflow-hidden rounded-2xl">
    <img src={skill.media.src} alt={skill.media.alt ?? skill.title} ... />
  </div>
)}

// After
{skill.media?.type === "image" && (
  <ShaderImage
    src={skill.media.src}
    alt={skill.media.alt ?? skill.title}
    className="skill-image relative aspect-[4/5] overflow-hidden rounded-2xl"
    triggerRef={sectionRef}  // セクションの ref を渡す
  />
)}
```

### Phase 3: FluidGradientBackground の調整
- `SkillsSections.tsx` の `SkillsBackground` を修正
- 控えめな設定でマウス反応を追加

### Phase 4: Ghost Text のシェーダー化（オプション・高度）
- 現在の DOM ベースの Ghost を R3F ベースに置き換え
- テキストをテクスチャ化してシェーダーで歪み

---

## パフォーマンス考慮事項

### やるべきこと
- `useMemo` でジオメトリ・マテリアルをメモ化
- `useFrame` 内で新規オブジェクト生成を避ける
- Canvas は `{ alpha: true }` でオーバーレイ対応
- 不要なテクスチャはアンマウント時に `dispose()`

### 避けるべきこと
- 複数の Canvas を同時に配置しすぎない（1-2個まで）
- 高解像度テクスチャの乱用
- fragment shader 内の過剰なループ

### WebGL 対応チェック
```tsx
import { isWebGLSupported } from "@/shared/gl";

// WebGL 非対応時のフォールバック
{isWebGLSupported() ? (
  <ShaderImage ... />
) : (
  <img src={...} className="skill-image ..." />
)}
```

---

## 完成形の品質基準

### 視覚的基準
- [ ] 画像が中心からノイズベースで reveal している
- [ ] マウス移動に背景が微細に反応している
- [ ] Ghost Text がスクロールで「沈む」感覚がある
- [ ] セクション間に「深淵」の余白がある

### 技術的基準
- [ ] 60fps 維持（シェーダーがボトルネックになっていない）
- [ ] WebGL 非対応時にフォールバックがある
- [ ] メモリリークがない（dispose 処理）
- [ ] SSR エラーがない（dynamic import）

### 禁止事項（再確認）
- [ ] git commit を実行していない
- [ ] back.out, bounce, elastic を使用していない
- [ ] 過剰なエフェクト（派手すぎる）になっていない

---

## 重要な注意

1. **段階的に実装する**: 一度にすべてを実装しない。Phase 1 → 2 → 3 の順で進める。
2. **目視確認が必須**: 数値はあくまで目安。実際の見た目で微調整する。
3. **パフォーマンス優先**: 見た目が良くても重ければ意味がない。60fps を守る。
4. **git commit は絶対に実行しない**。
