# Director Chat Handoff — 2026-04-26 JST

Status:

- direction continuity document for a fresh chat
- based on the reset plan plus verified repo state as of 2026-04-26 JST
- use this instead of reconstructing context from old Wave docs or repeated review findings

Canonical inputs:

1. `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`
2. `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-reset-ledger-2026-04-26.md`
3. this document

This document does not replace the parent plan. It explains what the direction
chat already decided, what implementation packages have landed since the reset
audit, which review findings are historical versus still actionable, and where a
new direction chat should resume.

## 1. Governing Rule

The user instruction that governs all decisions:

> Prioritize substantive progress. Keep outer-shell work minimal. Only spend
> serious QA effort after the public core surfaces are actually real.

Practical meaning:

- do not use a single-number progress score
- do not confuse route existence with completion
- do not spend time on screenshots, deploys, broad smoke sweeps, or polish while
  public routes are still hollow
- do spend time on blocker detection when a change would break substance, for
  example a 301-to-404 redirect or a public placeholder route in core IA

## 2. What This Direction Stream Already Did

This direction stream did not primarily implement product code. It did three
things:

1. reset the measurement model
2. audit implementation-package reports from another chat
3. keep the work aligned to the parent plan's ledgers instead of old Wave
   percentages

The old `34 / 36 = 94.4%` figure is explicitly rejected as a launch-readiness
metric. It measured infrastructure and migration shell progress, not whether the
public portfolio was meaningful and ready.

Artifacts created by this direction stream:

- `docs/renewal-2026/director-reset-ledger-2026-04-26.md`
- this handoff doc

## 3. Current Verified Repo State

Verified against the working tree on 2026-04-26 JST.

### 3.1 Core IA

Global nav in `apps/web/src/shared/data/portfolio.ts` is now:

```txt
Home / Experiments / Journal / Contact
```

Other verified IA changes:

- hero primary CTA points to `/experiments`
- hero secondary CTA points to `/journal`
- `Photography`, `Filmtone`, `Works`, `About`, `Craft`, `Skills`, `Profile`,
  and `Interactive` are not global-nav items

### 3.2 Redirects

`apps/web/next.config.ts` currently reflects the correct staged state:

- `/works` -> `/experiments`
- `/works/commercial` -> `/experiments`
- `/works/installation` -> `/experiments`
- `/motion` -> `/experiments`
- `/interactive` -> `/experiments`
- `/motion/reference-works/:slug*` -> `/journal/motion-studies/:slug*`
- `/about`, `/craft`, `/profile`, `/skills` -> `/`
- `/archive` -> `/journal`

Satellite canonicalization is intentionally deferred:

- `/film-lab/*` still redirects to `/works/filmtone/*`
- `/photography` still redirects to `/works/photography`

This is deliberate. The parent plan wants `/filmtone` and `/photography`, but
the canonical wrapper routes do not exist yet. Redirects must not flip early or
live URLs would 301 to a missing page.

### 3.3 Sitemap

`apps/web/src/app/sitemap.ts` currently publishes only:

- `/`
- `/experiments`
- `/experiments/dot`
- `/journal`
- `/contact`
- `/journal/motion-studies/{6 slugs}`

Excluded on purpose:

- `/experiments/grid`, `/experiments/flow` because they are still placeholder
  surfaces
- `/photography`, `/filmtone` because canonical wrapper routes do not exist yet
- `/works/*`, `/about`, `/craft` because they are legacy routes

### 3.4 Core Content Surfaces

`/experiments`:

- `apps/web/src/app/[locale]/experiments/page.tsx` exists
- lists `dot`, `grid`, `flow`
- `dot` is labeled `active`
- `grid` and `flow` are labeled `preview`
- public copy is evergreen and no longer says "Wave 3 will restore"

`/journal`:

- `apps/web/src/app/[locale]/journal/page.tsx` is now a real index
- it lists the 6 existing motion-study routes
- ja/en metadata and copy are wired through messages

`/contact`:

- `apps/web/src/app/[locale]/contact/page.tsx` is localized
- `apps/web/src/features/contact/ContactClient.tsx` uses `useTranslations("contact")`
- `apps/web/src/features/contact/actions.ts` validates only `name`, `email`,
  `message`
