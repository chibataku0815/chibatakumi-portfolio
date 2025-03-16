'use client';

import Hero from './components/Hero';

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
