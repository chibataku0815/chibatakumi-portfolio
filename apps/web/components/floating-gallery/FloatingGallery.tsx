/**
 * フローティングギャラリーコンポーネント
 * 
 * スクロールに応じて3D空間で画像とテキストがアニメーションするギャラリー
 */
'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger)

interface CardPosition {
  top: string
  left: string
}

const cardPositions: CardPosition[] = [
  { top: '30%', left: '55%' },
  { top: '20%', left: '25%' },
  { top: '50%', left: '10%' },
  { top: '60%', left: '40%' },
  { top: '30%', left: '30%' },
  { top: '60%', left: '60%' },
  { top: '20%', left: '50%' },
  { top: '60%', left: '10%' },
  { top: '20%', left: '40%' },
  { top: '45%', left: '55%' },
]

interface GalleryImage {
  id: string
  src: string
  alt: string
}

interface Props {
  images: GalleryImage[]
  titles?: Array<{
    id: string
    text: string
  }>
}

export const FloatingGallery = ({ 
  images,
  titles = [
    { id: 'creative', text: 'Creative' },
    { id: 'dynamic', text: 'Dynamic' },
    { id: 'innovative', text: 'Innovative' },
    { id: 'powerful', text: 'Powerful' }
  ]
}: Props) => {
  const titlesContainerRef = useRef<HTMLDivElement>(null)
  const imagesContainerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const titlesRef = useRef<HTMLDivElement[]>([])
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Lenisの初期化
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    })

    // アニメーション用の初期状態を設定
    const cards = cardsRef.current
    const moveDistance = window.innerWidth * 3

    // カードの初期状態を設定
    cards.map((card) => {
      gsap.set(card, {
        z: -50000,
        scale: 0,
      })
    })

    // スクロールアニメーションの設定
    const trigger = ScrollTrigger.create({
      trigger: '.sticky-section',
      start: 'top top',
      end: `+=${window.innerHeight * 5}`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        // タイトルの水平移動
        const xPosition = -moveDistance * self.progress
        if (titlesContainerRef.current) {
          gsap.set(titlesContainerRef.current, { x: xPosition })
        }

        // 速度ベースのアニメーション
        const velocity = self.getVelocity()
        const normalizedVelocity = velocity / Math.abs(velocity) || 0
        const maxOffset = 30
        const currentSpeed = Math.min(Math.abs(velocity / 500), maxOffset)
        const isAtEdge = self.progress <= 0 || self.progress >= 1

        // タイトルのアニメーション
        titlesRef.current.map((titleContainer) => {
          if (!titleContainer) return

          const titles = titleContainer.querySelectorAll('h1')
          const [title1, title2, title3] = Array.from(titles)

          if (!title1 || !title2 || !title3) return

          if (isAtEdge) {
            gsap.to([title1, title2], {
              xPercent: -50,
              x: 0,
              duration: 0.3,
              ease: 'power2.out',
              overwrite: true,
            })
          } else {
            const baseOffset = normalizedVelocity * currentSpeed

            gsap.to(title1, {
              xPercent: -50,
              x: `${baseOffset * 4}px`,
              duration: 0.2,
              ease: 'power1.out',
              overwrite: 'auto',
            })

            gsap.to(title2, {
              xPercent: -50,
              x: `${baseOffset * 2}px`,
              duration: 0.2,
              ease: 'power1.out',
              overwrite: 'auto',
            })
          }

          gsap.set(title3, {
            xPercent: -50,
            x: 0,
          })
        })

        // カードのアニメーション
        cards.map((card, index) => {
          const staggerOffset = index * 0.075
          const scaledProgress = (self.progress - staggerOffset) * 3
          const individualProgress = Math.max(0, Math.min(1, scaledProgress))
          const targetZ = index === cards.length - 1 ? 1500 : 2000
          const newZ = -50000 + (targetZ + 50000) * individualProgress
          const scaleProgress = Math.min(1, individualProgress * 10)
          const scale = Math.max(0, Math.min(1, scaleProgress))

          gsap.set(card, {
            z: newZ,
            scale: scale,
          })
        })
      },
    })

    // アニメーションループ
    const raf = (time: number) => {
      lenisRef.current?.raf(time * 1000)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // クリーンアップ
    return () => {
      lenisRef.current?.destroy()
      trigger.kill()
    }
  }, [])

  const setCardRef = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      cardsRef.current[index] = el
    }
  }

  const setTitleRef = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      titlesRef.current[index] = el
    }
  }

  return (
    <div className="relative w-full">
      <section className="h-screen w-full flex items-center justify-center bg-[#edebde]">
        <h1 className="text-4xl font-bold text-[#1f1f1f]">Scroll Down</h1>
      </section>

      <section className="sticky-section relative h-screen w-full overflow-hidden bg-[#fffef8]">
        <div ref={titlesContainerRef} className="absolute top-0 left-0 w-[400vw] h-screen flex">
          {titles.map(({ id, text }, index) => (
            <div
              key={id}
              ref={(el) => setTitleRef(el, index)}
              className="relative flex-1 flex items-center justify-center"
            >
              <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9vw] italic font-medium text-[#dafa6c]">{text}</h1>
              <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9vw] italic font-medium text-[#10d0f4]">{text}</h1>
              <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9vw] italic font-medium text-[#1f1f1f]">{text}</h1>
            </div>
          ))}
        </div>

        <div ref={imagesContainerRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vh] [transform-style:preserve-3d] [perspective:2000px] -z-10">
          {images.map((image, index) => (
            <div
              key={image.id}
              ref={(el) => setCardRef(el, index)}
              className="absolute w-[200px] h-[200px] rounded-2xl overflow-hidden [transform-style:preserve-3d]"
              style={{
                top: cardPositions[index]?.top,
                left: cardPositions[index]?.left,
              }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="h-screen w-full flex items-center justify-center bg-[#edebde]">
        <h1 className="text-4xl font-bold text-[#1f1f1f]">Continue Scrolling</h1>
      </section>
    </div>
  )
} 