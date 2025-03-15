'use client';

import Image from "next/image";
import { useLenis } from '../hooks/useLenis';

/**
 * プロジェクトページコンポーネント
 * プロジェクト画像のグリッドを表示します
 */
export default function Projects() {
  // スムーススクロールの初期化
  useLenis();

  return (
    <main className="projects">
      <section className="w-screen h-full min-h-screen bg-bg py-80 px-4">
        <div className="images mx-auto flex flex-col gap-8">
          <div className="image relative aspect-video">
            <Image src="/images/project1.jpg" alt="Project 1" fill className="object-cover" />
          </div>
          <div className="image relative aspect-video">
            <Image src="/images/project2.jpg" alt="Project 2" fill className="object-cover" />
          </div>
          <div className="image relative aspect-video">
            <Image src="/images/project3.jpg" alt="Project 3" fill className="object-cover" />
          </div>
          <div className="image relative aspect-video">
            <Image src="/images/project4.jpg" alt="Project 4" fill className="object-cover" />
          </div>
        </div>
      </section>
    </main>
  );
} 