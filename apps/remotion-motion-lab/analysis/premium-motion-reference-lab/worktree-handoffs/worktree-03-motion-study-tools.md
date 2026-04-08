# Worktree 3 Handoff

## Title

Motion Study Tools and Comparison Infrastructure

## Environment

You are working in a dedicated git worktree for the repository below.

Repository root:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`

Primary app:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab`

## Primary Goal

Turn the motion lab into a stronger reusable research instrument by extracting comparison and study utilities into a reusable tool layer.

## Important Context

This is not a SearchGPT recreation task.

The current motion lab already renders and already has:
- an overview composition
- per-study compositions
- a still capture script
- a research note

Relevant files:
- `src/compositions/63-premium-motion-reference-lab/Composition.tsx`
- `src/compositions/63-premium-motion-reference-lab/studies.ts`
- `scripts/capture-premium-motion-lab-stills.sh`
- `analysis/premium-motion-reference-lab/research-note-2026-04-08.md`

## Mission

Create a reusable study tooling layer for generating and comparing motion variants.

Create:

- `src/lib/motion-study-tools.ts`

## Ownership

You own:
- `src/lib/motion-study-tools.ts`

You may make minimal supporting edits to study metadata if needed.

Do not drift into broad composition rewrites.

## Possible Capabilities

- `createVariantMatrix`
- `createStudyPanelMeta`
- `getRepresentativeFrameSet`
- `buildComparisonLabels`
- `summarizeVariantAxes`
- `createContactSheetPlan`
- `selectDefaultCaptureFrames`

The focus is not rendering math.

The focus is:
- study organization
- comparison metadata
- evaluation structure
- capture planning

## The Tools Should Help Answer

- what variants exist
- how they differ
- which frames are most useful to inspect
- how to label comparison panels consistently
- how to generate repeatable still and contact-sheet capture plans

## Requirements

1. Design explicit types for:
   - study metadata
   - variant metadata
   - comparison axis descriptions
   - representative frame plans
   - contact-sheet plans
2. Make the functions reusable for future studies beyond the current seven
3. Avoid embedding branding or one-off copy
4. Keep the functions pure where possible
5. If practical, refactor current motion-lab study metadata to use these utilities
6. Keep file ownership focused on tooling

## Nice To Have

- A helper that standardizes Observed versus Inference labeling
- A helper for strongest-variant shortlist data structure
- A helper for render or capture command metadata if useful

## Constraints

- Do not change unrelated compositions
- Do not rewrite the research note heavily
- Do not create a generic motion-graphics showcase
- Keep the output clearly useful for future production decision-making

## Acceptance Criteria

- `motion-study-tools.ts` exists
- Types are explicit and reusable
- The exports improve comparison and capture repeatability
- Any metadata refactor remains small and focused
- TypeScript passes cleanly

## Verification

Required:

```bash
npx tsc --noEmit
```

If you refactor study metadata usage, verify imports and typing are clean.

## Final Response Format

1. Tooling layer summary
2. New exported functions
3. Files changed
4. Verification performed
5. Follow-up ideas if any

## Collaboration Rules

You are not alone in the codebase.

Do not revert unrelated edits.
