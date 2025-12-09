# Task 1.4: Cursor Enhancement 実装

**フェーズ:** Phase 1 - Quick Wins
**優先度:** ★★★☆☆
**期間:** 3-5日
**前提条件:** なし
**Level 貢献:** L4（インタラクション品質の向上）

---

## 🎯 目的

カーソルインタラクションを強化し、サイト全体の「触覚フィードバック」を向上させる。

**Excellence Framework 基準:**
> カーソル変化に意図があるか？
> インタラクションの細部が Level 5 への橋渡し。

**参照サイト:**
- Aristide Benoist: カーソルが体験の一部
- Dennis Snellenberg: 磁力効果の美しい実装

---

## 📋 要件定義

### 機能要件
- [ ] カスタムカーソルの実装
- [ ] リンク/ボタンへのホバー反応
- [ ] カーソル追従の光エフェクト
- [ ] インタラクティブ要素への磁力効果（optional）

### デザイン要件
- [ ] Pitch Black & Fire の世界観に沿ったカーソル
- [ ] Amber のアクセントカラー使用
- [ ] 過度に派手にせず、洗練された動き
- [ ] ページ遷移時も一貫性維持

### 技術要件
- [ ] GSAP での滑らかなアニメーション
- [ ] パフォーマンス影響最小化
- [ ] モバイルでは無効化（タッチデバイス）
- [ ] アクセシビリティ配慮

---

## 🎨 デザインコンセプト

### Visual Metaphor
```
"暗闇を照らす小さな火種"

- デフォルト: 小さな Amber のドット
- ホバー: ドットが拡大し、対象要素を「照らす」
- クリック: 瞬間的な火花
```

### Cursor States
```
State          | Size | Color       | Behavior
---------------|------|-------------|------------------
Default        | 8px  | Amber 50%   | Smooth follow
Link/Button    | 24px | Amber 100%  | Scale up, glow
Draggable      | 16px | Amber 70%   | Rotate hint
Text Selection | 2px  | Amber 30%   | Vertical line
```

---

## 🏗️ 実装仕様

### ファイル構成
```
apps/web/src/features/cursor/
├── components/
│   ├── CustomCursor.tsx       # メインカーソル（新規）
│   └── CursorProvider.tsx     # Context Provider（新規）
├── hooks/
│   └── useCursor.ts           # カーソル制御 hook（新規）
└── index.ts

apps/web/src/app/layout.tsx    # CursorProvider を追加
```

### CustomCursor の実装
```tsx
// apps/web/src/features/cursor/components/CustomCursor.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type CursorState = "default" | "hover" | "click";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorInnerRef = useRef<HTMLDivElement>(null);
  const [cursorState, setCursorState] = useState<CursorState>("default");

  useEffect(() => {
    // モバイル/タッチデバイスでは無効化
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const cursor = cursorRef.current;
    const cursorInner = cursorInnerRef.current;
    if (!cursor || !cursorInner) return;

    // Hide default cursor
    document.body.style.cursor = "none";

    // Cursor follow
    const handlePointerMove = (e: PointerEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: "power2.out",
      });

      gsap.to(cursorInner, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: "power3.out",
      });
    };

    // Hover detection
    const handleMouseEnter = () => setCursorState("hover");
    const handleMouseLeave = () => setCursorState("default");
    const handleMouseDown = () => setCursorState("click");
    const handleMouseUp = () => setCursorState("hover");

    // Attach listeners to interactive elements
    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input, textarea, select'
    );

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
      el.addEventListener("mousedown", handleMouseDown);
      el.addEventListener("mouseup", handleMouseUp);
    });

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      document.body.style.cursor = "auto";
      window.removeEventListener("pointermove", handlePointerMove);

      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        el.removeEventListener("mousedown", handleMouseDown);
        el.removeEventListener("mouseup", handleMouseUp);
      });
    };
  }, []);

  // Update cursor appearance based on state
  useEffect(() => {
    if (!cursorRef.current || !cursorInnerRef.current) return;

    const sizes = {
      default: { outer: 32, inner: 8 },
      hover: { outer: 48, inner: 24 },
      click: { outer: 40, inner: 16 },
    };

    const { outer, inner } = sizes[cursorState];

    gsap.to(cursorRef.current, {
      width: outer,
      height: outer,
      duration: 0.3,
      ease: "power2.out",
    });

    gsap.to(cursorInnerRef.current, {
      width: inner,
      height: inner,
      duration: 0.2,
      ease: "power2.out",
    });
  }, [cursorState]);

  return (
    <>
      {/* Outer cursor (glow) */}
      <div
        ref={cursorRef}
        className="custom-cursor-outer pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-[9999] rounded-full"
        style={{
          width: "32px",
          height: "32px",
          background: "radial-gradient(circle, rgba(255,191,73,0.2) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Inner cursor (dot) */}
      <div
        ref={cursorInnerRef}
        className="custom-cursor-inner pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-[9999] rounded-full bg-[var(--accent-amber1)]"
        style={{
          width: "8px",
          height: "8px",
          boxShadow: "0 0 8px rgba(255,191,73,0.6)",
        }}
      />
    </>
  );
}
```

### CursorProvider の実装
```tsx
// apps/web/src/features/cursor/components/CursorProvider.tsx
"use client";

import { CustomCursor } from "./CustomCursor";

export function CursorProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      {children}
    </>
  );
}
```

