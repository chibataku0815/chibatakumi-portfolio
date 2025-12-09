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

      {/* Breathing Zone (Golden Ratio) */}
      <div className="h-[50vh]" aria-hidden="true" />

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

      {/* Breathing Zone (Golden Ratio) */}
      <div className="h-[var(--breath-md)]" aria-hidden="true" />

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

      {/* Breathing Zone (Golden Ratio) */}
      <div className="h-[var(--breath-lg)]" aria-hidden="true" />
    </ProfileLayout>
  );
}
