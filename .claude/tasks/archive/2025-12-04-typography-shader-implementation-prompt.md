# 2025-12-04 Typography Direction & Shader Brush-up Implementation Prompt
- Created: 2025-12-04T11:30:00+09:00 (Asia/Tokyo)
- Purpose: Claude Code (Haiku 4.5) 向け詳細実装プロンプト。タイポグラフィの世界観定義とWebGLシェーダーの有機的動き追加。
- Model: Claude Code (Haiku 4.5)
- Constraints: **コミット禁止**。最小差分。作業パスは `apps/web/` 配下。

---

## 前提情報

### プロジェクト構成
- **Framework**: Next.js 16.0.6 (App Router) + React 19.2.0
- **Styling**: Tailwind CSS v4 (configレス, CSS変数ベース)
- **3D/WebGL**: Three.js 0.181.2
- **Alias**: `@/* -> ./src/*`

### 現在のファイル構成
```
apps/web/src/
├── app/
│   ├── layout.tsx          # RootLayout, HeroShaderBackground読み込み
│   ├── page.tsx            # Hero section + Content section
│   └── globals.css         # CSS変数, Tailwindテーマ
├── features/hero/
│   ├── components/
│   │   └── HeroShaderBackground.tsx  # Three.js Canvas
│   └── shader/
│       ├── config/hero.ts            # シェーダーパラメータ一元管理
│       ├── core/                     # hash.glsl.ts, noise.glsl.ts, fbm.glsl.ts
│       ├── materials/hero.ts         # Vertex + Fragment シェーダー
│       └── types.ts                  # HeroShaderUniforms型定義
└── shared/gl/                        # WebGLサポート検出, Renderer設定, Texture読み込み
```

### 現在のデザイントークン (globals.css)
```css
:root {
  --bg-dark: #0a0a0a;
  --bg-darker: #050505;
  --text-base: #ededed;
  --text-muted: #888888;
  --accent-amber1: #ff9f43;
  --accent-amber2: #ffb15e;
}
```

### 現在のシェーダー状態
- 写真をcontain配置、平均暗部色 + FBM + ノイズで背景補完
- **静的レンダリング** (requestAnimationFrameループなし)
- uTime/uPointer/uScroll uniform **未実装**
- WebGLを使う必然性が弱い（静的ぼかし＋ノイズに近い）

---

## 指示 (Claude Code Haiku 4.5 向け)

あなたはNext.js + Tailwind + shadcn/ui + Three.jsの実装担当です。以下を最小差分で行ってください。

**重要な制約:**
- コミットは **絶対にしないでください**
- 既存のフォールバック動作を維持してください
- 派手すぎる演出は避け、暗部と粒度を維持してください
- パフォーマンスに配慮してください

---

## タスク1: タイポグラフィ方針の定義と適用

### 1.1 書体選定とコンセプト

**コンセプト: 「静かな権威」**
- 声高に主張せず、存在感で語る
- Pitch Black & Fire テーマとの整合性

**書体方針:**
| 用途 | 書体 | 理由 |
|------|------|------|
| Display (見出し) | Geist Sans (既存) | ジオメトリックで先進的、テクニカルな印象 |
| Body (本文) | Geist Sans (既存) | 中立的な可読性、統一感 |
| Accent (ラベル) | Geist Mono | テクニカル感、限定的な使用で差別化 |

### 1.2 階層ルールの定義

**globals.css に追加するCSS変数:**

```css
:root {
  /* Typography Scale */
  --type-display-xl: clamp(3rem, 8vw, 5rem);      /* Hero h1 */
  --type-display-lg: clamp(2rem, 5vw, 3rem);      /* Section h2 */
  --type-body: 1rem;                              /* 本文 */
  --type-caption: 0.75rem;                        /* キャプション/ラベル */

  /* Letter Spacing */
  --tracking-tight: -0.02em;                      /* Display用 */
  --tracking-normal: 0;                           /* Body用 */
  --tracking-wide: 0.1em;                         /* ラベル/Accent用 */

  /* Line Height */
  --leading-tight: 1.1;                           /* Display用 */
  --leading-normal: 1.6;                          /* Body用 */

  /* Font Weight */
  --weight-light: 300;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
}
```

### 1.3 page.tsx への適用

現在のHero section タイポグラフィを更新:

