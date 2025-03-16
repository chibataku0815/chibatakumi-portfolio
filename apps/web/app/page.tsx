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

  return (
    <main className="home">


      <Hero />

    </main>
  );
}
