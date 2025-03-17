'use client';

/**   
 * ヒーローセクションコンポーネント
 * モノトーンのニューブルータリズムデザインを採用したポートフォリオのメインビジュアル
 * 
 * @component
 */
const Hero = () => {
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