```tsx
{/* Hero h1 - 大きく、軽く */}
<h1 className="text-[var(--type-display-xl)] font-[var(--weight-light)] tracking-[var(--tracking-tight)] leading-[var(--leading-tight)] text-text-base">
  Takumi Chiba
</h1>

{/* Subtitle - 控えめ、muted */}
<p className="mt-4 text-lg font-[var(--weight-normal)] tracking-[var(--tracking-normal)] text-text-muted">
  Software Engineer
</p>

{/* Scroll indicator label - モノスペース、wide tracking */}
<span className="font-mono text-[var(--type-caption)] uppercase tracking-[var(--tracking-wide)] text-text-muted">
  Scroll
</span>
```

---

## タスク2: シェーダーブラッシュアップ (WebGLの必然性追加)

### 2.1 types.ts の更新

`src/features/hero/shader/types.ts` にuniform追加:

```typescript
import type { Texture, Vector2 } from "three";

export interface HeroShaderUniforms {
  uTexture: { value: Texture | null };
  uResolution: { value: Vector2 };
  uTextureSize: { value: Vector2 };
  // Animation uniforms
  uTime: { value: number };
  uPointer: { value: Vector2 };
  uScroll: { value: number };
}
```

### 2.2 config/hero.ts へのパラメータ追加

以下のパラメータを `heroShaderConfig` に追加:

```typescript
export const heroShaderConfig = {
  // ... 既存パラメータ ...

  // === アニメーション設定 ===
  // Breathing Light (呼吸する光)
  breathIntensity: 0.08,      // 明度変調の強さ (0-1, 控えめに)
  breathFrequency: 0.4,       // sin()の周波数 (低いほどゆっくり)

  // Cursor Distortion (カーソルで滲みが揺らぐ)
  cursorDistortionStrength: 0.015,  // UV歪みの最大値
  cursorDistortionRadius: 2.5,      // 減衰の急峻さ (高いほど局所的)
  cursorFbmPhaseShift: 0.08,        // FBM位相シフト量

  // Scroll Grain (スクロールで粒度変化)
  scrollGrainScaleMin: 0.85,        // grain scaleの最小値
  scrollGrainScaleMax: 1.2,         // grain scaleの最大値
} as const;
```

### 2.3 materials/hero.ts のフラグメントシェーダー更新

`createHeroFragmentShader()` 関数を更新:

