/**
 * テーマトグルコンポーネント
 * 
 * ライト/ダークモードを切り替えるためのボタンコンポーネント
 * Tailwind CSS v4の新機能を活用し、ハイドレーション対策済み
 */

'use client';

import { useEffect, useState } from 'react';
import type { FC } from 'react';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ className = '' }) => {
  // システムのデフォルト設定を初期値として使用
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // サーバーサイドでのデフォルト値
  });

  useEffect(() => {
    // テーマの初期設定
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // メディアクエリの変更を監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // テーマを切り替える関数
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      type="button"
      className={`relative inline-flex h-10 w-16 items-center rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors duration-300 ${className}`}
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      <span className="sr-only">
        {isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      </span>
      
      {/* トグルスイッチの丸い部分 */}
      <span
        className={`
          ${isDarkMode ? 'translate-x-7 bg-zinc-800' : 'translate-x-1 bg-white'}
          inline-block h-8 w-8 rounded-full shadow transition-transform duration-300
          flex items-center justify-center
        `}
      >
        {/* ライトモードアイコン */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-yellow-400 ${isDarkMode ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          role="img"
        >
          <title>太陽アイコン</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        
        {/* ダークモードアイコン */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute h-5 w-5 text-yellow-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          role="img"
        >
          <title>月アイコン</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </span>
    </button>
  );
};

export default ThemeToggle;