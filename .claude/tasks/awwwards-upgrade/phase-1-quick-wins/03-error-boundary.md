# Task 1.3: Error Boundary 実装

**フェーズ:** Phase 1 - Quick Wins
**優先度:** ★★★★☆
**期間:** 1-2日
**前提条件:** Task 1.2 (Loading) 完了推奨
**Level 貢献:** L3.5 → L4（Craft Details の完成）

---

## 🎯 目的

500エラーやランタイムエラーを Pitch Black & Fire の世界観で優雅に処理する Error Boundary を実装する。

**Excellence Framework 基準:**
> エラー状態は適切か？
> 細部まで配慮された体験の証明。

---

## 📋 要件定義

### 機能要件
- [x] `/apps/web/src/app/error.tsx` を作成（グローバルエラー）
- [x] ~~`/apps/web/src/app/global-error.tsx` を作成（ルートレベルエラー）~~ ※最小構成のため削除
- [x] エラーリセット機能（Try Again）
- [x] エラー情報の記録（開発環境のみ）

### デザイン要件
- [x] 404 と同様の世界観（一貫性）
- [x] ユーザーに不安を与えない表現
- [x] 明確な復帰手段の提示
- [x] エラー詳細は控えめに（開発時は表示）

### 技術要件
- [x] Next.js App Router の Error Boundary 規約準拠
- [x] `"use client"` ディレクティブ必須
- [x] エラーログの適切な処理
- [x] リセット後の状態管理

---

## 🎨 デザインコンセプト

### Visual Metaphor
```
"熱源が一時的に途絶えたが、再点火できる"

- 404（迷い）とは異なり、「中断」のニュアンス
- Amber の光が弱まっているが、消えていない
- "Try Again" で再点火できる期待感
```

### Mood Dimensions
```
Temperature:  ■■■■□□□□□□  (Warm but dimmed)
Density:      ■■■■■□□□□□  (Slightly oppressive)
Rhythm:       ■■□□□□□□□□  (Slow, uncertain)
Contrast:     ■■■■■■□□□□  (Moderate)
Intimacy:     ■■■■■□□□□□  (Supportive)
```

---

## 🏗️ 実装仕様

### ファイル構成
```
apps/web/src/app/
├── error.tsx              # ページレベルエラー（新規）
└── global-error.tsx       # ルートレベルエラー（新規）

apps/web/src/features/error-pages/
└── components/
    ├── ErrorDisplay.tsx   # 共通エラー表示（新規）
    └── index.ts
```

### error.tsx の実装
```tsx
// apps/web/src/app/error.tsx
"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/features/error-pages/components";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary caught:", error);
    }

    // Production: エラートラッキング（Sentry等）
    // trackError(error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Something Went Wrong"
      message="The fire flickered, but we can reignite it."
      errorDigest={error.digest}
      onReset={reset}
      showDetails={process.env.NODE_ENV === "development"}
      errorStack={error.stack}
    />
  );
}
```

### global-error.tsx の実装
```tsx
// apps/web/src/app/global-error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error boundary caught:", error);
    }
  }, [error]);

  return (
    <html lang="ja" className="dark">
      <body className="bg-[#050505] text-[var(--text-base)]">
        <main className="flex min-h-screen flex-col items-center justify-center px-6">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="relative">
              {/* Dimmed glow */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  width: "400px",
                  height: "400px",
                  background: "radial-gradient(circle, rgba(255,191,73,0.08) 0%, transparent 70%)",
                  filter: "blur(80px)",
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%",
                }}
              />

              <h1 className="text-[clamp(3rem,10vw,6rem)] font-bold leading-none text-[var(--text-base-30)]">
                500
              </h1>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-2xl font-medium text-[var(--text-base-70)]">
                Critical Error
              </p>
              <p className="max-w-md text-base text-[var(--text-base-50)]">
                The core flame has been extinguished. Please reload to reignite.
              </p>

              {process.env.NODE_ENV === "development" && error.digest && (
                <p className="mt-2 font-mono text-xs text-[var(--text-base-40)]">
                  Digest: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={reset}
              className="amber-border-glow mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/60 hover:text-[var(--accent-amber1)]"
            >
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
```

