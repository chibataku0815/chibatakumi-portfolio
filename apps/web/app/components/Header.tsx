'use client';

import { GitBranch, GithubLogo } from '@phosphor-icons/react';

/**
 * ヘッダーコンポーネント
 * サイト全体で使用される共通のナビゲーションヘッダー
 * 
 * @component
 */
const Header = () => {
  // バーコードの高さ配列
  const barHeights = [
    { id: 'bar1', height: 40 },
    { id: 'bar2', height: 25 },
    { id: 'bar3', height: 40 },
    { id: 'bar4', height: 35 },
    { id: 'bar5', height: 30 }
  ];

  return (
    <header className="relative z-20 flex justify-between items-center p-6 border-b-4 border-black bg-black">
      {/* ロゴ */}
      <div className="flex flex-col p-4 bg-black border-4 border-black">
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
          href="https://github.com/chibatakumi" 
          className="w-12 h-12 flex items-center justify-center border-4 border-black font-display font-bold hover:bg-black hover:text-white transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitBranch size={32} weight="fill" />
        </a>
      </div>
    </header>
  );
};

export default Header; 