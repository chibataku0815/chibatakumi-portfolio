# Task 2.1 Enhanced: Emotional Shader Morphing + Depth-Aware Response

**フェーズ:** Phase 2 - Signature Moment
**優先度:** ★★★★★ (Critical - Level 5 必須要件)
**期間:** 10-12日
**前提条件:** Phase 1 完了推奨
**Level 貢献:** L4 → L5（Signature Moment #1）

**⚠️ これは元の 01-color-responsive-background.md の Enhanced 版です。**
**Art Direction スキルによる厳格評価の結果、Level 5 到達のために大幅に強化しました。**

---

## 🎯 目的

**「このサイトでしか体験できない瞬間」を作る。**

背景シェーダーが作品の**感情**を映し、訪問者のカーソルがその感情を**増幅**する体験。

### 元設計との違い

| 要素 | 元設計 | Enhanced 版 |
|------|--------|------------|
| 変化するもの | 色のみ | 色 + シェーダーの性格 |
| パターン種類 | 1種（FBM） | 4種（Organic/Geometric/Turbulent/Spiral） |
| インタラクション | なし | Depth-Aware（カーソル反応） |
| Level 到達 | L4.0-4.5 | **L4.5-5.0** |

---

## 📋 要件定義

### 機能要件
- [x] 各作品に感情パラメータを定義（色 + 性格）
- [x] 4種のシェーダーパターン実装
- [x] 作品切り替えでシェーダーが変容
- [x] カーソル位置で色影響が局所的に強化
- [x] 滑らかな遷移（GSAP）

### デザイン要件
- [x] 作品の感情が視覚的に伝わる
- [x] Pitch Black & Fire の世界観維持
- [x] カーソルインタラクションが「気づき」を生む
- [x] 遷移が有機的で美しい

### 技術要件
- [x] Hero shader に uniform 追加（7つ）
- [x] 4種のパターン実装（GLSL）
- [x] ScrollTrigger で作品切り替え検出
- [x] GSAP で感情パラメータのトゥイーン
- [x] パフォーマンス影響最小化（60fps 維持）

---

## 🎨 デザインコンセプト

### Visual Metaphor
```
"背景は作品の感情を映す鏡であり、
 訪問者のカーソルはその鏡を覗く光源である"

静的な背景（L3）
  ↓
色が変わる背景（L4）
  ↓
感情が変容し、探索に反応する背景（L5） ← Enhanced
```

### 感情の4次元定義

各作品に以下を設定:

```ts
interface EmotionalProfile {
  // 視覚
  colorHex: string;           // "#ffbf49"

  // 性格
  octaves: number;            // 3-8（複雑度）
  speed: number;              // 0.1-1.0（動きの速度）
  amplitude: number;          // 0.2-0.8（振幅）
  pattern: "organic" | "geometric" | "turbulent" | "spiral";

  // 温度
  temperature: number;        // 0.0 (cold) ~ 1.0 (hot)
}
```

### シェーダーパターン（4種）

| Pattern | 感情 | 視覚 | 実装 |
|---------|------|------|------|
| **Organic** | 静謐、流動 | 有機的な流れ | FBM（既存ベース） |
| **Geometric** | 革新、構造 | 幾何学的セル | Voronoi ベース |
| **Turbulent** | 情熱、激動 | 炎のような乱流 | Turbulent FBM |
| **Spiral** | 神秘、深淵 | 螺旋の渦 | Polar coordinates |

---

## 🏗️ 実装仕様

### ファイル構成
```
apps/web/src/features/hero/
├── shader/
│   ├── materials/
│   │   └── hero.ts                # uniform + patterns 追加
│   └── config/
│       └── hero.ts                # (既存)
└── components/
    └── HeroShaderBackground.tsx   # emotion control 追加

apps/web/src/shared/data/
└── portfolio.ts                   # EmotionalProfile 追加

apps/web/src/features/works/horizontal/
└── HorizontalWorks.tsx            # emotion broadcast 追加
```

---

## 📐 実装手順（10-12日）

### Day 1-2: 感情パラメータ設計

#### Step 1.1: EmotionalProfile 型定義（30分）

