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

// GSAPプラグイン登録（クライアントサイドのみ）
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * アニメーション強度の設定
 * Strengths: subtle（控えめ）
 * Timeline: pronounced（やや強め）
 */
const ANIMATION_CONFIG = {
  strengths: {
    rail: { duration: 0.85 },
    ghost: { y: 50, scale: 0.9, opacity: 0.06, parallaxY: 60 },
    band: { duration: 0.9 },
    meta: { y: 16, stagger: 0.1 },
    tag: { y: 8, stagger: 0.04 },
    description: { y: 20 },
  },
  timeline: {
    rail: { duration: 1.0 },
    ghost: { y: 70, scale: 0.85, opacity: 0.07, parallaxY: 100 },
    band: { duration: 1.0 },
    meta: { y: 20, stagger: 0.08 },
    tag: { y: 10, stagger: 0.05 },
    description: { y: 25 },
  },
} as const;

interface ProfileClientProps {
  profile: {
    strengths: Strength[];
    experience: Experience[];
  };
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const strengths = profile.strengths;
  const experiences = profile.experience;

  const strengthSectionRefs = useRef<(HTMLElement | null)[]>([]);
  const timelineSectionRefs = useRef<(HTMLElement | null)[]>([]);
  const triggerRefs = useRef<ScrollTrigger[]>([]);

  const setStrengthRef = useCallback((el: HTMLElement | null, index: number) => {
    strengthSectionRefs.current[index] = el;
  }, []);

  const setTimelineRef = useCallback((el: HTMLElement | null, index: number) => {
    timelineSectionRefs.current[index] = el;
  }, []);

  /**
   * 共通アニメーションを設定するユーティリティ関数
   * Strengths/Timeline で同じ種類のアニメーションを使用
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

      // --- エントリーアニメーション (once) ---
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 75%",
          end: "top 25%",
          once: true,
        },
      });

      // [共通] レール: clipPath reveal（上から下へ）
      if (rail) {
        gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
        entryTl.to(rail, {
          clipPath: "inset(0 0 0% 0)",
          duration: config.rail.duration,
          ease: "expo.out",
        });
      }

      // [共通] グリッドライン: フェードイン
      if (gridLines) {
        gsap.set(gridLines, { opacity: 0 });
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

      // [共通] ゴースト: y移動 + scale + opacity
      if (ghost) {
        gsap.set(ghost, {
          y: config.ghost.y,
          opacity: 0,
          scale: config.ghost.scale,
        });
        entryTl.to(
          ghost,
          {
            y: 0,
            opacity: config.ghost.opacity,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
          },
          "<0.15"
        );
      }

      // [共通] 帯: mask reveal（内側から横スライド）
      if (bandWrapper && bandText) {
        gsap.set(bandText, { x: "-105%", opacity: 0 });
        entryTl.to(
          bandText,
          {
            x: "0%",
            opacity: 1,
            duration: config.band.duration,
            ease: "expo.out",
          },
          "-=0.5"
        );
      }

      // [共通] メタ行: y移動 + opacity + stagger（軽いバウンス）
      if (metaItems.length > 0) {
        gsap.set(metaItems, { y: config.meta.y, opacity: 0 });
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

      // [共通] 説明文: y移動 + opacity
      if (description) {
        gsap.set(description, { y: config.description.y, opacity: 0 });
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

      // [Timeline専用] 実績リスト: clipPath line reveal
      if (isTimeline && achievements.length > 0) {
        gsap.set(achievements, {
          y: 10,
          opacity: 0,
          clipPath: "inset(0 100% 0 0)",
        });
        entryTl.to(
          achievements,
          {
            y: 0,
            opacity: 1,
            clipPath: "inset(0 0% 0 0)",
            stagger: 0.1,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.25"
        );
      }

      // [共通] タグ: y移動 + opacity + stagger
      if (tags.length > 0) {
        gsap.set(tags, { y: config.tag.y, opacity: 0 });
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
      const scrubTrigger = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
        onUpdate: (self) => {
          const progress = self.progress;
          // 中央を0として -0.5 ~ +0.5 に正規化
          const centered = progress - 0.5;

          // [共通] ゴースト: パララックス
          if (ghost) {
            gsap.set(ghost, {
              y: centered * config.ghost.parallaxY,
              scale: 1 + centered * 0.02,
            });
          }

          // [共通] グリッドライン: subtle drift
          if (gridLines) {
            gsap.set(gridLines, {
              backgroundPositionY: `${progress * 25}px`,
            });
          }
        },
      });
      triggerRefs.current.push(scrubTrigger);
    },
    []
  );

  useEffect(() => {
    // フォント読み込み完了を待ってアニメーション開始
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        // Strengths セクション
        for (const el of strengthSectionRefs.current) {
          if (!el) continue;
          setupSectionAnimation(el, ANIMATION_CONFIG.strengths, false);
        }

        // Timeline セクション
        for (const el of timelineSectionRefs.current) {
          if (!el) continue;
          setupSectionAnimation(el, ANIMATION_CONFIG.timeline, true);
        }
      });

      // クリーンアップ
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
    <ProfileLayout>
      <ProfileBackground />
      <ProfileIntro />

      {/* Strengths */}
      <div className="relative z-10 flex flex-col">
        {strengths.map((strength, index) => (
          <StrengthSection
            key={strength.id}
            strength={strength}
            index={index}
            setRef={setStrengthRef}
          />
        ))}
      </div>

      {/* Experience */}
      <div className="relative z-10 flex flex-col">
        {experiences.map((exp, index) => (
          <TimelineSection key={exp.id} exp={exp} index={index} setRef={setTimelineRef} />
        ))}
      </div>
    </ProfileLayout>
  );
}
