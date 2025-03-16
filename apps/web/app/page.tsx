'use client';

import gsap from 'gsap';
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import { useLenis } from './hooks/useLenis';
import { useTextAnimation } from './hooks/useTextAnimation';

/**
 * メインページコンポーネント
 * ヒーローセクション、プロジェクト、情報セクションを含むポートフォリオページ
 * wodniack.dev風のグリッドとタイポグラフィを使用したダイナミックなデザイン
 */
export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // タイプライターアニメーションの状態
  const [typingComplete, setTypingComplete] = useState(false);
  // スクロール位置
  const [scrollY, setScrollY] = useState(0);

  // スムーススクロールの初期化
  useLenis();

  // スクロール位置の監視
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // グリッドアニメーション
  useEffect(() => {
    if (!gridRef.current || !pageRef.current) return;

    // グリッドの動きをスクロールと連動
    const animateGrid = () => {
      if (!gridRef.current) return;

      // スクロール位置に応じてグリッドの歪みを調整
      const distortion = scrollY * 0.0005;
      const rotation = scrollY * 0.01;

      gsap.to(gridRef.current.querySelectorAll('.vertical-line'), {
        scaleY: 1 + distortion,
        rotation: rotation * 0.2,
        stagger: 0.01,
        duration: 0.8,
        ease: 'power2.out'
      });

      gsap.to(gridRef.current.querySelectorAll('.horizontal-line'), {
        scaleX: 1 + distortion * 0.5,
        y: Math.sin(scrollY * 0.001) * 10,
        stagger: 0.01,
        duration: 0.8,
        ease: 'power2.out'
      });
    };

    window.addEventListener('scroll', animateGrid);

    // 初期グリッドアニメーション
    gsap.fromTo(
      gridRef.current.querySelectorAll('.grid-line'),
      {
        opacity: 0,
        scale: 0.8
      },
      {
        opacity: 0.2,
        scale: 1,
        stagger: 0.01,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    return () => {
      window.removeEventListener('scroll', animateGrid);
    };
  }, [scrollY]);

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
      if (parseFloat(getComputedStyle(cursor).opacity) < 0.1) {
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

      // グリッド線との相互作用
      if (gridRef.current) {
        const lines = gridRef.current.querySelectorAll('.grid-line');
        lines.forEach((line, index) => {
          const distance = Math.abs(index % 20 - x / (window.innerWidth / 20)) +
                         Math.abs(Math.floor(index / 20) - y / (window.innerHeight / 20));

          if (distance < 5) {
            gsap.to(line, {
              opacity: 0.8,
              scale: 1.2,
              duration: 0.5,
              ease: 'power2.out'
            });
          } else {
            gsap.to(line, {
              opacity: 0.2,
              scale: 1,
              duration: 0.8,
              ease: 'power2.out'
            });
          }
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

    const typeText = (element: Element, text: string, i: number = 0) => {
      if (!element) return; // 要素がない場合は処理しない
      if (i < text.length) {
        // textContentはnullになる可能性があるため、空文字で初期化
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
        // インデックスが範囲内であることを確認し、明示的に型の安全性を保証
        if (index < titles.length) {
          const title = titles[index];
          // nullやundefinedでないことを確認
          if (title) {
            typeText(element, title);
          }
        }
      }, delay);
      delay += 1500; // 各行の間隔
    });

    // タイピング完了後の状態更新
    setTimeout(() => {
      setTypingComplete(true);
    }, delay);
  }, []);

  // 名前のアニメーション - タイプライターアニメーションのトップレベルでの使用
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

    // タイピング完了後、名前を表示
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
    <main className="home" ref={pageRef}>
      {/* グローバルグリッド - ページ全体に表示されるグリッド線 */}
      <div
        ref={gridRef}
        className="fixed inset-0 pointer-events-none z-10 mix-blend-difference"
      >
        {/* 垂直グリッド線 */}
        <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] h-screen w-screen">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="vertical-line grid-line h-full w-[1px] bg-white opacity-20 transform-gpu"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}
        </div>

        {/* 水平グリッド線 */}
        <div className="absolute inset-0 grid grid-rows-[repeat(20,1fr)] h-screen w-screen">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="horizontal-line grid-line w-full h-[1px] bg-white opacity-20 transform-gpu"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}
        </div>

        {/* バイナリデータ表示（参考サイトの0と1の行） - クライアントサイドのみで実行 */}
        <div className="absolute top-[30%] left-0 right-0 overflow-hidden opacity-20 px-4 whitespace-nowrap tracking-widest text-sm">
          <div className="binary-data flex justify-between">
            <span>• 10101010101010101010 •••••••••</span>
            <span>•••••••• 101010101010101 •••••••</span>
            <span>••••••••••• 1010101010 ••••</span>
            <span>•••••••• 101010101010101 •••••••</span>
            <span>• 10101010101010101010 •</span>
          </div>
        </div>

        <div className="absolute bottom-[30%] left-0 right-0 overflow-hidden opacity-20 px-4 whitespace-nowrap tracking-widest text-sm">
          <div className="binary-data flex justify-between">
            <span>• 01010101010101010101 •••••••••</span>
            <span>•••••••• 010101010101010 •••••••</span>
            <span>••••••••••• 0101010101 ••••</span>
            <span>•••••••• 010101010101010 •••••••</span>
            <span>• 01010101010101010101 •</span>
          </div>
        </div>
      </div>

      {/* ヘッダーセクション - wodniack.dev風 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 mix-blend-difference">
        <div className="grid grid-cols-[1fr_auto_auto] h-16">
          <div className="border-r border-white/20 flex items-center px-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">TAKUMI CHIBA</span>
              <span className="text-xs opacity-50">PORTFOLIO</span>
            </div>
          </div>
          <div className="border-r border-white/20 flex items-center px-8 text-sm">
            Coding with passion from Japan.
          </div>
          <div className="flex items-center px-8 text-sm">
            Available for work → Contact me
          </div>
        </div>
      </header>

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
                <div className="absolute inset-0 z-10 noise-filter opacity-10 mix-blend-overlay"></div>
                <Image
                  src="/images/chiba_takumi.jpg"
                  alt="Takumi Chiba Portrait"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center grayscale"
                  priority
                />
                <div className="absolute inset-0 pointer-events-none grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] z-5 opacity-20">
                  {Array.from({ length: 400 }).map((_, i) => (
                    <div key={i} className="border border-white/10"></div>
                  ))}
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
                  <span className="title-item block overflow-hidden h-[1.1em] relative"></span>
                  <span className="title-item block overflow-hidden h-[1.1em] relative"></span>
                  <span className="title-item block overflow-hidden h-[1.1em] relative"></span>
                </h2>
                <div className="typing-cursor absolute right-0 top-0 w-[3px] h-[7rem] bg-white mix-blend-difference animate-blink"></div>
              </div>

              <h2 ref={subtitleRef} className="text-white text-5xl font-extrabold tracking-tight mix-blend-difference opacity-0">
                Takumi Chiba
              </h2>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="min-h-screen border-t border-white/20 pt-32 pb-32 px-4">
        <div className="container mx-auto">
          <h2 className="text-7xl font-black tracking-tighter mb-16 mix-blend-difference">PROJECTS</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="project-item border border-white/20 p-4 relative aspect-square overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/project1.jpg"
                  alt="Project 1"
                  fill
                  className="object-cover grayscale transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-2xl font-bold">Project One</h3>
                </div>
              </div>
            </div>

            <div className="project-item border border-white/20 p-4 relative aspect-square overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/project2.jpg"
                  alt="Project 2"
                  fill
                  className="object-cover grayscale transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-2xl font-bold">Project Two</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="project-item border border-white/20 p-4 relative aspect-square overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/project3.jpg"
                  alt="Project 3"
                  fill
                  className="object-cover grayscale transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-2xl font-bold">Project Three</h3>
                </div>
              </div>
            </div>

            <div className="project-item border border-white/20 p-4 relative aspect-square overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/project4.jpg"
                  alt="Project 4"
                  fill
                  className="object-cover grayscale transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-2xl font-bold">Project Four</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="info" className="min-h-screen border-t border-white/20 grid grid-cols-1 md:grid-cols-2">
        <div className="col p-8 flex items-center justify-center border-r border-white/20">
          <div className="max-w-xl space-y-8">
            <h2 className="text-7xl font-black tracking-tighter mb-8 mix-blend-difference">ABOUT</h2>
            <p className="text-xl leading-relaxed">
              I collaborate with agencies and designers to craft memorable user experiences, bringing
              their vision to life with a nice touch of animation.
            </p>
            <p className="text-xl leading-relaxed">
              I started with web development, played with various frameworks, did back-end dev
              from scratch, worked with all kinds of CMS, focused on creative development, worked on 140+
              projects, and keep on learning.
            </p>
          </div>
        </div>

        <div className="col p-8 flex items-center justify-center">
          <div className="max-w-xl">
            <h2 className="text-7xl font-black tracking-tighter mb-8 mix-blend-difference">CONTACT</h2>
            <div className="space-y-4">
              <div className="border border-white/20 p-6">
                <h3 className="text-sm uppercase opacity-60 mb-2">Email</h3>
                <p className="text-xl">contact@example.com</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="text-sm uppercase opacity-60 mb-2">Location</h3>
                <p className="text-xl">Tokyo, Japan</p>
              </div>
              <div className="border border-white/20 p-6">
                <h3 className="text-sm uppercase opacity-60 mb-2">Social</h3>
                <div className="flex gap-4">
                  <a href="#" className="text-xl hover:underline">Twitter</a>
                  <a href="#" className="text-xl hover:underline">GitHub</a>
                  <a href="#" className="text-xl hover:underline">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/20 p-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm">© {new Date().getFullYear()} Takumi Chiba. All rights reserved.</div>
          <div className="text-sm">Portfolio 2025</div>
        </div>
      </footer>
    </main>
  );
}
