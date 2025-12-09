# 受賞レベル実装プロンプト（Haiku 4.5専用）

Skills Page + Profile Page を受賞レベルに引き上げる実装指示書

---

## 絶対禁止事項

```
1. git commit は絶対に実行しない
2. git add も実行しない
3. コミット関連の質問もしない
4. back.out, bounce, elastic ease は使用禁止
5. backgroundPositionY は禁止（transform使用）
```

---

## Skills Page 実装

### ファイル: `apps/web/src/features/skills/SkillsAnimations.ts`

#### 修正1: Description の文字単位 reveal

**行167-173を以下に置き換え:**

```typescript
// T+1.2s: Description - 文字単位でタイプライター的reveal
if (description) {
  const text = description.textContent || "";
  description.setAttribute("data-original-text", text);

  description.innerHTML = text
    .split("")
    .map((char, i) =>
      char === " "
        ? " "
        : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
    )
    .join("");

  const chars = description.querySelectorAll<HTMLElement>(".char");

  if (chars.length > 0) {
    tl.to(
      chars,
      {
        opacity: 1,
        filter: "blur(0px)",
        stagger: config.description.charStagger,
        duration: config.description.duration,
        ease: config.description.ease,
        clearProps: "filter",
      },
      1.2
    );
  }
}
```

#### 修正2: Parallax の調整

**行218-250を以下に置き換え:**

```typescript
export function setupParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const content = el.querySelector<HTMLElement>(".skill-content");
  const accents = el.querySelectorAll<HTMLElement>(".accent-element");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    scrub: 1.2,
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5;

      if (ghost) {
        const y = centered * config.ghost.speed * 120;
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange * 1.5;
        const baseOpacity = 0.15;
        const opacity = baseOpacity - Math.abs(centered) * config.ghost.opacityRange * 1.2;

        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.04, opacity));
      }

      if (content) {
        const y = centered * config.content.speed * 50;
        content.style.transform = `translateY(${y}px)`;
      }

      for (const accent of accents) {
        const y = centered * config.accent.speed * 60;
        accent.style.transform = `translateY(${y}px)`;
      }

      if (gridLines) {
        const y = progress * config.background.speed * 50;
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
```

### ファイル: `apps/web/src/features/skills/SkillsSections.tsx`

#### 修正3: Grid Lines に初期opacity追加

**行98-106を以下に置き換え:**

```tsx
{/* Grid Lines (背景レイヤー) */}
<div
  className="grid-lines pointer-events-none absolute inset-0 -z-[6] mix-blend-soft-light"
  style={{
    backgroundImage:
      "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "100px 100px",
    opacity: 0,
    willChange: "transform, opacity",
  }}
/>
```

---

## Profile Page 実装

### ファイル: `apps/web/src/features/profile/ProfileAnimations.ts`

#### 修正1: Polyrhythm Animation（3レイヤー）

**setupStrengthEntry 関数全体を以下に置き換え:**

```typescript
export function setupStrengthEntry(
  el: HTMLElement,
  index: number,
  total: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.strengths;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const rail = el.querySelector<HTMLElement>(".rail");
  const bandText = el.querySelector<HTMLElement>(".band-text");
  const description = el.querySelector<HTMLElement>(".description");
  const keywords = el.querySelectorAll<HTMLElement>(".keyword");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");
  const connector = el.querySelector<HTMLElement>(".connector-line");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 70%",
      end: "top 20%",
      once: true,
    },
  });

  // Layer 1: Atmosphere (3拍子)
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.06, duration: 1.2, ease: "power1.out" }, 0);
  }

  if (ghost) {
    gsap.set(ghost, {
      y: config.ghost.initialY,
      opacity: 0,
      scale: config.ghost.initialScale,
      filter: `blur(${config.ghost.initialBlur}px)`,
    });
    tl.to(
      ghost,
      {
        y: 0,
        opacity: config.ghost.finalOpacity,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.5,
        ease: "expo.out",
        clearProps: "filter",
      },
      0.3
    );
  }

  // Layer 2: Structure (2拍子)
  if (rail) {
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 0.9,
        ease: "power3.out",
      },
      0.4
    );
  }

  if (bandText) {
    gsap.set(bandText, { x: config.title.initialX, opacity: 0 });
    tl.to(
      bandText,
      {
        x: "0%",
        opacity: 1,
        duration: 0.85,
        ease: "expo.out",
      },
      0.8
    );
  }

  // Layer 3: Details (4拍子)
  if (description) {
    const text = description.textContent || "";
    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " "
          ? " "
          : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
      )
      .join("");

    const chars = description.querySelectorAll(".char");
    tl.to(
      chars,
      {
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.004,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "filter",
      },
      1.3
    );
  }

  if (keywords.length > 0) {
    gsap.set(keywords, { y: config.keywords.initialY, opacity: 0, scale: 0.95 });
    tl.to(
      keywords,
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.05,
        duration: 0.3,
        ease: "power2.out",
      },
      1.6
    );
  }

  if (connector && index < total - 1) {
    gsap.set(connector, { scaleY: 0, transformOrigin: "top center", opacity: 0 });
    tl.to(
      connector,
      {
        scaleY: 1,
        opacity: 1,
        duration: 1.0,
        ease: "power3.inOut",
      },
      1.8
    );
  }

  return tl;
}
```

