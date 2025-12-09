# Skills Page Redesign Implementation

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

このページは「スキルの一覧」ではなく「統合された能力の体験」。

```
Core Concept: 「水面下の氷山」
- 見えている部分（Title）は一部
- 本当の広がりは探索して初めてわかる
- スキル同士が水面下でつながっている

Motion Personality: 「静かな確信」
- 急がない（慌てていない = 自信）
- 過剰に主張しない（品格）
- しかし存在感がある（力強さ）
```

---

## ファイル構成

```
apps/web/src/features/skills/
├── SkillsClient.tsx       # メインクライアント（GSAP管理）
├── SkillsSections.tsx     # セクションコンポーネント
├── SkillsAnimations.ts    # アニメーション設定・関数
└── index.ts               # バレルエクスポート
```

---

## ファイル1: SkillsAnimations.ts

`apps/web/src/features/skills/SkillsAnimations.ts` を新規作成:

```typescript
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * アニメーション設定
 * 「静かな確信」を表現するためのパラメータ
 */
export const ANIMATION_CONFIG = {
  // Entry Animation（セクション出現時）
  entry: {
    ghost: {
      initialY: 80,
      initialBlur: 12,
      initialScale: 1.1,
      finalOpacity: 0.15,
      duration: 1.2,
      ease: "expo.out",
    },
    rail: {
      duration: 1.0,
      ease: "expo.out",
    },
    title: {
      initialX: "-120%",
      shadowDelay: 0.3, // タイトル後に影が追従
      duration: 0.9,
      ease: "expo.out",
    },
    description: {
      charStagger: 0.008, // 文字単位reveal
      charBlur: 4,
      duration: 0.6,
      ease: "power2.out",
    },
    tags: {
      initialY: 20,
      stagger: 0.08,
      duration: 0.4,
      ease: "power3.out",
    },
    image: {
      clipDuration: 1.0,
      ease: "expo.out",
    },
  },

  // Parallax（スクロール連動）
  parallax: {
    ghost: {
      speed: 0.6,
      scaleRange: 0.1, // 1.0 → 0.9
      opacityRange: 0.07, // 0.15 → 0.08
    },
    content: {
      speed: 0.1,
    },
    accent: {
      speed: 0.3,
    },
    background: {
      speed: 1.2, // オーバースクロール
    },
  },

  // Transition（セクション間）
  transition: {
    breathingZone: "30vh", // セクション間の余白
    fadeOutDuration: 0.4,
    fadeInDelay: 0.2,
  },

  // Micro-interactions
  micro: {
    tagHover: {
      scale: 1.05,
      y: -3,
      duration: 0.2,
      ease: "power2.out",
    },
    imageHover: {
      scale: 1.02,
      brightness: 1.1,
      duration: 0.3,
    },
  },
} as const;

/**
 * セクションのエントリーアニメーションを設定
 */
export function setupSectionEntry(
  el: HTMLElement,
  index: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.entry;

  // 要素取得
  const ghost = el.querySelector<HTMLElement>(".ghost");
  const rail = el.querySelector<HTMLElement>(".rail");
  const titleBand = el.querySelector<HTMLElement>(".title-band");
  const titleShadow = el.querySelector<HTMLElement>(".title-shadow");
  const description = el.querySelector<HTMLElement>(".description");
  const tags = el.querySelectorAll<HTMLElement>(".tag");
  const image = el.querySelector<HTMLElement>(".skill-image");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  // タイムライン作成
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 75%",
      end: "top 25%",
      once: true,
    },
  });

  // T+0.0s: Background subtle shift
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.08, duration: 0.8, ease: "power1.out" });
  }

  // T+0.3s: Ghost Text - 深淵から浮かび上がる
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
      0.3
    );
  }

  // T+0.6s: Rail - 上から下へ reveal
  if (rail) {
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: config.rail.duration,
        ease: config.rail.ease,
      },
      0.6
    );
  }

  // T+0.9s: Title Band - 左からスライド
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
      0.9
    );

    // 影の追従（タイトル後）
    if (titleShadow) {
      gsap.set(titleShadow, { opacity: 0, x: -10, y: -10 });
      tl.to(
        titleShadow,
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        1.2
      );
    }
  }

  // T+1.2s: Description - 文字単位でタイプライター的reveal
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
      1.2
    );
  }

  // T+1.8s: Tags - ピアノの鍵盤を叩くようにstagger
  if (tags.length > 0) {
    gsap.set(tags, { y: config.tags.initialY, opacity: 0 });
    tl.to(
      tags,
      {
        y: 0,
        opacity: 1,
        stagger: config.tags.stagger,
        duration: config.tags.duration,
        ease: config.tags.ease,
      },
      1.8
    );
  }

  // T+2.2s: Image - circle mask reveal
  if (image) {
    gsap.set(image, { clipPath: "circle(0% at 50% 50%)" });
    tl.to(
      image,
      {
        clipPath: "circle(100% at 50% 50%)",
        duration: config.image.clipDuration,
        ease: config.image.ease,
      },
      2.2
    );
  }

  return tl;
}

/**
 * Multi-layer Parallax を設定
 */
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
    scrub: 0.8,
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5; // -0.5 ~ 0.5

      // Ghost: 沈んでいく感覚
      if (ghost) {
        const y = centered * config.ghost.speed * 100;
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange;
        const opacity =
          config.ghost.speed - Math.abs(centered) * config.ghost.opacityRange;
        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.05, opacity));
      }

      // Content: 微細な追従
      if (content) {
        const y = centered * config.content.speed * 50;
        content.style.transform = `translateY(${y}px)`;
      }

      // Accents: 中程度の追従
      for (const accent of accents) {
        const y = centered * config.accent.speed * 80;
        accent.style.transform = `translateY(${y}px)`;
      }

      // Grid Lines: オーバースクロール
      if (gridLines) {
        const y = progress * config.background.speed * 40;
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
```

