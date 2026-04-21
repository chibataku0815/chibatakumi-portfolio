# Futurism Posters Pack AE Intake Note

## Source Truth

- pack root: `/Users/chibatakumi/Downloads/Futurism_Posters_Pack_source_2064499`
- AEP: `/Users/chibatakumi/Downloads/Futurism_Posters_Pack_source_2064499/After Effects/Futurism Posters Pack.aep`
- inspected via `After Effects MCP` on `2026-04-11 JST`
- project inventory: `235` items
- poster output pattern: `_EDIT_COLOR (POSTER n)` -> `FINAL_RENDER (POSTER n)` -> `MainScene POSTER n`
- poster comp baseline: all `2160x3840`, `10s`, `30fps`
- sibling non-poster lane present: `logo reveal`
- font references bundled with the pack: `Anonymous`, `Maxular`

## Candidate Reduction

- `POSTER 1`: `51` layers in `MainScene`, sphere-heavy, `78` effects, `55` expressions
- `POSTER 2`: `60` layers, face-footage heavy, `28` matte relationships
- `POSTER 3`: `45` layers, bulb system heavy, `97` effects
- `POSTER 4`: `29` layers, text-first, glass/circle accents, `42` effects, `26` expressions
- `POSTER 5`: `28` layers, text-first, but `7` repeated glass-mask layers plus `game_pad` footage, `49` effects, `42` expressions
- `POSTER 6`: `60` layers, head/skull footage heavy, `94` effects

## Intake Read

- `POSTER 4` and `POSTER 5` are the only credible first-benchmark candidates by bounded scope
- `POSTER 4` is the cleaner intake lane because the text structure is explicit and the footage stack is shallower than `POSTER 5`
- `POSTER 5` looks simple by layer count, but the lane is more fused through masked `elements_glass` duplication and higher expression density
- no third-party render plugin blocker was observed in `POSTER 4`; inspected effects stayed within stock `ADBE/*` and `CC Ball Action`

## Intake Outcome

- benchmark recommendation: `POSTER 4`
- chosen comp pair:
  - `FINAL_RENDER (POSTER 4)`
  - `MainScene POSTER 4`
- edit entry for color inspection:
  - `_EDIT_COLOR (POSTER 4)`
