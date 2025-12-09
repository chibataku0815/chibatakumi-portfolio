# Profile Page Redesign Implementation

Haiku 4.5 向け実装プロンプト（根本的再設計版）

---

## 禁止事項（最重要）

```
1. 絶対にコミットを行わない（git commit 禁止）
2. ビルド・リンター確認は不要
3. back.out, bounce 系 ease 禁止（power2/3/expo のみ）
4. backgroundPositionY 禁止（transform を使用）
5. すべて中央配置 禁止（非対称を採用）
```

---

## 設計思想

このページは「履歴の一覧」ではなく「人格の深層への旅」。

```
Core Concept: 「地層」
- 時間の堆積（Timeline）
- 深く掘るほど豊かな発見
- 各層が現在の自分を形成している

Emotional Arc:
  Entry: 「経験を見てみよう」(neutral)
    ↓
  Mid: 「深い」(engagement)
    ↓
  Peak: 「この人の視点は一貫している」(trust)
    ↓
  Exit: 「任せたい」(action intent)
```

---

## 現状からの主要変更点

### 1. Strengths Section: 「結晶構造」化

```
現状: 3つの Strength を縦に並べるだけ
↓
提案: 視覚的に「繋がっている」ことを表現

┌─────────────────────────────────────────┐
│                                         │
│      ┌──────────────────┐               │
│      │  STRENGTH 01     │╲              │
│      │  統合設計        │  ╲            │
│      └──────────────────┘    ╲          │
│                                ●───────│─→ 繋がりを示す線
│  ┌──────────────────┐       ╱           │
│  │  STRENGTH 02     │─────╱            │
│  │  効率性          │                   │
│  └──────────────────┘                   │
│                                         │
│            ┌──────────────────┐         │
│            │  STRENGTH 03     │         │
│            │  美意識          │         │
│            └──────────────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Timeline Section: 「地層」ビジュアライゼーション

```
現状: 年代順にカードを並べる
↓
提案: 深さを視覚的に表現

2024 ═══════════════════ (表面層)
  └─ 最新の経験、最も詳細

2021 ═══════════════════
  └─ 中間層

2018 ═══════════════════
  └─ 古いほど Ghost が濃くなる

2011 ═══════════════════ (最深層)
  └─ 起源、特別な演出
```

### 3. Ghost 視認性の大幅向上

```
現状: opacity 0.06-0.07 (見えない)
↓
提案:
  Strengths: 0.15
  Timeline (新しい): 0.12
  Timeline (古い): 0.20 (深層ほど濃い)
```

---

## ファイル構成

```
apps/web/src/features/profile/
├── ProfileClient.tsx       # メインクライアント（変更）
├── ProfileSections.tsx     # セクションコンポーネント（大幅変更）
├── ProfileAnimations.ts    # アニメーション設定・関数（新規）
└── index.ts
```

---

## ファイル1: ProfileAnimations.ts（新規作成）

`apps/web/src/features/profile/ProfileAnimations.ts`:

```typescript
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Profile Page アニメーション設定
 */
