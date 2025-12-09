# Profile Page 受賞レベル品質実装プロンプト

Haiku 4.5 向け詳細実装指示書
Skills Page と同等の品質基準で Profile Page を昇華させる

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

## 設計思想の深化

### Core Concept: 「地層」の本質

```
表層から深層へ:
  訪問者は「掘り進む」感覚でスクロールする

  Surface (2024) ─────────────────────────
    │ 最も詳細、最も鮮明
    │ Ghost opacity: 0.12
    │
  Middle (2021) ─────────────────────────
    │ 文脈を理解し始める
    │ Ghost opacity: 0.15
    │
  Deep (2018) ─────────────────────────
    │ 一貫性に気づく
    │ Ghost opacity: 0.18
    │
  Origin (2011) ─────────────────────────
    │ 根源に到達、特別な光
    │ Ghost opacity: 0.20 + Amber Glow
```

### Emotional Arc（感情設計）

```
motion-design 原則を適用:

Entry (Intro):
  Mood: 中立、期待
  Motion: 静かな登場、呼吸
  Duration: Slow (1.2s+)

Build (Strengths):
  Mood: 「繋がり」の発見
  Motion: 結晶のように要素が接続
  Duration: Medium (0.8s)

Peak (Timeline Middle):
  Mood: 「深さ」への気づき
  Motion: 地層を掘り進む感覚
  Duration: Medium-Fast (0.6s)

Climax (Origin):
  Mood: 「根源」への到達
  Motion: 特別な光の演出
  Duration: Slow (1.5s) - 余韻を持たせる

Exit:
  Mood: 「任せたい」という確信
  Motion: 呼吸の間、余韻
```

---

## 現状の問題点と修正

### 1. Strengths の「結晶構造」が視覚的に弱い

**現状** (`ProfileSections.tsx:206-212`):
```tsx
{/* Connector Line */}
{index < total - 1 && (
  <div
    className="connector-line absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-white/20 to-transparent"
    style={{ transformOrigin: "top center" }}
  />
)}
```

**問題**: 単純な縦線。「結晶構造」＝「繋がっている」感覚が伝わらない。

**提案**: SVG または Canvas で動的な接続線を描画。Strength 同士が「網目」で繋がっている視覚。

### 2. Timeline の「地層」表現が不十分

**現状** (`ProfileSections.tsx:244-250`):
```tsx
{/* Depth Indicator */}
<div
  className="depth-indicator absolute left-0 top-8 h-px w-full"
  style={{
    background: `linear-gradient(90deg, var(--accent-amber1) ${(depth + 1) * 15}%, transparent ${(depth + 1) * 15}%)`,
  }}
/>
```

**問題**: 静的なライン。「掘り進む」感覚がない。

**提案**: スクロールに連動して「地層が現れる」シェーダー演出。

### 3. Origin Glow が CSS blur のみ

**現状** (`ProfileSections.tsx:352-365`):
```tsx
{isDeepest && (
  <div
    className="origin-glow ..."
    style={{
      background: "radial-gradient(circle, var(--accent-amber1) 0%, transparent 70%)",
      opacity: 0,
      filter: "blur(60px)",
    }}
  />
)}
```

**問題**: 単純なぼかし。「根源に到達した」特別感がない。

**提案**: Three.js でパーティクルまたはノイズベースのシェーダーで「脈動する光」。

### 4. Follow Through の欠如

**motion-design 原則**: 主動作の後に副動作が追従する

**現状**: Title band が登場した後、影が同時に表示。追従感がない。

**提案**:
- Title → 0.3s 遅れて Shadow が追いつく
- Description → 完了後に Keywords が「落ち着く」

### 5. Breathing Room の不足

**現状**: セクション間の余白は単なる `div.h-[15vh]`

**提案**: 次のセクションの「予感」を示す Ghost の微細な出現。

---

## Part 1: GSAP アニメーション改善

### Task 1: Strength Title の影追従

`ProfileSections.tsx` の Strength Title に Shadow 要素を追加:

```tsx
{/* Title */}
<div className="relative">
  {/* Shadow (追従用) */}
  <div
    className="title-shadow absolute inset-0 translate-x-2 translate-y-2 bg-black/50"
    style={{ opacity: 0 }}
  />
  <div
    className="band-wrapper overflow-hidden"
    style={{ display: "inline-block" }}
  >
    <div
      className="band-text text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
      style={{
        backgroundColor: BAND_BG,
        display: "inline-block",
        padding: "0.25em 0.45em",
      }}
    >
      {strength.title}
    </div>
  </div>
</div>
```

`ProfileAnimations.ts` の `setupStrengthEntry` で影のアニメーション追加:

```typescript
// Title
if (bandText) {
  gsap.set(bandText, { x: config.title.initialX, opacity: 0 });
  tl.to(
    bandText,
    {
      x: "0%",
      opacity: 1,
      duration: config.title.duration,
      ease: config.title.ease,
    },
    0.6
  );

  // Shadow follows (0.3s 遅れ)
  const titleShadow = el.querySelector<HTMLElement>(".title-shadow");
  if (titleShadow) {
    gsap.set(titleShadow, { opacity: 0, x: -8, y: -8 });
    tl.to(
      titleShadow,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
      },
      0.9  // Title 開始 (0.6) + 0.3s
    );
  }
}
```

