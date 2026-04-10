# Staged Emphasis Payoff Benchmark Pack

- benchmark source:
  - `/Volumes/SamsungPortableSSDX5001/documents/life/sources/after-effects/AE_LogoAnimation/CASE_05_TitleSequence/Preview/05_TitleSequence_Txt2.mp4`
- duration / fps / resolution:
  - `2.002s / 29.97fps / 1000x500`
- key frames:
  - `contact-sheet.png`
  - `00-00.png`
  - `00-16.png`
  - `00-30.png`
  - `00-44.png`
  - `00-59.png`

## First Read

A single condensed station title enters by staggered grapheme arrival, locks briefly as a full read, then sheds characters in a delayed release on the same baseline.

## Motion Event Order

1. blank white field
2. first-word graphemes accumulate with offset opacity and blur
3. second-word graphemes join late, creating the emphasized completion read
4. full `Shinagawa Station` lockup holds for the payoff read
5. release begins as selected graphemes fade before the anchors do
6. the line resolves back toward blank

## Grammar Hypothesis

- the work is a single-line text animation, not a poster system
- all motion meaning is carried by grapheme timing, not camera or layout motion
- the important feel is delayed completion followed by delayed disappearance

## Renderer-Home Hypothesis

- `SVG + DOM` remains the correct main home
- the source is flat, centered, text-first, and does not require particle, depth, or GPU-only behavior for the core read

## Custom Primitive Necessity Hypothesis

- no new custom primitive is required in this pass
- the benchmark difference was absorbed by refining grapheme splitting and adding a release-aware delayed stack inside the local family boundary

## Acceptance Path

- keep the pass route-local and family-local
- verify the helper contracts against this single benchmark only
- stop before helper promotion, template admission, or production hardening
