"use client";

import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAPプラグイン登録（クライアントサイドのみ）
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Profile ページ - Unified Premium Animation (UX Improved)
 *
 * UX改善:
 * - 全要素は最初から薄く表示（opacity: 0.2〜0.3）
 * - スクロールで完全表示へアニメーション
 * - 内容が見えない状態を作らない
 *
 * 統一されたアニメーション設計:
 * - 2層構造: エントリー（once）+ 継続的パララックス（scrub）
 * - 統一表現: transform + opacity のみ（clipPath廃止）
 * - 差分は「強度」のみ: Strengths=subtle, Timeline=pronounced
 */

const profile = portfolioData.pages.profile;
const BASE_BG = "#0b0b0b";
const BAND_BG = "#f2f2f2";

/**
 * 初期表示の透明度（薄く見える状態）
 */
const INITIAL_OPACITY = {
  content: 0.25,      // メタ/タグ/説明文の初期透明度
  ghost: 0.015,       // ゴーストの初期透明度
  rail: 0.08,         // レールの初期透明度
  band: 0.2,          // 帯の初期透明度
  grid: 0.03,         // グリッドの初期透明度
} as const;

/**
 * アニメーション強度の設定
 * Strengths: subtle（控えめ）
 * Timeline: pronounced（やや強め）
 */
const ANIMATION_CONFIG = {
  strengths: {
    rail: { duration: 0.85 },
    ghost: { y: 30, scale: 0.95, targetOpacity: 0.06, parallaxY: 60 },
    band: { x: -20, duration: 0.9 },
    meta: { y: 12, stagger: 0.1 },
    tag: { y: 6, stagger: 0.04 },
    description: { y: 15 },
  },
  timeline: {
    rail: { duration: 1.0 },
    ghost: { y: 45, scale: 0.92, targetOpacity: 0.07, parallaxY: 100 },
    band: { x: -25, duration: 1.0 },
    meta: { y: 15, stagger: 0.08 },
    tag: { y: 8, stagger: 0.05 },
    description: { y: 18 },
  },
} as const;