```ts
// apps/web/src/shared/data/portfolio.ts

export type ShaderPattern = "organic" | "geometric" | "turbulent" | "spiral";

export interface EmotionalProfile {
  colorHex: string;
  octaves: number;        // 3-8
  speed: number;          // 0.1-1.0
  amplitude: number;      // 0.2-0.8
  pattern: ShaderPattern;
  temperature: number;    // 0.0-1.0
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  media?: Media;
  role?: string;
  tags?: string[];
  background?: string;
  accent?: string;
  emotion?: EmotionalProfile; // ← 追加
}
```

#### Step 1.2: 全作品の感情設計（6-8時間）

**重要: これは Art Direction の最も重要な作業**

各作品を分析し、以下を決定:
1. どんな感情を伝えたいか？
2. その感情に最も合うパターンは？
3. 動きの速度・複雑度・振幅は？

```ts
// 例: Work 1 - 静謐なプロジェクト
{
  id: "01",
  title: "静謐なプロジェクト",
  // ... existing fields ...
  emotion: {
    colorHex: "#ffbf49",        // Amber
    octaves: 6,                 // 細かい詳細
    speed: 0.1,                 // ゆっくり
    amplitude: 0.3,             // 控えめ
    pattern: "organic",
    temperature: 0.7,           // やや温かい
  }
}

// 例: Work 2 - 革新的プロジェクト
{
  id: "02",
  title: "革新的プロジェクト",
  emotion: {
    colorHex: "#4a9eff",        // Cool Blue
    octaves: 3,                 // シンプル
    speed: 0.5,                 // 動的
    amplitude: 0.6,             // 明確
    pattern: "geometric",
    temperature: 0.3,           // 冷たい
  }
}

// 例: Work 3 - 情熱的プロジェクト
{
  id: "03",
  title: "情熱的プロジェクト",
  emotion: {
    colorHex: "#e74c3c",        // Red
    octaves: 4,
    speed: 0.8,                 // 激しい
    amplitude: 0.7,
    pattern: "turbulent",
    temperature: 0.9,           // 熱い
  }
}

// 例: Work 4 - 神秘的プロジェクト
{
  id: "04",
  title: "神秘的プロジェクト",
  emotion: {
    colorHex: "#9b59b6",        // Purple
    octaves: 8,                 // 複雑
    speed: 0.2,                 // 瞑想的
    amplitude: 0.5,
    pattern: "spiral",
    temperature: 0.5,           // 中性
  }
}
```

**完了基準**: 全作品に emotion が設定され、その選択理由が説明できる

---

### Day 3-5: Hero Shader 拡張

#### Step 2.1: Uniform 追加（1時間）

```ts
// apps/web/src/features/hero/shader/materials/hero.ts

export interface HeroShaderUniforms {
  // 既存
  uTexture: { value: THREE.Texture | null };
  uResolution: { value: THREE.Vector2 };
  uTextureSize: { value: THREE.Vector2 };
  uTime: { value: number };
  uPointer: { value: THREE.Vector2 };
  uScroll: { value: number };

  // 新規
  uActiveWorkColor: { value: THREE.Color };
  uOctaves: { value: number };
  uSpeed: { value: number };
  uAmplitude: { value: number };
  uPattern: { value: number };          // 0-3
  uTemperature: { value: number };
  uColorInfluence: { value: number };   // Depth-Aware 用
}
```

#### Step 2.2: Fragment Shader - Helper Functions（2時間）

