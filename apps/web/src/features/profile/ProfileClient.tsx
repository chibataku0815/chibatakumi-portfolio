"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { MouseTextRing } from "@/features/skills/components";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProfileClientProps {
  profile: {
    strengths: Strength[];
    experience: Experience[];
  };
}

// Profile用のアクセント色（アンバー系）
const PROFILE_ACCENT = "#e8a85a";

export default function ProfileClient({ profile }: ProfileClientProps) {
  const { strengths, experience } = profile;

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
      <ProfileBackground accentColor={isHovered ? PROFILE_ACCENT : null} />
      <ProfileIntro />
      <MouseTextRing
        text={hoveredTitle ?? ""}
        accentColor={isHovered ? PROFILE_ACCENT : null}
        isVisible={isHovered}
      />

      {/* Breathing Zone (Golden Ratio - レスポンシブ) */}
      <div className="h-[25vh] sm:h-[35vh] md:h-[50vh]" aria-hidden="true" />

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
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
          />
        ))}
      </div>

      {/* Breathing Zone (Golden Ratio - レスポンシブ) */}
      <div className="h-[25vh] sm:h-[40vh] md:h-[var(--breath-md)]" aria-hidden="true" />

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
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
          />
        ))}
      </div>

      {/* Breathing Zone (Golden Ratio - レスポンシブ) */}
      <div className="h-[30vh] sm:h-[50vh] md:h-[var(--breath-lg)]" aria-hidden="true" />
    </ProfileLayout>
  );
}