#### 修正2: Timeline Description に blur 追加

**setupTimelineEntry 関数の Description 部分（行381-401）を以下に置き換え:**

```typescript
// Description
if (description) {
  const text = description.textContent || "";
  description.innerHTML = text
    .split("")
    .map((char) =>
      char === " "
        ? " "
        : `<span class="char" style="opacity:0;filter:blur(3px);display:inline-block">${char}</span>`
    )
    .join("");

  const chars = description.querySelectorAll(".char");
  tl.to(
    chars,
    {
      opacity: 1,
      filter: "blur(0px)",
      stagger: config.description.charStagger,
      duration: config.description.duration,
      ease: config.description.ease,
      clearProps: "filter",
    },
    1.1
  );
}
```

#### 修正3: Parallax の scrub 値調整

**setupProfileParallax 関数（行462-495）を以下に置き換え:**

```typescript
export function setupProfileParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost, .ghost-year");
  const content = el.querySelector<HTMLElement>(".profile-content");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    scrub: 1.2,
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5;

      if (ghost) {
        const y = centered * config.ghost.speed * 140;
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange;
        const baseOpacity = parseFloat(ghost.style.opacity) || 0.15;
        const opacity = baseOpacity - Math.abs(centered) * 0.05;

        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.05, opacity));
      }

      if (content) {
        const y = centered * config.content.speed * 50;
        content.style.transform = `translateY(${y}px)`;
      }

      if (gridLines) {
        const y = progress * config.gridLines.speed * 60;
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
```

### ファイル: `apps/web/src/features/profile/ProfileSections.tsx`

#### 修正4: FluidGradientBackground の調整

**ProfileBackground 関数（行71-89）を以下に置き換え:**

```tsx
export function ProfileBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={{
          ...fluidConfigMonochrome,
          brushStrength: 0.25,
          distortionAmount: 0.12,
          colorIntensity: 0.35,
          softness: 0.85,
        }}
        fadeIn={true}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: BASE_BG,
          mixBlendMode: "multiply",
          opacity: 0.93,
        }}
      />
    </div>
  );
}
```

---

## 重要な実装順序

### Phase 1: Skills Page
1. SkillsAnimations.ts の修正1, 2
2. SkillsSections.tsx の修正3

### Phase 2: Profile Page
1. ProfileAnimations.ts の修正1, 2, 3
2. ProfileSections.tsx の修正4

---

## 検証項目

### Skills Page
- [ ] Description が1文字ずつ blur 付きで reveal
- [ ] Ghost が scrub 1.2 で滑らかに parallax
- [ ] Grid Lines が初期 opacity: 0

### Profile Page
- [ ] Strength が3拍子/2拍子/4拍子のリズム
- [ ] Timeline Description が blur 付き
- [ ] Parallax scrub 1.2 で滑らか
- [ ] FluidGradient が控えめ

---

**完了後、必ず目視確認。数値は微調整可能。**

**絶対禁止: git commit を実行しない。**
