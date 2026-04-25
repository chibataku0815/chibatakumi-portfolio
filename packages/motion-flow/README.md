# @chibatakumi/motion-flow

**Status**: skeleton only

`life/output/motion-flowline-webgpu` を portfolio に取り込む participant。

## 特徴

- 4000-16000 agent の particle field（curl-noise advection + ribbon trails）
- 7 scene auto-cycle（laminar / turbulent / spirograph / lissajous / attractor-knot / epitrochoid / comb-flow）
- Audio reactivity: 8 params（field breath / vorticity pulse / trail rim + film bloom / tonemap / grain / chroma）
- Glyph SDF attractor で文字形状に集まる scene あり
- 0.5s scene blend を持つ — **portfolio shell の page transition に流用**

## portfolio 側の使われ方

- `/experiments/flow` — full intensity + 7-scene auto-cycle、numeric key で scene pin
- portfolio shell の page transition orchestrator — scene blend pattern を流用
- `/works` → 作品ページ遷移 — flow の handoff vocabulary