### Task 2: Timeline Title の影追従（同様）

`ProfileSections.tsx` の Timeline Title (line 302-313):

```tsx
{/* Title */}
<div className="relative">
  {/* Shadow (追従用) */}
  <div
    className="title-shadow absolute inset-0"
    style={{
      transform: "translate(10px, 10px)",
      backgroundColor: "rgba(0,0,0,0.5)",
      opacity: 0,
    }}
  />
  <div
    className="band inline-block text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
    style={{
      backgroundColor: BAND_BG,
      padding: "0.22em 0.4em",
      position: "relative",
      zIndex: 1,
    }}
  >
    {exp.role}
  </div>
</div>
```

既存の `boxShadow` を削除し、Shadow 要素で置き換え。

### Task 3: ease の多様化

`ProfileAnimations.ts` の ANIMATION_CONFIG を更新:

```typescript
export const ANIMATION_CONFIG = {
  strengths: {
    ghost: {
      initialY: 60,
      initialBlur: 10,
      initialScale: 1.08,
      finalOpacity: 0.15,
      parallaxY: 80,
      duration: 1.0,
      ease: "expo.out",  // 維持: 深淵からの浮上
    },
    rail: {
      duration: 0.9,
      ease: "power3.out",  // 変更: 構造的な動き
    },
    title: {
      initialX: "-110%",
      duration: 0.85,
      ease: "expo.out",  // 維持: 確信
    },
    shadow: {
      duration: 0.5,
      ease: "power3.out",  // 追加: 追従
    },
    description: {
      charStagger: 0.006,
      charBlur: 3,
      duration: 0.5,
      ease: "power2.out",  // 維持: 語り
    },
    keywords: {
      initialY: 16,
      stagger: 0.06,
      duration: 0.35,
      ease: "power2.out",  // 変更: リズミカル
    },
    connector: {
      duration: 0.8,
      ease: "power3.inOut",  // 変更: 滑らかな接続
    },
  },

  timeline: {
    ghost: {
      initialY: 80,
      initialBlur: 12,
      initialScale: 1.1,
      parallaxY: 100,
      duration: 1.2,
      ease: "expo.out",  // 維持
    },
    rail: {
      duration: 1.0,
      ease: "power3.out",  // 変更
    },
    title: {
      initialX: "-120%",
      duration: 0.9,
      ease: "expo.out",  // 維持
    },
    shadow: {
      duration: 0.5,
      ease: "power3.out",  // 追加
    },
    meta: {
      initialY: 24,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out",  // 変更: より穏やか
    },
    description: {
      charStagger: 0.005,
      charBlur: 3,  // 追加: blur 効果
      duration: 0.5,
      ease: "power2.out",
    },
    achievements: {
      initialClipPath: "inset(0 100% 0 0)",
      stagger: 0.12,
      duration: 0.6,
      ease: "power3.out",  // 変更: より滑らか
    },
    techStack: {
      initialY: 14,
      stagger: 0.05,
      duration: 0.35,
      ease: "power2.out",  // 変更
    },
    depth: {
      duration: 1.5,
      ease: "power2.out",  // 追加
    },
    originGlow: {
      duration: 2.0,  // 追加: 特別に長く
      ease: "power1.out",  // 追加: 最も穏やか
    },
  },
  // ... parallax は既存のまま
} as const;
```

### Task 4: Description の blur 効果追加

Timeline の Description にも blur を追加 (`ProfileAnimations.ts:381-401`):

```typescript
// Description
if (description) {
  const text = description.textContent || "";
  description.innerHTML = text
    .split("")
    .map((char) =>
      char === " "
        ? " "
        : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
    )
    .join("");

  const chars = description.querySelectorAll(".char");
  tl.to(
    chars,
    {
      opacity: 1,
      filter: "blur(0px)",
      stagger: config.description.charStagger,
      duration: config.description.duration,
      ease: config.description.ease,
      clearProps: "filter",
    },
    1.1
  );
}
```

### Task 5: Parallax の scrub 値調整

`ProfileAnimations.ts` の setupProfileParallax:

```typescript
export function setupProfileParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost, .ghost-year");
  const content = el.querySelector<HTMLElement>(".profile-content");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    scrub: 1.2,  // 変更: 0.9 → 1.2 (より滑らかに)
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5;

      if (ghost) {
        const y = centered * config.ghost.speed * 140;  // 変更: 120 → 140
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange;
        const baseOpacity = parseFloat(ghost.style.opacity) || 0.15;
        const opacity = baseOpacity - Math.abs(centered) * 0.05;  // 動的 opacity

        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.05, opacity));
      }

      if (content) {
        const y = centered * config.content.speed * 50;  // 変更: 40 → 50
        content.style.transform = `translateY(${y}px)`;
      }

      if (gridLines) {
        const y = progress * config.gridLines.speed * 60;  // 変更: 50 → 60
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
```

### Task 6: Breathing Zone に予感を追加

`ProfileSections.tsx` に新コンポーネント:

