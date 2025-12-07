# Index Brushup Phase 3: Works Section リデザイン実装プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-07
**フェーズ:** Phase 3 of 4

---

## タスク概要

Works Section（HorizontalWorks）を非対称レイアウトにリデザインする。
現在の「全パネル中央配置」から「パネルごとに構図が変化」する形に変更し、視覚的な新鮮さと動きを生み出す。

**目標:**
- 各パネルで異なる構図（右寄せ→左寄せ→下寄せ→中央）
- パネル番号の存在感強化
- 視覚的緊張感の創出

---

## 禁止事項（重要）

1. **コミット禁止** - `git add` / `git commit` を絶対に実行しない
2. **依存追加禁止** - `npm install` / `bun add` を実行しない
3. **既存アニメーション破壊禁止** - ScrollTrigger、文字reveal、プログレス等は維持

---

## 現状分析

**ファイル:** `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`

### 現在の構図（全パネル共通）

```
┌─────────────────────────────────────────────────────────────┐
│  01                                                         │
│                                                             │
│                    [meta]                                   │
│                Web Development                              │
│              Digital Experiences                            │
│                                                             │
│          [description text centered...]                     │
│                                                             │
│                  ━━━━━ 45%                                  │
└─────────────────────────────────────────────────────────────┘
```

**問題点:**
- 全パネルが同じレイアウトで単調
- 視覚的緊張感がない
- パネル番号が小さく存在感が薄い

---

## 変更後の構図設計

### Panel 1（01）: 右寄せ - 入口

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                               01            │
│                                                             │
│                                        [meta]               │
│                                   Digital                   │
│                                   Experiences               │
│                                                             │
│                           [description                      │
│                            right-aligned...]                │
│                                                             │
│                                       ━━━━━ 45%            │
└─────────────────────────────────────────────────────────────┘
```

### Panel 2（02）: 左寄せ - 展開

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  02                                                         │
│                                                             │
│  [meta]                                                     │
│  Creative                                                   │
│  Engineering                                                │
│                                                             │
│  [description                                               │
│   left-aligned...]                                          │
│                                                             │
│  ━━━━━ 45%                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Panel 3（03）: 下寄せ + 大きな上部余白 - クライマックス

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│                          03                                 │
│                                                             │
│                       [meta]                                │
│                  Design Systems                             │
│                                                             │
│              [description centered...]                      │
│                                                             │
│                    ━━━━━ 45%                                │
└─────────────────────────────────────────────────────────────┘
```

### Panel 4（04）: 中央 - 終点

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                          04                                 │
│                                                             │
│                       [meta]                                │
│                Motion & Interaction                         │
│                                                             │
│              [description centered...]                      │
│                                                             │
│                    ━━━━━ 45%                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 実装手順

### Step 1: レイアウトバリエーション定義

**HorizontalWorks.tsx の先頭付近（行14の後）に追加:**

```tsx
// Panel layout variations
type PanelLayout = 'right' | 'left' | 'bottom' | 'center';

const PANEL_LAYOUTS: PanelLayout[] = ['right', 'left', 'bottom', 'center'];

// Layout-specific styles
const layoutStyles: Record<PanelLayout, {
  panel: string;
  number: string;
  content: string;
  text: string;
}> = {
  right: {
    panel: 'items-end justify-center pr-16 md:pr-24 lg:pr-32',
    number: 'right-16 top-1/4 text-[clamp(4rem,12vw,10rem)] md:right-24 lg:right-32',
    content: 'items-end text-right',
    text: 'text-right',
  },
  left: {
    panel: 'items-start justify-center pl-16 md:pl-24 lg:pl-32',
    number: 'left-16 top-1/4 text-[clamp(4rem,12vw,10rem)] md:left-24 lg:left-32',
    content: 'items-start text-left',
    text: 'text-left',
  },
  bottom: {
    panel: 'items-center justify-end pb-24 md:pb-32',
    number: 'left-1/2 top-16 -translate-x-1/2 text-[clamp(3rem,10vw,8rem)]',
    content: 'items-center text-center',
    text: 'text-center',
  },
  center: {
    panel: 'items-center justify-center',
    number: 'left-1/2 top-16 -translate-x-1/2 text-[clamp(3rem,10vw,8rem)]',
    content: 'items-center text-center',
    text: 'text-center',
  },
};
```

---

### Step 2: パネルのレンダリング部分を変更

**変更前（行379-444付近）:**

```tsx
{WORKS.map((work, index) => (
  <div
    key={work.id}
    ref={(el) => {
      panelRefs.current[index] = el;
    }}
    className="horizontal-panel flex h-screen w-screen flex-shrink-0 flex-col items-center justify-center px-6"
  >
    {/* Panel Number */}
    <span className="absolute left-8 top-8 text-sm font-medium tracking-wide text-[var(--text-base-20)]">
      {work.id}
    </span>

    {/* Panel Content */}
    <div
      ref={(el) => {
        contentRefs.current[index] = el;
      }}
      className="horizontal-content flex max-w-2xl flex-col items-center text-center"
    >
```

**変更後:**

```tsx
{WORKS.map((work, index) => {
  const layout = PANEL_LAYOUTS[index] || 'center';
  const styles = layoutStyles[layout];

  return (
    <div
      key={work.id}
      ref={(el) => {
        panelRefs.current[index] = el;
      }}
      className={`horizontal-panel relative flex h-screen w-screen flex-shrink-0 flex-col ${styles.panel}`}
    >
      {/* Panel Number - Enhanced */}
      <span
        className={`panel-number absolute font-bold leading-none tracking-[-0.05em] text-[var(--text-base-20)] transition-opacity duration-500 ${styles.number}`}
        style={{ opacity: 0.08 }}
      >
        {work.id}
      </span>

      {/* Panel Content */}
      <div
        ref={(el) => {
          contentRefs.current[index] = el;
        }}
        className={`horizontal-content flex max-w-xl flex-col ${styles.content}`}
      >
```

