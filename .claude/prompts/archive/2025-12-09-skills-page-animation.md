# Skills Page Animation Implementation

Haiku 4.5 向け実装プロンプト

---

## タスク概要

Skills ページを Server Component から Client Component に変換し、GSAP アニメーションシステムを導入する。
Awwwards / FWA / CSS Design Awards レベルの最高品質を目指す。

---

## 禁止事項

以下は絶対に行わないこと:

1. **コミットを行わない** - `git commit` は絶対に実行しない
2. **ビルド・リンター確認は不要** - 実行しない
3. **`back.out` ease の使用禁止** - bouncy な動きは安っぽく見えるため禁止
4. **固定px値のマージン禁止** - `em` / `rem` / `clamp()` を使用
5. **`backgroundPositionY` 禁止** - reflow を引き起こすため `transform` を使用

---

## 作成ファイル一覧

| ファイル | アクション |
|----------|----------|
| `apps/web/src/features/skills/SkillsClient.tsx` | 新規作成 |
| `apps/web/src/features/skills/SkillsSections.tsx` | 新規作成 |
| `apps/web/src/features/skills/index.ts` | 新規作成 |
| `apps/web/src/app/skills/page.tsx` | 変更 |

---

## ファイル1: SkillsClient.tsx

`apps/web/src/features/skills/SkillsClient.tsx` を以下の内容で新規作成:

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SkillsLayout,
  SkillsIntro,
  SkillsBackground,
  SkillSection,
} from "./SkillsSections";
import type { WorkItem } from "@/shared/data/portfolio";

// GSAP プラグイン登録（クライアントサイドのみ）
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * アニメーション設定
 * 各アニメーションのパラメータを一元管理
 */
const ANIMATION_CONFIG = {
  entry: {
    offsetY: 60,
    blur: 6,
    duration: 0.8,
  },
  ghost: {
    y: 40,
    scale: 0.95,
    opacity: 0.12,
    parallaxY: 50,
  },
  band: {
    duration: 0.85,
    ease: "expo.out",
  },
  tags: {
    y: 12,
    stagger: 0.06,
    ease: "power2.out",
  },
  rail: {
    duration: 0.9,
    ease: "expo.out",
  },
  gridLines: {
    duration: 0.8,
    ease: "power1.out",
  },
} as const;

interface SkillsClientProps {
  skills: WorkItem[];
}

