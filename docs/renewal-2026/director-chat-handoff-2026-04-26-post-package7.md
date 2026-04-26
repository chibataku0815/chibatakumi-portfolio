# Director Chat Handoff After Package 7 Corrective - 2026-04-26 JST

Status:

- direction continuity document for a fresh director chat
- supersedes `director-chat-handoff-2026-04-26.md` for current package state
- does not replace the parent reset plan
- written after Package 4, 5, 6, Package 7 review, and Package 7 corrective
  (experiments-wide MicInputGate removal, dot internal Audio Panel canonical)
- reconciled in Package 8 (ledger / comment / handoff parity pass)

Canonical inputs:

1. `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md`
2. `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-reset-ledger-2026-04-26.md`
3. `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-chat-handoff-2026-04-26.md`
4. this document

This document is the most recent direction-chat continuity record. Use it for
current ledger state, package dispositions, and the next prompt. Use the parent
plan for governing policy and route intent.

## 1. Governing Rules

The user instruction that governs all decisions:

> Prioritize substantive progress. Keep outer-shell work minimal. Only spend
> serious QA effort after the public core surfaces are actually real.

Practical rules:

- do not use a single-number progress score
- do not confuse route existence, route `200`, metadata, build green, or sitemap
  inclusion with completion
- do not treat old review findings as a raw open list
- do not revert dirty worktree changes; assume unrelated edits belong to the user
  or another stream
- do not spend time on deploy, preview, Search Console, broad smoke, or broad
  screenshots until core public surfaces are real and the current ledger justifies
  that work
- use narrow checks after implementation slices when those checks prove or
  disprove a substantive blocker
- judge implementation reports by ledger, not percent

## 2. What Changed Since The Previous Director Handoff

The previous handoff stopped before Package 4. Since then:

- Package 4 - Motion Works Grid / Flow placeholder removal: accepted
- Package 5 - Satellite canonical routes: initially rejected for hollow
  `/photography`, then corrected and accepted
- Package 6 - Motion Dot parity / Home readiness: initially rejected because Home
  lost its 4-scene ambient cycle, then corrected and accepted for the core
  dot/Home blocker
- Package 7 - Audio / mic readiness + HUD overlap correction: initially scoped
  as a position fix only (HUD overlap closed by moving `MicInputGate` to
  bottom-left), then corrected by removing the experiments-wide `MicInputGate`
  mount entirely. With the corrective applied, Package 7 is accepted: the
  misleading app-level mic gate no longer claims to drive the experiments
  visuals, and motion-dot's internal Audio Panel is canonical for
  `/experiments/dot` mic input.
