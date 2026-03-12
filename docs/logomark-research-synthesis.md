# TC Logomark Mathematical Redesign — Research Synthesis

> **日付**: 2026-03-10
> **フェーズ**: リサーチ完了 → 実装開始
> **選択コンセプト**: Concept 1「紋 — Modern Kamon」

---

## 1. 研究体制

6人の専門家による並列リサーチ（Agent Teams方式）:

| 専門家 | 担当領域 |
|--------|---------|
| geometric-logo-researcher | 世界的数学ロゴの幾何学コンストラクション事例 |
| math-systems-specialist | 黄金比・超楕円・Fibonacci等の数理基盤ツールキット |
| monogram-fusion-researcher | TC文字融合・モノグラム設計手法 |
| kanji-semiotics-researcher | 漢字「工」の構造分析と東西融合シンボル |
| scalability-tech-researcher | favicon〜大判のスケーラビリティ技術制約 |
| brand-language-strategist | ブランド設計言語の統一戦略 |

---

## 2. 最重要発見 TOP 5

### 2.1 「工の上半分 = T」は数学的事実
T を別途デザインする必要がない。工を描いた瞬間に T は内包されている。
三重読みは「設計する」ものではなく「発見する」もの。

### 2.2 超楕円 n=2.5 = quiet tension の幾何学的定義
円でも正方形でもない中間体。45°方向で円より7.2%膨らむ。
「四角の意図と曲線の流れの間の静的緊張」をひとつの数式で表現。

### 2.3 すべての数学はφから統一導出可能
Fibonacci、黄金角137.5°、正五角形の72°、超楕円の比率、30°ターミナル（√3経由）
— すべてφの異なる表現形。ロゴタイプとマークが「同じ根から生まれた」ことを保証。

### 2.4 数学は足場であり、見えてはならない
成功 = 「なぜかちょうど正しい」と感じ、後から数学が発見される。
失敗 = 数学が装飾になる。数学は私的な言語であり、品質保証の仕組み。

### 2.5 家紋は1000年のロゴシステム
極限的抽象化、モノクロ、スケール不変。LVモノグラムの原型。
漢字「工」をこの伝統に接続できる。

---

## 3. 技術制約（確定）

| 項目 | 仕様 |
|------|------|
| グリッド | 80×80 viewBox |
| 最小アーム幅 | 10 units（16px favicon で 2px 確保） |
| レンダリング | fill ベース、fill-rule: evenodd |
| 曲線 | 超楕円 n=2.5（制御点オフセット k=0.688r） |
| 角度 | 30°ターミナルカット（署名的角度） |
| 接合部 | ink trap（controlled negative space） |
| パス構造 | primaryPaths[] + animationPaths[] |
| カラー | fill="currentColor"（light/dark 自動対応） |

---

## 4. 選択コンセプト: 「紋 — Modern Kamon」

### 核心アイデア
工を超楕円フレーム内に収めた現代の個人紋。

### 構成
- 外形: 超楕円 n=2.5（80×80）
- 内部: 工（三画）を φ比率で再構築
- 端部: 30°ターミナルカット
- 接合部: ink trap
- C の表現: 超楕円フレーム右側の開口

### 意味の層
1. 幾何学的に美しいシンボル（文化無関係）
2. 超楕円フレーム → C（開口部）
3. 内部の三画構造 → 工 / T（上半分）
4. 全体 → 現代の家紋、personal heraldry
5. 工芸 = 工学 × 芸術

### 数学的根拠
- 超楕円 n=2.5: quiet tension の幾何学的定義
- φ比率: ロゴタイプHクロスバーと同原理で内部寸法決定
- Fibonacci: アーム幅 8u ≈ 11.64（80グリッド）
- 30°: 署名的角度（ロゴタイプ C, T と統一）
- ink trap: craft precision の署名

### 数理ツールキット（80×80グリッド）

**φカスケード:**
```
φ分割 Level 1: 49.44 / 30.56
φ分割 Level 2: 30.56 / 18.88
φ分割 Level 3: 18.88 / 11.67
φ分割 Level 4: 11.67 / 7.21
φ分割 Level 5: 7.21 / 4.46
```

**Fibonacci グリッド (u = 80/55 = 1.4545):**
```
3u ≈ 4.36   — ink trap 幅
5u ≈ 7.27   — 細部要素
8u ≈ 11.64  — アーム幅
13u ≈ 18.91 — 中間要素
21u ≈ 30.55 — 主要区間
34u ≈ 49.45 — 主要エリア
```

**超楕円 n=2.5 SVGベジェ近似:**
```
k = 0.688 × radius
r=40: k=27.52
r=24.72: k=17.01
```

---

## 5. 実装計画

### 変更対象ファイル
| ファイル | 変更内容 |
|---------|---------|
| `apps/web/src/shared/data/portfolio.ts` | LogoConfig 拡張、primaryPaths 追加 |
| `apps/web/src/shared/components/BrandMark.tsx` | stroke → fill レンダリング |
| `apps/web/public/brand/logo-mark.svg` | fill ベース新マーク |
| `apps/web/src/app/icon.svg` | ダークモード対応 SVG favicon |
| `apps/web/public/brand/logo-mark-512.png` | 再生成 |
| `apps/web/public/brand/logo-lockup.svg` | マーク更新後に再生成 |
| `docs/brand-identity-mini-guide.md` | マーク仕様追記 |

### LogoConfig インターフェース拡張
```typescript
export interface LogoConfig {
  viewBox: string;
  width: number;
  height: number;
  minSize: number;
  clearSpace: number;
  primaryPaths: string[];
  fillRule?: "evenodd" | "nonzero";
  animationPaths?: string[];
  strokeWidth?: number;
  faviconPath?: string;
  path?: string; // legacy
}
```
