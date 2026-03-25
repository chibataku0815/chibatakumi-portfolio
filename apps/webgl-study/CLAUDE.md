# WebGL Study — Claude Code 協業ガイド

## スコープ
Three.js + Blender 統合学習の模写プロジェクト集。
5作品の段階的模写を通じて Awwwards 級 WebGL サイト制作力を構築する。

## 技術スタック
- Runtime / PM: Bun
- Dev Server: Vite（Three.js エコシステムの標準）
- 言語: TypeScript
- 3D: Three.js（Phase 2 以降で R3F 追加）
- シェーダー: GLSL（.glsl / .frag / .vert）

## コマンド
```bash
bun run dev           # Vite dev server 起動
bun run build         # プロダクションビルド
```

## ディレクトリ構成
```
01-codrops-distortion/   # Phase 1: 画像シェーダー ★2
02-atmos/                # Phase 2: スクロール+3D ★3
03-opal-tadpole/         # Phase 2-3: プロダクトビューアー ★3
04-particle-love/        # Phase 3: GPGPU ★3
05-tao-tajima/           # Phase 4: 映像×WebGL ★4
shared/                  # 共通ユーティリティ
assets/                  # Blender 制作アセット（.blend, .glb）
```

## 各模写のエントリポイント
各ディレクトリに `index.html` + `src/main.ts` を配置。
Vite の multi-page 構成で個別に起動可能。

## シェーダー
- `.glsl` / `.frag` / `.vert` ファイルは `vite-plugin-glsl` で import
- uniform 命名: `u_` prefix（例: `u_time`, `u_mouse`, `u_resolution`）

## デザインシステム（Radix Themes → WebGL）

`shared/theme.ts` に Radix Themes の設計思想を WebGL 用に翻訳した統合テーマシステムを定義している。

### Radix 概念 ↔ WebGL 対応表

| Radix 概念 | 実装 | WebGL での役割 |
|-----------|------|--------------|
| Colors 12段階 | `colors.neutral[1〜12]` | Step 1-2: 背景/fog、Step 3-5: 環境光/オブジェクト、Step 6-8: エッジ光/ハイライト、Step 9-10: アクセント光（Amber）、Step 11-12: HTML テキスト |
| Spacing 9段階 | `space[1〜9]` | 0.1〜1.6 のワールド単位。オブジェクト間距離・カメラ距離に使用 |
| Container 4サイズ | `container[1〜4]` | Canvas の max-width (448/688/880/1136px) |
| Breakpoints 6段階 | `breakpoints.initial/xs/sm/md/lg/xl` | `responsive()` ヘルパーで画面幅対応 |
| Scaling | `scaling.factor` | 全体密度係数 (0.9〜1.1)。spacing・カメラ距離に乗算 |

### 新しい模写を始めるときの手順

```typescript
// 1. theme.ts を import
import { colors, space, container, breakpoints, scaling, themes, responsive } from '@shared/theme';

// 2. themes に新しいプリセットを追加（theme.ts を編集）
export const themes = {
  atmos: { ... },
  myScene: {                         // ← 追加
    background: colors.neutral[1],
    fogColor:   colors.neutral[2],
    fogDensity: 0.08,
    ambientColor: colors.neutral[3],
    ...
  },
};

// 3. Environment.ts でプリセットを参照
import { themes, scaling, space } from '@shared/theme';
const t = themes.myScene;
scene.background = t.background.clone();
scene.fog = new THREE.FogExp2(t.fogColor.getHex(), t.fogDensity);

// 4. responsive() でレスポンシブ対応
const cols = responsive({ initial: 1, sm: 2, md: 3 });
```

### import パス

Vite の alias 設定 (`@shared`) を使用:
```typescript
import { colors, space, themes } from '@shared/theme';
```

## 参照
- ロードマップ: /Users/chibatakumi/Documents/life/docs/guides/2026-03-25-webgl-blender-learning-roadmap.md
- 模写対象: /Users/chibatakumi/Documents/life/docs/guides/2026-03-25-webgl-study-targets.md
- デザインシステム知見: /Users/chibatakumi/Documents/life/.claude/knowledge/patterns/2026-03-26-webgl-radix-themes-design-system.md
