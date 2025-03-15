# Tailwind CSS v4の実装記法まとめ

## 基本設定

### 基本のインポート

```css
/* app/globals.css */
@import "tailwindcss";
```

### テーマ変数の定義

```css
/* 変数の定義 */
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

/* テーマ設定 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

### 色の透明度の設定

```css
/* 透明度の適用 */
.bg-primary-50 {
  background-color: --alpha(var(--color-primary) / 50%);
}
```

## カスタムユーティリティとコンポーネント

### カスタムユーティリティの定義

```css
/* カスタムユーティリティの追加 */
@utility tab-4 {
  tab-size: 4;
}

/* 複数のユーティリティ */
@utility grid-area-auto {
  grid-area: auto;
}
```

### カスタムコンポーネントの定義

```css
/* コンポーネントの定義 */
@tailwind {
  @layer components {
    .btn {
      @apply py-2 px-4 rounded-md transition-colors;
    }
    
    .btn-primary {
      @apply bg-primary text-primary-foreground hover:bg-primary/90;
    }
    
    .card {
      @apply bg-background rounded-lg border shadow-sm;
    }
  }
}
```

## バリアントの使用

### 標準バリアントの使用

```css
/* 要素にバリアントを適用 */
.my-element {
  background: white;
  
  @variant dark {
    background: black;
  }
  
  @variant hover {
    transform: scale(1.05);
  }
  
  @variant lg {
    padding: --spacing(8);
  }
}
```

### カスタムバリアントの定義

```css
/* カスタムバリアントの定義 */
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
@custom-variant pointer-coarse (@media (pointer: coarse));

/* カスタムバリアントの使用 */
.custom-element {
  @variant theme-midnight {
    background: #121212;
  }
  
  @variant pointer-coarse {
    padding: --spacing(6);
  }
}
```

## React/Next.jsでの使用例

### Next.jsのグローバルCSS

```css
/* app/globals.css */
@import "tailwindcss";

/* テーマ変数 */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221.2 83.2% 53.3%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 91.2% 59.8%);
  --card: hsl(222.2 84% 4.9%);
  --card-foreground: hsl(210 40% 98%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
}

/* カスタムコンポーネント */
@tailwind {
  @layer components {
    .btn {
      @apply rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2;
    }
  }
  
  @layer utilities {
    .content-auto {
      content-visibility: auto;
    }
  }
}
```

### Reactコンポーネント（Shadcn v4対応）

```jsx
// components/ui/button.jsx
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "bg-destructive text-destructive-foreground": variant === "destructive",
          "border border-input bg-background": variant === "outline",
          "size-9": size === "sm",
          "size-10": size === "default",
          "size-11": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
```

### カードコンポーネント

```jsx
// components/ui/card.jsx
function Card({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-content" 
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}
```

## チャートでの色の使用

```jsx
// components/analytics/chart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

function AnalyticsChart({ data }) {
  // v4ではhsl()ラッパーが不要
  const chartConfig = {
    visitors: {
      name: "訪問者",
      color: "var(--primary)", // 以前: "hsl(var(--primary))"
    },
    revenue: {
      name: "売上",
      color: "var(--secondary)", // 以前: "hsl(var(--secondary))"
    }
  };
  
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line 
        type="monotone" 
        dataKey="visitors" 
        name={chartConfig.visitors.name}
        stroke={chartConfig.visitors.color} 
      />
      <Line 
        type="monotone" 
        dataKey="revenue" 
        name={chartConfig.revenue.name}
        stroke={chartConfig.revenue.color} 
      />
    </LineChart>
  );
}
```

## size-*ユーティリティの使用

```jsx
// 以前のw-*とh-*を組み合わせる記法
<div className="w-10 h-10 rounded-full bg-primary"></div>

// v4のsize-*ユーティリティを使用
<div className="size-10 rounded-full bg-primary"></div>

// 異なるサイズにも対応
<div className="size-[42px] rounded-full bg-primary"></div>
```

## テーマの切り替え例

```jsx
// app/theme-provider.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

## 実際のページでの使用例

```jsx
// app/page.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnalyticsChart from "@/components/analytics/chart";

export default function Dashboard() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">ダッシュボード</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>総売上</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">¥1,234,567</p>
            <p className="text-muted-foreground">先月比 +12%</p>
          </CardContent>
        </Card>
        
        {/* その他のカード */}
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>売上推移</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <AnalyticsChart data={analyticsData} />
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex gap-4">
        <Button>デフォルト</Button>
        <Button variant="destructive">削除</Button>
        <Button variant="outline">詳細</Button>
      </div>
    </main>
  );
}
```

これらの記法を活用することで、Tailwind CSS v4とNext.js、shadcn/UIを組み合わせた効率的で一貫性のあるUIを構築できます。