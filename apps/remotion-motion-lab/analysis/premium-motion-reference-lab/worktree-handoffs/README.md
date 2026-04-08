# Premium Motion Lab Parallel Worktree Handoffs

This directory contains separated English handoff documents for parallel worktree execution.

These docs are intended for high-precision delegation, either to humans or coding agents.

## Shared Context

Repository root:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio`

Primary app:
`/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab`

Current task:
- Build reusable knowledge from the premium motion lab
- Convert research logic into reusable production-facing APIs
- Keep the motion lab useful as a decision-making tool
- Avoid drifting back into SearchGPT recreation work

Important:
- This is not a SearchGPT recreation task
- Do not continue polishing the old SearchGPT output
- Do not revert unrelated user changes
- Assume multiple workers are editing the codebase in parallel

## Recommended Split

Worktree 1:
- Premium motion primitives and systems
- Primary ownership:
  - `src/lib/premium-motion-primitives.ts`
  - `src/lib/premium-motion-systems.ts`
  - `src/lib/premium-motion.ts`

Worktree 2:
- Premium shot recipes
- Primary ownership:
  - `src/lib/premium-shot-recipes.ts`
  - optional tiny example file only

Worktree 3:
- Motion study tools and comparison infrastructure
- Primary ownership:
  - `src/lib/motion-study-tools.ts`
  - minimal metadata refactor only if needed

This split is intended to minimize merge conflicts.

## Existing Relevant Files

- `src/lib/premium-motion.ts`
- `src/compositions/63-premium-motion-reference-lab/Composition.tsx`
- `src/compositions/63-premium-motion-reference-lab/studies.ts`
- `analysis/premium-motion-reference-lab/research-note-2026-04-08.md`

## Validation Standard

Each worker should at minimum run:

```bash
npx tsc --noEmit
```

If a worker touches render-facing code, they should render at least one relevant composition when practical.

## Final Report Standard

Each worker should report:

1. What they changed
2. Exact files changed
3. Verification performed
4. Risks, assumptions, or follow-up items

## Documents

- `worktree-01-premium-motion-primitives-and-systems.md`
- `worktree-02-premium-shot-recipes.md`
- `worktree-03-motion-study-tools.md`