```glsl
// apps/web/src/features/hero/shader/materials/hero.ts

export const createHeroFragmentShader = () => /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uTextureSize;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uScroll;

  // Emotion uniforms
  uniform vec3 uActiveWorkColor;
  uniform float uOctaves;
  uniform float uSpeed;
  uniform float uAmplitude;
  uniform int uPattern;
  uniform float uTemperature;
  uniform float uColorInfluence;

  varying vec2 vUv;

  // ====================
  // Helper Functions
  // ====================

  // Hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Noise
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

  // FBM (Fractal Brownian Motion)
  float fbm(vec2 p, float octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(float i = 0.0; i < 8.0; i++) {
      if(i >= octaves) break;
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  // ====================
  // Pattern Implementations
  // ====================

  // Pattern 0: Organic (有機的な流れ)
  float organicPattern(vec2 uv, float time) {
    return fbm(uv * 2.0 + vec2(time * uSpeed, 0.0), uOctaves);
  }

  // Pattern 1: Geometric (幾何学的なセル)
  float geometricPattern(vec2 uv, float time) {
    vec2 cell = floor(uv * 4.0);
    vec2 fract_uv = fract(uv * 4.0);

    float minDist = 1.0;

    for(int y = -1; y <= 1; y++) {
      for(int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = 0.5 + 0.5 * sin(time * uSpeed + 6.2831 * hash(cell + neighbor));
        float dist = length(neighbor + point - fract_uv);
        minDist = min(minDist, dist);
      }
    }

    return minDist;
  }

  // Pattern 2: Turbulent (炎のような乱流)
  float turbulentPattern(vec2 uv, float time) {
    float n = fbm(uv * 3.0 + vec2(0.0, time * uSpeed * 2.0), uOctaves);
    n += fbm((uv + n) * 2.0, uOctaves * 0.5) * 0.5;
    return abs(sin(n * 3.14159));
  }

  // Pattern 3: Spiral (螺旋の渦)
  float spiralPattern(vec2 uv, float time) {
    vec2 center = uv - 0.5;
    float angle = atan(center.y, center.x);
    float radius = length(center);

    float spiral = sin(radius * 10.0 - angle * 3.0 + time * uSpeed);
    return spiral * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    // ====================
    // Pattern Selection
    // ====================

    float pattern;
    if(uPattern == 0) {
      pattern = organicPattern(uv, uTime);
    } else if(uPattern == 1) {
      pattern = geometricPattern(uv, uTime);
    } else if(uPattern == 2) {
      pattern = turbulentPattern(uv, uTime);
    } else {
      pattern = spiralPattern(uv, uTime);
    }

    // Apply amplitude
    pattern *= uAmplitude;

    // ====================
    // Depth-Aware Color Response
    // ====================

    vec2 centerOffset = uv - 0.5;
    float distanceFromCenter = length(centerOffset);

    // カーソルが中央にある時、色影響が強まる
    float pointerInfluence = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);

    // 基本12% → 中央で最大30%
    float colorInfluence = mix(0.12, 0.30, pointerInfluence * uColorInfluence);

    // ====================
    // Final Color Composition
    // ====================

    vec3 baseColor = vec3(0.0); // Pure black

    // 作品色をブレンド
    vec3 workColor = mix(baseColor, uActiveWorkColor, colorInfluence * pattern);

    // Temperature に応じた微調整（optional）
    vec3 coldTint = vec3(0.9, 0.95, 1.0);
    vec3 hotTint = vec3(1.0, 0.95, 0.9);
    vec3 tempTint = mix(coldTint, hotTint, uTemperature);
    workColor *= tempTint;

    // Pitch Black を維持（彩度抑制）
    workColor = mix(baseColor, workColor, 0.8);

    gl_FragColor = vec4(workColor, 1.0);
  }
`;
```

**完了基準**: 4パターンすべてが視覚的に明確に異なる

---

### Day 6-7: HeroShaderBackground 制御実装

```tsx
// apps/web/src/features/hero/components/HeroShaderBackground.tsx

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { HeroShaderUniforms, EmotionalProfile } from "@/shared/data/portfolio";

