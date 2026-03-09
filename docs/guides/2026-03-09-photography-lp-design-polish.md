# Photography LP Design Polish — ナレッジドキュメント

> 2026-03-09 | Photography LP の Level 4.5 → 5/5 (Award-Worthy) 仕上げで得た技術知見

## 概要

Photography LP のモーション・インタラクション品質を Award-Worthy レベルに引き上げるために実施した Design Polish。全セクションの GSAP モーションパターンを差別化し、Lightbox に crossfade transition を実装、react-day-picker を自前 Calendar UI に置き換え、Heat Tokens を CSS custom properties に統一した。

---

## 1. GSAP モーションパターン差別化

### 問題

全セクションが `opacity: 0, y: N → 1, 0` の画一的な fade-up パターンで退屈。Award-Worthy サイトはセクションごとに異なるモーション性格を持つ。

### 解決: 5 つの差別化パターン

#### 1-1. Scroll-Driven Opacity (About)

スクロール位置に連動して opacity が変化する「読み進める」体験。

```tsx
// AboutSection.tsx L25-38
gsap.fromTo(
  ".about-text-block",
  { opacity: 0.3 },
  {
    opacity: 1,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top 70%",
      end: "center center",
      scrub: 0.5,  // ← scroll position に追従
    },
  }
);
```

**ポイント:** `scrub: 0.5` で scroll 位置にスムーズ追従。`once: true` ではなく連続的に反応する。

#### 1-2. Card-Settle with 3D Tilt (About + Services)

カードが上方から「着地」するように降りてくる。`rotateX` と `perspective` で奥行きを演出。

```tsx
// ServicesSection.tsx L44-60
gsap.fromTo(
  ".service-panel",
  { opacity: 0, y: 50, rotateX: 8 },
  {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 0.8,
    stagger: { each: 0.15, from: "start" },
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
    scrollTrigger: {
      trigger: section,
      start: "top 75%",
      once: true,
    },
  }
);
```

**ポイント:**
- 親要素に `perspective: "1000px"` を設定（Services）/ `perspective: "800px"`（About）
- ease `cubic-bezier(0.22, 1, 0.36, 1)` は easeOutCubic の滑らかなカーブ
- About の point cards は `rotateX: 6, y: 36` と控えめ、Services は `rotateX: 8, y: 50` と大きめに差別化

#### 1-3. Icon Pop with Bounce (Services)

サービスアイコンがカード登場の後に弾むように出現。overshoot ease でポップ感を演出。

```tsx
// ServicesSection.tsx L63-78
gsap.fromTo(
  ".service-icon",
  { opacity: 0, scale: 0.5 },
  {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    stagger: 0.2,
    ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",  // ← overshoot bounce
    scrollTrigger: {
      trigger: section,
      start: "top 65%",  // カードより遅いトリガー
      once: true,
    },
  }
);
```

**ポイント:** `cubic-bezier(0.34, 1.56, 0.64, 1)` の第2引数 `1.56` が 1.0 を超えることで overshoot（行き過ぎて戻る）効果を生む。

#### 1-4. Counter Ignition (Testimonial)

統計数値が 0 からカウントアップし、完了時に bounce scale で「着火」する。

```tsx
// TestimonialSection.tsx L38-76
const obj = { val: 0 };
gsap.to(obj, {
  val: target,
  duration: 1.6,
  ease: "power2.out",
  delay: 0.5 + i * 0.15,
  onUpdate: () => {
    (el as HTMLElement).textContent = prefix + Math.floor(obj.val) + suffix;
  },
  onComplete: () => {
    gsap.fromTo(
      el,
      { scale: 1 },
      {
        scale: 1.12,
        duration: 0.15,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,  // ← 1回だけ bounce
      }
    );
  },
  scrollTrigger: {
    trigger: section,
    start: "top 70%",
    once: true,
  },
});
```

**ポイント:** `gsap.to(obj, ...)` パターンで仮想オブジェクトを tween し、`onUpdate` で DOM を手動更新。`onComplete` の bounce scale で到達感を演出。

#### 1-5. Submit Button Breathing Glow (CTA)

送信ボタンが呼吸するように amber glow を繰り返す。ユーザーの注意を自然に誘導。

```tsx
// CTAFormSection.tsx L56-66
gsap.fromTo(
  ".cta-submit-glow",
  { boxShadow: "0 0 0px rgba(255, 197, 61, 0)" },
  {
    boxShadow: "0 0 20px rgba(255, 197, 61, 0.25)",
    duration: 2.0,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,  // ← 無限ループ
  }
);
```

**ポイント:** `yoyo: true` + `repeat: -1` で無限の呼吸アニメーション。`sine.inOut` で自然な緩急。

### セクション別モーション対応表

