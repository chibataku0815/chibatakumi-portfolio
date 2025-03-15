'use client';

/**
 * カードコンポーネント
 *
 * Tailwind CSS v4のコンテナクエリを活用した汎用カードコンポーネント
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// カードのスタイルバリエーションを定義
const cardStyles = cva(
  [
    'transition-all duration-300 overflow-hidden', 
    'relative @container', // コンテナクエリ対応
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white dark:bg-zinc-800',
          'border border-zinc-200 dark:border-zinc-700',
          'shadow-sm hover:shadow-md',
        ],
        outline: [
          'bg-transparent',
          'border border-zinc-200 dark:border-zinc-700',
          'hover:border-[var(--color-primary)]',
        ],
        filled: [
          'bg-zinc-100 dark:bg-zinc-900',
          'border-none',
          'hover:bg-zinc-200 dark:hover:bg-zinc-800',
        ],
        elevated: [
          'bg-white dark:bg-zinc-800',
          'border-none',
          'shadow-md hover:shadow-lg',
        ],
        glass: [
          'glassmorphism', // カスタムユーティリティクラス
          'border border-white/20',
          'hover:shadow-lg',
        ],
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      responsive: {
        true: [
          '@xs:flex-col',
          '@sm:flex-row @sm:items-center',
          '@md:flex-row @md:items-start',
        ],
        false: '',
      },
      clickable: {
        true: 'cursor-pointer hover:-translate-y-1 active:translate-y-0',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      radius: 'md',
      padding: 'md',
      responsive: false,
      clickable: false,
      fullWidth: false,
    },
  }
);

// カードのProps型定義
export type CardVariants = VariantProps<typeof cardStyles>;

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariants {
  as?: React.ElementType;
  href?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className = '',
    variant,
    radius,
    padding,
    responsive,
    clickable,
    fullWidth,
    as: Component = 'div',
    href,
    children,
    ...props
  }, ref) => {
    // href が指定されている場合は a タグとして描画
    const Comp = href ? 'a' : Component;
    
    return (
      <Comp
        ref={ref}
        className={cardStyles({ 
          variant, 
          radius, 
          padding, 
          responsive, 
          clickable, 
          fullWidth, 
          className 
        })}
        href={href}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Card.displayName = 'Card';

// カードヘッダーコンポーネント
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = ({ className = '', children, ...props }: CardHeaderProps) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

// カードボディコンポーネント
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardBody = ({ className = '', children, ...props }: CardBodyProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);

CardBody.displayName = 'CardBody';

// カードフッターコンポーネント
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = ({ className = '', children, ...props }: CardFooterProps) => (
  <div className={`mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 ${className}`} {...props}>
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';

// カードメディアコンポーネント
export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/4' | '9/16';
  position?: 'top' | 'bottom' | 'left' | 'right';
  overlay?: boolean;
}

const CardMedia = ({
  className = '', 
  src, 
  alt = '',
  aspectRatio = '16/9',
  position = 'top',
  overlay = false,
  children,
  ...props 
}: CardMediaProps) => {
  // 画像の位置に基づいてスタイルを調整
  const positionStyle = 
    position === 'top' ? '-mt-4 -mx-4 mb-4' : 
    position === 'bottom' ? '-mb-4 -mx-4 mt-4' : 
    position === 'left' ? '-ml-4 mr-4' : 
    position === 'right' ? '-mr-4 ml-4' : '';
  
  return (
    <div 
      className={`relative overflow-hidden ${positionStyle} ${className}`} 
      style={{ aspectRatio }}
      {...props}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
      />
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
          {children}
        </div>
      )}
      {!overlay && children}
    </div>
  );
};

CardMedia.displayName = 'CardMedia';

export { Card as default, CardHeader, CardBody, CardFooter, CardMedia };