'use client';

/**
 * ボタンコンポーネント
 *
 * Tailwind CSS v4の新機能を活用した汎用ボタンコンポーネント
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ボタンのスタイルバリエーションを定義
const buttonStyles = cva(
  [
    'inline-flex items-center justify-center rounded',
    'font-medium transition-all focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'relative overflow-hidden', // リップルエフェクト用
  ],
  {
    variants: {
      intent: {
        primary: [
          'bg-[var(--color-primary)] text-white',
          'hover:bg-[color-mix(in_srgb,var(--color-primary),black_10%)]',
          'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-50',
        ],
        secondary: [
          'bg-[var(--color-secondary)] text-white',
          'hover:bg-[color-mix(in_srgb,var(--color-secondary),black_10%)]',
          'focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-opacity-50',
        ],
        accent: [
          'bg-[var(--color-accent)] text-white',
          'hover:bg-[color-mix(in_srgb,var(--color-accent),black_10%)]',
          'focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-50',
        ],
        outline: [
          'bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)]',
          'hover:bg-[var(--color-primary)] hover:text-white',
          'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-50',
        ],
        ghost: [
          'bg-transparent text-[var(--color-primary)]',
          'hover:bg-[var(--color-primary)] hover:bg-opacity-10',
          'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-50',
        ],
      },
      size: {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-base px-4 py-2 h-10',
        lg: 'text-lg px-6 py-2.5 h-12',
      },
      fullWidth: {
        true: 'w-full',
      },
      rounded: {
        true: 'rounded-full',
        false: 'rounded',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
      fullWidth: false,
      rounded: false,
    },
  }
);

// ボタンのProps型定義
export type ButtonVariants = VariantProps<typeof buttonStyles>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  isLoading?: boolean;
  className?: string;
}

// リップルエフェクトのカスタムフック
const useRippleEffect = () => {
  const [ripples, setRipples] = React.useState<{ x: number; y: number; size: number }[]>([]);
  
  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(buttonRect.width, buttonRect.height);
    const x = e.clientX - buttonRect.left - size / 2;
    const y = e.clientY - buttonRect.top - size / 2;
    
    const newRipple = { x, y, size };
    setRipples([...ripples, newRipple]);
    
    // アニメーション後にripplesから削除
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== newRipple));
    }, 1000); // アニメーション時間
  };
  
  return {
    ripples,
    addRipple,
  };
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className = '', 
    intent, 
    size, 
    fullWidth, 
    rounded,
    isLoading = false,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    // リップルエフェクト
    const { ripples, addRipple } = useRippleEffect();
    
    // クリックハンドラー
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      addRipple(e); // リップルエフェクトを追加
      onClick?.(e); // 元のonClickを呼び出し
    };
    
    return (
      <button
        ref={ref}
        className={buttonStyles({ intent, size, fullWidth, rounded, className })}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* ローディングスピナー */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="読み込み中"
              role="img"
            >
              <title>読み込み中</title>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        {/* コンテンツ - ローディング中は透明にする */}
        <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
          {children}
        </span>
        
        {/* リップルエフェクト */}
        {ripples.map((ripple, i) => {
          // 一意のIDを生成
          const uniqueId = `${ripple.x}-${ripple.y}-${ripple.size}-${Date.now()}-${i}`;
          return (
            <span
              key={uniqueId}
              className="absolute rounded-full bg-white bg-opacity-30"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                animation: 'ripple 1s linear',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;