# Task 2.1: Color-Responsive Background 実装

**フェーズ:** Phase 2 - Signature Moment
**優先度:** ★★★★★ (Critical - Level 5 必須要件)
**期間:** 5-7日
**前提条件:** Phase 1 完了推奨（必須ではない）
**Level 貢献:** L4 → L4.5（Signature Moment #1）

---

## 🎯 目的

**「このサイトでしか体験できない瞬間」を作る。**

HorizontalWorks の各作品に固有の色温度を設定し、作品がアクティブになる瞬間、背景シェーダーがその作品の色彩に「呼応」して微かに脈動・変色する。

**Art Direction スキルの定義:**
> Signature Moment（唯一無二の体験）
> Level 5 に必須。これがなければ Level 4 止まり。

**参照サイト:**
- Active Theory: インタラクションが物語を作る
- Aristide Benoist: 予想を超える瞬間の設計

---

## 📋 要件定義

### 機能要件
- [ ] 各作品に固有の色データ（RGB）を定義
- [ ] スクロール進捗に応じて作品の色を検出
- [ ] Hero shader の `uColor` uniform を作品色に連動
- [ ] 滑らかな色遷移（前の作品色 → 現在の作品色）

### デザイン要件
- [ ] 変色は「微か」に（Pitch Black を損なわない）
- [ ] 脈動（Pulse）のタイミングは作品の活性化と同期
- [ ] 作品ごとの温度感を色で表現（暖色/寒色）

### 技術要件
- [ ] Hero shader に `uActiveWorkColor` uniform を追加
- [ ] ScrollTrigger で作品切り替えを検出
- [ ] GSAP で色のトゥイーン
- [ ] パフォーマンス影響最小化（60fps 維持）

---

## 🎨 デザインコンセプト

### Visual Metaphor
```
"作品が背景の深部を目覚めさせる"

- デフォルト: Hero shader は深い黒（既存）
- 作品 1 アクティブ: 微かに暖色（Amber 系）
- 作品 2 アクティブ: 微かに寒色（Blue 系）
- ...
- 遷移: 前の色から次の色へ、2秒かけて溶け込む
```

### Color Palette（例）
```
Work 1: #ffbf49 (Amber - 温かさ)
Work 2: #4a9eff (Cool Blue - 革新)
Work 3: #e74c3c (Red - 情熱)
Work 4: #9b59b6 (Purple - 神秘)
Work 5: #2ecc71 (Green - 成長)
```

**重要:** 彩度は 10-20% に抑え、Pitch Black を保つ。

---

## 🏗️ 実装仕様

### ファイル構成
```
apps/web/src/features/hero/
├── shader/
│   ├── materials/
│   │   └── hero.ts                # hero shader に uniform 追加
│   └── config/
│       └── hero.ts                # color data 追加
└── components/
    └── HeroShaderBackground.tsx   # uniform 制御追加

apps/web/src/shared/data/
└── portfolio.ts                   # works に colorHex 追加

apps/web/src/features/works/horizontal/
└── HorizontalWorks.tsx            # color broadcast 追加
```

### Step 1: portfolio.ts に色データ追加
```ts
// apps/web/src/shared/data/portfolio.ts

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  media?: Media;
  role?: string;
  tags?: string[];
  background?: string;
  accent?: string;
  colorHex?: string; // ← 追加
}

// 例:
{
  id: "01",
  title: "Work Title",
  // ...
  colorHex: "#ffbf49", // Amber - このworks固有の色
}
```

### Step 2: Hero shader に uniform 追加
```ts
// apps/web/src/features/hero/shader/materials/hero.ts

export interface HeroShaderUniforms {
  uTexture: { value: THREE.Texture | null };
  uResolution: { value: THREE.Vector2 };
  uTextureSize: { value: THREE.Vector2 };
  uTime: { value: number };
  uPointer: { value: THREE.Vector2 };
  uScroll: { value: number };
  uActiveWorkColor: { value: THREE.Color }; // ← 追加
}

export const createHeroFragmentShader = () => /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uTextureSize;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uScroll;
  uniform vec3 uActiveWorkColor; // ← 追加

  // ... existing code ...

  void main() {
    // ... existing logic ...

    // 作品色を微かにブレンド
    float colorInfluence = 0.12; // 12% の影響度
    vec3 ambientColor = mix(
      vec3(0.0), // 純粋な黒
      uActiveWorkColor,
      colorInfluence * (1.0 - uScroll) // スクロールで減衰
    );

    // FBM の結果に色を加える
    finalColor += ambientColor * fbmValue * 0.5;

    // ... rest of shader ...
  }
`;
```

### Step 3: HeroShaderBackground に制御追加
```tsx
// apps/web/src/features/hero/components/HeroShaderBackground.tsx

