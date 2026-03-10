"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ProfileBackground,
  ProfileIntro,
  ProfileLayout,
  ProfileSectionLead,
  StrengthSection,
  TechStackSection,
  TimelineSection,
  ProfileCtaSection,
} from "./ProfileSections";
import {
  setupStrengthEntry,
  setupTimelineEntry,
  setupProfileParallax,
} from "./ProfileAnimations";
import { MouseTextRing } from "@/features/skills/components";
import type { ProfilePageContent } from "@/shared/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProfileClientProps {
  profile: ProfilePageContent;
}

// Profile用のアクセント色（アンバー系）
const PROFILE_ACCENT = "#e8a85a";

export default function ProfileClient({ profile }: ProfileClientProps) {
  const { header, strengths, experience, techStack, cta } = profile;

  const strengthRefs = useRef<(HTMLElement | null)[]>([]);
  const timelineRefs = useRef<(HTMLElement | null)[]>([]);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  // Hover state for Color-Responsive
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleHoverStart = useCallback((_id: string, title: string) => {
    setHoveredTitle(title);
    setIsHovered(true);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredTitle(null);
    setIsHovered(false);
  }, []);

  const setStrengthRef = useCallback((el: HTMLElement | null, index: number) => {
    strengthRefs.current[index] = el;
  }, []);

  const setTimelineRef = useCallback((el: HTMLElement | null, index: number) => {
    timelineRefs.current[index] = el;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let ctx: gsap.Context | null = null;

    void document.fonts.ready.then(() => {
      if (!isMounted) return;

      ctx = gsap.context(() => {
        for (const [index, el] of strengthRefs.current.entries()) {
          if (!el) continue;
          setupStrengthEntry(el, index, strengths.length);
          const trigger = setupProfileParallax(el);
          triggersRef.current.push(trigger);
        }

        for (const [index, el] of timelineRefs.current.entries()) {
          if (!el) continue;
          setupTimelineEntry(el, index, experience.length);
          const trigger = setupProfileParallax(el);
          triggersRef.current.push(trigger);
        }
      });
    });

    return () => {
      isMounted = false;
      ctx?.revert();
      for (const trigger of triggersRef.current) {
        trigger.kill();
      }
      triggersRef.current = [];
    };
  }, [strengths.length, experience.length]);

  return (
    <ProfileLayout>
      <ProfileBackground accentColor={isHovered ? PROFILE_ACCENT : null} />
      <ProfileIntro header={header} />
      <MouseTextRing
        text={hoveredTitle ?? ""}
        accentColor={isHovered ? PROFILE_ACCENT : null}
        isVisible={isHovered}
      />

      {/* Breathing Zone (Golden Ratio - レスポンシブ) */}
      <div className="h-[25vh] sm:h-[35vh] md:h-[50vh]" aria-hidden="true" />

      <ProfileSectionLead
        eyebrow="Strengths"
        title="判断軸としての強み"
        description="肩書きの列挙ではなく、どういう基準で設計し、どの役割まで自分で引き受けるかを整理しています。"
      />

      <div className="relative z-10">
        {strengths.map((strength, index) => (
          <StrengthSection
            key={strength.id}
            strength={strength}
            index={index}
            total={strengths.length}
            setRef={setStrengthRef}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
          />
        ))}
      </div>

      {/* Breathing Zone (Golden Ratio - レスポンシブ) */}
      <div className="h-[25vh] sm:h-[40vh] md:h-[var(--breath-md)]" aria-hidden="true" />

      <ProfileSectionLead
        eyebrow="Experience"
        title="信頼の根拠になる積層"
        description="長く関わった案件、役割の変化、扱ってきた責任範囲を時系列で辿れるようにしています。"
      />

      <div className="relative z-10">
        {experience.map((exp, index) => (
          <TimelineSection
            key={exp.id}
            exp={exp}
            index={index}
            total={experience.length}
            setRef={setTimelineRef}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
          />
        ))}
      </div>

      <div className="h-[22vh] sm:h-[32vh] md:h-[42vh]" aria-hidden="true" />

      <ProfileSectionLead
        eyebrow="Tech Stack"
        title="再現性を支える道具立て"
        description="技術選定、設計、デザイン、撮影後処理まで、実務で継続的に使っているものだけを整理しています。"
      />

      <TechStackSection categories={techStack} />

      <div className="h-[18vh] sm:h-[24vh] md:h-[30vh]" aria-hidden="true" />

      <ProfileCtaSection cta={cta} />

      <div className="h-[30vh] sm:h-[50vh] md:h-[var(--breath-lg)]" aria-hidden="true" />
    </ProfileLayout>
  );
}
