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

## 参照
- ロードマップ: /Users/chibatakumi/Documents/life/docs/guides/2026-03-25-webgl-blender-learning-roadmap.md
- 模写対象: /Users/chibatakumi/Documents/life/docs/guides/2026-03-25-webgl-study-targets.md
