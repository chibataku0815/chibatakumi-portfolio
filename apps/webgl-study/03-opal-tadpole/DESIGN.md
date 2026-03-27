# 03-opal-tadpole --- Product Viewer

> Inspired by: Opal Tadpole (https://opalcamera.com/tadpole) --- Awwwards SOTD 2024
> Pattern: #4 Product Viewer (PBR + Studio Lighting + Scroll-Driven Camera)
> Note: The original site does not use WebGL (image sequence + GSAP). This study reconstructs the same experience in real-time 3D.

## Tech Stack
- Three.js (vanilla, same as 02-atmos)
- GSAP ScrollTrigger (scrub: 1)
- MeshPhysicalMaterial (PBR)
- HDRI environment map (RGBELoader + PMREMGenerator)
- SpotLight + RectAreaLight (3-point lighting)
- NeutralToneMapping (Khronos PBR Neutral — accurate product colors)
- EffectComposer (Bloom + FXAA)

## Section Layout (5 sections)
| # | ID | Camera Shot | Text Content |
|---|-----|------------|------------|
| 1 | hero | 3/4 view, slow rotation | Product name + tagline |
| 2 | design | Front -> angled, emphasize texture | Material & design description |
| 3 | detail | Zoom into lens/dial | Features & specs |
| 4 | experience | Handheld angle | Usage experience |
| 5 | cta | Pull back, full product view | Call to action |

## Camera Keyframes
GSAP timeline `.to()` chain with discrete transitions (no CatmullRomCurve3).
Each shot transition uses `power2.inOut` easing for smooth interpolation.

## File Structure
```
03-opal-tadpole/
  DESIGN.md
  index.html
  src/
    main.ts
    scene/
      Lighting.ts
      CameraAnimation.ts
    utils/
      scroll-progress.ts    (copied from 02-atmos)
      blur-text.ts           (copied from 02-atmos)
      responsive-config.ts   (adapted for product viewer)
```

## Inheritance from 02-atmos
- shared/theme.ts (Radix colors)
- shared/gltf-loader.ts (Draco)
- utils/scroll-progress.ts -> reused as-is
- utils/blur-text.ts -> reused as-is
- utils/post-processing.ts -> imported from 02-atmos (shared pattern)
- utils/responsive-config.ts -> new: FOV/dpr tuned for product viewer
- utils/debug-gui.ts -> new: product viewer debug panel (Phase C)

## Phase Plan
- Phase A: Model + HDRI + PBR + Lighting + HTML ✅ 完了
- Phase B: Camera keyframes + scroll integration + blur-text連動 ← 実装中
- Phase C: Section-specific lighting + responsive強化 + CSS custom property bridge
- Phase D: Tuning + performance profiling + deprecation fix + 最終polish
