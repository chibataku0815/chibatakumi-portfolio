'use client'

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'
import { useSectionSnapAuto } from '../hooks/useSectionSnapAuto'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer)
}

/**
 * 汎用的なセクションスクロールマネージャー
 *
 * data-snap-section 属性を持つ要素を自動検出してスナップポイントとする
 *
 * @example
 * ```tsx
 * // セクションに data-snap-section 属性を追加
 * <section data-snap-section="intro">
 *   <h1>Introduction</h1>
 * </section>
 *
 * <section data-snap-section="content">
 *   <p>Content</p>
 * </section>
 *
 * // SectionScrollManagerAuto を配置
 * <SectionScrollManagerAuto />
 * ```
 *
 * @example
 * ```tsx
 * // ScrollTrigger でピン留めされたセクションの場合
 * <section
 *   data-snap-section="gallery"
 *   data-snap-id="gallery-scroll-trigger"
 * >
 *   <HorizontalGallery />
 * </section>
 * ```
 */
export function SectionScrollManagerAuto() {
  const { isSnappingRef, handleSnap, handleScrollEnd } = useSectionSnapAuto()
  const observerRef = useRef<Observer | null>(null)
  const scrollTimeout = useRef<number | null>(null)

  /**
   * スクロール停止検出用のハンドラー
   */
  const onScrollStop = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    scrollTimeout.current = window.setTimeout(() => {
      handleScrollEnd()
    }, 150)
  }, [handleScrollEnd])

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
      onStop: onScrollStop,
    })

    // scroll イベントでも補助的に監視
    const handleScroll = () => {
      // スクロール停止検出用
      onScrollStop()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observerRef.current?.kill()
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [handleSnap, onScrollStop, isSnappingRef])

  // このコンポーネントはUIを持たない
  return null
}
