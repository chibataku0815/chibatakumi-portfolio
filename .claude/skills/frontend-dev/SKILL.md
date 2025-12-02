---
name: frontend-dev
description: Frontend development specialist for React, Next.js App Router, Tailwind CSS, shadcn/ui, and Framer Motion. Use this skill for component implementation, responsive layouts, accessibility, and UI/UX development.
---

# frontend-dev

フロントエンド開発担当。React/Next.js でのコンポーネント実装、レイアウト、アクセシビリティを担当する。

## Role Definition

- **責務**: UIコンポーネント実装、レスポンシブ対応、アクセシビリティ、状態管理
- **成果物**: TSXコンポーネント、Tailwindスタイル、Framer Motionアニメーション
- **境界**: WebGL/シェーダーは Specialist に委譲、API設計は Backend に委譲

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Radix UI |
| Animation | Framer Motion |
| State | React hooks, Zustand (必要時) |

## Project Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx      # ルートレイアウト
│   ├── page.tsx        # ホームページ
│   └── globals.css     # グローバルCSS
├── components/
│   ├── ui/             # shadcn/ui コンポーネント
│   └── [Feature].tsx   # 機能コンポーネント
├── hooks/              # カスタムフック
└── lib/                # ユーティリティ
```

## Implementation Guidelines

### Component Structure

```tsx
// 1. imports
import { type FC } from 'react'
import { motion } from 'framer-motion'

// 2. types
interface HeroProps {
  title: string
  subtitle?: string
}

// 3. component
export const Hero: FC<HeroProps> = ({ title, subtitle }) => {
  return (
    <section className="relative h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">{title}</h1>
      {subtitle && <p className="text-lg text-muted">{subtitle}</p>}
    </section>
  )
}
```

### Tailwind Patterns

```tsx
// レスポンシブ
<div className="px-4 md:px-8 lg:px-16">

// ダークモード対応
<div className="bg-white dark:bg-zinc-900">

// コンテナ
<div className="mx-auto max-w-7xl">

// Flexbox レイアウト
<div className="flex flex-col md:flex-row gap-4">

// Grid レイアウト
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Framer Motion Patterns

```tsx
// フェードイン
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>

// スタガー（子要素の順次アニメーション）
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i} variants={item} />)}
</motion.ul>

// ホバー
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
```

### shadcn/ui Usage

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

// バリアント使用
<Button variant="outline" size="lg">Click me</Button>

// カスタマイズ（className で拡張）
<Card className="bg-zinc-900 border-zinc-800">
```

## Accessibility Checklist

- [ ] セマンティックHTML（`<header>`, `<main>`, `<nav>`, `<section>`）
- [ ] 見出し階層（h1 → h2 → h3）
- [ ] 画像に alt 属性
- [ ] インタラクティブ要素にフォーカス表示
- [ ] カラーコントラスト比 4.5:1 以上
- [ ] キーボードナビゲーション対応
- [ ] aria-label / aria-describedby（必要時）

## Responsive Breakpoints

| Prefix | Min Width | 用途 |
|--------|-----------|------|
| (default) | 0px | モバイル |
| `sm:` | 640px | 大きめモバイル |
| `md:` | 768px | タブレット |
| `lg:` | 1024px | デスクトップ |
| `xl:` | 1280px | 大画面 |
| `2xl:` | 1536px | 超大画面 |

## Handoff Protocol

### Specialist (WebGL) との連携

```tsx
// シェーダー背景は Specialist が実装
// Frontend は配置のみ担当

import dynamic from 'next/dynamic'

const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground'),
  { ssr: false }
)

export function Hero() {
  return (
    <section className="relative h-screen">
      {/* Specialist 実装のシェーダー背景 */}
      <ShaderBackground className="absolute inset-0 -z-10" />

      {/* Frontend 担当のコンテンツ */}
      <div className="relative z-10">
        {/* content */}
      </div>
    </section>
  )
}
```

### Backend との連携

```tsx
// Server Component でデータ取得
async function ProjectList() {
  const projects = await fetch('/api/projects').then(r => r.json())

  return (
    <ul>
      {projects.map(p => <ProjectCard key={p.id} {...p} />)}
    </ul>
  )
}
```

## Status Report Format

Coordinator への報告時:

```markdown
## Frontend ステータス

### 完了
- Hero レイアウト実装 (`src/components/Hero.tsx`)

### 進行中
- レスポンシブ対応: 70%

### ブロッカー
- なし

### Specialist 待ち
- ShaderBackground コンポーネント
```

## Anti-patterns

- **過剰なdiv**: セマンティック要素を優先
- **インラインスタイル**: Tailwind を使用
- **any 型**: 適切な型定義を行う
- **巨大コンポーネント**: 単一責任で分割
- **WebGL実装**: Specialist に委譲
