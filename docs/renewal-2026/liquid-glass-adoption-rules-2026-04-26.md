# Liquid Glass Adoption Rules

Date: 2026-04-26
Scope: portfolio web UI chrome
Related plan: `docs/renewal-2026/gpu-liquid-glass-direction-plan-2026-04-26.md`

## Core Principle

Liquid Glass is not a content style.

Liquid Glass is a functional chrome material. Use it for navigation, controls, status, selection, and contextual operation surfaces that must remain readable across changing content.

Primary content keeps its own visual language. Motion work, photography, journal writing, product pages, and brand expression should not become glass just because the material exists.

## Use Liquid Glass For

- Global navigation
- Mobile navigation panel
- Floating control bars
- Experiment controls
- Scene / mode / view switchers
- Audio / film / HUD controls
- Status badges tied to controls
- Contextual toolbars
- Modal action areas
- Small persistent UI that floats above changing visuals

## Do Not Use Liquid Glass For

- Hero visuals
- Main artwork
- Photography images
- Portfolio work cards
- Journal article body
- Large content panels
- General content cards
- Decorative sections
- Brand / marketing hero expression
- Anything whose purpose is storytelling or visual authorship

## Decision Test

Use Liquid Glass only if all are true:

1. The surface is interactive or operational.
2. The surface floats above changing content.
3. The surface must remain readable across different backgrounds.
4. The material helps the user understand or control the interface.
5. The page would still make sense if the glass effect were visually quieter.

Do not use Liquid Glass if any are true:

1. The surface is the main content.
2. The effect is being used only to make the page look premium.
3. The glass competes with images, typography, or motion work.
4. The surface becomes a decorative card.
5. The implementation reduces readability.

## Visual Rules

- Keep Liquid Glass sparse.
- Prefer edge response over filled color.
- Prefer local specular highlights over full-surface glow.
- Prefer subtle chromatic edge dispersion over rainbow fills.
- Preserve crisp DOM text above the glass.
- Never let HUD/debug text bleed behind nav.
- Never create smeared horizontal color bands.
- Never use glass to hide layout conflicts.

## Portfolio Route Guidance

- `/`: Global nav only.
- `/experiments`: Global nav + experiment controls only. Avoid glass on work rows unless the row element is explicitly a control.
- `/experiments/dot`: Global nav + motion HUD/control surfaces.
- `/experiments/grid`: Global nav + motion HUD/control surfaces.
- `/experiments/flow`: Global nav + motion HUD/control surfaces.
- `/journal`: Global nav only.
- `/contact`: Global nav only; form fields stay page-native unless a specific control group needs chrome.
- `/photography`: Global nav only. Photography remains the visual material.
- `/filmtone/privacy`: Global nav only. Legal content stays plain and readable.

## Implementation Rule

Liquid Glass must be implemented as WebGPU-owned functional chrome.

Do not use:

- CSS-only glassmorphism
- Broad `backdrop-filter` surfaces
- WebGL fallback
- DOM capture
- Content-wide glass cards

The glass layer may use WebGPU-owned substrate, procedural fields, route accents, pointer state, scroll state, and measured control bounds.

## Acceptance Rule

A Liquid Glass surface is accepted only when:

- It improves operation/readability.
- It does not become the main visual subject.
- It remains visually quiet at rest.
- It reacts with clear optical behavior on interaction.
- It passes route-specific readability checks.