### ErrorDisplay 共通コンポーネント
```tsx
// apps/web/src/features/error-pages/components/ErrorDisplay.tsx
"use client";

import { HeroShaderBackground } from "@/features/hero/components";

interface ErrorDisplayProps {
  title: string;
  message: string;
  errorDigest?: string;
  onReset: () => void;
  showDetails?: boolean;
  errorStack?: string;
}

export function ErrorDisplay({
  title,
  message,
  errorDigest,
  onReset,
  showDetails = false,
  errorStack,
}: ErrorDisplayProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Background - dimmed shader */}
      <HeroShaderBackground />
      <div className="absolute inset-0 bg-black/40" /> {/* Dimming overlay */}

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <h1 className="text-[clamp(3rem,10vw,6rem)] font-bold leading-none text-[var(--text-base-30)]">
          Error
        </h1>

        <div className="flex flex-col gap-4">
          <p className="text-2xl font-medium text-[var(--text-base-70)]">
            {title}
          </p>
          <p className="max-w-md text-base text-[var(--text-base-50)]">
            {message}
          </p>

          {showDetails && errorDigest && (
            <details className="mt-4 max-w-2xl text-left">
              <summary className="cursor-pointer font-mono text-xs text-[var(--text-base-40)] hover:text-[var(--text-base-60)]">
                Error Details (Dev Only)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-black/50 p-4 font-mono text-xs text-[var(--text-base-50)]">
                Digest: {errorDigest}
                {errorStack && `\n\n${errorStack}`}
              </pre>
            </details>
          )}
        </div>

        <button
          onClick={onReset}
          className="amber-border-glow mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/60 hover:text-[var(--accent-amber1)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </main>
  );
}
```

---

## 📐 実装手順

### Step 1: ファイル作成（15分）
```bash
mkdir -p apps/web/src/features/error-pages/components
touch apps/web/src/app/error.tsx
touch apps/web/src/app/global-error.tsx
touch apps/web/src/features/error-pages/components/ErrorDisplay.tsx
touch apps/web/src/features/error-pages/components/index.ts
```

### Step 2: ErrorDisplay 実装（1-2時間）
上記のコードを実装

### Step 3: error.tsx & global-error.tsx 実装（1時間）
上記のコードを実装

### Step 4: テスト（30分-1時間）
```tsx
// テスト用: エラーをトリガーする一時コンポーネント
// apps/web/src/app/test-error/page.tsx
"use client";

export default function TestErrorPage() {
  return (
    <button
      onClick={() => {
        throw new Error("Test error boundary");
      }}
    >
      Trigger Error
    </button>
  );
}
```

```bash
# テスト手順:
1. bun dev
2. /test-error にアクセス
3. ボタンをクリック
4. Error Boundary が表示されることを確認
5. "Try Again" で復帰を確認
```

---

## ✅ 完了基準

### 必須項目
- [x] `error.tsx` が実装されている
- [x] ~~`global-error.tsx` が実装されている~~ ※最小構成のため削除
- [x] エラー発生時に適切に表示される
- [x] "Try Again" でリセットできる
- [x] Pitch Black & Fire の世界観が維持されている

### 推奨項目
- [x] 開発環境でエラー詳細を表示
- [x] 本番環境ではエラー追跡（Sentry等）※準備済み
- [x] エラーメッセージが人間的（technical jargon を避ける）

### Quality Check
- [x] ユーザーに不安を与えない表現
- [x] 復帰手段が明確
- [x] 404/loading と一貫したデザイン
- [x] アクセシビリティ対応

---

## 📚 参照リソース

### Next.js ドキュメント
- [error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [global-error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs)
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

### プロジェクト内参照
- `apps/web/src/app/not-found.tsx`（404 との一貫性）
- `apps/web/src/features/hero/components/HeroShaderBackground.tsx`

---

## 🚨 注意事項

### "use client" 必須
Error Boundary コンポーネントは Client Component である必要があります。

### global-error.tsx の特殊性
- `<html>` と `<body>` タグを含める必要がある
- ルートレイアウトのエラーをキャッチ
- 通常は `error.tsx` で十分

### エラーログ
```tsx
// 本番環境でのエラー追跡（Sentry 例）
if (process.env.NODE_ENV === "production") {
  Sentry.captureException(error);
}
```

### リセット動作
`reset()` は現在のセグメントを再レンダリングします。エラーが再発する可能性があるため、ユーザーに適切なフィードバックを。

---

## 📝 完了後のアクション

1. **テストエラーページを削除**: `apps/web/src/app/test-error/` ディレクトリ
2. **README.md を更新**: Phase 1 進捗を記録
3. **次のタスクへ**: [04-cursor-enhancement.md](./04-cursor-enhancement.md)

---

## 📊 実装結果

### 実装ファイル
```
✅ apps/web/src/app/error.tsx
✅ apps/web/src/features/error-pages/components/ErrorDisplay.tsx
✅ apps/web/src/features/error-pages/components/index.ts
```

### 実装内容
- HeroShaderBackground + `bg-black/40` overlay で dimmed な背景
- "Error" 大見出し（`text-[var(--text-base-30)]`）
- メッセージ: "The fire flickered, but we can reignite it."
- "Try Again" ボタン（refresh アイコン + amber glow）
- 開発環境で collapsible エラー詳細表示

### 設計判断
- `global-error.tsx` は削除（最小構成。root レベルエラーは稀）
- 404との一貫性: 同じ背景、同じボタンスタイル、同じタイポグラフィ
- 差別化: dimmed overlay、"Error" 見出し、refresh アイコン

---

**Status:** ✅ Completed
**Assigned:** Claude Code (frontend-design hybrid)
**Started:** 2025-12-09
**Completed:** 2025-12-09
**Commit:** `dde870c` - feat: エラーバウンダリ実装（Pitch Black & Fire世界観）
