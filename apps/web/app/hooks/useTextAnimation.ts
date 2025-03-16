import gsap from 'gsap';
import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';
import SplitType from 'split-type';

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
  useEffect(() => {
    if (!elementRef.current) return;

    try {
      // アニメーション対象の要素を取得
      // SplitTypeは直接要素を参照する形に変更
      if (!elementRef.current) return;

      // SplitTypeはsplit-typeクラスを生成するが、直接要素自体をアニメーションすることにする
      const splitElements = elementRef.current.querySelectorAll(`.${animationOptions.splitType}`) ||
                           elementRef.current.querySelectorAll('.char'); // バックアップとしてcharクラスも探す

      // 要素が見つからない場合は、直接子要素をアニメーション対象とする
      const elements = splitElements.length > 0 ?
                       splitElements :
                       Array.from(elementRef.current.children);

      if (elements.length === 0) {
        // もし要素内の文字を直接アニメーションするなら
        gsap.fromTo(
          elementRef.current,
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
            ease: animationOptions.ease,
          }
        );
        return;
      }

      const animation = gsap.fromTo(
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

      // クリーンアップ関数
      return () => {
        animation.kill();
      };
    } catch (error) {
      console.error('Failed to animate text:', error);
      console.warn('テキストアニメーションの初期化に失敗しました');
    }
  }, [elementRef, animationOptions]);
};
