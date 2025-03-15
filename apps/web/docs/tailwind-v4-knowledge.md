# Tailwind CSS v4 ナレッジベース

## 概要
Tailwind CSS v4は大幅なパフォーマンス向上と新機能を備えた最新バージョンのTailwind CSSフレームワークです。この文書では、v4の主な特徴、セットアップ方法、および新機能の使用例をまとめています。

## 主な特徴

- **高速化されたビルドエンジン**: フルビルドが最大5倍速く、インクリメンタルビルドが100倍以上高速化
- **CSS-first 設定アプローチ**: JavaScript設定よりもCSSファイル内での設定を推奨
- **シンプルな依存関係**: 設定の複雑さを減らし、より簡単にインストール可能
- **分離されたPostCSSプラグイン**: `@tailwindcss/postcss`として独立したパッケージに
- **ビルトインのインポートサポート**: 複数のCSSファイルを効率的に扱える
- **最新のCSS機能**: カスケードレイヤー、カスタムプロパティ、カラーミックスなどをサポート

## セットアップ手順

### 1. パッケージのインストール

```bash
# 基本パッケージのインストール
bun install -D tailwindcss@latest postcss@latest autoprefixer@latest

# PostCSSプラグインのインストール（v4では必須）
bun add -D @tailwindcss/postcss
```

### 2. 設定ファイルの作成

#### tailwind.config.js
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

#### postcss.config.js
```javascript
/** @type {import('postcss').Config} */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 3. グローバルCSSの設定

```css
@import "tailwindcss";

:root {
  /* カスタム変数の定義 */
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --color-accent: #f59e0b;
}

/* カスタムコンポーネントの定義 */
.fade-in {
  @starting-style {
    opacity: 0;
    transform: translateY(10px);
  }
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease-in-out;
}
```

## 新機能の使用例

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

### @starting-style による入場/退場トランジション

CSSの`@starting-style`を使用して、JavaScriptなしで要素の入場/退場トランジションを定義できます。

```css
.fade-in {
  @starting-style {
    opacity: 0;
    transform: translateY(10px);
  }
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease-in-out;
}
```

### カラーミックス機能

CSS Color Mixing APIを使用して色を動的に混合できます。

```jsx
<div style={{ background: "color-mix(in srgb, var(--color-primary) 50%, var(--color-accent) 50%)" }} />
```

### フィールドサイジング

フォーム要素のサイズ統一が簡単になります。

```jsx
<input
  type="text"
  className="field-sizing:content p-2 border rounded"
  aria-label="名前"
/>
<select 
  className="field-sizing:content p-2 border rounded"
  aria-label="選択肢"
>
  <option>選択してください</option>
</select>
```

## トラブルシューティング

### 一般的な問題と解決策

1. **PostCSSプラグインエラー**
   - エラー: `It looks like you're trying to use tailwindcss directly as a PostCSS plugin`
   - 解決策: `@tailwindcss/postcss`パッケージをインストールし、postcss.config.jsを更新

2. **インポートエラー**
   - エラー: `Package path ./base is not exported from package`
   - 解決策: `@import "tailwindcss/base"`ではなく`@import "tailwindcss"`を使用

3. **TypeScriptエラー（カスタムプロパティ）**
   - エラー: `Object literal may only specify known properties`
   - 解決策: `// @ts-ignore`コメントを追加するか、型定義を拡張

4. **Next.jsのサーバーコンポーネントエラー**
   - エラー: `useState only works in Client Components`
   - 解決策: Reactフックを使用するコンポーネントの先頭に`'use client'`ディレクティブを追加する
   ```jsx
   'use client';
   
   import React from 'react';
   // コンポーネントの残りの部分
   ```
   - 注意: ダークモード切り替えや、インタラクティブなUI要素（ボタンのリップルエフェクトなど）を実装する場合、`'use client'`が必要

## 参考リソース

- [Tailwind CSS v4 公式ドキュメント](https://tailwindcss.com/docs)
- [Tailwind CSS v4 リリースノート](https://tailwindcss.com/blog/tailwindcss-v4)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)