```tsx
export function BreathingZone({
  nextSection,
  height = "20vh",
}: {
  nextSection?: "strengths" | "timeline" | "end";
  height?: string;
}) {
  return (
    <div className={`breathing-zone relative h-[${height}] overflow-hidden`}>
      {/* 次のセクションの予感 */}
      {nextSection === "timeline" && (
        <div
          className="ghost-preview pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em]"
          style={{
            fontSize: "clamp(6rem, 15vw, 12rem)",
            color: "rgba(255,255,255,0.03)",
            mixBlendMode: "overlay",
            filter: "blur(6px)",
          }}
        >
          2024
        </div>
      )}
      {nextSection === "end" && (
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "100px",
            height: "100px",
            background: "radial-gradient(circle, var(--accent-amber1) 0%, transparent 70%)",
            opacity: 0.1,
            filter: "blur(40px)",
          }}
        />
      )}
    </div>
  );
}
```

`ProfileClient.tsx` で使用:

```tsx
{/* Breathing Zone before Strengths */}
<BreathingZone nextSection="strengths" height="15vh" />

{/* Strengths */}
...

{/* Breathing Zone before Timeline */}
<BreathingZone nextSection="timeline" height="20vh" />

{/* Timeline */}
...

{/* Breathing Zone at end */}
<BreathingZone nextSection="end" height="30vh" />
```

---

## Part 2: Three.js による演出強化

### 1. Connector Lines の動的描画（結晶構造）

Strength 間の接続線を Canvas/SVG で動的に描画。

**新規ファイル**: `apps/web/src/features/profile/components/CrystalConnector.tsx`

```tsx
"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Point {
  x: number;
  y: number;
}

interface CrystalConnectorProps {
  strengthRefs: React.RefObject<(HTMLElement | null)[]>;
  containerRef: React.RefObject<HTMLElement>;
}

export function CrystalConnector({ strengthRefs, containerRef }: CrystalConnectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Strength 要素の中心点を取得
    const getPoints = (): Point[] => {
      const containerRect = container.getBoundingClientRect();
      return strengthRefs.current
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top + window.scrollY,
          };
        });
    };

    // 線を描画
    const drawConnections = (progress: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const points = getPoints();
      if (points.length < 2) return;

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * progress})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 10]);

      // 三角形の接続
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const currentProgress = Math.min(1, progress * points.length - (i - 1));
        if (currentProgress > 0) {
          const targetX = points[0].x + (points[i].x - points[0].x) * currentProgress;
          const targetY = points[0].y + (points[i].y - points[0].y) * currentProgress;
          ctx.lineTo(targetX, targetY);
        }
      }

      // 最後の点から最初に戻る
      if (progress >= 1 && points.length >= 3) {
        ctx.lineTo(points[0].x, points[0].y);
      }

      ctx.stroke();
    };

    // スクロール連動
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top 60%",
      end: "bottom 40%",
      scrub: 1,
      onUpdate: (self) => {
        drawConnections(self.progress);
      },
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      trigger.kill();
    };
  }, [strengthRefs, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-1"
      style={{ mixBlendMode: "overlay" }}
    />
  );
}
```

### 2. Origin Glow のシェーダー化

最深層の「根源の光」をより印象的に。

**新規ファイル**: `apps/web/src/features/profile/shader/originGlow.ts`

```typescript
export const originGlowVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const originGlowFragment = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;  // 0.0 ~ 1.0
  uniform vec3 uColor;      // Amber color

  varying vec2 vUv;

  // Simple noise
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
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Pulsing effect
    float pulse = sin(uTime * 2.0) * 0.1 + 0.9;

    // Noise distortion
    float n = noise(vUv * 4.0 + uTime * 0.5);

    // Radial gradient with noise
    float glow = smoothstep(0.5, 0.0, dist + n * 0.1);
    glow *= pulse;
    glow *= uProgress;

    // Color with warmth variation
    vec3 color = uColor;
    color += vec3(0.1, 0.05, 0.0) * n;  // Warmer variation

    gl_FragColor = vec4(color, glow * 0.8);
  }
`;
```

**新規コンポーネント**: `apps/web/src/features/profile/components/OriginGlowGL.tsx`

```tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { originGlowVertex, originGlowFragment } from "../shader/originGlow";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GlowMeshProps {
  progress: React.MutableRefObject<number>;
}