```typescript
export function createHeroFragmentShader(): string {
  const noiseGlsl = getNoiseGlsl({
    octaves: cfg.fbmOctaves,
    initialAmplitude: cfg.fbmInitialAmplitude,
    amplitudeDecay: cfg.fbmAmplitudeDecay,
    initialFrequency: cfg.fbmInitialFrequency,
  });

  return /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
// Animation uniforms
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;

${noiseGlsl}

// ... 既存の sampleAverageColor, blurSample, sampleGrainVariance 関数 ...

void main() {
  vec2 uv = vUv;

  // === 呼吸する光 (Breathing Light) ===
  // 低周波の明滅でWebGLらしい有機的な動き
  float breathe = sin(uTime * ${cfg.breathFrequency.toFixed(2)}) * 0.5 + 0.5;

  // === カーソルで滲みが揺らぐ ===
  // マウス位置からの距離に応じてFBMの位相をシフト
  vec2 pointerDist = uv - uPointer;
  float dist = length(pointerDist);
  float cursorInfluence = exp(-dist * ${cfg.cursorDistortionRadius.toFixed(2)});

  // ... 既存のobject-contain計算 ...

  // 背景基調色
  vec3 baseColor = sampleAverageColor(uTexture);

  // ... 既存のエッジ色処理 ...

  // ... 既存のフェード処理 ...
  vec3 bgColor = mix(edgeColor, baseColor, blendToBase);

  // FBMによる色変調 (カーソル位置で位相シフト)
  vec2 fbmUv = uv * ${cfg.fbmScale.toFixed(2)};
  fbmUv += cursorInfluence * ${cfg.cursorFbmPhaseShift.toFixed(3)}; // カーソル影響
  float fbmValue = fbm(fbmUv);
  bgColor += bgColor * (fbmValue - 0.5) * ${cfg.fbmIntensity.toFixed(2)};

  // === 呼吸する光の適用 ===
  // bgColorに緩やかな明度変調を加える
  bgColor *= mix(1.0 - ${cfg.breathIntensity.toFixed(3)}, 1.0 + ${cfg.breathIntensity.toFixed(3)}, breathe);

  // === スクロールで粒度変化 ===
  // スクロール量に応じてgrain scaleを変調
  float scrollInfluence = sin(uScroll * 6.28) * 0.5 + 0.5; // 0→1→0
  float grainScaleMod = mix(${cfg.scrollGrainScaleMin.toFixed(2)}, ${cfg.scrollGrainScaleMax.toFixed(2)}, scrollInfluence);

  // ノイズ振幅を写真粒度から算出 (既存ロジック)
  float grainVariance = sampleGrainVariance(uTexture, vec2(0.5), 0.02);
  float grainAmp = clamp(
    mix(${cfg.grainMin.toFixed(3)}, ${cfg.grainMax.toFixed(3)}, grainVariance * ${cfg.grainVarianceScale.toFixed(1)}),
    ${cfg.grainMin.toFixed(3)},
    ${cfg.grainMax.toFixed(3)}
  );

  // 粗い＋細かいノイズ (スクロールで粒度変化)
  float coarse = noise(uv * uResolution * ${cfg.coarseScale.toFixed(2)} * grainScaleMod) * grainAmp * ${cfg.coarseAmplitude.toFixed(2)};
  float fine = noise(uv * uResolution * ${cfg.fineScale.toFixed(2)} * grainScaleMod) * (grainAmp * ${cfg.fineAmplitude.toFixed(2)});
  bgColor += coarse + fine;
  bgColor = max(bgColor, vec3(${cfg.minBrightness.toFixed(2)}));

  // ... 既存のエッジマスク処理 ...

  // 最終合成
  vec3 color = mix(bgColor, photoColor, edgeMask);

  gl_FragColor = vec4(color, 1.0);
}
`;
}
```

### 2.4 HeroShaderBackground.tsx の更新

requestAnimationFrameループとイベントリスナーを追加:

```typescript
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  isWebGLSupported,
  getOptimalPixelRatio,
  getRendererConfig,
  loadTexture,
} from "@/shared/gl";
import { heroShaderConfig } from "../shader/config";
import { heroVertexShader, createHeroFragmentShader } from "../shader/materials";
import type { HeroShaderUniforms } from "../shader/types";

const cfg = heroShaderConfig;
const rendererCfg = getRendererConfig();

export function HeroShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isWebGLSupported()) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: rendererCfg.antialias,
      alpha: rendererCfg.alpha,
      powerPreference: rendererCfg.powerPreference,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(rendererCfg.maxPixelRatio));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    let material: THREE.ShaderMaterial | null = null;
    let texture: THREE.Texture | null = null;
    let animationFrameId: number | null = null;
    let startTime = Date.now();

    // Animation loop
    const animate = () => {
      if (material) {
        material.uniforms.uTime.value = (Date.now() - startTime) / 1000;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    // Pointer handler
    const handlePointer = (e: PointerEvent) => {
      if (!material) return;
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight; // WebGL Y座標反転
      material.uniforms.uPointer.value.set(x, y);
    };

    // Scroll handler
    const handleScroll = () => {
      if (!material) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scroll = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      material.uniforms.uScroll.value = scroll;
    };

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      if (material) {
        material.uniforms.uResolution.value.set(w, h);
      }
    };

    loadTexture("/hero.jpg")
      .then(({ texture: loadedTexture, width: texWidth, height: texHeight }) => {
        texture = loadedTexture;

        const uniforms: HeroShaderUniforms = {
          uTexture: { value: texture },
          uResolution: { value: new THREE.Vector2(width, height) },
          uTextureSize: { value: new THREE.Vector2(texWidth, texHeight) },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uScroll: { value: 0 },
        };

        material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: heroVertexShader,
          fragmentShader: createHeroFragmentShader(),
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Start animation loop
        animationFrameId = requestAnimationFrame(animate);

        // Add event listeners
        window.addEventListener("pointermove", handlePointer, { passive: true });
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);
      })
      .catch((err) => console.error("Failed to load hero texture", err));

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      if (material) material.dispose();
      if (texture) texture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    />
  );
}

