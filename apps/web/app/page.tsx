'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { ReactLenis } from '@studio-freight/react-lenis';
import { useEffect, useRef } from 'react';
import Image from "next/image";

/**
 * メインページコンポーネント
 * ホーム、プロジェクト、情報セクションを含むポートフォリオページ
 */
export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      // テキストを文字単位に分割
      new SplitType(titleRef.current, { types: 'chars' });
    }
  }, []);

  useGSAP(() => {
    // タイトルのアニメーション
    const chars = gsap.utils.toArray('.char');
    gsap.fromTo(
      chars,
      {
        opacity: 0,
        y: 100,
        rotateX: -90,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1,
        stagger: 0.02,
        ease: 'power4.out',
      }
    );
  }, []);

  return (
    <ReactLenis root>
      <main className="home">
        <section id="home" className="home w-screen h-screen bg-bg flex justify-center items-center text-center">
          <h1 ref={titleRef} className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase text-copy text-[20vw] font-extrabold -tracking-[0.5rem] leading-none clip-polygon">
            <span className="char char-relative">P</span>
            <span className="char char-relative">O</span>
            <span className="char char-relative">R</span>
            <span className="char char-relative">T</span>
            <span className="char char-relative">F</span>
            <span className="char char-relative">O</span>
            <span className="char char-relative">L</span>
            <span className="char char-relative">I</span>
            <span className="char char-relative">O</span>
          </h1>
        </section>

        <section id="projects" className="projects w-screen h-full min-h-screen bg-bg py-80 px-4">
          <div className="images w-[30%] mx-auto flex flex-col gap-8">
            <div className="image relative aspect-video">
              <Image src="/images/project1.jpg" alt="Project 1" fill className="object-cover" />
            </div>
            <div className="image relative aspect-video">
              <Image src="/images/project2.jpg" alt="Project 2" fill className="object-cover" />
            </div>
            <div className="image relative aspect-video">
              <Image src="/images/project3.jpg" alt="Project 3" fill className="object-cover" />
            </div>
          </div>
        </section>

        <section id="info" className="info w-screen h-full min-h-screen bg-bg flex">
          <div className="col flex-1" />
          <div className="col flex-1 p-8 flex justify-center items-center">
            <p className="font-medium text-4xl text-copy">
              <span className="line clip-polygon block">
                <span className="line-span-relative">Welcome to my portfolio.</span>
              </span>
              <span className="line clip-polygon block">
                <span className="line-span-relative">I am a web developer.</span>
              </span>
            </p>
          </div>
        </section>
      </main>
    </ReactLenis>
  );
}