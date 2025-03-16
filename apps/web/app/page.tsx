'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useLenis } from './hooks/useLenis';
import Hero from './components/Hero';
import Image from 'next/image';

/**
 * メインページコンポーネント
 * ヒーローセクション、プロジェクト、情報セクションを含むポートフォリオページ
 * wodniack.dev風のグリッドとタイポグラフィを使用したダイナミックなデザイン
 */
export default function Home() {
  const gridRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

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
              key={`vertical-${i + 1}`}
              className="vertical-line grid-line h-full w-[1px] bg-white opacity-20 transform-gpu"
              style={{ transform: 'translateZ(0)' }}
            />
          ))}
        </div>

        {/* 水平グリッド線 */}
        <div className="absolute inset-0 grid grid-rows-[repeat(20,1fr)] h-screen w-screen">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`horizontal-${i + 1}`}
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

      <Hero />

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
                  <a href="https://twitter.com" className="text-xl hover:underline">Twitter</a>
                  <a href="https://github.com" className="text-xl hover:underline">GitHub</a>
                  <a href="https://linkedin.com" className="text-xl hover:underline">LinkedIn</a>
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