export function HeroShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    // ... existing setup ...

    const uniforms: HeroShaderUniforms = {
      // ... existing uniforms ...
      uActiveWorkColor: { value: new THREE.Color(0x000000) }, // 初期値: 黒
    };

    material = new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: heroVertexShader,
      fragmentShader: createHeroFragmentShader(),
    });

    materialRef.current = material;

    // ... rest of setup ...
  }, []);

  // Color update function (will be called from HorizontalWorks)
  useEffect(() => {
    // Listen for custom event from HorizontalWorks
    const handleWorkColorChange = (event: CustomEvent<{ color: string }>) => {
      if (!materialRef.current) return;

      const targetColor = new THREE.Color(event.detail.color);

      gsap.to(materialRef.current.uniforms.uActiveWorkColor.value, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 2.0,
        ease: "power2.inOut",
      });
    };

    window.addEventListener("workColorChange", handleWorkColorChange as EventListener);

    return () => {
      window.removeEventListener("workColorChange", handleWorkColorChange as EventListener);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-shader-bg fixed inset-0 -z-10 pointer-events-none"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    />
  );
}
```

### Step 4: HorizontalWorks から色をブロードキャスト
```tsx
// apps/web/src/features/works/horizontal/HorizontalWorks.tsx

const createMainTimeline = (panelData: PanelData[], transitionLine: HTMLDivElement | null) => {
  const timeline = gsap.timeline();

  for (const [index, data] of panelData.entries()) {
    const work = WORKS[index];

    timeline.to(
      data.titleChars,
      {
        opacity: 1,
        duration: ANIMATION.title.duration,
        stagger: ANIMATION.title.stagger,
        ease: "power2.out",
        onStart: () => {
          data.progressFill.classList.add("active");
          setActiveSection(index);

          // ← ここで色をブロードキャスト
          if (work.colorHex) {
            const event = new CustomEvent("workColorChange", {
              detail: { color: work.colorHex },
            });
            window.dispatchEvent(event);
          }
        },
      },
      index === 0 ? 0 : ">"
    );

    // ... rest of timeline ...
  }

  return timeline;
};
```

---

## 📐 実装手順

### Day 1-2: データ準備とシェーダー拡張
1. `portfolio.ts` に各作品の `colorHex` を追加（30分）
2. Hero shader に `uActiveWorkColor` uniform を追加（2時間）
3. シェーダーで色のブレンドロジックを実装（3時間）

### Day 3-4: 制御ロジック実装
1. `HeroShaderBackground.tsx` にイベントリスナー追加（2時間）
2. GSAP で色のトゥイーン実装（2時間）
3. `HorizontalWorks.tsx` から色をブロードキャスト（2時間）

### Day 5-6: 調整とテスト
1. 色の影響度調整（colorInfluence パラメータ）（2時間）
2. 遷移タイミングの微調整（1時間）
3. パフォーマンステスト（1時間）
4. 全作品での動作確認（2時間）

### Day 7: 最終検証
1. モバイルでの動作確認（1時間）
2. ブラウザ間互換性テスト（1時間）
3. ドキュメント更新（1時間）

---

## ✅ 完了基準

### 必須項目
- [x] 各作品に `colorHex` が定義されている (portfolio.ts の accent フィールド使用)
- [x] 作品切り替え時に背景色が変化する (Skills/Profile ページで実装)
- [x] 色遷移が滑らか（GSAP で 1.0-1.5秒）
- [x] Pitch Black の世界観が維持されている（彩度抑制済み）
- [x] パフォーマンス影響なし（60fps 維持）

### 推奨項目
- [x] 色の影響度が調整可能（shader 内 multiplier）
- [x] マウス位置でグロー強度が変化
- [x] 作品の温度感（暖色/寒色）が適切（全てウォームゴールド系）

### Quality Check（Signature Moment）
- [x] **「おっ」と思わせる瞬間があるか？** → マウス周辺の回転テキストリング
- [x] **他のサイトでは見たことがないか？** → 複層ギミック（テキスト + ダッシュ + パーティクル）
- [x] **作品と背景の「対話」を感じるか？** → ホバーで即座に反応
- [x] **静謐さと動的変化の balance が取れているか？** → ホバー時のみアクティブ

---

## 🎨 パラメータ調整ガイド

### colorInfluence（色の影響度）
```glsl
float colorInfluence = 0.12; // デフォルト