### layout.tsx に追加
```tsx
// apps/web/src/app/layout.tsx
import { CursorProvider } from "@/features/cursor/components";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <HeroShaderBackground />

        <CursorProvider>
          <PageTransition>
            <Nav />
            {children}
          </PageTransition>
        </CursorProvider>
      </body>
    </html>
  );
}
```

---

## 📐 実装手順

### Step 1: ファイル作成（15分）
```bash
mkdir -p apps/web/src/features/cursor/{components,hooks}
touch apps/web/src/features/cursor/components/CustomCursor.tsx
touch apps/web/src/features/cursor/components/CursorProvider.tsx
touch apps/web/src/features/cursor/components/index.ts
touch apps/web/src/features/cursor/hooks/useCursor.ts
touch apps/web/src/features/cursor/index.ts
```

### Step 2: CustomCursor 実装（3-4時間）
上記のコードを実装

**拡張オプション:**
- Magnetic effect（要素に近づくとカーソルが吸い寄せられる）
- Click ripple effect（クリック時の波紋）

### Step 3: CursorProvider & layout.tsx 統合（1時間）
上記のコードを実装

### Step 4: CSS グローバルスタイル追加（30分）
```css
/* apps/web/src/app/globals.css */

/* Hide default cursor on desktop */
@media (pointer: fine) {
  * {
    cursor: none !important;
  }

  a, button, [role="button"] {
    cursor: none !important;
  }
}

/* Show default cursor on mobile/touch */
@media (pointer: coarse) {
  .custom-cursor-outer,
  .custom-cursor-inner {
    display: none !important;
  }
}
```

### Step 5: テスト（1-2時間）
```bash
bun dev

# 確認項目:
# - カーソルが Amber のドットで表示される
# - リンク/ボタンホバー時に拡大する
# - クリック時に反応する
# - モバイルでは通常カーソルが表示される
# - ページ遷移時も一貫性がある
```

---

## ✅ 完了基準

### 必須項目
- [ ] カスタムカーソルが実装されている
- [ ] リンク/ボタンへのホバー反応
- [ ] Pitch Black & Fire の世界観に沿っている
- [ ] モバイル/タッチデバイスで無効化
- [ ] パフォーマンス影響なし（60fps 維持）

### 推奨項目
- [ ] Magnetic effect（要素への吸引）
- [ ] Click ripple effect
- [ ] テキスト選択時の縦線カーソル

### Quality Check
- [ ] カーソルの動きが滑らか
- [ ] ホバー反応が即座
- [ ] 過度に派手でない
- [ ] アクセシビリティに悪影響なし

---

## 🎨 拡張オプション（Advanced）

### Magnetic Cursor Effect
```tsx
// apps/web/src/features/cursor/hooks/useMagneticCursor.ts
import { useEffect, RefObject } from "react";
import gsap from "gsap";

export function useMagneticCursor(
  targetRef: RefObject<HTMLElement>,
  strength: number = 0.3
) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = target.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(target, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(target, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "elastic.out(1, 0.3)",
      });
    };

    target.addEventListener("mousemove", handleMouseMove);
    target.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      target.removeEventListener("mousemove", handleMouseMove);
      target.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [targetRef, strength]);
}

// 使用例:
// const buttonRef = useRef<HTMLButtonElement>(null);
// useMagneticCursor(buttonRef, 0.3);
```

---

## 📚 参照リソース

### 参照サイト
- **Aristide Benoist**: カーソルの芸術的実装
- **Dennis Snellenberg**: Magnetic cursor の美しい例
- **Locomotive**: カーソルとページ体験の統合

### プロジェクト内参照
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`

---

## 🚨 注意事項

### パフォーマンス
- `pointermove` は `{ passive: true }` で登録
- GSAP の `duration` は 0.3-0.5s が適切
- `will-change: transform` で GPU アクセラレーション

### アクセシビリティ
- カスタムカーソルはビジュアルのみ、機能は変えない
- フォーカスリングは通常通り表示
- キーボードナビゲーションに影響しない

### ブラウザ互換性
```tsx
// Fallback for browsers without matchMedia
if (typeof window !== "undefined" && !window.matchMedia) {
  return null; // カスタムカーソルを無効化
}
```

### z-index 管理
- カーソルは `z-index: 9999` で最前面
- モーダルやドロップダウンとの競合に注意

---

## 📝 完了後のアクション

1. **スクリーンショット/動画を撮る**: カーソル動作のデモ
2. **README.md を更新**: Phase 1 完了を記録
3. **Phase 1 完了レビュー**: Award-Worthy Checklist "Craft Test" 確認
4. **Phase 2 へ移行**: [../phase-2-signature-moment/README.md](../phase-2-signature-moment/)

---

**Status:** 🔜 Not Started
**Assigned:** -
**Started:** -
**Completed:** -

---

## 🎉 Phase 1 完了おめでとうございます！

Phase 1 の全タスク完了で、以下が達成されます:

✅ **Craft Details の完全実装**
- 404 ページ ✓
- Loading ページ ✓
- Error Boundary ✓
- カーソル強化 ✓

✅ **Level 4 到達**
- Award-Worthy Checklist "Craft Test" 4/4 通過
- Excellence Framework: Technical Craft が L4 到達

**次のステップ: Phase 2 - Signature Moment**
Level 5 への最も重要なフェーズに移行します。