- visible email is the primary channel
- the old service-funnel fields were removed

`/`:

- `apps/web/src/app/[locale]/page.tsx` is still a thin shell around
  `AmbientHomeHero`
- `AmbientHomeHero` is intentionally read-only in this direction stream because
  it is dirty in the D2.8 motion-dot remediation stream
- current content audit judged Home acceptable in concept, but final close is
  still conditional on motion-dot parity landing cleanly

### 3.5 Motion Works

`/experiments/grid` is still placeholder:

- `apps/web/src/app/[locale]/experiments/grid/client.tsx`
- public copy still says `Restoring after motion-dot transplant. Wave 3 will
  rebuild this surface on the original codebase pattern.`

`/experiments/flow` is still placeholder:

- `apps/web/src/app/[locale]/experiments/flow/client.tsx`
- public copy still says `Restoring after motion-dot transplant. Wave 3 will
  rebuild this surface on the original codebase pattern.`

This is the biggest remaining blocker in the core portfolio surface.

## 4. Historical Review Findings And Their Current Status

The repeated findings list that appeared in the direction chat is historical.
Do not carry it forward as a raw open-bug list. Use the disposition below.

| Finding | Original concern | Current status |
|---|---|---|
| 1 | `/film-lab` and `/works/filmtone` flipped too early to missing `/filmtone` | **Deferred intentionally**. Current redirects retain `/film-lab/* -> /works/filmtone/*` until canonical `/filmtone` routes exist. |
| 2 | `/works/photography` flipped too early to missing `/photography` | **Deferred intentionally**. Current redirects retain `/photography -> /works/photography` until canonical `/photography` exists. |
| 3 | `/experiments` public copy said future restoration / Wave 3 | **Resolved**. Evergreen copy landed in `messages/{ja,en}.json`. |
| 4 | sitemap exposed hollow routes (`/experiments/grid`, `/experiments/flow`, `/journal`) | **Resolved for now**. `/journal` is now real and stays in sitemap; grid/flow remain excluded until real. |
| 5 | nested legacy works routes (`/works/commercial`, `/works/installation`) bypassed redirects | **Resolved**. Explicit redirects landed in `next.config.ts`. |
| 6 | `/en/contact` still showed Japanese copy | **Resolved**. Contact page, client, and server action are locale-aware. |

## 5. Package History Since The Reset Audit

These packages were reviewed and accepted by the direction stream.

### Package 1 — Core IA + Experiments Index

Owned surfaces:

- `apps/web/src/shared/data/portfolio.ts`
- `apps/web/next.config.ts`
- `apps/web/src/app/sitemap.ts`
- `apps/web/src/app/[locale]/experiments/page.tsx`
- `apps/web/messages/{ja,en}.json`

What landed:

- core nav reduced to `Home / Experiments / Journal / Contact`
- hero CTAs moved to `/experiments` and `/journal`
- `/experiments` index created
- legacy core redirects landed
- nested `/works/commercial` and `/works/installation` redirects landed
- sitemap reduced to canonical-and-real surfaces only

Important nuance:

- the satellite redirect flip from `/works/photography` -> `/photography` and
  `/works/filmtone` -> `/filmtone` did **not** land yet
- that deferral is correct and must remain until the canonical wrapper routes
  exist

Ledger effect:

- Core IA moved from not-ready to partial
- `/experiments` index exists, but Motion Works did not close because grid and
  flow remain placeholder

### Package 2 — Core Content / Journal Index

Owned surfaces:

- `apps/web/src/app/[locale]/journal/page.tsx`
- `apps/web/messages/{ja,en}.json`
- `apps/web/src/app/sitemap.ts`

What landed:

- `/journal` became a real index
- all 6 motion-study routes are listed with title, summary, context, and link
- narrative that might have lived in `/about` or `/craft` was absorbed into
  Journal instead of reviving those routes
- `/journal` was correctly reintroduced into the sitemap

Ledger effect:

- `/journal is a real content index` is closed
- Core Portfolio Content overall remains partial, not ready