export default HeroShaderBackground;
```

---

## タスク3: GSAP ダイナミックタイポアニメーション (必須)

GSAPを使用したダイナミックなタイポグラフィアニメーションを実装します。
文字分割、stagger、letter-spacing変化、クリップマスク、スクロールトリガー連動などを組み合わせます。

### 3.1 GSAPインストール

```bash
bun add gsap
```

### 3.2 文字分割ユーティリティ作成

`src/shared/utils/splitText.ts`:

```typescript
/**
 * SplitText風の文字分割ユーティリティ
 * GSAP SplitText (Club GreenSock) を使わずに実装
 */

export interface SplitResult {
  chars: HTMLSpanElement[];
  words: HTMLSpanElement[];
  revert: () => void;
}

export function splitText(element: HTMLElement, type: "chars" | "words" | "both" = "chars"): SplitResult {
  const originalHTML = element.innerHTML;
  const text = element.textContent || "";

  const chars: HTMLSpanElement[] = [];
  const words: HTMLSpanElement[] = [];

  element.innerHTML = "";
  element.setAttribute("aria-label", text);

  if (type === "words" || type === "both") {
    const wordArray = text.split(/\s+/);
    wordArray.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word inline-block";
      wordSpan.style.display = "inline-block";

      if (type === "both") {
        // 文字単位でも分割
        word.split("").forEach((char, charIndex) => {
          const charSpan = document.createElement("span");
          charSpan.className = "char inline-block";
          charSpan.style.display = "inline-block";
          charSpan.textContent = char;
          charSpan.setAttribute("aria-hidden", "true");
          wordSpan.appendChild(charSpan);
          chars.push(charSpan);
        });
      } else {
        wordSpan.textContent = word;
      }

      wordSpan.setAttribute("aria-hidden", "true");
      words.push(wordSpan);
      element.appendChild(wordSpan);

      // 単語間のスペース
      if (wordIndex < wordArray.length - 1) {
        element.appendChild(document.createTextNode(" "));
      }
    });
  } else {
    // 文字単位のみ
    text.split("").forEach((char) => {
      if (char === " ") {
        element.appendChild(document.createTextNode(" "));
      } else {
        const charSpan = document.createElement("span");
        charSpan.className = "char inline-block";
        charSpan.style.display = "inline-block";
        charSpan.textContent = char;
        charSpan.setAttribute("aria-hidden", "true");
        chars.push(charSpan);
        element.appendChild(charSpan);
      }
    });
  }

  return {
    chars,
    words,
    revert: () => {
      element.innerHTML = originalHTML;
      element.removeAttribute("aria-label");
    },
  };
}
```

### 3.3 HeroText コンポーネント作成 (ダイナミック版)

`src/features/hero/components/HeroText.tsx`:

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitText } from "@/shared/utils/splitText";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !subtitleRef.current) return;

    const ctx = gsap.context(() => {
      // === タイトル: 文字分割 + ダイナミックreveal ===
      const titleSplit = splitText(titleRef.current!, "chars");

      // 初期状態: 透明 + 上にオフセット + letter-spacing広め
      gsap.set(titleSplit.chars, {
        opacity: 0,
        y: 60,
        rotateX: -90,
        transformOrigin: "50% 50% -30px",
      });

      gsap.set(titleRef.current, {
        letterSpacing: "0.15em",
      });

      // タイムライン: 文字が1つずつ回転しながら登場
      const titleTl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      titleTl
        .to(titleRef.current, {
          letterSpacing: "-0.02em",
          duration: 1.4,
          ease: "power2.inOut",
        })
        .to(
          titleSplit.chars,
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            stagger: {
              amount: 0.6,
              from: "start",
            },
          },
          "<0.1"
        );

      // === サブタイトル: クリップマスク reveal ===
      gsap.set(subtitleRef.current, {
        clipPath: "inset(0 100% 0 0)",
        opacity: 1,
      });

      gsap.to(subtitleRef.current, {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.0,
        delay: 0.8,
        ease: "power2.inOut",
      });

      // === スクロールインジケーター: パルス + fade-in ===
      gsap.set(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
      });

      gsap.to(scrollIndicatorRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 1.4,
        ease: "power2.out",
      });

      // パルスアニメーション (ループ)
      gsap.to(scrollIndicatorRef.current, {
        y: 8,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2.0,
      });

      // === スクロール連動: タイトルのパララックス + フェードアウト ===
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;

          // タイトル: 上に移動 + フェードアウト + letter-spacing拡大
          gsap.set(titleRef.current, {
            y: -progress * 100,
            opacity: 1 - progress * 1.5,
            letterSpacing: `${-0.02 + progress * 0.1}em`,
          });

          // サブタイトル: 少し遅れてフェードアウト
          gsap.set(subtitleRef.current, {
            y: -progress * 60,
            opacity: 1 - progress * 2,
          });

          // スクロールインジケーター: 早めにフェードアウト
          gsap.set(scrollIndicatorRef.current, {
            opacity: Math.max(0, 1 - progress * 4),
          });
        },
      });

      // Cleanup用にsplitを保存
      return () => {
        titleSplit.revert();
      };
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[78vh] min-h-[600px] flex-col items-center justify-center text-center"
    >
      {/* Hero Title */}
      <h1
        ref={titleRef}
        className="text-[clamp(3rem,8vw,5rem)] font-light leading-tight text-text-base"
        style={{ perspective: "1000px" }}
      >
        Takumi Chiba
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="mt-6 text-xl font-normal text-text-muted md:text-2xl"
      >
        Software Engineer
      </p>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-8 flex flex-col items-center gap-2"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Scroll
        </span>
        <div className="h-8 w-px bg-gradient-to-b from-text-muted to-transparent" />
      </div>
    </div>
  );
}

export default HeroText;
```

