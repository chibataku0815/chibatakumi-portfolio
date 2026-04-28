# @chibatakumi/motion-core

**Status**: skeleton only (Phase 1 / Stream 1 not started)

Renewal 2026 のモーション基盤。`webgpu-motion-*` 8 packages を再エクスポートし、`MotionParticipant` API で portfolio shell に統合する。

## サブモジュール構成（Stream 1 で実装）

| Sub-export | 由来 | 役割 |
|---|---|---|
| `./shell` | webgpu-motion-shell | initGpu / fixed-step loop / offscreen target pool |
| `./audio` | webgpu-motion-audio | AudioBus / defineAudioWiring |
| `./post` | webgpu-motion-post | MotionFilmPostPass / FILM_STOCK_CANON |
| `./art` | webgpu-motion-art | palette / SDF glyph |
| `./participant` | 新規 | MotionParticipant lifecycle, scene blending |

## Stream 1 着手手順

1. `webgpu-motion-libs` 独立 repo を作成し、life の `packages/webgpu-motion-{art,audio,dom,input,post,scene,shell,ui}` を `git subtree split` で移行
2. portfolio の `vendor/webgpu-motion-libs` に submodule として追加
3. portfolio root package.json の workspaces に `vendor/webgpu-motion-libs/packages/*` を追加
4. このパッケージから `vendor/...` 配下の package を re-export
5. `MotionParticipant` API の実装

詳細は `docs/renewal-2026/archive/wave1-2/stream-1-motion-core-handoff.md` 参照。

## 依存（Stream 1 で確定）

```jsonc
// package.json dependencies (TBD)
{
  "webgpu-motion-shell": "workspace:*",
  "webgpu-motion-audio": "workspace:*",
  "webgpu-motion-post": "workspace:*",
  "webgpu-motion-art": "workspace:*"
}
```