export const ANIMATION_CONFIG = {
  strengths: {
    ghost: {
      initialY: 60,
      initialBlur: 10,
      initialScale: 1.08,
      finalOpacity: 0.15,
      parallaxY: 80,
      duration: 1.0,
      ease: "expo.out",
    },
    rail: {
      duration: 0.9,
      ease: "expo.out",
    },
    title: {
      initialX: "-110%",
      duration: 0.85,
      ease: "expo.out",
    },
    description: {
      charStagger: 0.006,
      charBlur: 3,
      duration: 0.5,
      ease: "power2.out",
    },
    keywords: {
      initialY: 16,
      stagger: 0.06,
      duration: 0.35,
      ease: "power3.out",
    },
    connector: {
      // Strength 間の接続線
      duration: 0.8,
      ease: "power2.inOut",
    },
  },

  timeline: {
    ghost: {
      initialY: 80,
      initialBlur: 12,
      initialScale: 1.1,
      // 深層ほど濃い opacity
      getOpacity: (depth: number, total: number) =>
        0.12 + (depth / total) * 0.08,
      parallaxY: 100,
      duration: 1.2,
      ease: "expo.out",
    },
    rail: {
      duration: 1.0,
      ease: "expo.out",
    },
    title: {
      initialX: "-120%",
      duration: 0.9,
      ease: "expo.out",
    },
    meta: {
      initialY: 24,
      stagger: 0.1,
      duration: 0.5,
      ease: "power3.out", // back.out禁止
    },
    description: {
      charStagger: 0.005,
      duration: 0.5,
      ease: "power2.out",
    },
    achievements: {
      // 左からワイプ
      initialClipPath: "inset(0 100% 0 0)",
      stagger: 0.12,
      duration: 0.6,
      ease: "power2.out",
    },
    techStack: {
      initialY: 14,
      stagger: 0.05,
      duration: 0.35,
      ease: "power3.out",
    },
    depth: {
      // 最深層到達時の特別演出
      duration: 1.5,
      glowColor: "var(--accent-amber1)",
    },
  },

  parallax: {
    ghost: {
      speed: 0.7,
      scaleRange: 0.12,
    },
    content: {
      speed: 0.08,
    },
    gridLines: {
      speed: 1.3,
    },
  },
} as const;

/**
 * Strength セクションのエントリーアニメーション
 */
export function setupStrengthEntry(
  el: HTMLElement,
  index: number,
  total: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.strengths;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const rail = el.querySelector<HTMLElement>(".rail");
  const titleBand = el.querySelector<HTMLElement>(".band-text");
  const description = el.querySelector<HTMLElement>(".description");
  const keywords = el.querySelectorAll<HTMLElement>(".keyword");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");
  const connector = el.querySelector<HTMLElement>(".connector-line");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 70%",
      end: "top 20%",
      once: true,
    },
  });

  // Grid Lines
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.06, duration: 0.6, ease: "power1.out" });
  }

  // Ghost
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
        duration: config.ghost.duration,
        ease: config.ghost.ease,
        clearProps: "filter",
      },
      0.2
    );
  }

  // Rail
  if (rail) {
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: config.rail.duration,
        ease: config.rail.ease,
      },
      0.4
    );
  }

  // Title
  if (titleBand) {
    gsap.set(titleBand, { x: config.title.initialX, opacity: 0 });
    tl.to(
      titleBand,
      {
        x: "0%",
        opacity: 1,
        duration: config.title.duration,
        ease: config.title.ease,
      },
      0.6
    );
  }

  // Description (文字単位)
  if (description) {
    const text = description.textContent || "";
    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " "
          ? " "
          : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px)">${char}</span>`
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
      0.9
    );
  }

  // Keywords
  if (keywords.length > 0) {
    gsap.set(keywords, { y: config.keywords.initialY, opacity: 0 });
    tl.to(
      keywords,
      {
        y: 0,
        opacity: 1,
        stagger: config.keywords.stagger,
        duration: config.keywords.duration,
        ease: config.keywords.ease,
      },
      1.2
    );
  }

  // Connector line (次のStrengthへの接続)
  if (connector && index < total - 1) {
    gsap.set(connector, { scaleY: 0, transformOrigin: "top center" });
    tl.to(
      connector,
      {
        scaleY: 1,
        duration: config.connector.duration,
        ease: config.connector.ease,
      },
      1.4
    );
  }

  return tl;
}

/**
 * Timeline セクションのエントリーアニメーション
 */