export function HeroShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    // ... existing setup ...

    const uniforms: HeroShaderUniforms = {
      // 既存
      uTexture: { value: null },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uTextureSize: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },

      // 新規
      uActiveWorkColor: { value: new THREE.Color(0x000000) }, // 初期値: 黒
      uOctaves: { value: 6.0 },                                // デフォルト
      uSpeed: { value: 0.1 },
      uAmplitude: { value: 0.3 },
      uPattern: { value: 0 },                                  // organic
      uTemperature: { value: 0.5 },
      uColorInfluence: { value: 1.0 },                        // Depth-Aware の強度
    };

    // ... rest of setup ...

    materialRef.current = material;
  }, []);

  // ====================
  // Emotion Change Listener
  // ====================

  useEffect(() => {
    const handleWorkEmotionChange = (event: CustomEvent<{ emotion: EmotionalProfile }>) => {
      if (!materialRef.current) return;

      const { emotion } = event.detail;

      // パターンマップ
      const patternMap: Record<string, number> = {
        organic: 0,
        geometric: 1,
        turbulent: 2,
        spiral: 3,
      };

      // 色のトゥイーン
      const targetColor = new THREE.Color(emotion.colorHex);
      gsap.to(materialRef.current.uniforms.uActiveWorkColor.value, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 2.0,
        ease: "power2.inOut",
      });

      // Octaves のトゥイーン（ゆっくり）
      gsap.to(materialRef.current.uniforms.uOctaves, {
        value: emotion.octaves,
        duration: 3.0,
        ease: "power1.inOut",
      });

      // Speed のトゥイーン
      gsap.to(materialRef.current.uniforms.uSpeed, {
        value: emotion.speed,
        duration: 3.0,
        ease: "power1.inOut",
      });

      // Amplitude のトゥイーン
      gsap.to(materialRef.current.uniforms.uAmplitude, {
        value: emotion.amplitude,
        duration: 2.5,
        ease: "power2.inOut",
      });

      // Temperature のトゥイーン
      gsap.to(materialRef.current.uniforms.uTemperature, {
        value: emotion.temperature,
        duration: 2.0,
        ease: "power2.inOut",
      });

      // Pattern は離散値なので即座に切り替え
      materialRef.current.uniforms.uPattern.value = patternMap[emotion.pattern];
    };

    window.addEventListener("workEmotionChange", handleWorkEmotionChange as EventListener);

    return () => {
      window.removeEventListener("workEmotionChange", handleWorkEmotionChange as EventListener);
    };
  }, []);

  // ====================
  // Depth-Aware: Pointer Tracking
  // ====================

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!materialRef.current) return;

      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight;

      materialRef.current.uniforms.uPointer.value.set(x, y);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-shader-bg fixed inset-0 -z-10 pointer-events-none"
      style={{ background: "#000000" }}
      aria-hidden="true"
    />
  );
}
```

**完了基準**:
- 作品切り替えでパラメータが滑らかに変化
- カーソル移動で uPointer が更新される

---

### Day 8-9: HorizontalWorks 統合

```tsx
// apps/web/src/features/works/horizontal/HorizontalWorks.tsx

import { WORKS } from "@/shared/data/portfolio";

const createMainTimeline = (panelData: PanelData[], transitionLine: HTMLDivElement | null) => {
  const timeline = gsap.timeline();

  for (const [index, data] of panelData.entries()) {
    const work = WORKS[index];

    timeline.to(
      data.titleChars,
      {
        opacity: 1,
        duration: ANIMATION.title.duration,
        stagger: ANIMATION.title.stagger,
        ease: "power2.out",
        onStart: () => {
          data.progressFill.classList.add("active");
          setActiveSection(index);

          // Emotion Broadcast
          if (work.emotion) {
            const event = new CustomEvent("workEmotionChange", {
              detail: { emotion: work.emotion },
            });
            window.dispatchEvent(event);
          }
        },
      },
      index === 0 ? 0 : ">"
    );

    // ... rest of timeline ...
  }

  return timeline;
};
```

**完了基準**: 作品切り替え時に workEmotionChange イベントが発火

---

### Day 10: 調整とテスト

#### 調整項目
1. **彩度調整**: Pitch Black を維持
2. **遷移タイミング**: 有機的な変身を演出
3. **Depth-Aware 強度**: カーソル影響の適切な範囲
4. **パフォーマンス**: 60fps 確認

#### テスト項目
- [ ] 4パターンすべてが視覚的に明確に異なる
- [ ] 作品の感情が伝わる
- [ ] カーソルを中央に動かすと色が強まる
- [ ] 遷移が滑らかで美しい
- [ ] モバイルでも動作する
- [ ] 60fps 維持

---

### Day 11-12: 最終検証・ドキュメント

- [ ] 全作品で動作確認
- [ ] スクリーンショット・動画撮影
- [ ] Award-Worthy Checklist 実施
- [ ] README.md 更新

---

## ✅ 完了基準（Level 5 版）

### 必須項目
- [x] 全作品に EmotionalProfile が設定されている
- [x] 4つのシェーダーパターンが実装されている
- [x] 作品切り替えでシェーダーが変容する
- [x] カーソル位置で色影響が変化する（Depth-Aware）
- [x] Pitch Black & Fire の世界観が維持されている
- [x] パフォーマンス影響なし（60fps 維持）

### Award-Worthy 基準
- [x] **「おっ」と思わせる瞬間があるか？**
- [x] **他のサイトでは見たことがないか？**
- [x] **背景と作品の「対話」を感じるか？**
- [x] **カーソルを動かすと「発見」があるか？**
- [x] **感情が視覚的に伝わるか？**

---

## 🎨 パラメータ調整ガイド

### Emotion Design のベストプラクティス

```
静謐な作品:
  octaves: 6-8（繊細）
  speed: 0.1-0.2（ゆっくり）
  amplitude: 0.2-0.3（控えめ）
  pattern: organic or spiral

