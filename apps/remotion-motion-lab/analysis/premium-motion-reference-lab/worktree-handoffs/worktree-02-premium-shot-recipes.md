# Worktree 2 Handoff

## Title

Premium Shot Recipes

## Environment

You are working in a dedicated git worktree for the repository below.

Repository root:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`

Primary app:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab`

## Primary Goal

Build a reusable shot-recipe layer on top of the premium motion system so future productions can call higher-level shot grammar functions instead of assembling low-level state manually.

## Important Context

This is not a SearchGPT recreation task.

Do not work on the old SearchGPT output except for reading background if needed.

The motion lab exists as a research tool and should remain usable.

Current relevant files:
- `src/lib/premium-motion.ts`
- `src/compositions/63-premium-motion-reference-lab/studies.ts`
- `src/compositions/63-premium-motion-reference-lab/Composition.tsx`
- `analysis/premium-motion-reference-lab/research-note-2026-04-08.md`

## Mission

Create a new library file:

- `src/lib/premium-shot-recipes.ts`

This file should provide higher-level reusable shot-building functions that package premium motion systems into production-ready shot patterns.

## Ownership

You own:
- `src/lib/premium-shot-recipes.ts`

Optional:
- a tiny example usage file if truly helpful

Avoid broad edits outside this scope.

## Target Recipe Examples

- `createPremiumSearchEntryShot`
- `createPremiumResultRevealShot`
- `createPremiumWeatherPullbackShot`
- `createPremiumSendIconBeat`
- `createPremiumContinuitySwapShot`
- `createPremiumLayeredPanelReveal`

Each recipe should:
- accept `frame` and explicit options
- return structured state only
- not render JSX
- be reusable from any future composition
- compose lower-level premium motion systems rather than duplicating math

## Suggested Return Shape

A shot recipe can return nested state like:

- `background`
- `shell`
- `chrome`
- `content`
- `detail`
- `editorial`
- `labels` if needed

The recipe should answer:

What should the shot state be at this frame?

Not:

How should React render it?

## Requirements

1. Introduce clear TypeScript types for recipe options and result shapes
2. Use the premium motion API, not copy-pasted internal logic
3. Add at least 4 to 6 recipe functions
4. Keep them neutral and reusable, not tied to one specific branded layout
5. Make naming production-friendly rather than research-only
6. Add concise comments where the logic is not obvious

## Optional But Useful

- Add one small internal helper for composing shell / chrome / content timing
- Add preset option bundles if they improve reuse

## Constraints

- Avoid speculative APIs with no present use case
- Keep interfaces explicit
- Do not add decorative concepts
- Do not change existing render scripts
- Do not touch unrelated files

## Acceptance Criteria

- `premium-shot-recipes.ts` exists
- The file uses the premium motion API instead of re-implementing it
- The exported recipes feel production-usable
- TypeScript passes cleanly

## Verification

Required:

```bash
npx tsc --noEmit
```

If useful, include one minimal usage example that type-checks.

## Final Response Format

1. What recipe layer you created
2. Which recipe functions exist
3. Files changed
4. Verification performed
5. Any API assumptions

## Collaboration Rules

You are not alone in the codebase.

Do not revert edits made by others.