export function setupTimelineEntry(
  el: HTMLElement,
  index: number,
  total: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.timeline;
  const depth = index; // 0が最新、大きいほど古い

  const ghost = el.querySelector<HTMLElement>(".ghost-year");
  const rail = el.querySelector<HTMLElement>(".rail");
  const titleBand = el.querySelector<HTMLElement>(".band");
  const metaItems = el.querySelectorAll<HTMLElement>(".meta-item");
  const description = el.querySelector<HTMLElement>(".description");
  const achievements = el.querySelectorAll<HTMLElement>(".achievement-item");
  const techStack = el.querySelectorAll<HTMLElement>(".tag");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");
  const depthIndicator = el.querySelector<HTMLElement>(".depth-indicator");

  const ghostOpacity = config.ghost.getOpacity(depth, total);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 70%",
      end: "top 20%",
      once: true,
    },
  });

  // Grid Lines
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.08, duration: 0.7, ease: "power1.out" });
  }

  // Depth Indicator (深さを示すライン)
  if (depthIndicator) {
    gsap.set(depthIndicator, { scaleX: 0, transformOrigin: "left center" });
    tl.to(
      depthIndicator,
      {
        scaleX: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      0.1
    );
  }

  // Ghost Year
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
        opacity: ghostOpacity,
        scale: 1,
        filter: "blur(0px)",
        duration: config.ghost.duration,
        ease: config.ghost.ease,
        clearProps: "filter",
      },
      0.2
    );
  }

  // Rail
  if (rail) {
    const railWidth = 2 + depth * 1; // 深いほど太い
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)", width: railWidth });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: config.rail.duration,
        ease: config.rail.ease,
      },
      0.4
    );
  }

  // Meta items
  if (metaItems.length > 0) {
    gsap.set(metaItems, { y: config.meta.initialY, opacity: 0 });
    tl.to(
      metaItems,
      {
        y: 0,
        opacity: 1,
        stagger: config.meta.stagger,
        duration: config.meta.duration,
        ease: config.meta.ease,
      },
      0.6
    );
  }

  // Title
  if (titleBand) {
    gsap.set(titleBand, { x: config.title.initialX, opacity: 0 });
    tl.to(
      titleBand,
      {
        x: "0%",
        opacity: 1,
        duration: config.title.duration,
        ease: config.title.ease,
      },
      0.8
    );
  }

  // Description (文字単位、Timeline用)
  if (description) {
    const text = description.textContent || "";
    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " " ? " " : `<span class="char" style="opacity:0">${char}</span>`
      )
      .join("");

    const chars = description.querySelectorAll(".char");
    tl.to(
      chars,
      {
        opacity: 1,
        stagger: config.description.charStagger,
        duration: config.description.duration,
        ease: config.description.ease,
      },
      1.1
    );
  }

  // Achievements (左からワイプ)
  if (achievements.length > 0) {
    gsap.set(achievements, {
      clipPath: config.achievements.initialClipPath,
      opacity: 0,
    });
    tl.to(
      achievements,
      {
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
        stagger: config.achievements.stagger,
        duration: config.achievements.duration,
        ease: config.achievements.ease,
      },
      1.4
    );
  }

  // Tech Stack
  if (techStack.length > 0) {
    gsap.set(techStack, { y: config.techStack.initialY, opacity: 0 });
    tl.to(
      techStack,
      {
        y: 0,
        opacity: 1,
        stagger: config.techStack.stagger,
        duration: config.techStack.duration,
        ease: config.techStack.ease,
      },
      1.7
    );
  }

  // 最深層の特別演出
  if (depth === total - 1) {
    const glowEl = el.querySelector<HTMLElement>(".origin-glow");
    if (glowEl) {
      gsap.set(glowEl, { opacity: 0, scale: 0.8 });
      tl.to(
        glowEl,
        {
          opacity: 1,
          scale: 1,
          duration: config.depth.duration,
          ease: "power2.out",
        },
        2.0
      );
    }
  }

  return tl;
}

/**
 * Parallax設定
 */
export function setupProfileParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost, .ghost-year");
  const content = el.querySelector<HTMLElement>(".profile-content");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    scrub: 0.9,
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5;

      if (ghost) {
        const y = centered * config.ghost.speed * 120;
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange;
        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
      }

      if (content) {
        const y = centered * config.content.speed * 40;
        content.style.transform = `translateY(${y}px)`;
      }

      if (gridLines) {
        const y = progress * config.gridLines.speed * 50;
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
```

---

## ファイル2: ProfileSections.tsx（大幅変更）

`apps/web/src/features/profile/ProfileSections.tsx`:

```tsx
import { AnimatedHeading } from "@/shared/components";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { ReactNode } from "react";

const BASE_BG = "#0b0b0b";
const BAND_BG = "#f2f2f2";

export interface Strength {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface Experience {
  id: string;
  period: string;
  type: string;
  role: string;
  description: string;
  achievements: string[];
  techStack: string[];
  teamSize?: string;
}

// ====== Layout Components ======

export function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      {children}
    </main>
  );
}