export default function ProfilePage() {
  const strengths = profile.strengths;
  const experiences = profile.experience;

  // セクション要素のref配列
  const strengthSectionRefs = useRef<(HTMLElement | null)[]>([]);
  const timelineSectionRefs = useRef<(HTMLElement | null)[]>([]);

  /**
   * Strength セクションの ref を設定するコールバック
   */
  const setStrengthRef = useCallback(
    (el: HTMLElement | null, index: number) => {
      strengthSectionRefs.current[index] = el;
    },
    []
  );

  /**
   * Timeline セクションの ref を設定するコールバック
   */
  const setTimelineRef = useCallback(
    (el: HTMLElement | null, index: number) => {
      timelineSectionRefs.current[index] = el;
    },
    []
  );

  /**
   * 共通アニメーションを設定するユーティリティ関数
   * 初期状態は薄く表示、アニメーションで完全表示へ
   */
  const setupSectionAnimation = useCallback(
    (
      el: HTMLElement,
      config: (typeof ANIMATION_CONFIG)["strengths" | "timeline"],
      isTimeline: boolean = false
    ) => {
      const rail = el.querySelector<HTMLElement>(".rail");
      const ghost = el.querySelector<HTMLElement>(".ghost");
      const bandWrapper = el.querySelector<HTMLElement>(".band-wrapper");
      const bandText = el.querySelector<HTMLElement>(".band-text");
      const metaItems = el.querySelectorAll<HTMLElement>(".meta-item");
      const tags = el.querySelectorAll<HTMLElement>(".tag");
      const gridLines = el.querySelector<HTMLElement>(".grid-lines");
      const description = el.querySelector<HTMLElement>(".description");
      const achievements = el.querySelectorAll<HTMLElement>(".achievement-item");

      // --- 初期状態: 薄く表示（内容は見える） ---

      // レール: 短い状態から開始（scaleYで）
      if (rail) {
        gsap.set(rail, {
          scaleY: 0.2,
          opacity: INITIAL_OPACITY.rail,
          transformOrigin: "top",
        });
      }

      // グリッドライン: 薄く表示
      if (gridLines) {
        gsap.set(gridLines, { opacity: INITIAL_OPACITY.grid });
      }

      // ゴースト: 薄く見える状態
      if (ghost) {
        gsap.set(ghost, {
          y: config.ghost.y,
          opacity: INITIAL_OPACITY.ghost,
          scale: config.ghost.scale,
        });
      }

      // 帯: 少しずれた位置で薄く表示
      if (bandWrapper && bandText) {
        gsap.set(bandText, {
          x: config.band.x,
          opacity: INITIAL_OPACITY.band,
        });
      }

      // メタ行: 薄く表示
      if (metaItems.length > 0) {
        gsap.set(metaItems, {
          y: config.meta.y,
          opacity: INITIAL_OPACITY.content,
        });
      }

      // 説明文: 薄く表示
      if (description) {
        gsap.set(description, {
          y: config.description.y,
          opacity: INITIAL_OPACITY.content,
        });
      }

      // 実績リスト: 薄く表示
      if (achievements.length > 0) {
        gsap.set(achievements, {
          y: 8,
          opacity: INITIAL_OPACITY.content,
        });
      }

      // タグ: 薄く表示
      if (tags.length > 0) {
        gsap.set(tags, {
          y: config.tag.y,
          opacity: INITIAL_OPACITY.content,
        });
      }

      // --- エントリーアニメーション: 完全表示へ (once) ---
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "top 30%",
          once: true,
        },
      });

      // レール: 完全に伸びる + 完全表示
      if (rail) {
        entryTl.to(rail, {
          scaleY: 1,
          opacity: 1,
          duration: config.rail.duration,
          ease: "expo.out",
        });
      }

      // グリッドライン: 完全表示
      if (gridLines) {
        entryTl.to(
          gridLines,
          {
            opacity: 0.1,
            duration: 1.0,
            ease: "power1.out",
          },
          "<0.1"
        );
      }

      // ゴースト: 定位置 + 目標透明度へ
      if (ghost) {
        entryTl.to(
          ghost,
          {
            y: 0,
            opacity: config.ghost.targetOpacity,
            scale: 1,
            duration: 1.0,
            ease: "power3.out",
          },
          "<0.1"
        );
      }

      // 帯: 定位置 + 完全表示
      if (bandWrapper && bandText) {
        entryTl.to(
          bandText,
          {
            x: 0,
            opacity: 1,
            duration: config.band.duration,
            ease: "expo.out",
          },
          "-=0.5"
        );
      }

      // メタ行: 定位置 + 完全表示
      if (metaItems.length > 0) {
        entryTl.to(
          metaItems,
          {
            y: 0,
            opacity: 1,
            stagger: config.meta.stagger,
            duration: 0.5,
            ease: "back.out(1.4)",
          },
          "-=0.4"
        );
      }

      // 説明文: 定位置 + 完全表示
      if (description) {
        entryTl.to(
          description,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.3"
        );
      }

      // 実績リスト: 定位置 + 完全表示
      if (isTimeline && achievements.length > 0) {
        entryTl.to(
          achievements,
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.45,
            ease: "power2.out",
          },
          "-=0.25"
        );
      }

      // タグ: 定位置 + 完全表示
      if (tags.length > 0) {
        entryTl.to(
          tags,
          {
            y: 0,
            opacity: 1,
            stagger: config.tag.stagger,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.3"
        );
      }

      // --- 継続的パララックス (scrub) ---
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
        onUpdate: (self) => {
          const progress = self.progress;
          const centered = progress - 0.5;

          // ゴースト: パララックス
          if (ghost) {
            gsap.set(ghost, {
              y: centered * config.ghost.parallaxY,
              scale: 1 + centered * 0.02,
            });
          }

          // グリッドライン: subtle drift
          if (gridLines) {
            gsap.set(gridLines, {
              backgroundPositionY: `${progress * 25}px`,
            });
          }
        },
      });
    },
    []
  );

  useEffect(() => {
    // フォント読み込み完了を待ってアニメーション開始
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        // Strengths セクション
        strengthSectionRefs.current.forEach((el) => {
          if (!el) return;
          setupSectionAnimation(el, ANIMATION_CONFIG.strengths, false);
        });

        // Timeline セクション
        timelineSectionRefs.current.forEach((el) => {
          if (!el) return;
          setupSectionAnimation(el, ANIMATION_CONFIG.timeline, true);
        });
      });

      // クリーンアップ
      return () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    });
  }, [setupSectionAnimation]);

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      {/* Worksと同様のFluid背景 + 黒乗算 */}
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

      {/* Intro */}
      <section className="relative z-10 flex min-h-[60vh] items-center justify-center px-6 py-24">
        <div className="max-w-4xl text-center">
          <AnimatedHeading
            as="h1"
            className="mb-4 text-[clamp(2.5rem,8vw,4.5rem)] font-semibold tracking-[-0.03em] text-[var(--text-base)]"
          >
            Experience & Skills
          </AnimatedHeading>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-[var(--text-muted)]">
            デザイン・コード・映像を一人で統合し、意図通りのアウトプットを作る。
          </p>
        </div>
      </section>

      {/* Strengths - Unified Animation */}
      <div className="relative z-10 flex flex-col">
        {strengths.map((strength, idx) => (
          <section
            key={strength.id}
            ref={(el) => setStrengthRef(el, idx)}
            className="strength-section relative isolate flex min-h-[70vh] items-center overflow-hidden px-8 py-16 sm:px-12 md:px-16 lg:px-20"
          >
            {/* 背景グラデーション */}
            <div className="absolute inset-0 -z-5 bg-[linear-gradient(180deg,rgba(0,0,0,0.66),rgba(0,0,0,0.9))]" />

            {/* グリッドライン */}
            <div
              className="grid-lines pointer-events-none absolute inset-0 -z-4 mix-blend-soft-light"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "120px 120px",
              }}
            />

            {/* 境界線 */}
            <div className="pointer-events-none absolute inset-6 -z-3 border border-white/8" />

            {/* ゴースト「STR」 */}
            <div
              className="ghost pointer-events-none absolute right-[-12%] top-[18%] -z-2 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
              style={{ color: "rgba(255,255,255,0.06)" }}
            >
              STR
            </div>

            {/* 左レール（細線） */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16 md:w-20">
              <div className="rail absolute inset-y-0 right-0 w-px bg-white/20" />
              <div className="-rotate-90 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-50)]">
                Profile
              </div>
            </div>

            {/* コンテンツ */}
            <div className="relative z-10 ml-[4.2rem] flex w-full flex-col gap-10 sm:ml-[5.5rem] md:ml-[6.5rem]">
              {/* メタ行 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[var(--text-base-70)]">
                  <span className="meta-item font-mono text-xs uppercase tracking-[0.22em]">
                    since_2011
                  </span>
                  <span className="meta-item h-px w-12 bg-[var(--text-base-30)]" />
                  <span className="meta-item text-xs font-semibold uppercase tracking-[0.18em]">
                    Strength
                  </span>
                </div>
                <span className="meta-item font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-base-60)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              {/* タイトル帯と説明 */}
              <div className="flex flex-col gap-6">
                <div className="relative inline-block">
                  <div className="meta-item absolute -left-5 top-1/2 h-[1px] w-10 bg-[var(--text-base-20)]" />
                  {/* 帯ラッパー（mask reveal用） */}
                  <div className="band-wrapper inline-block overflow-hidden">
                    <div
                      className="band-text text-[clamp(2.4rem,7vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                      style={{
                        backgroundColor: BAND_BG,
                        display: "inline-block",
                        padding: "0.24em 0.54em",
                      }}
                    >
                      {strength.title}
                    </div>
                  </div>
                </div>
                <p className="description max-w-4xl text-[20px] leading-relaxed text-[var(--text-base-80)]">
                  {strength.description}
                </p>
              </div>

              {/* タグ */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-base-80)]">
                {strength.keywords.map((tag) => (
                  <span
                    key={`${strength.id}-${tag}`}
                    className="tag border border-white/14 bg-white/8 px-3 py-1 uppercase tracking-[0.12em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Experience as Posters - Unified Animation */}
      <div className="relative z-10 flex flex-col">
        {experiences.map((exp, idx) => (
          <section
            key={exp.id}
            ref={(el) => setTimelineRef(el, idx)}
            className="timeline-section relative isolate flex min-h-[80vh] items-center overflow-hidden px-8 py-16 sm:px-12 md:px-16 lg:px-20"
          >
            {/* 背景グラデーション（ラジアル＋リニア） */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_32%),linear-gradient(185deg,rgba(0,0,0,0.75),rgba(0,0,0,0.95))]" />

            {/* グリッドライン */}
            <div
              className="grid-lines pointer-events-none absolute inset-0 -z-9 mix-blend-soft-light"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "120px 120px",
              }}
            />

            {/* 年号ゴースト */}
            <div
              className="ghost pointer-events-none absolute right-[-14%] top-[20%] -z-8 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
              style={{ color: "rgba(255,255,255,0.07)" }}
            >
              {exp.period.split(" - ")[0]}
            </div>

            {/* 左レール（太線） */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-center sm:w-22 md:w-24">
              <div className="rail absolute inset-y-0 right-0 w-[3px] bg-white/20" />
              <div className="-rotate-90 text-[12px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-60)]">
                Timeline
              </div>
            </div>

            {/* コンテンツ */}
            <div className="relative z-10 ml-[5.2rem] flex w-full flex-col gap-12 sm:ml-[6.4rem] md:ml-[7.6rem]">
              {/* メタ行 */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2 text-[var(--text-base-80)]">
                  <span className="meta-item text-[17px] italic tracking-[0.08em] text-[var(--text-base-70)]">
                    {exp.period}
                  </span>
                  <span className="meta-item inline-block bg-black/16 px-3 py-1 text-[28px] font-semibold leading-none tracking-tight text-black">
                    {exp.type}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-base-70)]">
                    <span className="meta-item font-mono uppercase tracking-[0.2em] text-[var(--accent-amber1)]">
                      Role
                    </span>
                    {exp.teamSize && (
                      <span className="meta-item border border-white/15 bg-white/8 px-3 py-1 text-[var(--text-base-70)]">
                        {exp.teamSize}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="meta-item text-[32px] font-black uppercase tracking-[-0.04em] text-white/14">
                    {exp.period.split(" - ")[0]}
                  </span>
                  <div className="meta-item bg-[var(--text-base)] px-3 py-1 text-sm font-semibold text-[var(--bg-base)] shadow-[14px_14px_0_rgba(0,0,0,0.65)]">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* タイトル帯と説明 */}
              <div className="flex flex-col gap-5">
                <div className="relative inline-block">
                  {/* 帯ラッパー（mask reveal用） */}
                  <div className="band-wrapper inline-block overflow-hidden">
                    <div
                      className="band-text text-[clamp(2.2rem,7vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                      style={{
                        backgroundColor: BAND_BG,
                        display: "inline-block",
                        padding: "0.24em 0.5em",
                        boxShadow: "18px 18px 0 rgba(0,0,0,0.9)",
                      }}
                    >
                      {exp.role}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr] md:items-start">
                  <p className="description text-[20px] leading-relaxed text-[var(--text-base-80)]">
                    {exp.description}
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--text-base-70)]">
                    {exp.achievements.map((achievement, i) => (
                      <li
                        key={i}
                        className="achievement-item flex items-start gap-2"
                      >
                        <span className="mt-2 h-1 w-6 flex-shrink-0 bg-[var(--accent-amber1)]/80" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* タグ */}
              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-base-80)]">
                {exp.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="tag border border-white/15 bg-white/10 px-3 py-1"
                  >
                    {tech}
                  </span>
                ))}
                {exp.teamSize && (
                  <span className="tag border border-white/15 bg-white/6 px-3 py-1 text-[var(--text-base-60)]">
                    {exp.teamSize}
                  </span>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