### 3.4 HeroText の export追加

`src/features/hero/components/index.ts`:

```typescript
export { HeroShaderBackground } from "./HeroShaderBackground";
export { HeroText } from "./HeroText";
```

### 3.5 page.tsx でHeroTextを使用

`src/app/page.tsx` を更新:

```tsx
import { HeroShaderBackground } from "@/features/hero/components";
import { HeroText } from "@/features/hero/components";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative">
        <HeroShaderBackground />
        <HeroText />
      </section>

      {/* Content Section */}
      <section className="section-content">
        <div className="section-content__inner">
          <h2 className="mb-8 text-2xl font-semibold text-text-base">
            Selected Works
          </h2>
          <p className="text-text-muted">
            Coming soon...
          </p>
        </div>
      </section>
    </main>
  );
}
```

### 3.6 アニメーション設定の一元管理 (オプション)

`src/features/hero/config/animation.ts`:

```typescript
/**
 * Hero Animation Configuration
 * GSAPアニメーションのタイミング・イージング・値を一元管理
 */

export const heroAnimationConfig = {
  // Title Animation
  title: {
    // 初期状態
    initial: {
      opacity: 0,
      y: 60,
      rotateX: -90,
      letterSpacing: "0.15em",
    },
    // 最終状態
    animate: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      letterSpacing: "-0.02em",
    },
    // タイミング
    duration: 0.8,
    letterSpacingDuration: 1.4,
    staggerAmount: 0.6,
    ease: "power3.out",
    letterSpacingEase: "power2.inOut",
  },

  // Subtitle Animation
  subtitle: {
    delay: 0.8,
    duration: 1.0,
    ease: "power2.inOut",
  },

  // Scroll Indicator
  scrollIndicator: {
    fadeInDelay: 1.4,
    fadeInDuration: 0.6,
    pulseDelay: 2.0,
    pulseDuration: 1.2,
    pulseDistance: 8,
  },

  // Scroll Parallax
  scroll: {
    titleParallaxMultiplier: 100,
    subtitleParallaxMultiplier: 60,
    titleFadeSpeed: 1.5,
    subtitleFadeSpeed: 2,
    indicatorFadeSpeed: 4,
    letterSpacingExpand: 0.1,
  },
} as const;

export type HeroAnimationConfig = typeof heroAnimationConfig;
```

---

## タスク3 補足: アニメーション演出の詳細

### 演出の流れ

```
0.0s  → タイトル文字が letter-spacing: 0.15em で待機 (透明、上にオフセット)
0.1s  → letter-spacing が収束し始める (-0.02em へ)
0.1s  → 文字が1つずつ rotateX + y移動 で登場 (stagger)
0.8s  → サブタイトルがクリップマスクで左から右へ reveal
1.4s  → スクロールインジケーターが fade-in
2.0s  → スクロールインジケーターが上下にパルス (ループ)
scroll → タイトル/サブタイトルがパララックス + フェードアウト
```

