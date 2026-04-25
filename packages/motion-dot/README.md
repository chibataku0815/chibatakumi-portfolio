# @chibatakumi/motion-dot

**Status**: skeleton only

`life/output/motion-dot-new-webgpu` を portfolio に取り込む participant。

## 由来

motion-dot-new-webgpu は metaball SDF particle system + 17+ scene + kinetic-handoff transition + 2.5D composite (gallery mode) + film post + audio reactive を備える完成度の高い WebGPU 作品。Phase 1 探索で発見。

### 内蔵 scene 一覧（gpu-fx-presets 経由）

orbit / river / magnet / mitosis / pendulum / ripple / delta / flock / helix / phase-transition / firefly / molecular / chain / converge / text-attractor / grid-fluid / metaball-sdf

## portfolio 側の使われ方（renewal 後）

| Surface | 採用 scene | 強度 |
|---|---|---|
| Home Hero | TBD（候補: orbit or grid-fluid） | 高 |
| Home スクロール | river ambient loop | 中 |
| /about | static dot grid | 低 |
| /craft | 5 faces それぞれに pattern variation | 中 |
| /experiments/dot | gallery mode（17 scene 全部 + kinetic handoff）| 最大 |

## Stream 2 タスク

1. motion-dot-new-webgpu のソースを portfolio package に取り込み（submodule or subtree、stream-1-handoff で確定方針に従う）
2. `createDotScene(name: SceneName, opts: SceneOpts): MotionParticipant` 実装
3. portfolio shell からの動作確認（demo route）
