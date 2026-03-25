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

## カラーシステム（Radix 12段階 WebGL マッピング）

### palette.ts の使い方

```ts
import { neutral, amber } from "@shared/palette";

// シーン背景
scene.background = neutral[1];

// fog
scene.fog = new THREE.FogExp2(neutral[2].getHex(), 0.08);

// 環境光
new THREE.AmbientLight(neutral[4].getHex(), 0.6);

// アクセント主光源（ポートフォリオ amber と統一）
new THREE.PointLight(amber[9].getHex(), 3.0, 12);

// リム光（エッジ光）
new THREE.DirectionalLight(neutral[7].getHex(), 1.5);
```

### Radix 12段階 → WebGL 対応表

| Step | neutral 値  | amber 値   | 用途                          |
|------|------------|-----------|-------------------------------|
| 1    | `0x0a0a0f` | `0x0f0c07`| シーン背景（最も暗い）           |
| 2    | `0x111118` | `0x1a1508`| fog 遠景色 / subtle 背景       |
| 3    | `0x1a1a2e` | `0x2e2408`| 要素背景 / emissive ベース     |
| 4    | `0x222240` | —         | 環境光色 / 中間オブジェクト     |
| 5    | `0x2a2a50` | —         | アクティブ要素 / マテリアル色   |
| 6    | `0x333366` | —         | エッジ光 / セパレーター         |
| 7    | `0x444488` | —         | UI ボーダー / ハイライト / リム光|
| 8    | `0x5555aa` | —         | グロー境界 / ホバーボーダー     |
| 9    | `0x6666cc` | `0xf0b25a`| **solid アクセント / 主光源**  |
| 10   | `0x7777dd` | `0xe09f3a`| ホバーアクセント / 補助光源     |
| 11   | `0x9999bb` | `0xd4a574`| 低コントラストテキスト / パーティクル|
| 12   | `0xeeeef0` | `0xf5f0e8`| 高コントラストテキスト（最も明るい）|

> `amber[9]` = portfolio CSS 変数 `--accent-amber1` (#f0b25a) と一致させること。

### 新しい模写を始めるときのカラー設計手順

1. **背景から決める**: `neutral[1]` or `neutral[2]` でシーン背景を選択
2. **fog を設定**: 背景より 1 step 明るい値（例: bg=1 → fog=2）
3. **ライティング階層**:
   - 環境光: `neutral[3〜5]`（低強度）
   - 主光源: `amber[9〜10]`（高強度 / アクセント色）
   - リム光: `neutral[6〜8]`（エッジ演出）
4. **マテリアル**: `neutral[4〜6]` を `color` / `emissive` に割り当て
5. **パーティクル・霞**: `neutral[10〜11]` + `opacity: 0.4〜0.7`
6. **HTML オーバーレイ**: テキストは `neutral[12]` or `amber[12]`

## 参照
- ロードマップ: /Users/chibatakumi/Documents/life/docs/guides/2026-03-25-webgl-blender-learning-roadmap.md
- 模写対象: /Users/chibatakumi/Documents/life/docs/guides/2026-03-25-webgl-study-targets.md