### Package 3 — Core Contact / Home Readiness

Owned surfaces:

- `apps/web/src/features/contact/actions.ts`
- `apps/web/src/features/contact/ContactClient.tsx`
- `apps/web/src/app/[locale]/contact/page.tsx`
- `apps/web/messages/{ja,en}.json`
- minimal `portfolio.ts` contact data reduction

What landed:

- contact form reduced to `name`, `email`, `message`
- visible email channel added above the form
- noisy sales-funnel UI removed
- ja/en localization completed for page metadata, form labels, errors, success
  state, and server action responses
- Home was audited read-only and left untouched because `AmbientHomeHero` is
  owned by a dirty D2.8 stream

Ledger effect:

- `/contact is minimal and functional` can be treated as closed
- Home is only a conditional pass pending motion-dot verification

## 6. Dirty Worktree And Ownership Boundaries

The worktree is dirty. Assume unrelated edits belong to the user or another
implementation stream. Do not revert them.

Especially sensitive dirty files:

- `apps/web/src/app/[locale]/experiments/dot/client.tsx`
- `apps/web/src/features/hero/components/AmbientHomeHero.tsx`
- `apps/web/src/features/motion/MotionStageContext.ts`
- `apps/web/src/features/motion/MotionStageProvider.tsx`
- `apps/web/src/features/motion/index.ts`
- `packages/motion-dot/src/main.ts`

Also present:

- branding/icon asset edits under `apps/web/public/brand/*`
- iOS and desktop icon changes
- multiple existing doc updates under `docs/renewal-2026/*`

Direction rule for the new chat:

- do not revert or normalize the dirty tree
- if a next implementation package must avoid those files, state the ownership
  boundary explicitly in the package prompt

## 7. Current Ledger Status

### Core IA Readiness

Status: partial

Closed:

- nav shape
- legacy core redirects
- nested legacy works redirects
- sitemap no longer exposes hollow legacy routes

Still open:

- satellite canonical flip to `/photography` and `/filmtone`

### Core Portfolio Content Readiness

Status: partial

Closed:

- `/experiments` index exists and is real as an index surface
- `/journal` index is real
- `/contact` is minimal and localized

Still open:

- Home final close is conditional on motion-dot parity
- full core-route placeholder sweep should happen only after Motion Works is real

### Motion Works Readiness

Status: not ready

Open blockers:

- `dot` is under active remediation in another stream
- `grid` is placeholder
- `flow` is placeholder
- unsupported-state handling still needs real verification once grid/flow are
  implemented

### Satellite Readiness

Status: not ready

Open blockers:

- canonical `/photography` route does not exist yet
- canonical `/filmtone` route does not exist yet
- existing public satellite surfaces still live under `/works/photography` and
  `/works/filmtone`
- internal Filmtone links still need canonical cleanup when the wrapper routes
  land

### Launch QA Readiness

Status: blocked

Blocked by policy, not by missing effort:

- do not spend a serious QA pass yet
- only narrow checks are justified until Motion Works and Satellite have
  substance

## 8. Known Baseline Technical Facts

Current `tsc` baseline in `apps/web`:

```txt
apps/web/src/features/interactive/film-lab/params-codec.test.ts(87,34): error TS2352
```

Interpretation:

- this is a known Filmtone baseline
- it is unrelated to the current core portfolio packages
- do not use it as a reason to block Package 4 or direction continuity
- do not touch Filmtone internals unless a package explicitly owns them

Current placeholder scan facts:

- public placeholder copy remains in `experiments/grid/client.tsx`
- public placeholder copy remains in `experiments/flow/client.tsx`
- `messages/en.json:333` still contains `premiumMediaPlaceholder`, but that is a
  satellite/support key and not a current core-route blocker

## 9. Recommended Next Sequence

Do not jump to deploy or broad QA. Resume in this order:

1. Package 4 — Motion Works: Grid / Flow Placeholder Removal
2. Package 5 — Satellite Canonical Routes (`/photography`, `/filmtone`)
3. narrow redirect / metadata verification after satellite lands
4. only then consider broader launch QA

