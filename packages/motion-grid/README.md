# @chibatakumi/motion-grid

**Status**: skeleton only

`life/output/motion-grid-guided-webgpu` を portfolio に取り込む participant。

## 特徴

- Typography 駆動の discrete grid（block layout）
- Visitor 入力可能（3-36 chars hero word → handoff morphing）
- Audio reactivity: 3 params（film bloom threshold / intensity / tonemap compression）
- 45 FPS fixed timestep

## portfolio 側の使われ方

- `/experiments/grid` — full intensity + 入力 enable
- `/works` 一覧 grid — block layout を nav grid vocabulary に流用（render path のみ、interaction なし）
