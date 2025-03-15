'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { ReactLenis } from '@studio-freight/react-lenis';
import { useEffect, useRef } from 'react';

/**
 * 情報ページコンポーネント
 * テキストアニメーションとスムーススクロールを実装
 */
export default function Info() {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      // テキストを行単位に分割
      new SplitType(textRef.current, { types: 'lines' });
    }
  }, []);

  useGSAP(() => {
    // テキストのアニメーション
    const lines = gsap.utils.toArray('.line');
    gsap.fromTo(
      lines,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
      }
    );
  }, []);

  return (
    <ReactLenis root>
      <div className="info">
        <img src="/about.jpg" alt="About" />
        <p ref={textRef}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
          veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
          velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
      </div>
    </ReactLenis>
  );
} 