---

### Step 3: コンテンツ部分のテキスト配置を変更

**変更前（行399-420付近）:**

```tsx
<span className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
  {work.meta}
</span>

<h2
  ref={(el) => {
    titleRefs.current[index] = el;
  }}
  className="horizontal-title mb-6 text-[clamp(2rem,6vw,4rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-base)]"
>
  {work.title}
</h2>

<p
  ref={(el) => {
    descRefs.current[index] = el;
  }}
  className="horizontal-desc text-lg leading-relaxed text-[var(--text-muted)]"
>
  {work.description}
</p>
```

**変更後:**

```tsx
<span className={`mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60 ${styles.text}`}>
  {work.meta}
</span>

<h2
  ref={(el) => {
    titleRefs.current[index] = el;
  }}
  className={`horizontal-title mb-6 text-[clamp(2rem,6vw,4rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-base)] ${styles.text}`}
>
  {work.title}
</h2>

<p
  ref={(el) => {
    descRefs.current[index] = el;
  }}
  className={`horizontal-desc max-w-md text-lg leading-relaxed text-[var(--text-muted)] ${styles.text}`}
>
  {work.description}
</p>
```

---

### Step 4: プログレスバーの位置調整

**変更前（行421-441付近）:**

```tsx
{/* Section Progress */}
<div className="mt-12 flex w-48 items-center gap-3">
```

**変更後:**

```tsx
{/* Section Progress */}
<div className={`mt-12 flex w-48 items-center gap-3 ${layout === 'right' ? 'flex-row-reverse' : ''}`}>
```

---

### Step 5: 閉じ括弧の追加

mapのreturn文を閉じる:

```tsx
      </div>
    </div>
  );
})}
```

---

### Step 6: パネル番号のアニメーション追加（オプション）

initAnimations内、Phase 1のタイトルrevealと同時にパネル番号も少しフェードインさせる:

**Phase 1内に追加（行196-209付近）:**

```tsx
// Phase 1: Title reveal
mainTimeline.to(
  data.titleChars,
  {
    opacity: 1,
    duration: 0.25,
    stagger: 0.025,
    ease: "power2.out",
    onStart: () => {
      data.progressFill.classList.add("active");
      setActiveSection(i);

      // Fade in panel number
      const panelNumber = data.panel.querySelector('.panel-number');
      if (panelNumber) {
        gsap.to(panelNumber, {
          opacity: 0.15,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    },
  },
  i === 0 ? 0 : ">"
);
```

---

## レスポンシブ対応

モバイルでは構図の差を控えめにする:

**layoutStyles の修正:**

```tsx
const layoutStyles: Record<PanelLayout, {
  panel: string;
  number: string;
  content: string;
  text: string;
}> = {
  right: {
    // モバイルでは中央寄り、デスクトップで右寄せ
    panel: 'items-center md:items-end justify-center md:pr-24 lg:pr-32',
    number: 'right-8 md:right-16 top-8 md:top-1/4 text-[clamp(2rem,8vw,6rem)] md:text-[clamp(4rem,12vw,10rem)] lg:right-32',
    content: 'items-center md:items-end text-center md:text-right',
    text: 'text-center md:text-right',
  },
  left: {
    panel: 'items-center md:items-start justify-center md:pl-24 lg:pl-32',
    number: 'left-8 md:left-16 top-8 md:top-1/4 text-[clamp(2rem,8vw,6rem)] md:text-[clamp(4rem,12vw,10rem)] lg:left-32',
    content: 'items-center md:items-start text-center md:text-left',
    text: 'text-center md:text-left',
  },
  bottom: {
    panel: 'items-center justify-center md:justify-end md:pb-32',
    number: 'left-1/2 top-8 md:top-16 -translate-x-1/2 text-[clamp(2rem,8vw,6rem)] md:text-[clamp(3rem,10vw,8rem)]',
    content: 'items-center text-center',
    text: 'text-center',
  },
  center: {
    panel: 'items-center justify-center',
    number: 'left-1/2 top-8 md:top-16 -translate-x-1/2 text-[clamp(2rem,8vw,6rem)] md:text-[clamp(3rem,10vw,8rem)]',
    content: 'items-center text-center',
    text: 'text-center',
  },
};
```

---

## 確認事項

実装完了後、以下を確認:

1. Panel 1 が右寄せで表示されること
2. Panel 2 が左寄せで表示されること
3. Panel 3 が下寄せ（上部に大きな余白）で表示されること
4. Panel 4 が中央配置で表示されること
5. パネル番号が大きく、背景的に表示されること
6. 文字revealアニメーションが正常に動作すること
7. パネル間のトランジションが正常に動作すること
8. プログレスバー、ドットナビが正常に動作すること
9. モバイル表示で破綻しないこと

---

## 作業完了後

1. 変更内容をユーザーに報告
2. **コミットは行わない** - ユーザーの指示を待つ
3. Phase 4（視覚言語の統一）の指示を待つ

---

## 参照ファイル

- `.claude/tasks/2025-12-07-index-brushup-plan.md` - 全体計画
- `.claude/prompts/2025-12-07-claude-code-index-brushup-hero.md` - Phase 1
- `.claude/prompts/2025-12-07-claude-code-index-brushup-phase2.md` - Phase 2
- `.claude/skills/visual-composition/SKILL.md` - 構図理論
- `.claude/skills/motion-design/SKILL.md` - モーション原則