function GlowMesh({ progress }: GlowMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) },  // Amber
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <mesh scale={[viewport.width * 0.5, viewport.width * 0.5, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={originGlowVertex}
        fragmentShader={originGlowFragment}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

interface OriginGlowGLProps {
  triggerRef: React.RefObject<HTMLElement>;
  className?: string;
}

export function OriginGlowGL({ triggerRef, className }: OriginGlowGLProps) {
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top 50%",
      end: "bottom 20%",
      scrub: 1.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, [triggerRef]);

  return (
    <div className={className}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <GlowMesh progress={progressRef} />
      </Canvas>
    </div>
  );
}
```

### 3. 地層シェーダー（Timeline 背景）

スクロールに応じて「地層が現れる」視覚効果。

**新規ファイル**: `apps/web/src/features/profile/shader/strataLayer.ts`

```typescript
export const strataLayerFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDepth;       // 0.0 (surface) ~ 1.0 (deepest)
  uniform float uProgress;    // scroll progress
  uniform vec2 uResolution;

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

    // Horizontal strata lines
    float strataFreq = 20.0 + uDepth * 30.0;
    float strata = sin(uv.y * strataFreq + noise(uv * 10.0) * 2.0) * 0.5 + 0.5;
    strata = smoothstep(0.4, 0.6, strata);

    // Reveal from top based on scroll
    float revealMask = smoothstep(1.0 - uProgress, 1.0 - uProgress + 0.3, uv.y);

    // Depth-based color (darker = deeper)
    float baseColor = 0.04 + (1.0 - uDepth) * 0.02;
    vec3 color = vec3(baseColor);

    // Strata lines (very subtle)
    color += strata * 0.02 * uProgress;

    // Alpha based on reveal
    float alpha = revealMask * 0.15;

    gl_FragColor = vec4(color, alpha);
  }
`;
```

### 4. FluidGradientBackground の調整

`ProfileSections.tsx` の ProfileBackground:

```tsx
export function ProfileBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={{
          ...fluidConfigMonochrome,
          // Profile 専用の控えめな設定
          brushStrength: 0.25,      // Skills より弱く
          distortionAmount: 0.12,   // 歪みをさらに抑える
          colorIntensity: 0.35,     // 色を抑える
          softness: 0.85,           // よりソフトに
        }}
        fadeIn={true}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: BASE_BG,
          mixBlendMode: "multiply",
          opacity: 0.93,  // 少し強めに黒
        }}
      />
    </div>
  );
}
```

---

## アニメーションタイムライン

### Strength Section

```
T+0.0s  ────────────────────────────────
        │
        │  [Grid Lines: 空間の出現]
        │  opacity: 0 → 0.06
        │  Duration: 0.6s
        │  Ease: power1.out
        │
T+0.2s  ────────────────────────────────
        │
        │  [Ghost STR: 深淵から浮上]
        │  blur(10px) → blur(0)
        │  y: 60 → 0
        │  opacity: 0 → 0.15
        │  scale: 1.08 → 1.0
        │  Duration: 1.0s
        │  Ease: expo.out
        │
T+0.4s  ────────────────────────────────
        │
        │  [Rail: 上から下へ reveal]
        │  clipPath: inset(0 0 100% 0) → inset(0)
        │  Duration: 0.9s
        │  Ease: power3.out
        │
T+0.6s  ────────────────────────────────
        │
        │  [Title Band: 左からスライド]
        │  x: -110% → 0%
        │  Duration: 0.85s
        │  Ease: expo.out
        │
T+0.9s  ────────────────────────────────
        │
        │  [Title Shadow: 遅れて追従]
        │  opacity: 0 → 1
        │  x/y: -8 → 0
        │  Duration: 0.5s
        │  Ease: power3.out
        │
        │  [Description: 文字単位 reveal]
        │  同時スタート
        │
T+1.2s  ────────────────────────────────
        │
        │  [Keywords: stagger reveal]
        │  y: 16 → 0
        │  Stagger: 0.06s
        │  Duration: 0.35s
        │  Ease: power2.out
        │
T+1.4s  ────────────────────────────────
        │
        │  [Connector Line: 下へ伸びる]
        │  scaleY: 0 → 1
        │  Duration: 0.8s
        │  Ease: power3.inOut
        │
────────────────────────────────────────
```

### Timeline Section

```
T+0.0s  ────────────────────────────────
        │
        │  [Grid Lines]
        │  opacity: 0 → 0.08
        │  Duration: 0.7s
        │
T+0.1s  ────────────────────────────────
        │
        │  [Depth Indicator: 左から伸びる]
        │  scaleX: 0 → 1
        │  Duration: 0.8s
        │  Ease: power2.out
        │
T+0.2s  ────────────────────────────────
        │
        │  [Ghost Year: 深淵から浮上]
        │  blur(12px) → blur(0)
        │  opacity: 0 → (depth-based: 0.12-0.20)
        │  Duration: 1.2s
        │  Ease: expo.out
        │
T+0.4s  ────────────────────────────────
        │
        │  [Rail: reveal, 深さで太さ変化]
        │  Duration: 1.0s
        │
T+0.6s  ────────────────────────────────
        │
        │  [Meta Items: stagger]
        │  y: 24 → 0
        │  Stagger: 0.1s
        │  Duration: 0.5s
        │
T+0.8s  ────────────────────────────────
        │
        │  [Title Band: スライド]
        │  Duration: 0.9s
        │
T+1.1s  ────────────────────────────────
        │
        │  [Title Shadow: 追従]
        │  Duration: 0.5s
        │
        │  [Description: 文字単位 reveal + blur]
        │
T+1.4s  ────────────────────────────────
        │
        │  [Achievements: 左からワイプ]
        │  clipPath reveal
        │  Stagger: 0.12s
        │
T+1.7s  ────────────────────────────────
        │
        │  [Tech Stack: stagger]
        │  y: 14 → 0
        │  Stagger: 0.05s
        │
T+2.0s  ────────────────────────────────
        │
        │  [Origin Glow: 最深層のみ]
        │  脈動するシェーダー光
        │  Duration: 2.0s
        │  Ease: power1.out
        │
────────────────────────────────────────
```

