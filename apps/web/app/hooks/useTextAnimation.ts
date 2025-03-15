import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitType from 'split-type';
import type { RefObject } from 'react';
import { useEffect, useCallback } from 'react';

/**
 * GSAPのイージング関数の型定義
 */
type EaseType = 'power4.out' | 'power3.out' | 'power2.out' | 'power1.out' | 'expo.out' | 'back.out';

/**
 * テキストの分割タイプ
 */
type SplitTypes = 'chars' | 'lines' | 'words';

/**
 * テキストアニメーションの設定オプション
 */
interface TextAnimationOptions {
  /** アニメーションの持続時間（秒） @default 1 */
  duration?: number;
  /** アニメーションの遅延時間（文字ごと、秒） @default 0.02 */
  stagger?: number;
  /** イージング関数 @default 'power4.out' */
  ease?: EaseType;
  /** 開始時の不透明度 @default 0 */
  startOpacity?: number;
  /** 開始時のY座標オフセット（ピクセル） @default 100 */
  startY?: number;
  /** 開始時のX回転角度（度） @default -90 */
  startRotateX?: number;
  /** テキストの分割タイプ @default 'lines' */
  splitType?: SplitTypes;
}

/**
 * デフォルトのアニメーションオプション
 */
const DEFAULT_OPTIONS: Required<TextAnimationOptions> = {
  duration: 1,
  stagger: 0.02,
  ease: 'power4.out',
  startOpacity: 0,
  startY: 100,
  startRotateX: -90,
  splitType: 'lines',
};

/**
 * テキストアニメーションを管理するカスタムフック
 * @param elementRef - アニメーション対象の要素への参照
 * @param options - アニメーションの設定オプション
 * @returns void
 * @throws {Error} テキストの分割やアニメーションの初期化に失敗した場合
 * @example
 * const textRef = useRef<HTMLHeadingElement>(null);
 * useTextAnimation(textRef, {
 *   duration: 1.5,
 *   stagger: 0.05,
 *   ease: 'expo.out',
 *   splitType: 'chars',
 * });
 */
export const useTextAnimation = <T extends HTMLElement>(
  elementRef: RefObject<T | null>,
  options: TextAnimationOptions = {}
): void => {
  // オプションの設定
  const animationOptions = { ...DEFAULT_OPTIONS, ...options };

  // テキストを分割する関数をメモ化
  const splitText = useCallback(() => {
    if (!elementRef.current) return;
    try {
      new SplitType(elementRef.current, { types: animationOptions.splitType });
    } catch (error) {
      console.error('Failed to split text:', error);
      throw new Error('テキストの分割に失敗しました');
    }
  }, [elementRef, animationOptions.splitType]);

  // 初期分割の実行
  useEffect(() => {
    splitText();
  }, [splitText]);

  // アニメーションの実行
  useGSAP(() => {
    if (!elementRef.current) return;

    try {
      // アニメーション対象の要素を取得
      const elements = gsap.utils.toArray<HTMLElement>(`.${animationOptions.splitType}`);
      if (elements.length === 0) {
        console.warn(`アニメーション対象の要素が見つかりません: .${animationOptions.splitType}`);
        return; // エラーをスローする代わりに早期リターン
      }

      gsap.fromTo(
        elements,
        {
          opacity: animationOptions.startOpacity,
          y: animationOptions.startY,
          rotateX: animationOptions.startRotateX,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: animationOptions.duration,
          stagger: animationOptions.stagger,
          ease: animationOptions.ease,
        }
      );
    } catch (error) {
      console.error('Failed to animate text:', error);
      throw new Error('テキストアニメーションの初期化に失敗しました');
    }
  }, [elementRef, animationOptions]);
}; 