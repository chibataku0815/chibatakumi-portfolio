# Worktree 1 Handoff

## Title

Premium Motion Primitives and Systems

## Environment

You are working in a dedicated git worktree for the repository below.

Repository root:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`

Primary app:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab`

## Primary Goal

Refactor the current premium motion research logic into a production-grade reusable library split into primitives and systems, without materially changing the visual output of the existing motion lab.

## Important Context

This is not a SearchGPT recreation task.

Do not continue polishing or rescuing the old SearchGPT recreation.

The current motion lab already exists and currently depends on:
- `src/lib/premium-motion.ts`
- `src/compositions/63-premium-motion-reference-lab/Composition.tsx`
- `src/compositions/63-premium-motion-reference-lab/studies.ts`

The task is to improve structure and reusability, not to invent a new motion language.

## Mission

Create a clearer reusable API by splitting the current premium motion code into:

- `src/lib/premium-motion-primitives.ts`
- `src/lib/premium-motion-systems.ts`

Keep:
- `src/lib/premium-motion.ts` as a compatibility facade or barrel export
- existing public behavior intact
- existing motion lab renders visually unchanged or extremely close

## Ownership

You own these files:
- `src/lib/premium-motion-primitives.ts`
- `src/lib/premium-motion-systems.ts`
- `src/lib/premium-motion.ts`

You may edit related imports in:
- `src/compositions/63-premium-motion-reference-lab/Composition.tsx`
- `src/compositions/63-premium-motion-reference-lab/studies.ts`
- `src/compositions/63-premium-motion-reference-lab/motionSystem.ts`

Do not broadly rewrite unrelated compositions.

## Scope

1. Move low-level math and generic motion profile logic into `premium-motion-primitives.ts`
2. Move reusable state builders into `premium-motion-systems.ts`
3. Keep exports stable through `premium-motion.ts`
4. Update internal imports as needed
5. Preserve TypeScript safety and clean naming

## Expected API Shape

### Primitives

- clamp helpers
- mix / lerp helpers
- curve resolvers
- motion profile types
- profile builders such as:
  - `createFlatProfile`
  - `createFastLaunchLongSettle`
  - `createBackControlProfile`
- progress resolvers such as:
  - `resolvePremiumMotionProgress`
  - `resolvePremiumClampedProgress`
  - `resolveDelayedProgress`

### Systems

- `getPremiumPushInState`
- `getPremiumPullBackState`
- `getPremiumLongSettleState`
- `getPremiumSnapInState`
- `getPremiumContinuityCutState`
- `getPremiumEditorialGapState`
- `getPremiumLayeredRevealState`

## Constraints

- Do not edit unrelated compositions
- Do not modify SearchGPT-specific files unless required for import safety
- Do not invent new visual behavior
- Do not rename composition IDs or npm scripts
- Favor backward compatibility over elegance if needed
- Use ASCII only unless the file already requires otherwise

## Acceptance Criteria

- New primitives file exists and is coherent
- New systems file exists and is coherent
- `premium-motion.ts` still provides a clean public API
- The motion lab still compiles
- At least one relevant motion-lab render still succeeds

## Verification

Required:

```bash
npx tsc --noEmit
```

Recommended:

```bash
npm run render:motion-lab:push-in
```

## Final Response Format

1. Summary of architecture changes
2. Exact files changed
3. Verification performed
4. Risks or follow-up suggestions

## Collaboration Rules

You are not alone in the codebase.

Do not revert edits you did not make.

If you encounter user changes, work with them rather than overwriting them.
