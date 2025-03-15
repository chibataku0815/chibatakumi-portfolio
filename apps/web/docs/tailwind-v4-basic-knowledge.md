# Tailwind CSS v4 ナレッジベース

## 概要
Tailwind CSS v4は大幅なパフォーマンス向上と新機能を備えた最新バージョンのTailwind CSSフレームワークです。この文書では、v4の主な特徴、セットアップ方法、および新機能の使用例をまとめています。

## 主な特徴

- **高速化されたビルドエンジン**: フルビルドが最大5倍速く、インクリメンタルビルドが100倍以上高速化
- **CSS-first 設定アプローチ**: JavaScript設定よりもCSSファイル内での設定を推奨
- **シンプルな依存関係**: 設定の複雑さを減らし、より簡単にインストール可能
- **ビルトインのLightning CSS**: PostCSSプラグインが不要になり、ベンダープレフィックスと最新構文の変換を内部処理
- **ビルトインのインポートサポート**: 複数のCSSファイルを効率的に扱える
- **最新のCSS機能**: カスケードレイヤー、カスタムプロパティ、カラーミックスなどをサポート

## セットアップ手順

### 1. パッケージのインストール

```bash
# 基本パッケージのインストール
bun install -D tailwindcss@latest

# Viteプロジェクトでは@tailwindcss/viteプラグインを使用可能
bun add -D @tailwindcss/vite
```

### 2. 設定ファイルの作成（オプション）

Tailwind v4ではJavaScript設定ファイルは必須ではなくなりましたが、コンテンツの検出などのために使用できます：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}
```

### 3. グローバルCSSの設定

```css
@import "tailwindcss";

/* 基本的な変数定義 */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221.2 83.2% 53.3%);
  --primary-foreground: hsl(210 40% 98%);
}

/* ダークモード変数 */
.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 91.2% 59.8%);
  --primary-foreground: hsl(222.2 47.4% 11.2%);
}

/* テーマ設定 - インライン変数を使用 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}

/* カスタムコンポーネントの定義 */
@tailwind {
  @layer components {
    .btn {
      @apply py-2 px-4 rounded-md transition-colors;
    }
  }
}
```

## 新機能の使用例

### @themeディレクティブによるテーマ設定

CSSファイル内でテーマ変数を直接定義できます：

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.72 0.11 178);
  --color-accent: oklch(0.85 0.2 100);
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 120rem;
}
```

### コンテナクエリ

コンテナクエリを使用すると、親要素のサイズに基づいてスタイルを変更できます。

```jsx
<div className="@container">
  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6 shadow-lg 
                @sm:grid @sm:grid-cols-2 @md:grid-cols-3 gap-4">
    <div className="bg-white dark:bg-zinc-700 rounded p-4 mb-4 @sm:mb-0">
      <h2 className="text-lg font-semibold mb-2">カード 1</h2>
      <p>コンテナサイズに応じてレイアウトが変化します。</p>
    </div>
    {/* 他のカード */}
  </div>
</div>
```

### カスタムユーティリティの定義

@utilityディレクティブを使用して独自のユーティリティクラスを作成できます：

```css
@utility tab-4 {
  tab-size: 4;
}

@utility grid-area-auto {
  grid-area: auto;
}
```

### size-*ユーティリティの使用

w-*とh-*を組み合わせる代わりに、新しいsize-*ユーティリティを使用できます：

```jsx
// 以前の方法
<div className="w-10 h-10 rounded-full bg-primary"></div>

// v4の方法
<div className="size-10 rounded-full bg-primary"></div>
```

### data-slotによるスタイリング

shadcn/UIなどのコンポーネントライブラリとの連携で使用されるdata-slot属性：

```jsx
function Button({
  className,
  variant = "default",
  ...props
}) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        className
      )}
      {...props}
    />
  );
}
```

スタイルの適用：

```css
[data-slot="button"] {
  @apply py-2 px-4 focus-visible:outline-none;
}
```

### OKLCH色空間

HSL色表記からOKLCH色空間への移行でより正確な色表現が可能になりました：

```css
:root {
  --primary: oklch(0.6 0.24 260); /* より知覚的に均一な色空間 */
}
```

## トラブルシューティング

### 一般的な問題と解決策

1. **インポートエラー**
   - エラー: `Package path ./base is not exported from package`
   - 解決策: `@import "tailwindcss/base"`ではなく`@import "tailwindcss"`を使用

2. **TypeScriptエラー（カスタムプロパティ）**
   - エラー: `Object literal may only specify known properties`
   - 解決策: `// @ts-ignore`コメントを追加するか、型定義を拡張

3. **Next.jsのサーバーコンポーネントエラー**
   - エラー: `useState only works in Client Components`
   - 解決策: Reactフックを使用するコンポーネントの先頭に`'use client'`ディレクティブを追加する
   ```jsx
   'use client';
   
   import React from 'react';
   // コンポーネントの残りの部分
   ```

4. **ブラウザの互換性問題**
   - 問題: Tailwind v4は最新のブラウザ機能を利用しているため、古いブラウザでは動作しない場合があります
   - 解決策: [compatibility](https://tailwindcss.com/docs/compatibility)ドキュメントを確認し、必要に応じてポリフィルを追加

## 参考リソース

- [Tailwind CSS v4 公式ドキュメント](https://tailwindcss.com/docs)
- [Tailwind CSS v4 リリースノート](https://tailwindcss.com/blog/tailwindcss-v4)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [shadcn/UIのTailwind v4ガイド](https://ui.shadcn.com/docs/tailwind-v4)