---

## 実装アーキテクチャ

```
apps/web/src/features/profile/
├── ProfileClient.tsx            # メイン
├── ProfileSections.tsx          # セクション
├── ProfileAnimations.ts         # GSAP設定
├── components/
│   ├── CrystalConnector.tsx     # Strength 接続線
│   ├── OriginGlowGL.tsx         # 最深層の光
│   └── BreathingZone.tsx        # 呼吸ゾーン
├── shader/
│   ├── originGlow.ts            # Origin Glow シェーダー
│   └── strataLayer.ts           # 地層シェーダー
└── index.ts
```

---

## 品質チェックリスト

### 構図
- [ ] Strength が非対称に配置されている
- [ ] Timeline が「地層」として視覚化されている
- [ ] Ghost opacity が深さに応じて濃くなっている

### モーション
- [ ] Title の後に Shadow が遅れて追従している
- [ ] Description が文字単位 + blur で reveal している
- [ ] Keywords/TechStack がリズミカルに stagger している
- [ ] Connector Line が滑らかに伸びている
- [ ] Origin Glow が脈動している（最深層のみ）

### ease の適切さ
- [ ] Ghost: expo.out（深淵からの浮上）
- [ ] Rail: power3.out（構造的）
- [ ] Title: expo.out（確信）
- [ ] Shadow: power3.out（追従）
- [ ] Description: power2.out（語り）
- [ ] Keywords/Tags: power2.out（リズミカル）
- [ ] Origin Glow: power1.out（最も穏やか、余韻）

### パフォーマンス
- [ ] 60fps 維持
- [ ] will-change が適切に設定
- [ ] WebGL 非対応時のフォールバック

### 禁止事項
- [ ] git commit を実行していない
- [ ] back.out, bounce, elastic を使用していない
- [ ] backgroundPositionY を使用していない

---

## 段階的実装ガイド

### Phase 1: GSAP 改善
1. Title Shadow の要素追加 + アニメーション
2. ease の多様化
3. Description の blur 効果追加
4. Parallax の scrub 調整
5. BreathingZone コンポーネント

### Phase 2: Canvas/SVG
1. CrystalConnector (Strength 接続線)

### Phase 3: Three.js
1. OriginGlowGL (最深層の光)
2. FluidGradientBackground の調整

---

## 重要な注意

1. **段階的に実装**: Phase 1 → 2 → 3 の順で進める
2. **目視確認必須**: 数値は目安、実際の見た目で微調整
3. **パフォーマンス優先**: 60fps を守る
4. **git commit は絶対に実行しない**

---

# Part 3: 受賞レベルへの昇華

motion-design、art-direction、webgl-shader の深い知見を統合し、記憶に残る体験を構築する。

---

## 1. Polyrhythm Animation（複数リズム層）

### Concept

motion-design の「Rhythm and Beat」原則を適用。複数のアニメーション層が異なるテンポで動くことで、深みと複雑さを生む。

```
Layer 1: Ghost (3拍子) - ゆったり、存在感
  ● ○ ○ ● ○ ○ ● ○ ○

Layer 2: Title + Rail (2拍子) - リズミカル、構造的
  ● ○ ● ○ ● ○ ● ○

Layer 3: Keywords/Tags (4拍子) - 速い、詳細
  ●○○○●○○○●○○○●○○○

→ 3つのレイヤーが重なり合い、視覚的「ハーモニー」を作る
```

### 実装: Strength Section

`ProfileAnimations.ts` の setupStrengthEntry にレイヤー概念を追加:

