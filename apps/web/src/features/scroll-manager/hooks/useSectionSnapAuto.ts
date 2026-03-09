'use client'

import { useRef, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export interface SectionBoundary {
  name: string
  start: number
  end: number
  isPinned?: boolean
  scrollTriggerId?: string
}

/**
 * 汎用的なセクションスナップ機能
 * data-snap-section 属性を持つ要素を自動検出してスナップポイントとする
 */
export function useSectionSnapAuto() {
  const isSnappingRef = useRef(false)
  const currentSectionRef = useRef(0)
  const sectionsRef = useRef<HTMLElement[]>([])

  /**
   * セクション要素を検出して更新
   */
  const updateSections = useCallback(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-snap-section]')
    sectionsRef.current = Array.from(elements)
  }, [])

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
   * DOM要素から動的に計算
   */
  const getSectionBoundaries = useCallback((): SectionBoundary[] => {
    return sectionsRef.current.map((el, index) => {
      const rect = el.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const start = rect.top + scrollTop
      const end = start + rect.height

      // ScrollTrigger ID を data 属性から取得
      const scrollTriggerId = el.dataset.snapId
      const isPinned = !!scrollTriggerId

      return {
        name: el.dataset.snapSection || `section-${index}`,
        start,
        end,
        isPinned,
        scrollTriggerId,
      }
    })
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
    if (sections.length === 0) return

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

  /**
   * スクロール停止時にスナップ
   */
  const handleScrollEnd = useCallback(() => {
    if (isSnappingRef.current) return

    const sections = getSectionBoundaries()
    if (sections.length === 0) return

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

    // セクションの開始位置から離れている場合、最も近いセクションへスナップ
    const distanceToStart = Math.abs(scrollY - section.start)
    const distanceToEnd = Math.abs(scrollY - section.end)

    // セクション内で中途半端な位置にいる場合（非pinセクションのみ）
    if (!section.isPinned && distanceToStart > 50 && distanceToEnd > 50) {
      // より近い方にスナップ
      if (distanceToStart < distanceToEnd) {
        snapToSection(currentSection, sections)
      } else if (currentSection < sections.length - 1) {
        snapToSection(currentSection + 1, sections)
      }
    }
  }, [getSectionBoundaries, getCurrentSection, snapToSection, canSnapInPinnedSection])

  // セクション要素の検出
  useEffect(() => {
    // 初回検出
    updateSections()

    // ScrollTrigger の refresh 後に再検出
    const refreshHandler = () => {
      updateSections()
    }

    ScrollTrigger.addEventListener('refresh', refreshHandler)

    return () => {
      ScrollTrigger.removeEventListener('refresh', refreshHandler)
    }
  }, [updateSections])

  return {
    isSnappingRef,
    currentSectionRef,
    getSectionBoundaries,
    getCurrentSection,
    snapToSection,
    handleSnap,
    handleScrollEnd,
    canSnapInPinnedSection,
  }
}