export function ProfileBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={fluidConfigMonochrome}
        fadeIn={true}
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

export function ProfileIntro() {
  return (
    <section className="relative z-10 flex min-h-[60vh] items-end px-6 pb-20 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div>
            <AnimatedHeading
              as="h1"
              className="mb-4 text-[clamp(3rem,10vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-base)]"
            >
              Profile
            </AnimatedHeading>
          </div>
          <div className="flex items-end">
            <p className="max-w-md text-[clamp(1rem,1.4vw,1.3rem)] leading-relaxed text-[var(--text-base-70)]">
              デザイン・コード・映像を一人で統合し、
              <span className="text-[var(--text-base)]">意図通りのアウトプット</span>
              を作る。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ====== Strength Section (結晶構造) ======

interface StrengthSectionProps {
  strength: Strength;
  index: number;
  total: number;
  setRef: (el: HTMLElement | null, index: number) => void;
}

export function StrengthSection({
  strength,
  index,
  total,
  setRef,
}: StrengthSectionProps) {
  // 非対称配置: 偶数は左寄り、奇数は右寄り
  const isEven = index % 2 === 0;

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="strength-section relative isolate min-h-[60vh] overflow-visible px-6 py-20 sm:px-10"
    >
      {/* Grid Lines */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-4 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Ghost STR */}
      <div
        className="ghost pointer-events-none absolute -z-2 select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.08em]"
        style={{
          fontSize: "clamp(8rem, 18vw, 14rem)",
          color: "rgba(255,255,255,0.15)",
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          ...(isEven
            ? { right: "-10%", top: "15%" }
            : { left: "-10%", top: "20%" }),
        }}
      >
        STR
      </div>

      {/* Rail */}
      <div
        className={`pointer-events-none absolute inset-y-0 flex w-10 items-center justify-center sm:w-12 ${isEven ? "left-0" : "right-0"}`}
      >
        <div
          className={`rail absolute inset-y-20 w-px bg-white/25 ${isEven ? "right-0" : "left-0"}`}
          style={{ clipPath: "inset(0 0 100% 0)" }}
        />
        <div className="-rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.36em] text-[var(--text-base-40)]">
          Strength {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Content */}
      <div
        className={`profile-content mx-auto max-w-5xl ${isEven ? "pr-16 md:pr-0" : "pl-16 md:pl-0"}`}
      >
        <div
          className={`grid gap-10 md:grid-cols-[1fr,1.5fr] ${isEven ? "" : "md:grid-cols-[1.5fr,1fr]"}`}
        >
          {/* Title側 */}
          <div className={`space-y-6 ${isEven ? "" : "md:order-2"}`}>
            {/* Meta */}
            <div className="flex items-center gap-3 text-[var(--text-base-50)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
                Core Strength
              </span>
              <span className="h-px w-10 bg-[var(--accent-amber1)]" />
            </div>

            {/* Title */}
            <div className="relative">
              <div className="band-wrapper overflow-hidden" style={{ display: "inline-block" }}>
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
          </div>

          {/* Description側 */}
          <div className={`space-y-6 ${isEven ? "" : "md:order-1"}`}>
            <p
              className={`description text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-[var(--text-base-80)] ${isEven ? "" : "md:text-right"}`}
            >
              {strength.description}
            </p>

            {/* Keywords */}
            <div className={`flex flex-wrap gap-2 ${isEven ? "" : "md:justify-end"}`}>
              {strength.keywords.map((keyword) => (
                <span
                  key={`${strength.id}-${keyword}`}
                  className="keyword rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] uppercase tracking-[0.1em] text-[var(--text-base-60)] transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connector Line (次のStrengthへ) */}
      {index < total - 1 && (
        <div
          className="connector-line absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-white/20 to-transparent"
          style={{ transformOrigin: "top center" }}
        />
      )}
    </section>
  );
}

// ====== Timeline Section (地層) ======

interface TimelineSectionProps {
  exp: Experience;
  index: number;
  total: number;
  setRef: (el: HTMLElement | null, index: number) => void;
}

export function TimelineSection({
  exp,
  index,
  total,
  setRef,
}: TimelineSectionProps) {
  const depth = index; // 深さ（0が最新、大きいほど古い）
  const isDeepest = index === total - 1;

  // 深いほど Ghost が濃い
  const ghostOpacity = 0.12 + (depth / total) * 0.08;

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="timeline-section relative isolate min-h-[70vh] overflow-visible px-6 py-20 sm:px-10"
      data-depth={depth}
    >
      {/* Grid Lines */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-9 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Depth Indicator (深さを示す横ライン) */}
      <div
        className="depth-indicator absolute left-0 top-8 h-px w-full"
        style={{
          background: `linear-gradient(90deg, var(--accent-amber1) ${(depth + 1) * 15}%, transparent ${(depth + 1) * 15}%)`,
        }}
      />

      {/* Ghost Year */}
      <div
        className="ghost-year pointer-events-none absolute -z-8 select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em]"
        style={{
          fontSize: "clamp(10rem, 22vw, 18rem)",
          color: `rgba(255,255,255,${ghostOpacity})`,
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          right: "-12%",
          top: "12%",
        }}
      >
        {exp.period.split(" - ")[0]}
      </div>

      {/* Rail (深いほど太い) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center sm:w-20">
        <div
          className="rail absolute inset-y-16 right-0 bg-white/25"
          style={{
            width: `${2 + depth * 1}px`,
            clipPath: "inset(0 0 100% 0)",
          }}
        />
        <div className="-rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-base-50)]">
          {exp.period.split(" - ")[0]}
        </div>
      </div>

      {/* Content */}
      <div className="profile-content mx-auto ml-20 max-w-5xl sm:ml-24">
        <div className="grid gap-10 md:grid-cols-[1.3fr,1fr]">
          {/* Left: Main info */}
          <div className="space-y-6">
            {/* Meta items */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="meta-item text-[15px] italic tracking-wide text-[var(--text-base-60)]">
                {exp.period}
              </span>
              <span
                className="meta-item inline-block bg-white/10 px-3 py-1 text-[24px] font-semibold leading-none text-[var(--text-base)]"
              >
                {exp.type}
              </span>
              {exp.teamSize && (
                <span className="meta-item rounded border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-[var(--text-base-60)]">
                  {exp.teamSize}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="relative">
              <div
                className="band inline-block text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                style={{
                  backgroundColor: BAND_BG,
                  padding: "0.22em 0.4em",
                  boxShadow: "10px 10px 0 rgba(0,0,0,0.5)",
                }}
              >
                {exp.role}
              </div>
            </div>

            {/* Description */}
            <p className="description max-w-lg text-[clamp(0.95rem,1.3vw,1.15rem)] leading-relaxed text-[var(--text-base-80)]">
              {exp.description}
            </p>
          </div>

          {/* Right: Achievements + Tech */}
          <div className="space-y-6">
            {/* Achievements */}
            <ul className="space-y-3">
              {exp.achievements.map((achievement, i) => (
                <li
                  key={i}
                  className="achievement-item flex items-start gap-3 text-sm text-[var(--text-base-70)]"
                  style={{ transformOrigin: "left center" }}
                >
                  <span className="mt-1.5 h-0.5 w-5 flex-shrink-0 bg-[var(--accent-amber1)]/70" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2">
              {exp.techStack.map((tech) => (
                <span
                  key={tech}
                  className="tag rounded border border-white/12 bg-white/6 px-3 py-1.5 text-[12px] text-[var(--text-base-70)] transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Origin Glow (最深層のみ) */}
      {isDeepest && (
        <div
          className="origin-glow pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
          style={{
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, var(--accent-amber1) 0%, transparent 70%)",
            opacity: 0,
            filter: "blur(60px)",
          }}
        />
      )}
    </section>
  );
}
```

---

## ファイル3: ProfileClient.tsx（変更）

`apps/web/src/features/profile/ProfileClient.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ProfileBackground,
  ProfileIntro,
  ProfileLayout,
  StrengthSection,
  TimelineSection,
  Strength,
  Experience,
} from "./ProfileSections";
import {
  setupStrengthEntry,
  setupTimelineEntry,
  setupProfileParallax,
} from "./ProfileAnimations";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProfileClientProps {
  profile: {
    strengths: Strength[];
    experience: Experience[];
  };
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const { strengths, experience } = profile;

  const strengthRefs = useRef<(HTMLElement | null)[]>([]);
  const timelineRefs = useRef<(HTMLElement | null)[]>([]);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  const setStrengthRef = useCallback((el: HTMLElement | null, index: number) => {
    strengthRefs.current[index] = el;
  }, []);

  const setTimelineRef = useCallback((el: HTMLElement | null, index: number) => {
    timelineRefs.current[index] = el;
  }, []);

  useEffect(() => {
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        // Strengths
        for (const [index, el] of strengthRefs.current.entries()) {
          if (!el) continue;
          setupStrengthEntry(el, index, strengths.length);
          const trigger = setupProfileParallax(el);
          triggersRef.current.push(trigger);
        }

        // Timeline
        for (const [index, el] of timelineRefs.current.entries()) {
          if (!el) continue;
          setupTimelineEntry(el, index, experience.length);
          const trigger = setupProfileParallax(el);
          triggersRef.current.push(trigger);
        }
      });

      return () => {
        ctx.revert();
        for (const trigger of triggersRef.current) {
          trigger.kill();
        }
        triggersRef.current = [];
      };
    });
  }, [strengths.length, experience.length]);

  return (
    <ProfileLayout>
      <ProfileBackground />
      <ProfileIntro />

      {/* Breathing Zone */}
      <div className="h-[15vh]" aria-hidden="true" />

      {/* Strengths Section Header */}
      <div className="relative z-10 px-6 pb-10 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]">
            Strengths
          </h2>
          <p className="mt-2 text-[var(--text-base-60)]">
            これらが一人の中で統合されるとき
          </p>
        </div>
      </div>

      {/* Strengths */}
      <div className="relative z-10">
        {strengths.map((strength, index) => (
          <StrengthSection
            key={strength.id}
            strength={strength}
            index={index}
            total={strengths.length}
            setRef={setStrengthRef}
          />
        ))}
      </div>

      {/* Breathing Zone */}
      <div className="h-[20vh]" aria-hidden="true" />

      {/* Timeline Section Header */}
      <div className="relative z-10 px-6 pb-10 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]">
            Timeline
          </h2>
          <p className="mt-2 text-[var(--text-base-60)]">
            深く掘るほど、根源に近づく
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative z-10">
        {experience.map((exp, index) => (
          <TimelineSection
            key={exp.id}
            exp={exp}
            index={index}
            total={experience.length}
            setRef={setTimelineRef}
          />
        ))}
      </div>

      {/* Breathing Zone */}
      <div className="h-[30vh]" aria-hidden="true" />
    </ProfileLayout>
  );
}
```

---

## 品質チェックリスト

```
構図:
□ Strength が非対称に配置されている（偶数左、奇数右）
□ Connector line で Strength 同士の繋がりが見える
□ Timeline の深さが視覚的に表現されている（Railの太さ、Ghostの濃さ）
□ 最深層に特別な演出（Origin Glow）がある

モーション:
□ 文字単位 reveal が description に適用されている
□ Achievements が左からワイプで reveal される
□ Ghost が「沈んでいく」parallax が機能している
□ back.out を使用していない（power3.out に置換）

技術:
□ 60fps 維持
□ will-change が適切に設定されている
□ backgroundPositionY を使用していない

禁止確認:
□ コミットを行っていない
□ back.out/bounce ease を使用していない
□ すべて中央配置になっていない
```
