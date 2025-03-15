import Lenis from 'lenis';
import { useEffect, useCallback } from 'react';

/**
 * スクロールの方向を定義
 */
type ScrollOrientation = 'vertical' | 'horizontal';

/**
 * Lenisスムーススクロールのオプション
 */
interface LenisOptions {
  /** スクロールの持続時間（秒） @default 1.2 */
  duration?: number;
  /** イージング関数 @default (t) => Math.min(1, 1.001 - 2 ** (-10 * t)) */
  easing?: (t: number) => number;
  /** スクロールの方向 @default 'vertical' */
  orientation?: ScrollOrientation;
  /** マウスホイールのスムーススクロールを有効にするか @default true */
  smoothWheel?: boolean;
  /** タッチデバイスのスムーススクロールを有効にするか @default false */
  smoothTouch?: boolean;
  /** タッチ操作の感度 @default 1.5 */
  touchMultiplier?: number;
}

/**
 * デフォルトのLenisオプション
 */
const DEFAULT_OPTIONS: Required<Pick<LenisOptions, 'duration' | 'orientation' | 'smoothWheel'>> = {
  duration: 1.2,
  orientation: 'vertical',
  smoothWheel: true,
};

/**
 * デフォルトのイージング関数
 */
const defaultEasing = (t: number): number => Math.min(1, 1.001 - 2 ** (-10 * t));

/**
 * Lenisスムーススクロールを管理するカスタムフック
 * @param options - Lenisの設定オプション
 * @returns void
 * @example
 * const lenis = useLenis({
 *   duration: 1.5,
 *   orientation: 'horizontal',
 *   smoothWheel: false,
 *   smoothTouch: true,
 *   touchMultiplier: 2,
 */
export const useLenis = (options: LenisOptions = {}): void => {
  // アニメーションフレームの更新関数をメモ化
  const animate = useCallback((lenis: Lenis) => {
    const raf = (time: number): void => {
      lenis.raf(time);
      requestAnimationFrame((t) => raf(t));
    };
    requestAnimationFrame((t) => raf(t));
  }, []);

  useEffect(() => {
    try {
      // オプションの設定
      const lenisOptions: LenisOptions = {
        ...DEFAULT_OPTIONS,
        easing: defaultEasing,
        ...options,
      };

      // Lenisのインスタンスを作成
      const lenis = new Lenis(lenisOptions);

      // アニメーションの開始
      animate(lenis);

      // クリーンアップ
      return () => {
        lenis.destroy();
      };
    } catch (error) {
      console.error('Failed to initialize Lenis:', error);
      throw new Error('スムーススクロールの初期化に失敗しました');
    }
  }, [options, animate]);
}; 