- Package 8 - Ledger / comment / handoff reconciliation: accepted (this
  document, plus stale comment cleanup in audio/* + PageTransition +
  experiments index).

Important current nuance:

- The earlier nuance about `MicInputGate` controlling the wrong
  `GlobalAudioController` bus is now structurally resolved by removing the
  experiments-wide mount. The `MicInputGate` component / exports / i18n keys
  remain in `@/features/audio` and are reserved for any future
  GlobalAudioController-bound visual route.
- One verification item remains as deferred narrow QA, not a current blocker:
  a runtime mic permission round-trip on `/experiments/dot` through
  motion-dot's internal Audio Panel (granted / blocked / unsupported), plus a
  formal side-by-side parity pass against `life/output/motion-dot-new-webgpu`.
  The director may open this as a narrow QA package later; it is not Package
  7's exit gate.

## 3. Current Ledger State

### Core IA Readiness

Status: closed for reset IA, pending only narrow pre-launch redirect checks.

Closed:

- global nav is exactly `Home / Experiments / Journal / Contact`
- `/photography` and `/filmtone` are excluded from global nav
- legacy core redirects are in `apps/web/next.config.ts`
- satellite redirects have flipped to canonical `/photography` and `/filmtone`
- sitemap no longer publishes legacy `/works/*`, `/about`, or `/craft`

Evidence:

- `apps/web/src/shared/data/portfolio.ts` nav links are `Home`, `Experiments`,
  `Journal`, `Contact`
- `apps/web/next.config.ts` redirects `/works/photography` to `/photography`,
  `/works/filmtone/:path*` to `/filmtone/:path*`, and
  `/film-lab/:path*` to `/filmtone/:path*`
- `apps/web/src/app/sitemap.ts` publishes canonical routes only

Do not reopen old findings about "satellite redirect flip too early". That was a
valid concern before wrapper routes existed. Package 5 has now landed the
wrapper routes.

### Core Portfolio Content Readiness

Status: substantively closed for current reset scope, pending owner visual review
and later launch QA policy.

Closed:

- `/experiments` index exists and is a real works index
- `/journal` index is real and lists 6 motion-study routes
- `/contact` is minimal and localized
- Home renders identity-first text over motion-dot
- Home 4-scene ambient cycle was restored in Package 6 corrective pass

Evidence:

- `apps/web/src/app/[locale]/experiments/page.tsx`
- `apps/web/src/app/[locale]/journal/page.tsx`
- `apps/web/src/app/[locale]/contact/page.tsx`
- `apps/web/src/features/hero/components/AmbientHomeHero.tsx`
- `apps/web/src/features/motion/useMotionDotSceneCycle.ts`

Remaining caution:

- Do not start broad launch QA only because this ledger is substantively closed.
  Honor the deferred QA items (runtime mic permission round-trip, formal
  parity) as their own narrow packages if and when the director opens them.

### Motion Works Readiness

Status: closed for current reset scope. The remaining items are deferred QA,
not blockers.

Closed for current reset scope:

- `/experiments/grid` — real visual (`mountMotionGridApp`), route-level
  metadata, localized unsupported WebGPU copy.
- `/experiments/flow` — real visual (`mountMotionFlowApp`), route-level
  metadata, localized unsupported WebGPU copy.
- `/experiments/dot` and Home — real visual over the persistent motion-dot
  canvas; Home ambient cycle restored
  (`Orbit / River Flow / Firefly Sync / Molecular`, 5.5s).
- audio / mic surface — the misleading experiments-wide app-level
  `MicInputGate` mount has been removed (Package 7 corrective). The dot
  internal Audio Panel (motion-dot's own AudioBus + `audioController`) is the
  canonical mic surface for `/experiments/dot`. `/experiments/grid` and
  `/experiments/flow` are honestly ambient-only today, with no mic gate
  advertising mic-driven motion they do not consume.
- motion-dot package TypeScript check is clean.
- Package 6 narrow visual evidence exists:
  - `docs/renewal-2026/package6-home-evidence.png`
  - `docs/renewal-2026/package6-experiments-dot-evidence.png`

Deferred QA (not current blockers):

- Runtime mic permission round-trip on `/experiments/dot` via motion-dot's
  internal Audio Panel — granted / blocked / unsupported paths confirmed
  visually in a real browser. This is a narrow interaction QA, not a Motion
  Works structural item.
- Formal side-by-side motion-dot parity against
  `life/output/motion-dot-new-webgpu`. Deferred unless the director
  explicitly opens that verification package.

Audio ownership architecture (reference, no longer a blocker):

- `packages/motion-dot/src/main.ts` creates its own
  `new AudioBus({ demoStyle: "beat" })` and its own `audioController`.
  motion-dot's internal audio UI calls `audioController.selectSource("input")`
  — this is the canonical surface for dot mic input.
- `apps/web/src/features/audio/GlobalAudioController.ts` creates a separate
  `AudioBus({ demoStyle: "ambient" })`. The exported `MicInputGate` would
  drive this bus, which no current experiments visual reads from. That is
  exactly why the experiments-wide mount was removed in Package 7 corrective.
- The split is intentional and current. Unifying the two AudioBuses is an
  architecture change, not a Package 7/8 item; it should be opened
  explicitly by the director if/when a future visual route needs to react
  to the GlobalAudioController bus.

Director implication:

- Removing the misleading `MicInputGate` mount closed both the visual
  overlap and the ownership mismatch. A user can no longer click a mic gate
  on `/experiments/dot` and expect it to drive the motion-dot artwork —
  the dot internal Audio Panel is the only visible mic surface.

### Satellite Readiness

Status: closed for canonicalization and public route substance.

Closed:

- `/photography` exists and renders `PhotographyClient`
- `/photography` metadata uses `/photography` and `/en/photography`
- `/works/photography` redirects to `/photography`
- `/filmtone` route tree exists
- public Filmtone child routes exist under `/filmtone`
- `/works/filmtone/:path*` redirects to `/filmtone/:path*`
- `/film-lab/:path*` redirects to `/filmtone/:path*`
- Filmtone internal public links were updated to `/filmtone`
- sitemap publishes canonical satellite paths, not legacy `/works/*`

Important disposition:

- The finding "`/photography` is still a hollow shell" was valid when raised.
  It is now resolved by `apps/web/src/app/[locale]/photography/page.tsx`, which
  imports and renders `PhotographyClient`.

Remaining caution:

- Full owner visual review is still a later launch-readiness task, not a reason
  to reopen Package 5.

### Launch QA Readiness

Status: still blocked by policy, but no substantive Motion Works blocker
remains. The audio/mic ownership concern was resolved by Package 7
corrective + Package 8 reconciliation.

Recommended next steps if the director wants forward motion:

- a narrow redirect / metadata verification for canonical satellite routes
  (`/photography`, `/filmtone`, redirect chains from legacy `/works/*` and
  `/film-lab/*`),
- the deferred narrow QA items (runtime mic round-trip on
  `/experiments/dot`, formal motion-dot parity), opened only if the
  director wants to spend that time before launch,
- then broader launch QA (broad smoke, screenshots, deploy preview).

Do not jump straight to broad QA before the director explicitly opens it.

## 4. Package Dispositions

### Package 4 - Motion Works: Grid / Flow Placeholder Removal

Disposition: accepted.

Accepted facts:

- `apps/web/src/app/[locale]/experiments/grid/client.tsx` mounts
  `mountMotionGridApp`
- `apps/web/src/app/[locale]/experiments/flow/client.tsx` mounts
  `mountMotionFlowApp`
- `packages/motion-grid/src/mount.ts` exists
- `packages/motion-flow/src/mount.ts` exists
- grid/flow unsupported WebGPU state is explicit and localized
- grid/flow were re-added to sitemap after becoming real

Known verification:

- `apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-grid/tsconfig.json`
  was clean
- `apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-flow/tsconfig.json`
  was clean
- `apps/web` TypeScript has only the known Filmtone baseline error

### Package 5 - Satellite Canonical Routes

Disposition: accepted after correction.

Initial director rejection:

- `/photography` had only title and description
- rich `PhotographyClient` existed but was not rendered

Correction accepted:

- `apps/web/src/app/[locale]/photography/page.tsx` imports
  `PhotographyClient`
- `/photography` renders the rich photography LP
- photography OG/Twitter metadata uses `/photography/og-image.jpg`
- canonical metadata uses `/photography` and `/en/photography`

Accepted facts:

- Filmtone route tree moved from `/works/filmtone` to `/filmtone`
- photography route moved from `/works/photography` to `/photography`
- redirects now point legacy routes to canonical satellite routes
- global nav remains core-only
- sitemap includes canonical satellite routes

### Package 6 - Motion Dot Parity / Core Motion Readiness

Disposition: accepted after correction for the core dot/Home blocker.

Initial director rejection:

- Home no longer ran the intended 4-scene ambient cycle
- `AmbientHomeHero` had become only text over the root boot scene

Correction accepted:

- `packages/motion-dot/src/main.ts` exposes a narrow
  `MountHandle.setActiveScene(name: DotSceneName)`
- `apps/web/src/features/motion/useMotionDotSceneCycle.ts` cycles scene names
  at an interval
- `AmbientHomeHero` uses `Orbit`, `River Flow`, `Firefly Sync`, `Molecular`
  at `5.5s`
- broad `configure()` was not revived
- `/experiments/dot` remains manual artwork

Accepted facts:

- `packages/motion-dot` TypeScript check is clean
- `apps/web` TypeScript has only the known Filmtone baseline error
- narrow visual evidence showed Home at `Molecular` mid-cycle
- narrow visual evidence showed `/experiments/dot` live and nonblank

Still deferred at the time Package 6 was accepted (historical):

- full 9-axis side-by-side visual parity against the original Vite app
- audio/mic readiness — structural ownership has since been resolved by
  Package 7 corrective (see §4 Package 7). Only the narrow runtime mic
  permission round-trip on `/experiments/dot` (granted / blocked /
  unsupported via motion-dot's internal Audio Panel) remains as deferred
  QA. Do not reopen audio/mic ownership as a Package 6 follow-up.

### Package 7 - Audio / Mic Readiness + HUD Overlap Correction

Disposition: accepted after corrective.

Initial scope (accepted at first pass):

- `MicInputGate` moved from top-left to bottom-left in
  `apps/web/src/app/[locale]/experiments/layout.tsx`
- this closed the visible top-left HUD overlap from Package 6 evidence

Director finding raised against the first pass:

```txt
[P1] MicInputGate does not drive motion-dot audio
```

Corrective applied (now accepted):

- the experiments-wide app-level `MicInputGate` mount was removed from
  `apps/web/src/app/[locale]/experiments/layout.tsx`
- `apps/web/src/app/[locale]/experiments/layout.tsx` now renders only the
  unsupported-banner sibling and documents the audio/mic surface in a
  leading comment block (`Audio / mic surface (Package 7 corrective…)`)
- motion-dot's internal Audio Panel (top-right film/audio buttons, "I"
  key, listed in the hotkey legend as "I Panel") is the canonical mic
  surface for `/experiments/dot`
- `/experiments/grid` and `/experiments/flow` remain ambient-only and
  honestly carry no mic UI advertising mic-driven motion they do not
  consume
- the `MicInputGate` component / exports / i18n keys remain in
  `@/features/audio` for any future GlobalAudioController-bound visual
  route

The earlier `[P1]` finding is therefore closed by structure (no
misleading mic gate on experiments routes), not by re-wiring buses.
Unifying the two AudioBuses is intentionally not part of Package 7 —
it remains an explicit architecture decision the director can open
later if a future visual route needs the GlobalAudioController bus.

Do not reopen the older `/photography`, Home-cycle, or
`MicInputGate-on-experiments` findings as open blockers.

## 5. Review Findings Disposition

There are two classes of findings.

### Historical findings from the earlier direction chat

The repeated findings 1-6 from the old chat are historical. Do not carry them
forward as a raw open list. Use `director-chat-handoff-2026-04-26.md` section 4
for their disposition.

### Findings raised in this direction chat

| Finding | Original concern | Current disposition |
|---|---|---|
| 1 | `/photography` was hollow | Resolved. Package 5 correction renders `PhotographyClient`. |
| 2 | Home no longer ran 4-scene ambient cycle | Resolved. Package 6 correction restores cycle with `useMotionDotSceneCycle`. |
| 3 | Mic gate overlapped motion-dot HUD | Resolved. Package 7 first pass moved the gate; Package 7 corrective then removed the experiments-wide `MicInputGate` mount entirely. `/experiments/dot` mic input is canonical via motion-dot's internal Audio Panel. |

Current open findings: none.

Deferred QA (explicit, not blockers):

| Item | Concern | Status |
|---|---|---|
| Mic round-trip QA | Runtime `granted / blocked / unsupported` paths via dot internal Audio Panel in a real browser | Deferred narrow QA. Not gating launch. |
| motion-dot parity | Formal side-by-side parity vs `life/output/motion-dot-new-webgpu` | Deferred unless director opens it explicitly. |
| AudioBus unification | Whether to unify `GlobalAudioController` and motion-dot's internal `AudioBus` | Architecture decision. Not opened. |

## 6. Known Technical Baselines

Current `apps/web` TypeScript baseline:

```txt
apps/web/src/features/interactive/film-lab/params-codec.test.ts(87,34): error TS2352
```

Interpretation:

- known Filmtone baseline
- unrelated to Packages 4-8
- do not use it to block the next narrow package (redirect/metadata sweep,
  deferred QA, etc.)
- do not touch Filmtone internals unless the next package explicitly owns them

Known placeholder scan nuance:

- `packages/motion-dot/src/ui/hud.ts` contains an HTML option variable named
  `placeholder` for a device selector — this is benign code, not a public
  placeholder page or incomplete route
- `apps/web/src/app/[locale]/experiments/page.tsx` previously contained an
  explanatory comment that mentioned `placeholder`; Package 8 reworded that
  comment to describe the curatorial `state: "preview"` label, so a current
  scan returns no `placeholder` hit on the experiments index

## 7. Dirty Worktree Notes

The worktree is very dirty and includes multiple streams. Do not revert anything
without explicit user instruction.

Sensitive dirty streams include:

- Package 4 grid/flow work:
  - `apps/web/src/app/[locale]/experiments/grid/*`
  - `apps/web/src/app/[locale]/experiments/flow/*`
  - `packages/motion-grid/*`
  - `packages/motion-flow/*`
- Package 5 satellite route moves:
  - deleted legacy files under `apps/web/src/app/[locale]/works/filmtone/*`
  - new route tree under `apps/web/src/app/[locale]/filmtone/*`
  - new route under `apps/web/src/app/[locale]/photography/*`
  - `apps/web/next.config.ts`
  - `apps/web/src/app/sitemap.ts`
- Package 6 motion-dot work:
  - `packages/motion-dot/src/main.ts`
  - `apps/web/src/features/motion/*`
  - `apps/web/src/features/hero/components/AmbientHomeHero.tsx`
  - `apps/web/src/app/[locale]/experiments/dot/client.tsx`
  - `docs/renewal-2026/package6-home-evidence.png`
  - `docs/renewal-2026/package6-experiments-dot-evidence.png`
- Package 7 overlap work:
  - `apps/web/src/app/[locale]/experiments/layout.tsx`
- Other unrelated streams:
  - iOS Filmtone string/icon work
  - desktop Filmtone terminology/icon work
  - brand asset candidates
  - docs outside this renewal handoff

The next implementation package should have a narrow write set and should not
normalize the dirty tree.

## 8. Recommended Next Sequence

Do not jump to broad QA. The audio/mic ownership concern is structurally
resolved; what remains is curatorial / launch hygiene.

Recommended sequence:

1. Narrow director sweep — confirm Motion Works ledger and Satellite ledger
   still match the repo state; close out any remaining historical wording
   beyond Package 8.
2. Optional deferred QA, opened explicitly if the director wants it before
   launch:
   - runtime mic permission round-trip on `/experiments/dot` via the dot
     internal Audio Panel (granted / blocked / unsupported),
   - formal motion-dot side-by-side parity vs
     `life/output/motion-dot-new-webgpu`,
   - AudioBus unification architecture decision.
3. Narrow redirect / metadata verification for canonical satellite routes
   (`/photography`, `/filmtone`, legacy `/works/*` and `/film-lab/*`
   redirects, sitemap).
4. Only after that consider broader launch QA (broad smoke, screenshots,
   deploy preview).

### Historical: the original Package 7B prescription

The earlier draft of this handoff prescribed a "Package 7B" to resolve
audio/mic ownership. That prescription was applied as the Package 7
corrective itself (experiments-wide `MicInputGate` mount removed; dot
internal Audio Panel canonical). Section 9 below preserves the original
Package 7B implementation prompt as historical context — it is no longer
the next package to fire.

## 9. Historical: Package 7B Implementation Prompt (applied as Package 7 corrective)

This section is preserved verbatim as the prescription that produced the
Package 7 corrective. Do NOT re-issue this prompt — the corrective has
already landed and Package 7 is now accepted. Use this only as archival
context for how the audio/mic ownership concern was resolved.

```txt
Package 7B - Resolve Experiments Audio/Mic Ownership

Role:
You are the implementation chat for Package 7B. This is a narrow Motion Works
readiness package. Do not deploy, do not run broad smoke, and do not touch
unrelated surfaces.

Director context:
- Core IA is closed for reset IA.
- Core Portfolio Content is substantively closed for current reset scope.
- Motion Works is partial only because audio/mic ownership remains unresolved.
- Package 7 fixed the visible top-left HUD overlap, but did not close audio/mic
  readiness.
- The current open blocker is that `MicInputGate` controls the app-level
  `GlobalAudioController`, while motion-dot uses its own internal `AudioBus` /
  `audioController`.
- Do not use percent completion.
- Do not treat route 200, screenshots, build green, or metadata as completion.
- Dirty worktree includes other streams; do not revert unrelated changes.

Preferred goal:
Remove the misleading experiments-wide `MicInputGate` and make motion-dot's own
Audio Panel the canonical audio/mic control for `/experiments/dot`.

Ownership:
- apps/web/src/app/[locale]/experiments/layout.tsx
- apps/web/src/features/audio/* only for comments or removing now-unused copy if
  strictly necessary
- packages/motion-dot/src/ui/*
- packages/motion-dot/src/input/*
- packages/motion-dot/src/main.ts only if a small explicit-state or accessibility
  fix is required for the internal Audio Panel
- apps/web/messages/{en,ja}.json only if visible copy changes are necessary

Do not touch:
- apps/web/src/app/[locale]/experiments/grid/*
- apps/web/src/app/[locale]/experiments/flow/*
- packages/motion-grid/*
- packages/motion-flow/*
- apps/web/src/app/[locale]/photography/*
- apps/web/src/app/[locale]/filmtone/*
- apps/web/next.config.ts
- apps/web/src/app/sitemap.ts
- contact / journal
- deploy / preview / broad smoke workflows

Required result:
- `/experiments/dot` no longer shows an app-level mic gate that controls the
  wrong audio bus.
- `/experiments/dot` still has explicit audio/mic controls through motion-dot's
  own Audio Panel.
- `/experiments/grid` and `/experiments/flow` do not show a misleading mic gate
  while their standalone mounts remain ambient-only.
- No HUD/control overlap is introduced.
- Keyboard shortcuts still ignore input, textarea, select, button, and
  contenteditable targets.
- Home scene cycle remains intact.
- Package 4 grid/flow and Package 5 satellite are not modified.

Minimum verification:
```bash
rg -n 'MicInputGate|SoundToggleControl|Audio Panel|selectSource\\(\"input\"\\)|new AudioBus|GlobalAudioController|useMotionDotSceneCycle|setActiveScene' \
  'apps/web/src/app/[locale]/experiments/layout.tsx' \
  apps/web/src/features/audio \
  apps/web/src/features/motion \
  apps/web/src/features/hero/components/AmbientHomeHero.tsx \
  packages/motion-dot/src

noglob rg -n 'TODO\\(Wave|future chat|Restoring after|placeholder|Wave 3' \
  'apps/web/src/app/[locale]/experiments' \
  apps/web/src/features/audio \
  packages/motion-dot

apps/web/node_modules/.bin/tsc --noEmit -p packages/motion-dot/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p apps/web
```

Expected TypeScript result:
- `packages/motion-dot` must be clean
- `apps/web` may still show the known Filmtone baseline at
  `apps/web/src/features/interactive/film-lab/params-codec.test.ts:87`
- no new audio/mic/motion errors are acceptable

Targeted visual / interaction verification:
- `/experiments/dot`: open Audio Panel via visible UI or keyboard shortcut.
- Confirm source choices are visible and include input/mic.
- Confirm controls do not overlap route header, HUD, film/audio buttons, or
  hotkey legend.
- If mic permission cannot be granted in the environment, state the exact
  blocker and verify the visible unsupported/blocked/requesting surface instead.
- `/`: confirm Home scene cycle hook remains mounted without console errors.
- `/experiments/grid` and `/experiments/flow`: confirm there is no misleading
  mic gate if you removed it experiments-wide.

Report by ledger, not percent:
- owned package
- files changed
- audio/mic ownership decision
- Motion Works items closed
- items still blocked with exact file/path evidence
- commands run and result
- narrow visual/interaction evidence paths if collected
```

## 10. Highest-Precision Prompt For A Fresh Director Chat

Copy-paste this into the new direction chat:

```txt
/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/portfolio-renewal-2026-04.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-reset-ledger-2026-04-26.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-chat-handoff-2026-04-26.md
/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/docs/renewal-2026/director-chat-handoff-2026-04-26-post-package7.md

上記4ファイルを先に読み、この renewal を「実装者ではなくディレクター」として引き継いでください。

前提:
- 本質の進行を最優先にする
- 外殻 QA / screenshots / deploy / broad smoke は最小限に留め、public core surface が real になった後にだけ強く行う
- 単一の進捗率は使わない
- page existence, route 200, metadata, build green, sitemap inclusion を completion と誤認しない
- dirty worktree は他 stream の所有物を含むので revert しない
- 古い review findings 1-6 はそのまま open list として扱わない
- この直前の findings 1-3 (hollow /photography, Home cycle, mic gate overlap) は
  すべて Package 5 / 6 / 7 (corrective) で解決済み。raw open list に戻さない。

重要な disposition (Package 7 corrective + Package 8 reconciliation 後):
- `/photography is hollow` は解決済み。Package 5 correction で `/photography` が
  `PhotographyClient` を render している。
- `Home no longer runs ambient cycle` は解決済み。Package 6 correction で
  `useMotionDotSceneCycle` により `Orbit / River Flow / Firefly Sync / Molecular`
  5.5s cycle が戻っている。
- `Mic gate overlaps motion-dot HUD` および `MicInputGate controls the wrong bus`
  は Package 7 corrective で解決済み。experiments-wide app-level `MicInputGate`
  mount を `apps/web/src/app/[locale]/experiments/layout.tsx` から削除。
  `/experiments/dot` の mic surface は motion-dot 内部 Audio Panel に一本化。
  `MicInputGate` component / exports / i18n keys は将来用に残置。

現時点の ledger 判断:
- Core IA: reset IA として closed。launch 前の narrow redirect check は後でよい。
- Core Portfolio Content: substantively closed for current reset scope。owner
  visual review は後でよい。
- Motion Works: closed for current reset scope。grid / flow / dot/Home の core
  readiness および audio/mic surface ownership は決着済み。
- Satellite: canonicalization and public route substance closed。
- Launch QA: blocked by policy。次は narrow redirect / metadata sweep か、
  director が明示的に開く deferred QA (mic round-trip, formal parity,
  AudioBus unification) のどちらか。

すでに accepted とみなすもの:
- Package 4: `/experiments/grid` and `/experiments/flow` placeholder removal
- Package 5: `/photography` and `/filmtone` canonical satellite routes, after
  `/photography` rich LP correction
- Package 6: motion-dot core route and Home ambient cycle, after corrective pass
- Package 7: HUD overlap fix + experiments-wide MicInputGate mount removal
  (corrective accepted; motion-dot internal Audio Panel canonical)
- Package 8: handoff doc / stale comment / ledger reconciliation (this doc)

現在の open blocker: なし。

Deferred QA (director が明示的に開いた時にだけ着手):
- `/experiments/dot` の mic permission round-trip (granted / blocked /
  unsupported) を motion-dot 内部 Audio Panel 経由で実環境確認。
- `life/output/motion-dot-new-webgpu` との formal side-by-side parity。
- `GlobalAudioController` と motion-dot 内部 `AudioBus` の統合 (architecture
  decision)。

あなたの最初の役割:
1. `director-chat-handoff-2026-04-26-post-package7.md` の section 3-8 を正本として
   現 repo と矛盾しないか短く audit する (section 9 は historical)。
2. 矛盾がなければ、次の forward step を選ぶ:
   (a) narrow redirect / metadata verification for canonical satellite routes、
   (b) deferred QA を1つだけ narrow package として開く、
   (c) もう core surface に手を入れる必要はないと判断し、launch QA に向けて
       narrow scope を組む。
3. 実装報告は percent ではなく ledger 単位で精査する。
4. 本質破壊だけを厳しく止める。外殻 polish / broad QA は director が明示的に
   開いた scope の中だけで許可する。

Package 7B prompt (section 9) は historical。次の implementation chat に
そのまま投げないこと — 既に corrective として適用済み。
```

## 11. One-Paragraph Resume Point

The reset has now landed core IA, real `/experiments`, real `/journal`,
minimal localized `/contact`, real grid/flow, canonical `/photography` with
the rich LP, canonical `/filmtone`, motion-dot/Home core readiness with a
restored Home 4-scene cycle, and the Package 7 corrective that removed the
misleading experiments-wide `MicInputGate` mount in favor of motion-dot's
internal Audio Panel as the canonical mic surface for `/experiments/dot`.
Package 8 has reconciled the handoff doc and stale ownership comments
against this state. There is no current substantive Motion Works blocker.
Resume by either running a narrow redirect / metadata sweep for canonical
satellite routes, or by explicitly opening one of the deferred QA items
(mic round-trip, formal motion-dot parity, AudioBus unification) — but do
not jump to broad launch QA without director scope.
