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

export default function SkillsClient({ skills }: SkillsClientProps) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const ctxRef = useRef<gsap.Context | null>(null);
  const initializedRef = useRef(false);

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  }, []);

  // 初期状態を即座に設定（ちらつき防止）
  useEffect(() => {
    if (initializedRef.current) return;

    // 即座に初期状態を設定
    for (const el of sectionRefs.current) {
      if (el) setInitialState(el);
    }
    initializedRef.current = true;
  }, [skills]);

  // アニメーションのセットアップ
  useEffect(() => {
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
  }, [skills]);

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