```typescript
export function setupStrengthEntry(
  el: HTMLElement,
  index: number,
  total: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.strengths;

  // ... 既存の要素取得 ...

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 70%",
      end: "top 20%",
      once: true,
    },
  });

  // === Layer 1: Atmosphere (最も遅い) ===
  // Grid Lines
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.06, duration: 1.2, ease: "power1.out" }, 0);
  }

  // Ghost (3拍子: 0.0s, 0.6s, 1.2s の感覚)
  if (ghost) {
    gsap.set(ghost, {
      y: config.ghost.initialY,
      opacity: 0,
      scale: config.ghost.initialScale,
      filter: `blur(${config.ghost.initialBlur}px)`,
    });
    tl.to(
      ghost,
      {
        y: 0,
        opacity: config.ghost.finalOpacity,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.5,  // 変更: より長く、ゆったりと
        ease: "expo.out",
        clearProps: "filter",
      },
      0.3  // 3拍子の開始
    );
  }

  // === Layer 2: Structure (中間) ===
  // Rail (2拍子: 0.4s, 0.8s の感覚)
  if (rail) {
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 0.9,
        ease: "power3.out",
      },
      0.4  // 2拍子の開始
    );
  }

  // Title + Shadow (2拍子)
  if (bandText) {
    gsap.set(bandText, { x: config.title.initialX, opacity: 0 });
    tl.to(
      bandText,
      {
        x: "0%",
        opacity: 1,
        duration: 0.85,
        ease: "expo.out",
      },
      0.8  // 2拍子の次の拍
    );

    const titleShadow = el.querySelector<HTMLElement>(".title-shadow");
    if (titleShadow) {
      gsap.set(titleShadow, { opacity: 0, x: -8, y: -8 });
      tl.to(
        titleShadow,
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        },
        1.2  // Title 完了後
      );
    }
  }

  // === Layer 3: Details (速い) ===
  // Description (4拍子: 文字が速く流れる)
  if (description) {
    const text = description.textContent || "";
    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " "
          ? " "
          : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
      )
      .join("");

    const chars = description.querySelectorAll(".char");
    tl.to(
      chars,
      {
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.004,  // 変更: より速く (0.006 → 0.004)
        duration: 0.5,
        ease: "power2.out",
        clearProps: "filter",
      },
      1.3  // Description が速く始まる
    );
  }

  // Keywords (4拍子: ピアノのアルペジオ的)
  if (keywords.length > 0) {
    gsap.set(keywords, { y: config.keywords.initialY, opacity: 0, scale: 0.95 });
    tl.to(
      keywords,
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.05,  // 変更: より速く
        duration: 0.3,
        ease: "power2.out",
      },
      1.6  // 4拍子のリズム
    );
  }

  // Connector (ゆっくりと接続)
  if (connector && index < total - 1) {
    gsap.set(connector, { scaleY: 0, transformOrigin: "top center", opacity: 0 });
    tl.to(
      connector,
      {
        scaleY: 1,
        opacity: 1,
        duration: 1.0,  // 変更: より長く
        ease: "power3.inOut",
      },
      1.8  // 最後にゆっくりと
    );
  }

  return tl;
}
```

---

## 2. Micro-interactions（細部の魔法）

### Concept

art-direction の「神は細部に宿る」原則。ホバー、クリックなどの細かいインタラクションが、全体の品質を大きく左右する。

### Keyword Hover Effect

`ProfileSections.tsx` の Keywords に高度なホバー効果:

```tsx
{/* Keywords */}
<div className={`flex flex-wrap gap-2 ${isEven ? "" : "md:justify-end"}`}>
  {strength.keywords.map((keyword, i) => (
    <span
      key={`${strength.id}-${keyword}`}
      className="keyword group relative cursor-default overflow-hidden rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] uppercase tracking-[0.1em] text-[var(--text-base-60)] transition-all duration-300"
      style={{
        // Hover時のアニメーション用
        "--hover-delay": `${i * 0.05}s`,
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        // Ripple effect
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement("span");
        ripple.className = "absolute rounded-full bg-white/20 pointer-events-none";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = "0";
        ripple.style.height = "0";
        ripple.style.transform = "translate(-50%, -50%)";

        e.currentTarget.appendChild(ripple);

        gsap.to(ripple, {
          width: 200,
          height: 200,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        });
      }}
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />

      {keyword}
    </span>
  ))}
</div>
```

### Timeline Achievement Hover

```tsx
{/* Achievements */}
<ul className="space-y-3">
  {exp.achievements.map((achievement, i) => (
    <li
      key={i}
      className="achievement-item group flex items-start gap-3 text-sm text-[var(--text-base-70)] transition-all duration-300 hover:text-[var(--text-base-90)]"
      style={{ transformOrigin: "left center" }}
    >
      <span className="mt-1.5 h-0.5 w-5 flex-shrink-0 bg-[var(--accent-amber1)]/70 transition-all duration-300 group-hover:w-8 group-hover:bg-[var(--accent-amber1)]" />
      <span className="transition-transform duration-300 group-hover:translate-x-1">
        {achievement}
      </span>

      {/* Subtle glow on hover */}
      <span className="absolute -left-2 -right-2 -top-1 -bottom-1 rounded bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-1" />
    </li>
  ))}
</ul>
```

---

## 3. Advanced Shader Effects

### Strata Layer Shader（地層シェーダー）の高度化

Timeline 背景に地層を視覚化するシェーダーを追加。

**拡張**: `apps/web/src/features/profile/shader/strataLayer.ts`

