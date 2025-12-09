"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SkillsLayout,
  SkillsBackground,
  SkillsIntro,
  SkillSection,
} from "./SkillsSections";
import { SkillSectionSkeleton } from "./components";
import {
  setInitialState,
  setupSectionEntry,
  setupParallax,
} from "./SkillsAnimations";
import type { WorkItem } from "@/shared/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SkillsClientProps {
  skills: WorkItem[];
}

type LayoutPattern = "A" | "B" | "C";
function getLayoutPattern(index: number): LayoutPattern {
  const patterns: LayoutPattern[] = ["A", "B", "C"];
  return patterns[index % 3];
}

export default function SkillsClient({ skills }: SkillsClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const ctxRef = useRef<gsap.Context | null>(null);
  const initializedRef = useRef(false);

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  }, []);

  // 初期ロード完了後にスケルトンを非表示
  useEffect(() => {
    // 最小表示時間を確保（体験の一貫性）
    const minDisplayTime = 800;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, []);

  // 初期状態を即座に設定（ちらつき防止）
  useEffect(() => {
    if (initializedRef.current || isLoading) return;

    // 即座に初期状態を設定
    for (const el of sectionRefs.current) {
      if (el) setInitialState(el);
    }
    initializedRef.current = true;
  }, [skills, isLoading]);

  // アニメーションのセットアップ
  useEffect(() => {
    if (isLoading) return; // ローディング中はスキップ

    let cancelled = false;

    // レイアウト安定後に実行
    const timer = setTimeout(() => {
      if (cancelled) return;

      ctxRef.current = gsap.context(() => {
        for (const [index, el] of sectionRefs.current.entries()) {
          if (!el) continue;

          // Entry animation
          setupSectionEntry(el, index);

          // Parallax
          const trigger = setupParallax(el);
          triggersRef.current.push(trigger);
        }

        // ScrollTrigger のレイアウト再計算
        ScrollTrigger.refresh();
      });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctxRef.current?.revert();
      for (const trigger of triggersRef.current) {
        trigger.kill();
      }
      triggersRef.current = [];
    };
  }, [skills, isLoading]);

  return (
    <SkillsLayout>
      <SkillsBackground />
      <SkillsIntro />

      {/* Breathing Zone before sections (Golden Ratio) */}
      <div className="h-[var(--breath-md)]" aria-hidden="true" />

      {/* Skill Sections: Skeleton or Real Content */}
      {isLoading ? (
        // Loading state: Show skeletons
        skills.map((_, idx) => (
          <SkillSectionSkeleton key={`skeleton-${idx}`} pattern={getLayoutPattern(idx)} />
        ))
      ) : (
        // Loaded state: Show real content with animations
        skills.map((skill, idx) => (
          <SkillSection
            key={skill.id}
            skill={skill}
            index={idx}
            setRef={setRef}
          />
        ))
      )}

      {/* Breathing Zone after sections (Golden Ratio) */}
      <div className="h-[var(--breath-lg)]" aria-hidden="true" />
    </SkillsLayout>
  );
}
