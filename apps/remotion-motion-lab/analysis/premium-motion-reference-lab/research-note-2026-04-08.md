# Premium Motion Reference Lab

Last updated: 2026-04-08  
Workspace: `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab`

## Purpose

Build a practical Remotion lab for studying premium motion behavior as reusable decision support.

This is not a SearchGPT recreation pass. The lab isolates motion families so future production work can compare them directly and reuse the stronger systems.

## Evidence Input

Reference captures used for motion observation:
- `/Users/chibatakumi/Library/Application Support/CleanShot/media/media_PHqRTiKrbU/CleanShot 2026-04-08 at 11.22.42.mp4`
- `/Users/chibatakumi/Library/Application Support/CleanShot/media/media_ZCZvIKRS9K/CleanShot 2026-04-08 at 11.21.14.mp4`

Prior frame analysis used as background:
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/analysis/searchgpt-launch-ref/analysis.md`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/analysis/searchgpt-launch-ref/HANDOFF_2026-04-08.md`

## Clear Observation

- Push-ins appear to cover most of their scale travel early, then spend longer settling into the stop.
- Pull-backs preserve continuity while context reappears near the end of the move.
- Large send-icon moments feel assertive, but they do not read as bouncy.
- Several state changes read as hard cuts supported by continuity motion rather than long dissolves.
- Chrome, content, and background do not always reveal at the same moment.
- Holds between outgoing and incoming states contribute to the restrained editorial feel.

## Inference Used For The Lab

- Premium motion quality in this reference is better represented by velocity distribution and layer separation than by one named easing curve.
- Two-stage arrival systems are more useful to test than a generic easing gallery.
- Negative controls are still useful when they help answer “too playful?” or “too flat?” in direct comparison.
- Neutral browser-like UI panels are a better study surface than abstract graphics for this task.

## Motion Families Tested

1. `push-in-lab`
   - Flat one-pass ease-out versus rapid-arrival-then-settle systems.
   - Variable: scale ratio, layer delay, settle length.
2. `pull-back-lab`
   - Retreat braking and reintroduction of chrome/context.
   - Variable: stop behavior, shell/content separation.
3. `long-settle-lab`
   - Stop quality isolated from editorial complexity.
   - Variable: long settle, short settle, back-out control.
4. `snap-in-lab`
   - High-assertion snap without toy-like bounce.
   - Variable: one-pass snap, two-stage snap, back-out control.
5. `continuity-lab`
   - Hard cuts supported by parent or parent-plus-child continuity.
   - Variable: none, parent continuity, parent-plus-child lag.
6. `editorial-gap-lab`
   - Hold-gap-reveal timing.
   - Variable: `0f`, `4f`, `8f` gap.
7. `layered-reveal-lab`
   - Background, chrome, and content timing separation.
   - Variable: grouped reveal versus staggered reveals.

## Strongest Systems In This Lab

Shortlist after building and reviewing the comparison structure:

- `push-in-lab / Variant B`
  - Strongest push-in family.
  - Reason: rapid arrival plus longer settle retains decisiveness without turning loud.
- `pull-back-lab / Variant C`
  - Strongest depth retreat family.
  - Reason: separated shell/content timing keeps the retreat from flattening into a single zoom.
- `long-settle-lab / Variant A`
  - Strongest expensive stop behavior.
  - Reason: long settle reads controlled; the back-out control quickly feels more playful.
- `snap-in-lab / Variant A`
  - Strongest snap-in for restrained UI punctuation.
  - Reason: hard ease-out gives authority without visible bounce.
- `continuity-lab / Variant C`
  - Strongest hard-cut support system.
  - Reason: parent continuity plus slight child lag makes the swap feel intentional instead of abrupt.
- `editorial-gap-lab / Variant B`
  - Best hold-gap-reveal balance.
  - Reason: `4f` is enough to create editorial breath without stalling.
- `layered-reveal-lab / Variant B`
  - Best chrome/content/background separation.
  - Reason: visible layering with no obvious drag.

## Deliverables

Compositions:
- `PremiumMotionReferenceLabOverview`
- `PremiumMotionPushInLab`
- `PremiumMotionPullBackLab`
- `PremiumMotionLongSettleLab`
- `PremiumMotionSnapInLab`
- `PremiumMotionContinuityLab`
- `PremiumMotionEditorialGapLab`
- `PremiumMotionLayeredRevealLab`

Render commands:
- `npm run render:motion-lab`
- `npm run render:motion-lab:push-in`
- `npm run render:motion-lab:pull-back`
- `npm run render:motion-lab:long-settle`
- `npm run render:motion-lab:snap-in`
- `npm run render:motion-lab:continuity`
- `npm run render:motion-lab:editorial-gap`
- `npm run render:motion-lab:layered-reveal`
- `npm run capture-stills:motion-lab`

Output files produced:
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-reference-lab-overview.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-push-in-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-pull-back-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-long-settle-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-snap-in-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-continuity-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-editorial-gap-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/premium-motion-layered-reveal-lab.mp4`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/motion-lab-stills/premium-motion-overview-contact-sheet.jpg`
- `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio/apps/remotion-motion-lab/out/motion-lab-stills/premium-motion-study-contact-sheet.jpg`

## Notes

- The lab is deliberately neutral and non-decorative.
- Negative controls are included only where they help answer “too playful?” or “too flat?”.
- Conclusions above are inference from the built studies, not claims about exact source curves or exact captured delays.
