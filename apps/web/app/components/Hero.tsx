'use client';

import gsap from 'gsap';
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import { useTextAnimation } from '../hooks/useTextAnimation';

/**
 * ヒーローセクションコンポーネント
 * ポートフォリオのメインビジュアルを表示する
 * 
 * @component
 */
const Hero = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // タイプライターアニメーションの状態
  const [typingComplete, setTypingComplete] = useState(false);

  // カーソルとマウス追従エフェクト
  useEffect(() => {
    if (!cursorRef.current || !containerRef.current) return;

    const cursor = cursorRef.current;
    const container = containerRef.current;

    // 最初のマウス移動でカーソルエフェクトを表示
    gsap.set(cursor, { opacity: 0, scale: 0.5 });

    const onMouseEnter = () => {
      gsap.to(cursor, {
        opacity: 0.6,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const onMouseLeave = () => {
      gsap.to(cursor, {
        opacity: 0,
        scale: 0.5,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(cursor, {
        x: x,
        y: y,
        duration: 0.5,
        ease: 'power2.out'
      });

      // 初回マウス移動時のみ
      if (Number.parseFloat(getComputedStyle(cursor).opacity) < 0.1) {
        onMouseEnter();
      }

      // 画像のわずかな動き
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          x: (x - rect.width / 2) * 0.02,
          y: (y - rect.height / 2) * 0.02,
          duration: 1,
          ease: 'power2.out'
        });
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  // メインタイトルのアニメーション
  useEffect(() => {
    if (!heroTitleRef.current) return;

    gsap.fromTo(
      heroTitleRef.current,
      {
        opacity: 0,
        y: 100,
        scale: 0.8
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.5
      }
    );
  }, []);

  // タイプライターアニメーション
  useEffect(() => {
    if (!titleRef.current) return;

    const titles = ['Design.', 'Code.', 'Capture.'];
    const titleElements = titleRef.current.querySelectorAll('.title-item');

    const typeText = (element: Element, text: string, i = 0) => {
      if (!element) return;
      if (i < text.length) {
        element.textContent = text.substring(0, i + 1);
        setTimeout(() => typeText(element, text, i + 1), 100);
      } else {
        return;
      }
    };

    let delay = 0;
    titleElements.forEach((element, index) => {
      element.textContent = '';
      setTimeout(() => {
        if (index < titles.length) {
          const title = titles[index];
          if (title) {
            typeText(element, title);
          }
        }
      }, delay);
      delay += 1500;
    });

    // タイピング完了後の状態更新
    setTimeout(() => {
      setTypingComplete(true);
    }, delay);
  }, []);

  // 名前のアニメーション
  useTextAnimation(subtitleRef, {
    splitType: 'chars',
    stagger: 0.05,
    startY: 30,
    duration: 1.2,
    ease: 'power4.out'
  });

  // タイプライター完了後に名前を表示
  useEffect(() => {
    if (!typingComplete || !subtitleRef.current) return;

    gsap.to(subtitleRef.current, {
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    });
  }, [typingComplete]);

  // 画像のアニメーション
  useEffect(() => {
    if (!imageRef.current) return;

    gsap.fromTo(
      imageRef.current,
      {
        opacity: 0,
        scale: 1.1,
        filter: 'grayscale(1) brightness(0.8)'
      },
      {
        opacity: 1,
        scale: 1,
        filter: 'grayscale(1) brightness(1)',
        duration: 2,
        ease: 'power3.out',
        delay: 1
      }
    );

    // 画像にノイズエフェクトを追加
    const noise = () => {
      if (!imageRef.current) return;

      const intensity = Math.random() * 0.03;
      gsap.to(imageRef.current, {
        filter: `grayscale(1) brightness(${1 + intensity})`,
        duration: 0.2,
        onComplete: () => {
          gsap.to(imageRef.current, {
            filter: 'grayscale(1) brightness(1)',
            duration: 0.2
          });
        }
      });

      setTimeout(noise, Math.random() * 2000 + 1000);
    };

    setTimeout(noise, 3000);
  }, []);

  return (
    <section id="home" className="h-screen bg-transparent pt-16">
      {/* カーソル追従エフェクト */}
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden"
      >
        <div
          ref={cursorRef}
          className="cursor-follow w-24 h-24 rounded-full border-2 border-white/30 absolute pointer-events-none z-20 opacity-0 mix-blend-difference"
          style={{ transform: 'translate(-50%, -50%)' }}
        />

        <div className="grid grid-cols-2 h-full">
          {/* 左側: ポートレート写真 */}
          <div className="h-full relative overflow-hidden border-r border-white/20">
            <div ref={imageRef} className="relative w-full h-full opacity-0 will-change-transform">
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
              <div className="absolute inset-0 z-10 noise-filter opacity-10 mix-blend-overlay" />
              <Image
                src="/images/chiba_takumi.jpg"
                alt="Takumi Chiba Portrait"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center grayscale"
                priority
              />
              <div className="absolute inset-0 pointer-events-none grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] z-5 opacity-20">
                {Array.from({ length: 400 }).map((_, i) => {
                  const row = Math.floor(i / 20);
                  const col = i % 20;
                  return (
                    <div key={`grid-${row}-${col}`} className="border border-white/10" />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右側: テキストコンテンツ */}
          <div className="h-full flex flex-col justify-center items-start pl-16 pr-8">
            <h1
              ref={heroTitleRef}
              className="text-[12vw] font-black tracking-tighter mb-8 leading-none transform-gpu mix-blend-difference"
            >
              CREATIVE<br/>DEVELOPER
            </h1>

            <div className="relative mb-6">
              <h2 ref={titleRef} className="text-white text-4xl font-bold leading-tight mix-blend-difference tracking-tight">
                <span className="title-item block overflow-hidden h-[1.1em] relative" />
                <span className="title-item block overflow-hidden h-[1.1em] relative" />
                <span className="title-item block overflow-hidden h-[1.1em] relative" />
              </h2>
              <div className="typing-cursor absolute right-0 top-0 w-[3px] h-[7rem] bg-white mix-blend-difference animate-blink" />
            </div>

            <h2 ref={subtitleRef} className="text-white text-5xl font-extrabold tracking-tight mix-blend-difference opacity-0">
              Takumi Chiba
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 