export default function SkillsClient({ skills }: SkillsClientProps) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const triggerRefs = useRef<ScrollTrigger[]>([]);

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  }, []);

  /**
   * セクションアニメーションを設定
   */
  const setupSectionAnimation = useCallback((el: HTMLElement) => {
    const rail = el.querySelector<HTMLElement>(".rail");
    const ghost = el.querySelector<HTMLElement>(".ghost");
    const bandWrapper = el.querySelector<HTMLElement>(".band-wrapper");
    const bandText = el.querySelector<HTMLElement>(".band-text");
    const tags = el.querySelectorAll<HTMLElement>(".tag");
    const gridLines = el.querySelector<HTMLElement>(".grid-lines");
    const description = el.querySelector<HTMLElement>(".description");
    const metaItems = el.querySelectorAll<HTMLElement>(".meta-item");

    // --- エントリーアニメーション (once: true) ---
    const entryTl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 75%",
        end: "top 25%",
        once: true,
      },
    });

    // Rail: clipPath reveal（上から下へ）
    if (rail) {
      gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
      entryTl.to(rail, {
        clipPath: "inset(0 0 0% 0)",
        duration: ANIMATION_CONFIG.rail.duration,
        ease: ANIMATION_CONFIG.rail.ease,
      });
    }

    // Grid Lines: フェードイン
    if (gridLines) {
      gsap.set(gridLines, { opacity: 0 });
      entryTl.to(
        gridLines,
        {
          opacity: 0.1,
          duration: ANIMATION_CONFIG.gridLines.duration,
          ease: ANIMATION_CONFIG.gridLines.ease,
        },
        "<0.1"
      );
    }

    // Ghost: y移動 + scale + opacity
    if (ghost) {
      gsap.set(ghost, {
        y: ANIMATION_CONFIG.ghost.y,
        opacity: 0,
        scale: ANIMATION_CONFIG.ghost.scale,
      });
      entryTl.to(
        ghost,
        {
          y: 0,
          opacity: ANIMATION_CONFIG.ghost.opacity,
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
        },
        "<0.15"
      );
    }

    // Band: mask reveal（内側から横スライド）
    if (bandWrapper && bandText) {
      gsap.set(bandText, { x: "-105%", opacity: 0 });
      entryTl.to(
        bandText,
        {
          x: "0%",
          opacity: 1,
          duration: ANIMATION_CONFIG.band.duration,
          ease: ANIMATION_CONFIG.band.ease,
        },
        "-=0.5"
      );
    }

    // Meta items: y移動 + opacity + stagger
    if (metaItems.length > 0) {
      gsap.set(metaItems, { y: 16, opacity: 0 });
      entryTl.to(
        metaItems,
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: "power3.out", // back.out ではなく power3.out を使用
        },
        "-=0.4"
      );
    }

    // Description: y移動 + opacity
    if (description) {
      gsap.set(description, { y: 20, opacity: 0 });
      entryTl.to(
        description,
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power2.out",
        },
        "-=0.3"
      );
    }

    // Tags: y移動 + opacity + stagger
    if (tags.length > 0) {
      gsap.set(tags, { y: ANIMATION_CONFIG.tags.y, opacity: 0 });
      entryTl.to(
        tags,
        {
          y: 0,
          opacity: 1,
          stagger: ANIMATION_CONFIG.tags.stagger,
          duration: 0.4,
          ease: ANIMATION_CONFIG.tags.ease,
        },
        "-=0.3"
      );
    }

    // --- 継続的パララックス (scrub) ---
    const scrubTrigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.8,
      onUpdate: (self) => {
        const progress = self.progress;
        const centered = progress - 0.5;

        // Ghost: パララックス
        if (ghost) {
          ghost.style.transform = `translateY(${centered * ANIMATION_CONFIG.ghost.parallaxY}px) scale(${1 + centered * 0.02})`;
        }

        // Grid Lines: subtle drift
        if (gridLines) {
          gridLines.style.transform = `translateY(${progress * 25}px)`;
        }
      },
    });
    triggerRefs.current.push(scrubTrigger);
  }, []);

  useEffect(() => {
    // フォント読み込み完了を待ってアニメーション開始
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        for (const el of sectionRefs.current) {
          if (!el) continue;
          setupSectionAnimation(el);
        }
      });

      return () => {
        ctx.revert();
        for (const trigger of triggerRefs.current) {
          trigger.kill();
        }
        triggerRefs.current = [];
      };
    });
  }, [setupSectionAnimation]);

  return (
    <SkillsLayout>
      <SkillsBackground />
      <SkillsIntro />

      {/* Skill Sections */}
      <div className="relative z-10 flex flex-col gap-16 px-6 pb-24 sm:px-10">
        {skills.map((skill, idx) => (
          <SkillSection
            key={skill.id}
            skill={skill}
            index={idx}
            setRef={setRef}
          />
        ))}
      </div>
    </SkillsLayout>
  );
}
```

---

## ファイル2: SkillsSections.tsx

`apps/web/src/features/skills/SkillsSections.tsx` を以下の内容で新規作成:

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

interface SkillSectionProps {
  skill: WorkItem;
  index: number;
  setRef: (el: HTMLElement | null, index: number) => void;
}

/**
 * Ghost テキストを生成
 * skill.meta の先頭3文字を大文字で返す
 */
function getGhostText(meta: string): string {
  return meta.slice(0, 3).toUpperCase();
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
    <section className="relative z-10 px-6 pt-32 pb-16 sm:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Hybrid Skillset
          <span className="h-px w-12 bg-[var(--accent-amber1)]" />
        </div>
        <AnimatedHeading
          as="h1"
          className="text-[clamp(2.4rem,7vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--text-base)]"
        >
          Skills / One creator, multiple layers.
        </AnimatedHeading>
        <p className="max-w-3xl text-[clamp(1rem,1.2vw+0.5rem,1.25rem)] leading-relaxed text-[var(--text-muted)]">
          Works / Case Study に散らばっていた写真・映像・コード・モーションの役割を一本化。
          プロフィールのスキルセットを重ね、企画から実装まで単一視点で完結する「マルチスキル」を提示します。
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-base-70)]">
          {["Photo", "Film", "Code", "Interaction", "Motion", "Sound", "Identity"].map(
            (item) => (
              <span key={item} className="rounded-full bg-white/5 px-3 py-2">
                {item}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export function SkillSection({ skill, index, setRef }: SkillSectionProps) {
  return (
    <section
      ref={(el) => setRef(el, index)}
      className="skill-section relative isolate flex min-h-[78vh] items-center overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.02] shadow-[0_30px_140px_rgba(0,0,0,0.55)] sm:min-h-[82vh]"
    >
      {/* Photo layer */}
      {skill.media?.type === "image" && (
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${skill.media.src})` }}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(0,0,0,0.85),rgba(0,0,0,0.95))]" />
      <div
        className="absolute inset-0 -z-[8] mix-blend-screen opacity-35"
        style={{ background: skill.accent ?? "var(--accent-amber1)" }}
      />

      {/* Grid Lines */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-[6] opacity-0 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
          willChange: "transform, opacity",
        }}
      />

      {/* Ghost 背景テキスト */}
      <div
        className="ghost pointer-events-none absolute right-[-12%] top-[18%] -z-2 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
        style={{
          color: "rgba(255,255,255,0.12)",
          willChange: "transform, opacity",
        }}
      >
        {getGhostText(skill.meta)}
      </div>

      {/* Side rail */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-center sm:w-16 md:w-20">
        {/* Rail（clipPath reveal対象） */}
        <div
          className="rail absolute inset-y-0 right-0 w-px bg-white/20"
          style={{ clipPath: "inset(0 0 100% 0)" }}
        />
        <div className="-rotate-90 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-60)]">
          Skillset Posters
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 ml-[var(--rail-margin-sm,4.2rem)] flex w-full flex-col gap-10 px-5 py-10 sm:ml-[var(--rail-margin-md,5.5rem)] sm:px-10 md:ml-[var(--rail-margin-lg,6.5rem)] md:py-12 lg:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="meta-item inline-flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ backgroundColor: BAND_BG, color: "#0b0b0b" }}
            >
              {skill.meta}
              <span className="text-[10px] text-[#0f0f0f]/70">
                {String(index + 1).padStart(2, "0")}
              </span>
            </span>
            <span
              className="meta-item h-px w-14"
              style={{ backgroundColor: skill.accent ?? "var(--accent-amber1)" }}
            />
            <span className="meta-item font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
              since_2011 — ongoing
            </span>
          </div>
          <span className="meta-item font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-base-70)]">
            Photo × Code × Motion
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.05fr,1.4fr] md:items-start">
          <div className="space-y-4">
            {/* Band Title（mask-reveal対象） */}
            <div
              className="band-wrapper overflow-hidden"
              style={{ display: "inline-block" }}
            >
              <h2
                className="band-text inline-block text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-black"
                style={{
                  backgroundColor: BAND_BG,
                  padding: "0.32em 0.5em",
                  boxShadow: "12px 12px 0 #0b0b0b",
                }}
              >
                {skill.title}
              </h2>
            </div>
            <p className="description max-w-3xl text-[clamp(1rem,1.2vw+0.5rem,1.25rem)] leading-relaxed text-[var(--text-base-80)]">
              {skill.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-base-80)]">
              <span className="rounded-full border border-white/22 bg-white/12 px-4 py-2 font-semibold">
                {skill.role}
              </span>
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-2 font-mono uppercase tracking-[0.16em] text-[var(--text-base-70)]">
                Profile Integration
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm text-[var(--text-base-70)]">
              <span className="inline-block h-[1px] w-6 bg-white/30" />
              <span className="font-mono uppercase tracking-[0.18em]">
                Roles / Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {skill.tags?.map((tag) => (
                <span
                  key={`${skill.id}-${tag}`}
                  className="tag rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[12px] font-medium text-[var(--text-base-80)]"
                  style={{ transformOrigin: "center bottom" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Worksのポスター感を活かしつつ、Profileで定義したロール/タグを重ねたマルチスキルの断面。撮影・実装・運用を一つのレイヤーで握ります。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## ファイル3: index.ts

`apps/web/src/features/skills/index.ts` を以下の内容で新規作成:

```tsx
export { default as SkillsClient } from "./SkillsClient";
export * from "./SkillsSections";
```

---

## ファイル4: page.tsx の変更

`apps/web/src/app/skills/page.tsx` を以下の内容に変更:

```tsx
import { SkillsClient } from "@/features/skills";
import { portfolioData } from "@/shared/data/portfolio";

export default function SkillsPage() {
  return <SkillsClient skills={portfolioData.skills.items} />;
}
```

---

## 品質チェックリスト

実装完了後、以下を確認:

- [ ] 60fps 維持（Chrome DevTools Performance タブで確認）
- [ ] ease は `power2.out`, `power3.out`, `expo.out` のみ使用
- [ ] Ghost opacity は 0.12
- [ ] レスポンシブマージンに CSS 変数を使用
- [ ] `will-change: transform, opacity` が animated elements に設定済み
- [ ] `backgroundPositionY` を使用していない（`transform` を使用）
- [ ] **コミットを行っていない**

---

## 注意事項

- このプロンプトは Haiku 4.5 での実装を前提としている
- 既存の Profile ページの実装パターンを参考にしているが、改善を加えている
- ease 関数は一貫性のため `power2.out`, `power3.out`, `expo.out` のみ使用
- `back.out` は使用禁止（bouncy な動きは避ける）
