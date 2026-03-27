# 05 — Tao Tajima (Video × WebGL)

> Pattern #6: 映像×WebGL統合 | 原作: Tao Tajima by homunculus Inc.

## Overview

映像ディレクターのポートフォリオサイトを模写。
PlaneGeometry 1枚 + フラグメントシェーダーで
無限スクロールギャラリー + 映像テクスチャ遷移を実装する。

### 習得する核心技術

| 技術 | 概要 |
|------|------|
| VideoTexture | HTMLVideoElement をテクスチャソースに。muted/playsinline/autoplay 制約対応 |
| Fragment Shader Transition | 2テクスチャの mix + UV オフセットによるスライド遷移 |
| Scroll-driven Gallery | wheel イベント → floor/fract 分解 → progress uniform 更新 |
| Image Effects | RGB Shift, Distortion, Film Grain をフラグメントシェーダーで |
| GSAP Integration | スナップイージング + タイムライン連携 |

## Architecture

```
main.ts
├── WebGLRenderer (antialias: false)
├── Scene
├── OrthographicCamera (-1,1,-1,1, 0.1, 10)
├── PlaneGeometry(2, 2) — fullscreen quad
├── ShaderMaterial
│   ├── gallery.vert (passthrough: vUv)
│   └── gallery.frag (mix transition + effects)
├── Gallery
│   ├── TextureManager (load/swap textures + VideoTexture)
│   └── uniform updates (uTexture1, uTexture2, uProgress)
├── ScrollController
│   ├── wheel event → raw scroll accumulation
│   ├── floor() = current slide index
│   ├── fract() = transition progress (0-1)
│   └── snap easing → closest integer
└── AnimationLoop
    ├── scroll physics update
    ├── texture swap logic
    └── renderer.render()
```

## Shader Design

### gallery.vert
```
Input:  position, uv
Output: vUv
Logic:  passthrough, gl_Position = vec4(position, 1.0)
```

### gallery.frag
```
Input:  uTexture1, uTexture2, uProgress, uDistortion, uRGBShift, uTime
Output: gl_FragColor
Logic:
  1. UV offset: uv.y + progress (vertical slide)
  2. Color progress: uv.y + uv.x * 0.3 + progress (diagonal wipe)
  3. mix(texture1, texture2, colorProgress)
  4. Phase B: + RGB shift + noise distortion + film grain
```

## Visual Design

- **Background**: #000000
- **Layout**: Fullscreen, edge-to-edge
- **Typography**: Minimal, Instrument Serif (overlay)
- **Transition**: Diagonal wipe with UV offset
- **Effects**: RGB Shift + Film Grain (Phase B)

## Interaction

- Scroll (wheel) → continuous progress accumulation
- Snap to nearest slide on scroll stop
- Phase B: Mouse → ripple/lens distortion

## Assets

- 3-5 static images (720p, landscape)
- 1-2 video clips (720p MP4, muted, loop, 10-20s)
- Source: Pexels / Pixabay (license OK for portfolio)

## Debug GUI (#debug)

| Folder | Controls |
|--------|----------|
| Scroll | speed, snapStrength, friction |
| Effects | rgbShiftAmount, distortionStrength, grainIntensity |
| Camera | (minimal — 2D orthographic) |

## Phases

### Phase A: Scroll Gallery Foundation (3-4h)
- Fullscreen PlaneGeometry + ShaderMaterial
- 2-texture mix transition (scroll-driven)
- UV offset + diagonal wipe
- Snap easing
- Success: Scrolling switches between static images

### Phase B: VideoTexture + Effects (3-5h)
- Replace some textures with VideoTexture
- RGB Shift + Distortion + Film Grain
- Mouse interaction
- Debug GUI
- Success: Video textures with realtime shader effects

### Phase C: Polish — SKIP (核心通過で完了)

## References

- [akella/taotajima.jp (GitHub)](https://github.com/akella/taotajima.jp)
- [Taotajima.jp WebGL Deconstruction (Medium)](https://medium.com/@akella/taotajima-jp-webgl-deconstruction-af4946e8e8ed)
- [Awwwards: Tao Tajima](https://www.awwwards.com/sites/tao-tajima-filmmaker)
- Three.js RGBShiftShader, FilmShader (built-in)
- Codrops: Creative WebGL Image Transitions