### カスタマイズポイント

| 項目 | 調整箇所 | 効果 |
|------|---------|------|
| 文字登場の速さ | `staggerAmount` | 値を小さくすると速くなる |
| 回転の深さ | `rotateX: -90` | 角度を変えると印象が変わる |
| letter-spacing変化 | `"0.15em"` → `"-0.02em"` | 開始値/終了値を調整 |
| クリップマスク方向 | `clipPath: "inset(0 100% 0 0)"` | 右→左にしたい場合は `inset(0 0 0 100%)` |
| スクロールフェード速度 | `progress * 1.5` | 係数を変えると消える速度が変わる |

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|---------|
| `src/app/globals.css` | タイポグラフィCSS変数追加 |
| `src/app/page.tsx` | HeroText コンポーネント使用 |
| `src/features/hero/shader/types.ts` | uTime/uPointer/uScroll uniform追加 |
| `src/features/hero/shader/config/hero.ts` | アニメーションパラメータ追加 |
| `src/features/hero/shader/materials/hero.ts` | 呼吸/カーソル/スクロール効果のGLSL追加 |
| `src/features/hero/components/HeroShaderBackground.tsx` | RAFループ + イベントリスナー追加 |
| `src/features/hero/components/HeroText.tsx` | **新規** GSAPダイナミックタイポアニメーション |
| `src/features/hero/components/index.ts` | HeroText export追加 |
| `src/features/hero/config/animation.ts` | **新規** アニメーション設定一元管理 (オプション) |
| `src/shared/utils/splitText.ts` | **新規** 文字分割ユーティリティ |

## パラメータ調整箇所

### シェーダーパラメータ (`src/features/hero/shader/config/hero.ts`)

| パラメータ | 説明 | 推奨範囲 |
|-----------|------|---------|
| `breathIntensity` | 呼吸する光の明度変調量 | 0.05-0.15 |
| `breathFrequency` | 呼吸のスピード | 0.3-0.6 |
| `cursorDistortionStrength` | カーソル歪みの強さ | 0.01-0.03 |
| `cursorDistortionRadius` | カーソル影響範囲の急峻さ | 2.0-4.0 |
| `cursorFbmPhaseShift` | カーソルによるFBM位相シフト | 0.05-0.12 |
| `scrollGrainScaleMin` | スクロール時grain最小スケール | 0.8-0.9 |
| `scrollGrainScaleMax` | スクロール時grain最大スケール | 1.1-1.3 |

### GSAPアニメーションパラメータ (`HeroText.tsx` 内または `config/animation.ts`)

| パラメータ | 説明 | 推奨範囲 |
|-----------|------|---------|
| `staggerAmount` | 文字staggerの総時間 | 0.4-0.8 |
| `rotateX` | 文字回転角度 (初期) | -60 ~ -120 |
| `letterSpacing` (initial) | 初期letter-spacing | 0.1em-0.2em |
| `letterSpacing` (final) | 最終letter-spacing | -0.02em ~ 0 |
| `titleTl duration` | タイトルアニメ時間 | 0.6-1.0 |
| `scroll parallax multiplier` | スクロールパララックス量 | 60-150 |

---

## 実行手順

1. **GSAPインストール**
   ```bash
   cd apps/web && bun add gsap
   ```

2. **プロンプト実行**
   新しいClaude Codeチャットで以下を指示:
   ```
   .claude/tasks/2025-12-04-typography-shader-implementation-prompt.md の内容に従って実装してください。
   コミットは絶対にしないでください。
   ```

3. **動作確認**
   ```bash
   cd apps/web && bun run dev
   ```

4. **パラメータ調整**
   - シェーダー: `config/hero.ts` の値を変更
   - GSAP: `HeroText.tsx` 内の数値を変更

---

## 重要な制約 (再掲)

1. **コミット禁止**: 変更後は `git status` で確認のみ
2. **フォールバック維持**: WebGL非対応ブラウザは `#0a0a0a` 背景
3. **派手さ抑制**: 暗部と粒度を維持、Amber漏れを避ける
4. **パフォーマンス**: passive listenerを使用、uniform更新は軽量に
5. **アクセシビリティ**: 文字分割後も `aria-label` で元テキストを保持