| Section | Pattern | Trigger | ease | 特徴 |
|---------|---------|---------|------|------|
| About (text) | Scroll-Driven Opacity | scrub 0.5 | `none` | scroll 追従 |
| About (cards) | Card-Settle 3D | top 80%, once | `cubic-bezier(0.22, 1, 0.36, 1)` | rotateX: 6 |
| Services (panels) | Card-Settle 3D | top 75%, once | `cubic-bezier(0.22, 1, 0.36, 1)` | rotateX: 8 |
| Services (icons) | Icon Pop Bounce | top 65%, once | `cubic-bezier(0.34, 1.56, 0.64, 1)` | overshoot |
| Testimonial (entries) | Stagger Reveal | top 80%, once | `power3.out` | シンプル fade-up |
| Testimonial (stats) | Counter Ignition | top 70%, once | `power2.out` | 数値カウント + bounce |
| CTA (form card) | Card-Settle | top 60%, once | `cubic-bezier(0.22, 1, 0.36, 1)` | 単体 reveal |
| CTA (button) | Breathing Glow | 即時 | `sine.inOut` | yoyo 無限ループ |
| Divider | Line-Draw | top 80%, once | `cubic-bezier(0.33, 1, 0.68, 1)` | scaleX: 0→1 |

---

## 2. Lightbox Crossfade Transition

### 問題

`img.src` を直接置換すると、画像切り替え時にフラッシュ（一瞬白くなる）が発生し安っぽい印象に。

### 解決

slide direction 計算 + isAnimating guard + onComplete chain パターンで滑らかな crossfade を実現。

```tsx
// LightboxDialog.tsx L55-88
const navigateImage = useCallback(
  (direction: "next" | "prev") => {
    if (isAnimating.current || !imgRef.current) return;  // ← guard
    isAnimating.current = true;

    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % images.length
        : (currentIndex - 1 + images.length) % images.length;

    const slideDir = direction === "next" ? -1 : 1;  // ← 方向計算

    // Phase 1: 現在の画像をスライドアウト
    gsap.to(imgRef.current, {
      x: slideDir * 60,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        updateImage(newIndex);  // src 置換
        // Phase 2: 新画像を反対側からスライドイン
        gsap.set(imgRef.current, { x: -slideDir * 60, opacity: 0 });
        gsap.to(imgRef.current, {
          x: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            isAnimating.current = false;  // guard 解除
          },
        });
      },
    });
  },
  [currentIndex, images.length, updateImage]
);
```

**設計パターン:**

1. **isAnimating guard** — `useRef(false)` でアニメーション中の多重発火を防止
2. **方向計算** — `next → slideDir = -1`（左へ出て右から入る）、`prev → +1`（右へ出て左から入る）
3. **onComplete chain** — Phase 1 完了後に src 置換 → Phase 2 開始。2つの gsap.to を直列に接続
4. **キーボード対応** — ArrowRight/ArrowLeft/Escape を `window.addEventListener` で処理

---

## 3. カスタム Calendar UI

### 問題

`react-day-picker v9` の `import "react-day-picker/style.css"` が Vercel ビルドで lightningcss エラーを発生。

```
Error: Failed to resolve CSS import "react-day-picker/style.css"
```

### 根本原因

Turbopack + lightningcss が `node_modules` 内の CSS ファイルを正しく解決できない。Next.js の Turbopack ビルドにおける既知の制約。

### 解決: ライブラリ除去 → 自前実装

`react-day-picker` を完全に除去し、`date-fns` ベースの Calendar + DatePicker コンポーネントを自前実装。

#### Calendar コンポーネント (`calendar.tsx`)

```tsx
// date-fns の関数で月カレンダーを構築
const calendarDays = useMemo(() => {
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}, [viewDate]);
```

**特徴:**
- 外部 CSS 依存ゼロ — Tailwind クラスのみ
- `date-fns/locale` で ja/en 対応（曜日ヘッダー、月表示フォーマット）
- Amber glow selected: `shadow-[0_0_12px_color-mix(...)]`
- Dot indicator today: `h-[3px] w-[3px] rounded-full bg-[var(--accent-amber1)]`
- `disableBefore` prop で過去日付を無効化

#### DatePicker コンポーネント (`date-picker.tsx`)

**特徴:**
- Popover 不使用 → 自前 dropdown + `position: absolute`
- Outside click で閉じる: `document.addEventListener("mousedown", ...)`
- Escape キーで閉じる: `document.addEventListener("keydown", ...)`
- Hidden input で form submit 対応: `<input type="hidden" name={name} value={...} />`
- Focus ring: amber glow `shadow-[0_0_0_1px_var(--accent-amber1),0_0_16px_...]`

#### globals.css のアニメーション定義

