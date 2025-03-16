'use client';

import gsap from 'gsap';
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import { useTextAnimation } from '../hooks/useTextAnimation';

/**
 * ヒーローセクションコンポーネント
 * モノトーンのニューブルータリズムデザインを採用したポートフォリオのメインビジュアル
 * 
 * @component
 */
const Hero = () => {
  // バーコードの高さ配列
  const barHeights = [
    { id: 'bar1', height: 40 },
    { id: 'bar2', height: 25 },
    { id: 'bar3', height: 40 },
    { id: 'bar4', height: 35 },
    { id: 'bar5', height: 30 }
  ];

  // バイナリコード配列（上部）
  const topBinaryCodes = [
    { id: 'top1', code: '• 11001010001011110100 /////' },
    { id: 'top2', code: '01110101001 /////' },
    { id: 'top3', code: '0011100110110 /////' },
    { id: 'top4', code: '00001101101 /////' },
    { id: 'top5', code: '01011011100111 /////' }
  ];

  // バイナリコード配列（下部）
  const bottomBinaryCodes = [
    { id: 'bottom1', code: '• 00010110000000 /////' },
    { id: 'bottom2', code: '01000001001001001001 /////' },
    { id: 'bottom3', code: '00101011101010 /////' },
    { id: 'bottom4', code: '10101111100010101 /////' }
  ];

  return (
    <section id="home" className="relative min-h-screen bg-white text-black overflow-hidden border-8 border-black font-body">
      {/* グリッドオーバーレイ - 背景全体のグリッドパターン */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `
            linear-gradient(0deg, rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          backgroundPosition: '-1px -1px'
        }}
      />

      {/* ヘッダーセクション */}
      <header className="relative z-20 flex justify-between items-center p-6 border-b-4 border-black">
        {/* ロゴ */}
        <div className="flex flex-col p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-[3px]">
            {barHeights.map(({ id, height }) => (
              <div
                key={id}
                className="w-[5px] bg-black"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <div className="mt-1 text-sm font-bold font-display">
            CRAFTING MAGIC...<br />
            PLEASE WAIT
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="hidden md:flex gap-8">
          {['ABOUT', 'WORK', 'CONTACT'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="font-display font-bold tracking-wide px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* ソーシャル/採用 */}
        <div className="hidden md:flex items-center gap-4">
          <a 
            href="#contact" 
            className="font-display font-bold border-4 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Available for freelance work → Hire me
          </a>
          <a 
            href="https://linkedin.com" 
            className="w-12 h-12 flex items-center justify-center border-4 border-black font-display font-bold hover:bg-black hover:text-white transition-colors"
          >
            in
          </a>
        </div>
      </header>

      {/* バイナリコード装飾（上部） */}
      <div className="relative z-20 flex overflow-hidden border-b-4 border-black py-2 font-mono text-xs bg-black text-white">
        {topBinaryCodes.map(({ id, code }) => (
          <span key={id} className="whitespace-nowrap mr-4 last:mr-0">
            {code}
          </span>
        ))}
      </div>

      {/* メインコンテンツエリア */}
      <main className="relative z-20 h-[70vh] border-b-4 border-black" />

      {/* 大きなタイポグラフィ */}
      <div className="relative z-20 p-8 bg-white">
        <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-display text-[clamp(4rem,15vw,12rem)] font-black leading-[0.9] tracking-tighter uppercase">
            CREATIVE<span className="inline-block mx-2 text-[clamp(4rem,10vw,10rem)]">+</span><br />
            DEVELOPER
          </h1>
        </div>
      </div>

      {/* バイナリコード装飾（下部） */}
      <div className="relative z-20 flex overflow-hidden border-t-4 border-black py-2 font-mono text-xs bg-black text-white">
        {bottomBinaryCodes.map(({ id, code }) => (
          <span key={id} className="whitespace-nowrap mr-4 last:mr-0">
            {code}
          </span>
        ))}
      </div>
    </section>
  );
};

export default Hero; 