# Director Reset Ledger — 2026-04-26 JST

Parent SSoT:

- `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`

This ledger supersedes the old Wave 1 / Wave 2 completion percentage for launch
readiness. A route compiling, returning `200`, or having metadata does not count
as portfolio completion.

## Operating Rule

Prioritize the real portfolio surface first:

1. canonical IA and routes
2. real core content
3. real motion works
4. satellite canonicalization
5. QA / screenshots / deploy only after the above have substance

Do not spend time on outer-shell QA, preview deploys, Search Console, broad doc
polish, or percent recalculation while public pages are still hollow.

## Current Read-Only Audit

Checked from repo root on 2026-04-26 JST.

Evidence:

- Global nav is still `Home / Skills / Interactive / Photography / Profile / Contact`
  in `apps/web/src/shared/data/portfolio.ts`.
- `/experiments` has no index page. Only `/experiments/dot`, `/experiments/grid`,
  and `/experiments/flow` exist.
- `/experiments/grid` and `/experiments/flow` visibly say `Restoring after
  motion-dot transplant`.
- `/journal`, `/about`, and `/craft` still contain `TODO(Wave 2 / future chat)`.
- `/photography` currently redirects to `/works/photography`, against the reset
  plan.
- `/film-lab` currently redirects to `/works/filmtone`, against the reset plan.
- Sitemap still exposes `/works`, `/works/photography`, `/works/commercial`,
  `/works/installation`, `/craft`, `/about`, and `/works/filmtone`.

## Ledger Status

### Core IA Readiness: Not Ready

Blocking facts:

- Header/footer primary navigation is not `Home / Experiments / Journal / Contact`.
- Legacy routes are not redirected to the reset-plan destinations.
- `/photography` and `/filmtone` are not canonical public routes.
- Sitemap exposes old core destinations.

Close only when:

- nav is exactly `Home / Experiments / Journal / Contact`
- `/works`, `/about`, `/craft`, `/profile`, `/skills`, `/interactive`, `/motion`
  redirect per parent plan
- `/photography` and `/filmtone` are excluded from global nav
- sitemap exposes canonical surfaces only

### Core Portfolio Content Readiness: Not Ready

Blocking facts:

- `/experiments` index is missing.
- `/journal` is a title/paragraph placeholder.
- `/about` and `/craft` are hollow pages and should be redirected or absorbed.
- Home is minimal and motion-present, but needs a final content pass only after
  nav and `/experiments` exist.

Close only when:

- Home is identity-first and non-commercial
- `/experiments` is a real artwork index
- `/journal` lists real entries, including existing motion-study routes
- `/contact` remains minimal and functional
- public core routes have no TODO / future-chat / placeholder language

### Motion Works Readiness: Not Ready

Blocking facts:

- dot route exists, but current implementation is under active remediation.
- grid and flow are explicit placeholders.
- `/experiments` cannot link to all three works because the index is missing.

Close only when:

- dot visual parity is verified
- grid and flow are non-placeholder visual experiences
- unsupported WebGPU state is explicit
- audio/mic behavior is checked only after the works are real

### Satellite Readiness: Not Ready

Blocking facts:

- rich photography feature and media exist, but canonical route is still wrong.
- Filmtone public pages live under `/works/filmtone`, not `/filmtone`.
- internal Filmtone links still use `/works/filmtone` in multiple components.

Close only when:

- `/photography` serves the rich LP
- `/works/photography` redirects to `/photography`
- `/filmtone` serves the product LP and child pages
- `/film-lab` and `/works/filmtone` redirect to `/filmtone`
- satellite canonical metadata uses `/photography` and `/filmtone`

### Launch QA Readiness: Blocked

Do not open this ledger yet except for narrow checks after each implementation
slice. Full build, screenshots, redirect sweeps, preview deploy, and owner visual
review are only meaningful after the content and route ledgers have substance.

## Next Implementation Assignment

If there is one implementation chat, give it this first package:

### Package 1 — Core IA + Experiments Index

Ownership:

- `apps/web/src/shared/data/portfolio.ts`
- `apps/web/next.config.ts`
- `apps/web/src/app/sitemap.ts`
- `apps/web/src/app/[locale]/experiments/page.tsx`
- any small message/data additions needed by the `/experiments` index

Required result:

- global nav becomes `Home / Experiments / Journal / Contact`
- `/experiments` becomes the works/artwork index for dot, grid, and flow
- `/works`, `/interactive`, `/motion`, `/about`, `/craft`, `/profile`, `/skills`
  redirect per parent plan
- `/photography` and `/filmtone` are not global-nav items
- sitemap no longer publishes hollow legacy routes

Do not touch:

- `packages/motion-dot/*`
- `/experiments/dot` remediation files already dirty in another working stream
- photography LP content
- Filmtone LP internals
- launch/deploy workflows

Minimum verification for Package 1:

```bash
rg -n "href: \"/(skills|interactive|photography|profile)\"|/works/photography|/works/filmtone|/film-lab" apps/web/src/shared/data/portfolio.ts apps/web/next.config.ts apps/web/src/app/sitemap.ts
rg -n "TODO\\(Wave|future chat|Restoring after" apps/web/src/app/[locale]/experiments apps/web/src/app/[locale]/journal apps/web/src/app/[locale]/about apps/web/src/app/[locale]/craft
```

Expected after Package 1:

- the first command may show legacy sources only inside redirect rules that point
  to canonical destinations
- the second command may still show journal, grid, flow, about, or craft blockers
  if those packages are not yet owned or the files are retained behind redirects,
  but must not show blockers in the new `/experiments` index

## Reporting Format For Implementation Chat

Report by ledger, not percent:

- owned package
- files changed
- ledger items closed
- ledger items still blocked with exact file/path evidence
- commands run and result
- screenshots only when a route has real content worth reviewing
