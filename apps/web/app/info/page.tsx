'use client';

import { useRef } from 'react';
import Image from "next/image";
import { useLenis } from '../hooks/useLenis';
import { useTextAnimation } from '../hooks/useTextAnimation';

/**
 * 情報ページコンポーネント
 * テキストアニメーションとスムーススクロールを実装
 */
export default function Info() {
  const textRef = useRef<HTMLParagraphElement>(null);

  // スムーススクロールの初期化
  useLenis();

  // テキストアニメーションの設定
  useTextAnimation(textRef, {
    duration: 1,
    stagger: 0.1,
    ease: 'power3.out',
    startY: 50,
  });

  return (
    <main className="info">
      <section className="w-screen h-full min-h-screen bg-bg flex">
        <div className="col flex-1 relative">
          <Image 
            src="/images/about.jpg" 
            alt="About" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="col flex-1 p-8 flex justify-center items-center">
          <p ref={textRef} className="font-medium text-4xl text-copy">
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
  );
} 