---

## ファイル2: SkillsSections.tsx

`apps/web/src/features/skills/SkillsSections.tsx` を新規作成:

```tsx
import { AnimatedHeading } from "@/shared/components";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import type { WorkItem } from "@/shared/data/portfolio";
import { ReactNode } from "react";

const BASE_BG = "#0b0b0b";
const BAND_BG = "#f2f2f2";

// 構図パターン: A=右重心, B=左重心, C=中央緊張
type LayoutPattern = "A" | "B" | "C";

function getLayoutPattern(index: number): LayoutPattern {
  const patterns: LayoutPattern[] = ["A", "B", "C"];
  return patterns[index % 3];
}

interface SkillSectionProps {
  skill: WorkItem;
  index: number;
  setRef: (el: HTMLElement | null, index: number) => void;
}

export function SkillsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      {children}
    </main>
  );
}

export function SkillsBackground() {
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

export function SkillsIntro() {
  return (
    <section className="relative z-10 flex min-h-[70vh] items-end px-6 pb-24 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1fr,1.5fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Hybrid Skillset
              <span className="h-px w-12 bg-[var(--accent-amber1)]" />
            </div>
            <AnimatedHeading
              as="h1"
              className="text-[clamp(2.8rem,8vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--text-base)]"
            >
              Skills
            </AnimatedHeading>
          </div>
          <div className="flex flex-col justify-end">
            <p className="max-w-xl text-[clamp(1.1rem,1.5vw,1.4rem)] leading-relaxed text-[var(--text-base-80)]">
              写真・映像・コード・モーション。
              <br />
              <span className="text-[var(--text-base-60)]">
                すべてが一人の視点で繋がるとき、翻訳ロスは消え、意図だけが残る。
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SkillSection({ skill, index, setRef }: SkillSectionProps) {
  const pattern = getLayoutPattern(index);

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="skill-section relative isolate min-h-screen overflow-visible px-6 py-24 sm:px-10"
      data-pattern={pattern}
    >
      {/* Grid Lines (背景レイヤー) */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-[6] mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Ghost Text - フルワード、はみ出し */}
      <div
        className="ghost pointer-events-none absolute -z-2 select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em]"
        style={{
          fontSize: "clamp(10rem, 25vw, 20rem)",
          color: "rgba(255,255,255,0.15)",
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          ...(pattern === "A"
            ? { right: "-15%", top: "10%" }
            : pattern === "B"
              ? { left: "-15%", top: "15%" }
              : { left: "50%", top: "5%", transform: "translateX(-50%)" }),
        }}
      >
        {skill.meta.split(" ")[0].toUpperCase()}
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-7xl">
        {pattern === "A" && (
          <PatternA skill={skill} index={index} />
        )}
        {pattern === "B" && (
          <PatternB skill={skill} index={index} />
        )}
        {pattern === "C" && (
          <PatternC skill={skill} index={index} />
        )}
      </div>

      {/* Rail */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16">
        <div
          className="rail absolute inset-y-24 right-0 w-px bg-white/20"
          style={{ clipPath: "inset(0 0 100% 0)" }}
        />
        <div className="-rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-40)]">
          {`Skill ${String(index + 1).padStart(2, "0")}`}
        </div>
      </div>
    </section>
  );
}

// Pattern A: 右重心
function PatternA({ skill, index }: { skill: WorkItem; index: number }) {
  return (
    <div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1.2fr,1fr]">
      {/* Left: Content */}
      <div className="skill-content flex flex-col gap-8">
        <div className="space-y-4">
          {/* Meta line */}
          <div className="accent-element flex items-center gap-4 text-[var(--text-base-60)]">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {skill.meta}
            </span>
            <span
              className="h-px w-16"
              style={{ backgroundColor: skill.accent ?? "var(--accent-amber1)" }}
            />
            <span className="text-xs">Since 2011</span>
          </div>

          {/* Title */}
          <div className="relative">
            <div
              className="title-shadow absolute inset-0 translate-x-3 translate-y-3 bg-black/60"
              style={{ opacity: 0 }}
            />
            <h2
              className="title-band relative inline-block text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
              style={{
                backgroundColor: BAND_BG,
                padding: "0.3em 0.5em",
              }}
            >
              {skill.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="description max-w-lg text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[var(--text-base-80)]">
          {skill.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-3">
          {skill.tags?.map((tag) => (
            <span
              key={`${skill.id}-${tag}`}
              className="tag rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[13px] font-medium text-[var(--text-base-70)] transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Image */}
      {skill.media?.type === "image" && (
        <div className="skill-image relative aspect-[4/5] overflow-hidden rounded-2xl">
          <img
            src={skill.media.src}
            alt={skill.media.alt ?? skill.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute bottom-4 left-4 rounded bg-black/70 px-3 py-1 text-xs font-mono uppercase tracking-wider text-white/80">
            {skill.role}
          </div>
        </div>
      )}
    </div>
  );
}

// Pattern B: 左重心
function PatternB({ skill, index }: { skill: WorkItem; index: number }) {
  return (
    <div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1fr,1.2fr]">
      {/* Left: Image */}
      {skill.media?.type === "image" && (
        <div className="skill-image relative aspect-[4/5] overflow-hidden rounded-2xl">
          <img
            src={skill.media.src}
            alt={skill.media.alt ?? skill.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute bottom-4 right-4 rounded bg-black/70 px-3 py-1 text-xs font-mono uppercase tracking-wider text-white/80">
            {skill.role}
          </div>
        </div>
      )}

      {/* Right: Content */}
      <div className="skill-content flex flex-col gap-8">
        <div className="space-y-4">
          {/* Meta line */}
          <div className="accent-element flex items-center justify-end gap-4 text-[var(--text-base-60)]">
            <span className="text-xs">Since 2011</span>
            <span
              className="h-px w-16"
              style={{ backgroundColor: skill.accent ?? "var(--accent-amber1)" }}
            />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {skill.meta}
            </span>
          </div>

          {/* Title */}
          <div className="relative text-right">
            <div
              className="title-shadow absolute inset-0 -translate-x-3 translate-y-3 bg-black/60"
              style={{ opacity: 0 }}
            />
            <h2
              className="title-band relative inline-block text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
              style={{
                backgroundColor: BAND_BG,
                padding: "0.3em 0.5em",
              }}
            >
              {skill.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="description max-w-lg text-right text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[var(--text-base-80)] md:ml-auto">
          {skill.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap justify-end gap-3">
          {skill.tags?.map((tag) => (
            <span
              key={`${skill.id}-${tag}`}
              className="tag rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[13px] font-medium text-[var(--text-base-70)] transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pattern C: 中央緊張
function PatternC({ skill, index }: { skill: WorkItem; index: number }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-12">
      {/* Title (Center) */}
      <div className="relative text-center">
        <div
          className="title-shadow absolute inset-0 translate-y-4 bg-black/60"
          style={{ opacity: 0 }}
        />
        <h2
          className="title-band relative inline-block text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
          style={{
            backgroundColor: BAND_BG,
            padding: "0.3em 0.6em",
          }}
        >
          {skill.title}
        </h2>
      </div>

      {/* Content Grid */}
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr,1.5fr]">
        {/* Left: Image */}
        {skill.media?.type === "image" && (
          <div className="skill-image relative aspect-square overflow-hidden rounded-2xl">
            <img
              src={skill.media.src}
              alt={skill.media.alt ?? skill.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}

        {/* Right: Description + Tags */}
        <div className="skill-content flex flex-col justify-center gap-6">
          {/* Meta */}
          <div className="accent-element flex items-center gap-4 text-[var(--text-base-60)]">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {skill.meta}
            </span>
            <span
              className="h-px flex-1"
              style={{ backgroundColor: skill.accent ?? "var(--accent-amber1)" }}
            />
          </div>

          {/* Description */}
          <p className="description text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[var(--text-base-80)]">
            {skill.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {skill.tags?.map((tag) => (
              <span
                key={`${skill.id}-${tag}`}
                className="tag rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[13px] font-medium text-[var(--text-base-70)] transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ファイル3: SkillsClient.tsx

`apps/web/src/features/skills/SkillsClient.tsx` を新規作成:

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SkillsLayout,
  SkillsBackground,
  SkillsIntro,
  SkillSection,
} from "./SkillsSections";
import { setupSectionEntry, setupParallax } from "./SkillsAnimations";
import type { WorkItem } from "@/shared/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SkillsClientProps {
  skills: WorkItem[];
}

export default function SkillsClient({ skills }: SkillsClientProps) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  }, []);

  useEffect(() => {
    // フォント読み込み完了を待つ
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        for (const [index, el] of sectionRefs.current.entries()) {
          if (!el) continue;

          // Entry animation
          setupSectionEntry(el, index);

          // Parallax
          const trigger = setupParallax(el);
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
  }, []);

  return (
    <SkillsLayout>
      <SkillsBackground />
      <SkillsIntro />

      {/* Breathing Zone before sections */}
      <div className="h-[20vh]" aria-hidden="true" />

      {/* Skill Sections */}
      {skills.map((skill, idx) => (
        <SkillSection
          key={skill.id}
          skill={skill}
          index={idx}
          setRef={setRef}
        />
      ))}

      {/* Breathing Zone after sections */}
      <div className="h-[30vh]" aria-hidden="true" />
    </SkillsLayout>
  );
}
```

---

## ファイル4: index.ts

```typescript
export { default as SkillsClient } from "./SkillsClient";
export * from "./SkillsSections";
```

---

## ファイル5: page.tsx 変更

`apps/web/src/app/skills/page.tsx` を変更:

```tsx
import { SkillsClient } from "@/features/skills";
import { portfolioData } from "@/shared/data/portfolio";

export default function SkillsPage() {
  return <SkillsClient skills={portfolioData.skills.items} />;
}
```

---

## 品質チェックリスト

```
構図:
□ セクションごとに構図パターンが変わっている（A/B/Cローテーション）
□ Ghost Text がはみ出して緊張を作っている
□ 余白が「深淵」として機能している

モーション:
□ Entry animation が振り付けされている（順序に意味がある）
□ Ghost が「沈んでいく」parallax が機能している
□ 文字単位の reveal が description に適用されている

技術:
□ 60fps 維持
□ will-change が適切に設定されている
□ backgroundPositionY を使用していない

禁止確認:
□ コミットを行っていない
□ back.out/bounce ease を使用していない
□ すべて中央配置になっていない
```