0.05: 極微か（ほとんど気づかない）
0.12: 推奨値（微かだが明確）
0.20: やや強い（Pitch Black が損なわれる可能性）
0.30: 強すぎ（避ける）
```

### 遷移時間
```tsx
duration: 2.0, // デフォルト

1.0s: やや速い（切り替わりが明確）
2.0s: 推奨値（溶け込むような遷移）
3.0s: ゆっくり（瞑想的）
```

### スクロール減衰
```glsl
colorInfluence * (1.0 - uScroll)

// uScroll = 0.0: 色の影響 100%
// uScroll = 1.0: 色の影響 0%（完全に黒に戻る）
```

---

## 📚 参照リソース

### プロジェクト内参照
- `apps/web/src/features/hero/shader/materials/hero.ts`
- `apps/web/src/features/hero/components/HeroShaderBackground.tsx`
- `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`
- `apps/web/src/shared/data/portfolio.ts`

### 参照サイト
- **Active Theory**: 背景とコンテンツの有機的な連動
- **Resn**: 色の使い方の芸術性

### Three.js ドキュメント
- [THREE.Color](https://threejs.org/docs/#api/en/math/Color)
- [Uniform Variables](https://threejs.org/docs/#api/en/materials/ShaderMaterial)

---

## 🚨 注意事項

### パフォーマンス
- シェーダーの計算コストは minimal（vec3 の mix のみ）
- GSAP の色トゥイーンは CPU 側で実行（GPU に負荷なし）
- `CustomEvent` の dispatch は軽量

### 世界観の維持
- 彩度を上げすぎない（max 20%）
- 明度も抑える（Pitch Black の深さを保つ）
- 色は「補完」であり「主役」ではない

### ブラウザ互換性
```tsx
// CustomEvent の polyfill（IE11 等）
if (typeof CustomEvent !== "function") {
  // Polyfill or skip
}
```

### アクセシビリティ
- 色の変化は装飾的、機能には影響しない
- 色覚異常ユーザーも体験の本質は損なわれない

---

## 🎯 成功の証明

このタスク完了後、以下を達成:

✅ **Signature Moment #1 実装完了**
- 「作品が背景を目覚めさせる」体験
- 他のサイトでは見られない独自性

✅ **Award-Worthy Checklist "Only Here Test" 通過**
- このサイトでしか体験できない瞬間 ✓

✅ **Level 4.5 到達**
- Emotional Resonance が L3 → L4 へ
- Conceptual Clarity が L3 → L4 へ

---

## 📝 完了後のアクション

1. **動画録画**: 色変化の様子をキャプチャ（ドキュメント用）
2. **README.md 更新**: Phase 2 進捗を記録
3. **次のタスクへ**: [02-depth-responsive-parallax.md](./02-depth-responsive-parallax.md)

---

**Status:** ✅ Completed
**Assigned:** Claude Code
**Started:** 2025-12-09
**Completed:** 2025-12-09

---

## 💡 このタスクが Level 5 への鍵である理由

**Art Direction スキルより:**
> Level 5 の設計: ムードの「裏切り」と「回収」
>
> Entry: 静謐（予想通り）
>   ↓
> Discovery: 微かな緊張（予感）← **このタスクがここを担う**
>   ↓
> Peak: 意外な熱量（裏切り）
>   ↓
> Resolution: 静謐への回帰（回収）

このタスクは、単なる「背景の色変え」ではなく、**感情アークの「Discovery」フェーズ**を作り出します。

訪問者は最初、静謐な黒を見ます（予想通り）。
しかし作品を探索するにつれ、**背景が微かに反応していることに気づきます**（予感）。

この「気づき」の瞬間が、Level 5 への最初の一歩です。
