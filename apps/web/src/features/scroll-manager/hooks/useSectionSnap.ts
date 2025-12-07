'use client'

import { useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export interface SectionBoundary {
  name: string
  start: number
  end: number
  isPinned?: boolean
  scrollTriggerId?: string
}

export function useSectionSnap() {
  const isSnappingRef = useRef(false)
  const currentSectionRef = useRef(0)

  /**
   * pinされたセクション内でスナップ可能かチェック
   * progress が 0〜2% または 98〜100% の場合のみ true
   */
  const canSnapInPinnedSection = useCallback((scrollTriggerId: string): boolean => {
    const st = ScrollTrigger.getById(scrollTriggerId)
    if (!st) return true

    const progress = st.progress
    // セクションの開始/終了付近（2%以内）でのみスナップ許可
    return progress <= 0.02 || progress >= 0.98
  }, [])

  /**
   * セクション境界を取得
   * ScrollTrigger の start/end から計算
   */
  const getSectionBoundaries = useCallback((): SectionBoundary[] => {
    const heroEnd = window.innerHeight

    // HorizontalWorks の ScrollTrigger
    const horizontalST = ScrollTrigger.getById('horizontal-works')
    const horizontalEnd = horizontalST?.end ?? heroEnd

    // SpotlightGallery の ScrollTrigger
    const spotlightST = ScrollTrigger.getById('spotlight-gallery')
    const spotlightEnd = spotlightST?.end ?? horizontalEnd

    return [
      { name: 'hero', start: 0, end: heroEnd, isPinned: false },
      { name: 'horizontal', start: heroEnd, end: horizontalEnd, isPinned: true, scrollTriggerId: 'horizontal-works' },
      { name: 'spotlight', start: horizontalEnd, end: spotlightEnd, isPinned: true, scrollTriggerId: 'spotlight-gallery' },
      { name: 'footer', start: spotlightEnd, end: document.documentElement.scrollHeight, isPinned: false },
    ]
  }, [])

  /**
   * 現在のセクションインデックスを取得
   */
  const getCurrentSection = useCallback((scrollY: number, sections: SectionBoundary[]): number => {
    for (let i = sections.length - 1; i >= 0; i--) {
      if (scrollY >= sections[i].start - 10) {
        return i
      }
    }
    return 0
  }, [])

  /**
   * 指定セクションへスナップ
   */
  const snapToSection = useCallback((sectionIndex: number, sections: SectionBoundary[]) => {
    if (isSnappingRef.current) return
    if (sectionIndex < 0 || sectionIndex >= sections.length) return

    const target = sections[sectionIndex].start
    isSnappingRef.current = true

    gsap.to(window, {
      scrollTo: target,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        isSnappingRef.current = false
        currentSectionRef.current = sectionIndex
      },
    })
  }, [])

  /**
   * スクロール方向に応じて次/前のセクションへスナップ
   */
  const handleSnap = useCallback((direction: 'up' | 'down') => {
    if (isSnappingRef.current) return

    const sections = getSectionBoundaries()
    const scrollY = window.scrollY
    const currentSection = getCurrentSection(scrollY, sections)
    const section = sections[currentSection]

    // pinされたセクション内ではprogressをチェック
    if (section.isPinned && section.scrollTriggerId) {
      if (!canSnapInPinnedSection(section.scrollTriggerId)) {
        // scrubアニメーション中はスナップしない
        return
      }
    }

    // セクション境界近くかチェック（閾値: 100px）
    const atStart = Math.abs(scrollY - section.start) < 100
    const atEnd = Math.abs(scrollY - section.end) < 100

    if (direction === 'down' && atEnd && currentSection < sections.length - 1) {
      snapToSection(currentSection + 1, sections)
    } else if (direction === 'up' && atStart && currentSection > 0) {
      snapToSection(currentSection - 1, sections)
    }
  }, [getSectionBoundaries, getCurrentSection, snapToSection, canSnapInPinnedSection])

  return {
    isSnappingRef,
    currentSectionRef,
    getSectionBoundaries,
    getCurrentSection,
    snapToSection,
    handleSnap,
    canSnapInPinnedSection,
  }
}
