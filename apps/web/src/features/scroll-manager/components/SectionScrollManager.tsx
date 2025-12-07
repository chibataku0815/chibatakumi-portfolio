'use client'

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'
import { useSectionSnap } from '../hooks/useSectionSnap'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer)
}

export function SectionScrollManager() {
  const { isSnappingRef, handleSnap, getSectionBoundaries, snapToSection, getCurrentSection, canSnapInPinnedSection } = useSectionSnap()
  const observerRef = useRef<Observer | null>(null)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<number | null>(null)

  /**
   * スクロール停止時にスナップ
   */
  const handleScrollEnd = useCallback(() => {
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
  }, [isSnappingRef, getSectionBoundaries, getCurrentSection, snapToSection, canSnapInPinnedSection])

  useEffect(() => {
    // Observer でスクロール/タッチイベントをキャプチャ
    observerRef.current = Observer.create({
      type: 'wheel,touch',
      tolerance: 10,
      preventDefault: false,
      onUp: () => {
        if (!isSnappingRef.current) {
          handleSnap('up')
        }
      },
      onDown: () => {
        if (!isSnappingRef.current) {
          handleSnap('down')
        }
      },
      onStop: () => {
        // スクロール停止後にスナップ判定
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
        }
        scrollTimeout.current = window.setTimeout(() => {
          handleScrollEnd()
        }, 150)
      },
    })

    // scroll イベントでも補助的に監視
    const handleScroll = () => {
      lastScrollY.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observerRef.current?.kill()
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [handleSnap, handleScrollEnd, isSnappingRef])

  // このコンポーネントはUIを持たない
  return null
}
