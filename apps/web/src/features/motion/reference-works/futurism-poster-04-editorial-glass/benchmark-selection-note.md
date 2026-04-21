# Futurism Poster 04 Editorial Glass Benchmark Selection Note

## Chosen Benchmark

- chosen poster lane: `POSTER 4`
- chosen comp pair:
  - `FINAL_RENDER (POSTER 4)`
  - `MainScene POSTER 4`
- edit-control entry:
  - `_EDIT_COLOR (POSTER 4)`

## Why This Lane Wins

- it is the clearest text-driven poster in the pack that still preserves the pack's futurism grammar
- it stays materially narrower than posters `1`, `2`, `3`, and `6`
- it is less fused than poster `5`, which hides more of its look inside repeated masked glass strips and denser expression wiring
- it keeps the hero read on editable typography rather than on character footage or sphere systems

## Comp Topology

- `_EDIT_COLOR (POSTER 4)` is a `2`-layer wrapper: `COLOR CONTROL` plus `FINAL_RENDER (POSTER 4)`
- `FINAL_RENDER (POSTER 4)` is a `1`-layer wrapper over `MainScene POSTER 4`
- `MainScene POSTER 4` contains `29` layers and no camera or light layers
- main editorial headline source:
  - `Text 1`
  - copy: `A Fusion / of Modern / Expression`
  - font: `Maxular-Light`
  - size: `250`
- date source:
  - `Text 2`
  - copy: `Sep 20-23`
  - font: `Maxular-Light`
  - size: `165`
- stacked utility-strip sources:
  - `poster_4_text_precomp_1` -> `Street Art Experience`
  - `poster_4_text_precomp_2` -> `Gallery Exhibitions`
  - `poster_4_text_precomp_3` -> `Artist Talks`
  - all three use `Maxular-Light` at `110`
- duplicated text layers are used as timed reveal slices rather than one deep text-animator system
- accent and substrate layers are bounded:
  - `Glass_waves_big.mp4` with `Glass_waves_big_luma.mp4`
  - `holo_bg_1.mp4`
  - `bubles_infl.mp4`
  - `Design_element_3`
  - `Circle_elements`
  - generated `grid`
  - flat `bg`
- helper and matte layers remain local and do not justify whole-pack abstraction:
  - disabled `bubles_transition_luma`
  - disabled `Glass_waves_big_luma.mp4` matte layers
  - disabled `Circle_elements` matte layer

## Timing Read

- the headline begins immediately through four staggered duplicates across roughly `0.00s` to `1.00s`
- the date and first supporting strip enter around `1.00s`
- the second supporting strip enters around `1.60s`
- the third supporting strip enters around `2.33s`
- the glass-wave handoff changes state around `2.90s`
- the rest of the poster largely holds rather than changing camera or scene structure

## Family Hypothesis

- this is not a general poster framework benchmark; it is a narrow `editorial-glass futurism poster` lane
- the family grammar is:
  - large stacked editorial type
  - sequential utility-strip disclosures
  - shallow holographic glass overlays
  - one procedural grid/bubble substrate
  - no camera move and no character-driven centerpiece

## Main-Home Recommendation

- recommended main home: `hybrid but bounded`
- rationale: the editable poster logic is fundamentally typography and layout, but the source still depends on luma-masked texture layers that are awkward to force into pure `SVG + DOM`
- the bounded split should be:
  - editable text and layout in `SVG + DOM`
  - glass/grid/bubble accent layers in a contained GPU or canvas surface
- do not let the bounded accent layer grow into a whole-pack renderer decision

## Source Risks

- the glass and holographic footage are source-specific and should stay local to this benchmark lane
- the lane does not currently show a plugin blocker, but it does rely on texture treatment, matte relationships, and hold-state compositing that should be validated visually in runtime
- if runtime work starts pulling in poster `5` for comparison, scope has already widened too far