Why Package 4 comes first:

- `/experiments` is already in the core nav
- its two secondary child routes are still public placeholders
- that is a more substantive blocker than satellite canonicalization

Why Satellite comes after:

- the current deferred redirect state is stable and does not break live routes
- the missing canonical wrappers are important, but they are satellite, not core
  IA

## 10. Next Package Brief The New Direction Chat Should Drive

Recommended next implementation package:

### Package 4 — Motion Works: Grid / Flow Placeholder Removal

Goal:

- make `/experiments/grid` and `/experiments/flow` real, non-placeholder public
  experiences

Ownership:

- `apps/web/src/app/[locale]/experiments/grid/*`
- `apps/web/src/app/[locale]/experiments/flow/*`
- `packages/motion-grid/*`
- `packages/motion-flow/*`
- optionally `apps/web/src/app/sitemap.ts` if one or both routes become real

Do not touch:

- `packages/motion-dot/*`
- `apps/web/src/app/[locale]/experiments/dot/*`
- `apps/web/src/features/hero/components/AmbientHomeHero.tsx`
- satellite routes and deferred satellite redirects
- contact or journal surfaces already landed

Required result:

- remove public `Restoring after...` language from grid and flow
- replace placeholder clients with real visual states
- make unsupported-state handling explicit
- only add a route back into the sitemap if it is truly real

Minimum verification:

```bash
noglob rg -n 'TODO\\(Wave|future chat|Restoring after|placeholder|Wave 3' apps/web/src/app/[locale]/experiments apps/web/messages/en.json apps/web/messages/ja.json
apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-grid/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-flow/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p apps/web
```

Expected `apps/web` TypeScript result:

- the known Filmtone baseline may remain
- new grid/flow errors are not acceptable

## 11. Highest-Precision Prompt For A Fresh Direction Chat

Copy-paste this into the new chat:

```txt
/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-reset-ledger-2026-04-26.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-chat-handoff-2026-04-26.md

上記3ファイルを先に読み、この renewal を「実装者ではなくディレクター」として引き継いでください。

前提:
- 本質の進行を最優先にする
- 外殻 QA / screenshots / deploy / broad smoke は最小限に留め、public core surface が real になった後にだけ強く行う
- 単一の進捗率は使わない
- page existence, route 200, metadata, build green を completion と誤認しない
- dirty worktree は他 stream の所有物を含むので revert しない

重要:
- この chat に何度も貼られていた review findings 1-6 は、そのまま open list として扱わない
- disposition は director-chat-handoff-2026-04-26.md の section 4 を正本にする
- 現在の ledgers は section 7 を正本にする

現時点の判断:
- Core IA: partial
- Core Portfolio Content: partial
- Motion Works: not ready
- Satellite: not ready
- Launch QA: blocked by policy

すでに landed とみなしてよいもの:
- global nav = Home / Experiments / Journal / Contact
- /experiments index
- /journal real index
- /contact minimal + ja/en localized

まだ open の本質 blocker:
- /experiments/grid placeholder
- /experiments/flow placeholder
- motion-dot remediation is in another dirty stream
- canonical /photography and /filmtone wrapper routes do not exist yet

あなたの最初の役割:
1. 現在の repo 状態が handoff doc と矛盾していないか短く audit
2. 問題なければ、次の実装 chat に Package 4 — Motion Works: Grid / Flow Placeholder Removal を発行
3. 実装報告は percent ではなく ledger 単位で精査
4. 本質破壊だけを厳しく止める。外殻 polish はまだ止める

実装 chat への package prompt は handoff doc section 10 をベースに使うこと。
```

## 12. Short Resume Point

If the fresh direction chat needs a one-paragraph resume point:

The reset has already corrected IA, created a real `/experiments` index, turned
`/journal` into a real index, and localized `/contact`. The remaining core
blocker is that `/experiments/grid` and `/experiments/flow` are still explicit
public placeholders while dot remediation is happening in another dirty stream.
Do not restart the reset. Resume from Package 4, keep satellite canonicalization
deferred until its wrapper routes exist, and continue judging progress by ledger
state rather than by percentage.
