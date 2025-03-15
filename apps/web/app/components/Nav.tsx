'use client';

import { useTransitionRouter } from 'next-view-transitions';

/**
 * ナビゲーションコンポーネント
 * ページ間のトランジション効果を持つナビゲーションを提供します
 */
const Nav = () => {
  const router = useTransitionRouter();

  /**
   * ページトランジションを実行する関数
   * 古いページをフェードアウトし、新しいページをスライドインさせます
   */
  const slideInOut = () => {
    // 古いページのアニメーション
    document.documentElement.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0.2, transform: 'translateY(-35%)' }
      ],
      {
        duration: 1500,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        fill: 'forwards',
        pseudoElement: '::view-transition-old(root)'
      }
    );

    // 新しいページのアニメーション
    document.documentElement.animate(
      [
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0 0 0 0)' }
      ],
      {
        duration: 1500,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        fill: 'forwards',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  };

  return (
    <nav className="nav">
      <div className="logo">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            router.push('/', { onTransitionReady: slideInOut });
          }}
        >
          Portfolio
        </a>
      </div>
      <div className="links">
        <a
          href="/projects"
          onClick={(e) => {
            e.preventDefault();
            router.push('/projects', { onTransitionReady: slideInOut });
          }}
        >
          Projects
        </a>
        <a
          href="/info"
          onClick={(e) => {
            e.preventDefault();
            router.push('/info', { onTransitionReady: slideInOut });
          }}
        >
          Info
        </a>
      </div>
    </nav>
  );
};

export default Nav; 