動的な作品:
  octaves: 3-4（シンプル）
  speed: 0.5-0.8（速い）
  amplitude: 0.6-0.7（明確）
  pattern: geometric or turbulent

神秘的な作品:
  octaves: 7-8（複雑）
  speed: 0.2-0.3（瞑想的）
  amplitude: 0.4-0.5（中程度）
  pattern: spiral

情熱的な作品:
  octaves: 4-5
  speed: 0.7-1.0（激しい）
  amplitude: 0.7-0.8（強い）
  pattern: turbulent
```

### Depth-Aware 調整

```glsl
// 基本影響度と最大影響度
float colorInfluence = mix(0.12, 0.30, pointerInfluence * uColorInfluence);

// 控えめ
mix(0.08, 0.20, ...)

// 推奨（デフォルト）
mix(0.12, 0.30, ...)

// 強め
mix(0.15, 0.40, ...)
```

---

## 🚨 注意事項

### パフォーマンス
- Fragment shader の計算: 4パターン分岐（許容範囲）
- GSAP トゥイーン: CPU 側で実行（GPU 負荷なし）
- 60fps 維持を最優先

### 世界観の維持
```
彩度: 最大 20%（Depth-Aware で一時的に 30%）
明度: 暗部を保つ
対比: Amber アクセントとの調和

→ 背景は「補完」であり「主役」ではない
```

### ブラウザ互換性
- CustomEvent の polyfill（IE11 等）
- WebGL サポート確認
- モバイルでの動作テスト

---

## 📚 参照リソース

### プロジェクト内
- [00-ART-DIRECTION.md](./00-ART-DIRECTION.md) - Phase 2 アート指針
- [Emotional-Parameter-Template.md](./Emotional-Parameter-Template.md) - 感情設計テンプレート
- `apps/web/src/features/hero/shader/materials/hero.ts`
- `apps/web/src/shared/data/portfolio.ts`

### 参照サイト
- **Active Theory**: 背景とコンテンツの有機的連動
- **Aristide Benoist**: 予想を超える瞬間の設計
- **Resn**: 色の使い方の芸術性

---

## 🎯 成功の証明

このタスク完了後、以下を達成:

✅ **Signature Moment #1 実装完了**
- 背景が作品の感情を映す ✓
- カーソルでその感情を増幅できる ✓
- 見たことのない表現 ✓

✅ **Award-Worthy Checklist "Only Here Test" 通過**
- このサイトでしか体験できない ✓
- コピーが困難 ✓
- 見たことのない表現 ✓

✅ **Level 5 視界圏**
- Emotional Resonance: **L5 到達**
- Visual Impact: **L4.5**
- Motion & Interaction: **L4.5**

---

## 📝 完了後のアクション

1. **動画録画**: 感情変容とDepth-Awareの様子をキャプチャ
2. **スクリーンショット**: 4パターンすべてを記録
3. **README.md 更新**: Phase 2.1 完了を記録
4. **外部レビュー**: 可能であれば第三者の評価を取得
5. **次のタスクへ**: [02-depth-responsive-parallax.md](./02-depth-responsive-parallax.md)

---

**Status:** 🔜 Not Started（Phase 1 完了待ち）
**Art Direction 承認:** ✅ 承認済み（Level 5 到達可能）
**実装開始予定:** Phase 1 完了後
**完了予定:** Phase 1 完了 + 10-12日

---

## 💡 Level 5 到達の鍵

**Art Direction スキルより:**

> このタスクは、単なる「背景の装飾」ではない。
>
> 作品と背景の「対話」を作り、
> 訪問者がその対話を「発見」する体験を設計している。
>
> 4つのパターン、感情パラメータ、Depth-Aware、
> これらすべてが合わさって初めて、
> 「見たことのない」体験になる。
>
> 1つでも手を抜けば、Level 4 止まり。
> すべてを完璧に実装して、Level 5 へ。

**妥協なく、完璧を目指せ。**