```css
@keyframes calendar-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.calendar-dropdown {
  animation: calendar-enter 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 教訓

> **Vercel (Turbopack) 環境では、`node_modules` 内の CSS ファイルを直接 import するライブラリは避ける。** 自前でスタイルを定義するか、CSS-in-JS を使う。`react-day-picker` のような「CSS ファイルの import が必須」なライブラリは Turbopack と相性が悪い。

---

## 4. Heat Tokens 統一

### Before

`rgba(255, 196, 61, N)` のような inline 値が各コンポーネントに散在。値の変更時に全ファイルを grep する必要があった。

### After

`globals.css` の CSS custom properties に統一:

```css
--heat-subtle: color-mix(in oklch, var(--accent-amber1) 30%, transparent);
--heat-medium: var(--accent-amber1);
--heat-intense: var(--accent-amber2);
```

| Token | 用途 | 値 |
|-------|------|-----|
| `var(--heat-subtle)` | 背景グラデーション、hover overlay | 30% amber |
| `var(--heat-medium)` | ラベル、アイコン、ボーダー | amber-9 (`#ffc53d`) |
| `var(--heat-intense)` | 強調アクセント | amber-10 |

**使用例:**
```tsx
// ServicesSection.tsx L107 — hover overlay
<div className="... bg-[radial-gradient(circle_at_top_right,var(--heat-subtle),transparent_28%)]" />

// CTAFormSection.tsx L97 — radial gradient accent
<div className="... bg-[radial-gradient(circle_at_top_left,var(--heat-subtle),transparent_34%)]" />
```

---

## 5. VideoHeroBackground pointerleave

### 問題

マウスがビューポート外に出た後も `targetHeat` が `0.42`（pointer timeout 値）のまま残り、ヒーロー背景が不自然に明るいまま。

### 解決

`pointerleave` イベントで `targetHeat` を安静値にリセット。

```tsx
// VideoHeroBackground.tsx L143-146
const handlePointerLeave = () => {
  if (heatResetTimeout) window.clearTimeout(heatResetTimeout);
  targetHeat = 0.18;  // ← 安静値
};
```

**Heat 値の状態遷移:**

| 状態 | targetHeat | トリガー |
|------|-----------|---------|
| 初期表示 | 0.2 | mount |
| イントロ後 | 0.45 | 280ms timeout |
| ポインター移動中 | 1.0 | pointermove |
| ポインター停止 | 0.42 | 320ms timeout |
| ポインター離脱 | 0.18 | pointerleave |
| スクロール中 | `max(0.18, 0.48 - scroll * 0.4)` | scroll |

---

## 6. セクション間 Divider

### パターン

`scaleX: 0 → 1` の line-draw animation。中央から左右に伸びる。

```tsx
// PhotographyClient.tsx L31-44
gsap.fromTo(
  ".section-divider",
  { scaleX: 0 },
  {
    scaleX: 1,
    duration: 1.2,
    ease: "cubic-bezier(0.33, 1, 0.68, 1)",
    scrollTrigger: {
      trigger: ".section-divider",
      start: "top 80%",
      once: true,
    },
  }
);

// HTML: origin-center で中央起点
<div className="section-divider h-px w-24 origin-center bg-[var(--text-base-20)]" />
```

**ポイント:** `origin-center` が重要。これがないと左端から右へ伸びてしまう。

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `apps/web/src/features/photography/sections/AboutSection.tsx` | Scroll-driven opacity + Card-settle 3D tilt |
| `apps/web/src/features/photography/sections/ServicesSection.tsx` | Card-settle 3D + Icon pop bounce |
| `apps/web/src/features/photography/sections/TestimonialSection.tsx` | Counter ignition + bounce scale |
| `apps/web/src/features/photography/sections/CTAFormSection.tsx` | Card reveal + breathing glow button |
| `apps/web/src/features/photography/sections/LightboxDialog.tsx` | Crossfade transition + isAnimating guard |
| `apps/web/src/features/photography/components/VideoHeroBackground.tsx` | pointerleave heat reset |
| `apps/web/src/features/photography/PhotographyClient.tsx` | Section divider line-draw |
| `apps/web/src/shared/components/ui/calendar.tsx` | 新規: 自前 Calendar コンポーネント |
| `apps/web/src/shared/components/ui/date-picker.tsx` | 新規: 自前 DatePicker コンポーネント |
| `apps/web/src/app/globals.css` | calendar-enter keyframe, heat tokens |

## コミット履歴

| Hash | メッセージ |
|------|-----------|
| `608f043` | feat: Photography LP design polish — motion, lightbox transition, calendar UI |
| `32e9ab2` | fix: remove react-day-picker CSS import causing Vercel lightningcss error |
| `e9c3951` | feat: replace react-day-picker with custom calendar UI |
| `ae0e6e4` | fix: unify web app dependency management with bun |