```typescript
export const strataLayerFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDepth;       // 0.0 (surface) ~ 1.0 (deepest)
  uniform float uProgress;    // scroll progress
  uniform vec2 uResolution;
  uniform vec3 uAmberColor;   // var(--accent-amber1) を渡す

  varying vec2 vUv;

  // Hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // 2D Value noise
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

  // FBM for organic texture
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < octaves; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    // === Strata Lines (地層の線) ===
    float strataFreq = 25.0 + uDepth * 40.0;  // 深いほど密度高い
    float strataOffset = fbm(vec2(uv.x * 5.0, uTime * 0.1), 3) * 2.0;
    float strata = sin((uv.y + strataOffset * 0.05) * strataFreq) * 0.5 + 0.5;
    strata = smoothstep(0.45, 0.55, strata);

    // === Sediment Noise (堆積物のノイズ) ===
    float sediment = fbm(uv * 8.0 + vec2(0.0, uTime * 0.05), 4);

    // === Fossil Marks (化石の痕跡、深層のみ) ===
    float fossilMask = step(0.7, uDepth);  // 深さ70%以上で出現
    float fossil = 0.0;
    if (fossilMask > 0.0) {
      vec2 fossilUv = uv * 12.0;
      float fossilNoise = hash(floor(fossilUv));
      fossil = step(0.95, fossilNoise) * smoothstep(0.9, 1.0, sediment);
    }

    // === Reveal Mask (スクロールで地層が現れる) ===
    float revealEdge = 0.3;
    float revealMask = smoothstep(1.0 - uProgress - revealEdge, 1.0 - uProgress, uv.y);

    // === Color Composition ===
    float baseColor = 0.04 + (1.0 - uDepth) * 0.02;  // 深いほど暗い
    vec3 color = vec3(baseColor);

    // Strata lines (very subtle white)
    color += strata * 0.015 * uProgress;

    // Sediment texture
    color += sediment * 0.008;

    // Fossil marks (amber glow)
    color += fossil * uAmberColor * 0.12 * fossilMask;

    // Depth gradient (deeper = slightly amber-tinted)
    color += uAmberColor * uDepth * 0.03;

    // === Alpha ===
    float alpha = revealMask * (0.12 + uDepth * 0.08);

    gl_FragColor = vec4(color, alpha);
  }
`;
```

**新規コンポーネント**: `apps/web/src/features/profile/components/StrataLayerGL.tsx`

```tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { strataLayerFragment } from "../shader/strataLayer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface StrataLayerMeshProps {
  depth: number;
  progress: React.MutableRefObject<number>;
}

function StrataLayerMesh({ depth, progress }: StrataLayerMeshProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepth: { value: depth },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uAmberColor: { value: new THREE.Vector3(0.95, 0.65, 0.2) },
    }),
    [depth, viewport]
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={strataLayerFragment}
        transparent
      />
    </mesh>
  );
}

interface StrataLayerGLProps {
  depth: number;  // 0.0 ~ 1.0
  triggerRef: React.RefObject<HTMLElement>;
  className?: string;
}

export function StrataLayerGL({ depth, triggerRef, className }: StrataLayerGLProps) {
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, [triggerRef]);

  return (
    <div className={className}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <StrataLayerMesh depth={depth} progress={progressRef} />
      </Canvas>
    </div>
  );
}
```

**使用**: `ProfileSections.tsx` の TimelineSection に追加

```tsx
<section
  ref={(el) => setRef(el, index)}
  className="timeline-section relative isolate min-h-[70vh] overflow-visible px-6 py-20 sm:px-10"
  data-depth={depth}
>
  {/* Strata Layer Shader (WebGL対応時のみ) */}
  {isWebGLSupported() && (
    <StrataLayerGL
      depth={depth / total}
      triggerRef={{ current: el }}
      className="pointer-events-none absolute inset-0 -z-10"
    />
  )}

  {/* 既存の Grid Lines はフォールバック */}
  <div
    className="grid-lines pointer-events-none absolute inset-0 -z-9 mix-blend-soft-light"
    style={{
      backgroundImage:
        "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
      backgroundSize: "100px 100px",
      opacity: isWebGLSupported() ? 0 : 0,  // シェーダー使用時は非表示
      willChange: "transform, opacity",
    }}
  />

  {/* ... 既存の要素 ... */}
