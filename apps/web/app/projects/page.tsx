'use client';

import { ReactLenis } from '@studio-freight/react-lenis';

/**
 * プロジェクトページコンポーネント
 * プロジェクト画像のグリッドを表示します
 */
export default function Projects() {
  return (
    <ReactLenis root>
      <div className="projects">
        <div className="projects-container">
          <img src="/project1.jpg" alt="Project 1" />
          <img src="/project2.jpg" alt="Project 2" />
          <img src="/project3.jpg" alt="Project 3" />
          <img src="/project4.jpg" alt="Project 4" />
        </div>
      </div>
    </ReactLenis>
  );
} 