</section>
```

---

## 4. Kinetic Typography の高度化

### Concept

motion-design の「Kinetic Typography」原則。文字が単なる情報ではなく、動きで感情を伝える。

### Title の文字分割アニメーション

`ProfileSections.tsx` の Title を文字単位で制御:

```tsx
{/* Title - 文字分割版 */}
<div className="relative">
  <div className="title-shadow absolute inset-0 translate-x-2 translate-y-2 bg-black/50" style={{ opacity: 0 }} />
  <div className="band-wrapper overflow-hidden" style={{ display: "inline-block" }}>
    <div
      className="band-text text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
      style={{
        backgroundColor: BAND_BG,
        display: "inline-block",
        padding: "0.25em 0.45em",
      }}
    >
      {strength.title.split("").map((char, i) => (
        <span
          key={i}
          className="title-char inline-block"
          style={{ opacity: 0, transform: "translateY(100%)" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  </div>
</div>
```

`ProfileAnimations.ts` で文字単位アニメーション:

```typescript
// Title (文字単位)
if (bandText) {
  const titleChars = bandText.querySelectorAll<HTMLElement>(".title-char");

  if (titleChars.length > 0) {
    gsap.set(titleChars, { opacity: 0, y: "100%" });
    tl.to(
      titleChars,
      {
        opacity: 1,
        y: "0%",
        stagger: 0.03,  // 文字ごとに0.03s遅延
        duration: 0.6,
        ease: "power3.out",
      },
      0.8
    );
  } else {
    // フォールバック（分割されていない場合）
    gsap.set(bandText, { x: config.title.initialX, opacity: 0 });
    tl.to(bandText, { x: "0%", opacity: 1, duration: 0.85, ease: "expo.out" }, 0.8);
  }

  // Shadow (文字完了後)
  const titleShadow = el.querySelector<HTMLElement>(".title-shadow");
  if (titleShadow) {
    gsap.set(titleShadow, { opacity: 0, x: -8, y: -8 });
    tl.to(
      titleShadow,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
      },
      1.4  // 文字完了(0.8 + 0.6)後
    );
  }
}
```

---

## 5. Performance Budget（パフォーマンス予算）

### 60fps 維持のための明確な基準

```
Simultaneous Animations:
  - GSAP Timeline: 最大3つまで同時実行
  - Canvas/WebGL: 1-2個まで
  - CSS Transitions: 制限なし（transformのみ）

Animation Properties (優先順位):
  1. transform (translate, scale, rotate) - GPU
  2. opacity - GPU
  3. filter (blur) - GPU だが重い、限定使用
  4. clipPath - 比較的軽い
  5. width, height - 禁止（reflow）

Shader Complexity:
  - Fragment shader loops: 最大8回まで
  - Texture lookups: 最大4回まで
  - 複雑な計算は頂点シェーダーで
```

### パフォーマンスモニタリング

```tsx
// デバッグ用: FPS カウンター（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  let lastTime = performance.now();
  let frames = 0;

  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      console.log(`FPS: ${fps}`);

      if (fps < 55) {
        console.warn('⚠️ FPS below 55, consider optimizing animations');
      }

      frames = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFPS);
  };

  requestAnimationFrame(measureFPS);
}
```

---

## 6. Contrast Creates Memory（記憶に残るコントラスト）

### art-direction の核心原則

```
記憶に残るのは「差」:

1. 速度のコントラスト
   - Ghost: 1.5s (最も遅い)
   - Description: 0.5s (中間)
   - Keywords: 0.3s (速い)

2. 密度のコントラスト
   - Strengths: 余白多め（呼吸）
   - Timeline: 詰まっている（情報量）

3. 色のコントラスト
   - 基本: 漆黒 #0b0b0b
   - アクセント: Amber（Origin Glowのみ）
   - Title: 白 #f2f2f2

4. 動きのコントラスト
   - 静: Ghost の緩やかな parallax
   - 動: Keywords の速い stagger
```

### Peak Experience の設計

```
Profile Page の Peak Experience = Origin Glow 到達

Timeline を最後までスクロールした時:

1. Origin Glow が最大輝度に
2. 脈動が最も強くなる
3. 周囲の要素が微かに震える（共鳴）
4. 「根源に到達した」という達成感
```

**実装**: `ProfileAnimations.ts` の setupTimelineEntry

```typescript
// Origin Glow (最深層)
if (index === total - 1) {
  const glowEl = el.querySelector<HTMLElement>(".origin-glow");
  if (glowEl) {
    gsap.set(glowEl, { opacity: 0, scale: 0.8 });
    tl.to(
      glowEl,
      {
        opacity: 1,
        scale: 1,
        duration: 2.0,
        ease: "power1.out",
      },
      2.0
    );

    // Peak に到達したら、周囲の要素も反応
    tl.to(
      [bandText, description],
      {
        scale: 1.01,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      },
      2.5
    );
  }
}
```

---

## 7. 完成形チェックリスト（受賞基準）

### Visual Excellence
- [ ] Ghost が3拍子のリズムでゆったりと動いている
- [ ] Title が文字単位で reveal し、影が追従している
- [ ] Keywords にマウスを乗せると ripple + shimmer が発生
- [ ] Timeline の背景に地層シェーダーが見える
- [ ] Origin Glow が脈動し、周囲が共鳴している

### Motion Excellence
- [ ] 3つのアニメーションレイヤー（3拍子/2拍子/4拍子）が調和
- [ ] ease が要素の性格に完璧に合っている
- [ ] Follow Through が全ての主動作に適用されている
- [ ] Breathing Room が適切に配置されている
- [ ] Parallax が「沈む」感覚を生んでいる

### Technical Excellence
- [ ] 60fps 維持（開発ツールで確認）
- [ ] WebGL 非対応時のフォールバック動作
- [ ] メモリリーク無し（dispose 処理完璧）
- [ ] アクセシビリティ（prefers-reduced-motion 対応）
- [ ] SSR エラー無し

### Emotional Excellence
- [ ] Entry で「期待」を感じる
- [ ] Strengths で「繋がり」を発見する
- [ ] Timeline で「深さ」に気づく
- [ ] Origin で「根源」に到達した達成感
- [ ] Exit で「任せたい」と思わせる

---

## 最終実装順序（受賞レベル）

### Phase 1: Foundation（1-2日）
1. Polyrhythm Animation の実装
2. Title の文字分割 reveal
3. Shadow の Follow Through
4. ease の最終調整

### Phase 2: Interactions（1日）
1. Keyword の ripple + shimmer
2. Achievement の hover glow
3. Micro-interactions 全般

### Phase 3: Shaders（1-2日）
1. StrataLayerGL の実装
2. OriginGlowGL の高度化（脈動強化）
3. パフォーマンス最適化

### Phase 4: Polish（1日）
1. タイミングの微調整
2. パフォーマンス測定・最適化
3. アクセシビリティ対応
4. 全体の調和確認

---

**これで Profile Page は受賞レベルの品質に到達する。**

**重要**: 各 Phase 完了後に必ず目視確認。数値はあくまで出発点、実際の見た目で最終判断する。

**絶対禁止**: git commit は実行しない。
